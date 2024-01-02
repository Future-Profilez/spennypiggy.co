import React, { useEffect, useState } from 'react';
import closeblacksm from '../../../assets/img/closeblacksm.png';
import { Head, Link } from '@inertiajs/react';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import Popup from '@/Components/Popup';
import UpdateProfileInformation from '../Profile/Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from '../Profile/Partials/UpdatePasswordForm';
import DeleteUserForm from '../Profile/Partials/DeleteUserForm';
import PaymentDashboard from '../stripe/PaymentDashboard';
import ChangeCurrency from '@/Components/ChangeCurrency';
import LinkTwitter from '../twitter/LinkTwitter';

export default function Accountsetting(props) {

    const {auth, user, global_currency, auto_tweet} = props;
    const [passClose, setSassClose] = useState(null);
    console.log("is_linked",props)

    const passwordUpdated = () => { 
        setSassClose(false);
        setTimeout(() => {
            setSassClose();
        }, 100);
    }

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
                            <li>{auth && auth.user && auth.user.stripe_details_submitted == 1 ? 
                               <PaymentDashboard classes='w-100 text-dark paymentbutton' text={<>PAYMENT DASHBOARD <span className='text-mint'>Connected</span></>} />
                            : 
                                <Link href={route("stripe")} >PAYMENT DASHBOARD <span className='text-voilet'>Connect Stripe</span></Link>
                            }
                            </li>

                            <li>
                                <Popup space='4' modalclassName="pinkmodal" 
                                text={<>Email <span className='text-gray'>{auth && auth.user && auth.user.email}</span></>} >
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
 
                            <li>
                                <Popup action={passClose} space='4' modalclassName="pinkmodal" 
                                text={
                                <>
                                    { auth && auth.user && auth.user.twitter_username ? `AUTO TWEET` : 'SET UP AUTO TWEET'}
                                    <div className='d-flex' >
                                    <img src={closeblacksm} alt="img" className='me-2' />
                                    { auth && auth.user && auth.user.twitter_username ? `@${auth.user.twitter_username}` : ''}
                                    </div>
                                </> } >
                                    <LinkTwitter auto_tweet={auto_tweet}  
                                    auth={auth}
                                    username={auth && auth.user && auth.user.twitter_username || false}  />
                                </Popup>
                            </li>

                            <li className='disabled' >
                                <div className='notification'>
                                RECEIVE NOTIFICATION ON EMAIL 
                                    <label className="switch">
                                        <input type="checkbox"></input>
                                        <span className="sliderSw round"></span>
                                    </label>
                                </div>
                            </li>

                            <li>
                                <Popup space='4' modalclassName="pinkmodal" 
                                text={<>DELETE ACCOUNT  </>} >
                                    <DeleteUserForm />
                                </Popup >
                            </li>
                            
                        </ul>
                    </div>
                </div>
            </div>
        </Authenticated>
    )
}
