import React, {Component} from "react";
import { ReactMic } from 'react-mic';

class VoiceRegisterTab extends Component {

    state = {
        record: false,
    }

    startRecording = () => {
        this.setState({
          record: true
        });
    }
     
    stopRecording = () => {
        this.setState({
          record: false
        });
    }
     
    onData(recordedBlob) {
        console.log('chunk of real-time data is: ', recordedBlob);
    }
     
    registerVoice(recordedBlob) {
        const metadata = {
            contentType: recordedBlob.blob.type
        }
        
        console.log("the metadata is " + metadata);

        const postURL = "https://us-central1-hacksbc-268409.cloudfunctions.net/enrol_voice_begin";
        // post
        fetch(postURL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({metadata})
        })
        .then(res => console.log('success: ' + res))
        .catch(err => console.log('email failed: ' + err))
    }

    sendAudioFile(signedURL: any, recordedBlob: any) {
        return new Promise(function (fulfill, reject) {
            const request = new XMLHttpRequest();
            request.open('PUT', signedURL, true);
            request.setRequestHeader("Content-Type", "audio/flac");
            request.onreadystatechange = function () {
                if(request.readyState === XMLHttpRequest.DONE && request.status === 200) {
                    console.log(request.responseText);
                }
            };
            request.onload = function () {
                fulfill(request.response);
            };
            request.onerror = function () {
                reject('The request failed')
            };

            request.send(recordedBlob);
        });
    }

    //HTTP request using XMLHTTP
    getSignedURL(metadata: any){
        return new Promise(function (fulfill, reject) {

            const URL = "https://us-central1-hacksbc-268409.cloudfunctions.net/enrol_voice_begin";
            const request = new XMLHttpRequest();
            request.open('POST', URL, true);
            request.setRequestHeader("Content-Type", "application/json");
            request.onreadystatechange = function () {
                if(request.readyState === XMLHttpRequest.DONE && request.status === 200) {
                    console.log(request.responseText);
                }
            };
            request.onload = function () {
                fulfill(request.response);
            };
            request.onerror = function () {
                reject('The request failed')
            };

            request.send(JSON.stringify(metadata));
        });
    }


    render() {
        return(
            <div className="d-inline-flex flex-column align-items-center">
                <span className="pt-5">Your Voice Enrolment Status: [Insert Status]</span>
                <ReactMic
                    record={this.state.record}
                    onStop={this.registerVoice}
                    onData={this.onData}
                    className="rounded-lg m-3"
                    strokeColor="#3944BC"
                    backgroundColor="#262626"
                    mimeType="audio/flac"/>
                    {!this.state.record ?
                    <div className="d-inline-flex flex-column align-items-center">
                    <button style={{backgroundColor: '#00000000', borderStyle: 'none'}} onClick={this.startRecording} type="button"><img src={require('./microphone_icon.png')} width='60' height='60' /></button>
                    <span>Start</span> 
                    </div> :
                    <div className="d-inline-flex flex-column align-items-center">
                    <button style={{backgroundColor: '#00000000', borderStyle: 'none'}} onClick={this.stopRecording} type="button"><img src={require('./stop_icon.png')} width='60' height='60' /></button>
                    <span>Stop and Save</span> 
                    </div> }
                    <span>Click start and read out loud the following phrases, then click stop to register voice</span>
                    <p>
                    <em>Oak is strong and also gives shade.</em>
                    </p>
                    <p>
                    <em>Cats and dogs each hate the other.</em>
                    </p>
                    <p>
                    <em>The pipe began to rust while new.</em>
                    </p>
                    <p>
                    <em>Open the crate but don't break the glass.</em>
                    </p>
                    <p>
                    <em>Add the sum to the product of these three.</em>
                    </p>
                    <p>
                    <em>Thieves who rob friends deserve jail.</em>
                    </p>
                    <p>
                    <em>The ripe taste of cheese improves with age.</em>
                    </p>
                    <p>
                    <em>Act on these orders with great speed.</em>
                    </p>
                    <p>
                    <em>The ripe taste of cheese improves with age.</em>
                    </p>
                    <p>
                    <em>The hog crawled under the high fence.</em>
                    </p>
                    <p>
                    <em>Move the vat over the hot fire.</em>
                    </p>
                    

            </div>
        );
    }
}
export default VoiceRegisterTab;
