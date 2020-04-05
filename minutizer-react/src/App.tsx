import React from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import SignUp from "./components/SignUp/sign-up.component";
import MainPage from "./components/MainPage";
import SignIn from "./components/SignIn/sign-in.component";
import { auth } from "./firebase/firebase.utils";
import { setCurrentUser } from "./redux/user/user.actions";

interface RootState {
  currentUser: any;
}

class App extends React.Component<{ setCurrentUser; currentUser }, RootState> {
  unsubscribeFromAuth: any = null;

  componentDidMount() {
    const { setCurrentUser } = this.props;

    this.unsubscribeFromAuth = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
  }

  componentWillUnmount() {
    this.unsubscribeFromAuth();
  }

  /*ProtectedMainPage = ({ component: Component, ...rest }) => (
    <Route
      {...rest}
      render={props =>
        this.state.currentUser ? (
          <Component {...props} />
        ) : (
          <Redirect
            to={{
              pathname: "/signin",
              state: { from: props.location }
            }}
          />
        )
      }
    />
  );*/

  render() {
    const { currentUser } = this.props;
    return (
      <div>
        <Switch>
          <Route
            exact
            path="/signup"
            render={() =>
              !currentUser ? (
                <SignUp {...this.props} />
              ) : (
                <Redirect to="/main" />
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
                <Redirect to="/main" />
              )
            }
          ></Route>
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
          <Route exact path="/" render={() => <Redirect to="/main" />}></Route>
        </Switch>
      </div>
    );
  }
}

const mapStateToProps = ({ user }) => ({
  currentUser: user.currentUser
});

const mapDispatchToProps = dispatch => ({
  setCurrentUser: user => dispatch(setCurrentUser(user))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
