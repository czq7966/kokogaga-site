import * as Dts from '../dts'
import * as Network from '../network'
import * as Services from '../services'
import * as Modules_Namespace from '../../../modules/namespace'
import { ADHOCCAST } from '../libex'
import { IServer } from '../../../modules/server';
import { SocketClient, ISocketClient } from '../network/socket-client';
import { Database, IDatabase } from './database'
import { ISignalClientBase, SignalClientBase } from '../../signal-client/signal-client-base'
import { ISignalClient } from '../../signal-client/signal-client'



export interface IRedisSignaler extends ISignalClient {
    conneciton: ADHOCCAST.Connection;
    database: IDatabase
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>): string
    getServerChannel(id: string): string
    getRoomChannel(id: string, namespace?: string): string
    getUserChannel(id: string, namespace?: string): string
    getShortChannel(id: string, namespace?: string): string 
    getSocketChannel(id: string, namespace?: string): string    
    subscribe(channel: string | ADHOCCAST.Cmds.IUser): Promise<any>
    unsubscribe(channel: string | ADHOCCAST.Cmds.IUser): Promise<any>
    publish(channel: string, cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any>
    sendCommand(cmd: any, channel?: string): Promise<any>    
}

export class SocketNamespace  extends SignalClientBase implements IRedisSignaler {
    conneciton: ADHOCCAST.Connection;
    database: IDatabase
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
        this.unInitDatabase();
        this.conneciton.destroy();
        delete this.database;
        delete this.conneciton;
        delete this._isReady;        
    }
    initDatabase() {
        this.unInitDatabase();
        this.database = new Database(this);
    }   
    unInitDatabase() {
        this.database && this.database.destroy();
        delete this.database;
    } 
    initEvents() {
        (this.conneciton.signaler as Network.ISocketClient).getCmdNamespace = this.getCmdNamespace;
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
        return Services.Modules.RedisSignaler.RecvFilter.onAfterRoot(this, cmd);
    }
    sendFilter_onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any => {
        switch(cmd.cmdId) {
            // case Dts.ECommandId.signal_center_deliver:
            // case Dts.ECommandId.signal_center_users_refresh:
            // case Dts.ECommandId.signal_center_users_remove:
            // case Dts.ECommandId.signal_center_users_update:                
            //     break;
            default:
                return Services.Modules.RedisSignaler.SendFilter.onAfterRoot(this, cmd);
                
        }        
    } 
    onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        switch(cmd.data.cmdId) {
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
                this.initDatabase();
                this._isReady = this.conneciton.isLogin(); 
                break;
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:
                this._isReady = this.conneciton.isLogin(); 
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                this.unInitDatabase();
                this._isReady = this.conneciton.isLogin();                
                break;
        }   

        return Services.Modules.RedisSignaler.onAfterRoot(this, cmd);
    }
    async tryLogin() {
        let signalRedis = this.config.signalRedis;
        if (signalRedis && signalRedis.enabled ) {
            try {
                await this.conneciton.signaler.connect();
                await this.conneciton.retryLogin(null, null, null, 5 * 1000, 12);        
            } catch(e) {
                return await this.tryLogin()
            }            
        } else {
            return false;
        }     
    }
    //Override
    isReady(): boolean {
        return this._isReady;
    }
    //Override
    async onDeliverCommand(cmd: ADHOCCAST.Cmds.Common.ICommandData<any>): Promise<any> {
        return Services.Cmds.SignalCenterDeliver.onReq(this, cmd);
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

    getCmdNamespace = (cmd: ADHOCCAST.Cmds.ICommandData<any>): string  => {    
        let namespace =  cmd.extra && cmd.extra.props && cmd.extra.props.namespace;
        return namespace || this.options.name;
    }
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>): string {
        let socketClient = this.conneciton.signaler as ISocketClient;
        return socketClient.getCmdChannel(cmd, this.getCmdNamespace(cmd));
    }    
    getServerChannel(id: string): string {
        let socketClient = this.conneciton.signaler as ISocketClient;
        return socketClient.getServerChannel(id);
    }
    getRoomChannel(id: string, namespace?: string): string {
        let socketClient = this.conneciton.signaler as ISocketClient;
        namespace = namespace || this.options.name;
        return socketClient.getRoomChannel(namespace, id);
    }
    getUserChannel(id: string, namespace?: string): string {
        let socketClient = this.conneciton.signaler as ISocketClient;
        namespace = namespace || this.options.name;
        return socketClient.getUserChannel(namespace, id);
    }
    getShortChannel(id: string, namespace?: string): string {
        let socketClient = this.conneciton.signaler as ISocketClient;
        namespace = namespace || this.options.name;
        return socketClient.getShortChannel(namespace, id);
    }    
    getSocketChannel( id: string, namespace?: string): string {
        let socketClient = this.conneciton.signaler as ISocketClient;
        namespace = namespace || this.options.name;
        return socketClient.getSocketChannel(namespace, id);
    }
    async subscribe(channel: string | ADHOCCAST.Cmds.IUser): Promise<any> {
        let socketClient = this.conneciton.signaler as ISocketClient;
        if (typeof(channel) === 'string') {
            await socketClient.subscribe(channel);
        } else {
            let user: ADHOCCAST.Cmds.IUser = channel;
            user.id && await socketClient.subscribe(this.getUserChannel(user.id));
            user.sid && await socketClient.subscribe(this.getShortChannel(user.sid));
            user.room && user.room.id && await socketClient.subscribe(this.getRoomChannel(user.room.id));
        }
    }
    async unsubscribe(channel: string): Promise<any> {
        let socketClient = this.conneciton.signaler as ISocketClient;
        if (typeof(channel) === 'string') {
            await socketClient.unsubscribe(channel);
        } else {
            let user: ADHOCCAST.Cmds.IUser = channel;
            await socketClient.unsubscribe(this.getUserChannel(user.id));
            await socketClient.unsubscribe(this.getRoomChannel(user.room.id));
        }
    }
    publish(channel: string, cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any> {
        let socketClient = this.conneciton.signaler as ISocketClient;
        return socketClient.publish(channel, cmd);
    }
}


