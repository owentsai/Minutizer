import firebase_admin
from firebase_admin import auth
from google.cloud import storage
from flask import escape, Response
from datetime import datetime, timedelta
import sqlalchemy
import os
import sys
import logging

logger = logging.getLogger()
db = sqlalchemy.create_engine(
    sqlalchemy.engine.url.URL(
        drivername="mysql+pymysql",
        username=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASS"),
        database=os.environ.get("DB_NAME"),
        query={"unix_socket": "/cloudsql/{}".format(os.environ.get("CLOUD_SQL_CONNECTION_NAME"))},
    )
)

default_app = firebase_admin.initialize_app()
logger = logging.getLogger()

def save_audio_metadata_http(request):
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
    if request_json and 'contentType' in request_json:
        content_type = request_json['contentType']

        meeting_name = None
        meeting_date = None
        start_time = None
        end_time = None
        if 'meetingName' in request_json:
            meeting_name = request_json['meetingName']
        if 'meetingDate' in request_json:
            meeting_date = request_json['meetingDate']
        if 'startTime' in request_json:
            start_time = request_json['startTime']
        if 'endTime' in request_json:
            end_time = request_json['endTime']

        stmt = sqlalchemy.text("INSERT INTO Meeting (meetingName, organizerEmail, startTime, endTime, meetingDate)" " VALUES (:meetingName, :organizerEmail, :startTime, :endTime, :meetingDate)")
        try:
            with db.connect() as conn:
                conn.execute(stmt, meetingName=meeting_name, organizerEmail=user_email, startTime=start_time, endTime=end_time, meetingDate=meeting_date)
        except Exception as e:
            logger.exception(e)
            return Response(status=500, response="Error: Meeting information could not be saved.", headers=headers)

        try:
            with db.connect() as conn:
                row = conn.execute("SELECT MAX(meetingId) FROM Meeting").fetchone()
                meeting_id = row[0]
        except Exception as e:
            logger.exception(e)
            return Response(status=500, response="Error: Meeting information could not be retrieved.", headers=headers)
        
        if 'attendees' in request_json:
            attendees = request_json['attendees']
            values = []
            for attendee in attendees:
                values.append((meeting_id, attendee['email']))
            try:
                with db.connect() as conn:
                    conn.execute("INSERT INTO Attendance (meetingId, userEmail) VALUES (%s, %s)", values)          
            except Exception as e:
                logger.exception(e)
                return Response(status=500, response="Error: Attendees could not be saved.", headers=headers)

        storage_client = storage.Client.from_service_account_json('service_account.json')
        file = storage_client.bucket('minutizer_recordings').blob(user_email + '/' + str(meeting_id))
        expires_at_ms = datetime.now() + timedelta(seconds=300)
        url = file.generate_signed_url(expires_at_ms, method="PUT", content_type=content_type, version='v4')

        return Response(status=201, response=url, headers=headers)
    else:
        return Response(status=500, response="Error: Missing required fields.", headers=headers)
        
