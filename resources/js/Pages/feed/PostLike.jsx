import { useState, useRef } from "react";
import axios from "axios";
import { usePage } from "@inertiajs/react";
import { toast } from "react-hot-toast";

export default function PostLike({
    text,
    post_uuid,
    is_liked,
    likes_count,
    updatecount,
}) {
    const [liked, setliked] = useState(!!is_liked);
    const [likecount, setlikecount] = useState(likes_count || 0);
    const inFlight = useRef(false);
    const { auth } = usePage().props;

    const postlike = () => {
        // `auth && auth.user == undefined || null` parsed as `(auth && ...) || null`, so a
        // page with no auth prop at all fell through to the request instead of prompting login.
        if (!auth?.user) {
            toast.error("You must log in first.");
            return;
        }

        // Guard against double-taps racing each other — without it the optimistic count
        // drifted away from the real one and never recovered.
        if (inFlight.current) return;
        inFlight.current = true;

        const previous = { liked, count: likecount };
        const optimistic = !liked;

        setliked(optimistic);
        const optimisticCount = Math.max(0, likecount + (optimistic ? 1 : -1));
        setlikecount(optimisticCount);
        updatecount?.(optimisticCount);

        axios
            .post(`/post/like/${post_uuid}`)
            .then((resp) => {
                setliked(!!resp.data.liked);
                // Trust the server's count so concurrent likes from other people show up too.
                const count =
                    typeof resp.data.likes_count === "number"
                        ? resp.data.likes_count
                        : optimisticCount;
                setlikecount(count);
                updatecount?.(count);
            })
            .catch(() => {
                // Roll back to whatever the state actually was, not blindly to "unliked".
                setliked(previous.liked);
                setlikecount(previous.count);
                updatecount?.(previous.count);
                toast.error("Couldn't update your like. Please try again.");
            })
            .finally(() => {
                inFlight.current = false;
            });
    };

    return (
        <button
            type="button"
            onClick={postlike}
            aria-pressed={liked}
            aria-label={liked ? "Unlike this post" : "Like this post"}
            className={`likebtn bg-transparent border-0 p-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${liked ? "liked" : "unliked"}`}
            dangerouslySetInnerHTML={{ __html: text }}
        />
    );
}
