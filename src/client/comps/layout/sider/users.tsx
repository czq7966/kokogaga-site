import React = require('react');
import Popover from 'antd/lib/popover'
import Button from 'antd/lib/button'
import 'antd/lib/popover/style/index.css'
import 'antd/lib/button/style/index.css'

import { ADHOCCAST } from '../../../libex'
import { CompRoom } from './room/room';


export interface IUsersState {

}
export interface IUsersProp {
    conn: ADHOCCAST.Connection
}


export class Users extends React.Component<IUsersProp, IUsersState> {
    render() {     
        let content = (
            <CompRoom room={this.props.conn.rooms.getLoginRoom()} />
        )        
        return (
            <div>
                <Popover placement="left" trigger="click" title="Users" content={content}>
                    <Button>Users</Button>
                </Popover>
            </div>
        )
    }
}
