import { Client } from "./client";


export class Test {
    io1: Client;
    io2: Client;
    constructor() {
        this.io1 = new Client('http://localhost:3000');
        this.io2 = new Client('http://localhost:3000');
        this.test()
    }


    test() {
        this.io1.connect().then(() => {
            this.io1.openRoom({roomid: '123'}).then(() => {
                this.io2.joinRoom({roomid: '1231'}).then(() => {
                    this.io1.leaveRoom({roomid: '123'})
                })
            })
        })

        // this.io2.connect();

        // this.io1.openRoom({roomid: '123'});

        // this.io2.joinRoom({roomid: '123'})
        
        // // this.io1.emit(ECustomEvents.closeRoom, {roomid: '001' }, function() {
        // //     console.log('Client', ECustomEvents.closeRoom, arguments)
        // // })
        
        // this.io2.leaveRoom({roomid: '123'})

    }
}