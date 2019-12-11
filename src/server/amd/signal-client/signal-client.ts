import * as Dts from '../../cmds/dts'
import fs = require('fs')
import { ADHOCCAST } from './libex'
// import { Config, IConfig } from '../../modules/config';
import { IServer } from '../../modules/server';

export interface ISignalClient extends ADHOCCAST.Cmds.Common.IBase {
    conneciton: ADHOCCAST.Connection;
    server: IServer
    tryLogin(): Promise<any>;
}

export class SignalClient extends ADHOCCAST.Cmds.Common.Base implements ISignalClient {
    conneciton: ADHOCCAST.Connection;
    server: IServer
    constructor(params?: ADHOCCAST.Cmds.Common.IBaseConstructorParams | string, server?: IServer) {
        super(params || ADHOCCAST.Cmds.Common.Helper.uuid());
        this.server = server;
        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: this.instanceId,
            signalerBase: "",
            namespace: "",
            notInitDispatcherFilters: true,
            parent: this
        }        
        this.conneciton = ADHOCCAST.Connection.getInstance(connParams);
        this.initEvents();
        setTimeout(() => {
            this.tryLogin();            
        }, 2000);
    }
    destroy() {
        this.unInitEvents();
        this.conneciton.destroy();
        delete this.conneciton;
        super.destroy()
    }
    initEvents() {
        this.conneciton.dispatcher.recvFilter.onBeforeRoot.add(this.recvFilter_onBeforeRoot)
        this.conneciton.dispatcher.eventRooter.onAfterRoot.add(this.onAfterRoot)
    }
    unInitEvents() {
        this.conneciton.dispatcher.eventRooter.onAfterRoot.remove(this.onAfterRoot)
        this.conneciton.dispatcher.recvFilter.onBeforeRoot.remove(this.recvFilter_onBeforeRoot)
    }

    recvFilter_onBeforeRoot = (cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any => {
        // switch(cmd.cmdId) {
        //     case Dts.ECommandId2.signal_center_deliver:
        //         return ADHOCCAST.Cmds.Common.EEventEmitterEmit2Result.preventRoot;
        //         break;
        // }
        
    }

    onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        // switch(cmd.data.cmdId) {
        //     case Dts.ECommandId2.signal_center_deliver:
        //         break;
        // }        
    }

    async tryLogin() {
        let config = JSON.parse(fs.readFileSync("./config.json", 'utf8'))
        let signalCenter = config.signalCenter;
        if (signalCenter && signalCenter.enabled ) {
            try {
                console.log(signalCenter.signalerBase, signalCenter.namespace);
                let result = await this.conneciton.retryLogin(null, signalCenter.namespace, signalCenter.signalerBase, 5 * 1000, 12);
                console.log('vvvvvvvvvvvvvvvv', result)  
            } catch(e) {
                await this.tryLogin()
            }            
        }        
    }

}