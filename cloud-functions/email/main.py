from mailjet_rest import Client
from google.cloud import storage
from flask import escape, Response
import base64
import os
import sys
import logging

logger = logging.getLogger()

def send_email_http(request):
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

    request_json = request.get_json(silent=True)
    if not request_json and not request_json.get('recipient') and not request_json.get('subject') and not bool(request_json.get('html_body') or request_json.get('text_body')):
        return Response(status=500, response="Error: Missing required fields.", headers=headers)
    
    data = {
        'Messages': [
            {
                "From": {
                    "Email": "hacksbc319@gmail.com",
                    "Name": "Minutizer"
                },
                "To": [
                    {
                        "Email": request_json['recipient'],
                        "Name": request_json['recipient']
                    }
                ],
                "Subject": request_json['subject']
            }
        ]
    }

    if request_json.get('text_body'):
        data['Messages'][0]['TextPart'] = request_json['text_body']

    if request_json.get('html_body'):
        data['Messages'][0]['HTMLPart'] = request_json['html_body']

    if request_json.get('cc'):
        carbon_copy = []
        for cc in request_json['cc']:
            carbon_copy.append({ "Email": cc, "Name": cc })
        data['Messages'][0]['Cc'] = carbon_copy

    if request_json.get('attachments'):
        attachments = request_json['attachments']
        storage_client = storage.Client.from_service_account_json('service_account.json')
        email_attachments = []
        for attachment in attachments:
            bucket = storage_client.bucket(attachment.bucket)
            blob = bucket.blob(attachment.file_path)
            email_attachments.append({ "ContentType": "text/plain", "FileName": attachment.name, 
                                                    "Base64Content":str(base64.b64encode(blob.download_as_string()), "utf-8") })
        data['Messages'][0]['Attachments'] = email_attachments

    api_key = os.environ.get('API_KEY')
    api_secret = os.environ.get('SECRET_KEY')
    mailjet = Client(auth=(api_key, api_secret), version='v3.1')
    result = mailjet.send.create(data=data)
    response = result.json()["Messages"][0]
    if response["Status"] == 'error':
        logger.exception(response)
        return Response(status=500, response="Error: Email could not be sent.", headers=headers)
    else:
        return Response(status=201, response="Request was successful.", headers=headers)
        
        