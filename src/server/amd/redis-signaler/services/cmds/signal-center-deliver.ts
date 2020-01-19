import * as Dts from '../../dts'
import { IRedisSignaler } from "../../modules/redis-signaler";
import { ADHOCCAST } from '../../libex'

export class SignalCenterDeliver {
    static async onReq(signaler: IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>) {
        let result: boolean = false;
        if (!result) result = await this.on_before_req(signaler, cmd);
        if (!result) result = await this.on_req(signaler,cmd);
        if (!result) result = await this.on_after_req(signaler, cmd);
        return result
    }
    static async on_before_req(signaler: IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>) {
        if (cmd.from.type == 'server' && cmd.from.id == signaler.server.getId()) {
            return true;
        }        
        return false;
    }

    static async on_req(signaler: IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>) {
        await signaler.server.onDeliverCommand(cmd);
        return false;
    }
    static async on_after_req(signaler: IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>) {
        return false
    }  

}