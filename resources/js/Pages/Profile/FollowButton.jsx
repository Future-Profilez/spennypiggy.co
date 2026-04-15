
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
            className={`uppercase text-[14px]  font-semibold  rounded-[18px] px-6 !py-[10px] me-3  border-[3px] 
                border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isFollowing ? "!bg-gray-300 " : "btn-shadow  bg-mint text-black"}`} > {isFollowing ? "Following" : "Follow"}
        </button>
    );
};

export default FollowButton;
