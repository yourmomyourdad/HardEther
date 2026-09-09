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

    
    await page.goto("https://example.com");
    
    await page.setContent(`
        <!DOCTYPE html>
        <html>
        <body style="margin:0; background:#111; color:white; font:30px monospace;">
            <div id="mouse">X: 0<br>Y: 0</div>

            <script>
                document.addEventListener("mousemove", event => {
                    document.getElementById("mouse").innerHTML =
                        "X: " + event.clientX +
                        "<br>Y: " + event.clientY;
                });
            </script>
        </body>
        </html>
    `);

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
module.exports = {
    startBrowser,
    setViewport,
    navigate,
    screenshot,
    mouseMove,
    mouseDown,
    mouseUp,
    mouseWheel,
    keyDown,
    keyUp
};
