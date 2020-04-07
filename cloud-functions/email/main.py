from mailjet_rest import Client
import firebase_admin
from firebase_admin import auth
from google.cloud import storage
from flask import escape, Response
import base64
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

def email_http(request):
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
    
    if not request.method == 'POST':
        return Response(status=500, response="Error: Invalid Request Method.", headers=headers)

    request_json = request.get_json(silent=True)
    if request_json and 'meetingId' in request_json:
        meeting_id = request_json['meetingId']
        try:
            with db.connect() as conn:
                row = conn.execute("SELECT * FROM Meeting WHERE meetingId = %s", (meeting_id)).fetchone()
                date = "N/A"
                if row[5]:
                    date = row[5].strftime("%Y-%m-%d")
                meeting_name = row[1]
                if "." in meeting_name:
                    meeting_name = meeting_name.split(".")[0]
                meeting = { 
                    'meeting_id': row[0],
                    'meeting_name': meeting_name,
                    'organizer_email': row[2],
                    'start_time': row[3],
                    'end_time': row[4],
                    'meeting_date': date
                }
            attendees = []
            with db.connect() as conn:
                rows = conn.execute("SELECT userEmail FROM Attendance WHERE meetingId = %s", (meeting_id)).fetchall()
                for row in rows:
                    attendees.append(row[0])
            attendees_html = "<li>Attendees: " + ", ".join(attendees) + "</li>"
        except Exception as e:
            logger.exception(e)
            return Response(response="Error: Internal Server Error.", status=500, headers=headers)
        meeting_info_html = "<ul>Meeting Information:" + attendees_html + "<li>Meeting Date: " + meeting['meeting_date'] + "</li><li>Meeting Time: " + str(meeting['start_time']) + " - " + str(meeting['end_time']) + "</li></ul>"
        print(meeting_info_html)

        storage_client = storage.Client.from_service_account_json('service_account.json')
        bucket = storage_client.bucket("minutizer_transcriptions")
        blob = bucket.blob('transcripts/{}.txt'.format(meeting_id))
        transcript = str(base64.b64encode(blob.download_as_string()), "utf-8")

        actions_blob = bucket.blob('action_transcripts/{}_actions.txt'.format(meeting_id))
        actions_str = actions_blob.download_as_string().decode('utf-8')
        action_items = actions_str.split('\n')
        action_items_html = ""
        for item in action_items:
            action_items_html += "<li>" + item + "</li>"
        action_items_html = "<ul>Action Items:" + action_items_html + "</ul>"
        print(action_items_html)

        data = {
            'Messages': [
                {
                    "From": {
                        "Email": "hacksbc319@gmail.com",
                        "Name": "Minutizer"
                    },
                    "To": [
                        {
                            "Email": user_email,
                            "Name": user_email
                        }
                    ],
                    "Subject": "Your Meeting Minutes are ready!",
                    "HTMLPart": meeting_info_html + action_items_html + "<div>Your meeting transcript is attached.</div>",
                    "Attachments": [
                        {
                            "ContentType": "text/plain",
                            "FileName": meeting['meeting_name'],
                            "Base64Content": transcript
                        }
                    ]
                }
            ]
        }
        api_key = os.environ.get('API_KEY')
        api_secret = os.environ.get('SECRET_KEY')
        mailjet = Client(auth=(api_key, api_secret), version='v3.1')
        result = mailjet.send.create(data=data)
        response = result.json()["Messages"][0]["Status"]
        if response == 'error':
            return Response(status=500, response=response, headers=headers)
        else:
            return Response(status=201, response="Request was successful.", headers=headers)
    else:
        return Response(status=500, response="Error: Missing required fields.", headers=headers)
        
        