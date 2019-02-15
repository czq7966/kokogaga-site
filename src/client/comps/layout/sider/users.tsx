import React = require('react');
import Popover from 'antd/lib/popover'
import Button from 'antd/lib/button'
import Badge from 'antd/lib/badge'
import 'antd/lib/popover/style/index.css'
import 'antd/lib/button/style/index.css'
import 'antd/lib/badge/style/index.css'

import { ADHOCCAST } from '../../../libex'
import { CompRoom } from './room/room';


export interface IUsersState {

}
export interface IUsersProp {
    conn: ADHOCCAST.Connection
    onShowUserStreams?: (user: ADHOCCAST.Modules.IUser ) => void
}


export class Users extends React.Component<IUsersProp, IUsersState> {
    render() {     
        let room = this.props.conn.rooms.getLoginRoom();
        let content = (
            <CompRoom room={room} onShowUserStreams={this.props.onShowUserStreams} />
        )        
        return (
            <div>
                <Popover placement="left" trigger="click" title="Users" content={content}>
                    <Badge count={room ? room.users.count() : 0} offset={[0, "50%"] } >
                        <Button>Users</Button>
                    </Badge>                      
                </Popover>
            </div>
        )
    }
}
