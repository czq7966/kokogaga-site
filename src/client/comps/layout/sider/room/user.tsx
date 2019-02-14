import React = require('react');
import List from 'antd/lib/list'
import 'antd/lib/list/style/index.css'

import { ADHOCCAST } from '../../../../libex'

export interface ICompUserState {

}
export interface ICompUserProp {
    user: ADHOCCAST.Cmds.IUser
}


export class CompUser extends React.Component<ICompUserProp, ICompUserState> {
    render() {     
        return (
            <List.Item actions={[<a>edit</a>]}>
                <List.Item.Meta
                    title={this.props.user.sid}
                />
            </List.Item>
        )
    }
}
