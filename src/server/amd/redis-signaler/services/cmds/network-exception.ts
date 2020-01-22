import { IRedisSignaler } from "../../modules/redis-signaler";
import { ADHOCCAST } from '../../libex'

export class NetworkException {
    static async req(signaler: IRedisSignaler) {
        let cmd : ADHOCCAST.Dts.ICommandData<any> = {
            cmdId: ADHOCCAST.Dts.ECommandId.network_exception,
            props: {},            
            from:{
                type: 'server',
                id: ''
            }
        }
        signaler.server.snsps.keys().forEach(key => {
            let snsp = signaler.server.snsps.get(key);
            snsp.nsp.emit(ADHOCCAST.Dts.CommandID, cmd);
        })
    }

}