import firebase_admin
from firebase_admin import auth
from flask import escape, Response
import json
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

default_app = firebase_admin.initialize_app()
logger = logging.getLogger()

def get_enrollment_status_http(request):
    headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*'}

    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    if not request.method == "GET":
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
    
    try:
        with db.connect() as conn:
            row = conn.execute("SELECT status FROM VoiceEnrollment WHERE userEmail = %s AND timestamp = (SELECT MAX(timestamp) FROM VoiceEnrollment WHERE userEmail = %s)", user_email).fetchone()
        if not row:
            return Response(status=200, response=json.dumps({ "enrolled": "Not Enrolled" }), headers=headers)
        else:
            return Response(status=200, response=json.dumps({ "status": row[0] }), headers=headers)
    except Exception as e:
        logger.exception(e)
        return Response(status=500, response="Error: Internal Server Error.", headers=headers)