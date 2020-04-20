import firebase_admin
from firebase_admin import auth
from google.cloud import storage
from flask import escape, Response
from datetime import datetime, timedelta
import sqlalchemy
import requests
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
default_app = firebase_admin.initialize_app()
logger = logging.getLogger()

def get_signed_url_for_enrolment_http(request):
    # CORS setup
    headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*'}

    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    if not request.method == "POST":
        return Response(response="Error: Invalid Method.", status=500, headers=headers)

    # auth
    if not request.headers or not 'Authorization' in request.headers:
        return Response(response="Error: Missing Authorization.", status=401, headers=headers)
    
    auth_header = request.headers['Authorization'].split()
    if not auth_header[0] == 'Bearer':
        return Response(response="Error: Invalid Authorization Token Type.", status=401, headers=headers)

    try:
        decoded_token = auth.verify_id_token(auth_header[1])
        user_email = decoded_token['email']
    except auth.InvalidIdTokenError as e:
        logger.exception(e)
        return Response(response="Error: Invalid Access.", status=401, headers=headers)

    request_json = request.get_json(silent=True)
    if not request_json or not 'contentType' in request_json:
        return Response(status=500, response="Error: Missing required fields.", headers=headers)
    
    content_type = request_json['contentType']
    
    storage_client = storage.Client.from_service_account_json('service_account.json')

    bucket_name = os.environ.get("ENROLMENT_BUCKET_NAME")
    object_name = user_email + '/' + datetime.now().strftime('%Y%m%dT%H%M%SZ')
    file = storage_client.bucket(bucket_name).blob(object_name)
    
    expires_at_ms = datetime.now() + timedelta(seconds=300)

    url = file.generate_signed_url(expires_at_ms, method="PUT", content_type=content_type, version='v4')
    
    return Response(status=201, response=url, headers=headers)


def get_signed_url_for_recording_http(request):
    # CORS setup
    headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*'}

    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    if not request.method == 'POST':
        return Response(status=500, response="Error: Invalid Request Method.", headers=headers)

    # auth
    if not request.headers or not 'Authorization' in request.headers:
        return Response(response="Error: Missing Authorization.", status=401, headers=headers)
    
    auth_header = request.headers['Authorization'].split()
    if not auth_header[0] == 'Bearer':
        return Response(response="Error: Invalid Authorization Token Type.", status=401, headers=headers)

    try:
        decoded_token = auth.verify_id_token(auth_header[1])
        user_email = decoded_token['email']
    except auth.InvalidIdTokenError as e:
        logger.exception(e)
        return Response(response="Error: Invalid Access.", status=401, headers=headers)

    request_json = request.get_json(silent=True)
    if not request_json and not 'contentType' in request_json:
        return Response(status=500, response="Error: Missing required fields.", headers=headers)
    
    content_type = request_json['contentType']
    
    uploader_email = user_email
    organizer_email = None
    meeting_name = None
    meeting_date = None
    start_time = None
    end_time = None
    attendees = []
    if request_json.get('organizer'):
        organizer_email = request_json['organizer']
    if request_json.get('meetingName'):
        meeting_name = request_json['meetingName']
    if request_json.get('meetingDate'):
        meeting_date = request_json['meetingDate']
    if request_json.get('startTime'):
        start_time = request_json['startTime']
    if request_json.get('endTime'):
        end_time = request_json['endTime']
    if request_json.get('attendees'):
        attendees = request_json['attendees']

    stmt = sqlalchemy.text("INSERT INTO Meeting (meetingName, organizerEmail, uploaderEmail, startTime, endTime, meetingDate)" " VALUES (:meetingName, :organizerEmail, :uploaderEmail, :startTime, :endTime, :meetingDate)")
    try:
        with db.connect() as conn:
            conn.execute(stmt, meetingName=meeting_name, organizerEmail=organizer_email, uploaderEmail=uploader_email, startTime=start_time, endTime=end_time, meetingDate=meeting_date)
        with db.connect() as conn:
            row = conn.execute("SELECT MAX(meetingId) FROM Meeting WHERE uploaderEmail = %s", (uploader_email)).fetchone()
            meetingID = row[0]
        if len(attendees) > 0:
            values = []
            for attendee in attendees:
                values.append((meetingID, attendee['email']))
            with db.connect() as conn:
                conn.execute("INSERT INTO Attendance (meetingId, userEmail) VALUES (%s, %s)", values)   
    except Exception as e:
        logger.exception(e)
        response = requests.post(send_email_http_url, headers=headers,
                            json={ "recipient": uploader_email, "subject": "Processing of your audio file was unsuccessful!",
                                    "text_body": "Unforunately, processing of your audio file for meeting:" + meeting_name + " was unsuccessful. Please try again." })
        return response

    storage_client = storage.Client.from_service_account_json('service_account.json')

    bucket_name = os.environ.get("RECORDING_BUCKET_NAME")
    object_name = user_email + '/' + datetime.now().strftime('%Y%m%dT%H%M%SZ')
    file = storage_client.bucket(bucket_name).blob(object_name)

    expires_at_ms = datetime.now() + timedelta(seconds=300)
    url = file.generate_signed_url(expires_at_ms, method="PUT", content_type=content_type, version='v4')

    return Response(status=201, response=url, headers=headers)