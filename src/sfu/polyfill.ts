import WRTC = require('wrtc');


WRTC.RTCPeerConnection.prototype.addStream = WRTC.RTCPeerConnection.prototype.addStream || function(stream: MediaStream) {
    stream.getTracks().forEach(track => {
        this.addTrack(track, stream)
    })
}