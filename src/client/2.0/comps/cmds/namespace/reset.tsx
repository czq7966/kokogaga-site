import React = require("react");
import * as Common from '../../../common'
import { ADHOCCAST } from "../../../libex";


export interface IResetState {
    content: string,
    names: string

}
export interface IResetProp {

}

export class Reset extends React.Component<IResetProp, IResetState> {
    constructor(props) {
        super(props);
        this.state={
            content: "",
            names:""
        }
    }
    render() {     
        return (
            <div>
                <input value={this.state.names} onChange={this.onNameChange} ></input>
                <button  onClick={() => this.doReset() }>Reset Namespaces</button>
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
            names: event.target.value.trim()
        }) 

    }

    doGetReset(names: Array<any>) {
        Common.Global.getNamespacesStatus(names)
        .then((data) => {
            let str = JSON.stringify(data.extra, undefined, "\t");
            this.setState({
                content: str
            })
        })
        .catch(err => {
            let str = JSON.stringify(err, undefined, "\t");
            this.setState({
                content: str
            })                 
        })        
    }

    doReset() {
        let names = this.state.names.split(",");
        Common.Global.ResetNamespaces(names)
        .then(data => {
            console.log('admin-namespace-Reset success', data)
            this.doGetReset(names);
        })
        .catch(err => {
            let str = JSON.stringify(err, undefined, "\t");
            this.setState({
                content: str
            })  
        })
    }

}