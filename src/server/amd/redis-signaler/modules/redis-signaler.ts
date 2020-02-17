import * as IORedis from 'ioredis'
import * as Dts from '../dts'
import * as Network from '../network'
import * as Services from '../services'
import * as Modules_Namespace from '../../../modules/namespace'
import { ADHOCCAST } from '../libex'
import { IServer } from '../../../modules/server';
import { SocketClient, ISocketClient, IRedisClient,IClientSocket } from '../network';
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
    getServerChannel(id?: string): string
    getServerExistChannel(id?: string): string
    getServerUsersChannel(id?: string): string
    getServerKeyspacePChannel(id?: string): string
    //Namespace channels
    getNamespaceChannel(id: string): string
    getNamespaceRoomChannel(id: string, namespace?: string): string
    getNamespaceRoomUsersChannel(id: string, namespace?: string): string 
    getNamespaceUserChannel(id: string, namespace?: string): string
    getNamespaceUserStreamRoomChannel(userid: string, roomid: string, namespace?: string): string
    getNamespaceUserStreamRoomUsersChannel(userid: string, roomid: string, namespace?: string): string
    getNamespaceShortChannel(id: string, namespace?: string): string 
    getNamespaceSocketChannel(id: string, namespace?: string): string
    getNamespaceFromChannel(channel: string): string
    //Room channels
    getRoomidFromRoomChannel(channel: string): string
    
    getSocketClient(): ISocketClient    
    startHandshake()
    stopHandshake()

    //Override
    sendCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>, forResp?: boolean): Promise<any>
    sendCommandForResp(data: ADHOCCAST.Cmds.Common.ICommandData<any>): Promise<any>
    deliverCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>, dataExtra: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>, forResp?: boolean): Promise<any>
    onDeliverCommand(cmd: ADHOCCAST.Cmds.Common.ICommandData<any>): Promise<any>

    //Other
    processPromise<T>(promise: Promise<any>): Promise<T>

}

export class SocketNamespace  extends SignalClientBase implements IRedisSignaler {
    conneciton: ADHOCCAST.Connection;
    database: IDatabaseWrap
    _isReady: boolean;
    _handshakeHandler: number
    options: Modules_Namespace.ISocketNamespaceOptions<Dts.IOptionsExtra>
    constructor(nsp: Modules_Namespace.ISocketIONamespace, server?: IServer, options?: Modules_Namespace.ISocketNamespaceOptions<any>) {
        super(nsp, server, options);
        this.options = options;
        this.init();
        this.initEvents();
        this.tryConnect();
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
            signalerBase: this.options.extra.url || '',            
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
        if (!this.database) {
            this.database = new DatabaseWrap(this, this.server.getDatabase());
            this.server.setDatabase(this.database);
        }
    }   
    unInitDatabase() {
        this.database && this.database.destroy();
        delete this.database;
    } 
    initEvents() {
        (this.conneciton.signaler as Network.ISocketClient).onGetCmdChannel = this.getCmdChannel;
        (this.conneciton.signaler as Network.ISocketClient).onGetSocketOptions = this.getSocketOptions;
        (this.conneciton.signaler as Network.ISocketClient).onGetSocketNodes = this.getSocketNodes
        
        this.conneciton.dispatcher.recvFilter.onAfterRoot.add(this.recvFilter_onAfterRoot);
        this.conneciton.dispatcher.sendFilter.onAfterRoot.add(this.sendFilter_onAfterRoot);
        this.conneciton.dispatcher.eventRooter.onAfterRoot.add(this.onAfterRoot)
    }
    unInitEvents() {
        this.stopHandshake();
        this.conneciton.dispatcher.eventRooter.onAfterRoot.remove(this.onAfterRoot)
        this.conneciton.dispatcher.sendFilter.onAfterRoot.remove(this.sendFilter_onAfterRoot);
        this.conneciton.dispatcher.recvFilter.onAfterRoot.remove(this.recvFilter_onAfterRoot)

        (this.conneciton.signaler as Network.ISocketClient).onGetCmdChannel = null;
        (this.conneciton.signaler as Network.ISocketClient).onGetSocketOptions = null;
        (this.conneciton.signaler as Network.ISocketClient).onGetSocketNodes = null;
    }       
    recvFilter_onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any => {
        return Services.Modules.RedisSignaler.RecvFilter.onAfterRoot(this, cmd);
    }
    sendFilter_onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any => {
        switch(cmd.cmdId) {
            default:
                return Services.Modules.RedisSignaler.SendFilter.onAfterRoot(this, cmd);
                
        }        
    } 
    onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        switch(cmd.data.cmdId) {
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
                console.log('redis adhoc_login')
                this.initDatabase();
                this._isReady = this.conneciton.isLogin(); 
                break;
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:
                this._isReady = this.conneciton.isLogin(); 
                break;
            case ADHOCCAST.Cmds.ECommandId.network_connect:
                console.log('redis network_connect')                
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                console.log('redis network_disconnect')
                this._isReady = this.conneciton.isLogin();                
                break;
        }   

