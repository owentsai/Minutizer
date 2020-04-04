import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import "./Tabs/upload_tab_files/MetaFields.css";
import SignUp from "./SignUp/sign-up.component";
import MainPage from "./MainPage";
import SignIn from "./SignIn/sign-in.component";
import { auth } from "./firebase/firebase.utils";

interface RootState {
  currentUser: any;
}

class App extends React.Component<{ history }, RootState> {
  constructor(props: any) {
    super(props);

    this.state = {
      currentUser: null
    };
  }

  unsubscribeFromAuth: any = null;

  componentDidMount() {
    this.unsubscribeFromAuth = auth.onAuthStateChanged(user => {
      this.setState({ currentUser: user });
      console.log(this.state.currentUser);
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
    return (
      <div>
        <Switch>
          <Route exact path="/signup" component={SignUp}></Route>
          <Route
            exact
            path="/signin"
            render={() =>
              !this.state.currentUser ? (
                <SignIn history={this.props.history} {...this.props} />
              ) : (
                <Redirect to="/main" />
              )
            }
          ></Route>
          <Route
            path="/main"
            render={() =>
              this.state.currentUser ? (
                <MainPage {...this.props} />
              ) : (
                <Redirect to="/signin" />
              )
            }
          ></Route>
          <Route
            exact
            path="/"
            render={props => <Redirect to="/main" />}
          ></Route>
        </Switch>
      </div>
    );
  }
}

// const RenderMainPage = ({currentUser}) => {
//   <MainPage > </MainPage>
// }

export default App;
