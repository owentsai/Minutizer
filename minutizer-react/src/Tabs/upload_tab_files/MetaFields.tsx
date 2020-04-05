import React from "react";
import { toast } from "react-toastify";
import { css } from "glamor";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import Button from "@material-ui/core/Button";
import "react-toastify/dist/ReactToastify.css";
import TextField from "@material-ui/core/TextField";
import { connect } from "react-redux";
import AsyncSelect from 'react-select/async';

toast.configure();

interface inputProps {
  organizer: any;
  startTime: any;
  endTime: any;
  meetingName: any;
  meetingDate: any;
  attendees: any;
}

class MetaFields extends React.Component<{ currentUser }, inputProps> {
  private fileInput = React.createRef<HTMLInputElement>();
  private toastId: any = null;
  constructor(props: any) {
    super(props);
    this.state = {
      organizer: "",
      startTime: "00:00",
      endTime: "00:00",
      meetingName: "",
      meetingDate: "2020-01-01",
      attendees: []
    };
    this.handleChangeOrganizer = this.handleChangeOrganizer.bind(this);
    this.handleChangeStartTime = this.handleChangeStartTime.bind(this);
    this.handleChangeEndTime = this.handleChangeEndTime.bind(this);
    this.handleFileSubmit = this.handleFileSubmit.bind(this);
    this.handleChangeMeetingName = this.handleChangeMeetingName.bind(this);
    this.handleChangeDate = this.handleChangeDate.bind(this);
  }

  handleChangeOrganizer(event: any) {
    this.setState({ organizer: event.target.value });
  }

  handleChangeDate(event: any) {
    let date = event.target.value;
    let dateArr = date.split("-");
    let userDate = new Date(dateArr[0], dateArr[1] - 1, dateArr[2]);
    let currentDate = new Date();
    if (userDate > currentDate) {
      toast.error(<div>INVALID DATE SELECTED!</div>, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      //Reset to default date
      this.setState({ meetingDate: "2020-01-01" });
    } else {
      this.setState({ meetingDate: date });
    }
  }

  handleChangeStartTime(event: any) {
    this.setState({ startTime: event.target.value });
  }

  handleChangeEndTime(event: any) {
    this.setState({ endTime: event.target.value });
  }

  handleChangeMeetingName(event: any) {
    this.setState({ meetingName: event.target.value });
  }

  handleAttendeesChange = values => {
    this.setState({ attendees: values });
  }

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
    return new Promise(function(fulfill, reject) {
      let url = "https://us-central1-hacksbc-268409.cloudfunctions.net/attendees";
      if (inputValue && inputValue !== "") {
        url = url + "?search=" + inputValue
      }
      const request = new XMLHttpRequest();
      const authorizationValue: string = "Bearer " + token;
      request.open("GET", url, true);
      request.setRequestHeader("Authorization", authorizationValue);
      request.onload = function() {
        const res = JSON.parse(request.response)
        fulfill(res.data);
      };
      request.onerror = function() {
        reject("The request failed");
      };
      request.send();
    });
  };

  handleFileSubmit(event: any): boolean {
    try {
      // @ts-ignore: Object is possibly 'null'.
      let parts: string[] = this.fileInput.current.files[0].name.split(".");
      let extension: string = parts[parts.length - 1].toLowerCase();
      if (extension === "wav" || extension === "mp3") {
        return this.uploadToCloud();
      } else {
        toast.error(
          <div>
            FILE NOT SENT!
            <br />
            Only .mp3 or .wav files accepted
          </div>,
          {
            position: "top-center",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          }
        );
        // @ts-ignore
        document.getElementById("inputFile").value = "";
        return false;
      }
    } catch (e) {
      console.log(e.message);
      return false;
    }
  }

  uploadToCloud(): boolean {
    const metadata = {
      // @ts-ignore: Object is possibly 'null'.
      contentType: this.fileInput.current.files[0].type,
      organizerUserName: this.state.organizer,
      meetingName: this.state.meetingName,
      startTime: this.state.startTime + ":00",
      endTime: this.state.endTime + ":00",
      meetingDate: this.state.meetingDate
    };
    if (this.state.attendees.length > 0) {
      metadata["attendees"] = this.state.attendees;
    }
    if (!this.state.meetingName) {
      // @ts-ignore
      this.setState({ meetingName: this.fileInput.current.files[0].name });
      // @ts-ignore
      metadata["meetingName"] = this.fileInput.current.files[0].name;
    }

    this.toastId = toast("Uploading in progress, please wait...", {
      position: "top-center",
      autoClose: false,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });

    //Pass the metadata of the file to cloud function to retrieve a signed URL where the file will be uploaded
    const metadataPromise = this.getSignedURL(metadata);
    let signedURL;
    metadataPromise
      .then((result: any) => {
        signedURL = result;
        const sendFilePromise = this.sendAudioFile(signedURL);
        let toastRef = this.toastId;
        sendFilePromise
          .then((result: any) => {
            toast.update(toastRef, {
              render: "File Upload Successful!",
              type: toast.TYPE.SUCCESS,
              className: css({
                transform: "rotateY(360deg)",
                transition: "transform 0.6s"
              }),
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true
            });
            this.resetForm();
            return true;
          })
          .catch(error => {
            //Not yet able to distinguish which username is invalid (not in the system)
            toast.update(toastRef, {
              render: (
                <div>
                  FILE NOT SENT!
                  <br />
                  Invalid username in metadata
                </div>
              ),
              type: toast.TYPE.ERROR,
              className: css({
                transform: "rotateY(360deg)",
                transition: "transform 0.6s"
              }),
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true
            });
            this.resetForm();
            return false;
          });
      })
      .catch(error => {
        console.log(`In catch: ${error}`);
      });
    return false;
  }

