import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';


export default class TimePickers extends React.Component<{},{time:any}> {

    constructor(props: any) {
        super(props)
        this.state={
            time: '',
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
                    id="time"
                    label="Time"
                    type="time"
                    defaultValue="00:00:00"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    onChange = {this.handleTimeChange}
                />
            </form>
        );
    }

}