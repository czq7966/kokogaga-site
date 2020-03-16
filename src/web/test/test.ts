import { ADHOCCAST } from '../../client/libex'
import { IMain } from './index';

export class Test {
    id: string
    main: IMain
    isLogin: boolean;
    connnection: ADHOCCAST.IConnection;  
    eventRooter: ADHOCCAST.Cmds.Common.IEventRooter;  
    constructor(main: IMain, params: ADHOCCAST.IConnectionConstructorParams){
        this.id = ADHOCCAST.Cmds.Common.Helper.uuid(8, 10)
        this.main = main;
        this.eventRooter = new ADHOCCAST.Cmds.Common.EventRooter();
        let connParams: ADHOCCAST.IConnectionConstructorParams = Object.assign({}, params);
        connParams.parent = this;
        this.connnection = ADHOCCAST.Connection.getInstance(connParams);
        this.initEvents()
    }
    destroy(){
        this.connnection.stopRetryLogin();
        this.connnection.disconnect();
        this.connnection.destroy();
        delete this.connnection;
    }
    async start(){
        setTimeout(() => {
            this.tryLogin();
        },5 * 1000);                  
    }

    initEvents() {
        this.connnection.dispatcher.eventRooter.onAfterRoot.add(this.onAfterRoot)
    }
    unInitEvents() {
        this.connnection.dispatcher.eventRooter.onAfterRoot.remove(this.onAfterRoot)
    }      

    async tryLogin() {
        try {
            let user: ADHOCCAST.Dts.IUser = {
                id: null,
                // sid: '123456',
                // room: {
                //     id: 'promethean_123456'
                // }

            }
            let result = await this.connnection.retryLogin(user, null, null, 5 * 1000); 
        } catch(e) {
            return await this.tryLogin()
        }            
    }
    onAfterRoot = (cmd: ADHOCCAST.Cmds.Common.ICommand): any => {
        switch(cmd.data.cmdId) {
            case ADHOCCAST.Cmds.ECommandId.network_connect:
                this.main.onConnect(this)
                break;
            case ADHOCCAST.Cmds.ECommandId.adhoc_login:
                this.main.onLogin(this);
                break;
            case ADHOCCAST.Cmds.ECommandId.adhoc_logout:                
                break;
            case ADHOCCAST.Cmds.ECommandId.network_disconnect:
                this.main.onDisconnect(this)
                break;
        }   
    }
    getUser() {
        let user = this.connnection.rooms.getLoginRoom().me().item
        ADHOCCAST.Services.Cmds.UserGet.get(this.connnection.instanceId, user)
        .then((data: ADHOCCAST.Dts.ICommandData<any>) => { 
            this.main.onGetUserSuccess(this)
        })
        .catch(e => {
            this.main.onGetUserFailed(this)

        })       
    }
}