import React = require('react');
import Popover from 'antd/lib/popover'
import Button from 'antd/lib/button'
import Badge from 'antd/lib/badge'
import 'antd/lib/popover/style/index.css'
import 'antd/lib/button/style/index.css'
import 'antd/lib/badge/style/index.css'

import { ADHOCCAST } from '../../../libex'
import { CompVideos } from './videos/videos';


export interface IVideosState {

}
export interface IVideosProp {
    conn: ADHOCCAST.Connection
    onShowUserStreams?: (user: ADHOCCAST.Modules.IUser ) => void
}

export class Videos extends React.Component<IVideosProp, IVideosState> {
    popover: Popover;
    compVideos: CompVideos;
    constructor(props) {
        super(props)
        this.state={
            trigger: 'click',
            showContent: false
        }
    }
    render() {   
        let streams = ADHOCCAST.Services.Modules.Rooms.getRecvStreams(this.props.conn.rooms)
        let content = (
                <CompVideos ref={ref => this.compVideos = ref} conn={this.props.conn}  onShowUserStreams={this.props.onShowUserStreams}  />
            ) ;

        
        return (
            <div  >
                <Popover placement="left" trigger='click' title="Videos" content={content}>
                    <Badge count= {streams.length}>
                        <Button>Videos</Button>
                    </Badge>                    
                </Popover>
                
            </div>
        )
    }
}
