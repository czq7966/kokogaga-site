import React = require('react');
import  Layout from 'antd/lib/layout';
import 'antd/lib/layout/style/index.css'

import { CompSider } from './sider/sider'

const { Sider, Content} = Layout;

import { ADHOCCAST } from '../../libex'


export interface ICompLayoutState {

}
export interface ICompLayoutProp {
    conn: ADHOCCAST.Connection
}


export class CompLayout extends React.Component<ICompLayoutProp, ICompLayoutState> {
    render() {     
        return (
            <Layout style={{minHeight:'100vh'}}>
                <Layout>
                    <Content >
                    </Content>
                </Layout>
                <Sider width={100}>
                    <CompSider conn={this.props.conn}></CompSider>
                </Sider>
            </Layout>

        )
    }
}
