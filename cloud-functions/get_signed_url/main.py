import firebase_admin
from firebase_admin import auth
from google.oauth2 import service_account
from google.cloud import storage
from flask import escape, Response
import six
from six.moves.urllib.parse import quote
from datetime import datetime, timedelta
import os
import sys
import logging
import binascii
import collections
import hashlib

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
    
    headers = { "content-type": request_json['contentType'] }
    bucket_name = os.environ.get("ENROLMENT_BUCKET_NAME")
    object_name = user_email + '/' + datetime.now()
    
    url = generate_signed_url(bucket_name=bucket_name, object_name=object_name, method="PUT", headers=headers)

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
    
    headers = dict()
    headers['content-type'] = request_json['contentType']
    if 'meetingName' in request_json:
        headers['x-goog-meta-name'] = request_json['meetingName']
    if 'meetingDate' in request_json:
        headers['x-goog-meta-date'] = request_json['meetingDate']
    if 'startTime' in request_json:
        headers['x-goog-meta-starttime'] = request_json['startTime']
    if 'endTime' in request_json:
        headers['x-goog-meta-endtime'] = request_json['endTime']
    if 'attendees' in request_json:
        attendees = request_json['attendees']
        attendee_emails = []
        for attendee in attendees:
            attendee_emails.append(attendee['email'])
        headers['x-goog-meta-attendees'] = attendee_emails

    bucket_name = os.environ.get("RECORDING_BUCKET_NAME")
    object_name = user_email + '/' + datetime.now()
    
    url = generate_signed_url(bucket_name=bucket_name, object_name=object_name, method="PUT", headers=headers)

    return Response(status=201, response=url, headers=headers)

# source: https://cloud.google.com/storage/docs/access-control/signing-urls-manually
def generate_signed_url(bucket_name, object_name, expiration=3600, method='GET', headers=None):

    if expiration > 604800:
        print('Expiration Time can\'t be longer than 604800 seconds (7 days).')
        sys.exit(1)

    escaped_object_name = quote(six.ensure_binary(object_name), safe=b'/~')
    canonical_uri = '/{}'.format(escaped_object_name)

    datetime_now = datetime.datetime.utcnow()
    request_timestamp = datetime_now.strftime('%Y%m%dT%H%M%SZ')
    datestamp = datetime_now.strftime('%Y%m%d')

    google_credentials = service_account.Credentials.from_service_account_file('service_account.json')
    client_email = google_credentials.service_account_email
    credential_scope = '{}/auto/storage/goog4_request'.format(datestamp)
    credential = '{}/{}'.format(client_email, credential_scope)

    if headers is None:
        headers = dict()
    host = '{}.storage.googleapis.com'.format(bucket_name)
    headers['host'] = host

    canonical_headers = ''
    ordered_headers = collections.OrderedDict(sorted(headers.items()))
    for k, v in ordered_headers.items():
        lower_k = str(k).lower()
        strip_v = str(v).lower()
        canonical_headers += '{}:{}\n'.format(lower_k, strip_v)

    signed_headers = ''
    for k, _ in ordered_headers.items():
        lower_k = str(k).lower()
        signed_headers += '{};'.format(lower_k)
    signed_headers = signed_headers[:-1]  # remove trailing ';'

    query_parameters = dict()
    query_parameters['X-Goog-Algorithm'] = 'GOOG4-RSA-SHA256'
    query_parameters['X-Goog-Credential'] = credential
    query_parameters['X-Goog-Date'] = request_timestamp
    query_parameters['X-Goog-Expires'] = expiration
    query_parameters['X-Goog-SignedHeaders'] = signed_headers

    canonical_query_string = ''
    ordered_query_parameters = collections.OrderedDict(
        sorted(query_parameters.items()))
    for k, v in ordered_query_parameters.items():
        encoded_k = quote(str(k), safe='')
        encoded_v = quote(str(v), safe='')
        canonical_query_string += '{}={}&'.format(encoded_k, encoded_v)
    canonical_query_string = canonical_query_string[:-1]  # remove trailing '&'

    canonical_request = '\n'.join([method, canonical_uri, canonical_query_string,
                                   canonical_headers, signed_headers, 'UNSIGNED-PAYLOAD'])

    canonical_request_hash = hashlib.sha256(canonical_request.encode()).hexdigest()

    string_to_sign = '\n'.join(['GOOG4-RSA-SHA256', request_timestamp, credential_scope, canonical_request_hash])

    # signer.sign() signs using RSA-SHA256 with PKCS1v15 padding
    signature = binascii.hexlify(google_credentials.signer.sign(string_to_sign)).decode()

    scheme_and_host = '{}://{}'.format('https', host)
    signed_url = '{}{}?{}&x-goog-signature={}'.format(scheme_and_host, canonical_uri, canonical_query_string, signature)

    return signed_url
