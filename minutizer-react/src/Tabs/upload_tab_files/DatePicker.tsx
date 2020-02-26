import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';


export default class DatePickers extends React.Component<{parentCallback:any},{date:any}> {


    handleDateChange(event: any){
        this.props.parentCallback(event.target.value);
    }

    render() {
        return (
            <form >
                <TextField
                    id="date"
                    label="Date"
                    type="date"
                    defaultValue="2020-01-01"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    onChange={this.handleDateChange.bind(this)}
                />
            </form>
        );
    }

}