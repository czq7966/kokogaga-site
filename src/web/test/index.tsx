window["IsNode"] = false;
import Es6ObjectAssign = require('es6-object-assign');
Es6ObjectAssign.polyfill();
import "url-search-params-polyfill";
import "webrtc-adapter";

import React = require('react');
import ReactDOM = require('react-dom');

import { ADHOCCAST } from '../../client/libex'
import { Test } from './test';
ADHOCCAST.Modules.Webrtc.Config.platform = ADHOCCAST.Modules.Webrtc.EPlatform.browser;
ADHOCCAST.Cmds.Common.Helper.Debug.enabled = true;


export interface IMainState {
    signaler?: string
    maxParallel?: number
    parallelSecs?: number

    state?: 'started' | 'starting' | 'stopped' | 'stopping'
    currParallel?: number
    connectCount?: number
    disconnectCount?: number
    loginCount?: number
    searchSuccessCount?: number
    searchFailedCount?: number
}
export interface IMainProp {

}

export interface IMain extends React.Component<IMainProp, IMainState> {
    onConnect(test: Test)
    onDisconnect(test: Test) 
    onLogin(test: Test)
    onGetUserSuccess(test: Test)
    onGetUserFailed(test: Test)    
}

export class Main extends React.Component<IMainProp, IMainState> implements IMain {
    timerHandlers: {}
    mainState: IMainState
    constructor(props) {
        super(props)
        this.timerHandlers = {}
        this.state = {}
        this.mainState = {
            signaler: 'https://servicediscovery.prometheanproduct.com',
            maxParallel: 50,
            parallelSecs: 10 
        };
    }

    destroy() {

    }   


    componentDidMount() {
        this.init();
    }
    componentWillUnmount() {
        this.unInit();        
        this.destroy();
    }
    componentDidUpdate() {

    }
    initMainState() {

        this.mainState = Object.assign(this.mainState, {
            state: 'stopped',
            currParallel: 0,
            connectCount: 0,
            disconnectCount: 0,
            loginCount: 0,
            searchSuccessCount: 0,
            searchFailedCount: 0
        })

        this.setState(this.mainState)
    }

    init(){
        this.initMainState()
    }
    unInit() {

    }



    render() {  
        let startLabel: string;
        let startDisabled: boolean
        switch(this.mainState.state) {
            case 'started':
                startLabel = '停止';
                startDisabled = null
                break;
            case 'stopped':
                startLabel = '开始'
                startDisabled = null
                break;
            case 'starting':
                startLabel = '开始中...'
                startDisabled = true
                break;
            case 'stopping':
                startLabel = '停止中...'
                startDisabled = true
                break;

        }
        
        return (
            <div style={{}}>
                <div><span>连接地址：</span>
                    <input style={{width: '500px'}}  value={this.mainState.signaler} onChange={this.onSignalerChange} ></input>
                </div>  
                {/* <br></br>     */}
                <div>
                    {/* <input style={{width: '30px'}}  value={this.mainState.parallelSecs} ></input> */}
                    <span>最大并发：</span>
                    <input style={{width: '100px'}}  value={this.mainState.maxParallel} onChange={this.onMaxParallelChange} ></input>
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    <button disabled={startDisabled} value={startLabel} onClick={this.onClick}  >{startLabel}</button>
                </div>   
                <br></br>
                <div><span>当前并发：</span><label>{this.mainState.currParallel}</label></div> 
                <div><span>连接次数：</span><label>{this.mainState.connectCount}</label></div> 
                <div><span>断开次数：</span><label>{this.mainState.disconnectCount}</label></div>
                <div><span>登录次数：</span><label>{this.mainState.loginCount}</label></div> 
                <div><span>查询成功：</span><label>{this.mainState.searchSuccessCount}</label></div>  
                <div><span>查询失败：</span><label>{this.mainState.searchFailedCount}</label></div>
            </div>    
  
        )
    }

    onConnect(test: Test) {
        this.mainState.currParallel = this.mainState.currParallel + 1;
        this.mainState.connectCount = this.mainState.connectCount + 1;
        this.setState(this.mainState)
    }
    onDisconnect(test: Test) {
        this.mainState.currParallel = this.mainState.currParallel - 1;
        this.mainState.disconnectCount = this.mainState.disconnectCount + 1;
        this.setState(this.mainState)
        this.startTest(test, 5 * 1000)        
    } 
    onLogin(test: Test) {
        this.mainState.loginCount = this.mainState.loginCount + 1;
        this.setState(this.mainState)
        test.getUser()
    }

