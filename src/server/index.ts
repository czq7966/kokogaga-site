global.IsNode = true;
import * as Modules from './modules/index'

// Modules.Config.update()
Promise.resolve()
.then(() => {
    new Modules.Server()
})
.catch(err => {
    new Modules.Server()
})
