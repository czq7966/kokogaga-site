import * as Dts from './dts';
import * as Common from './index'
import { SocketUser } from '../user';

// Req
export interface ICommandLoginReqConstructorParams extends Common.IBaseConstructorParams {
    props?: Dts.ICommandLoginReqDataProps;
}

export class CommandLoginReq extends Common.Command  {
    data: Dts.ICommandLoginReqData;

    constructor(params: ICommandLoginReqConstructorParams ) {
        super(params)
    }
    destroy() {
        super.destroy();
    }

    onDispatched(reqCmd: CommandLoginReq, sckUser: SocketUser) {
        this.onReq(sckUser, reqCmd.data)
    }    

    // logical business
    onReq(sckUser: SocketUser, reqData: Dts.ICommandLoginReqData) {
        console.log('onReq')
        if (sckUser.isLogin()) {
            this.doLogin_failed(sckUser, reqData, 'already login!');
        } else {
            let user = Object.assign({}, reqData.props.user) as Dts.IUser;    
            sckUser.user = user;
            this.doLogin(sckUser, reqData);        
        }
    }    

    doLogin(sckUser: SocketUser, reqData: Dts.ICommandLoginReqData) {
        sckUser.users.addSocketUser(sckUser);                       
        sckUser.users.toAdhocRoom(sckUser)
        .then(roomid => {
            this.doLogin_success(sckUser, reqData, roomid)
        })
        .catch(err => {
            this.doLogin_failed(sckUser, reqData, err);
        })
    }

    doLogin_failed(sckUser, reqData: Dts.ICommandLoginReqData, msg: string) {
        let props: Dts.ICommandLoginRespDataProps = {
            result: false,
            msg: msg
        }
        let respData = Object.assign({}, reqData) as  Dts.ICommandLoginRespData;
        respData.type = Dts.ECommandType.resp;
        respData.to = reqData.from;
        respData.from = {type:'server', id: ''}
        respData.props = props;
        sckUser.sendCommand(respData);        
    }

    doLogin_success(sckUser, reqData: Dts.ICommandLoginReqData, roomid: string) {
        //Resp
        let props: Dts.ICommandLoginRespDataProps = {
            result: true,
            user: sckUser.user
        }
        let respData = Object.assign({}, reqData) as  Dts.ICommandLoginRespData;
        respData.type = Dts.ECommandType.resp;
        respData.to = reqData.from;
        respData.from = {type:'server', id: ''}
        respData.props = props;        
        sckUser.sendCommand(respData);
    
        //Broadcast  
        let cmd: Dts.ICommandLoginReqData = {
                from : {type:'server', id: ''},
                to : {type:'room', id: roomid},
                type : Dts.ECommandType.req,
                cmdId: reqData.cmdId,
                props: {
                    user: sckUser.user
                }
            }
        sckUser.sendCommand(cmd);
    }

}


// Resp
export interface ICommandLoginRespConstructorParams extends Common.IBaseConstructorParams {
    props?: Dts.ICommandLoginRespDataProps;
}

export class CommandLoginResp extends Common.Command  {
    data: Dts.ICommandLoginRespData;
    constructor(params: ICommandLoginRespConstructorParams ) {
        super(params)
    }
    destroy() {
        super.destroy();
    }
}

Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.adhoc_login,
    name: '登录',
    ReqClass: CommandLoginReq as any,
    RespClass: CommandLoginResp as any
})

