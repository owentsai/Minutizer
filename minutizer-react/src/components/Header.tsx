import React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import ExitToAppRoundedIcon from "@material-ui/icons/ExitToAppRounded";
import { red } from "@material-ui/core/colors";
import { connect } from "react-redux";
import { auth } from "../firebase/firebase.utils";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    title: {
      flexGrow: 1,
    },
    userEmail: {
      flexGrow: 1,
      marginRight: theme.spacing(2),
    },
    logOutButton: {
      color: theme.palette.getContrastText(red[700]),
      fontWeight: "bold",
      fontSize: "1.175rem",
    },
  })
);

const Header = (props) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <AppBar position="static" color="secondary">
        <Toolbar>
          <Typography variant="h3" className={classes.title}>
            Minutizer
          </Typography>
          <Typography variant="h6" align="right" className={classes.userEmail}>
            {props.currentUser.email}
          </Typography>
          <Button
            variant="text"
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

const mapStateToProps = ({ user }) => ({
  currentUser: user.currentUser,
});

export default connect(mapStateToProps)(Header);
