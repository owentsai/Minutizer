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

def attendees_http(request):
    headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization'}

    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Headers': 'Authorization',
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
    
    users = []
    page = 0
    searchTerm = ""
    request_args = request.args
    if request_args:
        page = int('page' in request_args and request_args['page']) * 10
        searchTerm = 'search' in request_args and request_args['search']
    
    try:
        if not searchTerm == "":
            with db.connect() as conn:
                rows = conn.execute("SELECT email FROM User WHERE email LIKE %s ORDER BY email LIMIT 20 OFFSET %s", ("%{}%".format(searchTerm), page)).fetchall()
                for row in rows:
                    users.append({'email': row[0]})
            with db.connect() as conn:
                row = conn.execute("SELECT COUNT(*) FROM User WHERE email LIKE %s", ("%{}%".format(searchTerm))).fetchone()
                total = row[0]
        else: 
            with db.connect() as conn:
                rows = conn.execute("SELECT email FROM User ORDER BY email LIMIT 20 OFFSET %s", (page)).fetchall()
                for row in rows:
                    users.append({'email': row[0]})
            with db.connect() as conn:
                row = conn.execute("SELECT COUNT(*) FROM User").fetchone()
                total = row[0]
                
        return Response(response=json.dumps({ "total": total, "data": users }), status=200, headers=headers)
    except Exception as e:
        logger.exception(e)
        return Response(response="Error: Internal Server Error.", status=500, headers=headers)