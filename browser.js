const { chromium } = require("playwright");

let browser;
let context;
let page;

async function startBrowser() {
   browser = await chromium.launch({
    headless: false
});

    context = await browser.newContext({
        viewport: {
    width: 1280,
    height: 720
}
    });

    page = await context.newPage();

    await page.goto("https://google.com")

    console.log("Browser started");

    return page;
}

async function setViewport(width, height) {
    if (!page) return;

    await page.setViewportSize({
        width,
        height
    });
}

async function navigate(url) {
    if (!page) return;

    await page.goto(url);
}

async function mouseMove(x, y) {
    await page.mouse.move(x, y);
}

async function mouseDown(button) {
    await page.mouse.down({ button });
}

async function mouseUp(button) {
    await page.mouse.up({ button });
}

async function mouseWheel(dx, dy) {
    await page.mouse.wheel(dx, dy);
}

async function keyDown(key) {
    await page.keyboard.down(key);
}

async function keyUp(key) {
    await page.keyboard.up(key);
}
async function screenshot() {
    return await page.screenshot({
        type: "png"
    });
}
const { execFile } = require("child_process");

function findBarHeight() {
    return new Promise((resolve, reject) => {
        execFile(
            "xdotool",
            [
                "search",
                "--onlyvisible",
                "--class",
                "chromium",
                "getwindowgeometry"
            ],
            {
                env: {
                    ...process.env,
                    DISPLAY: ":99"
                }
            },
            (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                const match = stdout.match(
                    /Geometry:\s*(\d+)x(\d+)/
                );

                if (!match) {
                    reject(
                        new Error(
                            "Could not find Chromium window geometry"
                        )
                    );
                    return;
                }

                const windowWidth = Number(match[1]);
                const windowHeight = Number(match[2]);

                const viewport = page.viewportSize();

                if (!viewport) {
                    reject(
                        new Error(
                            "Could not determine Playwright viewport"
                        )
                    );
                    return;
                }

                const barHeight =
                    windowHeight - viewport.height;

                console.log(
                    `Chromium: ${windowWidth}x${windowHeight}`
                );

                console.log(
                    `Viewport: ${viewport.width}x${viewport.height}`
                );

                console.log(
                    `Browser bar: ${barHeight}px`
                );

                resolve(barHeight);
            }
        );
    });
}
module.exports = {
    startBrowser,
    setViewport,
    navigate,
    findBarHeight,
    screenshot,
    mouseMove,
    mouseDown,
    mouseUp,
    mouseWheel,
    keyDown,
    keyUp
};
