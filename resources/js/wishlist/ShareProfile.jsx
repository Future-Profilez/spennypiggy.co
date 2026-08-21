import toast from "react-hot-toast";
export default function ShareProfile(props) {
    const { children, username, classes, custom, label, onMouseEnter, onMouseLeave } = props;
    /**
     *
     * @param {Event} e
     */
    function shareTo(e) {
        e.stopPropagation();
        const currentURL = custom ? custom : window.location.href;

        if (navigator?.share) {
            navigator
                .share({
                    url: currentURL,
                    title: username ? username : "Spenny Piggy",
                })
                .catch((error) => {
                    // User cancellation is expected; don't throw noisy unhandled promise errors.
                    if (error?.name === "AbortError") return;
                    console.error("Share failed:", error);
                });

            return;
        }

        // ⚠️ `writeText` is a PROMISE and was neither awaited nor caught, while
        // the success toast fired unconditionally — a denied clipboard
        // permission told the user the link was copied when nothing had been.
        navigator.clipboard
            ?.writeText(currentURL)
            .then(() => toast.success("Link copied."))
            .catch(() => toast.error("Couldn't copy the link."));
    }

    return (
        <button
            type="button"
            className={classes}
            onClick={shareTo}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            aria-label={
                label ||
                (username ? `Share ${username}'s profile` : "Share this profile")
            }
        >
            {children}
        </button>
    );
}
