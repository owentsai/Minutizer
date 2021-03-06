from flask import escape, Response
import base64
import requests
import google.cloud.storage as storage
import base64
#import deepaffects
import datetime
import sqlalchemy
import os
import sys
import logging

db = sqlalchemy.create_engine(
	sqlalchemy.engine.url.URL(
		drivername="mysql+pymysql",
		username=os.environ.get("DB_USER"),
		password=os.environ.get("DB_PASS"),
		database=os.environ.get("DB_NAME"),
		query={"unix_socket": "/cloudsql/{}".format(os.environ.get("CLOUD_SQL_CONNECTION_NAME"))},
	)
)
send_email_http_url = os.environ.get('SEND_EMAIL_HTTP_URL')
webhook_http_url = os.environ.get('WEBHOOK_HTTP_URL')
logger = logging.getLogger()


def wrap_transcription(event, context):
	headers = {'Content-Type': "application/json"}
	path_to_file = event['name']
	client = storage.Client.from_service_account_json('service_account.json')
	bucket = client.get_bucket('minutizer_recordings')
	blob = bucket.get_blob(path_to_file)
	bloburl = blob.generate_signed_url(expiration=datetime.timedelta(minutes=10))

	uploader_email = path_to_file.split('/')[0]
	try:
		with db.connect() as conn:
			row = conn.execute("SELECT meetingId, meetingName FROM Meeting WHERE meetingId=(SELECT MAX(meetingId) FROM Meeting WHERE uploaderEmail = %s)", (uploader_email)).fetchone()
			meetingID = row[0]
			meeting_name = row[1]
	except Exception as e:
		logger.exception(e)
		raise RuntimeError("Could not retrieve meeting data.")
	
	
	url = "https://proxy.api.deepaffects.com/audio/generic/api/v1/async/analytics/interaction"
	
	querystring = {"apikey": "{}".format(os.environ['API_KEY']), "webhook": webhook_http_url}

	payload = {"languageCode": 'en-US', "sampleRate": 8000, "metrics": ['all']}
	payload["url"] = bloburl

	encoding = blob.content_type
	if encoding == 'audio/mp3':
		enc = "MP3"
	elif encoding == 'audio/mpeg':
		enc = "MP3"
	elif encoding == 'audio/wav':
		enc = "WAV"
	elif encoding == 'audio/mp4':
		enc = "MP4"
	elif encoding == 'audio/flac':
		enc = "FLAC"
	else:
		logger.exception("Wrong FileType: {}".format(encoding))
		requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": uploader_email, "subject": "Processing of your audio file was unsuccessful!",
                                    "text_body": "Unforunately, processing of your audio file for meeting:" + meeting_name + " was unsuccessful. Please try again." })
		return 0
	payload["encoding"] = enc

	try:
		stmt = sqlalchemy.text("SELECT DISTINCT userEmail FROM VoiceEnrollment WHERE userEmail IN (SELECT userEmail FROM Attendance WHERE meetingId={}) AND voiceEnrollmentStatus='SUCCESS".format(meetingID))
		with db.connect() as conn:
			enrollment_ids = conn.execute(stmt).fetchall()
	except:
		enrollment_ids = []

	enrollment_ids = [i[0].split('@')[0] for i in enrollment_ids]
	
	payload["speakerIds"] = enrollment_ids
	response = requests.post(url, json=payload, headers=headers, params=querystring)
	
	stmt1 = sqlalchemy.text('INSERT INTO AudioProcessingRequest (meetingId, requestId, processingStatus) VALUES (:meetingID, :transcriptionID, :status)')
	stmt2 = sqlalchemy.text('UPDATE AudioProcessingRequest SET requestId=:transcriptionID, processingStatus=:status WHERE meetingId=:meetingID')
	
	try:
		with db.connect() as conn:
			test_statement = sqlalchemy.text('SELECT requestId FROM AudioProcessingRequest WHERE EXISTS (SELECT requestId FROM AudioProcessingRequest WHERE meetingId=:meeting_id)')
			case = conn.execute(test_statement, meeting_id=meetingID)
			if case.fetchone():
				conn.execute(stmt2, meetingID=meetingID, transcriptionID=response.json()["request_id"], status='INPROGRESS')	
			else:
				conn.execute(stmt1, meetingID=meetingID, transcriptionID=response.json()["request_id"], status='INPROGRESS')
	except Exception as e:	
		logger.exception(e)
		requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": uploader_email, "subject": "Processing of your audio file was unsuccessful!",
                                    "text_body": "Unforunately, processing of your audio file for meeting:" + meeting_name + " was unsuccessful. Please try again." })
		return 0
	return 0



def transcription_webhook(request):
	""" HTTP Cloud Function
	Args: 
		request (flask.Request) is a json request object
		posted by deepaffects as the transcription result
	"""
	headers = {'Content-Type': "application/json"}
	meeting_name = ""
	try:
		request_json = request.get_json(silent=True)
		request_id = request_json["request_id"]
		request_response = request_json["response"]
	except:
		raise AttributeError("Missing Data in the JSON object")

	try:
		with db.connect() as conn:
			meetingID = conn.execute('SELECT meetingId FROM AudioProcessingRequest WHERE requestId=%s', (request_id)).fetchone()[0]
			
			row = conn.execute("SELECT meetingName, uploaderEmail FROM Meeting WHERE meetingId={}".format(meetingID)).fetchone() 
			meeting_name = row[0]
			uploader_email = row[1]
			
	except Exception as e:
		logger.exception(e)
		raise RuntimeError("Could not retrieve meeting data.")

	if not request_response.get('segments'):
		logger.exception("Missing JSON data in response.")
		error = request_response['fault']['fault_string']
		try:
			with db.connect() as conn:
				conn.execute("UPDATE AudioProcessingRequest SET processingStatus='FAILURE', errorString=%s WHERE requestId=%s", (error, request_id))
		except Exception as e:
			logger.exception(e)
		requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": uploader_email, "subject": "Processing of your audio file was unsuccessful!",
                                    "text_body": "Unforunately, processing of your audio file for meeting:" + meeting_name + " was unsuccessful. Please try again." })
		return 0


	transcript_filename = '{}/{}.txt'.format('transcripts', meetingID)
	client = storage.Client()
	bucket = client.get_bucket('minutizer_transcriptions')
	blob = bucket.blob(transcript_filename)
	
	segments = request_response['segments']
	diarized_transcript = ""
	
	for phrase in segments:
		diarized_transcript += "Speaker_{}: {} \n".format(phrase['speaker_id'], phrase['text'])

	blob.upload_from_string(diarized_transcript)

	try:
		with db.connect() as conn:
			conn.execute("UPDATE AudioProcessingRequest SET processingStatus='SUCCESS' WHERE requestId=%s", (request_id))
	except Exception as e:
		logger.exception(e)
		requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": uploader_email, "subject": "Processing of your audio file was unsuccessful!",
                                    "text_body": "Unforunately, processing of your audio file for meeting:" + meeting_name + " was unsuccessful. Please try again." })
		return 0
		
	requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": uploader_email, "subject": "Processing of your audio file has been completed!",
                                    "text_body": "Procesisng of your audio file for meeting:" + meeting_name + "has been completed! You may now request minutes for this meeting." })

	return 0
