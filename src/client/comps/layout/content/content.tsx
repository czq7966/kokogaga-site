import React = require('react');
import './index.css'

import Affix from 'antd/lib/affix'
import Button from 'antd/lib/button'

import { ADHOCCAST } from '../../../libex/'



export interface ICompContentState {

}
export interface ICompContentProp {
    streams?: ADHOCCAST.Modules.Webrtc.IStreams;
    stream?: MediaStream
}


export class CompContent extends React.Component<ICompContentProp, ICompContentState> {
    render() {    
        let videos = [];
        if (this.props.streams && this.props.streams.recvs) {
            let recvs = this.props.streams.recvs;
            recvs.keys().forEach(key => {
                let stream = recvs.get(key);
                videos.push(
                    <div key={stream.id}>
                        <video
                            className='comps-layout-content-video-container'
                            autoPlay
                            playsInline
                            src = {URL.createObjectURL(stream)}
                        />
                    </div>
                )
            })
        }
        // style={{ position: 'absolute', top: 10, left: 100}}
        return (
            <div>
                {videos}                  


    
            </div>          
        )
    }
}
