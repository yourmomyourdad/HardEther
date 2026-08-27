const {
    RTCPeerConnection
} = require("@roamhq/wrtc");

async function main() {
    const pc = new RTCPeerConnection();

    console.log("PeerConnection created!");

    const offer = await pc.createOffer();

    await pc.setLocalDescription(offer);

    console.log("Offer created!");
    console.log("Type:", pc.localDescription.type);
    console.log("SDP length:", pc.localDescription.sdp.length);

    await pc.close();

    console.log("PeerConnection closed.");
}

main().catch(console.error);
