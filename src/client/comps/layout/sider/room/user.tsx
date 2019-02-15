import React = require('react');
import List from 'antd/lib/list'
import 'antd/lib/list/style/index.css'

import { ADHOCCAST } from '../../../../libex'

export interface ICompUserState {

}
export interface ICompUserProp {
    user: ADHOCCAST.Modules.IUser
    onShowUserStreams?: (user: ADHOCCAST.Modules.IUser ) => void
}


export class CompUser extends React.Component<ICompUserProp, ICompUserState> {
    render() {     
        let actions=[];
        let user = this.props.user;
        let sending = user.states.isset(ADHOCCAST.Cmds.EUserState.stream_room_sending)
        sending && actions.push(
            <a href='#' onClick={this.joinAndShow} >show</a>
        )
        return (
            <List.Item actions={actions}>
                <List.Item.Meta
                    title={this.props.user.item.sid}                    
                />
            </List.Item>
        )
    }
    joinAndShow = () => {
        let user = this.props.user;
        let room = ADHOCCAST.Services.Modules.User.getStreamRoom(user);
        let me: ADHOCCAST.Modules.IUser;
        room && (me = room.me());
        if (me && me.peer.streams.recvs.count() > 0) {
            this.props.onShowUserStreams && this.props.onShowUserStreams(me)
        } else {
            let toUser = {
                id: user.item.id,
                room: {
                    id: ADHOCCAST.Services.Cmds.User.getStreamRoomId(user.item)
                }                        
            }            
            ADHOCCAST.Services.Cmds.StreamRoomJoin.joinAndHelloAndReady(user.instanceId, toUser)
            .then(data => {
                room = ADHOCCAST.Services.Modules.User.getStreamRoom(user);
                me = room.me();
                this.props.onShowUserStreams && this.props.onShowUserStreams(me)
            })
        }        
    }
}
