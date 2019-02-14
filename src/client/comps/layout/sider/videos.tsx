import React = require('react');
import Popover from 'antd/lib/popover'
import Button from 'antd/lib/button'
import 'antd/lib/popover/style/index.css'
import 'antd/lib/button/style/index.css'

import { ADHOCCAST } from '../../../libex'
import { CompVideos } from './videos/videos';

export interface IVideosState {

}
export interface IVideosProp {
    conn: ADHOCCAST.Connection
    onSelectVideo?: (streams: ADHOCCAST.Modules.Webrtc.IStreams, stream: MediaStream ) => void
}

export class Videos extends React.Component<IVideosProp, IVideosState> {
    render() {   
        let content = (
            <CompVideos conn={this.props.conn}  onSelectVideo={this.props.onSelectVideo}  />
        )          
        
        return (
            <div>
                <Popover  placement="left" trigger="click" title="Videos" content={content}>
                    <Button>Videos</Button>
                </Popover>
            </div>
        )
    }
}
