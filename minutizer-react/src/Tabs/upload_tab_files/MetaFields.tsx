import React from 'react';
import logo from '../../logo.svg';
import AttendeesComponent from "./AttendeesComponent";
import TimePickers from "./TimePicker";
import DatePickers from "./DatePicker";

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

    handleAttendeeNameChange (idx: any, evt: any){
        const newShareholders = this.state.attendees.map((shareholder: any, sidx: any) => {
            if (idx !== sidx) return shareholder;
            return { ...shareholder, name: evt.target.value };
        });

        this.setState({ attendees: newShareholders });
    };

    handleAddAttendee = () => {
        this.setState({
            attendees: this.state.attendees.concat([{ name: "" }])
        });
    };

    handleRemoveAttendee(idx: any)  {
        this.setState({
            attendees: this.state.attendees.filter((s:any, sidx: any) => idx !== sidx)
        });
    };

    handleFileSubmit(event: any): boolean{
        try {
            // @ts-ignore: Object is possibly 'null'.
            let parts: string[] = this.fileInput.current.files[0].name.split('.');
            let extension: string = parts[parts.length - 1].toLowerCase();
            if (extension === "wav" || extension === "mp3") {
                // @ts-ignore: Object is possibly 'null'.
                let fileName = this.fileInput.current.files[0].name;
                alert(`Selected file - ` + fileName);
                this.setState({meetingName: fileName});
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
            // @ts-ignore: Object is possibly 'null'.
            contentType: this.fileInput.current.files[0].type,
            organizerUserName: this.state.organizer,
            meetingName: this.state.meetingName,
            startTime: this.state.startTime+":00",
            endTime: this.state.endTime+":00",
            meetingDate: this.state.meetingDate,
        };
        if (this.state.attendees.length > 0){
            metadata["attendees"] = this.state.attendees;
        }
        console.log(metadata);
        const metadataPromise = this.getSignedURL(metadata);

        let signedURL;
        metadataPromise.then((result:any) => {
            console.log(result);
            signedURL = result;
            const sendFilePromise = this.sendAudioFile(signedURL);
            sendFilePromise.then((result:any) => {
                console.log(result);
                alert("file sent successfully!");
            }).catch((error) => {
                console.log(`In catch: ${error}`);
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
        return (
            <form>
                <div className="form-row mb-3">
                    <div className="form-group col-md-6">
                        <label className="Meta-label font-weight-bold">
                            Meeting File Name:
                            <input className="Meta-input ml-4" type="text" value={this.state.meetingName} onChange={this.handleChangeMeetingName} />
                        </label>
                    </div>
                    <div className="form-group col-md-6">
                        <label className = "Meta-label font-weight-bold">
                            Meeting Organizer:
                            <input className = "Meta-input ml-4" type="text" value={this.state.organizer} onChange={this.handleChangeOrganizer} />
                        </label>
                    </div>
                </div>
                <div className="form-row mb-3">
                    <div className="form-group col-md-4">
                        <label className = "Meta-label font-weight-bold">
                            Meeting Date:
                            {/*<input className = "Meta-input" type="text" value={this.state.endTime} onChange={this.handleChangeEndTime}/>*/}
                            <DatePickers parentCallback={this.handleChangeDate}/>
                        </label>
                    </div>
                    <div className="form-group col-md-4">
                        <label className = "Meta-label font-weight-bold">
                            Start Time:
                            {/*<input className = "Meta-input" type="text" value={this.state.startTime} onChange={this.handleChangeStartTime}/>*/}
                            <TimePickers parentCallback={this.handleChangeStartTime}/>
                        </label>
                    </div>
                    <div className="form-group col-md-4">
                        <label className = "Meta-label font-weight-bold">
                            End Time:
                            {/*<input className = "Meta-input" type="text" value={this.state.endTime} onChange={this.handleChangeEndTime}/>*/}
                            <TimePickers parentCallback={this.handleChangeEndTime}/>
                        </label>
                    </div>
                </div>


                <AttendeesComponent handleAttendeeNameChange={this.handleAttendeeNameChange}
                                    handleAttendeeAdd={this.handleAddAttendee}
                                    handleAttendeeRemove={this.handleRemoveAttendee}></AttendeesComponent>
                <br/>
                <input type="file" accept = "audio/*" id="inputFile" ref={this.fileInput} onChange={() => this.handleFileSubmit(this)} />
            </form>
        );
    }
}