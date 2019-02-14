import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import * as Helper from '../helper'
import { ServiceRoom } from './room';
import { ServiceUser } from './user';
import { ServiceUsers } from './users';

var Tag = 'ServiceLogin'
export class ServiceLogin extends Cmds.Common.Base {
    static onDispatched = {
        req(cmd: Cmds.CommandLoginReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;            
            let room: Dts.IRoom = data.props.user.room || {} as any;
            room.id = room.id || Helper.getAdhocRoomId(sckUser.socket)
            data.props.user = data.props.user || sckUser.user;
            data.props.user.room = data.props.user.room || room;
            data.props.user.sid = data.props.user.sid || ServiceUsers.newShortID(sckUser.users);
            ServiceLogin.onReq(sckUser, data)
        }
    }

    // logical business
    static onReq(sckUser: Modules.SocketUser, reqData: Dts.ICommandData<Dts.ICommandLoginReqDataProps>) {
        if (ServiceUser.isLogin(sckUser)) {
            this.doLogin_failed(sckUser, reqData, 'already login!');
        } else {
            this.doLogin(sckUser, reqData);        
        }
    }    


    static doLogin(sckUser: Modules.SocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>) {
        ServiceUser.login(sckUser, data)
        .then(roomid => {
            this.doLogin_success(sckUser, data)
        })
        .catch(err => {
            this.doLogin_failed(sckUser, data, err);
        })
    }



    static doLogin_failed(sckUser: Modules.SocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>, msg: string) {
        let props: Dts.ICommandLoginRespDataProps = {
            result: false,
            msg: msg,
            user: data.props.user
        }
        let resp = Object.assign({}, data) as  Dts.ICommandData<Dts.ICommandLoginRespDataProps>;
        resp.type = Dts.ECommandType.resp;
        resp.to = data.from;
        resp.from = {type:'server', id: ''}
        resp.props = props;
        sckUser.sendCommand(resp);        
    }

    static doLogin_success(sckUser: Modules.SocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>) {
        //Resp
        let props: Dts.ICommandLoginRespDataProps = {
            result: true,
            user: sckUser.user
        }
        let resp = Object.assign({}, data) as Dts.ICommandData<Dts.ICommandLoginRespDataProps>;
        resp.type = Dts.ECommandType.resp;
        resp.to = data.from;
        resp.from = {type:'server', id: ''}
        resp.props = props;        
        sckUser.sendCommand(resp);
    }

}