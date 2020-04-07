from flask import escape, Response
import base64
import requests
import google.cloud.storage as storage
import os
import sys
import logging


logger = logging.getLogger()


def parse_actions(event, context):
	
	path_to_file = event['name']
	meeting_id = path_to_file.split('/')[-1].split('.')[0]
	if meeting_id.endswith('actions'):
		return " "

	client = storage.Client.from_service_account_json('service_account.json')
	bucket = client.get_bucket('minutizer_transcriptions')
	blob = bucket.get_blob(path_to_file)

	bytestr = blob.download_as_string().decode('utf-8')

	action_strings = []	
	speaker_phrases = bytestr.split('\n')
	

	for phrase in speaker_phrases:
		if 'action' in phrase:
			idx = phrase.index('action')
			action = phrase[idx : ]
			action_strings.append(action)


	actions = '\n ----' + '\n ----'.join(action_strings)
	bytestr = actions
	newblob = bucket.blob('action_transcripts/{}_actions.txt'.format(meeting_id))
	newblob.upload_from_string(bytestr)

	return actions
	
		


