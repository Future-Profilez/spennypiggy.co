import toast from "react-hot-toast";
export default function ShareProfile(props) {
    const { children, username, classes, custom } = props;
    /**
     * 
     * @param {Event} e 
     */
    function shareTo(e) {
        e.stopPropagation();
        const width = window && window.innerWidth;
        const currentURL = custom ? custom : window.location.href;

        if (navigator?.share) {
            navigator.share({
                    url: currentURL,
                    title: username ? username : "Spenny Piggy",
                }).catch((error) => {
                    // User cancellation is expected; don't throw noisy unhandled promise errors.
                    if (error?.name === "AbortError") return;
                    console.error("Share failed:", error);
                });
        } else {
            navigator.clipboard.writeText(currentURL);
            toast.success("Copied to Clipboard.");
        }
    }

    return (
        <>
            <button className={classes} onClick={shareTo}>
                {children}
            </button>
        </>
    );
}
