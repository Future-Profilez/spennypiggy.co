import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { ProgressBar, Collapse } from "react-bootstrap";
import AddIntro from "../intros/AddIntro";
import EditProfile from "../account/EditProfile";
import AddPost from "../feed/AddPost";
import ChangeVat from "../account/ChangeVat";
import Popup from "@/Components/Popup";
import { checkedItem } from "@/includes/Icons";
import Social from "../Auth/Social";
import AddBills from "../bills/AddBills";
import AddMembership from "../membership/AddMembership";
import ActivateSubscription from "./ActivateSubscription";
import SiteSubscription from "./SiteSubscription";
import { BsStopwatch } from "react-icons/bs";
import { FaLock } from "react-icons/fa";
import { empty } from "@apollo/client";

export default function CreatorVerification({ IsloggedIn, fetchingLinks }) {
    const { auth, user, global_currency, slinks } = usePage().props;
    const [status, setStatus] = useState();
    const [introStatus, setIntroStatus] = useState(status && status.intro);
    const [filledSteps, setFilledSteps] = useState(0);

    const hasAnySocialMedia =
        slinks &&
        Object.values(slinks).some((value) => value !== null && value !== "");

    const updateProfileSteps = () => {
        window.location.reload(false);
    };

    useEffect(() => {
        let steps = 0;
        if (auth?.user?.bio && auth?.user?.bio_approved == 1) steps += 1;
        if (auth?.user?.avatar && auth?.user?.avatar_approved == 1) steps += 1;
        if (auth?.user?.is_subscribed == 1) steps += 1;
        if (auth?.user?.identity_status == 1) steps += 1;
        if (auth?.user?.stripe_details_submitted == 1) steps += 1;
        if (hasAnySocialMedia) steps += 1;
        setFilledSteps(steps);
    }, []);

    return (
        <>
            <style>{`
                .check-icon.checked svg path { fill: #139700 !important; }
                .locked-section {
                    background-color: #f9f9f9;
                    border: 1px dashed #bbb;
                    padding: 20px;
                    border-radius: 12px;
                    position: relative;
                }
                .locked-overlay {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    display: flex;
                    align-items: center;
                    color: #555;
                }
            `}</style>

            <div className="profileSteps bg-white border border-gray-400 rounded-5 mb-4 p-3 lg:!p-6">
                <h2 className="mb-1 text-[20px] font-bold">
                    Profile Verification
                </h2>
                <p className="text-gray-500 mb-3">
                    Complete these steps and let your fans fund your lifestyle.
                </p>
                <ProgressBar now={filledSteps} max={6} />

                {IsloggedIn && user?.profile_reject_reason != null &&
                user?.profile_status_lock == 0 ?
                    <>
                        <div className="text-red-600 bg-red-50 border !border-red-500 p-3 rounded-lg mt-3">
                            <strong className="text-red-800">
                                Profile Verification Rejected
                            </strong>
                            <p className="text-sm">{user?.profile_reject_reason}</p>
                        </div>
                        <Link  className="bg-[#fce100] mt-3 mb-4 block rounded-xl px-3 py-2 text-sm text-center focus:opacity-[0.8]"
                        href="/update-profile-lock-status" >
                            Submit Re-verification Request
                        </Link>
                    </>
                 : (
                    ""
                )}

                {/* Step 1: Subscription */}
                <div className="profile-steps border border-gray-200 rounded-xl flex items-center p-3 mt-3 justify-between">
                    <div className="step-title flex max-w-[390px] pe-3">
                        <div
                            className={`check-icon me-2 pt-1 ${
                                auth?.user?.is_subscribed == 1 ? "checked" : ""
                            }`}
                        >
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: checkedItem,
                                }}
                            />
                        </div>
                        <div>
                            <h2 className="text-dark font-bold">
                                Start 3-Days Free Trial
                            </h2>
                            <p className="text-gray-500 text-[14px]">
                                Unlock full access with a{" "}
                                <strong className="text-black">
                                    Free Trial
                                </strong>{" "}
                                subscription of £4/month. No charges until the
                                trial period ends.
                            </p>
                        </div>
                    </div>
                    {auth?.user?.is_subscribed !== 1 && (
                        <Link
                            className="text-pink"
                            href="/activate-subscription"
                        >
                            Start Free
                        </Link>
                    )}
                </div>

                {/* Step 2: Social Handles */}
                <div className="profile-steps border border-gray-200 rounded-xl flex items-center p-3 mt-3 justify-between">
                    <div className="step-title flex max-w-[390px] pe-3">
                        <div
                            className={`check-icon me-2 pt-1 ${
                                hasAnySocialMedia ? "checked" : ""
                            }`}
                        >
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: checkedItem,
                                }}
                            />
                        </div>
                        <div>
                            <h2 className="text-dark font-bold">
                                Add Social Handles
                            </h2>
                            <p className="text-gray-500 text-[14px]">
                                Update at least one social media handle to help
                                fans connect with you.
                            </p>
                        </div>
                    </div>
                    {!hasAnySocialMedia && <Social links={slinks} />}
                </div>

                {/* Step 3: Avatar */}
                {auth?.user?.avatar ? (
                    auth?.user?.avatar_approved == 0 ? (
                        <div className="profile-steps border border-gray-200 rounded-xl flex items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1`}>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Avatar Approval Pending
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile picture is currently under
                                        review.
                                    </p>
                                </div>
                            </div>
                            <BsStopwatch color="#dd9100" size={"28px"} />
                        </div>
                    ) : (
                        <div className="profile-steps border border-gray-200 rounded-xl flex items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon checked me-2 pt-1`}>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Profile Avatar Approved
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile picture has been approved.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="profile-steps border border-gray-200 rounded-xl flex items-center p-3 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pe-3">
                            <div
                                className={`check-icon me-2 pt-1 ${
                                    auth?.user?.avatar_approved == 1
                                        ? "checked"
                                        : ""
                                }`}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-dark font-bold">
                                    Update Profile Picture
                                </h2>
                                <p className="text-gray-500 text-[14px]">
                                    Add a profile picture. This is required.
                                </p>
                            </div>
                        </div>
                        <EditProfile
                            text="Update Avatar"
                            updateProfileSteps={updateProfileSteps}
                            user={user}
                            classes="updatebtn whitespace-nowrap text-pink"
                            global_currency={global_currency}
                        />
                    </div>
                )}

                {/* Step 4: Bio */}
                {auth?.user?.bio ? (
                    auth?.user?.bio_approved == 0 ? (
                        <div className="profile-steps border border-gray-200 rounded-xl flex items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1`}>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Bio Approval Pending
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile bio is currently under
                                        review.
                                    </p>
                                </div>
                            </div>
                            <BsStopwatch color="#dd9100" size={"28px"} />
                        </div>
                    ) : (
                        <div className="profile-steps border border-gray-200 rounded-xl flex items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon checked me-2 pt-1`}>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Profile Bio Approved
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile bio has been approved.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="profile-steps border border-gray-200 rounded-xl flex items-center p-3 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pe-3">
                            <div
                                className={`check-icon me-2 pt-1 ${
                                    auth?.user?.bio_approved == 1
                                        ? "checked"
                                        : ""
                                }`}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-dark font-bold">
                                    Update Profile Bio
                                </h2>
                                <p className="text-gray-500 text-[14px]">
                                    Add a short bio to complete your profile.
                                </p>
                            </div>
                        </div>
                        <EditProfile
                            text="Update Bio"
                            updateProfileSteps={updateProfileSteps}
                            user={user}
                            classes="updatebtn whitespace-nowrap text-pink"
                            global_currency={global_currency}
                        />
                    </div>
                )}

                {/* Status Message */}
                {auth?.user?.is_subscribed == 1 &&
                auth?.user?.bio &&
                auth?.user?.avatar &&
                auth?.user?.profile_status_lock == 1 ? (
                    <div className="text-yellow-600 bg-yellow-50 border !border-yellow-500 p-3 rounded-lg mt-3">
                        <strong className="text-yellow-800">
                            Profile Under Review
                        </strong>
                        <p className="text-sm">
                            🎉 You're almost done. Your profile is currently
                            under review. Please wait for the review to
                            complete.
                        </p>
                    </div>
                ) : (
                    ""
                )}

                {auth?.user?.profile_status_lock == 2 ? (
                    <div className="text-green-700 bg-green-50 border !border-green-700 p-3 rounded-lg mt-3">
                        <strong className="text-green-700">
                            Profile Verification Completed
                        </strong>
                        <p className="mt-1">
                            🎉 Congratulations! Your profile is now verified.
                            You can proceed with final setup.
                        </p>
                    </div>
                ) : (
                    ""
                )}

                {auth?.user?.profile_status_lock == 2 ? (
                    ""
                ) : (
                    <div className="mt-6 relative">
                        <h2 className="flex">
                            <FaLock className="me-2" /> Final setup requires
                            verification
                        </h2>
                    </div>
                )}
                <div>
                    <div className="profile-steps border border-gray-200 rounded-xl flex items-center p-3 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pe-3">
                            <div
                                className={`check-icon me-2 pt-1 ${
                                    auth?.user?.identity_status == 1
                                        ? "checked"
                                        : ""
                                }`}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-dark font-bold">
                                    Identity Verification
                                </h2>
                                <p className="text-gray-500 text-[14px]">
                                    Secure your account and meet compliance
                                    requirements.
                                </p>
                            </div>
                        </div>
                        <div>
                            {auth?.user?.identity_status == 1 ?
                                <span className="text-green-600">Verified</span>
                            :
                            <>
                                {auth?.user?.profile_status_lock == 2 ?
                                <Link className={"text-pink"} href="/stripe">Verify</Link>
                                : <p className={"text-gray-400"}  >Verify</p> }
                            </>
                            }
                        </div>
                     </div>

                    <div className="profile-steps border border-gray-200 rounded-xl flex items-center p-3 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pe-3">
                            <div
                                className={`check-icon me-2 pt-1 ${
                                    auth?.user?.stripe_details_submitted == 1
                                        ? "checked"
                                        : ""
                                }`}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-dark font-bold">
                                    Connect Stripe Account
                                </h2>
                                <p className="text-gray-500 text-[14px]">
                                    Finish setting up your account to receive
                                    funds. You have more steps to complete your
                                    payment setup.
                                </p>
                            </div>
                        </div>
                        {auth?.user?.stripe_details_submitted == 0 || auth?.user?.stripe_details_submitted == null ?
                           <div>
                            { auth?.user?.profile_status_lock == 2 ?
                            <Link className={"text-pink"} href="/stripe">Connect</Link>
                             :
                             <p className={"text-gray-400"}  >Connect</p>
                            }
                           </div> :
                            ''
                        }
                        {auth?.user?.stripe_details_submitted == 1 ?
                           <div> <span className="text-green-600">Connected</span> </div> :
                            ''
                        }
                     </div>
                  </div>
            </div>
        </>
    );
}
