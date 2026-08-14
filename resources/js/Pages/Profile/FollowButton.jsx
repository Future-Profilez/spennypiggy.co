
import { useState, useEffect } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { router, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";

const FollowButton = ({ targetUserId, isInitiallyFollowing, classes }) => {
    const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { auth } = usePage().props;

    const handleFollowToggle = () => {
        if (!auth?.user) {
            errorAlert("You must be logged in to follow.");
            return;
        }

        if (auth?.user?.id === targetUserId) {
            errorAlert("You cannot follow yourself.");
            return;
        }

        setLoading(true);

        router.post(
            route("user.follow.unfollow"),
            { user_id: targetUserId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFollowing((prev) => !prev); // Correctly toggles status
                },
                onError: (errors) => {
                    // errorAlert(errors?.flash?.error || "Something went wrong.");
                },
                onFinish: () => {
                    setLoading(false);
                },
            }
        );
    };

    return (
        <button onClick={handleFollowToggle} disabled={loading}
            className={
                classes
                    ? `${classes} ${isFollowing ? "bg-white text-black" : "bg-black text-white"}`
                    : `uppercase font-bold text-xs md:text-sm whitespace-nowrap rounded-box-sm border-[3px] border-black px-4 md:px-6 py-2 md:py-3 hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-60 ${isFollowing ? "bg-white text-black" : "bg-black text-white"}`
            } > {isFollowing ? "Following" : "Follow"}
        </button>
    );
};

export default FollowButton;
