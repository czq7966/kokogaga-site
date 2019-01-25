import * as Dts from '../dts';
import * as Common from '../common/index'
import * as Modules from '../../modules'

// Req
export class CommandLoginReq extends Common.Command<
            Dts.ICommandData<Dts.ICommandLoginReqDataProps>, 
            Common.ICommandConstructorParams<Dts.ICommandLoginReqDataProps> >  {

    onDispatched(reqCmd: CommandLoginReq, sckUser: Modules.SocketUser) {
        this.onReq(sckUser, reqCmd.data)
    }    

    // logical business
    onReq(sckUser: Modules.SocketUser, reqData: Dts.ICommandData<Dts.ICommandLoginReqDataProps>) {
        if (sckUser.isLogin()) {
            this.doLogin_failed(sckUser, reqData, 'already login!');
        } else {
            this.doLogin(sckUser, reqData);        
        }
    }    

    doLogin(sckUser: Modules.SocketUser, reqData: Dts.ICommandData<Dts.ICommandLoginReqDataProps>) {
        sckUser.login(reqData)
        .then(roomid => {
            this.doLogin_success(sckUser, reqData, roomid)
        })
        .catch(err => {
            this.doLogin_failed(sckUser, reqData, err);
        })
    }

    doLogin_failed(sckUser, reqData: Dts.ICommandData<Dts.ICommandLoginReqDataProps>, msg: string) {
        let props: Dts.ICommandLoginRespDataProps = {
            result: false,
            msg: msg
        }
        let respData = Object.assign({}, reqData) as  Dts.ICommandData<Dts.ICommandLoginRespDataProps>;
        respData.type = Dts.ECommandType.resp;
        respData.to = reqData.from;
        respData.from = {type:'server', id: ''}
        respData.props = props;
        sckUser.sendCommand(respData);        
    }

    doLogin_success(sckUser, reqData: Dts.ICommandData<Dts.ICommandLoginReqDataProps>, roomid: string) {
        //Resp
        let props: Dts.ICommandLoginRespDataProps = {
            result: true,
            user: sckUser.user
        }
        let respData = Object.assign({}, reqData) as Dts.ICommandData<Dts.ICommandLoginRespDataProps>;
        respData.type = Dts.ECommandType.resp;
        respData.to = reqData.from;
        respData.from = {type:'server', id: ''}
        respData.props = props;        
        sckUser.sendCommand(respData);
    
        //Broadcast  
        // let cmd: Dts.ICommandLoginReqData = {
        //         from : {type:'server', id: ''},
        //         to : {type:'room', id: roomid},
        //         type : Dts.ECommandType.req,
        //         cmdId: reqData.cmdId,
        //         props: {
        //             user: sckUser.user
        //         }
        //     }
        // sckUser.sendCommand(cmd);
    }

}


// Resp

// export class CommandLoginResp extends Common.Command<Dts.ICommandLoginRespData, Common.ICommandConstructorParams<Dts.ICommandLoginRespDataProps>>  {

// }

Common.CommandTypes.RegistCommandType({
    cmdId: Dts.ECommandId.adhoc_login,
    name: '登录',
    ReqClass: CommandLoginReq as any,
    RespClass: null
})

new CommandLoginReq({instanceId: Dts.dispatcherInstanceName});

