import React = require("react");
import * as Common from '../../../common'
import { ADHOCCAST } from "../../../libex";


export interface IUpdateState {
    content: string
    url: string

}
export interface IUpdateProp {

}

export class Update extends React.Component<IUpdateProp, IUpdateState> {
    constructor(props) {
        super(props);
        this.state={
            content: "",
            url: "http://betacs.101.com/v0.1/static/preproduction_content_adhoccast/signaler_server/config.json"
        }
    }
    render() {     
        return (
            <div>
                <input value={this.state.url} onChange={this.onURLChange} style={{marginLeft:"5px", width:"90%"}} ></input>
                <button  onClick={() => this.doUpdate() }>Update Config</button>
                <hr></hr>
                <div>
                    <textarea value={this.state.content} style={{width: "99%", height: "800px"}}  >
                        
                    </textarea>
                    
                </div>
            </div>
            
        )
    }

    onURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            url: event.target.value
        });

    }

    doUpdate() {
        Common.Global.updateConfig(this.state.url)
        .then(() => {
            Common.Global.getConfig()
            .then(data => {
                let str = JSON.stringify(data.extra, undefined, "\t");
                this.setState({
                    content: str
                })            
            })
        })
        .catch(err => {
            let str = JSON.stringify(err, undefined, "\t");
            this.setState({
                content: str
            })            
        })
    }

}