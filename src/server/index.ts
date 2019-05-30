global.IsNode = true;
import * as Modules from './modules/index'

Modules.Config.update()
.then(() => {
    new Modules.Server()
})
.catch(err => {
    new Modules.Server()
})
