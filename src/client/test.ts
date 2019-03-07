import { ADHOCCAST } from './libex'
var debug = ADHOCCAST.Cmds.Common.Helper.Debug;
debug.enabled = true;


// let connParams: ADHOCCAST.IConnectionConstructorParams = {
//     instanceId: 'aaaa',
//     url: 'http://192.168.252.87:13670/nd'
// }
// var conn: ADHOCCAST.Connection = ADHOCCAST.Connection.getInstance(connParams);

// function login() {
//     let user: ADHOCCAST.Cmds.IUser ={
//         id: null,
//     }        
//     conn.login(user)
//     .then(() => {
//         console.log('登录成功')
//     })
//     .catch(err => {
//         console.error('登录失败',err)
//     })    
// }

// login();



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
        signalerUrl = 'http://192.168.252.87:13670/admin'

        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: this.instanceId,
            url: signalerUrl
        }
        this.conn = ADHOCCAST.Connection.getInstance(connParams);

        (document.getElementById("test-login") as HTMLButtonElement).onclick = () => {
            let user ={
                id: null,
                extra: '7894561230.'
            }
            this.conn.login(user)
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

            // ADHOCCAST.Services.Cmds.StreamRoomHello.hello(this.conn.instanceId, me)
            // .then(() => {
            //     console.log('stream-room-leave success')
            // })
            // .catch(err => {
            //     console.error('stream-room-leave error', err)
            // })
        }    
        
        (document.getElementById("test-admin-config-get") as HTMLButtonElement).onclick = () => {
            let room: ADHOCCAST.Cmds.IRoom = {
                id: 'stream/test'
            }
            ADHOCCAST.Services.Cmds.AdminConfigGet.get(this.conn.instanceId)
            .then((data) => {
                console.log('admin-config-get success', data)
            })
            .catch(err => {
                console.error('admin-config-get', err)
            })
        }    
        
        (document.getElementById("test-admin-config-update") as HTMLButtonElement).onclick = () => {
            let url = 'http://betacs.101.com/v0.1/static/preproduction_content_adhoccast/signaler_server/config.json'
            ADHOCCAST.Services.Cmds.AdminConfigUpdate.update(this.conn.instanceId, url)
            .then((data) => {
                console.log('admin-config-update success', data)
            })
            .catch(err => {
                console.error('admin-config-update', err)
            })
        }  
        (document.getElementById("test-admin-namespace-status") as HTMLButtonElement).onclick = () => {
            let names = ['nd', 'test']
            ADHOCCAST.Services.Cmds.AdminNamespaceStatus.get(this.conn.instanceId, names)
            .then((data) => {
                console.log('admin-namespace-status success', data)
            })
            .catch(err => {
                console.error('admin-namespace-status', err)
            })
        }          
        (document.getElementById("test-admin-namespace-close") as HTMLButtonElement).onclick = () => {
            let names = ['nd']
            ADHOCCAST.Services.Cmds.AdminNamespaceClose.close(this.conn.instanceId, names)
            .then((data) => {
                console.log('admin-namespace-close success', data)
            })
            .catch(err => {
                console.error('admin-namespace-close', err)
            })
        }  
        (document.getElementById("test-admin-namespace-open") as HTMLButtonElement).onclick = () => {
            let names = ['nd']
            ADHOCCAST.Services.Cmds.AdminNamespaceOpen.open(this.conn.instanceId, names)
            .then((data) => {
                console.log('admin-namespace-open success', data)
            })
            .catch(err => {
                console.error('admin-namespace-open', err)
            })
        }   
        (document.getElementById("test-admin-namespace-reset") as HTMLButtonElement).onclick = () => {
            let names = ['nd']
            ADHOCCAST.Services.Cmds.AdminNamespaceReset.reset(this.conn.instanceId, names)
            .then((data) => {
                console.log('admin-namespace-reset success', data)
            })
            .catch(err => {
                console.error('admin-namespace-reset', err)
            })
        }                                 
    }
}

new Test();
