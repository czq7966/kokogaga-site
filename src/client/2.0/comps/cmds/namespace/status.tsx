import React = require("react");
import * as Common from '../../../common'
import { ADHOCCAST } from "../../../libex";


export interface IStatusState {
    content: string,
    names: []

}
export interface IStatusProp {

}

export class Status extends React.Component<IStatusProp, IStatusState> {
    constructor(props) {
        super(props);
        this.state={
            content: "",
            names:[]
        }
    }
    render() {     
        return (
            <div>
                <button  onClick={() => this.doGet() }>Get Status</button>
                <hr></hr>
                <div>
                    <textarea value={this.state.content} style={{width: "99%", height: "800px"}}  >
                        
                    </textarea>
                    
                </div>
            </div>
            
        )
    }

    doGetStatus(names: Array<any>) {
        Common.Global.getNamespacesStatus(names)
        .then((data) => {
            console.log('admin-namespace-status success', data)
            let str = JSON.stringify(data.extra, undefined, "\t");
            this.setState({
                content: str
            })
        })
        .catch(err => {
            console.error('admin-namespace-status', err)
            let str = JSON.stringify(err, undefined, "\t");
            this.setState({
                content: str
            })                 
        })        
    }

    doGet() {

        let conn = Common.Global.main.loginComp.conn;
        ADHOCCAST.Services.Cmds.AdminConfigGet.get(conn.instanceId)
        .then((data) => {
            let namespaces = data.extra.namespaces || {};
            let names = Object.keys(namespaces);
            this.doGetStatus(names)
        })
        .catch(err => {
            console.error('admin-config-update', err)
            let str = JSON.stringify(err, undefined, "\t");
            this.setState({
                content: str
            })            
        })

    }

}