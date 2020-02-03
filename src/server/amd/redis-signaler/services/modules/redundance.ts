import * as Modules from '../../modules'
import * as Dts from '../../dts'
import * as fs from 'fs'
import * as path from 'path'
import { NetworkException } from '../cmds/network-exception';


export class Redundance {
    static async req(signaler: Modules.IRedisSignaler) {
        let extra = signaler.options.extra as Dts.IOptionsExtra;
        let file = path.resolve(__dirname, extra.redundanceScript);
        let script: string
        if (fs.existsSync(file)) {
            script = fs.readFileSync(file, 'utf8');
            let result = await signaler.eval(script, 1, signaler.getServersChannel());  
            let roomChannels = {}          
            if (result) {
                if (typeof(result) == 'string') {
                    roomChannels = JSON.parse(result);
                }
                await NetworkException.reqRoomChannels(signaler, Object.keys(roomChannels))
            }
        }
    }
}