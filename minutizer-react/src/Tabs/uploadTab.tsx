import React, {Component} from "react";
import MetaFields from "./upload_tab_files/MetaFields";
class UploadTab extends Component {
    render() {
        return(
                <div style={{margin: '50px 150px', borderRadius: "25px"}}
                    className="p-5 shadow-lg ">
                    <MetaFields ></MetaFields>
                </div>
        );
    }
}
export default UploadTab;
