import { lazy } from "react";
import userphoto from "../../assets/siteicon.png";
import { usePage } from "@inertiajs/react";
const EditProfile = lazy(() => import("@/Pages/account/EditProfile"));
const SendTip = lazy(() => import("@/Pages/TipJar/SendTip"));
import { RiVerifiedBadgeFill, RiHeartLine } from "react-icons/ri";
import FollowButton from "@/Pages/Profile/FollowButton";
import { MdOutlineContentCopy } from "react-icons/md";
import FounderBadge from "@/Components/FounderBadge";
import wishlistbannerimg from "../../assets/img/wishlistbannerimg.jpg";

export default function Userprofile({ IsloggedIn }) {
    const {
        auth,
        user,
        global_currency,
        supporters,
        follow_status,
    } = usePage().props;
    const opponantUser = auth?.opposite_user;
    const coverSrc = IsloggedIn
        ? user?.cover_url || wishlistbannerimg
        : user?.cover_approved === 1
            ? user?.cover_url
            : wishlistbannerimg;
    
    return (
        <div className="relative w-full bg-[#0B0C10]">
            <div className="relative w-screen left-1/2 -translate-x-1/2 h-[350px] sm:h-[300px] md:h-[350px] lg:h-[400px] overflow-hidden">
                <img src={coverSrc}
                    alt={`${user?.name || "User"} cover`} className="w-full !h-full banner object-cover"
                />
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-[#0007]" />
                    {/* <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/55" /> */}
                    {/* <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]" /> */}
                </div>

                {/* <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/25 to-[#0B0C10]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/55" />
                    <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.55)]" />
                </div> */}

                <div className="absolute inset-x-0 top-0 ">
                    <div className="containerbox mx-auto">
                        <div className="p-6 ">
                                <div className="flex items-center gap-4">
                                    <div className="flex justify-center md:justify-start">
                                        <div className="w-24 h-24 md:w-28 md:h-28 rounded-[30px] !border-3 border-[#F94F97] bg-white  overflow-hidden shadow-[0_0_20px_rgba(249,79,151,0.3)]">
                                            <img
                                                alt={`${user?.name || "User"} - Profile Avatar`}
                                                src={
                                                    IsloggedIn
                                                        ? user?.avatar_url || userphoto
                                                        : user?.avatar_url && user?.avatar_approved === 1
                                                            ? user?.avatar_url
                                                            : userphoto
                                                }
                                                className="w-full !h-full object-cover rounded-xl"
                                            />
                                        </div>
                                    </div>
                                    <div className="min-w-0 text-center md:text-left">
                                        <h1 className="text-white text-xl md:text-2xl font-gulfs uppercase leading-[0.9] tracking-wide drop-shadow-[0_14px_40px_rgba(0,0,0,0.70)]">
                                            {user?.name || "User"}
                                        </h1>

                                        <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-3 ">
                                            <button type="button" className="inline-flex items-center gap-2 text-white font-bold tracking-widest text-lg"
                                                onClick={() => {
                                                    const handle = `@${user?.username || ""}`.trim();
                                                    if (!handle || handle === "@") return;
                                                    navigator?.clipboard?.writeText(handle);
                                                }} >
                                                <span className=""> @{user?.username || "thor"} </span>
                                                <MdOutlineContentCopy className="w-4 h-4 text-white/35" />
                                            </button>

                                            {user?.role == 1 && user?.profile_status_lock == 2 && (
                                                user?.is_founder ? (
                                                    <FounderBadge classes="w-6 h-6" icon={true} />
                                                ) : (
                                                    <RiVerifiedBadgeFill className="w-6 h-6 text-[#05EFB8]" />
                                                )
                                            )}
                                        </div>

                                    </div>
                                </div>

                                <div className="mt-6 font-poppins flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black leading-none">
                                            {user?.followers_count || 0}
                                        </span>
                                        <span className="text-[17px] capitalize  text-white">
                                            Followers
                                        </span>
                                    </div>
                                    <span className="text-white/35 hidden sm:inline">•</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black leading-none">
                                            {user?.following_count || 0}
                                        </span>
                                        <span className="text-[17px] capitalize  text-white">
                                            Following
                                        </span>
                                    </div>
                                    <span className="text-white/35 hidden sm:inline">•</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-black leading-none">
                                            {supporters || 0}
                                        </span>
                                        <span className="text-[17px] capitalize  text-white">
                                            Supporters
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center  mt-6  gap-3">
                                    {!IsloggedIn ? (
                                        <>
                                            <FollowButton
                                                targetUserId={opponantUser?.id}
                                                isInitiallyFollowing={follow_status}
                                                classes="relative inline-flex items-center gap-4 bg-black text-white font-black text-[11px] md:text-sm py-3 px-7 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.25)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden !border-none"
                                            />
                                            {user && user.stripe_details_submitted == 1 && user.role == 1 && (
                                                <SendTip classes="relative font-gulfs tracking-widest inline-flex items-center gap-4 bg-pink-500 text-black font-black text-sm md:text-sm py-2 px-4 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.25)] hover:scale-105 hover:-rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden !border-none" />
                                            )}
                                        </>
                                    ) : (
                                        <EditProfile
                                            user={user}
                                            classes="relative inline-flex items-center gap-4 bg-white text-black font-black text-[11px] md:text-sm py-3 px-7 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.25)] hover:scale-105 hover:-rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden !border-none"
                                            global_currency={global_currency}
                                        />
                                    )}
                                </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
