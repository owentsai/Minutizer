import React from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import MomentUtils from "@date-io/moment";
import { auth } from "./firebase/firebase.utils";
import { setCurrentUser } from "./redux/user/user.actions";
import SignUp from "./components/SignUp/SignUp";
import SignIn from "./components/SignIn/SignIn";
import MainPage from "./components/MainPage";

interface RootState {
  currentUser: any;
}

class App extends React.Component<{ setCurrentUser; currentUser }, RootState> {
  unsubscribeFromAuth: any = null;

  componentDidMount() {
    const { setCurrentUser } = this.props;

    this.unsubscribeFromAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
  }

  componentWillUnmount() {
    this.unsubscribeFromAuth();
  }

  render() {
    const { currentUser } = this.props;
    return (
      <div>
        <MuiPickersUtilsProvider utils={MomentUtils}>
          <Switch>
            <Redirect exact from="/" to="/main/uploadAudio" />
            <Route
              path="/main"
              render={() =>
                currentUser ? (
                  <MainPage {...this.props} />
                ) : (
                  <Redirect to="/signin" />
                )
              }
            ></Route>
            <Route
              exact
              path="/signup"
              render={() =>
                !currentUser ? (
                  <SignUp {...this.props} />
                ) : (
                  <Redirect to="/main/uploadAudio" />
                )
              }
            ></Route>
            <Route
              exact
              path="/signin"
              render={() =>
                !currentUser ? (
                  <SignIn {...this.props} />
                ) : (
                  <Redirect to="/main/uploadAudio" />
                )
              }
            ></Route>
          </Switch>
        </MuiPickersUtilsProvider>
      </div>
    );
  }
}

const mapStateToProps = ({ user }) => ({
  currentUser: user.currentUser,
});

const mapDispatchToProps = (dispatch) => ({
  setCurrentUser: (user) => dispatch(setCurrentUser(user)),
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
