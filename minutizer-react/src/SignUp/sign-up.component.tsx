import React from "react";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import { Link as RouterLink } from "react-router-dom";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import { auth } from "../firebase/firebase.utils";
import "./sign-up.styles.css";

interface SignUpState {
  email: string;
  password: string;
  confirmPassword: string;
}

class SignUp extends React.Component<{}, SignUpState> {
  constructor(props: any) {
    super(props);
    this.state = {
      email: "",
      password: "",
      confirmPassword: ""
    };
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  async handleSubmit(event: any) {
    event.preventDefault();
    const email = this.state.email;
    const password = this.state.password;
    const confirmPassword = this.state.confirmPassword;

    if (password !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    try {
      await auth.createUserWithEmailAndPassword(email, password);

      alert("Sign Up Is Successful!");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        alert(error.message);
      }
      if (error.code === "auth/invalid-email") {
        alert(error.message);
      }
      if (error.code === "auth/weak-password") {
        alert(error.message);
      }
      console.error(error);
    }

    this.setState({
      email: "",
      password: "",
      confirmPassword: ""
    });
    return;
  }

  handleChange(event: any) {
    const target = event.target;
    const value = target.value;
    const name = target.name;

    this.setState({
      [name]: value
    } as Pick<SignUpState, keyof SignUpState>);
  }

  render() {
    return (
      <Container component="main" maxWidth="sm">
        <CssBaseline />
        <div className="paper">
          <Avatar className="avatar">
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5" color="textPrimary">
            Create an account for Minutizer
          </Typography>
          <form className="form" onSubmit={this.handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  type="email"
                  name="email"
                  value={this.state.email}
                  onChange={this.handleChange}
                  autoComplete="email"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
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
              </Grid>
              <Grid item xs={12}>
                <TextField
                  variant="outlined"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  value={this.state.confirmPassword}
                  onChange={this.handleChange}
                  autoComplete="current-password"
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="medium"
              color="secondary"
              className="signUpButton"
            >
              Sign Up
            </Button>
            <Grid container justify="flex-end">
              <Grid item>
                <Link to="/signin" component={RouterLink} variant="body2">
                  Already have an account? Sign in
                </Link>
              </Grid>
            </Grid>
          </form>
        </div>
      </Container>
    );
  }
}
export default SignUp;
