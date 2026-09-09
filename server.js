const { WebSocketServer } = require("ws");

const {
    RTCPeerConnection,
    RTCSessionDescription,
    RTCIceCandidate,
    nonstandard
} = require("@roamhq/wrtc");

const { RTCVideoSource } = nonstandard;

const browser = require("./browser");
const { spawn } = require("child_process");

const PORT = 8080;

// ─────────────────────────────────────────────
// WebRTC video source
// ─────────────────────────────────────────────

const videoSource = new RTCVideoSource();
const videoTrack = videoSource.createTrack();

// ─────────────────────────────────────────────
// WebSocket server
// ─────────────────────────────────────────────

const wss = new WebSocketServer({
    port: PORT
});

wss.on("listening", () => {
    console.log(`WebSocket server listening on ${PORT}`);
});

wss.on("error", error => {
    console.error("WebSocket server error:", error);
});

// ─────────────────────────────────────────────
// FFmpeg → Xvfb → WebRTC
// ─────────────────────────────────────────────

function startVideoCapture() {
    const WIDTH = 1280;
    const HEIGHT = 720;

    // I420 / YUV420p = 1.5 bytes per pixel
    const FRAME_SIZE = WIDTH * HEIGHT * 3 / 2;

    console.log("Starting FFmpeg video capture...");

    const ffmpeg = spawn("ffmpeg", [
        "-f", "x11grab",
        "-video_size", `${WIDTH}x${HEIGHT}`,
        "-framerate", "30",
        "-i", ":99.0",

        "-f", "rawvideo",
        "-pix_fmt", "yuv420p",

        "pipe:1"
    ]);

    let buffer = Buffer.alloc(0);

    ffmpeg.stdout.on("data", chunk => {
        // FFmpeg stdout chunks aren't guaranteed to equal one frame.
        buffer = Buffer.concat([buffer, chunk]);

        while (buffer.length >= FRAME_SIZE) {
            const frame = Buffer.from(
    buffer.subarray(0, FRAME_SIZE)
);

            buffer = buffer.subarray(FRAME_SIZE);
           
            videoSource.onFrame({
                width: WIDTH,
                height: HEIGHT,
                data: frame
            });
        }
    });

    ffmpeg.stderr.on("data", data => {
        console.log("FFmpeg:", data.toString());
    });

    ffmpeg.on("close", code => {
        console.log("FFmpeg exited:", code);
    });

    ffmpeg.on("error", error => {
        console.error("FFmpeg error:", error);
    });
}

// ─────────────────────────────────────────────
// WebSocket connections
// ─────────────────────────────────────────────

