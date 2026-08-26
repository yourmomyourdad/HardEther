const { WebSocketServer } = require("ws");

const browser = require("./browser");

const PORT = 8080;

const wss = new WebSocketServer({
    port: PORT
});

wss.on("connection", ws => {
    console.log("Frontend connected");

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
            console.error(error);

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
        console.log(`WSS server listening on ${PORT}`);
    })
    .catch(console.error);
