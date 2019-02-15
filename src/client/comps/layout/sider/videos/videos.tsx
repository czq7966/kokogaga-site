import React = require('react');
import List from 'antd/lib/list'
import './index.css'

import { ADHOCCAST } from '../../../../libex/'
import { CompVideo } from './video';


export interface ICompVideosState {

}
export interface ICompVideosProp {
    conn?: ADHOCCAST.Connection
    onShowUserStreams?: (user: ADHOCCAST.Modules.IUser ) => void
}


export class CompVideos extends React.Component<ICompVideosProp, ICompVideosState> {
    render() {     
        let streams = ADHOCCAST.Services.Modules.Rooms.getRecvStreams(this.props.conn.rooms)
        
        return (
            <div className="comps-layout-sider-video-list-container">
                <List 
                    grid={{column: 1}}
                    dataSource={streams}
                    renderItem = {item => (
                            <CompVideo streams={item}  onShowUserStreams={this.props.onShowUserStreams}  />
                        )
                    }
                />
            </div>                
        )
    }
}
