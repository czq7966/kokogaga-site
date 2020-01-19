import { ISocketUser, ISocketNamespace } from "./modules";
import { IRoom } from "./cmds/dts";

export interface IServices {
    ServiceNamespace: {
        getLocalRoomUsers(namespace: ISocketNamespace, roomid: string, count?: number): Promise<ISocketUser[]>
        getLocalRoomFirstUser(namespace: ISocketNamespace, roomid: string): Promise<ISocketUser>
    }
    ServiceRoom: {
        get(roomid: string, sckUser: ISocketUser): Promise<IRoom>
        close(roomid: string, sckUser: ISocketUser): Promise<any>
    }    

}

export interface IProject {
    Services: IServices
}