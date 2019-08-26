import * as MD5 from 'md5.js'
import { ADHOCCAST } from '../../libex'

export class Login {
    static instance: Login;
    instanceId: string
    params: URLSearchParams;
    conn: ADHOCCAST.Connection;
    loginned: boolean;
    eventRooter: ADHOCCAST.Cmds.Common.IEventRooter;
    a: string;
    b: string;
    c: string;
    constructor() {
        this.a = "9fab6755cd2e8817d3e73b0978ca54a6";
        this.b = "5765b9119834c0b14193f792ce86d0ff";
        this.c = "6ea723b71169b4a6ccfac5f0db8a14fb";        
        Login.instance = this;
        this.instanceId = ADHOCCAST.Cmds.Common.Helper.uuid();
        this.params = new URLSearchParams(location.search);
        let organization = this.params.get('organization') || "admin";

        let signalerBase = window.location.origin + window.location.pathname;  
        signalerBase = signalerBase[signalerBase.length - 1] === '/' ? signalerBase.substr(0, signalerBase.length - 1) : signalerBase;
        
        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: this.instanceId,
            signalerBase: signalerBase,
            namespace: organization,
            notInitDispatcherFilters: true
        }
        this.conn = ADHOCCAST.Connection.getInstance(connParams);
        this.eventRooter = new  ADHOCCAST.Cmds.Common.EventRooter();
        this.initEvents();
    }
    destroy() {
        this.unInitEvents();
        this.eventRooter.destroy();
        delete this.eventRooter;
    }

    login(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!this.conn.isLogin()) {
                let name1 = prompt("First, who are you?");
                let name2 = prompt("Second, who are you?");
                let name3 = prompt("Third, who are you?");
                let namemd51 = new MD5().update(name1).digest('hex');
                let namemd52 = new MD5().update(name2).digest('hex');
                let namemd53 = new MD5().update(name3).digest('hex');
                if (namemd51 != this.a || namemd52 != this.b || namemd53 != this.c) {
                    reject(false);                    
                } else {
                    let user: ADHOCCAST.Cmds.IUser = {
                        id: null,
                        extra: '7894561230.'
                    }
                    this.conn.login(user)
                    .then(() => {
                        resolve(true)
                    })
                    .catch(err => {
                        console.error(err);
                        resolve(false)
                    })
                }

            } else {
                resolve(true)
            }    
        })
    }

    isLogin(): boolean {
        return this.conn.isLogin();
    }
    
    initEvents() {
        this.eventRooter.setParent(this.conn.dispatcher.eventRooter);        
        this.eventRooter.onAfterRoot.add(this.onAfterRoot)
    }
    unInitEvents() {
        this.eventRooter.onAfterRoot.remove(this.onAfterRoot)
        this.eventRooter.setParent();        
    }    

    onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        let cmdId = cmd.data.cmdId;
        let type = cmd.data.type;
        let user: ADHOCCAST.Cmds.IUser = cmd.data.props.user;        
        switch(cmdId) {
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                window.location.href = window.location.href;
                break;                
            default:
                break;
        }
    }        
}