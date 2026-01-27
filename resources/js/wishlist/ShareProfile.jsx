import toast from "react-hot-toast";
export default function ShareProfile(props) {
    const { children, username, classes, custom } = props;
    /**
     * 
     * @param {Event} e 
     */
    function shareTo(e) {
        console.log("share profile");
        console.log(props);
        e.stopPropagation();
        const width = window && window.innerWidth;
        const currentURL = custom ? custom : window.location.href;

        if (navigator) {
            navigator && navigator?.share({
                    url: currentURL,
                    title: username ? username : "Spenny Piggy",
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
