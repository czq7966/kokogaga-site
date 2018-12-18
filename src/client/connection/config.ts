export enum ECodecs {
    default = 'default',
    vp8 = 'vp8',
    vp9 = 'vp9',
    h264 = 'h264'
}
export class Config {
    bandwidth: number
    codec: string
    iceServers: RTCIceServer[]
    rtcConfig: RTCConfiguration

    constructor() {
        this.bandwidth = 0;
        this.codec = ECodecs.default;
        this.iceServers = [
            // {
            //     'urls': [
            //         'stun:webrtcweb.com:7788', // coTURN
            //         // 'stun:webrtcweb.com:7788?transport=udp', // coTURN
            //     ],
            //     'username': 'muazkh',
            //     'credential': 'muazkh'
            // },
            // {
            //     'urls': [
            //         'turn:webrtcweb.com:7788', // coTURN 7788+8877
            //         'turn:webrtcweb.com:4455?transport=udp', // restund udp

            //         'turn:webrtcweb.com:8877?transport=udp', // coTURN udp
            //         'turn:webrtcweb.com:8877?transport=tcp', // coTURN tcp
            //     ],
            //     'username': 'muazkh',
            //     'credential': 'muazkh'
            // },
            // {
            //     'urls': [
            //         'stun:stun.l.google.com:19302',
            //         'stun:stun.l.google.com:19302?transport=udp',
            //     ]
            // }            
        ]
        this.rtcConfig = {
            iceServers: this.iceServers,
            iceTransportPolicy: "all"
        }
    }
}
