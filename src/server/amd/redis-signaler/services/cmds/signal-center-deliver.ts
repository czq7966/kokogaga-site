import * as Dts from '../../dts'
import { IRedisSignaler } from "../../modules/redis-signaler";
import { ADHOCCAST } from '../../libex'

export class SignalCenterDeliver {
    static async onReq(signaler: IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>) {
        let result: boolean = false;
        result == result || await this.on_before_req(signaler, cmd);
        result == result || await this.on_req(signaler,cmd);
        result == result || await this.on_after_req(signaler, cmd);
        return result
    }
    static async on_before_req(signaler: IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>) {
        return true;

    }

    static async on_req(signaler: IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>) {
        return false;

    }
    static async on_after_req(signaler: IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<Dts.ICommandDeliverDataExtraProps>) {
        return false
    }  

}