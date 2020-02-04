import { ADHOCCAST } from '../../client/libex'
import { IMain } from './index';

export class Test {
    main: IMain
    isLogin: boolean;
    connnection: ADHOCCAST.IConnection;  
    eventRooter: ADHOCCAST.Cmds.Common.IEventRooter;  
    constructor(main: IMain){
        this.main = main;
        this.eventRooter = new ADHOCCAST.Cmds.Common.EventRooter();
        let connParams: ADHOCCAST.IConnectionConstructorParams = {
            instanceId: ADHOCCAST.Cmds.Common.Helper.uuid(),
            // factorySignaler: null,
            // signalerBase: "http://192.168.252.89:55888",
            signalerBase: "http://127.0.0.1:2770",
            namespace: "promethean",
            path: '/socket.io',
            notInitDispatcherFilters: true,
            parent: this
        }        
        this.connnection = ADHOCCAST.Connection.getInstance(connParams);
        this.initEvents()
        this.start();  
    }
    destroy(){
        this.connnection.disconnect();
        this.connnection.destroy();
        delete this.connnection;
    }
    async start(){
        await this.tryLogin();
        setTimeout(() => {
            this.connnection.disconnect();
        }, Math.random() * 10 * 1000);              
    }

    initEvents() {
        this.connnection.dispatcher.eventRooter.onAfterRoot.add(this.onAfterRoot)
    }
    unInitEvents() {
        this.connnection.dispatcher.eventRooter.onAfterRoot.remove(this.onAfterRoot)
    }      

    async tryLogin() {
        try {
            // await this.connnection.signaler.connect();            
            console.log('111111111')   
            let user: ADHOCCAST.Dts.IUser = {
                id: null,
                // room: {
                //     id: ADHOCCAST.Cmds.Common.Helper.uuid()
                // }

            }
            let result = await this.connnection.retryLogin(user, null, null, 5 * 1000); 
        } catch(e) {
            return await this.tryLogin()
        }            
    }
    onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        switch(cmd.data.cmdId) {
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
                this.isLogin = true;
                this.main.onLogin();
                break;
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:                
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                if (this.isLogin) {                    
                    this.main.onDisconnect();
                    this.isLogin = false;
                }
                this.start();
                break;
        }   
    }
}