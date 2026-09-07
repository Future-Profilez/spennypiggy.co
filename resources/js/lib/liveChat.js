/**
 * Opening the live chat, and knowing when it is not there.
 *
 * 🚨 `typeof window.Intercom === "function"` IS NOT A LOADED-CHECK. IntercomProvider
 * installs a stub that QUEUES calls until the widget script arrives, so with an ad
 * blocker, with `intercom.enabled === false`, or as a logged-out visitor (the provider
 * returns early for guests), the call is ACCEPTED, nothing opens, and — because the
 * caller had already called preventDefault — the reader is left on a dead link being
 * told their chat is open. Only the real widget sets `booted`.
 *
 * That is the same trap ErrorPage.jsx and SuspendedBanner.jsx already document; this
 * file exists so the next caller cannot get it wrong again.
 *
 * ⚠️ The fallback is the caller's `href`, NOT a second thing this function does. An
 * anchor whose href is a real mailto: works with no JavaScript at all, works for a
 * crawler, and works for the middle-click that opens it in a new tab. So the rule is:
 * write the fallback into the markup, and let this function preventDefault ONLY when
 * it has something better to offer.
 */
export function liveChatAvailable() {
    return typeof window !== "undefined" && window.Intercom?.booted === true;
}

/**
 * onClick handler for any "chat to us" control.
 *
 * Returns true when the messenger was opened (and the event was cancelled), false
 * when the anchor's own href should be followed instead.
 */
export function openLiveChat(e) {
    if (! liveChatAvailable()) {
        return false;
    }

    e?.preventDefault();
    window.Intercom("showNewMessage");

    return true;
}
