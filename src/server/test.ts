// import { Connection } from "../client/connection/connection";
// import { IUserQuery } from "./user";



// export class Test {
//     conn1: Connection;
//     conn2: Connection;
//     constructor() {
//         this.conn1 = new Connection('http://localhost:3000');
//         this.conn2 = new Connection('http://localhost:3000');
//         this.test()
//     }


//     test() {
//         try {
//             let query: IUserQuery = {
//                 roomid: '123'
//             }
//             this.conn1.openRoom(query).then(() => {
//                 this.conn2.joinRoom(query);
//             })
                
//         } catch (error) {
//             console.error(error)
            
//         }
//         // this.conn1.connect().then(() => {
//         //     this.conn1.openRoom({roomid: '123'}).then(() => {
//         //         this.io2.joinRoom({roomid: '1231'}).then(() => {
//         //             this.conn1.leaveRoom({roomid: '123'})
//         //         })
//         //     })
//         // })

//         // this.io2.connect();

//         // this.io1.openRoom({roomid: '123'});

//         // this.io2.joinRoom({roomid: '123'})
        
//         // // this.io1.emit(ECustomEvents.closeRoom, {roomid: '001' }, function() {
//         // //     console.log('Client', ECustomEvents.closeRoom, arguments)
//         // // })
        
//         // this.io2.leaveRoom({roomid: '123'})

//     }
// }

var client = require('socket.io-client');
console.log(client)