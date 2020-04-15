import React from "react";
import { toast } from "react-toastify";
import { css } from "glamor";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import Button from "@material-ui/core/Button";
import { KeyboardDatePicker, KeyboardTimePicker } from "@material-ui/pickers";
import "react-toastify/dist/ReactToastify.css";
import { connect } from "react-redux";
import AsyncSelect from "react-select/async";
import MomentUtils from "@date-io/moment";
import FileUpload from "./Dropzone";
import ScheduleIcon from "@material-ui/icons/Schedule";

toast.configure();

const momentFns = new MomentUtils();
const moment = require('moment');
moment().format();
let toastTime;

interface inputProps {
  organizer: any;
  startTime: any;
  endTime: any;
  meetingName: any;
  meetingDate: any;
  attendees: any;
  audioFile: any;
  placeholder: any;
}


class UploadTab extends React.Component<{ currentUser }, inputProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      organizer: props.currentUser.email,
      startTime: null,
      endTime: null,
      meetingName: "",
      meetingDate: null,
      attendees: [],
      audioFile: null,
      placeholder: momentFns.date()
    };
    this.setState({startTime: this.state.placeholder,
                          endTime: this.state.placeholder})
  }

  handleChangeMeetingName = (event) => {
    this.setState({ meetingName: event.target.value });
  };

  handleChangeOrganizer = (event) => {
    this.setState({ organizer: event.target.value });
  };

  handleChangeDate = (date) => {
    this.setState({ meetingDate: date });
  };

  handleChangeStartTime = (time) => {
    if (!moment(time).isValid()){
      this.setState({ startTime: time });
      return;
    }
    let eTimeMin;
    if (this.state.endTime == null){
      eTimeMin = moment().hour()*60 + moment().minute();
    }else{
      eTimeMin = this.state.endTime.hour()*60 + this.state.endTime.minute();
    }
    let sTimeMin = time.hour()*60 + time.minute();
    if(sTimeMin <= eTimeMin){
      this.setState({ startTime: time });
    }else {
      //Duplicate toast messages being displayed, probably due to async natuer of onChange function calls
      // if (!toast.isActive(toastTime)){
      //   toastTime = toast.error(
      //       <div>
      //         Invalid time selected!
      //         <br />
      //         Start time must be before or equal to end time.
      //       </div>,
      //       {
      //         position: "top-center",
      //         autoClose: 5000,
      //         hideProgressBar: false,
      //         closeOnClick: true,
      //         pauseOnHover: true,
      //         draggable: true,
      //       }
      //   );
      // }
      alert("Invalid time selected, start time must be before end time.");
    }
  };

  handleChangeEndTime = (time) => {
    if (!moment(time).isValid()){
      this.setState({ endTime: time });
      return;
    }
    let sTimeMin;
    if (this.state.startTime == null){
      sTimeMin = moment().hour()*60 + moment().minute();
    }else{
      sTimeMin = this.state.startTime.hour()*60 + this.state.startTime.minute();
    }
    let eTimeMin = time.hour()*60 + time.minute();
    if(sTimeMin <= eTimeMin){
      this.setState({ endTime: time });
    }else {
      alert("Invalid time selected, start time must be before end time.");
    }
  };

  handleAttendeesChange = (values) => {
    this.setState({ attendees: values });
  };

  handleFileChange = (file) => {
    if (
      file &&
      (!this.state.meetingName ||
        (this.state.audioFile &&
          this.state.meetingName === this.state.audioFile.name))
    ) {
      this.setState({ meetingName: file.name });
    } else if (
      !file &&
      this.state.audioFile &&
      this.state.meetingName === this.state.audioFile.name
    ) {
      this.setState({ meetingName: "" });
    }
    this.setState({ audioFile: file });
  };

  getUserIdToken = async () => {
    if (this.props.currentUser) {
      try {
        const token = await this.props.currentUser.getIdToken(false);
        return token;
      } catch (e) {
        console.log(e);
      }
    }
  };

  loadAttendees = async (inputValue) => {
    const token = await this.getUserIdToken();
    return new Promise(function (fulfill, reject) {
      let url =
        "https://us-central1-hacksbc-268409.cloudfunctions.net/attendees";
      if (inputValue && inputValue !== "") {
        url = url + "?search=" + inputValue;
      }
      const request = new XMLHttpRequest();
      const authorizationValue: string = "Bearer " + token;
      request.open("GET", url, true);
      request.setRequestHeader("Authorization", authorizationValue);
      request.onload = function () {
        const res = JSON.parse(request.response);
        fulfill(res.data);
      };
      request.onerror = function () {
        reject("The request failed");
      };
      request.send();
    });
  };

  handleSubmitForm = (event) => {
    let parts: string[]
    try{
       parts = this.state.audioFile.name.split(".");
    }catch (e) {
      return toast.error(
          <div>
            No file selected!
          </div>,
          {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
      );
    }

    let extension: string = parts[parts.length - 1].toLowerCase();
    if (extension === "wav" || extension === "mp3") {
      return this.uploadToCloud();
    } else {
      return toast.error(
        <div>
          FILE NOT SENT!
          <br />
          Only .mp3 or .wav files are accepted.
        </div>,
        {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        }
      );
    }
  };

  uploadToCloud() {
    if (!this.state.meetingName) {
      this.setState({ meetingName: this.state.audioFile.name });
    }
    const metadata = {
      contentType: this.state.audioFile.type,
      organizerUserName: this.state.organizer,
      meetingName: this.state.meetingName,
      startTime: this.state.startTime && momentFns.date(this.state.startTime).format("HH:mm:ss"),
      endTime: this.state.endTime && momentFns.date(this.state.endTime).format("HH:mm:ss"),
      meetingDate: this.state.meetingDate && momentFns.date(this.state.meetingDate).format("YYYY-MM-DD"),
    };
    if (this.state.attendees && this.state.attendees.length > 0) {
      metadata["attendees"] = this.state.attendees;
    }

    const toastId = toast("Uploading in progress, please wait...", {
      position: "top-center",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    //Pass the metadata of the file to cloud function to retrieve a signed URL where the file will be uploaded
    return this.getSignedURL(metadata)
      .then((signedURL: any) => {
        this.sendAudioFile(signedURL).then((result: any) => {
          this.resetForm();
          return toast.update(toastId, {
            render: "File Upload Successful!",
            type: toast.TYPE.SUCCESS,
            className: css({
              transform: "rotateY(360deg)",
              transition: "transform 0.6s",
            }),
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        });
      })
      .catch((error) => {
        console.log(`In catch: ${error}`);
        return toast.update(toastId, {
          render: <div>FILE NOT SENT!</div>,
          type: toast.TYPE.ERROR,
          className: css({
            transform: "rotateY(360deg)",
            transition: "transform 0.6s",
          }),
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      });
  }

  //HTTP request using XMLHTTP
  async getSignedURL(metadata: any) {
    const token = await this.getUserIdToken();
    return new Promise(function (fulfill, reject) {
      const URL =
        "https://us-central1-hacksbc-268409.cloudfunctions.net/upload_audio";
      const request = new XMLHttpRequest();
      const authorizationValue: string = "Bearer " + token;
      request.open("POST", URL, true);
      request.setRequestHeader("Content-Type", "application/json");
      request.setRequestHeader("Authorization", authorizationValue);
      request.onreadystatechange = function () {
        if (
          request.readyState === XMLHttpRequest.DONE &&
          request.status === 200
        ) {
          console.log(request.responseText);
        }
      };
      request.onload = function () {
        fulfill(request.response);
      };
      request.onerror = function () {
        reject("The request failed");
      };
      request.send(JSON.stringify(metadata));
    });
  }

  sendAudioFile(signedURL: any) {
    let file = this.state.audioFile;
    return new Promise(function (fulfill, reject) {
      let formData = new FormData();
      formData.append("file", file);
      const request = new XMLHttpRequest();
      request.open("PUT", signedURL, true);
      request.setRequestHeader("Content-Type", file.type);
      request.onreadystatechange = function () {
        if (
          request.readyState === XMLHttpRequest.DONE &&
          request.status === 200
        ) {
          console.log(request.responseText);
        }
      };
      request.onload = function () {
        fulfill(request.response);
      };
      request.onerror = function () {
        reject("The request failed");
      };
      request.send(formData);
    });
  }

  render() {
    return (
      <form id="uploadAudioForm" className="p-5 shadow-lg card-m">
        <div className="form-group mb-5">
          <FileUpload
            onSelectFile={this.handleFileChange}
            file={this.state.audioFile}
          ></FileUpload>
        </div>
        <div className="d-flex justify-content-between mb-5 mt-2">
          <div className="d-flex w-50 mr-5">
            <label className="font-weight-bold w-50 mt-1">Meeting Name:</label>
            <input
              className="form-control"
              type="text"
              value={this.state.meetingName}
              onChange={this.handleChangeMeetingName}
            />
          </div>
          <div className="d-flex w-50">
            <label className="font-weight-bold w-50 mt-1">
              Meeting Organizer:
            </label>
            <input
              className="form-control"
              type="text"
              value={this.state.organizer}
              onChange={this.handleChangeOrganizer}
            />
          </div>
        </div>
        <div className="d-flex justify-content-between mb-5 mt-3">
          <div className="d-flex w-33 mr-5">
            <label className="font-weight-bold w-75 mt-1">Meeting Date:</label>
            <KeyboardDatePicker
              disableToolbar
              variant="inline"
              format="DD/MM/YYYY"
              placeholder={this.state.placeholder.format("L")}
              value={this.state.meetingDate}
              onChange={this.handleChangeDate}
            />
          </div>
          <div className="d-flex w-33 mr-5">
            <label className="font-weight-bold w-75 mt-1">Start Time:</label>
            <KeyboardTimePicker
              ampm={false}
              format="HH:mm"
              variant="inline"
              placeholder={this.state.placeholder.format("LT")}
              value={this.state.startTime}
              onChange={this.handleChangeStartTime}
              keyboardIcon={<ScheduleIcon></ScheduleIcon>}
            />
          </div>
          <div className="d-flex w-33">
            <label className="font-weight-bold w-75 mt-1">End Time:</label>
            <KeyboardTimePicker
              ampm={false}
              format="HH:mm"
              variant="inline"
              placeholder={this.state.placeholder.format("LT")}
              value={this.state.endTime}
              onChange={this.handleChangeEndTime}
              keyboardIcon={<ScheduleIcon></ScheduleIcon>}
            />
          </div>
        </div>
        <div className="form-group mb-5">
          <label className="font-weight-bold">Attendees:</label>
          <AsyncSelect
            defaultOptions
            isMulti
            value={this.state.attendees}
            onChange={this.handleAttendeesChange}
            loadOptions={this.loadAttendees}
            getOptionLabel={(option) => option.email}
            getOptionValue={(option) => option.email}
          ></AsyncSelect>
        </div>
        <Button
          className="form-group"
          variant="contained"
          color="default"
          startIcon={<CloudUploadIcon />}
          onClick={this.handleSubmitForm}
        >
          Submit
        </Button>
      </form>
    );
  }

  private resetForm() {
    this.setState({
      organizer: "",
      startTime: null,
      endTime: null,
      meetingName: "",
      meetingDate: null,
      attendees: [],
      audioFile: null,
    });
  }
}

const mapStateToProps = (state) => ({
  currentUser: state.user.currentUser,
});

export default connect(mapStateToProps)(UploadTab);
