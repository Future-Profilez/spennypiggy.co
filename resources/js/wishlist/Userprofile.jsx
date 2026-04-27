import { lazy, useState } from "react";
import userphoto from "../../assets/siteicon.png";
import { usePage } from "@inertiajs/react";
const EditProfile = lazy(() => import("@/Pages/account/EditProfile"));
const ShareProfile = lazy(() => import("./ShareProfile"));
const SendTip = lazy(() => import("@/Pages/TipJar/SendTip"));
import { RiVerifiedBadgeFill } from "react-icons/ri";
import FollowButton from "@/Pages/Profile/FollowButton";
import { MdOutlineContentCopy } from "react-icons/md";
import FounderBadge from "@/Components/FounderBadge";
import { UserX, ShieldAlert, Ban, Info } from "lucide-react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import Popup from "@/Components/Popup";
import FeatureSuggestionBanner from "@/Components/FeatureSuggestionBanner";
import FeatureSuggestionModal from "@/Components/FeatureSuggestionModal";

export default function Userprofile({ IsloggedIn }) {
    const {
        auth,
        user,
        global_currency,
        supporters,
        follow_status,
        first30DayEarnings,
        card_capabilities,
        is_blocked: initialIsBlocked,
    } = usePage().props;
    const { successAlert, errorAlert } = useAlerts();
    const opponantUser = auth?.opposite_user;
    const [showBlockConfirm, setShowBlockConfirm] = useState(false);
    const [isBlocked, setIsBlocked] = useState(initialIsBlocked);
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);

    const blockUser = async () => {
        try {
            await axios.post(route('creator.security.block-user'), { user_id: user.id });
            successAlert(`${user?.name} has been blocked.`);
            setIsBlocked(true);
            setShowBlockConfirm(false);
            // Optionally redirect or refresh
            // window.location.reload();
        } catch (error) {
            errorAlert(error.response?.data?.message || 'Failed to block user');
        }
    };

    const unblockUser = async () => {
        try {
            await axios.delete(route('creator.security.unblock-user', { id: user.id }));
            successAlert(`${user?.name} has been unblocked.`);
            setIsBlocked(false);
        } catch (error) {
            errorAlert(error.response?.data?.message || 'Failed to unblock user');
        }
    };
    
    return (
        <div className="userprofilesec mb-6 relative">
            <div className="userPr  py-6 md:py-8 lg:flex items-center justify-center lg:justify-between mt-[-90px] md:mt-[-20px] relative z-auto mx-auto max-w-[100%] xl:max-w-none rounded-3xl"> 
                <div className="update-profile text-center lg:flex items-center justify-center lg:justify-start">
                    <div className="fading userphoto relative !flex items-center justify-center mb-4 lg:mb-0 !mt-[-60px] md:!mt-[-80px] lg:!mt-[0px]">
                        <img
                            alt={`${user?.name || "User"} - Profile Avatar`}
                            src={IsloggedIn ? user?.avatar_url || userphoto : user?.avatar_url && user?.avatar_approved === 1 ? user?.avatar_url : userphoto}
                            height={150}
                            width={150}
                            loading="eager"
                            className="rounded-[30px] !border-[3px] !border-black bg-white !h-[120px] !w-[120px] min-w-[120px] !min-h-[120px] md:!h-[140px] md:!w-[140px] md:min-w-[140px] md:!min-h-[140px] object-cover shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        />

                        {/* Waiting for approval (ORANGE) */}
                        {IsloggedIn && auth && auth?.user?.avatar && auth?.user?.avatar_approved === 0 && (
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

                    <div className="md:ps-[20px] md:pe-[20px] pt-[20px] lg:pt-[0px] lg:mt-0">
                        <h1 className="font-gulfs uppercase !text-2xl md:!text-2xl inline-flex items-center justify-center lg:justify-start  text-center lg:text-left !text-black ">
                            <p  className="line-clamp-1">{user?.name} </p>
                            {(user?.role == 1 &&
                                user?.profile_status_lock == 2 && (
                                    <span className="ms-2">
                                        {user?.is_founder ? (
                                                <FounderBadge
                                                    classes="min-w-8 min-h-8 w-8 h-8 ml-2"
                                                    icon={true}
                                                />
                                        ) : (
                                            <RiVerifiedBadgeFill
                                                className=" min-w-8 min-h-8 w-8 h-8 text-[#1d3ef8]"
                                            />
                                        )}
                                    </span>
                                )) ||
                                ""}
                        </h1>

                        <div className="userId mt- flex flex-col sm:flex-row items-center justify-center lg:justify-start text-center lg:text-left gap-2">
                            <ShareProfile
                                username={user?.name}
                                classes="flex text-gray-800 font-black text-normal transition-all mr-4 items-center"
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
                                <div className="md:flex items-center gap-2 text-center bg-yellow-300 border-[3px] border-black px-3 md:px-4 py-2 rounded-[15px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black block text-[22px] md:text-[16px] whitespace-nowrap">👥 {user?.followers_count}</span>
                                    <p className="font-black text-black text-[10px] md:text-sm uppercase">Followers</p>
                                </div>
                                <div className="md:flex items-center gap-2 text-center  bg-blue-100 border-[3px] border-black px-3 md:px-4 py-2 rounded-[15px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black block text-[22px] md:text-[16px] whitespace-nowrap">🤝 {user?.following_count}</span>
                                    <p className="font-black text-black text-[10px] md:text-sm uppercase">Following</p>
                                </div>
                                <div className="md:flex items-center gap-2 text-center bg-[#b892ff] border-[3px] border-black px-3 md:px-4 py-2 rounded-[15px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <span className="font-black block text-[22px] md:text-[16px] whitespace-nowrap">🐷 {supporters}</span>
                                    <p className="font-black text-black text-[10px] md:text-sm uppercase">Supporters</p>
                                </div>
                            </div>
                        ) : (
                            ""
                        )}
                        <div className="mt-4 flex items-center justify-center lg:justify-end gap-1">
                            
                            {IsloggedIn ?
                                <>
                                    <EditProfile 
                                        profilepage={1}
                                        user={user}
                                        classes={"bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all uppercase text-black font-black text-xs md:text-sm px-6 py-3 rounded-[18px]  tracking-widest"}
                                        global_currency={global_currency}
                                    /> 
                                </>
                                :
                                <>
                                    {!IsloggedIn ? (
                                        <div className="flex gap-1"> 
                                            <FollowButton 
                                            targetUserId={opponantUser?.id} 
                                            isInitiallyFollowing={follow_status} />
                                            
                                            {auth?.user?.role == 1 && (
                                                isBlocked ? (
                                                    <button 
                                                        onClick={unblockUser}
                                                        className="bg-green-600 border-[3px] me-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-3 rounded-[18px] text-white"
                                                        title="Unblock User"
                                                    >
                                                        <UserX size={20} strokeWidth={2.5} className="rotate-180" />
                                                    </button>
                                                ) : (
                                                    <Popup 
                                                        modalclass="pinkmodal"
                                                        size="md"
                                                        space="6"
                                                        classes="bg-red-600 border-[3px] me-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-3 rounded-[18px] text-white"
                                                        text={<UserX size={20} strokeWidth={2.5} />}
                                                        action={showBlockConfirm}
                                                        onHide={() => setShowBlockConfirm(false)}
                                                    >
                                                        <div className="text-center">
                                                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                                                                <Ban size={40} className="text-red-600" />
                                                            </div>
                                                            <h2 className="text-2xl font-gulfs mb-4 uppercase">Block {user?.name}?</h2>
                                                            <div className="bg-gray-50 border-2 border-black rounded-[20px] p-4 text-left space-y-3 mb-6">
                                                                <div className="flex gap-3">
                                                                    <ShieldAlert size={20} className="text-red-600 shrink-0" />
                                                                    <p className="text-sm font-bold">They will no longer be able to view your profile or content.</p>
                                                                </div>
                                                                <div className="flex gap-3">
                                                                    <Ban size={20} className="text-red-600 shrink-0" />
                                                                    <p className="text-sm font-bold">They will be blocked from sending you any gifts, tips, or messages.</p>
                                                                </div>
                                                                <div className="flex gap-3">
                                                                    <Info size={20} className="text-blue-600 shrink-0" />
                                                                    <p className="text-sm font-bold text-gray-500">They won't be notified that you blocked them.</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-4">
                                                                <button 
                                                                    onClick={() => setShowBlockConfirm(false)}
                                                                    className="flex-1 bg-white border-2 border-black py-3 rounded-xl font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
                                                                >
                                                                    Cancel
                                                                </button>
                                                                <button 
                                                                    onClick={blockUser}
                                                                    className="flex-1 bg-red-600 text-white border-2 border-black py-3 rounded-xl font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all"
                                                                >
                                                                    Block User
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </Popup>
                                                )
                                            )}
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
                                </>
                            }
                            

                                
                               
                        </div>
                    </div>
                </div>
            </div>
            
            {IsloggedIn && (
                <div className="mt-8">
                    <FeatureSuggestionBanner 
                        onSuggestClick={() => setShowSuggestionModal(true)} 
                    />
                </div>
            )}

            <FeatureSuggestionModal 
                show={showSuggestionModal} 
                onClose={() => setShowSuggestionModal(false)} 
                auth={auth} 
            />
        </div>
    );
}
