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


def enroll_voice(event, context):
		
	path_to_file = event['name']
	client = storage.Client.from_service_account_json('service_account.json')
	bucket = client.get_bucket('minutizer_enrollments')
	blob = bucket.get_blob(path_to_file)
	bloburl = blob.generate_signed_url(expiration=datetime.timedelta(minutes=10))

	path_to_file_parts = path_to_file.split('/')[-1].split('_')
	userID = path_to_file_parts[0]
	timestamp = path_to_file_parts[1]
	try:
		with db.connect() as conn:
			conn.execute("INSERT INTO VoiceEnrollment (userEmail, timestamp)" " VALUES (%s, %s)", (userID, timestamp))
	except Exception as e:
		logger.exception(e)
		# TODO email user
		return

	
	url = "https://proxy.api.deepaffects.com/audio/generic/api/v2/sync/diarization/enroll"
	

	querystring = {"apikey": "{}".format(os.environ['API_KEY'])}

	payload = {
	"languageCode": 'en-US',
	"sampleRate": 8000}
	
	blob_bytes = blob.download_as_string(client)
	payload["content"] = base64.b64encode(blob_bytes).decode('utf-8')
	headers = {
		'Content-Type': "application/json"
		}


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
		raise AttributeError("Wrong FileType: {}".format(encoding))

	payload["encoding"] = enc

	deepaffectsID = path_to_file.split('/')[-1].split('@')[0]
	payload["speakerId"] = deepaffectsID

	response = requests.post(url, json=payload, headers=headers, params=querystring)
	
	if 'message' not in response.json():
		logger.exception("Deepaffects voice registration failure: {}".format(response.text))
		# TODO email user
		return
	else:
		stmt = sqlalchemy.text("UPDATE VoiceEnrollment SET voiceEnrollmentStatus=:newStatus WHERE userEmail=:userID")
		try:
			#stmt = sqlalchemy.text("UPDATE VoiceEnrollment SET enrollmentCount=:newCount WHERE userEmail=:userID")
			with db.connect() as conn:
				conn.execute(stmt, newStatus=1, userID=userID)
		except Exception as e:
			logger.exception(e)
			# TODO email user
			return

	# TODO email user
	return


def query_enrollments(request):
	url = "https://proxy.api.deepaffects.com/audio/generic/api/v1/sync/diarization/get_enrolled_speakers"
	
	querystring = {"apikey": "{}".format(os.environ['API_KEY'])}

	response = requests.get(url, params=querystring)
	print(response.text)
	return response.text
