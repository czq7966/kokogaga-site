import * as Dts from './dts'
import * as Modules_Namespace from '../../modules/namespace'
import { ADHOCCAST } from './libex'
import { IServer } from '../../modules/server';
import { ISocketUser } from '../../modules/user';


export interface ISignalClientBase extends Modules_Namespace.ISocketNamespace {
    isReady(): boolean
    sendCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>, forResp?: boolean): Promise<any>
    sendCommandForResp(data: ADHOCCAST.Cmds.Common.ICommandData<any>): Promise<any>
    deliverCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>, dataExtra: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>, forResp?: boolean): Promise<any>
    deliverUserCommand(sckUser: ISocketUser, cmd: ADHOCCAST.Dts.ICommandData<any>, includeSelf: boolean, forResp?: boolean): Promise<any>
    onDeliverCommand(cmd: ADHOCCAST.Cmds.Common.ICommandData<any>): Promise<any>
}

export class SignalClientBase extends Modules_Namespace.SocketNamespace implements ISignalClientBase {
    async tryLogin() {
        throw false;
    }

    isReady(): boolean {
       return false;
    }
    async sendCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>, forResp?: boolean) {
        throw false      
    }
    async sendCommandForResp(data: ADHOCCAST.Cmds.Common.ICommandData<any>) {
        throw false      
    }

    async deliverCommand(data: ADHOCCAST.Cmds.Common.ICommandData<any>, dataExtra: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>, forResp: boolean) {
        let cmd: ADHOCCAST.Cmds.Common.ICommandData<any> = {
            cmdId: Dts.ECommandId.signal_center_deliver,
            props: data,
            extra: dataExtra,
            onResp: data.onResp,
            onRespTimeout: data.onRespTimeout,
            respTimeout: data.respTimeout,  
            respMsg: data.respMsg,
            respResult: data.respResult,
            sessionId: data.sessionId,
            type: data.type         
        }
        if (forResp)
            return await this.sendCommandForResp(cmd)
        else 
            return await this.sendCommand(cmd);
    }
    async deliverUserCommand(sckUser: ISocketUser, cmd: ADHOCCAST.Dts.ICommandData<any>, includeSelf: boolean, forResp: boolean) {
        let namespace = sckUser.users.snsp.nsp.name;
        namespace = namespace.startsWith('/') ? namespace.substr(1): namespace
        let extra: ADHOCCAST.Dts.ICommandData<Dts.ICommandDeliverDataExtraProps> = {
            props: {
                namespace: namespace,
                includeSelf: includeSelf
            },
            from: {
                type: sckUser.user ? 'user' : 'socket',
                id: sckUser.user ? sckUser.user.id : sckUser.socket.id                    
            },
            to: Object.assign({}, cmd.to)
        }
        return await this.deliverCommand(cmd, extra, forResp);
    }
    async onDeliverCommand(cmd: ADHOCCAST.Cmds.Common.ICommandData<any>) {
    }
}