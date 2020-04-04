import React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import { auth } from "../firebase/firebase.utils";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1
    },
    title: {
      flexGrow: 1
    },
    logOutButton: {}
  })
);

const TopBar = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography variant="h2" className={classes.title}>
            Welcome To Minutizer
          </Typography>
          <Button
            className={classes.logOutButton}
            onClick={() => auth.signOut()}
            size="large"
          >
            Log Out
          </Button>
        </Toolbar>
      </AppBar>
    </div>
  );
};
export default TopBar;
