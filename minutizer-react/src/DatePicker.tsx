import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';


export default class DatePickers extends React.Component<{},{date:any}> {

    constructor(props: any) {
        super(props);
        this.state={
            date: '',
        };
        this.handleTimeChange = this.handleTimeChange.bind(this);
    }
    handleTimeChange(event: any){
        console.log(event.target.value);
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
                    onChange = {this.handleTimeChange}
                />
            </form>
        );
    }

}