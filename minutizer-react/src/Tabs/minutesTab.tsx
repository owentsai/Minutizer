import React, { Component } from "react";
import { MyTable } from "./myTable";
import "./style.css"
import axios from 'axios';
const postURL = `https://us-central1-hacksbc-268409.cloudfunctions.net/meeting-minutes-email`


class MinutesTab extends Component {
    
    state = {
        meetings: [],
        datafetched: false,
        minutesSelected: false,
        sendAccess: false,
        sendButton: false,
        requestButton: false,
    }

    componentWillMount = () => {
        this.fetchMeetings();
    }

    fetchMeetings = () => {
        //fetch("https://us-central1-hacksbc-268409.cloudfunctions.net/transcription-status-check?")
        fetch("https://us-central1-hacksbc-268409.cloudfunctions.net/transcription-status-check?completedTranscriptions=true")
            .then(response => response.json())
            .then(data => this.setState({ meetings: data, datafetched: true }));
    }

    sendButtonHandler = () => {
        this.setState({sendButton: true});
        this.setState({requestButton: false});

        const selectedId = localStorage.getItem("selectedMeetingId");
        const selectedName = localStorage.getItem("selectedMeetingName");
        // post
        axios.post(postURL, {
            "meetingId": selectedId,
            "meetingName": selectedName,
         })
        .then(res => console.log("email success: " + res))
        .catch(err => console.log("email failed: " + err))
    }



    requestButtonHandler = () => {
        this.setState({requestButton: true});
        this.setState({sendButton: false});
        /*
        const selectedIds : string[] = JSON.parse(localStorage.getItem("selectedMeetingIds"));
        console.log(selectedIds);
        const selectedNames = localStorage.getItem("selectedMeetingNames");
        console.log(selectedNames);
        */
       // single selection only!
       const selectedId = localStorage.getItem("selectedMeetingId");
       const selectedName = localStorage.getItem("selectedMeetingName");
       console.log(selectedId);
       console.log(selectedName);

       
        // post
        fetch(postURL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'meetingId': selectedId,
                'meetingName': selectedName,
            })
        })
        .then(res => console.log('email success: ' + res))
        .catch(err => console.log('email failed: ' + err))
    }


    renderMessage = () => {
        if (this.state.sendButton && this.state.sendAccess) {
            return <div>Minutes sent</div>;
        } else if (this.state.sendButton && !this.state.sendAccess) {
            return <div>Do not have admin access to minutes</div>
        } else if (this.state.requestButton) {
            return <div>Request sent.  Please wait for response</div>
        }
    }

    render() {
        let detach;
        if (!this.state.datafetched) {
            detach =<div></div>;
        } else {
            detach =<div><MyTable data={this.state.meetings}/></div>;
        }
        return(
            <div className="d-flex flex-row" style={{height: "670px"}}>
                <div className="p-5 bg-white border-right border-secondary flex-fill text-center">
                    {detach}
                </div>
                <div className="p-5 bg-white flex-fill text-center d-flex flex-column">
                    <div style={{fontSize: "30px"}} className="font-weight-bold">Select a file on the left</div>
                    <div className="p-5 d-flex flex-row justify-content-center">
                        {/* <button onClick={this.sendButtonHandler} type="button" className="p-3 m-4 btn btn-primary custom text-center">Send</button> */}
                        <button onClick={this.requestButtonHandler} type="button" className="p-3 m-4 btn btn-info custom text-center">Request</button>
                    </div>
                    {this.renderMessage()}
                </div>
            </div>
        );
    }
}
export default MinutesTab;
