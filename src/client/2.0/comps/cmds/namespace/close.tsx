import React = require("react");
import * as Common from '../../../common'
import { ADHOCCAST } from "../../../libex";


export interface ICloseState {
    content: string,
    names: string

}
export interface ICloseProp {

}

export class Close extends React.Component<ICloseProp, ICloseState> {
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
                <button  onClick={() => this.doClose() }>Close Namespaces</button>
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

    doGetClose(names: Array<any>) {
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

    doClose() {
        let names = this.state.names.split(",");
        Common.Global.closeNamespaces(names)
        .then(data => {
            console.log('admin-namespace-close success', data)
            this.doGetClose(names);
        })
        .catch(err => {
            let str = JSON.stringify(err, undefined, "\t");
            this.setState({
                content: str
            })  
        })
    }

}