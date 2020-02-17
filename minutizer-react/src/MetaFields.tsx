import React from 'react';
import logo from './logo.svg';

export default class NameForm extends React.Component<{}, {value: any}> {
    private fileInput = React.createRef<HTMLInputElement>();
    constructor(props: any) {
        super(props);
        this.state = {value: ''};
        this.handleChange = this.handleChange.bind(this);
        this.handleFileSubmit = this.handleFileSubmit.bind(this);
    }

    handleChange(event: any) {
        this.setState({value: event.target.value});
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
                    <input type="text" value={this.state.value} onChange={this.handleChange} />
                </label>
                <label className = "Meta-label">
                    Start time:
                    <input type="text" value={this.state.value} />
                </label>
                <label className = "Meta-label">
                    End time:
                    <input type="text" value={this.state.value} />
                </label>
                <div>
                    <label> Meeting Attendees</label>
                </div>

                <input type="file" id="inputFile" ref={this.fileInput} onChange={() => this.handleFileSubmit(this)} />
            </form>
        );
    }
}