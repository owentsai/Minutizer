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
            
            <div style={{margin: '50px 150px', borderRadius: "25px"}} 
            className="p-3 shadow-lg">
                <div className="d-flex flex-column align-items-center">
                <h3>Your Voice Enrolment Status: [Insert Status]</h3>
                <ReactMic
                    record={this.state.record}
                    onStop={this.registerVoice}
                    onData={this.onData}
                    className="d-flex align-self-stretch rounded-lg m-3"
                    strokeColor="#3944BC"
                    backgroundColor="#262626"
                    mimeType="audio/flac"/>
                    {!this.state.record ?
                    <div className="d-inline-flex flex-column align-items-center">
                    <button style={{backgroundColor: '#00000000', borderStyle: 'none'}} onClick={this.startRecording} type="button"><img src={require('./icons/microphone_icon.png')} width='60' height='60' /></button>
                    <h5>Start</h5> 
                    </div> :
                    <div className="d-inline-flex flex-column align-items-center">
                    <button style={{backgroundColor: '#00000000', borderStyle: 'none'}} onClick={this.stopRecording} type="button"><img src={require('./icons/stop_icon.png')} width='60' height='60' /></button>
                    <h5>Stop and Save</h5> 
                    </div> }
                    <span className="font-weight-bold">Click start and read out loud the following phrases, then click stop to register voice</span>
                    <text>
                    <em>Oak is strong and also gives shade.</em>
                    </text>
                    <text>
                    <em>Cats and dogs each hate the other.</em>
                    </text>
                    <text>
                    <em>The pipe began to rust while new.</em>
                    </text>
                    <text>
                    <em>Open the crate but don't break the glass.</em>
                    </text>
                    <text>
                    <em>Add the sum to the product of these three.</em>
                    </text>
                    <text>
                    <em>Thieves who rob friends deserve jail.</em>
                    </text>
                    <text>
                    <em>The ripe taste of cheese improves with age.</em>
                    </text>
                    <text>
                    <em>Act on these orders with great speed.</em>
                    </text>
                    <text>
                    <em>The ripe taste of cheese improves with age.</em>
                    </text>
                    <text>
                    <em>The hog crawled under the high fence.</em>
                    </text>
                    <text>
                    <em>Move the vat over the hot fire.</em>
                    </text>
                    </div>

            </div>
        );
    }
}
export default VoiceRegisterTab;
