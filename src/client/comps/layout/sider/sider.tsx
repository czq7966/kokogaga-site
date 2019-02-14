import React = require('react');
import { Users } from './users';
import { Videos } from './videos';
import { ADHOCCAST } from '../../../libex'

export interface ICompSiderState {

}
export interface ICompSiderProp {
    conn: ADHOCCAST.Connection
    onSelectVideo?: (streams: ADHOCCAST.Modules.Webrtc.IStreams, stream: MediaStream ) => void
}


export class CompSider extends React.Component<ICompSiderProp, ICompSiderState> {
    render() {     
        return (
            <div>
                <Users conn={this.props.conn}></Users>
                <Videos conn={this.props.conn} onSelectVideo={this.props.onSelectVideo}  ></Videos>
            </div>
        )
    }
}
