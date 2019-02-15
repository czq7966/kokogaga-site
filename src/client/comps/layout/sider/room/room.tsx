import React = require('react');
import List from 'antd/lib/list'
import './index.css'

import { ADHOCCAST } from '../../../../libex/'
import { CompUser } from './user';

export interface ICompRoomState {
    count: number
}
export interface ICompRoomProp {
    room?: ADHOCCAST.Modules.IRoom
    onShowUserStreams?: (user: ADHOCCAST.Modules.IUser ) => void
}


export class CompRoom extends React.Component<ICompRoomProp, ICompRoomState> {
    users: Array<ADHOCCAST.Modules.IUser>;
    constructor(props) {
        super(props);
        this.users = []
        this.state = {
            count: 0
        }
    }
    componentDidMount() {
        this.setState({


        })

    }
    render() {     
        this.users = [];
        let room = this.props.room;
        if (room) {
            // for (let index = 0; index < 10; index++) {
                room.users.keys().forEach(key => {
                    this.users.push(room.users.get(key))
                })                    
            // }
            
        }
        this.state = {
            count: this.users.length
        }

        return (
                <div className="comps-layout-sider-room-list-container">
                    <List 
                        dataSource={this.users}
                        renderItem = {item => (
                                <CompUser user={item} onShowUserStreams={this.props.onShowUserStreams} />
                            )
                        }
                    />
                </div>                
        )
    }
}
