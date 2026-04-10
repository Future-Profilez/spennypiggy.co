import { lazy } from "react";
import userphoto from "../../assets/siteicon.png";
import { usePage } from "@inertiajs/react";
const EditProfile = lazy(() => import("@/Pages/account/EditProfile"));
const ShareProfile = lazy(() => import("./ShareProfile"));
const SendTip = lazy(() => import("@/Pages/TipJar/SendTip"));
import { RiVerifiedBadgeFill } from "react-icons/ri";
import FollowButton from "@/Pages/Profile/FollowButton";
import { MdOutlineContentCopy } from "react-icons/md";
import FounderBadge from "@/Components/FounderBadge";

export default function Userprofile({ IsloggedIn }) {
    const {
        auth,
        user,
        global_currency,
        supporters,
        follow_status,
        first30DayEarnings,
        card_capabilities,
    } = usePage().props;
    const opponantUser = auth?.opposite_user;
    
    return (
        <div className="userprofilesec mb-6 relative">
            <div className="userPr px-6 py-6 md:py-8 lg:flex items-center justify-center lg:justify-between mt-[-90px] md:mt-[-20px] relative z-auto mx-auto max-w-[95%] xl:max-w-none rounded-3xl">
                <div className="update-profile text-center lg:flex items-center justify-center lg:justify-start">
                    <div className="fading userphoto relative !flex items-center justify-center mb-4 lg:mb-0 !mt-[-60px] md:!mt-[-80px] lg:!mt-[-80px]">
                        <img
                            alt={`${user?.name || "User"} - Profile Avatar`}
                            src={IsloggedIn ? user?.avatar_url || userphoto : user?.avatar_url && user?.avatar_approved === 1 ? user?.avatar_url : userphoto}
                            height={150}
                            width={150}
                            loading="eager"
                            className="rounded-[30px] !border-[3px] !border-black bg-white !h-[120px] !w-[120px] min-w-[120px] !min-h-[120px] md:!h-[140px] md:!w-[140px] md:min-w-[140px] md:!min-h-[140px] object-cover shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        />

                        {/* Waiting for approval (ORANGE) */}
                        {IsloggedIn && auth && auth?.user?.avatar_url && auth?.user?.avatar_approved === 0 && (
                                <div className="absolute approvetag top-3 mx-auto">
                                    <button className="tooltipbtn">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            {" "}
                                            <path
                                                d="M9 15H11V9H9V15ZM10 7C10.2833 7 10.521 6.904 10.713 6.712C10.905 6.52 11.0007 6.28267 11 6C11 5.71667 10.904 5.47933 10.712 5.288C10.52 5.09667 10.2827 5.00067 10 5C9.71667 5 9.47933 5.096 9.288 5.288C9.09667 5.48 9.00067 5.71733 9 6C9 6.28333 9.096 6.521 9.288 6.713C9.48 6.905 9.71733 7.00067 10 7ZM10 20C8.61667 20 7.31667 19.7373 6.1 19.212C4.88333 18.6867 3.825 17.9743 2.925 17.075C2.025 16.175 1.31267 15.1167 0.788 13.9C0.263333 12.6833 0.000666667 11.3833 0 10C0 8.61667 0.262667 7.31667 0.788 6.1C1.31333 4.88333 2.02567 3.825 2.925 2.925C3.825 2.025 4.88333 1.31267 6.1 0.788C7.31667 0.263333 8.61667 0.000666667 10 0C11.3833 0 12.6833 0.262667 13.9 0.788C15.1167 1.31333 16.175 2.02567 17.075 2.925C17.975 3.825 18.6877 4.88333 19.213 6.1C19.7383 7.31667 20.0007 8.61667 20 10C20 11.3833 19.7373 12.6833 19.212 13.9C18.6867 15.1167 17.9743 16.175 17.075 17.075C16.175 17.975 15.1167 18.6877 13.9 19.213C12.6833 19.7383 11.3833 20.0007 10 20Z"
                                                fill="#FF8E25"
                                            />{" "}
                                        </svg>
                                        <p>
                                            Profile avatar is waiting for
                                            approval. Currently only you can see
                                            this.
                                        </p>
                                    </button>
                                </div>
                            )}

                        {/* Missing avatar (RED) */}
                        {IsloggedIn && auth && auth?.user?.avatar_approved === 2 && !auth?.user?.avatar_url && (
                                <div className="absolute mr-3 top-3">
                                    <button className="tooltipbtn">
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                                                fill="#E53935"
                                            />
                                        </svg>
                                        <p>
                                            Profile avatar is missing. Please
                                            upload an image to continue.
                                        </p>
                                    </button>
                                </div>
                            )}
                    </div>

                    <div className="ps-[20px] pt-[20px] lg:pt-[0px] lg:mt-0">
                        <h1 className="font-gulfs uppercase !text-2xl md:!text-2xl flex items-center justify-center lg:justify-start text-center lg:text-left !text-black">
                            {user?.name}
                            {(user?.role == 1 &&
                                user?.profile_status_lock == 2 && (
                                    <>
                                        {user?.is_founder ? (
                                            <div className="mb-1">
                                                <FounderBadge
                                                    classes="w-8 h-8 ml-3"
                                                    icon={true}
                                                />
                                            </div>
                                        ) : (
                                            <RiVerifiedBadgeFill
                                                size="2rem"
                                                className="ml-3 text-blue-600"
                                            />
                                        )}
                                    </>
                                )) ||
                                ""}
                        </h1>

                        <div className="userId mt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start text-center lg:text-left gap-2">
                            <ShareProfile
                                username={user?.name}
                                classes="flex text-black font-black text-normal transition-all mr-4 items-center"
                                custom={`${window.location.origin}/${user?.username}`} >
                                @{user?.username}
                                <MdOutlineContentCopy className="ml-2 font-black text-black" />
                            </ShareProfile>
                        </div>
                    </div>
                </div>

                <div className="flex lg:block justify-center mt-6 lg:mt-0">
                    <div>
                        {user && user?.role == 1 ? (
                            <div className="flex mb-4 justify-center md:mb-4 gap-2 md:gap-3">
                                <div className="md:flex items-center gap-3 text-center bg-yellow-300 border-[3px] border-black px-3 md:px-4 py-2 rounded-[15px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black block text-[22px] md:text-[16px] whitespace-nowrap">👥 {user?.followers_count}</span>
                                    <p className="font-black text-black text-[10px] md:text-sm uppercase">Followers</p>
                                </div>
                                <div className="md:flex items-center gap-3 text-center  bg-blue-100 border-[3px] border-black px-3 md:px-4 py-2 rounded-[15px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black block text-[22px] md:text-[16px] whitespace-nowrap">🤝 {user?.following_count}</span>
                                    <p className="font-black text-black text-[10px] md:text-sm uppercase">Following</p>
                                </div>
                                <div className="md:flex items-center gap-3 text-center bg-[#b892ff] border-[3px] border-black px-3 md:px-4 py-2 rounded-[15px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black block text-[22px] md:text-[16px] whitespace-nowrap">🐷 {supporters}</span>
                                    <p className="font-black text-black text-[10px] md:text-sm uppercase">Supporters</p>
                                </div>
                            </div>
                        ) : (
                            ""
                        )}
                        <div className="mt-4 flex items-center justify-center gap-3">
                            {!IsloggedIn ? (
                                <div className=""> 
                                    <FollowButton 
                                    targetUserId={opponantUser?.id} 
                                    isInitiallyFollowing={follow_status} />
                                </div>
                            ) : (
                                ""
                            )}
                            {!IsloggedIn ? user && user.stripe_details_submitted == 1 && (
                                      <div>
                                        {user && user.role == 1 ? 
                                            <SendTip card_capabilities={card_capabilities} />
                                        :  "" }
                                      </div>
                                  )
                                : (
                                    ''
                                ) || ""}

                                {/* <EditProfile
                                        user={user}
                                        classes={"bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase text-black font-black text-xs md:text-sm px-6 py-3 rounded-full tracking-widest"}
                                        global_currency={global_currency}
                                    /> 
                                */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
