import React from 'react';
import logo from './logo.svg';
import AttendeesComponent from "./AttendeesComponent";
import './MetaFields.css';
import TimePickers from "./TimePicker";
import DatePickers from "./DatePicker";

export default class MetaFields extends React.Component<{}, {organizer: any, startTime: any, endTime: any}> {
    private fileInput = React.createRef<HTMLInputElement>();

    constructor(props: any) {
        super(props);
        this.state = {organizer: '',
            startTime: '',
            endTime: '',

        };
        this.handleChangeOrganizer = this.handleChangeOrganizer.bind(this);
        this.handleChangeStartTime = this.handleChangeStartTime.bind(this);
        this.handleChangeEndTime = this.handleChangeEndTime.bind(this);
        this.handleFileSubmit = this.handleFileSubmit.bind(this);
    }

    handleChangeOrganizer(event: any) {
        this.setState({organizer: event.target.value});
    }
    handleChangeStartTime(event: any) {
        this.setState({startTime: event.target.value});
    }
    handleChangeEndTime(event: any) {
        this.setState({endTime: event.target.value});
    }

    handleFileSubmit(event: any): boolean{
        try {
            // @ts-ignore: Object is possibly 'null'.
            let parts: string[] = this.fileInput.current.files[0].name.split('.');
            let extension: string = parts[parts.length - 1].toLowerCase();
            if (extension === "wav" || extension === "mp3") {
                // @ts-ignore: Object is possibly 'null'.
                alert(`Selected file - ${this.fileInput.current.files[0].name}`);
                this.uploadToCloud();
                return true;
            } else {
                alert('Invalid file. Only .mp3 or .wav files accepted');
                return false;
            }
        }catch (e) {
            return false;
        }    
    }


    uploadToCloud(){
        const metadata = {
            //Stub values
            meetingId: "00001",
            organizerUserName: "Josh",
            startTime: "7 AM",
            endTime: "8 AM",
        };
        const metadataPromise = this.getSignedURL(metadata)

        metadataPromise.then((result) => {
            console.log(result);
        }).catch((error) => {
            console.log(`In catch: ${error}`);
        });
    }


    //HTTP request using XMLHTTP
    getSignedURL(metadata: any){
        return new Promise(function (fulfill, reject) {

            // const proxyurl = "https://cors-anywhere.herokuapp.com/";
            const URL = "https://us-central1-hacksbc-268409.cloudfunctions.net/upload_audio";
            const request = new XMLHttpRequest();
            request.open('POST', URL, true);
            request.setRequestHeader('X-PINGOTHER', 'pingpong');
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
            }

            request.send(JSON.stringify(metadata));
        });
    }
    render() {
        return (
            <form className = 'metaForm'>
                <label className = "Meta-label">
                    Meeting Organizer:
                    <input className = "Meta-input" type="text" value={this.state.organizer} onChange={this.handleChangeOrganizer} />
                </label>
                <label className = "Meta-label">
                    Meeting Date:
                    {/*<input className = "Meta-input" type="text" value={this.state.endTime} onChange={this.handleChangeEndTime}/>*/}
                    <DatePickers />
                </label>
                <label className = "Meta-label">
                    Start Time:
                    {/*<input className = "Meta-input" type="text" value={this.state.startTime} onChange={this.handleChangeStartTime}/>*/}
                    <TimePickers/>
                </label>
                <label className = "Meta-label">
                    End Time:
                    {/*<input className = "Meta-input" type="text" value={this.state.endTime} onChange={this.handleChangeEndTime}/>*/}
                    <TimePickers/>
                </label>

                <AttendeesComponent></AttendeesComponent>
                <br/>
                <input type="file" accept = "audio/*" id="inputFile" ref={this.fileInput} onChange={() => this.handleFileSubmit(this)} />

            </form>
        );
    }
}