import { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { useAlerts } from "../../Components/Alerts";

export default function AddComment({
    post_uuid,
    update,
    is_reply,
    comment_uuid,
    updateComments,
}) {
    const { auth } = usePage().props;
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState();
    const { successAlert, errorAlert } = useAlerts();

    const addCommmnt = (e) => {
        e.preventDefault();
        // Was `(auth && auth.user == undefined) || null` — parsed as `(...) || null`, so the
        // guard never fired and a logged-out user's submit fell through to the request.
        if (!auth?.user) {
            errorAlert("You must log in first.");
            return false;
        }
        // No empty comments, and no double-submit (Enter + click both call this).
        if (!reply.trim() || loading) {
            return false;
        }
        setLoading(true);
        if (is_reply) {
            axios
                .post(`/post/comment-reply/${comment_uuid}`, {
                    reply: reply,
                })
                .then((resp) => {
                    if (resp.data.status) {
                        successAlert(resp.data.msg);
                        update && update();
                        setReply("");
                        updateComments && updateComments();
                    } else {
                        errorAlert(resp.data.msg);
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("error", err);
                    errorAlert(
                        err?.response?.data?.msg || "Something went wrong.",
                    );
                    setLoading(false);
                });
        } else {
            axios
                .post(`/post/comment/${post_uuid}`, { comment: reply })
                .then((resp) => {
                    if (resp.data.status) {
                        successAlert(resp.data.msg);
                        update && update();
                        setReply("");
                        updateComments && updateComments();
                    } else {
                        errorAlert(resp.data.msg);
                    }
                    setLoading(false);
                })
                .catch((err) => {
                    console.error("error", err);
                    errorAlert(
                        err?.response?.data?.msg || "Something went wrong.",
                    );
                    setLoading(false);
                });
        }
    };

    return (
        <>
            <div className="headerpost mt-3 flex items-center">
                <form onSubmit={addCommmnt} className="flex w-full relative">
                    <input
                        id="user-comment"
                        onChange={(e) => setReply(e.target.value)}
                        value={reply}
                        maxLength={1000}
                        className="flex-1 min-h-[44px] border py-3 px-4 pr-12 !border-gray-200 !bg-gray-100 !text-black rounded-box-sm"
                        type="text"
                        placeholder="Add comment..."
                    />
                    <button
                        type="submit"
                        aria-label="Post comment"
                        disabled={reply.trim() === "" || loading}
                        className="absolute top-1/2 -translate-y-1/2 right-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-transparent border-0 disabled:opacity-40"
                    >
                        {loading ? (
                            <svg
                                className="h-8 w-8 animate-spin"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {" "}
                                <path
                                    d="M 12 2 A 10 10 0 0 1 22 12"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    fill="none"
                                />{" "}
                            </svg>
                        ) : (
                            <svg
                                aria-label="Share Post"
                                className="x1lliihq x1n2onr6 x1roi4f4"
                                fill="#000000"
                                height="24"
                                role="img"
                                viewBox="0 0 24 24"
                                width="24"
                            >
                                <title>Share Post</title>
                                <line
                                    fill="none"
                                    stroke="#000000"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    x1="22"
                                    x2="9.218"
                                    y1="3"
                                    y2="10.083"
                                ></line>
                                <polygon
                                    fill="none"
                                    points="11.698 20.334 22 3.001 2 3.001 9.218 10.084 11.698 20.334"
                                    stroke="#000000"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                ></polygon>
                            </svg>
                        )}
                    </button>
                </form>
            </div>
        </>
    );
}
