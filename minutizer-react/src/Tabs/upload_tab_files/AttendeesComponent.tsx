import React from "react";
import ReactDOM from "react-dom";
import './AttendeesComponent.css';

export default class IncorporationForm extends React.Component<{parentCallback1:any,parentCallback2:any,parentCallback3:any}, {attendees: any}> {
    constructor(props: any) {
        super(props);
        this.state = {
            attendees: []
        };
    }

    handleShareholderNameChange (idx: any, evt: any){
        const name = evt.target.value;
        const newShareholders = this.state.attendees.map((shareholder: any, sidx: any) => {
            if (idx !== sidx) return shareholder;
            return { ...shareholder, name };
        });
        this.setState({ attendees: newShareholders });
        this.props.parentCallback3(idx,evt);
    };

    handleAddShareholder = () =>{
        this.setState({
            attendees: this.state.attendees.concat([{ name: "" }])
        });
        this.props.parentCallback1();
    };

    handleRemoveShareholder(idx: any)  {
        this.setState({
            attendees: this.state.attendees.filter((s:any, sidx: any) => idx !== sidx)
        });
        this.props.parentCallback2(idx);
    };

    render() {
        return (
            <form className = "AttendeeForm">

                <label className="Meta-label font-weight-bold d-block">Attendees</label>

                {this.state.attendees.map((shareholder:any, idx:any) => (
                    <div className="attendeeDiv">
                        <input
                            type="text"
                            placeholder={`Attendee #${idx + 1} username`}
                            value={shareholder.name}
                            onChange={event => this.handleShareholderNameChange(idx,event)}
                        />
                        <button
                            type="button"
                            onClick={() => this.handleRemoveShareholder(idx)}
                            className="small bg-warning font-weight-bold "
                            style={{fontSize: "30px", paddingBottom:"40px"}}
                        >
                            -
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={this.handleAddShareholder.bind(this)}
                    className="small bg-success"
                >
                    Add Attendee
                </button>
            </form>
        );
    }
}

