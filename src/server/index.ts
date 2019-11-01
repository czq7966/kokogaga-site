global.IsNode = true;
import * as Modules from './modules/index'

if (Modules.Config.getInstance<Modules.Config>().autoUpdateConfig) {
    Modules.Config.update()
    .then(() => {
        new Modules.Server()
    })
    .catch(err => {
        new Modules.Server()
    })
} else {
    new Modules.Server()
}
