import React, {useState, useEffect} from 'react';
import {useDropzone} from 'react-dropzone';
import { Button, IconButton } from '@material-ui/core';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import DeleteIcon from '@material-ui/icons/Delete';

function FileUpload(props: { onSelectFile: (file) => any, file: any }) {
    const [selectedFile, setSelectedFile] = useState(props.file)
    const onDrop = acceptedFiles => {
        props.onSelectFile(acceptedFiles[0])
    }

    useEffect(() => {
        setSelectedFile(props.file)
    }, [props.file]);

    const {
        getRootProps,
        getInputProps,
        open,
        acceptedFiles
    } = useDropzone({accept: 'audio/*', multiple: false, onDrop: onDrop, noClick: true});

    const removeAccepted = () => setSelectedFile(null)

    return (
        <div className="container">
            {selectedFile ? 
            <div {...getRootProps({className:"dropzone"})}>
                <div className="">
                    <InsertDriveFileIcon style={{ fontSize: 40 }}></InsertDriveFileIcon>{acceptedFiles[0].name}
                    <IconButton onClick={removeAccepted}>
                        <DeleteIcon />
                    </IconButton>
                </div>
            </div>
            :
            <div {...getRootProps({className:"dropzone"})}>
                <input {...getInputProps()} />
                <p>Drag 'n' Drop a File Here</p>
                <p>or</p>
                <Button variant="contained" color="default" onClick={open}>Select Files</Button>
            </div>
            }
        </div>
    );
}

export default FileUpload