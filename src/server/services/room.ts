import * as Cmds from '../cmds/index'

import * as Modules from '../modules'

export class ServiceRoom extends Cmds.Common.Base {

    static exist(roomid: string, sckUser: Modules.SocketUser): boolean {
        let room = sckUser.socket.adapter.rooms[roomid];
        return !!room;
    }
    static open(roomid: string, sckUser: Modules.SocketUser): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!ServiceRoom.exist(roomid, sckUser)) {
                sckUser.socket.join(roomid, err => {
                    if (err) {
                        reject(err)                    
                    } else {
                        sckUser.openRooms.add(roomid, true);
                        resolve(roomid)
                    }
                })
            } else {
                reject('Room already exist!')
            }            
        })
    }
    static close(roomid: string, sckUser: Modules.SocketUser): Promise<any> {
        let promises = [];
        let adapter = sckUser.socket.adapter;
        let room = adapter.rooms[roomid];
        if (room) {
            Object.keys(room.sockets).forEach(key => {
                let promise = new Promise((resolve, reject) => {
                    adapter.del(key, roomid, err => {                        
                        resolve();
                    })
                })
                promises.push(promise)                    
            } )
        }
        sckUser.openRooms.del(roomid);

        if (promises.length > 0)
            return Promise.all(promises)
        else 
            return Promise.resolve();
    }    
    static join(roomid: string, sckUser: Modules.SocketUser):  Promise<any> {
        return new Promise((resolve, reject) => {
            if (ServiceRoom.exist(roomid, sckUser)) {
                sckUser.socket.join(roomid, err => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(roomid)
                    }
                });
            } else {
                reject('Room not exist')                
            }
        })
    }
    static leave(roomid: string, sckUser: Modules.SocketUser): Promise<any> {
        return new Promise((resolve, reject) => {
            sckUser.socket.leave(roomid, err => {
                resolve()
            });    
        })
    }    
    static joinOrOpen(roomid: string, sckUser: Modules.SocketUser): Promise<any> {
        return new Promise((resolve, reject) => {
            sckUser.socket.join(roomid, err => {
                if (err) {
                    reject(err)                    
                } else {
                    resolve(roomid)
                }
            })
        })
    }

}