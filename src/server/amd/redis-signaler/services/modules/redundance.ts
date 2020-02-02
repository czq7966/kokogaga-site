import * as Modules from '../../modules'
import * as Dts from '../../dts'
import * as fs from 'fs'
import * as path from 'path'


export class Redundance {
    static async req(signaler: Modules.IRedisSignaler) {
        let extra = signaler.options.extra as Dts.IOptionsExtra;
        let file = path.resolve(__dirname, extra.redundanceScript);
        let script: string
        console.log('2222222222222', file)
        if (fs.existsSync(file)) {
            script = fs.readFileSync(file, 'utf8');
            let result = await signaler.eval(script, 1, signaler.getServersChannel());
            // let result = await signaler.eval(script, 0);
            console.error('111111111111', result)
        }
    }
}