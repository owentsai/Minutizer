import React from 'react';
import logo from './logo.svg';
import AttendeesComponent from "./AttendeesComponent";
import './MetaFields.css';

export default class MetaFields extends React.Component<{}, {organizer: any, startTime: any, endTime: any}> {
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
                this.uploadToCloud();
                return true;
            } else {
                alert('Invalid file. Only .mp3 or .wav files accepted');
                return false;
            }
        }catch (e) {
            return false;
        }    
    }

    private uploadToCloud() {
        // Imports the Google Cloud client library
        const { Storage } = require("@google-cloud/storage");
        const path = require("path");
        const GOOGLE_CLOUD_PROJECT_ID = "hacksbc-268409"; // Replace with your project ID
        // const GOOGLE_CLOUD_KEYFILE = path.join(__dirname,"../hacksbc-268409-3783f43ce9f1.json"); // Replace with the path to the downloaded private key
        const GOOGLE_CLOUD_KEYFILE = "Desktop/hacksbc-268409-3783f43ce9f1.json";

        // console.log(GOOGLE_CLOUD_KEYFILE);
        // console.log(__dirname);

        // Creates a client
        // SOMETHING'S WRONG WITH THIS CONSTRUCTOR
        const storage = Storage({
            projectId: GOOGLE_CLOUD_PROJECT_ID,
            keyFilename: GOOGLE_CLOUD_KEYFILE,
        });

        console.log("got here");
        storage.getBuckets().then( (x:any) => console.log(x));

        const bucketName = "minutizer_recordings";
        const filename = path.join(__dirname,"./test.txt");

        console.log(filename);

        async function uploadFile() {
            // Uploads a local file to the bucket
            await storage.bucket(bucketName).upload(filename, {
                // Support for HTTP requests made with `Accept-Encoding: gzip`
                // By setting the option `destination`, you can change the name of the
                // object you are uploading to a bucket.
                metadata: {
                    // Enable long-lived HTTP caching headers
                    // Use only if the contents of the file will never change
                    // (If the contents will change, use cacheControl: 'no-cache')
                    cacheControl: 'public, max-age=31536000',
                },
            });
            console.log(`${filename} uploaded to ${bucketName}.`);
        }
        uploadFile().catch(console.error);
    }

    render() {
        return (
            <form className = 'metaForm'>
                <label className = "Meta-label">
                    Meeting Organizer:
                    <input className = "Meta-input" type="text" value={this.state.organizer} onChange={this.handleChangeOrganizer} />
                </label>
                <label className = "Meta-label">
                    Start time:
                    <input className = "Meta-input" type="text" value={this.state.startTime} onChange={this.handleChangeStartTime}/>
                </label>
                <label className = "Meta-label">
                    End time:
                    <input className = "Meta-input" type="text" value={this.state.endTime} onChange={this.handleChangeEndTime}/>
                </label>
                <AttendeesComponent></AttendeesComponent>
                <br/>
                <input type="file" accept = "audio/*" id="inputFile" ref={this.fileInput} onChange={() => this.handleFileSubmit(this)} />
            </form>
        );
    }
}