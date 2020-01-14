import * as Dts from "../dts";
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import { ServiceNamespace } from "./namespace";
import { ServiceUser } from "./user";


export class ServiceRoom {
    static async get(roomid: string, sckUser: Modules.ISocketUser): Promise<Dts.IRoom> {
        return await ServiceUser.getDatabaseNamespace(sckUser).getRoom(roomid);
        // return sckUser.users.rooms.get(roomid);
    }
    static async create(roomid: string, sckUser: Modules.ISocketUser): Promise<Dts.IRoom> {
        let uroom = await ServiceUser.getDatabaseNamespace(sckUser).createRoom(roomid)
        sckUser.users.rooms.add(roomid, uroom);
        return uroom;
        // let uroom = await this.get(roomid, sckUser);
        // if (!uroom) {
        //     uroom = {
        //         id: roomid,
        //         sim: Cmds.Common.Helper.uuid()
        //     }
        //     uroom = await ServiceUser.getDatabaseNamespace(sckUser).createRoom(roomid)
        //     sckUser.users.rooms.add(roomid, uroom);
        // }
        // return uroom;        
    }
    static async exist(roomid: string, sckUser: Modules.ISocketUser): Promise<boolean> {
        return await ServiceUser.getDatabaseNamespace(sckUser).existRoom(roomid);
        // let uroom = await this.get(roomid, sckUser);
        // if (uroom) {
        //     let room = sckUser.socket.adapter.rooms[uroom.sim];
        //     return !!room;            
        // }
        // return false;
    }
    static async open(roomid: string, sckUser: Modules.ISocketUser, isOwner: boolean = true): Promise<any> {
        let room = await ServiceUser.getDatabaseNamespace(sckUser).openRoom(roomid);
        room && await ServiceUser.getDatabaseNamespace(sckUser).joinRoom(roomid, sckUser.user);
        await this.joinSocketRoom(room, sckUser);
        sckUser.users.rooms.add(roomid, room);
        isOwner && sckUser.openRooms.add(roomid, true);

        // return new Promise((resolve, reject) => {
        //     ServiceUser.getDatabaseNamespace(sckUser).openRoom(roomid)
        //     .then(room => {
        //         sckUser.users.rooms.add(roomid, room);
        //         let sim = room.sim;
        //         sckUser.socket.join(sim, err => {
        //             if (err) {
        //                 reject(err)                    
        //             } else {                        
        //                 isOwner && sckUser.openRooms.add(roomid, true);
        //                 resolve(roomid)
        //             }
        //         })
        //     })
        //     .catch(e => {
        //         reject(e)
        //     })         
        // })
    }
    static async close(roomid: string, sckUser: Modules.ISocketUser): Promise<any> {
        let room = await ServiceUser.getDatabaseNamespace(sckUser).closeRoom(roomid);
        room && await this.closeSocketRoom(room, sckUser)
        sckUser.openRooms.del(roomid);
        sckUser.users.rooms.del(roomid);

        // ServiceUser.getDatabaseNamespace(sckUser).openRoom(roomid)
        // let promises = [];
        // let adapter = sckUser.socket.adapter;
        // let uroom = await this.get(roomid, sckUser);
        // let sim = uroom && uroom.sim || '';
        // let room = adapter.rooms[sim];
        // if (room) {
        //     Object.keys(room.sockets).forEach(key => {
        //         let promise = new Promise((resolve, reject) => {
        //             adapter.del(key, sim, err => {                        
        //                 resolve();
        //             })
        //         })
        //         promises.push(promise)                    
        //     } )
        // }
        // sckUser.openRooms.del(roomid);
        // sckUser.users.rooms.del(roomid);

        // if (promises.length > 0)
        //     return Promise.all(promises)
        // else 
        //     return Promise.resolve();
    }    
    static async closeSocketRoom(room: Dts.IRoom, sckUser: Modules.ISocketUser):  Promise<any> {
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
    static async join(roomid: string, sckUser: Modules.ISocketUser):  Promise<any> {
        let room = await ServiceUser.getDatabaseNamespace(sckUser).getRoom(roomid);
        await ServiceUser.getDatabaseNamespace(sckUser).joinRoom(roomid, sckUser.user);  
        room && await this.joinSocketRoom(room, sckUser);
       
        // return new Promise(async (resolve, reject) => {
        //     let exist = ServiceRoom.exist(roomid, sckUser);
        //     if (exist) {
        //         let room = await this.get(roomid, sckUser);
        //         let sim = room.sim;
        //         sckUser.socket.join(sim, err => {
        //             if (err) {
        //                 reject(err)
        //             } else {
        //                 resolve(roomid)
        //             }
        //         });
        //     } else {
        //         reject('Room not exist')                
        //     }
        // })
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
    static async leave(roomid: string, sckUser: Modules.ISocketUser): Promise<any> {
        let room = await ServiceUser.getDatabaseNamespace(sckUser).getRoom(roomid);
        await ServiceUser.getDatabaseNamespace(sckUser).leaveRoom(roomid, sckUser.user);  
        room && this.leaveSocketRoom(room, sckUser);


        // return new Promise(async (resolve, reject) => {
        //     let uroom = await this.get(roomid, sckUser);
        //     let sim = uroom && uroom.sim || '';
        //     sckUser.socket.leave(sim, err => {
        //         resolve()
        //     });    
        // })
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
    static async joinOrOpen(roomid: string, sckUser: Modules.ISocketUser): Promise<any> {
        let room = await ServiceUser.getDatabaseNamespace(sckUser).getRoom(roomid);
        if (room)
            await this.join(roomid, sckUser)
        else 
            await this.open(roomid, sckUser);
    }
    static async leaveOrClose(roomid: string, sckUser: Modules.ISocketUser): Promise<any> {
        await this.leave(roomid, sckUser);
        let count = await ServiceUser.getDatabaseNamespace(sckUser).getRoomUserCount(roomid);
        if (count <=0 ) 
            await this.close(roomid, sckUser)
    }    
    static async changeId(oldId: string, newId: string, sckUser: Modules.ISocketUser): Promise<any> {
        let uroom = await this.get(oldId, sckUser);
        if (uroom) {
            uroom.id = newId;
            sckUser.users.rooms.del(oldId);
            sckUser.users.rooms.add(newId, uroom);
            sckUser.openRooms.del(oldId);
            sckUser.openRooms.add(newId, true);
            return Promise.resolve(newId);
        } else {
            return Promise.reject('Room not exist ' + oldId)
        }
    }
    static async onDeliverCommand(namespace: Modules.ISocketNamespace, roomid: string, sckUser: Modules.ISocketUser, cmd: Dts.ICommandData<any>, includeSelf: boolean) {
        let _sckUser = sckUser || await ServiceNamespace.getLocalRoomFirstUser(namespace, roomid);
        _sckUser && _sckUser.dispatcher.sendCommand(cmd, _sckUser, includeSelf);
    }
}