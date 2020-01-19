global.IsNode = true;
import * as Modules from './modules/index'
import * as Services from './services/index'
import { IProject } from './project';

let server: Modules.IServer;
let project: IProject = {
    Services: Services
}
if (Modules.Config.getInstance<Modules.Config>().autoUpdateConfig) {
    Modules.Config.update()
    .then(() => {
        new Modules.Server(project)
    })
    .catch(err => {
        new Modules.Server(project)
    })
} else {
    new Modules.Server(project)
}
