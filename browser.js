const { execFile } = require("child_process");

const DISPLAY = ":99";

let windowId = null;

function xdotool(args) {
    return new Promise((resolve, reject) => {
        execFile(
            "xdotool",
            args,
            {
                env: {
                    ...process.env,
                    DISPLAY
                }
            },
            (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve(stdout.trim());
            }
        );
    });
}

async function findBrowser() {
    const output = await xdotool([
        "search",
        "--onlyvisible",
        "--class",
        "chromium"
    ]);

    const windows = output
        .split("\n")
        .map(x => x.trim())
        .filter(Boolean);

    if (!windows.length) {
        throw new Error("Could not find Chromium window");
    }

    windowId = windows[windows.length - 1];

    console.log("Chromium window:", windowId);

    return windowId;
}

async function startBrowser() {
    console.log("Starting Chromium...");

    await xdotool([
        "search",
        "--onlyvisible",
        "--class",
        "chromium"
    ]).catch(() => {});

    await new Promise(resolve => setTimeout(resolve, 1000));

    await findBrowser();

    await xdotool([
        "windowactivate",
        "--sync",
        windowId
    ]);

    console.log("Chromium ready");

    return windowId;
}

async function navigate(url) {
    if (!windowId) {
        await findBrowser();
    }

    await xdotool([
        "windowactivate",
        "--sync",
        windowId
    ]);

    await xdotool([
        "key",
        "ctrl+l"
    ]);

    await xdotool([
        "type",
        "--delay",
        "0",
        url
    ]);

    await xdotool([
        "key",
        "Return"
    ]);
}

async function mouseMove(x, y) {
    if (!windowId) await findBrowser();

    await xdotool([
        "mousemove",
        "--window",
        windowId,
        String(Math.round(x)),
        String(Math.round(y))
    ]);
}

async function mouseClick(button = 1) {
    if (!windowId) await findBrowser();

    await xdotool([
        "click",
        "--window",
        windowId,
        String(button)
    ]);
}

async function mouseDown(button = 1) {
    if (!windowId) await findBrowser();

    await xdotool([
        "mousedown",
        String(button)
    ]);
}

async function mouseUp(button = 1) {
    if (!windowId) await findBrowser();

    await xdotool([
        "mouseup",
        String(button)
    ]);
}

async function mouseWheel(dx, dy) {
    if (!windowId) await findBrowser();

    if (dy < 0) {
        await xdotool(["click", "4"]);
    } else if (dy > 0) {
        await xdotool(["click", "5"]);
    }
}

async function keyDown(key) {
    if (!windowId) await findBrowser();

    await xdotool([
        "keydown",
        key
    ]);
}

async function keyUp(key) {
    if (!windowId) await findBrowser();

    await xdotool([
        "keyup",
        key
    ]);
}

module.exports = {
    startBrowser,
    findBrowser,
    navigate,
    mouseMove,
    mouseClick,
    mouseDown,
    mouseUp,
    mouseWheel,
    keyDown,
    keyUp
};
