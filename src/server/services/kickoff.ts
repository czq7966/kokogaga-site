import * as Dts from '../cmds/dts';
import * as Cmds from '../cmds/index'
import * as Modules from '../modules'
import * as Helper from '../helper'
import { ServiceRoom } from './room';
import { ServiceUser } from './user';
import { ServiceUsers } from './users';

var Tag = 'ServiceKickoff'
export class ServiceKickoff extends Cmds.Common.Base {
    static onDispatched = {
        async req(cmd: Cmds.CommandKickoffReq, sckUser: Modules.SocketUser) {
            let data = cmd.data;            
            await ServiceKickoff.onReq(sckUser, data)
        }
    }
    static async onReq(sckUser: Modules.SocketUser, reqData: Dts.ICommandData<Dts.ICommandReqDataProps>) {
        await this.kickoff(sckUser, reqData.props.user);
    } 
    static async kickoff(sckUser: Modules.ISocketUser, user: Dts.IUser): Promise<any> {
        if (user && sckUser.connected()) {
            let sckUsers = sckUser.users;
            let sckLoginUser = await ServiceUsers.getSocketUser(sckUsers, user);
            if (sckLoginUser) {
                if (sckLoginUser.socket.id != sckUser.socket.id) {
                    await ServiceUser.logout(sckLoginUser as Modules.ISocketUser, null, true, true);
                }
            }
            else {
                let nspUser = await sckUsers.getDataNamespace().getUser(user);
                if (nspUser && nspUser.serverId && nspUser.serverId != sckUsers.snsp.server.getId()) {
                    let cmd: Dts.ICommandData<Dts.ICommandReqDataProps> = {
                        props: {
                            user: nspUser
                        },
                        cmdId: Dts.ECommandId.adhoc_kickoff,
                        to: {type: 'server', id: nspUser.serverId},
                        respTimeout: 5 * 1000
                    }
                    try {
                        await sckUser.sendCommandForResp(cmd);
                    } catch (error) {
                        
                    }
                   
                    // await this.waitUserNotExist(sckUser, user);
                }
            }
        }      
    }
    static async waitUserNotExist(sckUser: Modules.ISocketUser,user: Dts.IUser, timeout?: number, maxCount?: number): Promise<boolean> {
        timeout = timeout || 500;
        maxCount = maxCount || 10;
        let _checkNotExist = (): Promise<boolean> => {
            return new Promise(async (resolve, reject) => {
                if (sckUser.notDestroyed) {
                    maxCount = maxCount -1;
                    let sckUsers = sckUser.users;
                    let nspUser = await sckUsers.getDataNamespace().getUser(user);
                    if (nspUser) {
                        if (maxCount != 0 ) {
                            setTimeout(async () => {
                                let exist = await _checkNotExist();
                                resolve(exist)
                            }, timeout); 
                        } else {
                            resolve(true)
                        }
                    } else {
                        resolve(false)
                    }
                } else {
                    resolve()
                }
            })           
        }  
        return _checkNotExist();
    }
    static async onDeliverCommand_kickoff(sckUsers: Modules.ISocketUsers, user: Dts.IUser): Promise<any> {
        if (user) {
            let sckLoginUser = await ServiceUsers.getSocketUser(sckUsers, user);
            if (sckLoginUser) {
                await ServiceUser.logout(sckLoginUser as Modules.ISocketUser, null, true, true);
            }
        }
    }

}