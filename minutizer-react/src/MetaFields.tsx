import React from 'react';
import logo from './logo.svg';
import AttendeesComponent from "./AttendeesComponent";
import './MetaFields.css';
import TimePickers from "./TimePicker";
import DatePickers from "./DatePicker";
import DateFnsUtils from '@date-io/date-fns'; // choose your lib
import {
    DatePicker,
    TimePicker,
    DateTimePicker,
    MuiPickersUtilsProvider,
} from '@material-ui/pickers';

interface inputProps {
    organizer: any,
    startTime: any,
    endTime: any,
    meetingName: any,
    meetingDate:any,
    attendees:any
}
export default class MetaFields extends React.Component<{}, inputProps> {
    private fileInput = React.createRef<HTMLInputElement>();

    constructor(props: any) {
        super(props);
        this.state = {
            organizer: '',
            startTime: '',
            endTime: '',
            meetingName: '',
            meetingDate: '',
            attendees: [],
        };
        this.handleChangeOrganizer = this.handleChangeOrganizer.bind(this);
        this.handleChangeStartTime = this.handleChangeStartTime.bind(this);
        this.handleChangeEndTime = this.handleChangeEndTime.bind(this);
        this.handleFileSubmit = this.handleFileSubmit.bind(this);
        this.handleChangeMeetingName = this.handleChangeMeetingName.bind(this);
        this.handleChangeDate = this.handleChangeDate.bind(this);
        this.handleChangeAttendees = this.handleChangeAttendees.bind(this);
    }

    handleChangeOrganizer(event: any) {
        this.setState({organizer: event.target.value});
    }
    handleChangeDate(childValue: any) {
        this.setState({meetingDate: childValue});
        console.log(childValue);
    }
    handleChangeStartTime(childValue: any) {
        this.setState({startTime: childValue});
        console.log(childValue);
    }
    handleChangeEndTime(childValue: any) {
        this.setState({endTime: childValue});
        console.log(childValue);
    }
    handleChangeMeetingName(event: any){
        this.setState({meetingName: event.target.value});
    }
    handleChangeAttendees(childValue: any){
        this.setState({attendees: childValue});
        console.log(this.state.attendees);
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
        // @ts-ignore
        const metadata = {
            //Stub values
            // @ts-ignore: Object is possibly 'null'.
            contentType: this.fileInput.current.files[0].type,
            organizerUserName: this.state.organizer,
            meetingName: this.state.meetingName,
            startTime: this.state.startTime+":00",
            endTime: this.state.endTime+":00",
            meetingDate: this.state.meetingDate,
        };
        console.log(metadata);
        const metadataPromise = this.getSignedURL(metadata);

        let signedURL;
        metadataPromise.then((result:any) => {
            console.log(result);
            signedURL = result;
            const sendFilePromise = this.sendAudioFile(signedURL);
            sendFilePromise.then((result:any) => {
                console.log(result);
                console.log("file sent successfully!");
            }).catch((error) => {
                console.log(`In catch: ${error}`);
                alert(`User :  ${this.state.organizer} does not exist`);
            });
        }).catch((error) => {
            console.log(`In catch: ${error}`);
        });

    }

    sendAudioFile(signedURL: any) {
        return new Promise(function (fulfill, reject) {

            //Getting the audio file from input tag
            let fileInput = document.getElementById('inputFile');
            // @ts-ignore
            let file = fileInput.files[0];
            // @ts-ignore
            let fileType = fileInput.files[0].type;
            let formData = new FormData();
            formData.append('file',file);

            const request = new XMLHttpRequest();
            request.open('PUT', signedURL, true);
            request.setRequestHeader("Content-Type", fileType);
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

            request.send(formData);
        });
    }


    //HTTP request using XMLHTTP
    getSignedURL(metadata: any){
        return new Promise(function (fulfill, reject) {

            // const proxyurl = "https://cors-anywhere.herokuapp.com/";
            const URL = "https://us-central1-hacksbc-268409.cloudfunctions.net/upload_audio";
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
        // @ts-ignore
        // @ts-ignore
        return (
            <form className = 'metaForm'>
                <label className="Meta-label">
                    Meeting Name:
                    <input className="Meta-input" type="text" value={this.state.meetingName} onChange={this.handleChangeMeetingName} />
                </label>
                <label className = "Meta-label">
                    Meeting Organizer:
                    <input className = "Meta-input" type="text" value={this.state.organizer} onChange={this.handleChangeOrganizer} />
                </label>
                <label className = "Meta-label">
                    Meeting Date:
                    {/*<input className = "Meta-input" type="text" value={this.state.endTime} onChange={this.handleChangeEndTime}/>*/}
                    <DatePickers parentCallback={this.handleChangeDate}/>

                </label>
                <label className = "Meta-label">
                    Start Time:
                    {/*<input className = "Meta-input" type="text" value={this.state.startTime} onChange={this.handleChangeStartTime}/>*/}
                    <TimePickers parentCallback={this.handleChangeStartTime}/>
                </label>
                <label className = "Meta-label">
                    End Time:
                    {/*<input className = "Meta-input" type="text" value={this.state.endTime} onChange={this.handleChangeEndTime}/>*/}
                    <TimePickers parentCallback={this.handleChangeEndTime}/>
                </label>

                <AttendeesComponent parentCallback={this.handleChangeAttendees}></AttendeesComponent>
                <br/>
                <input type="file" accept = "audio/*" id="inputFile" ref={this.fileInput} onChange={() => this.handleFileSubmit(this)} />

            </form>
        );
    }
}