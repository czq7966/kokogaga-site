import React = require('react');
import  Layout from 'antd/lib/layout';
import 'antd/lib/layout/style/index.css'

import { CompSider } from './sider/sider'

import Draggable from 'react-draggable'

const { Sider, Content} = Layout;

import { ADHOCCAST } from '../../libex'
import { CompContent } from './content/content';
import Affix from 'antd/lib/affix';
import { Videos } from './sider/videos';
import { Users } from './sider/users';


export interface ICompLayoutState {
    streams?: ADHOCCAST.Modules.Webrtc.IStreams
    stream?: MediaStream
}
export interface ICompLayoutProp {
    conn: ADHOCCAST.Connection
}


export class CompLayout extends React.Component<ICompLayoutProp, ICompLayoutState> {
    drag: boolean

    constructor(props){
        super(props)
        this.state = {}
    }
    render() {     
        return (
            <Layout style={{minHeight:'100vh'}}>
                <Layout>
                    <Content >                        
                        <CompContent streams={this.state.streams} stream={this.state.stream} />
                        <Affix className='comps-layout-content-menu-container' style={{ position: 'absolute', top: '50%', right: '0.001%'}}>
                            <Videos conn={this.props.conn} onSelectVideo={this.onSelectVideo}  ></Videos>
                        </Affix>
                        <div style={{ position: 'absolute', top: '50%', right: '0.001%'}}>
                        {/* <Draggable onDrag={() => { this.drag = true }} onStop={()=>{this.drag = false}} >
                            <button onClick={() => { this.drag ? this.drag = false : console.log('aaaaaaaaaaaaaaa')}} >aaaaaaaaaaaaaaaaaaaa</button>
                        </Draggable> */}
                        <Draggable onDrag={() => { console.log('drag') }} onStop={() => console.log('stop')} >
                            {/* <button onClick={() => { console.log('click') }} >aaaaaaaaaaaaaaaaaaaa</button> */}
                            <Affix className='comps-layout-content-menu-container' style={{ position: 'absolute', top: '50%', right: '0.001%'}}>
                                <Videos conn={this.props.conn} onSelectVideo={this.onSelectVideo}  ></Videos>
                                <Users  conn={this.props.conn}  ></Users>
                        </Affix>                            
                        </Draggable>                        
                        </div>                        
                    </Content>
                </Layout>
                {/* <Sider width={100}>
                    <CompSider conn={this.props.conn} onSelectVideo={this.onSelectVideo} ></CompSider>
                </Sider> */}
            </Layout>
        )
    }

    onSelectVideo = (streams: ADHOCCAST.Modules.Webrtc.IStreams, stream: MediaStream ) => {
        this.setState({
            streams: streams,
            stream: stream
        })
    }
}
