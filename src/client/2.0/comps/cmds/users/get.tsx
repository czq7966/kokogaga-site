import React = require("react");
import * as Common from '../../../common'
import { ADHOCCAST } from "../../../libex";
import { number } from "prop-types";


export interface IGetState {
    content: string,
    namespace: string,
    from: number,
    to: number

}
export interface IGetProp {

}

export class Get extends React.Component<IGetProp, IGetState> {
    constructor(props) {
        super(props);
        this.state={
            content: "",
            namespace: "",
            from: 0,
            to: 0
        }
    }
    render() {     
        return (
            <div>
                <input value={this.state.namespace} onChange={this.onNameChange} ></input>
                <input value={this.state.from} onChange={this.onFromChange} ></input>
                <input value={this.state.to} onChange={this.onToChange} ></input>
                <button  onClick={() => this.doGet() }>Get Config</button>
                <hr></hr>
                <div>
                    <textarea value={this.state.content} style={{width: "99%", height: "800px"}}  >
                        
                    </textarea>
                    
                </div>
            </div>
            
        )
    }

    onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            namespace: event.target.value.trim()
        }) 
    }

    onFromChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        let str = event.target.value.trim();
        try {
            let val = parseInt(str);
            this.setState({
                from: val
            })     
        } catch (error) {
            
        }        
    }

    onToChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        let str = event.target.value.trim();
        try {
            let val = parseInt(str);
            this.setState({
                to: val
            })     
        } catch (error) {
            
        }        
    }

    doGet() {
        Common.Global.GetNamespaceUsers(this.state.namespace, this.state.from, this.state.to)
        .then((data) => {
            let str = JSON.stringify(data.extra, undefined, "\t");
            this.setState({
                content: str
            })

        })
        .catch(err => {
            console.error('admin-users-get', err)
            let str = JSON.stringify(err, undefined, "\t");
            this.setState({
                content: str
            })            
        })
    }

}