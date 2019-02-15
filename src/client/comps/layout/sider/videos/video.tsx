import React = require('react');
import List from 'antd/lib/list'
import Card from 'antd/lib/card'
import Icon from 'antd/lib/icon'
import 'antd/lib/card/style/index.css'
import 'antd/lib/icon/style/index.css'
import './index.css'

import { ADHOCCAST } from '../../../../libex/'


export interface ICompVideoState {

}
export interface ICompVideoProp {
    streams?: ADHOCCAST.Modules.Webrtc.Streams;
    onShowUserStreams?: (user: ADHOCCAST.Modules.IUser ) => void
}


export class CompVideo extends React.Component<ICompVideoProp, ICompVideoState> {
    render() {    
        let user = this.props.streams.peer.user;
        let videos = [];
        let recvs = this.props.streams.recvs;
        recvs.keys().forEach(key => {
            let stream = recvs.get(key);
            videos.push(
                <div key={stream.id}>
                    <Card 
                        title={user.room.owner().item.sid} 
                        extra={<Icon type="close" onClick={() => this.close()} />}
                        >
                        <video
                            onClick = {() => { this.props.onShowUserStreams && this.props.onShowUserStreams(user) }}
                            className='comps-layout-sider-video-item-container'
                            autoPlay
                            playsInline
                            src = {URL.createObjectURL(stream)}
                        />           
                    </Card>                

                </div>
            )
        })
        
        return (
            <List.Item>
                {videos}
            </List.Item>
        )
    }
    close() {
        let user = this.props.streams.peer.user;
        ADHOCCAST.Services.Cmds.StreamRoomLeave.leave(user.instanceId, user.room.item )
    }

}
