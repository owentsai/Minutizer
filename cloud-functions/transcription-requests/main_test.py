from unittest.mock import Mock
import main

# TODO: finish tests - Cindy Feb 25
def test_get_transcription_requests_in_progress():
    data = {'inProgressTranscriptions': 'true'}
    req = Mock(args=data)

    assert main.transcription_requests_http(req) == None

def test_get_transcription_requests_completed():
    data = {'completedTranscriptions': 'true'}
    req = Mock(args=data)

    assert main.transcription_requests_http(req) == None

def test_get_all_transcription_requests():
    req = Mock(args=data)

    assert main.transcription_requests_http(req) == None