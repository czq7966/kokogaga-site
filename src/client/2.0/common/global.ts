import { IMain } from "../index";
import { ADHOCCAST } from "../libex";

export class Global {
    static main: IMain
    static getConfig(): Promise<any> {
        let conn = Global.main.loginComp.conn;
        let promise = ADHOCCAST.Services.Cmds.AdminConfigGet.get(conn.instanceId);
       
        promise
        .then((data) => {
            console.log('admin-config-get success', data)
        })
        .catch(err => {
            console.error('admin-config-get', err)
        })        

        return promise;
    }
    static updateConfig(url: string): Promise<any> {
        let conn = Global.main.loginComp.conn;
        let promise = ADHOCCAST.Services.Cmds.AdminConfigUpdate.update(conn.instanceId, url )
        promise
        .then((data) => {
            console.log('admin-config-update success', data)
        })
        .catch(err => {
            console.error('admin-config-update', err)
        })            
        return promise;
    }
    static getNamespacesStatus(names: Array<string>): Promise<any>  {
        let conn = Global.main.loginComp.conn;
        let promise = ADHOCCAST.Services.Cmds.AdminNamespaceStatus.get(conn.instanceId, names)
        promise
        .then((data) => {
            console.log('admin-namespace-status success', data)
        })
        .catch(err => {
            console.error('admin-namespace-status', err)
        })     
        return promise;     
    }

    static closeNamespaces(names: Array<string>): Promise<any>  {
        let conn = Global.main.loginComp.conn;
        let promise = ADHOCCAST.Services.Cmds.AdminNamespaceClose.close(conn.instanceId, names)
        promise
        .then((data) => {
            console.log('admin-namespace-close success', data)
        })
        .catch(err => {
            console.error('admin-namespace-close', err)
        })     
        return promise;     
    }    
    static ResetNamespaces(names: Array<string>): Promise<any>  {
        let conn = Global.main.loginComp.conn;
        let promise = ADHOCCAST.Services.Cmds.AdminNamespaceReset.reset(conn.instanceId, names)
        promise
        .then((data) => {
            console.log('admin-namespace-reset success', data)
        })
        .catch(err => {
            console.error('admin-namespace-reset', err)
        })     
        return promise;     
    }    
    static OpenNamespaces(names: Array<string>): Promise<any>  {
        let conn = Global.main.loginComp.conn;
        let promise = ADHOCCAST.Services.Cmds.AdminNamespaceOpen.open(conn.instanceId, names)
        promise
        .then((data) => {
            console.log('admin-namespace-open success', data)
        })
        .catch(err => {
            console.error('admin-namespace-open error', err)
        })     
        return promise;     
    }      
    static GetNamespaceUsers(namespace: string, from: number, to: number): Promise<any>  {
        let conn = Global.main.loginComp.conn;
        let promise = ADHOCCAST.Services.Cmds.AdminUsersGet.get(conn.instanceId, namespace, from, to)
        promise
        .then((data) => {
            console.log('admin-users-get success', data)
        })
        .catch(err => {
            console.error('admin-users-get error', err)
        })     
        return promise;     
    }   
}