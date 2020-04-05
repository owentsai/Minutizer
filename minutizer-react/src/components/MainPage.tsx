import React, { Component } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "./../App.css";
import VoiceRegisterTab from "./VoiceRegistration";
import MyTable from "./Minutes";
import UploadAudio from "./UploadAudio";
import Header from "./Header";

class MainPage extends Component<{}> {
  completedTranscriptionURL =
    "https://us-central1-hacksbc-268409.cloudfunctions.net/transcription-status-check?completedTranscriptions=true";
  inProgressTranscriptionURL =
    "https://us-central1-hacksbc-268409.cloudfunctions.net/transcription-status-check?inProgressTranscriptions=true";

  render() {
    return (
      <div className="d-flex flex-column">
        <Header/>
        <div className="mt-3">
          <Tabs>
            <TabList>
              <Tab>Upload Audio</Tab>
              <Tab>Register Voice</Tab>
              <Tab>Request Minutes</Tab>
              <Tab>In Progress Requests</Tab>
            </TabList>
            <TabPanel>
              <UploadAudio />
            </TabPanel>
            <TabPanel>
              <VoiceRegisterTab />
            </TabPanel>
            <TabPanel>
              <MyTable
                from={this.inProgressTranscriptionURL}
                completed={false}
              />
            </TabPanel>
            <TabPanel>
              <MyTable
                from={this.completedTranscriptionURL}
                completed={true}
              />
            </TabPanel>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default MainPage;