    onGetUserSuccess(test: Test) {
        if (test.connnection && test.connnection.notDestroyed) {
            this.mainState.searchSuccessCount = this.mainState.searchSuccessCount + 1;
            this.setState(this.mainState)
            if (this.mainState.searchSuccessCount % (this.mainState.maxParallel * 100) == 0) {
                test.connnection.disconnect()
            } else {
                test.getUser()
            }
        }
    }
    onGetUserFailed(test: Test) {
        if (test.connnection && test.connnection.notDestroyed) {
            this.mainState.searchFailedCount = this.mainState.searchFailedCount + 1;
            this.setState(this.mainState)
            if (test.connnection.isLogin())
                test.getUser()
        }
    } 
    onClick = () => {
        switch(this.mainState.state) {
            case 'started':
                this.stop() 
                break;
            case 'stopped':
                this.start()
                break;

        }

    }
    onMaxParallelChange =  (event: React.ChangeEvent<HTMLInputElement>) => {
        
        let newValue = event.target.value.trim() || '20';
        try {
            this.mainState.maxParallel = parseInt(newValue)
        } catch (error) {
            this.mainState.maxParallel = 50
        }
        this.initMainState()
    }
    onSignalerChange =  (event: React.ChangeEvent<HTMLInputElement>) => {        
        let newValue = event.target.value.trim() || this.state.signaler;
        this.mainState.signaler = newValue
        this.initMainState()
    }
    
    async start() {
        this.initMainState();
        this.mainState.state = 'starting';
        this.setState(this.mainState);
      
        let startCount = 0;
        let connet = async () => {
            let connParams = {
                instanceId: ADHOCCAST.Cmds.Common.Helper.uuid(),
                signalerBase: this.mainState.signaler,
                namespace: "promethean",
                path: '/socket.io',
                notInitDispatcherFilters: true,
            }  

            let test = new Test(this, connParams); 
            try {
                await test.connnection.connect();     
                this.startTest(test, 100); 
            } catch (error) {
                
            }
            this.timerHandlers[test.id] = test 
            startCount++;
            if (startCount < this.state.maxParallel) {
                connet()
            } else {
                this.mainState.state = 'started';
                this.setState(this.mainState);               
            }
        }

        connet()
    }
    start1() {
        // this.initMainState();
        // let startCount = 0;
        // for (let index = 0; index < this.state.maxParallel; index++) {
        //     let timeout = Math.random() * 1000 * this.state.parallelSecs 
        //     let handler = setTimeout(() => {
        //         delete this.timerHandlers[handler + '']
        //         let test = new Test(this); 
        //         this.timerHandlers[handler + ''] = test 
        //         this.startTest(test, 100);  
        //         startCount++;
        //         if (startCount >= this.state.maxParallel) {
        //             this.mainState.state = 'started';
        //             this.setState(this.mainState);
        //         }                      
        //     }, timeout);
        //     this.timerHandlers[handler + ''] = true
        // }
        // this.mainState.state = 'starting';
        // this.setState(this.mainState);
    }
    stop() {
        this.mainState.state = 'stopping';
        this.setState(this.mainState);

        let tryStop = () => {
            Object.keys(this.timerHandlers).forEach(key => {
                let test = this.timerHandlers[key];
                if (test instanceof Test) {   
                    test.connnection.stopRetryLogin()  
                    test.connnection.disconnect()    
                } else {
                    clearTimeout(parseInt(key))
                    delete this.timerHandlers[key]
                }
            })
        }

        let check = () => {
            setTimeout(() => {
                Object.keys(this.timerHandlers).forEach(key => {
                    let test = this.timerHandlers[key];
                    if (test instanceof Test) {   
                        if (!test.connnection.isLogin()) {
                            test.destroy()
                            delete this.timerHandlers[key]
                        }       
                    } else {
                        delete this.timerHandlers[key]
                    } 
                })

                if (Object.keys(this.timerHandlers).length <= 0) {
                    this.mainState.state = 'stopped';
                    this.setState(this.mainState);
                } else {
                    check()
                }
                
            }, 100);
        }
        tryStop()
        check()

    }
    startTest(test: Test, timeout?: number) {
        switch(this.mainState.state) {
            case 'stopped':
            case 'stopping':
                break;
            case 'started':
            case 'starting':
                timeout = timeout || 5 * 1000
                let handler = setTimeout(() => {
                    delete this.timerHandlers[handler + '']
                    test.tryLogin()
                }, timeout);
                this.timerHandlers[handler + ''] = true
                break;
        }


    }
    
}

let rootEl = document.getElementById('root');
rootEl && 
ReactDOM.render(
    <Main/>
, rootEl);
