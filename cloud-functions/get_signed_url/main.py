import firebase_admin
from firebase_admin import auth
from google.cloud import storage
from flask import escape, Response
from datetime import datetime, timedelta
import os
import sys
import logging

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
    
    signed_url_headers = dict()
    if request_json.get('meetingName'):
        signed_url_headers['x-goog-meta-name'] = request_json['meetingName']
    if request_json.get('meetingDate'):
        signed_url_headers['x-goog-meta-date'] = request_json['meetingDate']
    if request_json.get('startTime'):
        signed_url_headers['x-goog-meta-starttime'] = request_json['startTime']
    if request_json.get('endTime'):
        signed_url_headers['x-goog-meta-endtime'] = request_json['endTime']
    if request_json.get('attendees'):
        attendees = request_json['attendees']
        attendee_emails = []
        for attendee in attendees:
            attendee_emails.append(attendee['email'])
        signed_url_headers['x-goog-meta-attendees'] = attendee_emails

    storage_client = storage.Client.from_service_account_json('service_account.json')

    bucket_name = os.environ.get("RECORDING_BUCKET_NAME")
    object_name = user_email + '/' + datetime.now().strftime('%Y%m%dT%H%M%SZ')
    file = storage_client.bucket(bucket_name).blob(object_name)

    expires_at_ms = datetime.now() + timedelta(seconds=300)

    if not signed_url_headers:
        url = file.generate_signed_url(expires_at_ms, method="PUT", content_type=content_type, version='v4')
    else:
        url = file.generate_signed_url(expires_at_ms, method="PUT", content_type=content_type, version='v4', headers=signed_url_headers)

    return Response(status=201, response=url, headers=headers)