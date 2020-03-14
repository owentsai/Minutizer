import React from 'react';
import logo from '../../logo.svg';
import AttendeesComponent from "./AttendeesComponent";
import TimePickers from "./TimePicker";
import DatePickers from "./DatePicker";
import { ToastContainer, toast } from 'react-toastify';
import Icon from '@material-ui/core/Icon';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import Button from '@material-ui/core/Button';
import 'react-toastify/dist/ReactToastify.css';

toast.configure();

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
            meetingDate: '2020-01-01',
            attendees: [],
        };
        this.handleChangeOrganizer = this.handleChangeOrganizer.bind(this);
        this.handleChangeStartTime = this.handleChangeStartTime.bind(this);
        this.handleChangeEndTime = this.handleChangeEndTime.bind(this);
        this.handleFileSubmit = this.handleFileSubmit.bind(this);
        this.handleChangeMeetingName = this.handleChangeMeetingName.bind(this);
        this.handleChangeDate = this.handleChangeDate.bind(this);
        this.handleChangeAttendees = this.handleChangeAttendees.bind(this);
        this.handleShareholderNameChange = this.handleShareholderNameChange.bind(this);
        this.handleAddShareholder = this.handleAddShareholder.bind(this);
        this.handleRemoveShareholder = this.handleRemoveShareholder.bind(this);
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


    handleShareholderNameChange (idx: any, evt: any){
        const name = evt.target.value;
        const newShareholders = this.state.attendees.map((shareholder: any, sidx: any) => {
            if (idx !== sidx) return shareholder;
            return { ...shareholder, name };
        });
        this.setState({ attendees: newShareholders });
        console.log(this.state.attendees);
    };

    handleAddShareholder = () =>{
        this.setState({
            attendees: this.state.attendees.concat([{ name: "" }])
        });
        console.log(this.state.attendees);
    };

    handleRemoveShareholder(idx: any)  {
        this.setState({
            attendees: this.state.attendees.filter((s:any, sidx: any) => idx !== sidx)
        });
        console.log(this.state.attendees);
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
                this.uploadToCloud();
                return true;
            } else {
                toast.error(<div>FILE NOT SENT!<br />Only .mp3 or .wav files accepted</div>, {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                this.resetForm()
                return false;
            }
        }catch (e) {
            console.log(e.message);
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
        console.log(this.state.attendees.length);
        if (this.state.attendees.length > 0){
            metadata["attendees"] = this.state.attendees;
        }
        if (!this.state.meetingName){
            // @ts-ignore
            this.setState({meetingName: this.fileInput.current.files[0].name});
            // @ts-ignore
            metadata["meetingName"] = this.fileInput.current.files[0].name;
        }

        console.log(metadata);
        //Pass the metadata of the file to cloud function to retrieve a signed URL where the file will be uploaded
        const metadataPromise = this.getSignedURL(metadata);

        let signedURL;
        metadataPromise.then((result:any) => {
            console.log(result);
            signedURL = result;
            const sendFilePromise = this.sendAudioFile(signedURL);
            sendFilePromise.then((result:any) => {
                console.log(result);
                toast.success('File Upload Successful!', {
                    position: "top-center",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                });
                this.resetForm();
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
            <form id="uploadAudioForm">
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
                        <label className = "Meta-label font-weight-bold" >
                            Start Time:
                            {/*<input className = "Meta-input" type="text" value={this.state.startTime} onChange={this.handleChangeStartTime}/>*/}
                            <TimePickers parentCallback={this.handleChangeStartTime}/>
                        </label>
                    </div>
                    <div className="form-group col-md-4">
                        <label className = "Meta-label font-weight-bold">
                            End Time:
                            {/*<input className = "Meta-input" type="text" value={this.state.endTime} onChange={this.handleChangeEndTime}/>*/}
                            <TimePickers parentCallback={this.handleChangeEndTime} />
                        </label>
                    </div>
                </div>

                    <AttendeesComponent parentCallback1={this.handleAddShareholder}
                                        parentCallback2={this.handleRemoveShareholder}
                                        parentCallback3={this.handleShareholderNameChange}></AttendeesComponent>
                <br/>
                <div className="form-row mb-3 mt-4">
                    <input className="chooseFile" type="file" accept = "audio/*" id="inputFile" ref={this.fileInput}/>
                </div>
                <div className="form-row mt-5">
                    <Button
                        variant="contained"
                        color="default"
                        startIcon={<CloudUploadIcon />}
                        onClick={() => this.handleFileSubmit(this)}
                    >
                        Upload file
                    </Button>
                </div>
            </form>
        );
    }

    private resetForm() {
        // @ts-ignore
        document.getElementById("uploadAudioForm").reset();
    }
}