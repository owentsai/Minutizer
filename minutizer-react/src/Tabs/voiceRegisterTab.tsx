import React, {Component} from "react";
import { ReactMic } from 'react-mic';
import MicIcon from '@material-ui/icons/Mic';
import StopIcon from '@material-ui/icons/Stop';
import Button from '@material-ui/core/Button';
import TimerIcon from '@material-ui/icons/Timer';

class VoiceRegisterTab extends Component {

    state = {
        start: false,
        record: false,
        countdownTimer: 3,
        timer: 0
    }

    componentDidMount() {
        setInterval(() => {
            let currTime: number = this.state.timer;
            let currCountdown: number = this.state.countdownTimer;
            // console.log("the countertimer is now:" + this.state.countdownTimer);
            // console.log("start is: " + this.state.start);
            // console.log("record is: " + this.state.record);
            // console.log("the timer is: " + this.state.timer);
            if (this.state.start || this.state.record) {
                if (this.state.start) {
                    if (this.state.countdownTimer == 0) {
                        this.startRecording();
                    } else {
                        this.setState({
                            countdownTimer: currCountdown-1
                        });
                    }
                } else if (this.state.record) {
                    if (this.state.timer >= 30) {
                        this.stopRecording();
                    } else {
                        this.setState({
                            timer: currTime+1
                        });
                    } 
                }
            } else {
                this.setState({
                    timer: 0,
                    counterdownTimer: 3
                });
            }   
        }, 1000);
    }

    startButtonHandler = () => {
        this.setState({
            start: true,
          });
    }

    startRecording = () => {
        this.setState({
          countdownTimer: 3,
          record: true,
          start: false,
        });
    }
    stopRecording = () => {
        this.setState({
          record: false
        });
    }

    // onData(recordedBlob) {
    //     console.log('chunk of real-time data is: ', recordedBlob);
    // }
     
    registerVoice(recordedBlob) {
        console.log('the size of the blob is: ', recordedBlob.blob.size);

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
        var currButton;
        var enrolButtonColor = (this.state.timer < 25) ? "bg-primary text-white" : "bg-warning text-white";
        if(!this.state.start && !this.state.record) {
            currButton = (<Button style={{width: '200px', height:'35px'}} variant='contained' color='secondary' startIcon={<MicIcon />} onClick={this.startButtonHandler}>START</Button>);
        } else if (this.state.start) {
            currButton = (<Button style={{width: '200px', height:'35px'}} variant='contained' className="bg-success text-white" startIcon={<TimerIcon />}>READY IN {this.state.countdownTimer}s</Button>);
        } else {
            currButton = (<Button style={{width: '200px', height:'35px'}} variant='contained' className={enrolButtonColor} startIcon={<StopIcon />} onClick={this.stopRecording}>ENROL {("0" + this.state.timer).slice(-2)}S</Button>);
        }

        return(
            <div style={{margin: '50px 150px', borderRadius: "25px"}} 
            className="p-3 shadow-lg">
                <div className="d-flex flex-column align-items-center">
                    <h3>Your Voice Enrolment Status: [Insert Status]</h3>
                    <ReactMic
                        record={this.state.record}
                        onStop={this.registerVoice}
                        className="d-flex align-self-stretch rounded-lg m-3"
                        strokeColor="#3944BC"
                        backgroundColor="#262626"
                        mimeType="audio/flac"/>
                    <div className="pb-1 mb-1">
                        {/* <div className="p-1" style={{border: "2px solid black", borderRadius: "50%" }}> */}
                        {currButton}
                        {/* </div> */}
                    </div>
                </div>
                <div className="ml-5 mr-5">
                    <h3 className="font-weight-bold p-3">INSTRUCTIONS: </h3>
                    <ol>
                        <li className="pb-3">
                            Read the two questions below and formulate an approximately 10-second response per question.
                        </li>
                        <li className="pb-3">
                            Click <b>START</b> to start voice enrolment. There will be a 3-second countdown before the recording starts.
                        </li>
                        <li className="pb-3">
                            Respond to the two questions and read the prompt shown below in your regular speaking rate and tone.  A timer will be displayed to help you plan your time and there is a time limit of 30 seconds.
                        </li>
                        <li className="pb-3">
                            If you finish early, click <b>ENROL</b> to stop recording and register your voice to the system.  The recording will also stops in 30 seconds and your voice will be automatically registered.
                        </li>
                    </ol>
                    <ul style={{listStyleType: "none"}}>
                        <li><em><b>Question 1: </b>What do you plan to accomplish in the next 3 days?</em></li>
                        <li><em><b>Question 2: </b>What did you have for dinner last night?</em></li>
                        <li><em><b>Prompt: </b>For a given logic, such as first-order logic, the different
                            derivation systems will give different explications of what it is for
                            a sentence to be a theorem and what it means for a sentence to be
                            derivable from some others.</em></li>
                    </ul>
                </div>
            </div>
        );
    }
}
export default VoiceRegisterTab;
