import * as Modules from '../../modules'
import { ADHOCCAST } from '../../libex'

export class RedisSignaler {
    static onSendFilterBeforeRoot(signaler: Modules.IRedisSignaler, cmd: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>): any {
        switch(cmd.cmdId) {
            case ADHOCCAST.Dts.ECommandId.adhoc_login:
                this.onSendFilter_adhoc_login(signaler, cmd);
                break;
        }
        
        return ADHOCCAST.Cmds.Common.EEventEmitterEmit2Result.preventRoot;
    }

    static onSendFilter_adhoc_login(signaler: Modules.IRedisSignaler, data: ADHOCCAST.Cmds.Common.ICommandData<ADHOCCAST.Dts.ICommandDataProps>) {
        //Resp
        let props = data.props || {};
        let user = props.user || {} as any;
        user.id = user.id || signaler.conneciton.signaler.id();
        user.sid = user.sid || user.id.substr(0, 6);
        user.room = user.room || {} as any;
        user.room.id = user.room.id || 'room';

        props.user = user;
        let resp = Object.assign({}, data) as ADHOCCAST.Dts.ICommandData<any>;
        resp.type = ADHOCCAST.Dts.ECommandType.resp;
        resp.to = data.from;
        resp.from = {type:'server', id: ''}
        resp.props = props;        
        resp.respResult = true;
        signaler.conneciton.dispatcher.onCommand(resp);
    }
}