import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { ProgressBar } from "react-bootstrap";
import AddIntro from "../intros/AddIntro";
import EditProfile from "../account/EditProfile";
import AddPost from "../feed/AddPost";
import ChangeVat from "../account/ChangeVat";
import Popup from "@/Components/Popup";
import { checkedItem } from "@/includes/Icons";
import Social from "../Auth/Social";
import AddBills from "../bills/AddBills";
import AddMembership from "../membership/AddMembership";

export default function ProfileSteps({ IsloggedIn, fetchingLinks, sLinks }) {

    const { auth, user, global_currency } = usePage().props;
    const [status, setStatus] = useState();
    const fetch_goal = async (signal) => {
        axios
            .get(`/profile-steps-status`, { signal })
            .then((resp) => {
                setStatus(resp.data);
                setIntroStatus(resp && resp.data.intro);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        fetch_goal(signal);
    }, []);

    const [introStatus, setIntroStatus] = useState(status && status.intro);


    const updateProfileSteps = ()=> {
        window.location.reload(false)
    }

    return (
        <>
            {status && status.total < 9 ? (
                <>
                    <style>{`
                        .check-icon.checked svg path {fill: #139700 !important;}
                    `}</style>
                    <div className="profileSteps bg-white border border-gray-400 rounded-5 mb-4  p-3 lg:!p-6" >
                        <h2 className="mb-1 text-[20px] font-bold ">Let’s get you started</h2>
                        <p className="text-gray-500 mb-3">Successful creators complete these steps, although not all required.</p>
                        <ProgressBar now={status && status.total} max={9} />

                        {/* {status && status.payment_connect !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${
                                    status && status.payment_connect == 1? "checked": ""}`}>
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Complete KYC
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Complete your KYC verification to receive payments.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Link href="/start-kyc">Verify</Link>
                            </div>
                        </div> : ""} */}

                        {/* Intro Video */}
                        {introStatus !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        introStatus == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Add Intro Video
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Add a 15 - 30 sec intro video for your
                                        supporters.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <AddIntro setIntroStatus={setIntroStatus} classes="pt-3"
                                    text="Add" uuid={user?.id || null} IsloggedIn={IsloggedIn}
                                />
                            </div>
                        </div> : ''}

                        {/* auto_tweets */}
                        {status && status.auto_tweets !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title  d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        status && status.auto_tweets == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Enable Auto Tweets
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Enable auto tweets for your supporters when
                                        you get any wish granted.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Link href="/account?page=autotweet whitespace-nowrap">Enable </Link>
                            </div>
                        </div> : ''}
                        {/* basic_profile */}
                        {status && status.basic_profile !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        status && status.basic_profile == 1
                                            ? "checked"
                                            : ""
                                    }`}
                                >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Complete Basic Profile
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Add a profile picture and bio.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <EditProfile updateProfileSteps={updateProfileSteps}
                                    user={user}
                                    classes="updatebtn"
                                    global_currency={global_currency}
                                />
                            </div>
                        </div> : ''}


                        {/* social_links */}
                        {status && status.social_links !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${ status && status.social_links == 1 ? "checked": "" }`} >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">Add social links</h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Add a selection of social links.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Social updatedLinks={fetchingLinks}links={sLinks}/>
                            </div>
                        </div> : ''}

                        {/* post_required */}
                       {/* {status && status.post_required !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${ status && status.post_required == 1 ? "checked" : "" }`} >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Post Required
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        You must add 1 post for subscribers, 1
                                        for memberships and 1 for supporters.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <AddPost text="Add Post" classes="editpoststep" />
                            </div>
                        </div> : ""} */}

                        {/* membership_required */}
                       {status && status.membership_required !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${ status && status.membership_required == 1 ? "checked" : "" }`} >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Membership Required
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        You must add 1 membership for your fans.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <AddMembership text="Add Membership" classes="edit_membership_step" />
                            </div>
                        </div> : ""}

                        {/* bill_required */}
                       {status && status.bill_required !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${ status && status.bill_required == 1 ? "checked" : "" }`} >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Bill Required
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        You must add 1 bill for your fan.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <AddBills text="Add Bill" classes="edit_bill_step" />
                            </div>
                        </div> : ""}

                        {/* vat_setting */}
                        {status && status.vat_setting !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${status && status.vat_setting == 1 ? "checked":""}`}
                                >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        VAT settings
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Add vat percentage.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Link href="/account">Add VAT</Link>
                            </div>
                        </div> : ''}

                        {status && status.shop !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${status && status.shop == 1 ? "checked":""}`} >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Shop Items
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Add digital goods to fund your lifestyle.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Link href="/shop">Add Digital Goods</Link>
                            </div>
                        </div> : ''}

                        {/* content */}
                        {status && status.contents !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl d-flex  items-center p-3 mt-3 justify-content-between">
                            <div className="step-title d-flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${status && status.contents == 1 ? "checked": ""}`} >
                                   <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Add wish bills and memberships
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Additional ways to fund your lifestyle.
                                    </p>
                                </div>
                            </div>
                        </div> : ""}
                    </div>
                </>
            ) : (
                ""
            )}
        </>
    );
}
