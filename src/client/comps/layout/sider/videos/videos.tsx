import React = require('react');
import List from 'antd/lib/list'
import './index.css'

import { ADHOCCAST } from '../../../../libex/'
import { CompVideo } from './video';


export interface ICompVideosState {

}
export interface ICompVideosProp {
    conn?: ADHOCCAST.Connection
    onSelectVideo?: (streams: ADHOCCAST.Modules.Webrtc.IStreams, stream: MediaStream ) => void
}


export class CompVideos extends React.Component<ICompVideosProp, ICompVideosState> {
    render() {     
        let streams =[];
        let rooms = this.props.conn.rooms;
        rooms.items.keys().forEach(key => {
            let room = rooms.items.get(key);
            room.users.keys().forEach(uKey => {
                let user = room.users.get(uKey)
                if (user.peer.streams.recvs.count() > 0) {
                    streams.push(user.peer.streams)
                }
            })
        })

        return (
                <div className="comps-layout-sider-video-list-container">
                    <List 
                        grid={{column: 1}}
                        dataSource={streams}
                        renderItem = {item => (
                                <CompVideo streams={item}  onSelectVideo={this.props.onSelectVideo}  />
                            )
                        }
                    />
                </div>                
        )
    }
}
