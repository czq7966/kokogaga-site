import * as ADHOCCAST from '../../../adhoc-cast-connection/src/main/dts'
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
        this.conn = new ADHOCCAST.Connection(signalerUrl);

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
    }
}

new Test();