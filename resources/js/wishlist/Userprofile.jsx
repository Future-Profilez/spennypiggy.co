import React from "react";
import userphoto from "../../assets/img/userphoto.png";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { usePage } from '@inertiajs/react';
const EditProfile = React.lazy(() => import('@/Pages/account/EditProfile'));
const ShareProfile = React.lazy(() => import('./ShareProfile'));
const SendTip = React.lazy(() => import('@/Pages/TipJar/SendTip'));
import { RiVerifiedBadgeFill } from "react-icons/ri";

export default function Userprofile({ IsloggedIn }) {
    const { auth, user, global_currency, supporters }  = usePage().props;
    return (
        <div className="userprofilesec mb-4 ">
            <div className="userPr px-4 py-0 py-md-4 md:flex items-center justify-center md:justify-between mt-[-80px] md:mt-[-50px]" >
                <div className="update-profile text-center md:flex items-center justify-center md:justify-start" >
                    <div className="userphoto relative !flex md:!block items-center justify-center w-full md:w-auto ">
                        <LazyLoadImage
                        alt={"image"} useIntersectionObserver={true} effect="blur"
                        src={user && user.avatar_url ? user.avatar_url : userphoto}
                        height={150} width={150} className="rounded-full 
                        !h-[130px] !w-[130px] min-w-[130px] !min-h-[130px] !max-w-[130px] !max-h-[130px]
                        md:!h-[150px] md:!w-[150px] md:min-w-[150px] md:!min-h-[150px] md:!max-w-[150px] md:!max-h-[150px]
                        " />

                        {IsloggedIn && auth && auth?.user.avatar_url && auth?.user?.avatar_approved == 0 ?
                            <div className="absolute approvetag top-3 mx-auto">
                                <button className='tooltipbtn' >
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 15H11V9H9V15ZM10 7C10.2833 7 10.521 6.904 10.713 6.712C10.905 6.52 11.0007 6.28267 11 6C11 5.71667 10.904 5.47933 10.712 5.288C10.52 5.09667 10.2827 5.00067 10 5C9.71667 5 9.47933 5.096 9.288 5.288C9.09667 5.48 9.00067 5.71733 9 6C9 6.28333 9.096 6.521 9.288 6.713C9.48 6.905 9.71733 7.00067 10 7ZM10 20C8.61667 20 7.31667 19.7373 6.1 19.212C4.88333 18.6867 3.825 17.9743 2.925 17.075C2.025 16.175 1.31267 15.1167 0.788 13.9C0.263333 12.6833 0.000666667 11.3833 0 10C0 8.61667 0.262667 7.31667 0.788 6.1C1.31333 4.88333 2.02567 3.825 2.925 2.925C3.825 2.025 4.88333 1.31267 6.1 0.788C7.31667 0.263333 8.61667 0.000666667 10 0C11.3833 0 12.6833 0.262667 13.9 0.788C15.1167 1.31333 16.175 2.02567 17.075 2.925C17.975 3.825 18.6877 4.88333 19.213 6.1C19.7383 7.31667 20.0007 8.61667 20 10C20 11.3833 19.7373 12.6833 19.212 13.9C18.6867 15.1167 17.9743 16.175 17.075 17.075C16.175 17.975 15.1167 18.6877 13.9 19.213C12.6833 19.7383 11.3833 20.0007 10 20Z" fill="#FF8E25"/>
                                </svg>
                                <p>Profile avatar is waiting for approval. Currently only you can see this.</p></button>
                            </div>
                        : ""}

                    </div>
                    <div className="ps-3">
                        <h2 className="font-GillSans  flex items-center text-start  justify-center md:justify-start">{user && user.name}
                            {user && user.role == 1 && user.profile_status_lock == 2 ? <RiVerifiedBadgeFill  size={'1.7rem'} className="ms-2 text-mint" /> : ''}
                        </h2>
                        <div className="userId  mb-0 flex items-center text-start  justify-center md:justify-start">
                            <ShareProfile
                                username={user && user.name}
                                classes={"flex text-start "} >
                                @{user && user.username}
                                <div className="mt-1 ms-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="19" height="18" viewBox="0 0 19 18" fill="none" > <path d="M12.3284 13.2427L9.49998 16.0711C8.52182 17.0492 7.34307 17.5383 5.96374 17.5383C4.58441 17.5383 3.40614 17.0492 2.42892 16.0711C1.45075 15.0929 0.96167 13.9142 0.96167 12.5348C0.96167 11.1555 1.45075 9.97724 2.42892 9.00001L5.25734 6.17159L6.67156 7.5858L3.84313 10.4142C3.25387 11.0035 2.95925 11.7106 2.95925 12.5355C2.95925 13.3605 3.25387 14.0676 3.84313 14.6569C4.43239 15.2461 5.13949 15.5408 5.96445 15.5408C6.78941 15.5408 7.49651 15.2461 8.08577 14.6569L10.9142 11.8284L12.3284 13.2427ZM7.37866 12.5355L5.96445 11.1213L11.6213 5.46448L13.0355 6.87869L7.37866 12.5355ZM13.7426 11.8284L12.3284 10.4142L15.1568 7.5858C15.7461 6.99654 16.0407 6.28944 16.0407 5.46448C16.0407 4.63952 15.7461 3.93242 15.1568 3.34316C14.5676 2.7539 13.8605 2.45928 13.0355 2.45928C12.2106 2.45928 11.5035 2.7539 10.9142 3.34316L8.08577 6.17159L6.67156 4.75737L9.49998 1.92895C10.4781 0.950782 11.6569 0.4617 13.0362 0.4617C14.4156 0.4617 15.5938 0.950782 16.5711 1.92895C17.5492 2.90711 18.0383 4.08586 18.0383 5.46519C18.0383 6.84452 17.5492 8.02279 16.5711 9.00001L13.7426 11.8284Z" fill="#8981A2" /> </svg>
                                </div>
                            </ShareProfile>
                        </div>
                    </div>
                </div>
                {!IsloggedIn ? user && user.stripe_details_submitted == 1 &&
                    <div>
                        {user && user.role == 1 ?
                        <>
                            <SendTip  />
                            {user && user.role == 1 ? <p className="text-center text-mint" >🐷 {supporters} Supporters</p> : ''}
                        </> : ''}
                    </div>
                    :
                    <>
                    <div className="absolute top-4 right-6">
                    <EditProfile
                        user={user} classes={'!text-sm text-white pinkbg rounded-xl px-3 py-2'}
                        global_currency={global_currency}
                        />
                    </div>
                    {user && user.role == 1 ? <p className="text-center text-mint mt-2" >🐷 {supporters} Supporters</p> : ''}
                    </>
                || ''}

            </div>
        </div>
    );
}
