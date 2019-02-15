import React = require('react');
import Draggable from 'react-draggable'
import Affix from 'antd/lib/affix';

import { Videos } from './videos';
import { Users } from './users';
import { ADHOCCAST } from '../../../libex'




export interface ICompAffixState {

}
export interface ICompAffixProp {
    conn: ADHOCCAST.Connection
    onShowUserStreams?: (user: ADHOCCAST.Modules.IUser ) => void
}


export class CompAffix extends React.Component<ICompAffixProp, ICompAffixState> {
    render() {  
        return (
            <div style={{ position: 'absolute', top: '50%', right: '1%'}}>
                <Draggable >
                    <Affix >
                        <Videos conn={this.props.conn} onShowUserStreams={this.props.onShowUserStreams}  ></Videos>
                        <Users  conn={this.props.conn} onShowUserStreams={this.props.onShowUserStreams} ></Users>
                    </Affix>                            
                </Draggable>                        
            </div> 
        )   

    }
}

  