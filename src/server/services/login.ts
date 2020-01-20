import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import * as Helper from '../helper'
import { ServiceRoom } from './room';
import { ServiceUser } from './user';
import { ServiceUsers } from './users';
import { ServiceKickoff } from './kickoff';

var Tag = 'ServiceLogin'
export class ServiceLogin extends Cmds.Common.Base {
    static onDispatched = {
        async req(cmd: Cmds.CommandLoginReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;            
            let room: Dts.IRoom = data.props.user.room || {} as any;
            room.id = room.id || Helper.getAdhocRoomId(sckUser.socket)
            data.props.user = data.props.user || sckUser.user;
            data.props.user.room = data.props.user.room || room;
            data.props.user.id = data.props.user.id || Cmds.Common.Helper.uuid();
            data.props.user.sid = data.props.user.sid || await ServiceUsers.newShortID(sckUser.users);
            data.props.user.socketId = data.props.user.socketId || sckUser.socket.id;
            data.props.user.serverId = data.props.user.serverId || sckUser.users.snsp.server.getId();
            await ServiceLogin.onReq(sckUser, data)
        }
    }

    // logical business
    static async onReq(sckUser: Modules.SocketUser, reqData: Dts.ICommandData<Dts.ICommandLoginReqDataProps>) {
        let _kickoff = async (user: Dts.IUser): Promise<any> => {
            await ServiceKickoff.kickoff(sckUser, user)
        }

        let _doLogin = async () => {
            // let isLogin: boolean = await ServiceUser.isLogin(sckUser);
            let isLogin: boolean = sckUser.isLogin();
            if (isLogin) {
                let sckLoginUser = await ServiceUsers.getSocketUser(sckUser.users, sckUser.user);
                reqData.extra = sckLoginUser.user;
                await this.doLogin_failed(sckUser, reqData, 'already login!');
            } else 
                await this.doLogin(sckUser, reqData);
        }
        let _checkConnect = async () => {
            if (!sckUser.connected() && sckUser.isLogin() ) {                
                await ServiceUser.logout(sckUser);        
            }
        }

        await _kickoff(reqData.props.user);
        await _kickoff(sckUser.user);
        await _doLogin();
        await _checkConnect();
    }    


    static async doLogin(sckUser: Modules.SocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>) {
        return ServiceUser.login(sckUser, data)
        .then(roomid => {
            this.doLogin_success(sckUser, data)
        })
        .catch(err => {
            this.doLogin_failed(sckUser, data, err);
        })
    }



    static async doLogin_failed(sckUser: Modules.SocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>, msg: string) {
        let props: Dts.ICommandLoginRespDataProps = {
            user: data.props.user
        }
        let resp = Object.assign({}, data) as  Dts.ICommandData<Dts.ICommandLoginRespDataProps>;
        resp.type = Dts.ECommandType.resp;
        resp.to = data.from;
        resp.from = {type:'server', id: ''}
        resp.props = props;
        resp.respResult = false;
        resp.respMsg = msg;
        sckUser.sendCommand(resp);        
    }

    static doLogin_success(sckUser: Modules.SocketUser, data: Dts.ICommandData<Dts.ICommandLoginReqDataProps>) {
        //Resp
        let props: Dts.ICommandLoginRespDataProps = {
            user: sckUser.user
        }
        let resp = Object.assign({}, data) as Dts.ICommandData<Dts.ICommandLoginRespDataProps>;
        resp.type = Dts.ECommandType.resp;
        resp.to = data.from;
        resp.from = {type:'server', id: ''}
        resp.props = props;        
        resp.extra = Modules.Config.getInstance<Modules.Config>().clientConfig;
        resp.respResult = true;
        sckUser.sendCommand(resp);
    }

}