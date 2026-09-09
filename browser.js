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


    console.log("Chromium ready");

    return windowId;
}

async function navigate(url) {
    if (!windowId) {
        await findBrowser();
    }


    await xdotool([
    "key",
    "--window",
    windowId,
    "ctrl+l"
]);

await xdotool([
    "type",
    "--window",
    windowId,
    "--delay",
    "0",
    url
]);

await xdotool([
    "key",
    "--window",
    windowId,
    "Return"
]);
    
}

async function mouseMove(x, y) {
    await xdotool([
        "mousemove",
        String(Math.round(x)),
        String(Math.round(y))
    ]);
}

async function mouseDown(button = "left") {
    const buttonNumber =
        button === "left" ? 1 :
        button === "middle" ? 2 :
        button === "right" ? 3 :
        Number(button);

    await xdotool([
        "click",
        String(buttonNumber)
    ]);
}

async function mouseUp() {
    // Nothing for now.
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
    const keyMap = {
        " ": "space",
        "Backspace": "BackSpace",
        "Enter": "Return",
        "Escape": "Escape",
        "ArrowUp": "Up",
        "ArrowDown": "Down",
        "ArrowLeft": "Left",
        "ArrowRight": "Right"
    };

    const xKey = keyMap[key] || key;

    await xdotool([
        "keydown",
        xKey
    ]);
}

async function keyUp(key) {
    const keyMap = {
        " ": "space",
        "Backspace": "BackSpace",
        "Enter": "Return",
        "Escape": "Escape",
        "ArrowUp": "Up",
        "ArrowDown": "Down",
        "ArrowLeft": "Left",
        "ArrowRight": "Right"
    };

    const xKey = keyMap[key] || key;

    await xdotool([
        "keyup",
        xKey
    ]);
}

module.exports = {
    startBrowser,
    navigate,
    mouseMove,
    mouseDown,
    mouseUp,
    mouseWheel,
    keyDown,
    keyUp
};
