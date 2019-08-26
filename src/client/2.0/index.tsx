window["IsNode"] = false;
import Es6ObjectAssign = require('es6-object-assign');
Es6ObjectAssign.polyfill();
import "url-search-params-polyfill";
import "webrtc-adapter";
import "./index.css"
import * as Comps from "./comps"
import * as Common from "./common"

import React = require('react');
import ReactDOM = require('react-dom');

import { ADHOCCAST } from '../libex'
ADHOCCAST.Modules.Webrtc.Config.platform = ADHOCCAST.Modules.Webrtc.EPlatform.browser;

export interface IMainState {
    content: string

}
export interface IMainProp {

}

export interface IMain {
    loginComp: Comps.Login    
}

export class Main extends React.Component<IMainProp, IMainState> implements IMain {
    loginComp: Comps.Login
    constructor(props) {
        super(props)
        Common.Global.main = this;

        this.loginComp = new Comps.Login();
        this.loginComp.login()
        .then( result => {
            this.setState({
                content: result ? "": " Please login first!"
            })

        });
        this.state = {
            content: "Loginning..."
        };
    }
    destroy() {

    }   
    componentDidMount() {

    }
    componentWillUnmount() {
        this.destroy();
    }
    componentDidUpdate() {

    }



    render() {  
        if (this.loginComp.isLogin())    {
            return (
                <div>
                    <Comps.Cmds.All></Comps.Cmds.All>
                </div>
            )
        } else {
            return (
                <div>
                    {this.state.content}
                </div>    
            )
        }
    }


}

let rootEl = document.getElementById('root');
rootEl && 
ReactDOM.render(
    <Main/>
, rootEl);
