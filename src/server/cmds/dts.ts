export * from "../../../../adhoc-cast-connection/src/main/cmds/common/dts";
export * from "../../../../adhoc-cast-connection/src/main/cmds/dts";


// export enum ECommandType {
//     req = 1, //请求
//     resp = 2  //响应
// }

// export enum ECommandId {
//     none = 'none',
//     command = 'command',
//     adhoc_login = 'adhoc_login',
//     adhoc_hello = 'adhoc_hello',
//     stream_room_open = 'stream_room_open',
//     stream_room_join = 'stream_room_join',
//     stream_room_join_or_open = 'stream_room_join_or_open',
//     stream_webrtc_offer = 'stream_webrtc_offer',
//     stream_webrtc_answer = 'stream_webrtc_answer',
//     stream_webrtc_candidate = 'stream_webrtc_candidate',
//     stream_webrtc_ready = 'stream_webrtc_ready'
// }

// export enum ERoomPrefix {
//     adhoc = 'adhoc',
//     agency = 'agency',
//     stream = 'stream'
// }

// export interface IAddressData {
//     type?: 'socket' | 'user' | 'room' | 'server',
//     id?: string
// }

// export interface ICommandData {
//     //Address
//     from?: IAddressData
//     to?: IAddressData

//     //Content
//     type?: ECommandType
//     cmdId?: ECommandId
//     props?: any
//     sessionId?: string

//     //Events
//     onResp?: Function
//     onTimeout?: Function

//     //extra
//     extra?: any
// }


// export interface ICommandResultData {
//     result: boolean,
//     msg?: any
// }




// export interface IUser {
//     id: string,
//     roomid?: string    
//     nick?: string
//     label?: number //1: Receiver, 2: Sender, 4: Agency    
//     sid?: string
// }

// export interface IRoom {
//     id: string
// }

// export interface ICmd_login_req {
//     user: IUser
// }

// export interface ICmd_login_resp {
//     result: boolean
//     msg?: string
// }

// export interface ICmd_room_open {
//     room: IRoom,
//     user: IUser
// }

// export interface ICmd_room_join extends ICmd_room_open {

// }

// export interface ICmd_room_join_or_open extends ICmd_room_open {
    
// }

// export interface ICmd_webrtc_offer {
//     data: any
// }

// export interface ICmd_webrtc_answer extends ICmd_webrtc_offer {

// }

// export interface ICmd_webrtc_candidate extends ICmd_webrtc_offer {

// }

// export interface ICmd_webrtc_ready extends ICmd_webrtc_offer {

// }

