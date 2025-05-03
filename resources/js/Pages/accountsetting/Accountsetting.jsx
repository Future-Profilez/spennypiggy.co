import React, { useEffect, useState } from 'react';
import closeblacksm from '../../../assets/img/closeblacksm.png';
import { Head, Link } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import axios from 'axios';
import Popup from '@/Components/Popup';
import UpdateProfileInformation from '../Profile/Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from '../Profile/Partials/UpdatePasswordForm';
import DeleteUserForm from '../Profile/Partials/DeleteUserForm';
import PaymentDashboard from '../stripe/PaymentDashboard';
import ChangeCurrency from '@/Components/ChangeCurrency';
import LinkTwitter from '../twitter/LinkTwitter';
import { useAlerts } from '@/Components/Alerts';
import ChangeVat from '../account/ChangeVat';
import DeleteStripeAccount from '../Profile/DeleteStripeAccount';
import SiteSubscription from '../Profile/SiteSubscription';
import TFA from '../Auth/TFA';
import AddressForm from '../rye/AddressForm';

export default function Accountsetting(props) {
    const { successAlert, errorAlert } = useAlerts();
    const {auth, user, global_currency, auto_tweet} = props;

    const [emailEnabled, setSetEnabled] = useState(auth && auth.user && auth.user.notification_send == 1 ? true : false )
    const [showEarning, setShowEarning] = useState(auth && auth.user && auth.user.show_piggy_bank == 1 ? true : false );
    const swicthEarning  = () =>{
        setShowEarning(!showEarning);
        axios.get(`piggy-bank-setting`).then((resp) => {
            successAlert(resp.data.message);
        }).catch((_err) => {
            console.error("error", _err);
        });
    }

    const [passClose, setSassClose] = useState(null);
    const passwordUpdated = () => {
        setSassClose(false);
        setTimeout(() => {
            setSassClose();
        }, 100);
    }

    const updatevat = (e) => {
        setSassClose(false);
        setTimeout(() => {
            setSassClose();
        }, 100);
        setvatpercent(e)
    }

    const switchNotification  = () =>{
        setSetEnabled(!emailEnabled);
        axios.get(`notification-switch`).then((resp) => {
            successAlert(resp.data.msg);
        }).catch((_err) => {
            console.error("error", _err);
        });
    }


    const [vatpercent, setvatpercent] = useState(auth && auth?.user?.vat_amount_percentage|| '')

    return (
        <Authenticated user={user}  auth={auth.user} >
            <Head title={"My Account"} />
            <div className='blackbg py-2 pb-md-5'>
                <div className='accountsetting mx-auto border-mint whbg shadow-mint rounded-3xl mb-4 mb-md-5'>
                    <div className='loginheadbox pinkbg'>
                        <span className='mintbg'></span>
                        <span className='bluebg'></span>
                    </div>
                    <div className='accsettingList p-4'>
                        <ul>
                            {auth && auth?.user?.role == 1 ?
                                <>
                                {auth.user && auth.user.monthly_charge_enabled ?
                                    <li>
                                        {auth && auth.user && auth.user.stripe_details_submitted == 1 ?
                                            <PaymentDashboard classes='w-100 text-black rounded-3  border-0 paymentbutton' text={<>PAYMENT DASHBOARD <span className='text-mint text-sm'>Linked</span></>} />
                                            :
                                            <Link href={route("stripe")} >LINK STRIPE <span className='text-voilet'>Link</span></Link>
                                        }
                                    </li>
                                 :
                                    <li>
                                        <Link href={'/stripe-subscription'} >Activate Subscription  <span className='text-voilet'>Activate</span></Link>
                                    </li>
                                  }
                                </>
                            : ''}

                            <li>
                                <Popup space='4' modalclassName="pinkmodal"
                                text={<>EMAIL <span className='text-gray'>{auth && auth.user && auth.user.email}</span></>} >
                                    <UpdateProfileInformation />
                                </Popup >
                            </li>
                            <li>
                                <Popup action={passClose} space='4' modalclassName="pinkmodal" text={<>PASSWORD</>} >
                                    <UpdatePasswordForm passwordUpdate={passwordUpdated} />
                                </Popup>
                            </li>
                            <li>
                                <Popup action={passClose} space='4' modalclassName="pinkmodal" text={<>DISPLAY CURRENCY <span className='text-gray'>{global_currency}</span></>} >
                                    <ChangeCurrency defaultvalue={global_currency} />
                                </Popup>
                            </li>

                            {auth && auth?.user?.role == 1 ?
                                <>
                                    <li>
                                        <Popup size={"lg"} action={passClose} space='4' modalclassName="pinkmodal" text={"ADDRESS"} >
                                            <AddressForm isEditPopup={true} setSassClose={setSassClose}/>
                                        </Popup>
                                    </li>
                                </>
                            : ''}

                            {auth && auth?.user?.role == 1 ?
                                <>
                                <li>
                                    <Popup action={passClose} space='4' modalclassName="pinkmodal" text={<>VAT <span className='text-gray'>{vatpercent || "0"}%</span></>} >
                                        <ChangeVat defaultvalue={vatpercent} updatevat={updatevat} />
                                    </Popup>
                                </li>
                                </>
                            : ''}

                            {auth && auth?.user?.role == 1 ?
                                <>
                                    <li>
                                        <Popup action={passClose} space='4' modalclassName="pinkmodal"
                                        text={
                                        <>
                                            { auth && auth.user && auth.user.twitter_username ? `AUTO TWEET` : 'SET UP AUTO TWEET'}
                                            <div className='d-flex items-center' >
                                                <img src={closeblacksm} alt="img" className='me-2 w-5 h-5' />
                                                { auth && auth.user && auth.user.twitter_username ? `@${auth.user.twitter_username}` : ''}
                                            </div>
                                        </> } >
                                            <LinkTwitter auto_tweet={auto_tweet}
                                            auth={auth}
                                            username={auth && auth.user && auth.user.twitter_username || false}  />
                                        </Popup>
                                    </li>
                                </>
                            : ''}

                            <li>
                                <div className='notification uppercase'> Receive e-mail notifications
                                    <label className="toggle-switch">
                                        <input id='notification_handle' checked={emailEnabled}
                                         type="checkbox" onChange={switchNotification}  />
                                        <span for='notification_handle' className="slider"></span>
                                    </label>
                                </div>
                            </li>

                            {auth && auth?.user?.role == 1 ?
                                <>
                            <li>
                                <div className='notification uppercase'>
                                Show Piggy Bank Earnings
                                    <label className="toggle-switch">
                                        <input id='showbankearning' checked={showEarning}
                                         type="checkbox" onChange={swicthEarning}  />
                                        <span for='showbankearning' className="slider"></span>
                                    </label>
                                </div>
                            </li>
                            </>
                            : ''}

                            {/* <li>
                                <TFA text={<>
                                    <div className='notification uppercase'>
                                        TWO FACTOR AUTHENTICATION
                                    </div>
                                </>} />
                            </li> */}

                            <li>
                                <Popup space='4' modalclassName="pinkmodal"
                                text={<>DELETE ACCOUNT  </>} >
                                    <DeleteUserForm />
                                </Popup >
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
    )
}
