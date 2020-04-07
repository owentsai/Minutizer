import React, { Component, useState } from "react";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Paper from "@material-ui/core/Paper";
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
  const [value, setValue] = useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <div>
      <Paper elevation={2}>
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
            icon={<HourglassEmptyRoundedIcon />}
            label="Recordings Being Processed"
            component={Link}
            to="/main/inProgressProcessings"
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
            icon={<MicRoundedIcon />}
            label="Register Voice"
            component={Link}
            to="/main/registerVoice"
          ></Tab>
        </Tabs>
      </Paper>
      <Switch>
        <Route path="/main/uploadAudio">
          <UploadAudio />
        </Route>
        <Route path="/main/registerVoice">
          <VoiceRegisterTab />
        </Route>
        <Route
          path="/main/requestMinutes"
          component={(props) => <MyTable {...props} completed={true} />}
        ></Route>
        <Route
          path="/main/inProgressProcessings"
          component={(props) => <MyTable {...props} completed={false} />}
        ></Route>
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
