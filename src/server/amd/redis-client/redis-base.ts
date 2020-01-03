import * as Dts from './dts'
import fs = require('fs')
import { ADHOCCAST } from './libex'
// import { Config, IConfig } from '../../modules/config';
import { IServer } from '../../modules/server';
import * as Redis from 'redis'

export interface IRedisBaseConstructorParams extends ADHOCCAST.Cmds.Common.IBaseConstructorParams {
    clientOptions : Redis.ClientOpts
}

export interface IRedisBase extends ADHOCCAST.Cmds.Common.IBase {
    client: Redis.RedisClient
    server: IServer
    tryLogin(): Promise<any>;
    isReady(): boolean;
    deliverCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>, dataExtra: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>): Promise<any>
}

export class RedisBase extends ADHOCCAST.Cmds.Common.Base implements IRedisBase {
    client: Redis.RedisClient
    server: IServer
    _isReady: boolean;
    constructor(params: IRedisBaseConstructorParams, server: IServer) {
        super(params || ADHOCCAST.Cmds.Common.Helper.uuid());
        this.server = server;      
        this.client = Redis.createClient(params.clientOptions);
    }
    destroy() {
        this.client.end();
        delete this.client;
        super.destroy()
    }

    recvFilter_onBeforeRoot = (cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any => {
        switch(cmd.cmdId) {
            case Dts.ECommandId.signal_center_deliver:
                this.on_signal_center_deliver(cmd);
                return ADHOCCAST.Cmds.Common.EEventEmitterEmit2Result.preventRoot;
                break;
        }
        
    }

    onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        switch(cmd.data.cmdId) {
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:
                this._isReady = this.conneciton.isLogin(); 
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                this._isReady = this.conneciton.isLogin();                
                this.tryLogin();
                break;
        }        
    }

    async tryLogin() {
        let config = JSON.parse(fs.readFileSync("./config.json", 'utf8'))
        let signalCenter = config.signalCenter;
        if (signalCenter && signalCenter.enabled ) {
            try {
                console.log(signalCenter.signalerBase, signalCenter.namespace);
                return await this.conneciton.retryLogin(null, signalCenter.namespace, signalCenter.signalerBase, 5 * 1000, 12);                
            } catch(e) {
                return await this.tryLogin()
            }            
        } else {
            return false;
        }     
    }

    isReady(): boolean {
        return this._isReady;
    }
    async sendCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>) {
        if (this.isReady()) {
            let cmd = new ADHOCCAST.Cmds.CommandReq({instanceId: this.conneciton.instanceId});
            cmd.data = data;
            let result = await cmd.sendCommand()
            cmd.destroy();
            cmd = null;
            return result;

        } else {
            throw "signal client no ready"
        }        
    }

    async deliverCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>, dataExtra: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>) {
        if (this.isReady()) {
            let cmd: ADHOCCAST.Cmds.Common.ICommandData<any> = {
                cmdId: Dts.ECommandId.signal_center_deliver,
                props: data,
                extra: dataExtra
            }
            return await this.sendCommand(cmd);
        } else {
            throw "signal client no ready"
        }        
    }


    on_signal_center_deliver(cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>) {
        this.server.onDeliverCommand(cmd);
    }
}