wss.on("connection", (ws, request) => {

    console.log("🔥 FRONTEND CONNECTED!");
    console.log("Origin:", request.headers.origin);

    // ─────────────────────────────────────────
    // WebRTC peer connection
    // ─────────────────────────────────────────

    const pc = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.l.google.com:19302"
            }
        ]
    });

    // Send our video track to the frontend
    pc.addTrack(videoTrack);

    // ─────────────────────────────────────────
    // WebRTC ICE
    // ─────────────────────────────────────────

    pc.onicecandidate = event => {
        if (event.candidate) {
            console.log(
                "Node ICE candidate:",
                event.candidate.candidate
            );

            ws.send(JSON.stringify({
                type: "ice",
                candidate: event.candidate
            }));
        }
    };

    pc.onconnectionstatechange = () => {
        console.log(
            "WebRTC state:",
            pc.connectionState
        );
    };

    // Tell frontend WebRTC is available
    ws.send(JSON.stringify({
        type: "webrtc-ready"
    }));

    // ─────────────────────────────────────────
    // WebSocket errors
    // ─────────────────────────────────────────

    ws.on("error", error => {
        console.error(
            "WebSocket client error:",
            error
        );
    });

    ws.send(JSON.stringify({
        type: "connected"
    }));

    // ─────────────────────────────────────────
    // Messages from frontend
    // ─────────────────────────────────────────

    ws.on("message", async raw => {

        try {

            const message = JSON.parse(
                raw.toString()
            );

            switch (message.type) {

                // ─────────────────────────────
                // WebRTC offer
                // ─────────────────────────────

                case "webrtc-offer": {

                    console.log(
                        "Received WebRTC offer"
                    );

                    await pc.setRemoteDescription(
                        new RTCSessionDescription(
                            message.offer
                        )
                    );

                    const answer =
                        await pc.createAnswer();

                    await pc.setLocalDescription(
                        answer
                    );

                    ws.send(JSON.stringify({
                        type: "webrtc-answer",

                        answer: {
                            type:
                                pc.localDescription.type,

                            sdp:
                                pc.localDescription.sdp
                        }
                    }));

                    console.log(
                        "Sent WebRTC answer"
                    );

                    break;
                }

                // ─────────────────────────────
                // ICE candidate
                // ─────────────────────────────

                case "ice": {

                    console.log(
                        "Received frontend ICE candidate"
                    );

                    await pc.addIceCandidate(
                        new RTCIceCandidate(
                            message.candidate
                        )
                    );

                    break;
                }

                // ─────────────────────────────
                // Viewport
                // ─────────────────────────────

                case "viewport": {

                    await browser.setViewport(
                        message.width,
                        message.height
                    );

                    break;
                }

                // ─────────────────────────────
                // Navigation
                // ─────────────────────────────

                case "navigate": {

                    console.log(
                        "Navigating to:",
                        message.url
                    );

                    await browser.navigate(
                        message.url
                    );

                    break;
                }

                // ─────────────────────────────
                // Screenshot
                // ─────────────────────────────

                case "screenshot": {

                    console.log(
                        "Taking screenshot..."
                    );

                    const screenshot =
                        await browser.screenshot();

                    ws.send(JSON.stringify({
                        type: "screenshot",

                        data:
                            screenshot.toString(
                                "base64"
                            )
                    }));

                    console.log(
                        "Screenshot sent!"
                    );

                    break;
                }

                // ─────────────────────────────
                // Mouse
                // ─────────────────────────────

                case "mouse": {
                    if (
                        message.action === "move"
                    ) {

                        await browser.mouseMove(
                            message.x,
                            message.y
                        );

                    } else if (
                        message.action === "down"
                    ) {

                        await browser.mouseDown(
                            message.button
                        );

                    } else if (
                        message.action === "up"
                    ) {

                        await browser.mouseUp(
                            message.button
                        );

                    } else if (
                        message.action === "wheel"
                    ) {

                        await browser.mouseWheel(
                            message.dx,
                            message.dy
                        );
                    }

                    break;
                }

                // ─────────────────────────────
                // Keyboard
                // ─────────────────────────────

                case "keyboard": {

                    if (
                        message.action === "down"
                    ) {

                        await browser.keyDown(
                            message.key
                        );

                    } else if (
                        message.action === "up"
                    ) {

                        await browser.keyUp(
                            message.key
                        );
                    }

                    break;
                }
            }

        } catch (error) {

            console.error(
                "Message error:",
                error
            );

            ws.send(JSON.stringify({
                type: "error",
                message: error.message
            }));
        }
    });

    // ─────────────────────────────────────────
    // Connection closed
    // ─────────────────────────────────────────

    ws.on("close", () => {

        console.log(
            "Frontend disconnected"
        );

        pc.close();
    });
});

// ─────────────────────────────────────────────
// Start Chromium
// ─────────────────────────────────────────────

browser.startBrowser()
    .then(() => {

        console.log(
            "Chromium ready"
        );

        // Start Xvfb screen capture → WebRTC
        startVideoCapture();

    })
    .catch(error => {

        console.error(
            "Failed to start Chromium:",
            error
        );

    });
