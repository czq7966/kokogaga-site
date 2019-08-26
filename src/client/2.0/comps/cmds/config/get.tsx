import React = require("react");
import * as Common from '../../../common'
import { ADHOCCAST } from "../../../libex";


export interface IGetState {
    content: string

}
export interface IGetProp {

}

export class Get extends React.Component<IGetProp, IGetState> {
    constructor(props) {
        super(props);
        this.state={
            content: ""
        }
    }
    render() {     
        return (
            <div>
                <button  onClick={() => this.doGet() }>Get Config</button>
                <hr></hr>
                <div>
                    <textarea value={this.state.content} style={{width: "99%", height: "800px"}}  >
                        
                    </textarea>
                    
                </div>
            </div>
            
        )
    }

    doGet() {
        Common.Global.getConfig()
        .then((data) => {
            let str = JSON.stringify(data.extra, undefined, "\t");
            this.setState({
                content: str
            })

        })
        .catch(err => {
            console.error('admin-config-get', err)
            let str = JSON.stringify(err, undefined, "\t");
            this.setState({
                content: str
            })            
        })
    }

}