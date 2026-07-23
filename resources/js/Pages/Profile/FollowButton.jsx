
import { useState, useEffect } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { router, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";

const FollowButton = ({ targetUserId, isInitiallyFollowing }) => {
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
            className={`text-[14px] font-semibold rounded-full px-6 py-2.5 ring-1 transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 ${isFollowing ? "bg-white/5 text-slate-300 ring-white/10" : "bg-white/10 text-white ring-white/20 hover:bg-white/15"}`} > {isFollowing ? "Following" : "Follow"}
        </button>
    );
};

export default FollowButton;
