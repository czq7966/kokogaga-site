import { ADHOCCAST } from './libex'
import { Receiver } from './receiver';
import { Turner } from './turner';

export class Main  {
    receiver: Receiver;
    turner: Turner;
    constructor() {
        this.receiver = new Receiver(this);
        this.turner = new Turner(this);

        this.initEvents();
        this.turner.login()
        .then(v => {
            this.receiver.login();
        })

    }
    destroy() {
        this.unInitEvents();
        this.receiver.destroy();
        this.turner.destroy();

        delete this.receiver;
        delete this.turner;    
    }   


    initEvents() {

    }
    unInitEvents() {

    } 

}




