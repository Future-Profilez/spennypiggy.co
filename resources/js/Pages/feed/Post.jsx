import { useState, Fragment } from "react";
import { likes, comment } from "../../includes/Icons";
import { TimeFormat } from "@/includes/TimeFormat";
import supportorsimg from "../../../assets/img/supportors-img.png";
import subscriberimg from "../../../assets/img/subscribers-img.png";
import membershipimg from "../../../assets/img/membership-img.png";
import PostLike from "./PostLike";
import CommentList from "./CommetsLists";
import { Menu, Transition } from "@headlessui/react";
import AddPost from "./AddPost";
import { Link, usePage } from "@inertiajs/react";
import userphoto from "../../../assets/siteicon.png";
import RemovePost from "./RemovePost";
import { LazyLoadImage } from "react-lazy-load-image-component";

// One label per audience, used for the single badge on the card. There used to be two
// badges rendering the same information in opposite corners of every image.
const AUDIENCE_LABELS = {
    public: "Shoutout",
    membership: "Members Only",
    subscription: "Subscribers Only",
    support: "Supporters Only",
};

const LOCK_COPY = {
    membership: {
        label: "Members only",
        cta: "See membership tiers",
        page: "memberships",
    },
    subscription: {
        label: "Subscribers only",
        cta: "See subscriptions",
        page: "bills",
    },
    support: {
        label: "Supporters only",
        cta: "Support this creator",
        page: "wishes",
    },
};

