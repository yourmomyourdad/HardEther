const { WebSocketServer } = require("ws");
const { chromium } = require("playwright");

const PORT = 8080;

let browser;
let page;

async function startBrowser() {
    browser = await chromium.launch({
        headless: false
    });

    const context = await browser.newContext({
        viewport: {
            width: 1280,
            height: 720
        }
    });

    page = await context.newPage();

    await page.goto("https://example.com");

    console.log("Chromium started");
}

const wss = new WebSocketServer({
    port: PORT
});

wss.on("connection", ws => {
    console.log("Frontend connected");

    ws.send(JSON.stringify({
        type: "ready",
        width: 1280,
        height: 720
    }));

    ws.on("message", async raw => {
        try {
            const message = JSON.parse(raw.toString());

            if (!page) return;

            switch (message.type) {

                case "navigate":
                    await page.goto(message.url);
                    break;

                case "mouse":

                    if (message.action === "move") {
                        await page.mouse.move(
                            message.x,
                            message.y
                        );
                    }

                    if (message.action === "down") {
                        await page.mouse.move(
                            message.x,
                            message.y
                        );

                        await page.mouse.down({
                            button: message.button
                        });
                    }

                    if (message.action === "up") {
                        await page.mouse.move(
                            message.x,
                            message.y
                        );

                        await page.mouse.up({
                            button: message.button
                        });
                    }

                    if (message.action === "wheel") {
                        await page.mouse.wheel(
                            message.dx,
                            message.dy
                        );
                    }

                    break;

                case "keyboard":

                    if (message.action === "down") {
                        await page.keyboard.down(message.key);
                    }

                    if (message.action === "up") {
                        await page.keyboard.up(message.key);
                    }

                    break;
            }

        } catch (error) {
            console.error("Message error:", error);
        }
    });

    ws.on("close", () => {
        console.log("Frontend disconnected");
    });
});

startBrowser().catch(console.error);

console.log(`WebSocket server listening on ${PORT}`);
