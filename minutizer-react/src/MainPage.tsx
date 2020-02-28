import React, {Component} from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import 'react-tabs/style/react-tabs.css';
import './App.css';
import VoiceRegisterTab from './Tabs/voiceRegisterTab';
import MinutesTab from './Tabs/minutesTab';
import UploadTab from './Tabs/uploadTab';


class MainPage extends Component {
    render() {
        return (
            <div className="d-flex flex-column">
                <div className="bg-danger text-white text-center p-5">
                    <h1>Welcome to Minutizer</h1>
                </div>
                <div>
                    <Tabs>
                        <TabList>
                            <Tab style={{borderTopLeftRadius: "15px", borderTopRightRadius: "15px", marginTop: "5px", marginLeft: "15px", fontWeight: "bold", fontSize: "20px"}}>Upload Audio</Tab>
                            <Tab style={{borderTopLeftRadius: "15px", borderTopRightRadius: "15px", marginTop: "5px", fontWeight: "bold", fontSize: "20px"}}>Register Voice</Tab>
                            <Tab style={{borderTopLeftRadius: "15px", borderTopRightRadius: "15px", marginTop: "5px", fontWeight: "bold", fontSize: "20px"}}>Request Minutes</Tab>
                        </TabList>
                        <TabPanel>
                            <UploadTab />
                        </TabPanel>
                        <TabPanel>
                            <VoiceRegisterTab />
                        </TabPanel>
                        <TabPanel>
                            <MinutesTab />
                        </TabPanel>
                    </Tabs>
                </div>
                
            </div>

        );
    }
}

export default MainPage;
