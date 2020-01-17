import { ADHOCCAST } from '../libex'
import { IDataNamespace, IDataNamespaces } from '../../../modules/database';
import { IDatabaseWrap } from './database-wrap';


export interface IDataNamespacesWrap extends IDataNamespaces {
    databasewrap: IDatabaseWrap;
}
export class DataNamespacesWrap extends ADHOCCAST.Cmds.Common.Helper.KeyValue<IDataNamespace> implements IDataNamespaces {
    databasewrap: IDatabaseWrap;
    constructor(databasewrap: IDatabaseWrap) {
        super();
        this.databasewrap = databasewrap;
    }
    destroy() {
        delete this.databasewrap;
        this.keys().forEach(key => {
            let value = this.del(key);
            value && value.destroy()
        })
        super.destroy();
    }
}