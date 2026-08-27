const { WebSocketServer } = require("ws");
const {
    RTCPeerConnection
} = require("@roamhq/wrtc");
const browser = require("./browser");

const PORT = 8080;

const wss = new WebSocketServer({
    port: PORT
});

wss.on("listening", () => {
    console.log(`WebSocket server listening on ${PORT}`);
});

wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
});

wss.on("connection", (ws, request) => {
    const pc = new RTCPeerConnection();

pc.onicecandidate = event => {
    if (event.candidate) {
        ws.send(JSON.stringify({
            type: "ice",
            candidate: event.candidate
        }));
    }
};

pc.onconnectionstatechange = () => {
    console.log("WebRTC state:", pc.connectionState);
};

ws.send(JSON.stringify({
    type: "webrtc-ready"
}));
    console.log("🔥 FRONTEND CONNECTED!");
    console.log("Origin:", request.headers.origin);

    ws.on("error", (error) => {
        console.error("WebSocket client error:", error);
    });

    ws.send(JSON.stringify({
        type: "connected"
    }));

    ws.on("message", async raw => {
        try {
            const message = JSON.parse(raw.toString());

            switch (message.type) {

                case "viewport":
                    await browser.setViewport(
                        message.width,
                        message.height
                    );
                    break;

                case "navigate":
                    console.log("Navigating to:", message.url);
                    await browser.navigate(message.url);
                    break;
                case "screenshot":
    console.log("Taking screenshot...");

    const screenshot = await browser.screenshot();

    ws.send(JSON.stringify({
        type: "screenshot",
        data: screenshot.toString("base64")
    }));

    console.log("Screenshot sent!");

    break;
                case "mouse":

                    if (message.action === "move") {
                        await browser.mouseMove(
                            message.x,
                            message.y
                        );
                    }

                    else if (message.action === "down") {
                        await browser.mouseDown(
                            message.button
                        );
                    }

                    else if (message.action === "up") {
                        await browser.mouseUp(
                            message.button
                        );
                    }

                    else if (message.action === "wheel") {
                        await browser.mouseWheel(
                            message.dx,
                            message.dy
                        );
                    }

                    break;

                case "keyboard":

                    if (message.action === "down") {
                        await browser.keyDown(message.key);
                    }

                    else if (message.action === "up") {
                        await browser.keyUp(message.key);
                    }

                    break;
            }

        } catch (error) {
            console.error("Message error:", error);

            ws.send(JSON.stringify({
                type: "error",
                message: error.message
            }));
        }
    });

    ws.on("close", () => {
        console.log("Frontend disconnected");
    });
});

browser.startBrowser()
    .then(() => {
        console.log("Chromium ready");
    })
    .catch(console.error);
