import React = require('react');
import List from 'antd/lib/list'
import Card from 'antd/lib/card'
import './index.css'

import { ADHOCCAST } from '../../../../libex/'


export interface ICompVideoState {

}
export interface ICompVideoProp {
    streams?: ADHOCCAST.Modules.Webrtc.Streams;
}


export class CompVideo extends React.Component<ICompVideoProp, ICompVideoState> {
    render() {    
        let videos = [];
        let recvs = this.props.streams.recvs;
        recvs.keys().forEach(key => {
            let stream = recvs.get(key);
            videos.push(
                <div key={stream.id}>
                    <video
                        className='comps-layout-sider-video-item-container'
                        autoPlay
                        playsInline
                        src = {URL.createObjectURL(stream)}
                    />
                </div>
            )
        })
        let user = this.props.streams.peer.user;
        return (
            <List.Item>
                <Card title={user.item.id + ',' + user.item.room.id}>
                    {videos}                
                </Card>

            </List.Item>
        )
    }
}
