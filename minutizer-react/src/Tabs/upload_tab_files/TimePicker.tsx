import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';


export default class TimePickers extends React.Component<{parentCallback:any},{time:any}> {


    handleTimeChange(event: any){
        this.props.parentCallback(event.target.value);
    }
    render() {
        return (
            <form >
                <TextField
                    id="time"
                    label="Time"
                    type="time"
                    defaultValue="00:00:00"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    onChange = {this.handleTimeChange.bind(this)}
                />
            </form>
        );
    }

}