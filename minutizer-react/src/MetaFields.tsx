import React from 'react';
import logo from './logo.svg';
import AttendeesComponent from "./AttendeesComponent";
import UploadButtons from "./UploadButton";

export default class NameForm extends React.Component<{}, {organizer: any, startTime: any, endTime: any}> {
    private fileInput = React.createRef<HTMLInputElement>();
    constructor(props: any) {
        super(props);
        this.state = {organizer: '',
            startTime: '',
            endTime: ''
        };
        this.handleChangeOrganizer = this.handleChangeOrganizer.bind(this);
        this.handleChangeStartTime = this.handleChangeStartTime.bind(this);
        this.handleChangeEndTime = this.handleChangeEndTime.bind(this);
        this.handleFileSubmit = this.handleFileSubmit.bind(this);
    }

    handleChangeOrganizer(event: any) {
        this.setState({organizer: event.target.value});
    }
    handleChangeStartTime(event: any) {
        this.setState({startTime: event.target.value});
    }
    handleChangeEndTime(event: any) {
        this.setState({endTime: event.target.value});
    }

    handleFileSubmit(event: any): boolean{
        try {
            // @ts-ignore: Object is possibly 'null'.
            let parts: string[] = this.fileInput.current.files[0].name.split('.');
            let extension: string = parts[parts.length - 1].toLowerCase();
            if (extension === "wav" || extension === "mp3") {
                // @ts-ignore: Object is possibly 'null'.
                alert(`Selected file - ${this.fileInput.current.files[0].name}`);
                return true;
            } else {
                alert('Invalid file. Only .mp3 or .wav files accepted');
                return false;
            }
        }catch (e) {
            return false;
        }
    }

    render() {
        return (
            <form>
                <label className = "Meta-label">
                    Meeting Organizer:
                    <input type="text" value={this.state.organizer} onChange={this.handleChangeOrganizer} />
                </label>
                <label className = "Meta-label">
                    Start time:
                    <input type="text" value={this.state.startTime} onChange={this.handleChangeStartTime}/>
                </label>
                <label className = "Meta-label">
                    End time:
                    <input type="text" value={this.state.endTime} onChange={this.handleChangeEndTime}/>
                </label>
                <AttendeesComponent></AttendeesComponent>
                <input type="file" id="inputFile" ref={this.fileInput} onChange={() => this.handleFileSubmit(this)} />
                <UploadButtons />
            </form>
        );
    }
}
