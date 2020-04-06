import firebase_admin
from firebase_admin import auth
from google.cloud import storage
from flask import escape, Response
from datetime import datetime, timedelta
import os
import sys
import sqlalchemy
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

default_app = firebase_admin.initialize_app()
logger = logging.getLogger()

def enrol_voice_begin_http(request):
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
    try:
        with db.connect() as conn:
            row = conn.execute("SELECT * FROM VoiceEnrollment WHERE userEmail = %s", user_email).fetchone()
        if not row:
            enrollmentCount = 1
            with db.connect() as conn:
                row = conn.execute("INSERT INTO VoiceEnrollment (userEmail, enrollmentCount)" " VALUES (%s, %s)", (user_email, enrollmentCount))
        else:
            enrollmentCount = row[1] + 1
            with db.connect() as conn:
                row = conn.execute("UPDATE VoiceEnrollment SET enrollmentCount=%s WHERE userEmail=%s", (enrollmentCount, user_email))
    except Exception as e:
        logger.exception(e)
        return Response(status=500, response="Error: Voice enrollment could not be initiated.", headers=headers)
    
    storage_client = storage.Client.from_service_account_json('service_account.json')
    file = storage_client.bucket('minutizer_enrollments').blob(user_email + '/' + str(enrollmentCount))
    expires_at_ms = datetime.now() + timedelta(seconds=300)
    url = file.generate_signed_url(expires_at_ms, method="PUT", content_type=content_type, version='v4')

    return Response(status=201, response=url, headers=headers)

        
