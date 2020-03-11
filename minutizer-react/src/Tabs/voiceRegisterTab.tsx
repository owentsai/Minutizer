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
     
    onStop(recordedBlob) {
        console.log('recordedBlob is: ', recordedBlob);
    }

    render() {
        return(
            <div className="d-inline-flex flex-column align-items-center">
                <span className="pt-5">Your Voice Enrolment Status: [Insert Status]</span>
                <ReactMic
                    record={this.state.record}
                    onStop={this.onStop}
                    onData={this.onData}
                    className="rounded-lg p-5"
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
                    
                    
            </div>
        );
    }
}
export default VoiceRegisterTab;
