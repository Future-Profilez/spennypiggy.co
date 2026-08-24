import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Everything the app knows about installing itself, in one place.
 *
 * 🚨 EXTRACTED FROM `Components/PwaInstallPrompt.jsx`, NOT COPIED. Two surfaces now ask
 * "can this browser install us, and if not, what does the reader have to tap" — the
 * install banner and the profile promo deck — and a second copy of these strings would
 * drift the day one browser changes its menu. `PwaInstallPrompt` imports from here; the
 * comments below came with the code and still hold.
 */

/** True inside the installed app, where nothing may offer to install it again. */
export function isInstalled() {
    if (typeof window === "undefined") return false;

    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

/** Which set of steps to show when the browser cannot install on its own. */
export function detectPlatform() {
    if (typeof navigator === "undefined") return "other";

    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (ua.includes("edg")) return "edge";
    if (ua.includes("chrome")) return "chrome";
    if (ua.includes("safari")) return "safari";

    return "other";
}

/*
 * ⚠️ NO MENU GLYPHS. `⋮` and `…` are not in the body face and rendered as a
 * fallback that read as "(:)" on the live banner — a step that mis-describes
 * the button it is pointing at is worse than no step. The menus are named in
 * words and by POSITION instead, which also survives a browser changing its
 * icon.
 * ⚠️ Each step is one action. "Confirm to finish" was a third step on three of
 * these platforms and is the browser's own dialog, so it is folded into the
 * step that opens it.
 */
export const STEPS = {
    ios: [
        "Tap the share button in Safari's toolbar.",
        'Scroll down and choose "Add to Home Screen".',
        'Tap "Add".',
    ],
    safari: ["Open Safari's share menu.", 'Choose "Add to Dock", then confirm.'],
    chrome: [
        "Open Chrome's menu — the three dots, top right.",
        'Choose "Install Spenny Piggy", then press Install.',
    ],
    edge: [
        "Open Edge's menu — the three dots, top right.",
        'Choose "Apps", then "Install this site as an app".',
    ],
    other: [
        "Open your browser's menu.",
        'Look for "Install" or "Add to Home Screen".',
    ],
};

/** Short platform name for a label, e.g. "On iPhone". */
export const PLATFORM_LABEL = {
    ios: "On iPhone",
    safari: "In Safari",
    chrome: "In Chrome",
    edge: "In Edge",
    other: "In your browser",
};

/*
 * ─── The install event, held for whoever asks ──────────────────────────────
 *
 * 🚨 `beforeinstallprompt` FIRES ONCE, EARLY, AND IS NEVER REPLAYED. A component
 * that mounts after it fired — anything below the fold on the landing page — can
 * add a listener and wait forever. So the capture lives at MODULE scope and runs
 * the moment this file is imported (`Layouts/GuestLayout` imports it eagerly via
 * `PwaInstallPrompt`), and late mounters read the stored event instead of racing
 * for it.
 *
 * ⚠️ `PwaInstallPrompt` still keeps its own listener. Both receive the same event
 * — that is how DOM listeners work — and whichever surface prompts first wins;
 * the other's `prompt()` rejects and its catch falls back to showing the steps,
 * which is already the behaviour for a browser that refuses. Do not "fix" that by
 * deleting one of them without checking the bar still installs.
 */
let deferredPrompt = null;
const subscribers = new Set();

const notify = () => subscribers.forEach((fn) => fn());

if (typeof window !== "undefined") {
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;
        notify();
    });
    window.addEventListener("appinstalled", () => {
        deferredPrompt = null;
        notify();
    });
}

/**
 * Everything a surface needs to offer the install: whether the browser can do it
 * natively, how to trigger it, and the words to show when it cannot.
 */
export function usePwaInstall() {
    const [canInstallNatively, setCanInstallNatively] = useState(
        () => Boolean(deferredPrompt),
    );
    /* ⚠️ Read on mount, never during render on the server: `isInstalled()` touches
       `window.matchMedia`, and a first render that disagrees with the client would
       hydrate the wrong branch. */
    const [installed, setInstalled] = useState(false);
    const platform = useRef("other");

    useEffect(() => {
        platform.current = detectPlatform();
        setInstalled(isInstalled());

        const sync = () => {
            setCanInstallNatively(Boolean(deferredPrompt));
            setInstalled(isInstalled());
        };
        subscribers.add(sync);
        sync();

        return () => subscribers.delete(sync);
    }, []);

    /** Returns true when the browser actually showed its own install dialog. */
    const install = useCallback(async () => {
        const prompt = deferredPrompt;
        if (!prompt) return false;

        try {
            await prompt.prompt();
            await prompt.userChoice;
            deferredPrompt = null;
            notify();
            return true;
        } catch {
            /* The browser refused its own dialog — the caller falls back to the
               written steps, same as the install bar does. */
            return false;
        }
    }, []);

    return {
        canInstallNatively,
        installed,
        install,
        platform: platform.current,
        platformLabel: PLATFORM_LABEL[platform.current] || PLATFORM_LABEL.other,
        steps: STEPS[platform.current] || STEPS.other,
    };
}
