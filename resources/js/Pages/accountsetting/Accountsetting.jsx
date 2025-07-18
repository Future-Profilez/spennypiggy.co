import React, { useEffect, useState } from "react";
import closeblacksm from "../../../assets/img/closeblacksm.png";
import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import axios from "axios";
import Popup from "@/Components/Popup";
import UpdateProfileInformation from "../Profile/Partials/UpdateProfileInformationForm";
import UpdatePasswordForm from "../Profile/Partials/UpdatePasswordForm";
import DeleteUserForm from "../Profile/Partials/DeleteUserForm";
import PaymentDashboard from "../stripe/PaymentDashboard";
import ChangeCurrency from "@/Components/ChangeCurrency";
import LinkTwitter from "../twitter/LinkTwitter";
import { useAlerts } from "@/Components/Alerts";
import ChangeVat from "../account/ChangeVat";
import DeleteStripeAccount from "../Profile/DeleteStripeAccount";
import SiteSubscription from "../Profile/SiteSubscription";
import TFA from "../Auth/TFA";
import AddressForm from "../rye/AddressForm";
import FollowersBulkNotification from "@/Components/FollowersBulkNotification";

export default function Accountsetting(props) {

    console.log('props', props);
    const { successAlert, errorAlert } = useAlerts();
    const { auth, user, global_currency, auto_tweet, pwa_notification_details, site_subscription } = props;
    console.log('pwa_notification_details',pwa_notification_details);
    const [showModal, setShowModal] = useState(false);

    const [emailEnabled, setSetEnabled] = useState(
        auth && auth.user && auth.user.notification_send == 1 ? true : false
    );
    const [showEarning, setShowEarning] = useState(
        auth && auth.user && auth.user.show_piggy_bank == 1 ? true : false
    );
    const swicthEarning = () => {
        setShowEarning(!showEarning);
        axios
            .get(`piggy-bank-setting`)
            .then((resp) => {
                successAlert(resp.data.message);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    const [passClose, setSassClose] = useState(null);
    const passwordUpdated = () => {
        setSassClose(false);
        setTimeout(() => {
            setSassClose();
        }, 100);
    };

    const updatevat = (e) => {
        setSassClose(false);
        setTimeout(() => {
            setSassClose();
        }, 100);
        setvatpercent(e);
    };

    const switchNotification = () => {
        setSetEnabled(!emailEnabled);
        axios
            .get(`notification-switch`)
            .then((resp) => {
                successAlert(resp.data.msg);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    const [vatpercent, setvatpercent] = useState(
        (auth && auth?.user?.vat_amount_percentage) || ""
    );

    return (
        <Authenticated user={user} auth={auth.user}>
            <Head title={"My Account"} />
            <div className="blackbg pt-4">
                <div className="accountsetting mx-auto border-3 !border-[var(--purple)] !border-black whbg shadow-pink overflow-hidden rounded-[40px] mb-4 mb-md-5">
                    <div className="p-4 pinkbg flex  !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center ">
                        <span className=" border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block"></span>
                        <span className=" border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block"></span>
                        <span className=" border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block"></span>
                    </div>
                    <div className="accsettingList !p-6">
                        <ul>
                            { auth && auth.user && auth?.user?.role == 1 && auth.user.stripe_details_submitted == 1 ? (
                                    <li>
                                        <PaymentDashboard
                                            classes="w-100 !bg-white !py-0 !mt-0 !text-black hover:!text-black"
                                            text={
                                                <>
                                                    PAYMENT DASHBOARD 
                                                    <span className="text-green-600 font-bold text-sm">
                                                        Linked
                                                    </span>
                                                </>
                                            }
                                        />
                                    </li>
                                ) : (
                                    ""
                                )
                            }

                        {auth && auth.user && auth?.user?.role == 1 ?  
                            <li>
                                <Popup
                                    space="4"
                                    modalclassName="pinkmodal"
                                    text={
                                        <>
                                            SPENNY PIGGY SUBSCRIPTION 
                                            <span className={`
                                                text-gray 
                                                uppercase
                                                ${site_subscription && site_subscription.status == "ACTIVE" || site_subscription.status == "FREE_TRIAL" ? "text-green-600" : "text-red-600"}
                                            `}>
                                                {site_subscription?.trial_status === "active" ? "Free Trial" : 
                                                <>
                                                {site_subscription && site_subscription.status || "Start"}
                                                </>}
                                            </span>
                                        </>
                                    }
                                >
                                    <h2 className="text-black font-gulfs text-xl mb-3">SPENNY PIGGY SUBSCRIPTION</h2>

                                    {site_subscription?.trial_status === "active" ? <>
                                            <h2>Subscription Status : <span className="text-green-600 font-bold text-lg uppercase">Free Trial</span></h2>
                                            <p className="text-lg my-2">Free Trial Start : <strong>{site_subscription?.trial_start ||''}</strong></p>
                                            <p className="text-lg my-2">Free Trial End In : <strong>{site_subscription?.trial_end_in ||''}</strong></p>
                                    </>
                                    : <>
                                        {site_subscription && site_subscription.status == "ACTIVE" ? <>
                                        <p className="text-lg my-2">Subscription Start On : <strong>{site_subscription?.subscription_start ||''}</strong></p>
                                        <p className="text-lg my-2">Subscription Renew On : <strong>{site_subscription?.subscription_renew_in ||''}</strong></p>
                                        <p className="text-lg my-2">Next Payment On : <strong>{site_subscription?.next_payment_date ||''}</strong></p>
                                        </> : ''}
                                    </> }


                                    {site_subscription && site_subscription.status == "EXPIRED" ? <>
                                        {site_subscription?.subscription_end ?
                                            <p className="text-lg text-red-600 my-2">Subscription expired on : <strong>{site_subscription?.subscription_end ||''}</strong></p>
                                            :
                                            <>
                                                {site_subscription?.trial_end_in ? 
                                                    <p className="text-lg my-2 text-red-600">Subscription Free trial ended {site_subscription?.trial_end_in||''}  </p>
                                                : ''}
                                            </>
                                        }
                                    </> : ''}

                                    {site_subscription && site_subscription.status == "INACTIVE" ?  
                                            <p className="text-lg my-2 text-blue-700">You don't have any active subscription</p>
                                     : ''}


                                    
                                </Popup>
                            </li> : 
                             ""}    

                            <li>
                                <Popup
                                    space="4"
                                    modalclassName="pinkmodal"
                                    text={
                                        <>
                                            EMAIL{" "}
                                            <span className="text-gray">
                                                {auth &&
                                                    auth.user &&
                                                    auth.user.email}
                                            </span>
                                        </>
                                    }
                                >
                                    <UpdateProfileInformation />
                                </Popup>
                            </li>
                            <li>
                                <Popup
                                    action={passClose}
                                    space="4"
                                    modalclassName="pinkmodal"
                                    text={<>PASSWORD</>}
                                >
                                    <UpdatePasswordForm
                                        passwordUpdate={passwordUpdated}
                                    />
                                </Popup>
                            </li>
                            <li>
                                <Popup
                                    action={passClose}
                                    space="4"
                                    modalclassName="pinkmodal"
                                    text={
                                        <>
                                            DISPLAY CURRENCY{" "}
                                            <span className="text-gray">
                                                {global_currency}
                                            </span>
                                        </>
                                    }
                                >
                                    <ChangeCurrency
                                        defaultvalue={global_currency}
                                    />
                                </Popup>
                            </li>

                            {auth && auth?.user?.role == 1 ? (
                                <>
                                    <li>
                                        <Popup
                                            size={"lg"}
                                            action={passClose}
                                            space="4"
                                            modalclassName="pinkmodal"
                                            text={"ADDRESS"}
                                        >
                                            <AddressForm
                                                isEditPopup={true}
                                                setSassClose={setSassClose}
                                            />
                                        </Popup>
                                    </li>
                                </>
                            ) : (
                                ""
                            )}

                            {auth && auth?.user?.role == 1 ? (
                                <>
                                    <li>
                                        <Popup
                                            action={passClose}
                                            space="4"
                                            modalclassName="pinkmodal"
                                            text={
                                                <>
                                                    VAT{" "}
                                                    <span className="text-gray">
                                                        {vatpercent || "0"}%
                                                    </span>
                                                </>
                                            }
                                        >
                                            <ChangeVat
                                                defaultvalue={vatpercent}
                                                updatevat={updatevat}
                                            />
                                        </Popup>
                                    </li>
                                </>
                            ) : (
                                ""
                            )}

                            {auth && auth?.user?.role == 1 ? (
                                <>
                                    <li>
                                        <Popup
                                            action={passClose}
                                            space="4"
                                            modalclassName="pinkmodal"
                                            text={
                                                <>
                                                    {auth &&
                                                    auth.user &&
                                                    auth.user.twitter_username
                                                        ? `AUTO TWEET`
                                                        : "SET UP AUTO TWEET"}
                                                    <div className="flex items-center">
                                                        <img
                                                            src={closeblacksm}
                                                            alt="img"
                                                            className="me-2 w-5 h-5"
                                                        />
                                                        {auth &&
                                                        auth.user &&
                                                        auth.user
                                                            .twitter_username
                                                            ? `@${auth.user.twitter_username}`
                                                            : ""}
                                                    </div>
                                                </>
                                            }
                                        >
                                            <LinkTwitter
                                                auto_tweet={auto_tweet}
                                                auth={auth}
                                                username={
                                                    (auth &&
                                                        auth.user &&
                                                        auth.user
                                                            .twitter_username) ||
                                                    false
                                                }
                                            />
                                        </Popup>
                                    </li>
                                </>
                            ) : (
                                ""
                            )}

                            <li>
                                <div className="notification uppercase">
                                    {" "}
                                    Receive e-mail notifications
                                    <label className="toggle-switch">
                                        <input
                                            id="notification_handle"
                                            checked={emailEnabled}
                                            type="checkbox"
                                            onChange={switchNotification}
                                        />
                                        <span
                                            for="notification_handle"
                                            className="slider"
                                        ></span>
                                    </label>
                                </div>
                            </li>

                            {auth && auth?.user?.role == 1 ? (
                                <>
                                    <li>
                                        <div className="notification uppercase">
                                            Show Piggy Bank Earnings
                                            <label className="toggle-switch">
                                                <input
                                                    id="showbankearning"
                                                    checked={showEarning}
                                                    type="checkbox"
                                                    onChange={swicthEarning}
                                                />
                                                <span
                                                    for="showbankearning"
                                                    className="slider"
                                                ></span>
                                            </label>
                                        </div>
                                    </li>
                                </>
                            ) : (
                                ""
                            )}

                            {auth && auth?.user?.role == 1 ? (
                                    <li>
                                        <FollowersBulkNotification pwa_notification_details={pwa_notification_details} />
                                    </li>
                            ) : (
                                ""
                            )}

                            <li>
                                <TFA />
                            </li>

                            <li>
                                <Popup
                                    space="4"
                                    modalclassName="pinkmodal"
                                    text={<>DELETE ACCOUNT </>}
                                >
                                    <DeleteUserForm />
                                </Popup>
                            </li>

                            {/* {auth && auth?.user?.stripe_details_submitted == 1 ?
                             <li>
                                <Popup space='4' modalclassName="pinkmodal"
                                text={<>DELETE STRIPE ACCOUNT  </>} >
                                    <DeleteStripeAccount />
                                </Popup >
                            </li>  : ''
                            } */}
                        </ul>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
