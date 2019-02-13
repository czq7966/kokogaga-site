import React = require('react');
import List from 'antd/lib/list'
import './index.css'

import { ADHOCCAST } from '../../../../libex/'
import { CompUser } from './user';

export interface ICompRoomState {

}
export interface ICompRoomProp {
    room?: ADHOCCAST.Modules.IRoom
}


export class CompRoom extends React.Component<ICompRoomProp, ICompRoomState> {
    render() {     
        let users =[];
        let room = this.props.room;
        if (room) {
            // for (let index = 0; index < 10; index++) {
                room.users.keys().forEach(key => {
                    users.push(room.users.get(key).item)
                })                    
            // }
            
        }

        return (
                <div className="comps-layout-sider-room-list-container">
                    <List 
                        dataSource={users}
                        renderItem = {item => (
                                <CompUser user={item} />
                            )
                        }
                    />
                </div>                
        )
    }
}
