const { chromium } = require("playwright");

let browser;
let context;
let page;

async function startBrowser() {
    browser = await chromium.launch({
        headless: true
    });

    context = await browser.newContext({
        viewport: {
            width: 800,
            height: 600
        }
    });

    page = await context.newPage();

    await page.goto("https://example.com");

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

module.exports = {
    startBrowser,
    setViewport,
    navigate,
    mouseMove,
    mouseDown,
    mouseUp,
    mouseWheel,
    keyDown,
    keyUp
};
