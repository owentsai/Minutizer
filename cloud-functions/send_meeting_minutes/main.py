import firebase_admin
from firebase_admin import auth
from google.cloud import storage
from flask import escape, Response
import requests
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

def send_meeting_minutes_http(request):
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
    if not  request_json and not request_json.get('meetingId'):
        return Response(status=500, response="Error: Missing required fields.", headers=headers)
    
    meeting_id = request_json['meetingId']
    try:
        with db.connect() as conn:
            row = conn.execute("SELECT * FROM Meeting WHERE meetingId = %s", (meeting_id)).fetchone()
            date = "N/A"
            if row[6]:
                date = row[5].strftime("%Y-%m-%d")
            meeting_name = row[1]
            if "." in meeting_name:
                meeting_name = meeting_name.split(".")[0]
            meeting = { 
                'meeting_id': row[0],
                'meeting_name': meeting_name,
                'organizer_email': row[2],
                'uploader_email': row[3],
                'start_time': row[4],
                'end_time': row[5],
                'meeting_date': date
            }
        organizer_html = "<li>Meeting Organizer: " + meeting['organizer_email'] + "</li>"
        date_time_html = "<li>Meeting Date: " + meeting['meeting_date'] + "</li><li>Meeting Time: " + str(meeting['start_time']) + " - " + str(meeting['end_time']) + "</li>"
        
        attendees = []
        if not meeting.get('organizer_email') == user_email:
            attendees.append(meeting['organizer_email'])
        if not meeting.get('uploader_email') == user_email:
            attendees.append(meeting['uploader_email'])

        with db.connect() as conn:
            rows = conn.execute("SELECT userEmail FROM Attendance WHERE meetingId = %s", (meeting_id)).fetchall()
            for row in rows:
                attendees.append(row[0])
        attendees_html = "<li>Attendees: " + ", ".join(attendees) + "</li>"
    except Exception as e:
        logger.exception(e)
        return Response(response="Error: Internal Server Error.", status=500, headers=headers)
    meeting_info_html = "<ul>Meeting Information:" + organizer_html + attendees_html + date_time_html + "</ul>"

    action_items_bucket = os.environ.get('ACTION_ITEMS_BUCKET_NAME')
    storage_client = storage.Client.from_service_account_json('service_account.json')
    bucket = storage_client.bucket(action_items_bucket)
    actions_blob = bucket.blob('action_transcripts/{}_actions.txt'.format(meeting_id))
    actions_str = actions_blob.download_as_string().decode('utf-8')
    action_items = actions_str.split('\n')
    action_items_html = ""
    for item in action_items:
        action_items_html += "<li>" + item + "</li>"
    action_items_html = "<ul>Action Items:" + action_items_html + "</ul>"

    html_body = meeting_info_html + action_items_html + "<div>Your meeting transcript is attached.</div>"

    send_email_http_url = os.environ.get('SEND_EMAIL_HTTP_URL')
    return requests.post(send_email_http_url,
                            data={ "html_body" :html_body, "recipient": user_email, "cc": attendees, "subject": "Your Meeting Minutes are ready!",
                                    "attachment": { "bucket": action_items_bucket,"file_path": 'transcripts/{}.txt'.format(meeting_id) } })
        