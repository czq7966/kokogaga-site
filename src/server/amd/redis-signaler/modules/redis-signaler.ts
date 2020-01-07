import * as Dts from '../dts'
import * as Services from '../services'
import * as Modules_Namespace from '../../../modules/namespace'
import { ADHOCCAST } from '../libex'
import { IServer } from '../../../modules/server';
import { SocketClient, ISocketClient } from '../network/socket-client';
import { ISignalClient } from '../../signal-client';


export interface IRedisSignaler extends ISignalClient {
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>): string    
}

export class SocketNamespace  extends Modules_Namespace.SocketNamespace implements IRedisSignaler {
    conneciton: ADHOCCAST.Connection;
    _isReady: boolean;
    constructor(nsp: Modules_Namespace.ISocketIONamespace, server?: IServer, options?: Modules_Namespace.ISocketNamespaceOptions) {
        super(nsp, server, options);
        this.init();
        this.initEvents();
        this.tryLogin();
    }
    destroy() {
        this.unInitEvents();
        this.unInit();
        super.destroy();
    }
    init() {
        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: this.instanceId,
            factorySignaler: SocketClient.SignalerName,
            signalerBase: this.config.signalRedis.url,            
            namespace: "",
            path: this.config.socketIOServer.path,
            notInitDispatcherFilters: true,
            parent: this
        }        
        this.conneciton = ADHOCCAST.Connection.getInstance(connParams);
    }
    unInit() {
        this.conneciton.destroy();
        delete this.conneciton;
        delete this._isReady;        
    }    
    initEvents() {
        this.conneciton.dispatcher.recvFilter.onAfterRoot.add(this.recvFilter_onAfterRoot);
        this.conneciton.dispatcher.sendFilter.onAfterRoot.add(this.sendFilter_onAfterRoot);
        this.conneciton.dispatcher.eventRooter.onAfterRoot.add(this.onAfterRoot)
    }
    unInitEvents() {
        this.conneciton.dispatcher.eventRooter.onAfterRoot.remove(this.onAfterRoot)
        this.conneciton.dispatcher.sendFilter.onAfterRoot.remove(this.sendFilter_onAfterRoot);
        this.conneciton.dispatcher.recvFilter.onAfterRoot.remove(this.recvFilter_onAfterRoot)
    }

       
    recvFilter_onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any => {
        switch(cmd.cmdId) {
            case Dts.ECommandId.signal_center_deliver:
                this.on_signal_center_deliver(cmd);
                return ADHOCCAST.Cmds.Common.EEventEmitterEmit2Result.preventRoot;
                break;
        }        
    }

    sendFilter_onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any => {
        switch(cmd.cmdId) {
            case ADHOCCAST.Dts.ECommandId.adhoc_login:
                return Services.Modules.RedisSignaler.onSendFilterBeforeRoot(this, cmd);
        }
        return 2;
        
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
        let signalRedis = this.config.signalRedis;
        if (signalRedis && signalRedis.enabled ) {
            try {
                await this.conneciton.signaler.connect()
                return await this.conneciton.retryLogin(null, null, null, 5 * 1000, 12);                
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
        let cmd: ADHOCCAST.Cmds.Common.ICommandData<any> = {
            cmdId: Dts.ECommandId.signal_center_deliver,
            props: data,
            extra: dataExtra
        }
        return await this.sendCommand(cmd);
    }


    on_signal_center_deliver(cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>) {
        this.server.onDeliverCommand(cmd);
    }

    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>): string {
        return (this.conneciton.signaler as ISocketClient).getCmdChannel(cmd)
    }    
}


