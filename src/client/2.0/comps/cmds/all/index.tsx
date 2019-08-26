import React = require("react");
import Tabs from 'antd/lib/tabs';
import 'antd/lib/tabs/style/index.css'
import * as Config from '../config'
import * as Namespace from "../namespace";
import * as Users from '../users'

export interface IAllState {

}
export interface IAllProp {

}

export class All extends React.Component<IAllProp, IAllState> {
    render() {     
        return (
            <div>
                <Tabs defaultActiveKey="Config-Get" >
                    <Tabs.TabPane tab="Config-Get" key="Config-Get">
                        <Config.Get></Config.Get>
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Config-Update" key="Config-Update">
                        <Config.Update></Config.Update>
                    </Tabs.TabPane>                    
                    <Tabs.TabPane tab="Namespace-Status" key="Namespace-Status">
                        <Namespace.Status></Namespace.Status>
                    </Tabs.TabPane>  
                    <Tabs.TabPane tab="Namespace-Reset" key="Namespace-Reset">
                        <Namespace.Reset></Namespace.Reset>
                    </Tabs.TabPane>                        
                    <Tabs.TabPane tab="Namespace-Close" key="Namespace-Close">
                        <Namespace.Close></Namespace.Close>
                    </Tabs.TabPane>  
                    <Tabs.TabPane tab="Namespace-Open" key="Namespace-Open">
                        <Namespace.Open></Namespace.Open>
                    </Tabs.TabPane>     
                    <Tabs.TabPane tab="Users-Get" key="Users-Get">
                        <Users.Get></Users.Get>
                    </Tabs.TabPane>                                                                                
                </Tabs>
            </div>
            
        )

    }

}