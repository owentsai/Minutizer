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
logger = logging.getLogger()

def enroll_voice(event, context):
	headers = {'Content-Type': "application/json"}
		
	path_to_file = event['name']
	client = storage.Client.from_service_account_json('service_account.json')
	bucket = client.get_bucket('minutizer_enrollments')
	blob = bucket.get_blob(path_to_file)

	path_to_file_parts = path_to_file.split('/')[-1].split('_')
	userID = path_to_file_parts[0]

	timestamp = datetime.datetime.strftime(datetime.datetime.strptime(path_to_file_parts[1], '%Y%m%dT%H%M%SZ'), '%Y-%m-%d %H:%M:%S')
	try:
		with db.connect() as conn:
			conn.execute("INSERT INTO VoiceEnrollment (userEmail, timestamp, voiceEnrollmentStatus)" " VALUES (%s, %s, %s)", (userID, timestamp, 'INPROGRESS'))
	except Exception as e:
		logger.exception(e)
		return requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": userID, "subject": "Your voice enrollment was unsuccessful!",
                                    "text_body": "Unforunately, your voice enrollment was unsuccessful. Please try again." })

	
	url = "https://proxy.api.deepaffects.com/audio/generic/api/v2/sync/diarization/enroll"
	

	querystring = {"apikey": "{}".format(os.environ['API_KEY'])}

	payload = {
	"languageCode": 'en-US',
	"sampleRate": 8000}
	
	blob_bytes = blob.download_as_string(client)
	payload["content"] = base64.b64encode(blob_bytes).decode('utf-8')


	encoding = blob.content_type
	if encoding == 'audio/mp3':
		enc = "MP3"
	elif encoding == 'audio/wav':
		enc = "WAV"
	elif encoding == 'audio/flac':
		enc = "FLAC"
	elif encoding == 'audio/m4a':
		enc = "M4A"
	elif encoding == 'audio/mp4':
		enc = "MP4"
	else:
		logger.exception("Wrong FileType: {}".format(encoding))
		return requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": userID, "subject": "Your voice enrollment was unsuccessful!",
                                    "text_body": "Unforunately, your voice enrollment was unsuccessful. Please try again." })

	payload["encoding"] = enc
	deepaffectsID = path_to_file.split('/')[-1].split('@')[0]
	payload["speakerId"] = deepaffectsID

	response = requests.post(url, json=payload, headers=headers, params=querystring)
	
	if 'message' not in response.json():
		logger.exception("Deepaffects voice registration failure: {}".format(response.text))
		try:
			error = response.json()['fault']['fault_string']
			with db.connect() as conn:
				conn.execute("UPDATE VoiceEnrollment SET voiceEnrollmentStatus='FAILURE', errorString=%s WHERE userEmail=%s", (error, userID))
		except Exception as e:
			logger.exception(e)
		return requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": userID, "subject": "Your voice enrollment was unsuccessful!",
                                    "text_body": "Unforunately, your voice enrollment was unsuccessful. Please try again." })
	else:
		try:
			with db.connect() as conn:
				conn.execute("UPDATE VoiceEnrollment SET voiceEnrollmentStatus='SUCCESS' WHERE userEmail=%s", (userID))
		except Exception as e:
			logger.exception(e)
			return requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": userID, "subject": "Your voice enrollment was unsuccessful!",
                                    "text_body": "Unforunately, your voice enrollment was unsuccessful. Please try again." })

	return requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": userID, "subject": "Your voice enrollment is complete!",
                                    "text_body": "Congratulations! You've successfully completed your voice enrollment. You may now begin to receive meeting minutes from meetings in which your voice has been identified." })


def query_enrollments(request):
	url = "https://proxy.api.deepaffects.com/audio/generic/api/v1/sync/diarization/get_enrolled_speakers"
	
	querystring = {"apikey": "{}".format(os.environ['API_KEY'])}

	response = requests.get(url, params=querystring)
	print(response.text)
	return response.text
