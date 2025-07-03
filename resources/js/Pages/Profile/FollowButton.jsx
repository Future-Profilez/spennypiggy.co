import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";

const FollowButton = ({ targetUserId, isInitiallyFollowing }) => {
    const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const handleFollowToggle = async () => {
        setLoading(true);
        try {
            const route = "/user-follow-unfollow";
            await axios
                .post(route, { user_id: targetUserId })
                .then((response) => {
                    setIsFollowing(!isFollowing);
                    if (response.data.status) {
                        successAlert(response.data.msg);
                    } else {
                        errorAlert(response.data.msg);
                    }
                });
            // if (isFollowing) {
            //     successAlert("Unfollowed successfully.");
            // } else {
            //     successAlert("Followed successfully.");
            // }
        } catch (error) {
            errorAlert(error);
            console.error("Follow/unfollow failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleFollowToggle}
            disabled={loading}
            className={`sm m-auto px-4 py-2 rounded-lg text-sm ${
                isFollowing
                    ? "btn-pink" // Pink for Unfollow
                    : "btn-pink bg-[#8c53fb] text-white hover:bg-[#6c53fb]" // Neon blue for Follow
            }`}
        >
            {loading
                ? isFollowing
                    ? "Unfollowing..."
                    : "Following..."
                : isFollowing
                ? "Unfollow"
                : "Follow"}
        </button>
    );
};

export default FollowButton;
