import React = require('react');
import './index.css'

import Affix from 'antd/lib/affix'
import Button from 'antd/lib/button'

import { ADHOCCAST } from '../../../libex/'



export interface ICompContentState {

}
export interface ICompContentProp {
    user: ADHOCCAST.Modules.IUser;
}


export class CompContent extends React.Component<ICompContentProp, ICompContentState> {
    render() {    
        let videos = [];
        let user = this.props.user;
        let streams = user && user.peer && user.peer.streams;
        if (streams && streams.recvs) {
            let recvs = streams.recvs;
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
        return (
            <div>
                {videos}                  
            </div>          
        )
    }
}
