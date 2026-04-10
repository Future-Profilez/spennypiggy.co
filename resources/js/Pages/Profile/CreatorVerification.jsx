import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import { useState, useEffect } from "react";
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

const CustomProgressBar = ({ now, max }) => {
    const percentage = Math.round((now / max) * 100);
    return (
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
            <div
                className="bg-pink-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
            ></div>
        </div>
    );
};

export default function CreatorVerification({ IsloggedIn, fetchingLinks }) {
    const { auth, user, global_currency, slinks } = usePage().props;
    const [status, setStatus] = useState();
    const [introStatus, setIntroStatus] = useState(status && status.intro);
    const [filledSteps, setFilledSteps] = useState(0);
    const hasAnySocialMedia =
        slinks &&
        Object.values(slinks).some((value) => value !== null && value !== "");
    const updateProfileSteps = () => {
        if (typeof window !== "undefined") {
            window.location.reload(false);
        }
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

    const error = (() => {
        try {
            return JSON.parse(auth?.user?.identity_verification_error);
        } catch {
            return null;
        }
    })();

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

            <div className="profileSteps bg-white border border-gray-400 rounded-[30px]   mb-4 p-3 lg:!p-6">
                <h2 className="mb-1 text-[20px] font-bold">
                    Profile Verification
                </h2>
                <p className="text-gray-500 mb-3">
                    Complete these steps and let your fans fund your lifestyle.
                </p>
                <CustomProgressBar now={filledSteps} max={6} />
                {IsloggedIn &&
                user?.profile_reject_reason != null &&
                user?.profile_status_lock == 0 ? (
                    <>
                        <div className="text-red-600 bg-red-50 border !border-red-500 p-3 rounded-[20px]   mt-3">
                            <strong className="text-red-800">
                                Profile Verification Rejected
                            </strong>
                            <p className="text-sm">
                                {user?.profile_reject_reason}
                            </p>
                        </div>
                        <Link
                            className="bg-[#fce100] mt-3 mb-4 block rounded-[30px]  px-3 py-2 text-sm text-center focus:opacity-[0.8]"
                            href="/update-profile-lock-status"
                        >
                            Submit Re-verification Request
                        </Link>
                    </>
                ) : (
                    ""
                )}

                {/* Step 1: Social Handles */}
                <div className="profile-steps border border-gray-200 rounded-[25px] p-4 mt-3">
                    <div className="md:flex items-center justify-between">
                        <div className="step-title flex max-w-[390px] pr-3">
                            <div
                                className={`check-icon mr-2 pt-1 ${
                                    slinks?.status == 1 ? "checked" : ""
                                }`}
                            >
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>

                            <div>
                                <h2 className="text-gray-900 font-bold">
                                    Add Social Handles
                                </h2>

                                <p className="text-gray-500 text-[14px]">
                                    Update at least one social media handle to
                                    help fans connect with you.
                                    {slinks?.status !== 1 && (
                                        <span className="text-pink text-[14px]">
                                            {" "}
                                            It must show an active account older
                                            than 6 months.
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {slinks?.status !== 1 && (
                            <Social
                                classes="bg-gray-200 my-2 rounded-xl px-2 py-2 w-full text-sm md:ms-[30px]"
                                links={slinks}
                            />
                        )}
                    </div>

                    {/* 🟡 UNDER REVIEW */}
                    {hasAnySocialMedia && slinks?.status == 0 && (
                        <div className="mt-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <p className="text-yellow-600 text-sm">
                                <strong>Verification Pending:</strong> Your social media handle is under review.
                            </p>
                        </div>
                    )}

                    {slinks?.status == 2 && (
                        <div className="mt-3 px-3 py-3 bg-red-50 border border-red-200 rounded-[18px]">
                            <p className="text-red-700 font-semibold text-sm">
                                Social Media Edit Request Rejected
                            </p>

                            {slinks?.reason && (
                                <p className="text-gray-600 text-sm mt-1">
                                    <span className="font-medium text-gray-700">
                                        Reason:
                                    </span>{" "}
                                    {slinks.reason}
                                </p>
                            )}

                            <p className="text-red-500 text-xs mt-2">
                                Please update your social links as per the
                                requested changes.
                            </p>
                        </div>
                    )}
                </div>

                {/* Step 2: Avatar */}
                {auth?.user?.avatar ? (
                    auth?.user?.avatar_approved == 0 ? (
                        <div className="profile-steps border border-gray-200 rounded-[25px]  flex items-center p-4 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div className={`check-icon mr-2 pt-1`}>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-gray-900 font-bold">
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
                        <div className="profile-steps border border-gray-200 rounded-[25px]  flex items-center p-4 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div className={`check-icon checked mr-2 pt-1`}>
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-gray-900 font-bold">
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
                    <div className="profile-steps border border-gray-200 rounded-[25px]  flex items-center p-4 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pr-3">
                            <div
                                className={`check-icon mr-2 pt-1 ${
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
                                <h2 className="text-gray-900 font-bold">
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

                {/* Step 3: Bio */}
                {auth?.user?.bio ? (
                    auth?.user?.bio_approved === 0 ? (
                        /* 🔄 UNDER REVIEW */
                        <div className="profile-steps border border-gray-200 rounded-[25px]  flex items-center p-4 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div className="check-icon mr-2 pt-1">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-gray-900 font-bold">
                                        Bio Approval Pending
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile bio is currently under
                                        review.
                                    </p>
                                </div>
                            </div>
                            <BsStopwatch color="#dd9100" size="28px" />
                        </div>
                    ) : auth?.user?.bio_approved === 1 ? (
                        /* ✅ APPROVED */
                        <div className="profile-steps border border-gray-200 rounded-[25px]  flex items-center p-4 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div className="check-icon checked mr-2 pt-1">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-gray-900 font-bold">
                                        Profile Bio Approved
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile bio has been approved.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* ❌ REJECTED */
                        <div className="profile-steps border border-red-200 rounded-[30px]  flex items-center p-4 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div className="check-icon mr-2 pt-1">
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: checkedItem,
                                        }}
                                    />
                                </div>
                                <div>
                                    <h2 className="text-red-600 font-bold">
                                        Bio Rejected
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Your profile bio was rejected. Please
                                        update and resubmit.
                                    </p>
                                </div>
                            </div>
                            <EditProfile
                                text="Edit Bio"
                                updateProfileSteps={updateProfileSteps}
                                user={user}
                                classes="updatebtn whitespace-nowrap text-pink"
                                global_currency={global_currency}
                            />
                        </div>
                    )
                ) : (
                    /* 📝 NO BIO */
                    <div className="profile-steps border border-gray-200 rounded-[25px]  flex items-center p-4 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pr-3">
                            <div className="check-icon mr-2 pt-1">
                                <div
                                    dangerouslySetInnerHTML={{
                                        __html: checkedItem,
                                    }}
                                />
                            </div>
                            <div>
                                <h2 className="text-gray-900 font-bold">
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

                {/* Step 4: Subscription */}
                <div className="profile-steps border border-gray-200 rounded-[25px]  flex items-center p-4 mt-3 justify-between">
                    <div className="step-title flex max-w-[390px] pr-3">
                        <div
                            className={`check-icon mr-2 pt-1 ${
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
                            <h2 className="text-gray-900 font-bold">
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

                    {auth?.user?.avatar_approved &&
                    auth?.user?.bio_approved &&
                    auth?.user?.is_subscribed == 0 &&
                    hasAnySocialMedia &&
                    slinks?.status == 1 ? (
                        <Link
                            className="bg-pink-500 my-2 text-center max-w-[130px] rounded-xl px-2 py-2 w-full text-sm md:ms-[30px] !text-white"
                            href="/activate-subscription"
                        >
                            Start for Free
                        </Link>
                    ) : (
                        <Link className="bg-gray-200 my-2 text-center max-w-[130px] rounded-xl px-2 py-2 w-full text-sm md:ms-[30px] disabled">
                            Start for Free
                        </Link>
                    )}
                </div>

                {/* Status Message */}
                {auth?.user?.is_subscribed == 1 &&
                auth?.user?.bio &&
                auth?.user?.avatar &&
                auth?.user?.profile_status_lock == 1 ? (
                    <div className="text-yellow-600 bg-yellow-50 border !border-yellow-500 p-3 rounded-[20px]   mt-3">
                        <strong className="text-yellow-800">
                            Profile Under Review
                        </strong>
                        <p className="text-sm">
                            🎉 You're almost done. Your profile is currently
                            under review. Please wait for the review to
                            complete.
                        </p>

                        {slinks?.status == 2 ? (
                            <p className="text-red-500 text-sm mt-2">
                                Social Media Handle Update Request : Rejected
                                due to {slinks?.reason ? slinks?.reason : ""}
                            </p>
                        ) : null}
                    </div>
                ) : (
                    ""
                )}

                {auth?.user?.profile_status_lock == 0 &&
                auth?.user?.profile_reject_reason ? (
                    <div className="text-red-600 bg-red-50 border !border-red-500 p-3 rounded-[20px]   mt-3">
                        <strong className="text-red-800">
                            Profile Verification Rejected
                        </strong>
                        <p className="text-sm capitalize">
                            {auth?.user?.profile_reject_reason}
                        </p>
                        <Link
                            href={route("update.profile.lock.status")}
                            method="get"
                        >
                            Submit For Re-Verification
                        </Link>
                    </div>
                ) : (
                    ""
                )}

                {auth?.user?.profile_status_lock == 2 ? (
                    <div className="text-green-700 bg-green-50 border !border-green-700 p-3 rounded-[20px]   mt-3">
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
                            <FaLock className="mr-2" /> Final setup requires
                            verification
                        </h2>
                    </div>
                )}
                <div>
                    <div className="profile-steps border border-gray-200 rounded-[25px]  p-4 mt-3 ">
                        <div className=" flex items-center justify-between ">
                            <div className="step-title flex max-w-[390px] pr-3">
                                <div
                                    className={`check-icon mr-2 pt-1 ${
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
                                    <h2 className="text-gray-900 font-bold">
                                        Identity Verification
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Secure your account and meet compliance
                                        requirements.
                                    </p>
                                </div>
                            </div>
                            <>
                                {auth?.user?.identity_status == 1 ? (
                                    <span className="text-green-600">
                                        Verified
                                    </span>
                                ) : auth?.user?.identity_status == 2 ? (
                                    <Link
                                        className={"text-pink"}
                                        href="/stripe/identity-verification"
                                    >
                                        Re-verify
                                    </Link>
                                ) : auth?.user?.profile_status_lock == 2 ? (
                                    <Link
                                        className={"text-pink"}
                                        href="/stripe/identity-verification"
                                    >
                                        Verify
                                    </Link>
                                ) : (
                                    <p className={"text-gray-400"}>Verify</p>
                                )}
                            </>
                        </div>

                        {/* {auth?.user?.identity_admin_status !== 2 && auth?.user?.identity_status == 1 && auth?.user?.identity_admin_status != 1 && (
                            <div className="mt-2 text-yellow-700 bg-yellow-50 px-3 py-2 rounded">
                                ⏳ Your documents has been submitted. Waiting for admin review. Please check again after 1-2 hrs.
                            </div>
                        )} */}

                        {auth?.user?.identity_verification_error && (
                            <div className="mt-3 mb-2 text-red-700 bg-red-100 p-3 rounded-[20px]   border border-red-200 text-start">
                                <p className="font-semibold mb-2">
                                    Why are you seeing this error?
                                </p>
                                <p className="text-sm">
                                    Your last attempt to complete identity
                                    verification was unsuccessful. Please review
                                    the details below and try again.
                                </p>
                            </div>
                        )}

                        {auth?.user?.identity_verification_error && (
                            <div className="text-red-700 bg-red-100 p-3 rounded-[20px]   border border-red-200 text-red-600 text-start flex flex-col gap-1 capitalize">
                                <p>
                                    Error:{" "}
                                    {error?.code?.replaceAll("_", " ") ||
                                        error?.code ||
                                        "Unknown Error Occurred"}
                                </p>
                                <p>Possible Reason: {error?.reason || "N/A"}</p>
                            </div>
                        )}

                        {/* {auth?.user?.identity_admin_status == 2 && (
                            <div className="mt-2">
                                {auth?.user?.identity_admin_notes && (
                                    <div className="mt-2 p-4 bg-red-100 text-red-800 rounded-[30px]   text-sm">
                                        <h2 className="mb-1 text-normal font-bold">Your Identity Is Rejected By Admin</h2>
                                        <p>Reason : {auth?.user?.identity_admin_notes}</p>
                                    </div>
                                )}
                            </div>
                        )} */}
                    </div>

                    <div className="profile-steps border border-gray-200 rounded-[25px]  flex items-center p-4 mt-3 justify-between">
                        <div className="step-title flex max-w-[390px] pr-3">
                            <div
                                className={`check-icon mr-2 pt-1 ${
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
                                <h2 className="text-gray-900 font-bold">
                                    Connect Stripe Account
                                </h2>
                                <p className="text-gray-500 text-[14px]">
                                    Finish setting up your account to receive
                                    funds. You have more steps to complete your
                                    payment setup.
                                </p>
                            </div>
                        </div>

                        {auth?.user?.stripe_details_submitted == 0 ||
                        auth?.user?.stripe_details_submitted == null ? (
                            <div>
                                {auth?.user?.identity_status == 1 ? (
                                    <Link
                                        className={"text-pink"}
                                        href="/stripe"
                                    >
                                        Connect
                                    </Link>
                                ) : (
                                    <p className={"text-gray-400"}>Connect</p>
                                )}
                            </div>
                        ) : (
                            ""
                        )}

                        {auth?.user?.stripe_details_submitted == 1 ? (
                            <div>
                                {" "}
                                <span className="text-green-600">
                                    Connected
                                </span>{" "}
                            </div>
                        ) : (
                            ""
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