export default function Post({ item }) {
    const { auth, user } = usePage().props;
    // NOTE: this is "am I the author", not "am I signed in" — the name is kept because
    // several callers pass it through.
    const [IsloggedIn] = useState(
        (auth && auth.user && auth.user.username) == (user && user.username),
    );

    const creatorUsername = item?.user?.username || user?.username;
    const isLocked =
        !IsloggedIn && item?.is_lock !== 0 && item?.for_module !== "public";

    function posturl() {
        if (item && item?.for_module == "public") {
            return item.image_url || false;
        }
        // Check if user is the post owner OR post is accessible
        if (IsloggedIn || (item && item.is_lock === 0)) {
            return item.image_url;
        } else {
            // Show locked placeholder based on post type
            if (item && item.for_module == "membership") {
                return membershipimg;
            }
            if (item && item.for_module == "subscription") {
                return subscriberimg;
            }
            if (item && item.for_module == "support") {
                return supportorsimg;
            }
            // Default fallback for posts without specific module
            return item.image_url;
        }
    }

    const [lcount, setlcount] = useState(item?.likes_count || 0);
    const [ccount, setccount] = useState(item?.comments_count || 0);
    const updateComments = () => setccount((c) => c + 1);
    const updatecount = (next) => setlcount(next);
    const [showComments, setShowComments] = useState(false);
    const [editing, setEditing] = useState(false);

    const audienceLabel = AUDIENCE_LABELS[item?.for_module] || "";
    const lock = LOCK_COPY[item?.for_module];
    const hasImage = !!posturl();

    return (
        <>
            <div className=" post-wrap bg-[#fdfbf7] rounded-box p-[15px] xl:p-6 !mb-4 md:!mb-[22px] border-[3px] border-black   hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        {/* Leading slash matters: without it the href resolved relative to the
                  current path, so from any nested page the author link 404'd. */}
                        <Link
                            href={`/${creatorUsername || ""}`}
                            className="headerpost mb-0 head w-auto"
                        >
                            <img
                                alt={`${item?.user?.name || user?.name || "Creator"} avatar`}
                                className=" author-img border-[3px] border-black rounded-full "
                                src={
                                    item?.user?.avatar_url ||
                                    user?.avatar_url ||
                                    userphoto
                                }
                            />
                            <div>
                                <p className="authors text-black font-black !capitalize tracking-wider">
                                    {" "}
                                    <b>
                                        {" "}
                                        {item?.user?.name ||
                                            user?.name ||
                                            "SPENNY PIGGY"}{" "}
                                    </b>{" "}
                                </p>
                                {/* created_at, not updated_at — an edit made an old post read "2 minutes ago". */}
                                <p className="authors text-gray-700 font-bold text-sm">
                                    {" "}
                                    <TimeFormat
                                        dateString={
                                            item?.created_at ||
                                            item?.updated_at ||
                                            ""
                                        }
                                    />{" "}
                                </p>
                            </div>
                        </Link>
                    </div>

                    {IsloggedIn ? (
                        <Menu
                            as="div"
                            className="relative inline-block text-left"
                        >
                            <div>
                                <Menu.Button className="edit-post pr-0 bg-transparent border-0 p-0 flex items-center">
                                    <div className="dots">
                                        <span className="bg-gray-900"></span>
                                        <span className="bg-gray-900"></span>
                                        <span className="bg-gray-900"></span>
                                    </div>
                                </Menu.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-box bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                // Opens the edit modal via state,
                                                // rendered OUTSIDE this menu — a
                                                // modal nested in the dropdown
                                                // unmounted the moment the menu
                                                // closed, so editing did nothing.
                                                <button
                                                    type="button"
                                                    onClick={() => setEditing(true)}
                                                    className={`${active ? "bg-gray-100" : ""} group flex w-full items-center rounded-box-sm px-4 py-2 text-left text-sm`}
                                                >
                                                    Edit Post
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <div
                                                    className={`${active ? "bg-gray-100" : ""} group flex w-full items-center rounded-box-sm text-sm`}
                                                >
                                                    <RemovePost
                                                        classes={`px-4 py-2 text-left w-full`}
                                                        uuid={item.uuid}
                                                        text="Remove Post"
                                                    />
                                                </div>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    ) : (
                        ""
                    )}
                </div>

                {/* Edit modal lives here, outside the dropdown, so closing the
                    menu does not tear it down before it can open. */}
                {editing && (
                    <AddPost
                        title="Edit Post"
                        item={item}
                        isEdit={true}
                        open={editing}
                        onClose={() => setEditing(false)}
                    />
                )}

                {IsloggedIn && item && item.approved == 0 ? (
                    <div className="bg-yellow-50 text-yellow-800 p-3 text-sm rounded-box-sm mb-3 border !border-yellow-500 flex items-start gap-2">
                        <span aria-hidden="true">⏳</span>
                        <span>
                            <strong>Waiting for approval.</strong> Only you can
                            see this post for now — it usually goes live within
                            24 hours, and it counts towards your activity once
                            approved.
                        </span>
                    </div>
                ) : (
                    ""
                )}

                {hasImage ? (
                    <div className=" post-images lazywrap relative w-full border-[3px] border-black rounded-box-sm overflow-hidden">
                        {/* One audience badge, not two. */}
                        {audienceLabel ? (
                            <span className="bg-[#A2E4B8] border-[3px] border-black  font-black absolute z-10 py-2 px-4 top-3 right-3 uppercase text-xs text-black rounded-box-sm">
                                {audienceLabel}
                            </span>
                        ) : null}

                        <LazyLoadImage
                            effect="blur"
                            width="400"
                            height="400"
                            alt={item?.title || "Post image"}
                            className="post-img w-full max-h-[400px] object-cover"
                            src={posturl()}
                        />

                        {item.ai_generated == 1 ? (
                            <div className="absolute bottom-3 left-3 z-10 bg-black shadow-sm rounded-box-sm px-2 py-1 text-[8px] text-white">
                                MADE WITH AI{" "}
                            </div>
                        ) : (
                            ""
                        )}
                    </div>
                ) : audienceLabel ? (
                    // A text-only post still needs to say who can see it.
                    <span className="inline-block bg-[#A2E4B8] border-[3px] border-black  font-black py-1.5 px-3 uppercase text-xs text-black rounded-box-sm">
                        {audienceLabel}
                    </span>
                ) : null}

                <div>
                    {item?.title ? (
                        <p className="fading description text-black font-black text-lg mt-4 mb-2 pr-5 uppercase tracking-wide">
                            <b>{item.title}</b>
                        </p>
                    ) : null}
                    {item?.content ? (
                        <p className="fading description text-gray-800 font-bold whitespace-pre-line mt-2">
                            {item.content}
                        </p>
                    ) : null}
                </div>

                {/* A locked post used to be a dead placeholder image with no way to act on it —
            the supporter saw "members only" and had nowhere to go. */}
                {isLocked && lock && creatorUsername ? (
                    <Link
                        href={`/${creatorUsername}?page=${lock.page}`}
                        className="mt-4 flex items-center justify-center gap-2 w-full min-h-[44px] bg-[#FF007F] text-white font-black uppercase tracking-wide text-sm border-[3px] border-black rounded-box-sm px-4 py-3  active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    >
                        🔒 {lock.cta}
                    </Link>
                ) : null}

                <div className="interactions flex items-center mt-4 ">
                    <PostLike
                        is_liked={item.liked}
                        likes_count={item?.likes_count || 0}
                        updatecount={updatecount}
                        text={likes}
                        post_uuid={item.uuid}
                    />
                    <button
                        type="button"
                        aria-expanded={showComments}
                        aria-label={
                            showComments ? "Hide comments" : "Show comments"
                        }
                        className="relative bg-transparent border-0 p-0 ml-4 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => setShowComments(!showComments)}
                    >
                        <div dangerouslySetInnerHTML={{ __html: comment }} />
                        {item.pending_items_count > 0 && (
                            <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white border-2 border-white animate-pulse">
                                {item.pending_items_count}
                            </span>
                        )}
                    </button>
                </div>

                {/* These were duplicate `id="like-number"` elements — one id repeated on every
            post on the page. */}
                <div className="flex mt-3">
                    <p className="fading like-count text-black mr-4 font-black uppercase text-sm border-[3px] border-black bg-[#A2E4B8] px-3 py-1 rounded-box-sm ">
                        <b>
                            {lcount || 0} {lcount === 1 ? "like" : "likes"}
                        </b>
                    </p>
                    <p className="fading like-count text-black font-black uppercase text-sm border-[3px] border-black bg-[#b892ff] px-3 py-1 rounded-box-sm ">
                        <b>
                            {ccount || 0}{" "}
                            {ccount === 1 ? "Comment" : "Comments"}
                        </b>
                    </p>
                </div>

                {showComments ? (
                    <CommentList
                        updateComments={updateComments}
                        post_uuid={item.uuid}
                    />
                ) : (
                    ""
                )}
            </div>
        </>
    );
}
