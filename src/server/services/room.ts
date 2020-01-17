import * as Dts from "../dts";
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import { ServiceNamespace } from "./namespace";
import { ServiceUser } from "./user";
import { ServiceUsers } from "./users";


export class ServiceRoom {
    static async get(roomid: string, sckUser: Modules.ISocketUser): Promise<Dts.IRoom> {
        return await ServiceUser.getDatabaseNamespace(sckUser).getRoom(roomid);
    }
    static async create(roomid: string, sckUser: Modules.ISocketUser): Promise<Dts.IRoom> {
        let uroom = await ServiceUser.getDatabaseNamespace(sckUser).createRoom(roomid)
        ServiceUsers.addRoom(sckUser.users, uroom);
        return uroom;
    }
    static async exist(roomid: string, sckUser: Modules.ISocketUser): Promise<boolean> {
        return await ServiceUser.getDatabaseNamespace(sckUser).existRoom(roomid);
    }
    static async open(roomid: string, sckUser: Modules.ISocketUser, isOwner: boolean = true): Promise<any> {
        let room = await ServiceUser.getDatabaseNamespace(sckUser).openRoom(roomid);
        await ServiceUser.getDatabaseNamespace(sckUser).joinRoom(roomid, sckUser.user);
        await this.joinSocketRoom(room, sckUser);
        ServiceUsers.addRoom(sckUser.users, room, true);
        isOwner && ServiceUser.addRoom(sckUser, room);
    }
    static async close(roomid: string, sckUser: Modules.ISocketUser): Promise<any> {
        let room = await ServiceUser.getDatabaseNamespace(sckUser).closeRoom(roomid);
        room && await this.closeSocketRoom(room, sckUser)
        ServiceUsers.delRoom(sckUser.users, roomid, true);
        ServiceUser.delRoom(sckUser, roomid, true);
    }    
   
    static async join(roomid: string, sckUser: Modules.ISocketUser):  Promise<any> {
        let room = await ServiceUser.getDatabaseNamespace(sckUser).getRoom(roomid);
        await ServiceUser.getDatabaseNamespace(sckUser).joinRoom(roomid, sckUser.user);  
        if (room) {
            await this.joinSocketRoom(room, sckUser); 
            ServiceUsers.addRoom(sckUser.users, room, true);
        }
       

    }
    static async leave(roomid: string, sckUser: Modules.ISocketUser): Promise<any> {
        let room = await ServiceUser.getDatabaseNamespace(sckUser).getRoom(roomid);
        await ServiceUser.getDatabaseNamespace(sckUser).leaveRoom(roomid, sckUser.user);  
        room = room || sckUser.users.rooms.get(roomid);
        if (room) {
            this.leaveSocketRoom(room, sckUser);
            this.delSocketRoomWhileNoUser(room, sckUser);
        }
    }   
    static async joinOrOpen(roomid: string, sckUser: Modules.ISocketUser): Promise<any> {
        let room = await ServiceUser.getDatabaseNamespace(sckUser).getRoom(roomid);
        if (room)
            await this.join(roomid, sckUser)
        else 
            await this.open(roomid, sckUser);
    }
    static async leaveOrClose(roomid: string, sckUser: Modules.ISocketUser): Promise<any> {
        await this.leave(roomid, sckUser);
        let count = await ServiceUser.getDatabaseNamespace(sckUser).getRoomUsersCount(roomid);
        if (!count) await this.close(roomid, sckUser);


    }    
    static async changeId(oldId: string, newId: string, sckUser: Modules.ISocketUser): Promise<any> {
        let uroom = await this.get(oldId, sckUser);
        if (uroom) {
            uroom.id = newId;
            ServiceUsers.delRoom(sckUser.users, oldId);
            ServiceUsers.addRoom(sckUser.users, uroom);
            ServiceUser.delRoom(sckUser, oldId);
            ServiceUser.addRoom(sckUser, uroom);
            return Promise.resolve(newId);
        } else {
            return Promise.reject('Room not exist ' + oldId)
        }
    }
    static closeSocketRoom(room: Dts.IRoom, sckUser: Modules.ISocketUser):  Promise<any> {
        let promises = [];
        let adapter = sckUser.socket.adapter;
        let sim = room && room.sim || '';
        let socketRoom = adapter.rooms[sim];
        if (socketRoom) {
            Object.keys(socketRoom.sockets).forEach(key => {
                let promise = new Promise((resolve, reject) => {
                    adapter.del(key, sim, err => {                        
                        resolve();
                    })
                })
                promises.push(promise)                    
            } )
        }
        if (promises.length > 0)
            return Promise.all(promises)
        else 
            return Promise.resolve();
    }     
    static joinSocketRoom(room: Dts.IRoom, sckUser: Modules.ISocketUser):  Promise<any> {
        return new Promise((resolve, reject) => {
            let sim = room && room.sim || '';
            sckUser.socket.join(sim, err => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            });     
        })
    }
    static leaveSocketRoom(room: Dts.IRoom, sckUser: Modules.ISocketUser):  Promise<any> {
        return new Promise((resolve, reject) => {
            let sim = room && room.sim || '';
            sckUser.socket.leave(sim, err => {
                if (err) {
                    reject(err)
                } else {
                    resolve()
                }
            });     
        })
    }  
    static getRoomSocketCount(room: Dts.IRoom, sckUser: Modules.ISocketUser): number {
        let promises = [];
        let adapter = sckUser.socket.adapter;
        let sim = room && (room.sim || room.id);
        let socketRoom = adapter.rooms[sim];
        if (socketRoom) {
            return Object.keys(socketRoom.sockets).length
        }
        return 0;
    }
    static delSocketRoomWhileNoUser(room: Dts.IRoom, sckUser: Modules.ISocketUser) {
        let count = this.getRoomSocketCount(room, sckUser);
        if (!count) {
            ServiceUsers.delRoom(sckUser.users, room.id)
        }        
    }
    static deleteR
    static async onDeliverCommand(namespace: Modules.ISocketNamespace, roomid: string, sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>, includeSelf: boolean) {
        let _sckUser = sckUser || await ServiceNamespace.getLocalRoomFirstUser(namespace, roomid);
        _sckUser && _sckUser.dispatcher.sendCommand(cmd, _sckUser, includeSelf);
    }
}