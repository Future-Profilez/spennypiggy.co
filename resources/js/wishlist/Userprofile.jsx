import React from "react";
import userphoto from "../../assets/siteicon.png";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { usePage } from "@inertiajs/react";
const EditProfile = React.lazy(() => import("@/Pages/account/EditProfile"));
const ShareProfile = React.lazy(() => import("./ShareProfile"));
const SendTip = React.lazy(() => import("@/Pages/TipJar/SendTip"));
import { RiVerifiedBadgeFill } from "react-icons/ri";
import FollowButton from "@/Pages/Profile/FollowButton";
import { MdOutlineContentCopy } from "react-icons/md";

export default function Userprofile({ IsloggedIn }) {

    const { auth, user, global_currency, supporters, follow_status } = usePage().props;
    const opponantUser = auth?.opposite_user;

    return (
        <div className="userprofilesec mb-2 ">
            <div className="userPr px-4 py-0 py-md-4 lg:flex items-center justify-center lg:justify-between mt-[-80px] md:mt-[-50px]">
                <div className="update-profile text-center lg:flex items-center justify-center lg:justify-start">
                    <div className="userphoto relative !flex  items-center justify-center mb-4 ">
                        <LazyLoadImage fetchpriority="high"
                            alt={"image"}  effect="blur"
                            src={user && user.avatar_url? user.avatar_url: userphoto}
                            height={150} width={150}
                            className="rounded-full !border-3 !border-[var(--mint)]
                        !h-[130px] !w-[130px] min-w-[130px] !min-h-[130px] !max-w-[130px] !max-h-[130px]
                        md:!h-[150px] md:!w-[150px] md:min-w-[150px] md:!min-h-[150px] md:!max-w-[150px] md:!max-h-[150px]" />

                        {IsloggedIn && auth && auth?.user.avatar_url && auth?.user?.avatar_approved == 0 ? (
                            <div className="absolute approvetag top-3 mx-auto">
                                <button className="tooltipbtn">
                                    <svg
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M9 15H11V9H9V15ZM10 7C10.2833 7 10.521 6.904 10.713 6.712C10.905 6.52 11.0007 6.28267 11 6C11 5.71667 10.904 5.47933 10.712 5.288C10.52 5.09667 10.2827 5.00067 10 5C9.71667 5 9.47933 5.096 9.288 5.288C9.09667 5.48 9.00067 5.71733 9 6C9 6.28333 9.096 6.521 9.288 6.713C9.48 6.905 9.71733 7.00067 10 7ZM10 20C8.61667 20 7.31667 19.7373 6.1 19.212C4.88333 18.6867 3.825 17.9743 2.925 17.075C2.025 16.175 1.31267 15.1167 0.788 13.9C0.263333 12.6833 0.000666667 11.3833 0 10C0 8.61667 0.262667 7.31667 0.788 6.1C1.31333 4.88333 2.02567 3.825 2.925 2.925C3.825 2.025 4.88333 1.31267 6.1 0.788C7.31667 0.263333 8.61667 0.000666667 10 0C11.3833 0 12.6833 0.262667 13.9 0.788C15.1167 1.31333 16.175 2.02567 17.075 2.925C17.975 3.825 18.6877 4.88333 19.213 6.1C19.7383 7.31667 20.0007 8.61667 20 10C20 11.3833 19.7373 12.6833 19.212 13.9C18.6867 15.1167 17.9743 16.175 17.075 17.075C16.175 17.975 15.1167 18.6877 13.9 19.213C12.6833 19.7383 11.3833 20.0007 10 20Z"
                                            fill="#FF8E25"
                                        />
                                    </svg>
                                    <p>
                                        Profile avatar is waiting for approval.
                                        Currently only you can see this.
                                    </p>
                                </button>
                            </div>
                        ) : (
                            ""
                        )}
                    </div>
                    <div className="ps-3">
                        <h2 className="font-GillSans  flex   items-center  justify-center lg:justify-start text-center lg:text-left">
                            {user?.name}
                            {user?.role === 1 &&
                                user?.profile_status_lock === 2 && (
                                    <RiVerifiedBadgeFill
                                        size="1.5rem"
                                        className="ms-2 mt-[-2px] text-pink"
                                    />
                                )}
                        </h2>

                        <div className="userId mb-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start text-center lg:text-left gap-2">
                            <ShareProfile
                                username={user?.name}
                                classes="flex text-gray-300 mr-4 items-center"
                            >
                                @{user?.username}
                                <MdOutlineContentCopy className="ms-2  font-bold text-gray-300 mt-2"/>

                            </ShareProfile>


                        </div>
                    </div>
                </div>

                <div className="flex lg:block justify-center mt-4 lg:mt-0">
                    <div>
                        {user && user?.role == 1 ? (
                            <div className="flex mb-4 justify-center md:mb-2">
                                <p className="md:flex text-center font-poppins mt-1 text-white">
                                    <span className='!w-auto !h-auto block md:inline-block pe-1 '>
                                        {user?.followers_count}
                                    </span>
                                      Followers
                                </p>
                                <p className="md:flex text-center font-poppins mt-1 ms-3 text-white">
                                     <span className='!w-auto !h-auto block md:inline-block pe-1 ' >{user?.following_count}</span> Following
                                </p>
                                <p className="md:flex text-center font-poppins mt-1 ms-3 text-white">
                                    <span className='!w-auto !h-auto block md:inline-block pe-1 '>🐷 {supporters}</span> Supporters
                                </p>
                            </div>
                        ) : (
                            ""
                        )}
                        <div className="flex items-center justify-center mb-2">
                            <div className="">
                                <FollowButton targetUserId={opponantUser?.id} isInitiallyFollowing={follow_status} />
                            </div>
                            {!IsloggedIn
                                ? user &&
                                user.stripe_details_submitted == 1 && (
                                    <div>
                                        {user && user.role == 1 ? <SendTip /> : ''}
                                    </div>
                                )
                                : (
                                    <EditProfile
                                        user={user}
                                        classes={"uppercase text-sm btn-shadow font-gulfs rounded-full px-4 pt-[10px] pb-[7px] pinkbg text-white"}
                                        global_currency={global_currency}
                                    />
                            ) || ""}
                        </div>



                    </div>
                </div>

            </div>
        </div>
    );
}
