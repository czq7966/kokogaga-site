import * as ADHOCCAST from '../../../adhoc-cast-connection/src/main/dts'
import { IConnectionConstructorParams } from '../../../adhoc-cast-connection/src/main/dts';
ADHOCCAST.Config.platform = ADHOCCAST.EPlatform.browser;
var debug = ADHOCCAST.Cmds.Common.Helper.Debug;
debug.enabled = true;

export class Test {
    instanceId: string
    params: URLSearchParams;
    conn: ADHOCCAST.Connection;
    constructor() {
        this.instanceId = ADHOCCAST.Cmds.Common.Helper.uuid();
        this.params = new URLSearchParams(location.search);
        let signalerUrl = window.location.origin + window.location.pathname;  
        signalerUrl = signalerUrl[signalerUrl.length - 1] === '/' ? signalerUrl.substr(0, signalerUrl.length - 1) : signalerUrl;
        
        // console.log(signalerUrl, window.location, this.params)      
        // signalerUrl = 'http://192.168.252.87:13170'

        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: this.instanceId,
            url: signalerUrl
        }
        this.conn = ADHOCCAST.Connection.getInstance(connParams);

        (document.getElementById("test-login") as HTMLButtonElement).onclick = () => {
            this.conn.login()
            .then(() => {
                console.log('登录成功')
            })
            .catch(err => {
                console.error('登录',err)
            })
        }

        (document.getElementById("test-logout") as HTMLButtonElement).onclick = () => {
            this.conn.logout()
            .then(() => {
                console.log('登出成功')
            })
            .catch(err => {
                console.error('登出', err)
            })
        }      
        
        (document.getElementById("test-room-open") as HTMLButtonElement).onclick = () => {
            let room: ADHOCCAST.Cmds.IRoom = {
                id: 'test'
            }
            ADHOCCAST.Services.Cmds.RoomOpen.open(this.conn.instanceId, room)
            .then(() => {
                console.log('room-open success')
            })
            .catch(err => {
                console.error('room-open error', err)
            })
        }  
        
        (document.getElementById("test-room-close") as HTMLButtonElement).onclick = () => {
            let room: ADHOCCAST.Cmds.IRoom = {
                id: 'test'
            }
            ADHOCCAST.Services.Cmds.RoomClose.close(this.conn.instanceId, room)
            .then(() => {
                console.log('room-close success')
            })
            .catch(err => {
                console.error('room-close error', err)
            })
        }  

        (document.getElementById("test-room-join") as HTMLButtonElement).onclick = () => {
            let room: ADHOCCAST.Cmds.IRoom = {
                id: 'test'
            }
            ADHOCCAST.Services.Cmds.RoomJoin.join(this.conn.instanceId, room)
            .then(() => {
                console.log('room-join success')
            })
            .catch(err => {
                console.error('room-join error', err)
            })
        }  
        
        (document.getElementById("test-room-leave") as HTMLButtonElement).onclick = () => {
            let room: ADHOCCAST.Cmds.IRoom = {
                id: 'test'
            }
            ADHOCCAST.Services.Cmds.RoomLeave.leave(this.conn.instanceId, room)
            .then(() => {
                console.log('room-leave success')
            })
            .catch(err => {
                console.error('room-leave error', err)
            })
        }       
        
        (document.getElementById("test-stream-room-open") as HTMLButtonElement).onclick = () => {
            let room: ADHOCCAST.Cmds.IRoom = {
                id: 'stream/test'
            }
            ADHOCCAST.Services.Cmds.StreamRoomOpen.open(this.conn.instanceId, room)
            .then(() => {
                console.log('stream-room-open success')
            })
            .catch(err => {
                console.error('stream-room-open error', err)
            })
        }   
        (document.getElementById("test-stream-room-close") as HTMLButtonElement).onclick = () => {
            let room: ADHOCCAST.Cmds.IRoom = {
                id: 'stream/test'
            }
            ADHOCCAST.Services.Cmds.StreamRoomClose.close(this.conn.instanceId, room)
            .then(() => {
                console.log('stream-room-close success')
            })
            .catch(err => {
                console.error('stream-room-close error', err)
            })
        }           
        
        (document.getElementById("test-stream-room-join") as HTMLButtonElement).onclick = () => {
            let room: ADHOCCAST.Cmds.IRoom = {
                id: 'stream/test'
            }
            ADHOCCAST.Services.Cmds.StreamRoomJoin.join(this.conn.instanceId, room)
            .then(() => {
                console.log('stream-room-join success')
            })
            .catch(err => {
                console.error('stream-room-join error', err)
            })
        }        
        
        (document.getElementById("test-stream-room-leave") as HTMLButtonElement).onclick = () => {
            let room: ADHOCCAST.Cmds.IRoom = {
                id: 'stream/test'
            }
            ADHOCCAST.Services.Cmds.StreamRoomLeave.leave(this.conn.instanceId, room)
            .then(() => {
                console.log('stream-room-leave success')
            })
            .catch(err => {
                console.error('stream-room-leave error', err)
            })
        }    
        
        (document.getElementById("test-stream-room-hello") as HTMLButtonElement).onclick = () => {
            let room: ADHOCCAST.Cmds.IRoom = {
                id: 'stream/test'
            }
            let mRoom = ADHOCCAST.Services.Modules.Rooms.getRoom(this.instanceId, room.id);
            let me =  ADHOCCAST.Services.Modules.Room.me(mRoom).item;

            ADHOCCAST.Services.Cmds.StreamRoomHello.hello(this.conn.instanceId, me)
            .then(() => {
                console.log('stream-room-leave success')
            })
            .catch(err => {
                console.error('stream-room-leave error', err)
            })
        }         
    }
}

new Test();