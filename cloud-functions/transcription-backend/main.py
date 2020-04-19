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
logger = logging.getLogger()



def wrap_transcription(event, context):
	path_to_file = event['name']
	client = storage.Client.from_service_account_json('service_account.json')
	bucket = client.get_bucket('minutizer_recordings')
	blob = bucket.get_blob(path_to_file)
	bloburl = blob.generate_signed_url(expiration=datetime.timedelta(minutes=10))

	metadata = blob.metadata
	uploader_email = metadata.get('uploader')
	organizer_email = metadata.get('organizer')
	meeting_name = metadata.get('meetingName')
	meeting_date = metadata.get('meetingDate')
	start_time = metadata.get('startTime')
	end_time = metadata.get('endTime')
	stmt = sqlalchemy.text("INSERT INTO Meeting (meetingName, organizerEmail, uploaderEmail, startTime, endTime, meetingDate)" " VALUES (:meetingName, :organizerEmail, :startTime, :endTime, :meetingDate)")
	try:
		with db.connect() as conn:
			conn.execute(stmt, meetingName=meeting_name, organizerEmail=organizer_email, uploaderEmail=uploader_email, startTime=start_time, endTime=end_time, meetingDate=meeting_date)
		with db.connect() as conn:
			row = conn.execute("SELECT MAX(meetingId) FROM Meeting WHERE organizerEmail = %s", (organizer_email)).fetchone()
			meetingID = row[0]
	except Exception as e:
		logger.exception(e)
		# TODO email user
		return
	
	url = "https://proxy.api.deepaffects.com/audio/generic/api/v1/async/analytics/interaction"
	

	querystring = {"apikey": "{}".format(os.environ['API_KEY']),
			   "webhook": "https://us-central1-hacksbc-268409.cloudfunctions.net/transcription_webhook"}

	payload = {
	"languageCode": 'en-US',
	"sampleRate": 8000,
	"metrics": ['all']}
	
	payload["url"] = bloburl
	headers = {
		'Content-Type': "application/json"
		}


	encoding = blob.content_type
	if encoding == 'audio/mp3':
		enc = "MP3"
	elif encoding == 'audio/wav':
		enc = "WAV"
	elif encoding == 'audio/mp4':
		enc = "MP4"
	elif encoding == 'audio/flac':
		enc = "FLAC"
	else:
		logger.exception("Wrong FileType: {}".format(encoding))
		# TODO email user
		return

	payload["encoding"] = enc
	
	try:
		
		stmt = sqlalchemy.text("SELECT userEmail FROM VoiceEnrollment WHERE userEmail IN (SELECT userEmail FROM Attendance WHERE meetingId={}) AND voiceEnrollmentStatus=1".format(meetingID))

		with db.connect() as conn:
			enrollment_ids = conn.execute(stmt).fetchall()
	except:
		enrollment_ids = []

	enrollment_ids = [i[0].split('@')[0] for i in enrollment_ids]
	
	payload["speakerIds"] = enrollment_ids
	print(enrollment_ids)
	#payload["speakerIds"] = []
	response = requests.post(url, json=payload, headers=headers, params=querystring)
	
	stmt1 = sqlalchemy.text('INSERT INTO TranscriptionRequest (meetingId, requestId) VALUES (:meetingID, :transcriptionID)')
	stmt2 = sqlalchemy.text('UPDATE TranscriptionRequest SET requestId=:transcriptionID WHERE meetingId=:meetingID')
	
	try:
		with db.connect() as conn:
			test_statement = sqlalchemy.text('SELECT requestId FROM TranscriptionRequest WHERE EXISTS (SELECT requestId FROM TranscriptionRequest WHERE meetingId=:meeting_id)')
			case = conn.execute(test_statement, meeting_id=meetingID)
			if case.fetchone():
				conn.execute(stmt2, meetingID=meetingID, transcriptionID=response.json()["request_id"])	
			else:
				conn.execute(stmt1, meetingID=meetingID, transcriptionID=response.json()["request_id"])
	except Exception as e:	
		logger.exception(e)
		# TODO email user
		return
		
	# TODO email user
	return




def transcription_webhook(request):
	""" HTTP Cloud Function
	Args: 
		request (flask.Request) is a json request object
		posted by deepaffects as the transcription result
	"""
	try:
		request_json = request.get_json(silent=True)
		request_args = request.args
	
		request_id = request_json["request_id"]
		request_response = request_json["response"]
		#transcript = request_response["transcript"]
	except:
		raise AttributeError("Missing Data in the JSON object")


	stmt = sqlalchemy.text('SELECT meetingId FROM TranscriptionRequest WHERE requestId=:reqID')
	try:
		with db.connect() as conn:
			meetingID = conn.execute(stmt, reqID=request_id).fetchone()[0]
	except:
		meetingID = request_id


	transcript_filename = '{}/{}.txt'.format('transcripts', meetingID)
	client = storage.Client()
	bucket = client.get_bucket('minutizer_transcriptions')
	blob = bucket.blob(transcript_filename)
	print(request_response)	
	segments = request_response['segments']
	diarized_transcript = ""
	
	for phrase in segments:
		diarized_transcript += "Speaker_{}: {} \n".format(phrase['speaker_id'], phrase['text'])

	blob.upload_from_string(diarized_transcript)

	stmt = sqlalchemy.text('UPDATE TranscriptionRequest SET processingCompleted=:transcription_status WHERE requestId=:reqID')
	try:
		with db.connect() as conn:
			conn.execute(stmt, transcription_status=True, reqID=request_id)
	except:
		raise RuntimeError("Error updating Transcription Status")
	return request_id
