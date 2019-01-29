import * as ADHOCCAST from '../../../adhoc-cast-connection/src/main/dts'
import { IConnectionConstructorParams } from '../../../adhoc-cast-connection/src/main/dts';
ADHOCCAST.Config.platform = ADHOCCAST.EPlatform.browser;
var debug = ADHOCCAST.Cmds.Common.Helper.Debug;
debug.enabled = true;

export class Test {
    params: URLSearchParams;
    conn: ADHOCCAST.Connection;
    constructor() {
        this.params = new URLSearchParams(location.search);
        let signalerUrl = window.location.origin;        
        // signalerUrl = 'http://192.168.252.87:13170'

        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: ADHOCCAST.Cmds.Common.Helper.uuid(),
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
            ADHOCCAST.Services.ServiceRoomOpen.open(this.conn.instanceId, room)
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
            ADHOCCAST.Services.ServiceRoomClose.close(this.conn.instanceId, room)
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
            ADHOCCAST.Services.ServiceRoomJoin.join(this.conn.instanceId, room)
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
            ADHOCCAST.Services.ServiceRoomLeave.leave(this.conn.instanceId, room)
            .then(() => {
                console.log('room-leave success')
            })
            .catch(err => {
                console.error('room-leave error', err)
            })
        }         
    }
}

new Test();