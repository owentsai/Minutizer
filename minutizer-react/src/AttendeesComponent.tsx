import React from "react";
import ReactDOM from "react-dom";
import './App.css';

export default class IncorporationForm extends React.Component<{}, {name: any, attendees: any}> {
    constructor(props: any) {
        super(props);
        this.state = {
            name: "",
            attendees: [{ name: "" }]
        };
    }

    handleShareholderNameChange (idx: any, evt: any){
        const newShareholders = this.state.attendees.map((shareholder: any, sidx: any) => {
            if (idx !== sidx) return shareholder;
            return { ...shareholder, name: evt.target.value };
        });

        this.setState({ attendees: newShareholders });
    };

    // handleSubmit(evt: any) {
    //     const { name, attendees } = this.state;
    //     alert(`Incorporated: ${name} with ${attendees.length} shareholders`);
    // };

    handleAddShareholder = () => {
        this.setState({
            attendees: this.state.attendees.concat([{ name: "" }])
        });
    };

    handleRemoveShareholder(idx: any)  {
        this.setState({
            attendees: this.state.attendees.filter((s:any, sidx: any) => idx !== sidx)
        });
    };

    render() {
        // @ts-ignore
        // @ts-ignore
        // @ts-ignore
        return (
            <form >

                <h4>Attendees</h4>

                {this.state.attendees.map((shareholder:any, idx:any) => (
                    <div className="shareholder">
                        <input
                            type="text"
                            placeholder={`Attendee #${idx + 1} username`}
                            value={shareholder.name}
                            onChange={event => this.handleShareholderNameChange(idx,event)}
                        />
                        <button
                            type="button"
                            onClick={() => this.handleRemoveShareholder(idx)}
                            className="small"
                        >
                            -
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={this.handleAddShareholder}
                    className="small"
                >
                    Add Attendee
                </button>
            </form>
        );
    }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<IncorporationForm />, rootElement);
