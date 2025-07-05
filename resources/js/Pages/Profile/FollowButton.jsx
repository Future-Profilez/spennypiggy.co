import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { router, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";

const FollowButton = ({ targetUserId, isInitiallyFollowing }) => {
    const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { auth } = usePage().props;

    const handleFollowToggle = async () => {
        if(auth?.user ==  null){
            toast.error("You must have to login first.");
            return false;
        }
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
            className={`uppercase text-sm font-gulfs btn-shadow rounded-full px-4 pt-[10px] pb-[7px] me-3 ${
                isFollowing? "!bg-gray-300" : "bg-whites bg-voilet text-white"  }`}
        >
            {loading ? isFollowing? "Unfollowing...": "Following...": isFollowing? "Following": "Follow"}
        </button>
    );
};

export default FollowButton;
