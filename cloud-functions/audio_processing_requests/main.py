import firebase_admin
from firebase_admin import auth
from flask import escape, Response
import json
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

default_app = firebase_admin.initialize_app()
logger = logging.getLogger()

def get_audio_processing_requests_http(request):
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
        request_args = request.args
        page = 0
        stmt = ""
        totalstmt = ""
        transcriptions = []
        user_type = ""
    
        with db.connect() as conn:
            row = conn.execute("SELECT userType FROM User WHERE email = %s", (user_email)).fetchone()
            user_type = row[0]

        if request_args:
            page = int('page' in request_args and request_args['page']) * 20
            completed_bool = bool('completedProcessing' in request_args and request_args['completedProcessing'])
            inProgress_bool = bool('inProgressProcessing' in request_args and request_args['inProgressProcessing'])
            if user_type == 'regular':
                # case 1: only completed query param is passed in as true
                if completed_bool and not inProgress_bool:
                    stmt = sqlalchemy.text("SELECT meetingId, meetingName, meetingDate, organizerEmail FROM AudioProcessingRequest NATURAL JOIN Meeting WHERE processingStatus='SUCCESS' AND (organizerEmail = :userEmail OR uploaderEmail = :userEmail) ORDER BY meetingId DESC LIMIT 20 OFFSET :offset")
                    totalstmt = sqlalchemy.text("SELECT COUNT(*) FROM AudioProcessingRequest NATURAL JOIN Meeting WHERE processingStatus='SUCCESS' AND (organizerEmail = :userEmail OR uploaderEmail = :userEmail)")
                # case 2: only in progress query param is passed in as true
                elif inProgress_bool and not completed_bool:
                    stmt = sqlalchemy.text("SELECT meetingId, meetingName, meetingDate, organizerEmail FROM AudioProcessingRequest NATURAL JOIN Meeting WHERE processingStatus='INPROGRESS' AND (organizerEmail = :userEmail OR uploaderEmail = :userEmail) ORDER BY meetingId DESC LIMIT 20 OFFSET :offset")
                    totalstmt = sqlalchemy.text("SELECT COUNT(*) FROM AudioProcessingRequest NATURAL JOIN Meeting WHERE processingStatus='INPROGRESS' AND (organizerEmail = :userEmail OR uploaderEmail = :userEmail)")
                # case 3: any other combination results in an error
                else:
                    return Response(response="Error: Invalid query parameters.", status=500, headers=headers)
                
                with db.connect() as conn:
                    rows = conn.execute(stmt, userEmail=user_email, offset=page).fetchall()
                    for row in rows:
                        date = row[2].strftime("%Y-%m-%d") if row[2] else None
                        transcriptions.append({ 'meetingId': row[0], 'meetingName': row[1], 'meetingDate': date, 'organizerEmail': row[3] })
                with db.connect() as conn:
                    row = conn.execute(totalstmt, userEmail=user_email).fetchone()
                    total = row[0]
            else:
                query_conditions = ''
                query_parameters = []
                if request_args.get('organizerEmail'):
                    query_conditions += 'AND organizerEmail=%s'
                    query_parameters.append(request_args['organizerEmail'])
                if request_args.get('meetingName'):
                    query_conditions += 'AND meetingName LIKE %s'
                    query_parameters.append("%{}%".format(request_args['meetingName']))
                if request_args.get('meetingDate'):
                    query_conditions += 'AND meetingDate=%s'
                    query_parameters.append(request_args['meetingDate'])
                if request_args.get('startTime'):
                    query_conditions += 'AND startTime<=%s'
                    query_parameters.append(request_args['startTime'])
                if request_args.get('endTime'):
                    query_conditions += 'AND endTime>=%s'
                    query_parameters.append(request_args['endTime'])
                # case 1: only completed query param is passed in as true
                if completed_bool and not inProgress_bool:
                    stmt = "SELECT meetingId, meetingName, meetingDate, organizerEmail FROM AudioProcessingRequest NATURAL JOIN Meeting WHERE processingStatus='SUCCESS' " + query_conditions + " ORDER BY meetingId DESC LIMIT 20 OFFSET %s"
                    totalstmt = "SELECT COUNT(*) FROM AudioProcessingRequest NATURAL JOIN Meeting WHERE processingStatus='SUCCESS' " + query_conditions
                # case 2: only in progress query param is passed in as true
                elif inProgress_bool and not completed_bool:
                    stmt = "SELECT meetingId, meetingName, meetingDate, organizerEmail FROM AudioProcessingRequest NATURAL JOIN Meeting WHERE processingStatus='INPROGRESS' " + query_conditions + " ORDER BY meetingId DESC LIMIT 20 OFFSET %s"
                    totalstmt = "SELECT COUNT(*) FROM AudioProcessingRequest NATURAL JOIN Meeting WHERE processingStatus='INPROGRESS' " + query_conditions
                # case 3: any other combination results in an error
                else:
                    return Response(response="Error: Invalid query parameters.", status=500, headers=headers)
                
                with db.connect() as conn:
                    rows = conn.execute(stmt, query_parameters + [page]).fetchall()
                    for row in rows:
                        date = row[2].strftime("%Y-%m-%d") if row[2] else None
                        transcriptions.append({ 'meetingId': row[0], 'meetingName': row[1], 'meetingDate': date, 'organizerEmail': row[3] })
                with db.connect() as conn:
                    row = conn.execute(totalstmt, query_parameters).fetchone()
                    total = row[0]
        else:
            if user_type == 'regular':
                stmt = sqlalchemy.text("SELECT meetingId, meetingName, meetingDate, organizerEmail FROM Meeting WHERE organizerEmail = :userEmail ORDER BY meetingId LIMIT 20 OFFSET :offset")
                totalstmt = sqlalchemy.text("SELECT COUNT(*) FROM Meeting WHERE organizerEmail = :userEmail")
                
                with db.connect() as conn:
                    rows = conn.execute(stmt, userEmail=user_email, offset=page).fetchall()
                    for row in rows:
                        date = row[2].strftime("%Y-%m-%d") if row[2] else None
                        transcriptions.append({ 'meetingId': row[0], 'meetingName': row[1], 'meetingDate': date, 'organizerEmail': row[3] })
                with db.connect() as conn:
                    row = conn.execute(totalstmt, userEmail=user_email).fetchone()
                    total = row[0]
            else:
                stmt = sqlalchemy.text("SELECT meetingId, meetingName, meetingDate, organizerEmail FROM Meeting ORDER BY meetingId LIMIT 20 OFFSET :offset")
                totalstmt = sqlalchemy.text("SELECT COUNT(*) FROM Meeting")
                
                with db.connect() as conn:
                    rows = conn.execute(stmt, offset=page).fetchall()
                    for row in rows:
                        date = row[2].strftime("%Y-%m-%d") if row[2] else None
                        transcriptions.append({ 'meetingId': row[0], 'meetingName': row[1], 'meetingDate': date, 'organizerEmail': row[3] })
                with db.connect() as conn:
                    row = conn.execute(totalstmt).fetchone()
                    total = row[0]

        return Response(response=json.dumps({ "total": total, "data": transcriptions }), status=200, headers=headers)

    except Exception as e:
          logger.exception(e)
          return Response(response="Error: Internal Server Error.", status=500, headers=headers)
    
