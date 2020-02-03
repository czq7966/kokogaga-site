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
            let roomChannels = await signaler.eval(script, 1, signaler.getServersChannel());            
            if (roomChannels) {
                console.error('111111111111', roomChannels)
                await NetworkException.reqRoomChannels(signaler, Object.keys(roomChannels))
            }
        }
    }
}