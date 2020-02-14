import * as Dts from '../../dts'
import * as Modules from '../../modules'
import { ADHOCCAST } from '../../libex'
import { NetworkException } from '../cmds/network-exception';
import { Redundance } from './redundance';
import IORedis = require('ioredis');

export class RedisSignaler {
    // onRecvFilter
    static RecvFilter = {
        onAfterRoot(signaler: Modules.IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any {
            switch(cmd.cmdId) {
                case Dts.ECommandId.signal_center_deliver:
                    return this.on_signal_center_deliver(signaler, cmd);                    
                    break;
                case Dts.ECommandId.signal_center_pmessage:
                    this.on_signal_center_pmessage(signaler, cmd);
                    return ADHOCCAST.Cmds.Common.EEventEmitterEmit2Result.preventRoot;
                    break;
            }                
        },
        
        async on_signal_center_pmessage(signaler: Modules.IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<Dts.IKeyspaceEvents>) {
            switch(cmd.props.message) {
                case 'expired':
                    await RedisSignaler.registServer(signaler);
                    await Redundance.req(signaler);
                    break;
            }
        },

        on_signal_center_deliver(signaler: Modules.IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>) {
            let data = cmd.props as ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Cmds.ICommandDataProps>;
            if (data.cmdId == ADHOCCAST.Cmds.ECommandId.adhoc_kickoff && 
                data.type == ADHOCCAST.Cmds.ECommandType.resp) {

            } else {
                signaler.onDeliverCommand(cmd)
                return ADHOCCAST.Cmds.Common.EEventEmitterEmit2Result.preventRoot;
            }
        }
    }

    // onSendFilter
    static SendFilter = {
        onAfterRoot(signaler: Modules.IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any {
            if (!cmd.from) {
                cmd.from = {};
                let me = ADHOCCAST.Services.Cmds.User.CurrentUser(signaler.conneciton.instanceId);
                if (me) {
                    cmd.from.type = 'server';
                    cmd.from.id = me.id;
                } else {
                    cmd.from.type = 'socket';
                    cmd.from.id = signaler.conneciton.signaler.id();
                }
            }
                 
            switch(cmd.cmdId) {
                case ADHOCCAST.Dts.ECommandId.adhoc_login:
                    this.on_after_adhoc_login(signaler, cmd);
                    return ADHOCCAST.Cmds.Common.EEventEmitterEmit2Result.preventRoot;
                case Dts.ECommandId.signal_center_deliver:
                    this.on_signal_center_deliver(signaler, cmd);
                    break;   
            }            
        },
    
        on_after_adhoc_login(signaler: Modules.IRedisSignaler, data: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>) {
            //Resp
            let props = data.props || {};
            let user = props.user || {} as any;
            user.id = user.id || signaler.server.getId()
            user.sid = user.sid || signaler.conneciton.signaler.id()
            user.room = user.room || {} as any;
            user.room.id = user.room.id || 'servers';
    
            props.user = user;
            let resp = Object.assign({}, data) as ADHOCCAST.Dts.ICommandData<any>;
            resp.type = ADHOCCAST.Dts.ECommandType.resp;
            resp.to = data.from;
            resp.from = {type:'server', id: ''}
            resp.props = props;        
            resp.respResult = true;
    
            signaler.conneciton.dispatcher.onCommand(resp);
        },
        async on_signal_center_deliver(signaler: Modules.IRedisSignaler, data: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>) {
            data.from = data.from ||  { type: 'server', id: signaler.server.getId() };     

            let extra = data.extra as ADHOCCAST.Dts.ICommandData<Dts.ICommandDeliverDataExtraProps>
            if (extra.to.type == 'server') 
                extra.to.id = extra.to.id || signaler.server.getId();

            data.to = data.to || extra.to;
            if (data.to.type == 'server' && !data.to.id) {
                data.to =  extra.to;
            }                
        }
    }

    // onAfterRoot
    static onAfterRoot(signaler: Modules.IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommand) {
        switch(cmd.data.cmdId) {
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
                this.on_after_adhoc_login(signaler, cmd);
                break;      
            case ADHOCCAST.Cmds.ECommandId.network_connect:
                this.on_after_network_connect(signaler, cmd);
                break;                        
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                this.on_after_network_disconnect(signaler, cmd);
                break;
            case Dts.ECommandId.signal_center_redis_node_add:
                    this.on_after_redis_node_add(signaler, cmd);
                    break;
        }                
    }
    static async on_after_adhoc_login(signaler: Modules.IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommand) {
        signaler.database.syncData();
    }      
    static async on_after_network_connect(signaler: Modules.IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommand) {
        let serverExsitChannel = signaler.getServerExistChannel();

        //redundancy after connect
        await this.subscribeServerKeyspace(signaler);
        await signaler.del(serverExsitChannel);
        await Redundance.req(signaler);
        
        //subscribe server channels
        await this.registServer(signaler);

        signaler.tryLogin();
    }      
    static async on_after_network_disconnect(signaler: Modules.IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommand) {
        signaler.stopHandshake();       
        // NetworkException.req(signaler);
        NetworkException.disconnectAll(signaler)
    }
    static async on_after_redis_node_add(signaler: Modules.IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommand) {
        let data: ADHOCCAST.Cmds.ICommandData<Dts.IRedisNode> = cmd.data;
        let clientSocket = data.props.clientSocket;
        let node = data.props.node;
        let type = data.props.type;
        if (type == 'sub') {
            this.subscribeServerKeyspace(signaler, node)
            node.off('pmessage', clientSocket.on_pmessage)
            node.on('pmessage', clientSocket.on_pmessage)
        }
    } 
    static async registServer(signaler:  Modules.IRedisSignaler) {
        let serversChannel = signaler.getServersChannel();
        let serverChannel = signaler.getServerChannel();
        let serverExsitChannel = signaler.getServerExistChannel();
        await signaler.subscribe(serversChannel);
        await signaler.subscribe(serverChannel);
        await signaler.hset(serversChannel, serverChannel, 'true');
        await signaler.set(serverExsitChannel, 'true');
        signaler.startHandshake();
    }
    static async subscribeServerKeyspace(signaler: Modules.IRedisSignaler, node?: IORedis.Redis) {
        // open notify-keyspace-events
        let notifyKeyspaceEvents = 'notify-keyspace-events';
        let kKey = 'K';
        let xKey = 'x';
        let configKeys: string[];

        if (node)
            configKeys = await signaler.processPromise<any>(node.config('GET', [notifyKeyspaceEvents]));
        else 
            configKeys = await signaler.redisconfig('get', notifyKeyspaceEvents);

        let keys = configKeys ? configKeys[1] : '';        
        let kIndex = keys.indexOf(kKey);
        let xIndex = keys.indexOf(xKey);
        if ( kIndex < 0 || xIndex < 0) {
            if (kIndex < 0) keys = kKey + keys;
            if (xIndex < 0) keys = keys + xKey;
            if (node)
                await signaler.processPromise(node.config('SET', notifyKeyspaceEvents, keys));
            else 
                await signaler.redisconfig('set', notifyKeyspaceEvents, keys);
        }

        // subscribe server channel expired event
        let serverKeyspacePChannel = signaler.getServerKeyspacePChannel();
        if (node)
            await signaler.processPromise(node.psubscribe(serverKeyspacePChannel));
        else
            await signaler.psubscribe(serverKeyspacePChannel);
    }  
}