        return Services.Modules.RedisSignaler.onAfterRoot(this, cmd);
    }
    async tryConnect() {
        await this.conneciton.signaler.connect();
    }
    async tryLogin() {
        let extra = this.options.extra;
        if (extra && extra.enabled ) {
            try {
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
    //Override
    async sendCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>, forResp?: boolean) {
        if (this.isReady()) {
            let cmd = new ADHOCCAST.Cmds.CommandReq({instanceId: this.conneciton.instanceId});
            cmd.data = data;
            let result;
            if (forResp)                  
                result = await cmd.sendCommandForResp();
            else
                result = await cmd.sendCommand();
            cmd.destroy();
            cmd = null;
            return result;

        } else {
            throw "signal client no ready: " + data.cmdId
        }        
    }
    //Override
    async sendCommandForResp(data: ADHOCCAST.Cmds.Common.ICommandData<any>) {
        return this.sendCommand(data, true)
    }
    //Override
    async deliverCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>, dataExtra: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>, forResp?: boolean) {
        let cmd: ADHOCCAST.Cmds.Common.ICommandData<any> = {
            cmdId: Dts.ECommandId.signal_center_deliver,
            props: data,
            extra: dataExtra,
            onResp: data.onResp,
            onRespTimeout: data.onRespTimeout,
            respTimeout: data.respTimeout,  
            respMsg: data.respMsg,
            respResult: data.respResult,
            sessionId: data.sessionId,
            type: data.type         
        }
        Services.Modules.RedisSignaler.SendFilter.on_signal_center_deliver(this, cmd);
        let result = await this.sendCommand(cmd, forResp);
        await this.server.onDeliverCommand(cmd);
        return result;
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
                channel = this.getNamespaceRoomChannel(cmd.to.id, namespace);
                break;
            case 'user':
                channel = this.getNamespaceUserChannel(cmd.to.id, namespace);
                break;
            case 'socket':
                channel = this.getNamespaceSocketChannel(cmd.to.id, namespace);
                break;
        }  
        return channel;  
    } 
    getSocketNodes = (clientSocket: IClientSocket) => {
        let hostArgKey = 'CHROMECASTREDISIP';
        let portArgKey = 'CHROMECASTREDISPORT';
        let passArgKey = 'CHROMECASTREDISPASS';
        let nodes = [];
        let getEnvNode = (subfix: string) => {
            let hostKey = hostArgKey + subfix;
            let portKey = portArgKey + subfix;
            let passKey = passArgKey + subfix;

            let host = process.env[hostKey];
            let port = process.env[portKey];
            let pass = process.env[passKey];
            host && console.log(host)
            if (host && port) {
                nodes.push({
                    host: host,
                    port: port,
                    password: pass
                })
            }
        }
        getEnvNode('');
        for (let idx = 0; idx < 100; idx++) {
            getEnvNode(idx + '');            
        }

        return nodes.length > 0 ? nodes : this.options.extra.nodes
    }   
    getSocketOptions = (clientSocket: IClientSocket) => {
        return this.options.extra.options
    }
    getPath(): string {
        return '{' + this.server.getConfig().socketIOServer.path + '}';
    }
    getPathChannel(id?: string): string {
        return Dts.ChannelKeys.Path + (id || this.getPath());
    }
    //Server channels
    getServersChannel(id?: string): string {
        return this.getNamespaceChannel() +  Dts.ChannelKeys.Servers + (id || '');
    }
    getServerChannel(id?: string): string {
        id = id || (id === '' ? id : this.server.getId());
        return this.getNamespaceChannel() +  Dts.ChannelKeys.Server + id;
    }
    getServerExistChannel(id?: string): string {
        return this.getServerChannel(id) +  Dts.ChannelKeys.Exist
    }
    getServerUsersChannel(id?: string): string {
        return this.getServerChannel(id) +  Dts.ChannelKeys.Users
    }
    getServerKeyspacePChannel(id?: string): string {
        id = id || '*';
        return Dts.ChannelKeys.Keyspace + this.getServerChannel(id)
    }
    //Namespace channels
    getNamespaceChannel(id?: string): string {
        return this.getPathChannel() +  Dts.ChannelKeys.Namespace + (id || this.options.name);
    }    
    getNamespaceRoomChannel(id: string, namespace?: string): string {
        return this.getNamespaceChannel(namespace) +  Dts.ChannelKeys.Room + id;
    }
    getNamespaceRoomUsersChannel(id: string, namespace?: string): string {
        return this.getNamespaceRoomChannel(id, namespace) +  Dts.ChannelKeys.Users;
    }    
    getNamespaceUserChannel(id: string, namespace?: string): string {
        return this.getNamespaceChannel(namespace) +  Dts.ChannelKeys.User + id;
    }
    getNamespaceUserStreamRoomChannel(userid: string, roomid: string, namespace?: string): string {
        return this.getNamespaceRoomChannel(roomid, namespace) + Dts.ChannelKeys.UserStreamRoomPrefix + userid;

    }
    getNamespaceUserStreamRoomUsersChannel(userid: string, roomid: string, namespace?: string): string {
        return this.getNamespaceUserStreamRoomChannel(userid, roomid, namespace) + Dts.ChannelKeys.Users
    }

    getNamespaceShortChannel(id: string, namespace?: string): string {
        return this.getNamespaceChannel(namespace) +  Dts.ChannelKeys.Short + id;
    }    
    getNamespaceSocketChannel( id: string, namespace?: string): string {
        return this.getNamespaceChannel(namespace) +  Dts.ChannelKeys.Socket + id;
    }
    getNamespaceFromChannel(channel: string): string {
        let result: string
        let idx = channel.indexOf(Dts.ChannelKeys.Namespace);
        if (idx >= 0) {
            result = channel.substr(idx + Dts.ChannelKeys.Namespace.length);
            idx = result.indexOf('/');
            if(idx > 0) result = result.substr(0, idx);
        }
        return result;
    }
    //Room channels
    getRoomidFromRoomChannel(channel: string): string {
        let result: string
        let idx = channel.indexOf(Dts.ChannelKeys.Room);
        if (idx >= 0) {
            result = channel.substr(idx + Dts.ChannelKeys.Room.length);
        }
        return result;       
    }

    getSocketClient(): ISocketClient {
        return this.conneciton.signaler as ISocketClient;
    }

    //Hand shake
    startHandshake() {
        this.stopHandshake();
        let serverExsitChannel = this.getServerExistChannel();
        this.getSocketClient().pexpire(serverExsitChannel, this.options.extra.handshakeTimeout);
        this._handshakeHandler = setInterval(() => {            
            this.getSocketClient().pexpire(serverExsitChannel, this.options.extra.handshakeTimeout);
        }, this.options.extra.handshakeInterval) as any;

    }
    stopHandshake() {
        this._handshakeHandler && clearInterval(this._handshakeHandler);
        this._handshakeHandler = null;
    }

    //Other
    processPromise<T>(promise: Promise<any>): Promise<T> {
        return new Promise((resolve, reject) => {
            promise.then(v => {
                resolve(v as T)
            })
            .catch(e => {
                Logging.error(e.message);
                resolve()    
            })
        })
    }

    //Redis client interface
    async subscribe(channel: string): Promise<any> {
        return this.getSocketClient().subscribe(channel);
    }
    async psubscribe(pchannel: string): Promise<any> {
        return this.getSocketClient().psubscribe(pchannel);
    }
    async unsubscribe(channel: string): Promise<any> {
        return this.getSocketClient().unsubscribe(channel);
    }
    async publish(channel: string, cmd: ADHOCCAST.Cmds.ICommandData<any>): Promise<any> {
        return this.getSocketClient().publish(channel, cmd);
    }
    async publishBuffer(channel: string, buffer: Buffer): Promise<any> {
        return this.getSocketClient().publishBuffer(channel, buffer);
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
    async hkeys(key: string): Promise<string[]> {
        return this.getSocketClient().hkeys(key);
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
    submulti(args?: Array<Array<string>>): IORedis.Pipeline {
        return this.getSocketClient().submulti(args)
    }
    pubmulti(args?: Array<Array<string | number>>): IORedis.Pipeline {
        return this.getSocketClient().pubmulti(args)
    }
    submultiAsync(args: Array<Array<string | number>>): Promise<any[]> {
        return this.getSocketClient().submultiAsync(args)
    } 
    pubmultiAsync(args: Array<Array<string | number>>): Promise<any[]>{
        return this.getSocketClient().pubmultiAsync(args)
    }
    async eval(script: string, numKeys: number, ...args: IORedis.ValueType[]): Promise<any> {
        return this.getSocketClient().eval(script, numKeys, ...args)
    } 
    async redisconfig(...args: string[]): Promise<any> {
        return this.getSocketClient().redisconfig(...args)
    }
}


