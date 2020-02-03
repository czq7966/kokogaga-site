import * as Dts from './dts'
import * as Modules_Namespace from '../../modules/namespace'
import { ADHOCCAST } from './libex'
import { IServer } from '../../modules/server';
import { SignalClientBase, ISignalClientBase } from './signal-client-base';

export interface ISignalClient extends ISignalClientBase {
    tryLogin(): Promise<any>
}

export class SocketNamespace extends SignalClientBase implements ISignalClient {
    conneciton: ADHOCCAST.IConnection
    _isReady: boolean;
    constructor(nsp: Modules_Namespace.ISocketIONamespace, server?: IServer, options?: Modules_Namespace.ISocketNamespaceOptions<any>) {
        super(nsp, server, options);
        this.init();
        this.initEvents();
        setTimeout(() => {
            this.tryLogin();            
        }, 2000);            
    }
    destroy() {
        this.unInitEvents();
        this.unInit();
        super.destroy();
    }
    init() {
        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: this.instanceId,
            signalerBase: "",
            namespace: "",
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
        this.conneciton.dispatcher.recvFilter.onBeforeRoot.add(this.recvFilter_onBeforeRoot)
        this.conneciton.dispatcher.eventRooter.onAfterRoot.add(this.onAfterRoot)
    }
    unInitEvents() {
        this.conneciton.dispatcher.eventRooter.onAfterRoot.remove(this.onAfterRoot)
        this.conneciton.dispatcher.recvFilter.onBeforeRoot.remove(this.recvFilter_onBeforeRoot)
    }

    recvFilter_onBeforeRoot = (cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any => {
        switch(cmd.cmdId) {
            case Dts.ECommandId.signal_center_deliver:
                this.onDeliverCommand(cmd);
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
        let signalCenter = this.config.signalCenter;
        if (!this.options.disabled && signalCenter && signalCenter.enabled ) {
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
    async onDeliverCommand(cmd: ADHOCCAST.Cmds.Common.ICommandData<any>) {
        this.server.onDeliverCommand(cmd);
    }
}