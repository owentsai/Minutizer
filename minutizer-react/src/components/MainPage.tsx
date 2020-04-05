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
              <Tab
                style={{
                  borderTopLeftRadius: "15px",
                  borderTopRightRadius: "15px",
                  marginTop: "5px",
                  marginLeft: "15px",
                  fontWeight: "bold",
                  fontSize: "20px"
                }}
              >
                Upload Audio
              </Tab>
              <Tab
                style={{
                  borderTopLeftRadius: "15px",
                  borderTopRightRadius: "15px",
                  marginTop: "5px",
                  fontWeight: "bold",
                  fontSize: "20px"
                }}
              >
                Register Voice
              </Tab>
              <Tab
                style={{
                  borderTopLeftRadius: "15px",
                  borderTopRightRadius: "15px",
                  marginTop: "5px",
                  fontWeight: "bold",
                  fontSize: "20px"
                }}
              >
                Request Minutes
              </Tab>
              <Tab
                style={{
                  borderTopLeftRadius: "15px",
                  borderTopRightRadius: "15px",
                  marginTop: "5px",
                  fontWeight: "bold",
                  fontSize: "20px"
                }}
              >
                In Progress Requests
              </Tab>
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
