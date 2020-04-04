import React, { Component } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "./App.css";
import VoiceRegisterTab from "./Tabs/voiceRegisterTab";
import { MyTable } from "./Tabs/minutesTab";
import UploadTab from "./Tabs/uploadTab";
import { Redirect } from "react-router-dom";
import TopBar from "./TopBar/top-bar.component";

class MainPage extends Component<{}> {
  completedTranscriptionURL =
    "https://us-central1-hacksbc-268409.cloudfunctions.net/transcription-status-check?completedTranscriptions=true";
  inProgressTranscriptionURL =
    "https://us-central1-hacksbc-268409.cloudfunctions.net/transcription-status-check?inProgressTranscriptions=true";

  render() {
    // if (!this.props.currentUser) {
    //   return <Redirect to="/signin" />;
    // }
    return (
      <div className="d-flex flex-column">
        <TopBar />
        <div>
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
              <UploadTab />
            </TabPanel>
            <TabPanel>
              <VoiceRegisterTab />
            </TabPanel>
            <TabPanel>
              <div className="p-5 border-right border-secondary flex-fill text-center">
                <div>
                  <MyTable
                    from={this.completedTranscriptionURL}
                    completed={true}
                  />
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <div className="p-5 border-right border-secondary flex-fill text-center">
                <div>
                  <MyTable
                    from={this.inProgressTranscriptionURL}
                    completed={false}
                  />
                </div>
              </div>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    );
  }
}

export default MainPage;
