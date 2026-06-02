import { TimeFormat } from "@/includes/TimeFormat";
import { useState } from "react";
import AddComment from "./AddComment";
import userphoto from "../../../assets/siteicon.png";
import { usePage } from "@inertiajs/react";
import axios from "axios";

export default function Comment({
    c,
    update,
    updateComments,
    postUserId,
    isAdmin = false,
}) {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id || null;
    const isPostCreator = currentUserId && currentUserId === postUserId;
    const isAdminUser = auth?.user?.role === "admin" || isAdmin;

    const [handleReply, setHandleReply] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isItemOwner = (item) => currentUserId === item?.user_id;
    const isOwnComment = isItemOwner(c);

    // Post Creator can manage others' comments, but NOT their own
    const canManageComment = isPostCreator && !isOwnComment;

    // For replies: Post Creator can manage replies from others (not their own)
    const canManageReply = (reply) => {
        const isReplyOwner = currentUserId === reply?.user_id;
        return isPostCreator && !isReplyOwner;
    };

    const canViewComment = (item) => {
        const status = Number(item?.is_approved);

        // approved by admin - everyone can see
        if (status === 1) {
            return true;
        }

        // creator can see everything (including pending)
        if (isPostCreator) {
            return true;
        }

        // admin can see everything
        if (isAdminUser) {
            return true;
        }

        // comment owner can see own comment
        if (currentUserId === item?.user_id) {
            return true;
        }

        return false;
    };

    const getStatusLabel = (item) => {
        const status = Number(item?.is_approved);
        const owner = isItemOwner(item);

        if (status === 0) {
            if (owner) return "Awaiting Creator Approval";
            if (isPostCreator) return "Pending Your Approval";
            return "Pending Creator Approval";
        }

        if (status === 1) {
            if (owner) return "Published";
            return null;
        }

        if (status === 2) {
            if (owner) return "In Review";
            if (isPostCreator) return "Pending Admin Review";
            if (isAdminUser) return "Pending Admin Review";
            return "Pending Review";
        }

        if (status === 3) {
            if (owner) return "Rejected";
            return "Rejected by Admin";
        }

        return null;
    };

    const getStatusClass = (item) => {
        switch (Number(item?.is_approved)) {
            case 0:
                return "bg-yellow-100 text-yellow-700";
            case 1:
                return "bg-green-100 text-green-700";
            case 2:
                return "bg-blue-100 text-blue-700";
            case 3:
                return "bg-red-100 text-red-700";
            default:
                return "";
        }
    };

    // Get button label based on current status and user role
    const getActionButtonLabel = (item) => {
        const status = Number(item?.is_approved);

        if (status === 0) {
            return "Approve Comment";
        }
        if (status === 2) {
            return "Move To Pending";
        }
        return "Approve Comment";
    };

    const getActionButtonClass = (item) => {
        const status = Number(item?.is_approved);

        if (status === 0) {
            return "text-green-600 font-bold hover:text-green-700";
        }
        if (status === 2) {
            return "text-red-500 font-bold hover:text-red-600";
        }
        return "text-green-600 font-bold hover:text-green-700";
    };

    const updates = () => {
        setHandleReply(false);
        update && update();
    };

    // Send comment to admin review (Post Creator action) - Using original endpoint
    const sendCommentToAdmin = (uuid) => {
        setActionLoading(true);
        axios
            .post(`/post/comment-approve/${uuid}`)
            .then(() => {
                update();
                setActionLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setActionLoading(false);
                alert("Failed to send comment to admin");
            });
    };

    // Send reply to admin review (Post Creator action) - Using original endpoint
    const sendReplyToAdmin = (uuid) => {
        setActionLoading(true);
        axios
            .post(`/post/reply-approve/${uuid}`)
            .then(() => {
                update();
                setActionLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setActionLoading(false);
                alert("Failed to send reply to admin");
            });
    };

    const deleteComment = (uuid) => {
        if (window.confirm("Are you sure you want to remove this comment?")) {
            setDeleting(true);
            axios
                .post(`/post/comment-delete/${uuid}`)
                .then(() => {
                    update();
                    setDeleting(false);
                })
                .catch((err) => {
                    console.error(err);
                    setDeleting(false);
                    alert("Failed to delete comment");
                });
        }
    };

    const deleteReply = (uuid) => {
        if (window.confirm("Are you sure you want to remove this reply?")) {
            setDeleting(true);
            axios
                .post(`/post/reply-delete/${uuid}`)
                .then(() => {
                    update();
                    setDeleting(false);
                })
                .catch((err) => {
                    console.error(err);
                    setDeleting(false);
                    alert("Failed to delete reply");
                });
        }
    };

    const CommentReply = ({ item }) => {
        const canManage = canManageReply(item);
        const replyStatus = Number(item?.is_approved);
        const isReplyVisible = canViewComment(item);

        return (
            <div className="pt-4 pb-2 flex justify-center items-center">
                <div className="w-full h-auto flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className="flex flex-shrink-0 self-start cursor-pointer">
                            <img
                                src={item.user?.avatar_url || userphoto}
                                alt=""
                                className="h-10 w-10 object-fill rounded-full"
                            />
                        </div>
                        <div className="flex items-center justify-center space-x-2 w-full">
                            <div className="block w-full">
                                <div className="w-auto rounded-[30px] px-2 ps-0 pb-2">
                                    <div className="font-medium flex items-center justify-between flex-wrap gap-2">
                                        <a
                                            href="#"
                                            className="hover:underline text-sm"
                                        >
                                            <p className="text-base font-bold capitalize">
                                                {item.user?.name || ""}
                                            </p>
                                        </a>
                                        {getStatusLabel(item) && (
                                            <span
                                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusClass(item)}`}
                                            >
                                                {getStatusLabel(item)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-small font-light text-gray-600 mt-1">
                                        {isReplyVisible
                                            ? item.reply
                                            : "Reply awaiting approval"}
                                    </div>
                                </div>
                                <div className="flex justify-start items-center text-xs w-full flex-wrap gap-2">
                                    {auth?.user && (
                                        <button
                                            onClick={() => setHandleReply(true)}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            Reply
                                        </button>
                                    )}
                                    <span className="text-gray-400">•</span>
                                    <span className="text-gray-500 text-sm">
                                        <TimeFormat
                                            dateString={item.created_at || ""}
                                        />
                                    </span>

                                    {/* Post Creator can manage others' replies - NOT their own */}
                                    {canManage && replyStatus !== 1 && (
                                        <>
                                            <span className="text-gray-400">
                                                •
                                            </span>
                                            <button
                                                disabled={actionLoading}
                                                onClick={() =>
                                                    sendReplyToAdmin(item.uuid)
                                                }
                                                className={`text-sm ${getActionButtonClass(item)} disabled:opacity-50`}
                                            >
                                                {actionLoading
                                                    ? "Processing..."
                                                    : getActionButtonLabel(
                                                          item,
                                                      )}
                                            </button>
                                        </>
                                    )}

                                    {/* Delete button for Post Creator or Reply Owner */}
                                    {(isPostCreator || isItemOwner(item)) && (
                                        <>
                                            <span className="text-gray-400">
                                                •
                                            </span>
                                            <button
                                                disabled={deleting}
                                                onClick={() =>
                                                    deleteReply(item.uuid)
                                                }
                                                className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                                            >
                                                {deleting
                                                    ? "Deleting..."
                                                    : "Remove"}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const status = Number(c?.is_approved);
    const isOwnCommentFlag = isOwnComment;
    const canManage = canManageComment;

    // Guest users should only see approved comments
    if (!auth?.user && status !== 1) {
        return null;
    }

    return (
        <div className="comment-box py-3 flex justify-center items-center">
            <div className="w-full h-auto flex flex-col space-y-2">
                <div className="flex items-center space-x-2 w-full">
                    <div className="flex flex-shrink-0 self-start cursor-pointer">
                        <img
                            src={c?.user?.avatar_url || userphoto}
                            alt=""
                            className="h-10 w-10 object-fill rounded-full"
                        />
                    </div>

                    <div className="items-center w-full">
                        <div className="block">
                            <div className="w-auto rounded-[30px] px-2 ps-0 pb-2">
                                <div className="font-medium flex items-center justify-between flex-wrap gap-2">
                                    <a
                                        href="#"
                                        className="hover:underline text-sm"
                                    >
                                        <p className="text-base font-bold capitalize">
                                            {c?.user?.name || ""}
                                        </p>
                                    </a>
                                    {getStatusLabel(c) && status !== 1 && (
                                        <span
                                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusClass(c)}`}
                                        >
                                            {getStatusLabel(c)}
                                        </span>
                                    )}
                                </div>
                                <div className="text-small font-light text-gray-600 mt-1">
                                    {canViewComment(c)
                                        ? c?.comment || ""
                                        : "Comment awaiting approval"}
                                </div>
                            </div>
                            <div className="flex justify-start items-center text-xs w-full flex-wrap gap-2">
                                {auth?.user && (
                                    <button
                                        onClick={() => setHandleReply(true)}
                                        className="text-blue-600 hover:underline text-sm"
                                    >
                                        Reply
                                    </button>
                                )}
                                {auth?.user && (
                                    <span className="text-gray-400">•</span>
                                )}
                                <span className="text-gray-500 text-sm">
                                    <TimeFormat
                                        dateString={c?.created_at || ""}
                                    />
                                </span>

                                {/* Post Creator can manage others' comments - NOT their own */}
                                {canManage && status !== 1 && (
                                    <>
                                        <span className="text-gray-400">•</span>
                                        <button
                                            disabled={actionLoading}
                                            onClick={() =>
                                                sendCommentToAdmin(c.uuid)
                                            }
                                            className={`text-sm ${getActionButtonClass(c)} disabled:opacity-50`}
                                        >
                                            {actionLoading
                                                ? "Processing..."
                                                : getActionButtonLabel(c)}
                                        </button>
                                    </>
                                )}

                                {/* Delete button for Post Creator or Comment Owner (for their own comments) */}
                                {(isPostCreator || isOwnCommentFlag) && (
                                    <>
                                        <span className="text-gray-400">•</span>
                                        <button
                                            disabled={deleting}
                                            onClick={() =>
                                                deleteComment(c.uuid)
                                            }
                                            className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
                                        >
                                            {deleting
                                                ? "Deleting..."
                                                : "Remove"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Replies Section */}
                        {c.replies && c.replies.length > 0 && (
                            <div className="mt-3 pl-4 border-l-2 border-gray-200">
                                {c.replies
                                    .filter((reply) => {
                                        if (!auth?.user) {
                                            return (
                                                Number(reply.is_approved) === 1
                                            );
                                        }
                                        return true;
                                    })
                                    .map((item, index) => (
                                        <CommentReply
                                            key={item.uuid || index}
                                            item={item}
                                        />
                                    ))}
                            </div>
                        )}

                        {/* Reply Form */}
                        {auth?.user && handleReply && (
                            <AddComment
                                updateComments={updateComments}
                                is_reply={true}
                                update={updates}
                                comment_uuid={c?.uuid || ""}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
