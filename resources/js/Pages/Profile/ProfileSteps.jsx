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
import TFA from "../Auth/TFA";

export default function ProfileSteps({ IsloggedIn,  sLinks }) {

    const { intro, user, global_currency, profile_steps } = usePage().props;
    const [profile, setProfile] = useState(profile_steps || null);

    const updateProfileSteps = ()=> {
        window.location.reload(false)
    }

    return (
        <>
            {profile && profile.total < 9 ? (
                <>
                    <style>{`
                        .check-icon.checked svg path {fill: #139700 !important;}
                    `}</style>
                    <div className="profileSteps bg-white border border-gray-400 rounded-5 mb-4  p-3 lg:!p-6" >
                        <h2 className="mb-1 text-[20px] font-bold ">Let’s get you started</h2>
                        <p className="text-gray-500 mb-3">Successful creators complete these steps, although not all required.</p>
                        <ProgressBar now={profile && profile.total} max={9} />

                        {/* {profile && profile.payment_connect !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${
                                    profile && profile.payment_connect == 1? "checked": ""}`}>
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
                        {intro !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        intro == 1
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
                                <AddIntro classes="pt-3"
                                    text="Add" uuid={user?.id || null} IsloggedIn={IsloggedIn}
                                />
                            </div>
                        </div> : ''}

                        {/* auto_tweets */}
                        {profile && profile.auto_tweets !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title  flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${profile && profile.auto_tweets == 1? "checked": ""}`}  >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">Enable Auto Tweets</h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Automatically tweet to your supporters when a wish is granted.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <Link href="/account?page=autotweet whitespace-nowrap">Enable </Link>
                            </div>
                        </div> : ''}



                        {/* basic_profile */}
                        {profile && profile.basic_profile !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${
                                        profile && profile.basic_profile == 1
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
                        {/* {profile && profile.social_links !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div
                                    className={`check-icon me-2 pt-1 ${ profile && profile.social_links == 1 ? "checked": "" }`} >
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
                        </div> : ''} */}

                        {/* post_required */}
                       {profile && profile.post_required !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${ profile && profile.post_required == 1 ? "checked" : "" }`} >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Write a Post
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                       Add something for your subscribers and supporters.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <AddPost text="Add Post" classes="editpoststep" />
                            </div>
                        </div> : ""}

                        {/* membership_required */}
                       {profile && profile.membership_required !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${ profile && profile.membership_required == 1 ? "checked" : "" }`} >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Add Memberships
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Add at least one membership option for your fans.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <AddMembership text="Add" classes="edit_membership_step" />
                            </div>
                        </div> : ""}

                        {/* bill_required */}
                       {profile && profile.bill_required !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${ profile && profile.bill_required == 1 ? "checked" : "" }`} >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Add Your Bills
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                       Add at least one billing option for your fans.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <AddBills text="Add Bill" classes="edit_bill_step" />
                            </div>
                        </div> : ""}

                        {/* vat_setting */}
                        {profile && profile.vat_setting !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${profile && profile.vat_setting == 1 ? "checked":""}`}
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


                        {/* vat_setting */}
                        {profile && profile.is_2fa !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${profile && profile.is_2fa == 1 ? "checked":""}`}
                                >
                                    <div dangerouslySetInnerHTML={{ __html: checkedItem }} />
                                </div>
                                <div>
                                    <h2 className="text-dark font-bold">
                                        Enable 2FA
                                    </h2>
                                    <p className="text-gray-500 text-[14px]">
                                        Enable 2FA for your account security.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <TFA text={<>
                                    <div className='text-center'>
                                        Enable
                                    </div>
                                </>} />
                            </div>
                        </div> : ''}

                        {profile && profile.shop !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${profile && profile.shop == 1 ? "checked":""}`} >
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
                        {/* {profile && profile.contents !== 1 ? <div className="profile-steps border border-gray-200 rounded-xl flex  items-center p-3 mt-3 justify-between">
                            <div className="step-title flex max-w-[390px] pe-3">
                                <div className={`check-icon me-2 pt-1 ${profile && profile.contents == 1 ? "checked": ""}`} >
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
                        </div> : ""} */}
                    </div>
                </>
            ) : (
                ""
            )}
        </>
    );
}
