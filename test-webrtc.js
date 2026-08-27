const wrtc = require("@roamhq/wrtc");

console.log("WebRTC loaded!");

console.log({
    RTCPeerConnection: typeof wrtc.RTCPeerConnection,
    RTCSessionDescription: typeof wrtc.RTCSessionDescription,
    RTCIceCandidate: typeof wrtc.RTCIceCandidate
});
