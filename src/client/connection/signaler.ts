import { Client } from './client'; 

export interface ISignalerMessage {
    type: ESignalerMessageType
    data?: any
}

export enum ESignalerMessageType {
    offer = 'message-offer',
    answer = 'message-answer',
    candidate = 'message-candidate',
    icecomplete = 'message-icecomplete',
    hello = 'message-hello',
    ready = 'message-ready'
}

export class Signaler extends Client {

};