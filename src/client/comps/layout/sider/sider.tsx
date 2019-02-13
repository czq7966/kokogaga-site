import React = require('react');
import { Users } from './users';
import { Videos } from './videos';
import { ADHOCCAST } from '../../../libex'

export interface ICompSiderState {

}
export interface ICompSiderProp {
    conn: ADHOCCAST.Connection
}


export class CompSider extends React.Component<ICompSiderProp, ICompSiderState> {
    render() {     
        return (
            <div>
                <Users conn={this.props.conn}></Users>
                <Videos conn={this.props.conn}></Videos>
            </div>
        )
    }
}
