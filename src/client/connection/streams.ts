import { Base } from "./base";
import { ERTCPeerEvents } from "./peer";

export class Streams extends Base {
    owner: any;
    sendStreams: {[id: string]: MediaStream};
    recvStreams: {[id: string]: MediaStream};
    constructor(owner: any) {
        super();
        this.owner = owner;
        this.sendStreams = {};
        this.recvStreams = {};        
    }
    destroy() {
        Object.keys(this.sendStreams).forEach(id => {delete this.sendStreams[id]});
        Object.keys(this.recvStreams).forEach(id => {delete this.recvStreams[id]});        
        super.destroy();
    }
    //Send Stream
    addSendStream(stream: MediaStream) {        
        if (stream && !this.getSendStream(stream.id)) {
            let id = stream.id;
            let onInactive = (ev) => {
                stream.removeEventListener('inactive', onInactive);
                if (this.notDestroyed) {
                    this.onSendStreamInactive(stream);
                    this.removeSendStream(id)
                }                 
            }
            stream.addEventListener('inactive', onInactive);            
            this.sendStreams[id] = stream;            
        }
    }
    removeSendStream(id: string) {
        delete this.sendStreams[id];
    }    
    getSendStream(id: string): MediaStream {
        return this.sendStreams[id];
    }
    getSendStreams(): Array<MediaStream> {
        let result = [];
        Object.keys(this.sendStreams).forEach(id => {
            result.push(this.sendStreams[id])
        })
        return result;
    }
    onSendStreamInactive(stream: MediaStream) {
        this.eventEmitter.emit(ERTCPeerEvents.onsendstreaminactive, stream, this)
    }

    stopSendStreams(): Promise<any> {
        let promises = [];
        Object.keys(this.sendStreams).forEach(id => {
            promises.push(this.stopSendStream(id));
        });
        if (promises.length > 0) {
            return Promise.all(promises);
        } else {
            return Promise.resolve();
        }        
    }
    stopSendStream(id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let stream = this.getSendStream(id);
            if (stream) {
                let onInactive = () => {
                    stream.removeEventListener('inactive', onInactive);
                    resolve();
                }             
                stream.addEventListener('inactive', onInactive);                
                stream.getTracks().forEach(track => {
                    track.stop();
                })
            } else {
                resolve();
            }       
        })
    }
    // Recv Stream
    addRecvStream(stream: MediaStream) {        
        if (stream && !this.getRecvStream(stream.id)) {
            let id = stream.id;
            let onInactive = (ev) => {
                stream.removeEventListener('inactive', onInactive);
                if (this.notDestroyed) {
                    this.onRecvStreamInactive(stream);
                    this.removeRecvStream(id)
                }                 
            }
            stream.addEventListener('inactive', onInactive);            
            this.recvStreams[id] = stream;   
            this.eventEmitter.emit(ERTCPeerEvents.onrecvstream, stream);
        }
    }
    removeRecvStream(id: string) {
        delete this.recvStreams[id];
    }    
    getRecvStream(id: string): MediaStream {
        return this.recvStreams[id];
    }
    getRecvStreams(): Array<MediaStream> {
        let result = [];
        Object.keys(this.recvStreams).forEach(id => {
            result.push(this.recvStreams[id])
        })
        return result;
    }    
    onRecvStreamInactive(stream: MediaStream) {
        this.eventEmitter.emit(ERTCPeerEvents.onrecvstreaminactive, stream, this)
    }

    stopRecvStreams(): Promise<any> {
        let promises = [];
        Object.keys(this.sendStreams).forEach(id => {
            promises.push(this.stopRecvStream(id));
        });
        if (promises.length > 0) {
            return Promise.all(promises);
        } else {
            return Promise.resolve();
        }        
    }
    stopRecvStream(id: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let stream = this.getRecvStream(id);
            if (stream) {
                let onInactive = () => {
                    stream.removeEventListener('inactive', onInactive);
                    resolve();
                }             
                stream.addEventListener('inactive', onInactive);                
                stream.getTracks().forEach(track => {
                    track.stop();
                })
            } else {
                resolve();
            }       
        })
    }    
}