  private convertToStringArray(attendees: any): string[] {
    let attendeeStringArr: string[] = [];
    for (let attendee of attendees) {
      attendeeStringArr.push(attendee.name);
    }
    // console.log(attendeeStringArr);
    return attendeeStringArr;
  }

  sendAudioFile(signedURL: any) {
    return new Promise(function(fulfill, reject) {
      //Getting the audio file from input tag
      let fileInput = document.getElementById("inputFile");

      // @ts-ignore
      let file = fileInput.files[0];
      // @ts-ignore
      let fileType = fileInput.files[0].type;
      console.log("the fileType is " + fileType);
      let formData = new FormData();
      formData.append("file", file);

      const request = new XMLHttpRequest();
      request.open("PUT", signedURL, true);
      request.setRequestHeader("Content-Type", fileType);
      request.onreadystatechange = function() {
        if (
          request.readyState === XMLHttpRequest.DONE &&
          request.status === 200
        ) {
          console.log(request.responseText);
        }
      };
      request.onload = function() {
        fulfill(request.response);
      };
      request.onerror = function() {
        reject("The request failed");
      };

      request.send(formData);
    });
  }

  //HTTP request using XMLHTTP
  async getSignedURL(metadata: any) {
    const token = await this.getUserIdToken();
    return new Promise(function(fulfill, reject) {
      const URL =
        "https://us-central1-hacksbc-268409.cloudfunctions.net/upload_audio";
      const request = new XMLHttpRequest();
      const authorizationValue: string = "Bearer " + token;
      request.open("POST", URL, true);
      request.setRequestHeader("Content-Type", "application/json");
      request.setRequestHeader("Authorization", authorizationValue);
      request.onreadystatechange = function() {
        if (
          request.readyState === XMLHttpRequest.DONE &&
          request.status === 200
        ) {
          console.log(request.responseText);
        }
      };
      request.onload = function() {
        fulfill(request.response);
      };
      request.onerror = function() {
        reject("The request failed");
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
              <input
                id="meetingName"
                className="Meta-input ml-4"
                type="text"
                value={this.state.meetingName}
                onChange={this.handleChangeMeetingName}
              />
            </label>
          </div>
          <div className="form-group col-md-6">
            <label className="Meta-label font-weight-bold">
              Meeting Organizer:
              <input
                id="organizerName"
                className="Meta-input ml-4"
                type="text"
                value={this.state.organizer}
                onChange={this.handleChangeOrganizer}
              />
            </label>
          </div>
        </div>
        <div className="form-row mb-3">
          <div className="form-group col-md-4">
            <label className="Meta-label font-weight-bold">
              Meeting Date:
              <br />
              <TextField
                id="date"
                label="Date"
                type="date"
                defaultValue="2020-01-01"
                value={this.state.meetingDate}
                InputLabelProps={{
                  shrink: true
                }}
                onChange={this.handleChangeDate.bind(this)}
              />
            </label>
          </div>
          <div className="form-group col-md-4">
            <label className="Meta-label font-weight-bold">
              Start Time:
              <br />
              <TextField
                id="startTime"
                label="Time"
                type="time"
                defaultValue="00:00:00"
                value={this.state.startTime}
                InputLabelProps={{
                  shrink: true
                }}
                onChange={this.handleChangeStartTime.bind(this)}
              />
            </label>
          </div>
          <div className="form-group col-md-4">
            <label className="Meta-label font-weight-bold">
              End Time:
              <br />
              <TextField
                id="endTime"
                label="Time"
                type="time"
                defaultValue="00:00:00"
                value={this.state.endTime}
                InputLabelProps={{
                  shrink: true
                }}
                onChange={this.handleChangeEndTime.bind(this)}
              />
            </label>
          </div>
        </div>
        <AsyncSelect
          defaultOptions
          isMulti
          loadOptions={this.loadAttendees}
          getOptionLabel={option => option.email}
          getOptionValue={option => option.email}
          value={this.state.attendees}
          onChange={this.handleAttendeesChange}
          >
        </AsyncSelect>

        <br />
        <div className="form-row mb-3 mt-4">
          <input
            className="chooseFile"
            type="file"
            accept="audio/*"
            id="inputFile"
            ref={this.fileInput}
          />
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
    this.setState({
      organizer: "",
      startTime: "00:00",
      endTime: "00:00",
      meetingName: "",
      meetingDate: "2020-01-01",
      attendees: []
    });
    // @ts-ignore
    this.attendeesComponent.current.resetState();
  }
}

const mapStateToProps = state => ({
  currentUser: state.user.currentUser
});

export default connect(mapStateToProps)(MetaFields);
