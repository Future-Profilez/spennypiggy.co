import { useState } from "react";
import { useAlerts } from "@/Components/Alerts";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";

export default function RemovePost({ text, uuid, updateItems, classes }) {
    const { successAlert, errorAlert } = useAlerts();
    const { auth } = usePage().props;
    const [confirming, setConfirming] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const remove = () => {
        if (!uuid || deleting) return;
        setDeleting(true);

        // POST, not GET — a GET delete carries no CSRF token.
        axios
            .post(`/post/delete/${uuid}`)
            .then((resp) => {
                if (resp.data.status) {
                    successAlert(resp.data.msg);
                    updateItems?.(uuid);
                    router.visit(
                        route("user.show", {
                            username: auth.user.username,
                            page: "feed",
                        }),
                        {
                            preserveState: true,
                            preserveScroll: true,
                        },
                    );
                } else {
                    errorAlert(resp.data.msg);
                    setDeleting(false);
                    setConfirming(false);
                }
            })
            .catch((err) => {
                errorAlert(
                    err?.response?.data?.msg ||
                        "Couldn't delete this post. Please try again.",
                );
                setDeleting(false);
                setConfirming(false);
            });
    };

    // Deleting a post is permanent and was previously a single unguarded click inside a
    // dropdown — one mis-tap on mobile destroyed the post, its comments and its likes.
    if (confirming) {
        return (
            <div className={`${classes} flex items-center gap-2`}>
                <button
                    type="button"
                    onClick={remove}
                    disabled={deleting}
                    className="text-red-600 font-bold disabled:opacity-50"
                >
                    {deleting ? "Deleting…" : "Confirm delete"}
                </button>
                <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    className="text-gray-500"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            type="button"
            className={classes}
            onClick={() => setConfirming(true)}
        >
            {text}
        </button>
    );
}
