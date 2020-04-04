import React from "react";
import {
  createStyles,
  makeStyles,
  Theme,
  createMuiTheme
} from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import ExitToAppRoundedIcon from "@material-ui/icons/ExitToAppRounded";
import { red } from "@material-ui/core/colors";
import { auth } from "../firebase/firebase.utils";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1
    },
    title: {
      flexGrow: 1
    },
    logOutButton: {
      color: theme.palette.getContrastText(red[100]),
      backgroundColor: red[100],
      fontWeight: "bold",
      fontSize: "1.175rem"
    }
  })
);

const TopBar = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography variant="h3" className={classes.title}>
            Minutizer
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ExitToAppRoundedIcon style={{ fontSize: 25 }} />}
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
