import React from 'react';
import logo from './logo.svg';
import './Tabs/upload_tab_files/MetaFields.css';
import MetaFields from "./Tabs/upload_tab_files/MetaFields";
import AttendeesComponent from "./Tabs/upload_tab_files/AttendeesComponent";
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';

const App = () => {
  return (
  <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        {/*<a*/}
        {/*  className="App-link"*/}
        {/*  href="https://reactjs.org"*/}
        {/*  target="_blank"*/}
        {/*  rel="noopener noreferrer"*/}
        {/*>*/}
        {/*  Learn React*/}
        {/*</a>*/}
        <MetaFields></MetaFields>
      </header>
    </div>


  );
}

export default App;
