import React, { Component } from "react";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import { Route, Switch, Link } from "react-router-dom";
import "./../App.css";
import VoiceRegisterTab from "./VoiceRegistration";
import MyTable from "./Minutes";
import UploadAudio from "./UploadAudio";
import Header from "./Header";
import {
  createMuiTheme,
  ThemeProvider,
  makeStyles,
} from "@material-ui/core/styles";

import GraphicEqRoundedIcon from "@material-ui/icons/GraphicEqRounded";
import MicRoundedIcon from "@material-ui/icons/MicRounded";
import CheckCircleRoundedIcon from "@material-ui/icons/CheckCircleRounded";
import HourglassEmptyRoundedIcon from "@material-ui/icons/HourglassEmptyRounded";

const completedTranscriptionURL =
  "https://us-central1-hacksbc-268409.cloudfunctions.net/transcription-status-check?completedTranscriptions=true";
const inProgressTranscriptionURL =
  "https://us-central1-hacksbc-268409.cloudfunctions.net/transcription-status-check?inProgressTranscriptions=true";

const theme = createMuiTheme({
  palette: {
    primary: {
      main: "#d32f2f",
    },
    secondary: {
      main: "#d32f2f",
    },
  },
  overrides: {},
});

const useStyles = makeStyles({
  selected: {
    "&:focus": {
      outline: "none",
    },
  },
});

function NavigationTabs() {
  const classes = useStyles();
  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="fullWidth"
        indicatorColor="secondary"
        textColor="secondary"
        centered
      >
        <Tab
          className={classes.selected}
          icon={<GraphicEqRoundedIcon />}
          label="Upload Meeting Recording"
          component={Link}
          to="/main/uploadAudio"
        ></Tab>
        <Tab
          className={classes.selected}
          icon={<MicRoundedIcon />}
          label="Register Voice"
          component={Link}
          to="/main/registerVoice"
        ></Tab>
        <Tab
          className={classes.selected}
          icon={<CheckCircleRoundedIcon />}
          label="Request Meeting Minutes"
          component={Link}
          to="/main/requestMinutes"
        ></Tab>
        <Tab
          className={classes.selected}
          icon={<HourglassEmptyRoundedIcon />}
          label="In Progress Meetings"
          component={Link}
          to="/main/inProgressRequests"
        ></Tab>
      </Tabs>
      <Switch>
        <Route path="/main/uploadAudio">
          <UploadAudio />
        </Route>
        <Route path="/main/registerVoice">
          <VoiceRegisterTab />
        </Route>
        <Route path="/main/requestMinutes">
          <MyTable from={completedTranscriptionURL} completed={true} />
        </Route>
        <Route path="/main/inProgressRequests">
          <MyTable from={inProgressTranscriptionURL} completed={false} />
        </Route>
      </Switch>
    </div>
  );
}

export default class MainPage extends Component {
  render() {
    return (
      <div className="d-flex flex-column">
        <ThemeProvider theme={theme}>
          <Header />
          <NavigationTabs />
        </ThemeProvider>
      </div>
    );
  }
}
