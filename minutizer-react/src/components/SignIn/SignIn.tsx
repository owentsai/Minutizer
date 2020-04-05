import React from "react";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import { Link as RouterLink } from "react-router-dom";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { auth } from "../../firebase/firebase.utils";
import "./SignIn.css";

interface SignInState {
  email: string;
  password: string;
}

class SignIn extends React.Component<{}, SignInState> {
  constructor(props: any) {
    super(props);

    this.state = {
      email: "",
      password: ""
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentWillUnmount() {
    this.setState({
      email: "",
      password: ""
    });
  }

  async handleSubmit(event: any) {
    event.preventDefault();
    const email = this.state.email;
    const password = this.state.password;

    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
      if (error.code === "auth/invalid-email") {
        alert(error.message);
      }
      if (error.code === "auth/user-not-found") {
        alert("No account found associated to this email address!");
      }
      if (error.code === "auth/wrong-password") {
        alert(error.message);
      }
      this.setState({ email: "", password: "" });
    }
  }

  handleChange(event: any) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    } as Pick<SignInState, keyof SignInState>);
  }

  render() {
    return (
      <Grid container component="main" className="root">
        <CssBaseline />
        <Grid item xs={false} sm={4} md={7} className="image" />
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <div className="paper">
            <Avatar className="avatar">
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5" color="inherit">
              Sign in to Minutizer
            </Typography>
            <form className="form" onSubmit={this.handleSubmit}>
              <TextField
                variant="outlined"
                margin="normal"
                color="secondary"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                value={this.state.email}
                autoComplete="email"
                onChange={this.handleChange}
                autoFocus
              />
              <TextField
                variant="outlined"
                margin="normal"
                color="secondary"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                value={this.state.password}
                onChange={this.handleChange}
                autoComplete="current-password"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="secondary"
                className="submit"
              >
                Sign In
              </Button>

              <Grid item>
                <Link
                  to="/signup"
                  component={RouterLink}
                  variant="body2"
                  className="signUpLink"
                >
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </form>
          </div>
        </Grid>
      </Grid>
    );
  }
}

export default SignIn;
