import React from "react";
import ReactDOM from "react-dom";
import './AttendeesComponent.css';

export default class IncorporationForm extends React.Component<{parentCallback:any}, {name: any, attendees: any}> {
    constructor(props: any) {
        super(props);
        this.state = {
            name: "",
            attendees: []
        };
    }

    handleShareholderNameChange (idx: any, evt: any){
        const newShareholders = this.state.attendees.map((shareholder: any, sidx: any) => {
            if (idx !== sidx) return shareholder;
            return { ...shareholder, name: evt.target.value };
        });

        this.setState({ attendees: newShareholders });
        this.props.parentCallback(this.state.attendees);
    };

    // handleSubmit(evt: any) {
    //     const { name, attendees } = this.state;
    //     alert(`Incorporated: ${name} with ${attendees.length} shareholders`);
    // };

    handleAddShareholder = () => {
        this.setState({
            attendees: this.state.attendees.concat([{ name: "" }])
        });
        this.props.parentCallback(this.state.attendees);
    };

    handleRemoveShareholder(idx: any)  {
        this.setState({
            attendees: this.state.attendees.filter((s:any, sidx: any) => idx !== sidx)
        });
        this.props.parentCallback(this.state.attendees);
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
                    onClick={this.handleAddShareholder}
                    className="small bg-success"
                >
                    Add Attendee
                </button>
            </form>
        );
    }
}

