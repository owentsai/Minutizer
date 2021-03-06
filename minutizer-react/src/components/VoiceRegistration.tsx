import React, { Component } from "react";
import { ReactMic } from "react-mic";
import MicIcon from "@material-ui/icons/Mic";
import StopIcon from "@material-ui/icons/Stop";
import TimerIcon from "@material-ui/icons/Timer";
import Button from "@material-ui/core/Button";
import Alert from "@material-ui/lab/Alert";
import { connect } from "react-redux";
import MicRecorder from "mic-recorder-to-mp3";
import CircularProgress from "@material-ui/core/CircularProgress";

interface VoiceRegisterTabStates {
  recorder: any;
  isRecording: boolean;
  timer: number;
  hasStarted: boolean;
  countdownTimer: number;
  isUserEnrolled: string;
}

var interval;

class VoiceRegisterTab extends Component<
  { currentUser },
  VoiceRegisterTabStates
> {
  constructor(props) {
    super(props);
    this.state = {
      recorder: new MicRecorder({ bitRate: 160 }),
      hasStarted: false,
      isRecording: false,
      countdownTimer: 3,
      timer: 0,
      isUserEnrolled: "LOADING",
    };
    this.registerVoice = this.registerVoice.bind(this);
    this.getUserIdToken = this.getUserIdToken.bind(this);
  }

  componentDidMount() {
    let enrolmentStatus: Promise<any> = this.getEnrollmentStatus().then(
      (value) => {
        this.setState({
          isUserEnrolled: value,
        });
      }
    );
    var statusUpdateCounter: number = 0;
    interval = setInterval(() => {
      let currTime: number = this.state.timer;
      let currCountdown: number = this.state.countdownTimer;
      if (this.state.hasStarted || this.state.isRecording) {
        if (this.state.hasStarted) {
          if (this.state.countdownTimer === 0) {
            this.startRecording();
          } else {
            this.setState({
              countdownTimer: currCountdown - 1,
            });
          }
        } else if (this.state.isRecording) {
          if (this.state.timer >= 30) {
            this.stopRecording();
          } else {
            this.setState({
              timer: currTime + 1,
            });
          }
        }
      } else {
        this.setState({
          timer: 0,
          countdownTimer: 3,
        });
      }
      if (this.state.isUserEnrolled == "INPROGRESS") {
        statusUpdateCounter++;
        enrolmentStatus = this.getEnrollmentStatus().then((value) => {
          if (
            (value == "SUCCESS" || value == "FAILURE") &&
            statusUpdateCounter > 6
          ) {
            this.setState({
              isUserEnrolled: value,
            });
            statusUpdateCounter = 0;
          }
        });
      }
    }, 1000);
  }

  async getUserIdToken() {
    if (this.props.currentUser) {
      try {
        return await this.props.currentUser.getIdToken(false);
      } catch (e) {
        console.log(e);
      }
    }
  }

  async getEnrollmentStatus(): Promise<string> {
    console.log("before: " + this.state.isUserEnrolled);
    const voiceEnrollmentStatusURL: any =
      process.env.REACT_APP_VOICE_ENROLLMENT_STATUS_URL;
    const authorizationHeaderValue: string =
      "Bearer " + (await this.getUserIdToken());
    const header: Headers = new Headers();
    header.append("Authorization", authorizationHeaderValue);
    const result = await fetch(voiceEnrollmentStatusURL, {
      method: "GET",
      headers: header,
    });
    const statusJSON = await result.json();
    console.log(statusJSON);
    const enrollmentStatus: string = statusJSON.status;
    console.log("after: " + this.state.isUserEnrolled);
    return enrollmentStatus;
  }

  startButtonHandler = () => {
    this.setState({
      hasStarted: true,
    });
  };

  startRecording = () => {
    this.state.recorder
      .start()
      .then(() => {
        this.setState({
          countdownTimer: 3,
          isRecording: true,
          hasStarted: false,
        });
      })
      .catch((e) => {
        console.log(e);
      });
  };

  stopRecording = () => {
    this.setState({
      isRecording: false,
    });
  };

  async registerVoice(recordedBlob: any) {
    const recordedFile = await this.state.recorder
      .stop()
      .getMp3()
      .then(([buffer, blob]) => {
        return new File(buffer, "recorded_audio.mp3", {
          type: blob.type,
          lastModified: Date.now(),
        });
      });
    try {
      const authorizationHeaderValue: string =
        "Bearer " + (await this.getUserIdToken());
      const signedURL = await this.getSignedURL(
        { contentType: recordedFile.type },
        authorizationHeaderValue
      );
      await this.sendAudioFile(signedURL, recordedFile);
      this.setState({ isUserEnrolled: "INPROGRESS" });
    } catch (err) {
      console.error("Catch error when uploading voice sample: /n" + err);
    }
  }

  //HTTP request using XMLHTTP
  getSignedURL(metadata: any, authHeaderValue: string) {
    return new Promise(function (fulfill, reject) {
      const URL: any = process.env.REACT_APP_UPLOAD_VOICE_ENROLLMENT_URL;
      const request = new XMLHttpRequest();
      request.open("POST", URL, true);
      request.setRequestHeader("Content-Type", "application/json");
      request.setRequestHeader("Authorization", authHeaderValue);
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

  sendAudioFile(signedURL: any, recordedFile: any) {
    return new Promise(function (fulfill, reject) {
      let formData = new FormData();
      formData.append("file", recordedFile);
      const request = new XMLHttpRequest();
      request.open("PUT", signedURL, true);
      request.setRequestHeader("Content-Type", recordedFile.type);

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
    var currButton;
    var enrolButtonColor =
      this.state.timer < 25 ? "bg-primary text-white" : "bg-warning text-white";
    var enrolStatus;
    var inProgressSpin;

    if (!this.state.hasStarted && !this.state.isRecording) {
      if (this.state.isUserEnrolled == "INPROGRESS") {
        currButton = (
          <Button
            style={{ width: "200px", height: "35px" }}
            variant="contained"
            color="secondary"
            disabled
            startIcon={<MicIcon />}
          >
            START
          </Button>
        );
      } else {
        currButton = (
          <Button
            style={{ width: "200px", height: "35px" }}
            variant="contained"
            color="secondary"
            startIcon={<MicIcon />}
            onClick={this.startButtonHandler}
          >
            START
          </Button>
        );
      }
    } else if (this.state.hasStarted) {
      currButton = (
        <Button
          style={{ width: "200px", height: "35px" }}
          variant="contained"
          className="bg-success text-white"
          startIcon={<TimerIcon />}
        >
          READY IN {this.state.countdownTimer}s
        </Button>
      );
    } else {
      if (this.state.timer < 15) {
        currButton = (
          <Button
            style={{ width: "200px", height: "35px" }}
            variant="contained"
            className={enrolButtonColor}
            startIcon={<StopIcon />}
          >
            ENROL {("0" + this.state.timer).slice(-2)}S
          </Button>
        );
      } else {
        currButton = (
          <Button
            style={{ width: "200px", height: "35px" }}
            variant="contained"
            className={enrolButtonColor}
            startIcon={<StopIcon />}
            onClick={this.stopRecording}
          >
            ENROL {("0" + this.state.timer).slice(-2)}S
          </Button>
        );
      }
    }

    if (this.state.isUserEnrolled === "NODATA") {
      enrolStatus = (
        <Alert variant="outlined" severity="warning">
          You have not been enrolled.
        </Alert>
      );
    } else if (this.state.isUserEnrolled === "FAILURE") {
      enrolStatus = (
        <Alert variant="outlined" severity="error">
          Your enrolment has failed. Please try again!
        </Alert>
      );
    } else if (this.state.isUserEnrolled === "SUCCESS") {
      enrolStatus = (
        <Alert variant="outlined" severity="success">
          You have successfully enrolled!
        </Alert>
      );
    } else if (this.state.isUserEnrolled === "INPROGRESS") {
      inProgressSpin = (
        <div className="pr-3">
          <CircularProgress color="primary" />
        </div>
      );
      enrolStatus = (
        <Alert variant="outlined" severity="info">
          We are currently processing your enrolment.
        </Alert>
      );
    } else {
      enrolStatus = <CircularProgress color="secondary" />;
    }

    return (
      <div className="p-3 shadow-lg card-m">
        <div className="d-flex flex-column align-items-center">
          <div className="d-flex flex-row">
            {inProgressSpin}
            {enrolStatus}
          </div>
          <ReactMic
            record={this.state.isRecording}
            onStop={this.registerVoice}
            className="d-flex align-self-stretch rounded-lg m-3"
            strokeColor="#3944BC"
            backgroundColor="#262626"
            mimeType="audio/webm"
          />
          <div className="pb-1">{currButton}</div>
        </div>
        <div className="ml-5 mr-5">
          <h3 className="font-weight-bold pb-3">INSTRUCTIONS: </h3>
          <ol>
            <li className="pb-3">
              Read the two questions below and formulate an approximately
              10-second response per question.
            </li>
            <li className="pb-3">
              Click <b>START</b> to start voice enrolment. There will be a
              3-second countdown before the recording starts.
            </li>
            <li className="pb-3">
              Respond to the two questions and read the prompt shown below in
              your regular speaking rate and tone. A timer will be displayed to
              help you plan your time and there is a time limit of 30 seconds.
            </li>
            <li className="pb-3">
              If you finish early, click <b>ENROL</b> to stop recording and
              register your voice to the system. The recording will also stops
              in 30 seconds and your voice will be automatically registered.
            </li>
          </ol>
          <ul style={{ listStyleType: "none" }}>
            <li>
              <em>
                <b>Question 1: </b>What do you plan to accomplish in the next 3
                days?
              </em>
            </li>
            <li>
              <em>
                <b>Question 2: </b>What did you have for dinner last night?
              </em>
            </li>
            <li>
              <em>
                <b>Prompt: </b>For a given logic, such as first-order logic, the
                different derivation systems will give different explications of
                what it is for a sentence to be a theorem and what it means for
                a sentence to be derivable from some others.
              </em>
            </li>
          </ul>
        </div>
      </div>
    );
  }
}
const mapStateToProps = ({ user }) => ({
  currentUser: user.currentUser,
});

export default connect(mapStateToProps)(VoiceRegisterTab);
