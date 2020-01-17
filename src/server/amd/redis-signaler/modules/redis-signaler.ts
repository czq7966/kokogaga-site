import * as Dts from '../dts'
import * as Network from '../network'
import * as Services from '../services'
import * as Modules_Namespace from '../../../modules/namespace'
import { ADHOCCAST } from '../libex'
import { IServer } from '../../../modules/server';
import { SocketClient, ISocketClient, IRedisClient } from '../network/socket-client';
import { ISignalClientBase, SignalClientBase } from '../../signal-client/signal-client-base'
import { ISignalClient } from '../../signal-client/signal-client'
import { IDatabaseWrap, DatabaseWrap } from './database-wrap'



export interface IRedisSignaler extends ISignalClient, IRedisClient {
    conneciton: ADHOCCAST.Connection;
    database: IDatabaseWrap
    getPath(): string
    getCmdChannel(cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string): string
    getPathChannel(id: string): string
    //Server channels
    getServersChannel(id?: string): string
    getServerChannel(id: string): string
    getServerExistChannel(id: string): string
    getServerUsersChannel(id: string): string
    //Namespace channels
    getNamespaceChannel(id: string): string
    getNamespaceRoomChannel(id: string, namespace?: string): string
    getNamespaceRoomUsersChannel(id: string, namespace?: string): string 
    getNamespaceUserChannel(id: string, namespace?: string): string
    getNamespaceShortChannel(id: string, namespace?: string): string 
    getNamespaceSocketChannel(id: string, namespace?: string): string    
    
    getSocketClient(): ISocketClient
    sendCommand(cmd: any, channel?: string): Promise<any>   

}

export class SocketNamespace  extends SignalClientBase implements IRedisSignaler {
    conneciton: ADHOCCAST.Connection;
    database: IDatabaseWrap
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
        this.database = new DatabaseWrap(this, this.server.getDatabase());
    }   
    unInitDatabase() {
        this.database && this.database.destroy();
        delete this.database;
    } 
    initEvents() {
        (this.conneciton.signaler as Network.ISocketClient).onGetCmdChannel = this.getCmdChannel
        this.conneciton.dispatcher.recvFilter.onAfterRoot.add(this.recvFilter_onAfterRoot);
        this.conneciton.dispatcher.sendFilter.onAfterRoot.add(this.sendFilter_onAfterRoot);
        this.conneciton.dispatcher.eventRooter.onAfterRoot.add(this.onAfterRoot)
    }
    unInitEvents() {
        this.conneciton.dispatcher.eventRooter.onAfterRoot.remove(this.onAfterRoot)
        this.conneciton.dispatcher.sendFilter.onAfterRoot.remove(this.sendFilter_onAfterRoot);
        this.conneciton.dispatcher.recvFilter.onAfterRoot.remove(this.recvFilter_onAfterRoot)
        (this.conneciton.signaler as Network.ISocketClient).onGetCmdChannel = null;
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
    getCmdChannel = (cmd: ADHOCCAST.Cmds.ICommandData<any>, namespace?: string): string => {
        namespace = namespace || this.getCmdNamespace(cmd) || '';
        let channel: string;
        switch (cmd.to.type) {
            case 'server':
                channel = this.getServerChannel(cmd.to.id);
                break;
            case 'room': 
                channel = this.getNamespaceRoomChannel(namespace, cmd.to.id);
                break;
            case 'user':
                channel = this.getNamespaceUserChannel(namespace, cmd.to.id);
                break;
            case 'socket':
                channel = this.getNamespaceSocketChannel(namespace, cmd.to.id);
                break;
        }  
        return channel;  
    }    
    getPath(): string {
        return this.server.getConfig().socketIOServer.path;
    }
    getPathChannel(id?: string): string {
        return '/path:' + (id || this.getPath());
    }
    //Server channels
    getServersChannel(id?: string): string {
        return this.getPathChannel() + '/servers:' + (id || '');
    }
    getServerChannel(id: string): string {
        return this.getPathChannel() + '/server:' + id;
    }
    getServerExistChannel(id: string): string {
        return this.getServerChannel(id) + '/exist:'
    }
    getServerUsersChannel(id: string): string {
        return this.getServerChannel(id) + '/users:'
    }

    //Namespace channels
    getNamespaceChannel(id?: string): string {
        return this.getPathChannel() + '/namespace:' + (id || this.options.name);
    }    
    getNamespaceRoomChannel(id: string, namespace?: string): string {
        return this.getNamespaceChannel(namespace) + '/room:' + id;
    }
    getNamespaceRoomUsersChannel(id: string, namespace?: string): string {
        return this.getNamespaceRoomChannel(id, namespace) + '/users:';
    }    
    getNamespaceUserChannel(id: string, namespace?: string): string {
        return this.getNamespaceChannel(namespace) + '/user:' + id;
    }
    getNamespaceShortChannel(id: string, namespace?: string): string {
        return this.getNamespaceChannel(namespace) + '/short:' + id;
    }    
    getNamespaceSocketChannel( id: string, namespace?: string): string {
        return this.getNamespaceChannel(namespace) + '/socket:' + id;
    }

    getSocketClient(): ISocketClient {
        return this.conneciton.signaler as ISocketClient;
    }
    async subscribe(channel: string): Promise<any> {
        return this.getSocketClient().subscribe(channel);
    }
    async unsubscribe(channel: string): Promise<any> {
        return this.getSocketClient().unsubscribe(channel);
    }
    async publish(channel: string, cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any> {
        return this.getSocketClient().publish(channel, cmd);
    }
    async get(key: string): Promise<string> {
        return this.getSocketClient().get(key);        
    }
    async set(key: string, value: string): Promise<boolean> {
        return this.getSocketClient().set(key, value);
    }
    async del(key: string): Promise<boolean> {
        return this.getSocketClient().del(key);
    }
    async exists(key: string): Promise<boolean> {
        return this.getSocketClient().exists(key);
    }
    async hget(key: string, field: string): Promise<string> {
        return this.getSocketClient().hget(key, field);
    }
    async hset(key: string, field: string, value: string): Promise<boolean> {
        return this.getSocketClient().hset(key, field, value);        
    }
    async hdel(key: string, field: string): Promise<boolean> {
        return this.getSocketClient().hdel(key, field);        
    }    
    async hlen(key: string): Promise<number> {
        return this.getSocketClient().hlen(key);
    }
    async hexists(key: string, field: string): Promise<boolean>  {
        return this.getSocketClient().hexists(key, field);                
    }
    async persist(key: string): Promise<boolean> {
        return this.getSocketClient().persist(key);                        
    }
    async expire(key: string, seconds: number): Promise<boolean> {
        return this.getSocketClient().expire(key, seconds);                                
    }
    async pexpire(key: string, milliseconds: number): Promise<boolean> {
        return this.getSocketClient().expire(key, milliseconds); 
    }      
}


