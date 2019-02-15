import React = require('react');
import  Layout from 'antd/lib/layout';
import 'antd/lib/layout/style/index.css'
const { Content} = Layout;

import { ADHOCCAST } from '../../libex'
import { CompContent } from './content/content';
import { CompAffix } from './sider/affix';

export interface ICompLayoutState {
    user?: ADHOCCAST.Modules.IUser
}
export interface ICompLayoutProp {
    conn: ADHOCCAST.Connection
}


export class CompLayout extends React.Component<ICompLayoutProp, ICompLayoutState> {
    constructor(props){
        super(props)
        this.state = {}
    }
    render() {     
        return (
            <Layout style={{minHeight:'100vh'}}>
                <Content >                        
                    <CompContent user={this.state.user} />
                    <CompAffix conn={this.props.conn} onShowUserStreams={this.onShowUserStreams} />
                </Content>
            </Layout>
        )
    }

    onShowUserStreams = (user: ADHOCCAST.Modules.IUser ) => {
        this.setState({
            user: user
        })
    }
}
