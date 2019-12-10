import { EventEmitter } from "events";
import { ADHOCCAST } from '../libex/index'

export interface IConfig extends ADHOCCAST.IConnectionConstructorParams {
    roomPrefix: string;
}

export class Device {
    deviceID: string;
    config: IConfig;
    eventEmitter: EventEmitter;
    eventRooter: ADHOCCAST.Cmds.Common.IEventRooter;
    connection: ADHOCCAST.Connection;
    players: Array<HTMLVideoElement>;
    constructor(config: IConfig) {
        this.config = Object.assign(config);
        this.eventEmitter = new EventEmitter();        
        this.eventRooter = new ADHOCCAST.Cmds.Common.EventRooter();
        this.players = [];
        config.instanceId = config.instanceId || ADHOCCAST.Cmds.Common.Helper.uuid();
        config.notInitDispatcherFilters = true;
        config.parent = this;
        this.connection = ADHOCCAST.Connection.getInstance(config);
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        this.removePlayers();
        this.connection.disconnect();
        this.connection.destroy();
        delete this.connection;
        delete this.eventEmitter;
        delete this.config;
        delete this.players;
    }
    initEvents() {
        this.eventRooter.setParent(this.connection.dispatcher.eventRooter);        
        this.eventRooter.onAfterRoot.add(this.onAfterRoot)        
    }
    unInitEvents() {
        this.eventRooter.onAfterRoot.remove(this.onAfterRoot)
        this.eventRooter.setParent();              
        this.eventEmitter.removeAllListeners();
    }
    onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        let cmdId = cmd.data.cmdId;
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
                this.on_adhoc_login(cmd);
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                    this.on_network_disconnect(cmd);
                break;         
            case ADHOCCAST.Cmds.ECommandId.user_state_onchange:
                this.on_user_state_onchange(cmd);
                break;      
            case ADHOCCAST.Cmds.ECommandId.stream_webrtc_onrecvstream:
                this.on_stream_webrtc_onrecvstream(cmd);
                break; 
            default:
                break;
        }
    }      

    on_adhoc_login (cmd: ADHOCCAST.Cmds.Common.ICommand) {
        let type = cmd.data.type;
        if (type == ADHOCCAST.Cmds.ECommandType.resp) {
            this.eventEmitter.emit('onReady', this);
        }
    }    

    on_network_disconnect (cmd: ADHOCCAST.Cmds.Common.ICommand) {
        this.eventEmitter.emit('onUnReady', this);
        this.setDeviceID(this.deviceID);
    }       
    on_user_state_onchange (cmd: ADHOCCAST.Cmds.Common.ICommand) {
        let me = this.connection.rooms.getLoginRoom().me().item;
        let user = cmd.data.props.user as ADHOCCAST.Cmds.IUser;
        if (me.room.id == user.room.id && me.id != user.id && user.sid == this.deviceID) {
            let values = user.extra as ADHOCCAST.Cmds.Common.Helper.IStateChangeValues
            if (ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(values.chgStates, ADHOCCAST.Dts.EUserState.stream_room_sending) && 
                ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(values.newStates, ADHOCCAST.Dts.EUserState.stream_room_sending)) {
                this.recvUserStream(cmd.instanceId, user)
            }
        }
    }   
    on_stream_webrtc_onrecvstream (cmd: ADHOCCAST.Cmds.Common.ICommand) {     
        this.refreshPlayers();            
    }
    recvUserStream(instanceId: string, user: ADHOCCAST.Cmds.IUser): Promise<any> {
        return new Promise((resolve, reject) => {
            if (ADHOCCAST.Cmds.Common.Helper.StateMachine.isset(user.states, ADHOCCAST.Dts.EUserState.stream_room_sending)) {
                let toUser = {
                    id: user.id,
                    room: {
                        id: ADHOCCAST.Services.Cmds.User.getStreamRoomId(user)
                    }                        
                }
                ADHOCCAST.Services.Cmds.StreamRoomJoin.joinAndHelloAndReady(instanceId, toUser)
                .then(data => {  
                    resolve(data)
                })
                .catch(err => {
                    reject(err)    
                })
            }  else {
                reject('user has not sending stream')
            }            
        })   
    }


    setDeviceID(id: string): Promise<any> {   
        this.deattachPlayersStream();
        this.deviceID = id;     
        if (!this.deviceID) {
            this.connection.stopRetryLogin();
            if (this.connection.isLogin()) {
                this.connection.disconnect();
            }
            return Promise.resolve();
        } else {
            let user: ADHOCCAST.Dts.IUser = {
                id: null,
                room: {
                    id: this.config.roomPrefix + this.deviceID
                }
            }
            return this.connection.retryLogin(user);
        }
    }
    addPlayer(video: HTMLVideoElement) {
        let idx = this.players.indexOf(video);
        if (idx < 0) {
            this.players.push(video);
            this.attachPlayerStream(video);
        }
    }
    removePlayer(video: HTMLVideoElement): boolean {
        let idx = this.players.indexOf(video);
        if (idx >=0) {
           this.players.splice(idx, 1);
           this.deattachPlayerStream(video);
        }
        return this.players.indexOf(video) < 0;
    }
    removePlayers() {
        while(this.players.length > 0) {
            this.removePlayer(this.players[0]);
        }
    }
    getRecvStream(): MediaStream {
        let mLoginRoom = this.connection.isLogin() && this.connection.rooms.getLoginRoom();
        let mDeviceUser = !!mLoginRoom && mLoginRoom.getUserBySid(this.deviceID);
        let mStreamRoom = !!mDeviceUser && mDeviceUser.getStreamRoom();
        let mStreamMe = !!mStreamRoom && mStreamRoom.me();
        let mStreamPeer = !!mStreamMe && mStreamMe.peer;
        let streams = !!mStreamPeer && mStreamPeer.streams;
        let stream = !!streams && (streams.recvs.count() > 0) && streams.recvs.values()[0];        
        return !!stream ? stream : null;
    }
    attachPlayerStream(video: HTMLVideoElement) {
        let stream = this.getRecvStream();
        video.srcObject = stream;
    }
    attachPlayersStream() {
        this.players.forEach(player => {
            this.attachPlayerStream(player);
        })
    }
    deattachPlayerStream(video: HTMLVideoElement) {
        video.srcObject = null;
    }
    deattachPlayersStream() {
        this.players.forEach(player => {
            this.deattachPlayerStream(player);
        })        
    }
    refreshPlayers() {
        this.attachPlayersStream();
    }
}

