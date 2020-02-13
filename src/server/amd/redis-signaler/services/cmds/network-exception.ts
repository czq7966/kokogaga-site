import * as Dts from '../../dts'
import { IRedisSignaler } from "../../modules/redis-signaler";
import { ADHOCCAST } from '../../libex'

export class NetworkException {
    static async req(signaler: IRedisSignaler) {
        let cmd : ADHOCCAST.Dts.ICommandData<any> = {
            cmdId: ADHOCCAST.Dts.ECommandId.network_exception,
            props: {},            
            from:{
                type: 'server',
                id: ''
            }
        }
        signaler.server.snsps.keys().forEach(key => {
            let snsp = signaler.server.snsps.get(key);
            snsp.nsp.emit(ADHOCCAST.Dts.CommandID, cmd);
        })
    }
    static async disconnectAll(signaler: IRedisSignaler) {
        signaler.server.snsps.keys().forEach(key => {
            let snsp = signaler.server.snsps.get(key);
            let users = snsp.users.users;
            snsp.users.users.keys().forEach(key => {
                let sckUser = users.get(key)
                if (sckUser && sckUser.socket && sckUser.socket.connected) {
                    sckUser.socket.disconnect()
                }
            })
        })
    }
    static async reqRoom(signaler: IRedisSignaler, namespace: string, roomid:string) {
        let cmd : ADHOCCAST.Dts.ICommandData<any> = {
            cmdId: ADHOCCAST.Dts.ECommandId.network_exception,
            props: {},            
            from:{
                type: 'server',
                id: ''
            },
            to: {
                type: 'room',
                id: roomid
            }
        }
        let extra: ADHOCCAST.Dts.ICommandData<Dts.ICommandDeliverDataExtraProps> = {
            props: {
                namespace: namespace,
                includeSelf: true
            },
            from: {
                type: 'server',
                id: signaler.server.getId()                    
            },
            to: Object.assign({}, cmd.to)
        }
        await signaler.deliverCommand(cmd, extra)
    }
    static async reqRoomChannel(signaler: IRedisSignaler, channel: string) {
        let namespace = signaler.getNamespaceFromChannel(channel);
        let roomid = signaler.getRoomidFromRoomChannel(channel);
        if (namespace && roomid)
            await this.reqRoom(signaler, namespace, roomid)
    }
    static async reqRoomChannels(signaler: IRedisSignaler, channels: string[]) {
        let promises: Promise<any>[] =[];
        channels.forEach(channel => {
            promises.push(this.reqRoomChannel(signaler, channel))
        })
        return Promise.all(promises);
    }

}