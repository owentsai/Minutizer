import React, {Component} from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import 'react-tabs/style/react-tabs.css';
import './App.css';
import TranscribeTab from './Tabs/transcribeTab';
import VoiceRegisterTab from './Tabs/voiceRegisterTab';
import MinutesTab from './Tabs/minutesTab';
import UploadTab from './Tabs/uploadTab';

class MainPage extends Component {
    render() {
        return (
            <div>
                <header className="App-header">
                    <h1>Welcome to Minutizer</h1>
                </header>
                <Tabs>
                    <TabList>
                        <Tab>Upload Audio</Tab>
                        <Tab>Transcribe</Tab>
                        <Tab>Register Voice</Tab>
                        <Tab>Request Minutes</Tab>
                    </TabList>
                    <TabPanel>
                        <UploadTab />
                    </TabPanel>
                    <TabPanel>
                        <TranscribeTab />
                    </TabPanel>
                    <TabPanel>
                        <VoiceRegisterTab />
                    </TabPanel>
                    <TabPanel>
                        <MinutesTab />
                    </TabPanel>
                </Tabs>
            </div>

        );
    }
}

export default MainPage;
