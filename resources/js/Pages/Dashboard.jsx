import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import Wishlist from './Auth/Wishlist';
import Wishlistbox from '@/wishlist/Wishlistbox';
import wishlistbannerimg from '../../assets/img/wishlistbannerimg.jpg';
import Userprofile from '@/wishlist/Userprofile';
import EditProfile from '@/Pages/account/EditProfile';
import ShareProfile from '@/wishlist/ShareProfile';
import { useState } from 'react';
import Social from './Auth/Social';
import axios from 'axios';
import Guest from '@/Layouts/GuestLayout';
import Nocontent from '@/includes/Nocontent';
import LoadingScreen from '@/includes/LoadingScreen';
import { useEffect } from 'react';
import PaymentDashboard from './stripe/PaymentDashboard';

export default function Dashboard(props) {

    const { auth, items, categories, user, itemid, sociallinks, slinks } = props;
    const [its, setIts] = useState(items);
    const [loading, setLoading] = useState(false);

    const fetchingcats = (e) => {
        setLoading(true);
        axios.get(`${user.username}/${e}`).then(resp => {
            setIts(resp.data.items)
            setLoading(false);
        }).catch(_err => {
            console.error("error", _err);
            setLoading(false);
        });
    }

    const showCategory = (e) => {
        const v = e.target.value;
        fetchingcats(v);
    }

    
    const [IsloggedIn, setIsLoggedIn] = useState((auth && auth.user && auth.user.username) == (user && user.username));
    console.log("IsloggedIn", IsloggedIn)

    return (
        <Guest
            auth={auth.user}
            user={user} >
            <Head title={user && user.name} />
            <div className='wishlistPage blackbg pt-8 pb-14 '>
                <div className='containerbox'>
                    <div className='wishbanner d-lg-block d-none'>
                        <img className='w-full  border-black border-2 shadow-mint rounded-2xl' src={user?.cover_url || wishlistbannerimg} alt='img' />
                    </div>
                    <div className='wishManage'>
                        <div className='row'>
                            <div className='col-lg-4' >
                                <div className='userProfile whbg rounded-3xl shadow-voilet border-2'>
                                    <Userprofile links={sociallinks} user={user} />
                                    <div className='userProfileDate pt-0'>
                                        {IsloggedIn ? <>
                                            <EditProfile user={auth.user} />
                                            { auth.user && auth.user.stripe_details_submitted == 1 ? 
                                            <PaymentDashboard classes='btn-pink lg w-100 mt-4' text='Payment Dashboard' />
                                            : <div className='finish mt-4 d-block'>
                                            <p className='mb-4'>Finish setting up your account to receive funds. You have more steps to complete your payment setup.</p>
                                            <Link href={"/stripe"} className='btn-pink lg'>Finish Setup</Link>
                                        </div>
                                        }

                                            <div className='addsocial flex'>
                                                <ul>
                                                    <li>
                                                        <Social links={slinks} />
                                                    </li>
                                                    <li>
                                                        <ShareProfile classes={"d-flex ms-auto"} >
                                                            <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M22.46 6.5C21.69 6.85 20.86 7.08 20 7.19C20.88 6.66 21.56 5.82 21.88 4.81C21.05 5.31 20.13 5.66 19.16 5.86C18.37 5 17.26 4.5 16 4.5C13.65 4.5 11.73 6.42 11.73 8.79C11.73 9.13 11.77 9.46 11.84 9.77C8.28004 9.59 5.11004 7.88 3.00004 5.29C2.63004 5.92 2.42004 6.66 2.42004 7.44C2.42004 8.93 3.17004 10.25 4.33004 11C3.62004 11 2.96004 10.8 2.38004 10.5V10.53C2.38004 12.61 3.86004 14.35 5.82004 14.74C5.19077 14.9122 4.53013 14.9362 3.89004 14.81C4.16165 15.6625 4.69358 16.4084 5.41106 16.9429C6.12854 17.4775 6.99549 17.7737 7.89004 17.79C6.37367 18.9904 4.49404 19.6393 2.56004 19.63C2.22004 19.63 1.88004 19.61 1.54004 19.57C3.44004 20.79 5.70004 21.5 8.12004 21.5C16 21.5 20.33 14.96 20.33 9.29C20.33 9.1 20.33 8.92 20.32 8.73C21.16 8.13 21.88 7.37 22.46 6.5Z" fill="#5D25FD" />
                                                            </svg> Share Profile
                                                        </ShareProfile>
                                                    </li>
                                                </ul>
                                            </div>
                                        </>
                                        : ''}
                                    </div>
                                </div>
                            </div>
                            <div className='col-lg-8 ps-3 ps-lg-4' >
                                <div className='userManageRt mt-8'>
                                    <div className='userManageHead flex items-center justify-between mb-8'>
                                        <div>
                                            {its && its.length ?
                                                <select id="country" onChange={showCategory} name="country" autoComplete="country-name" className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6">
                                                    <option value={'all'}>{'All'}</option>
                                                    {categories && categories.map((c, i) => {
                                                        return <option value={c.id} key={`cat-${c.category}`}>{c.category}</option>
                                                    })}
                                                </select>
                                            : ''}
                                        </div>
                                         
                                        {IsloggedIn ? <Wishlist fetchingcats={fetchingcats} categories={categories} /> : ""}
                                    
                                    </div>
                                    <div className='row'>

                                    {!IsloggedIn && user?.stripe_details_submitted !== 1 ?
                                        <div className='col-md-12 p-5 notactive' >
                                            <h5 className='loadingtext w-full text-center text-white  mb-1'>{user.name}'s WishList not activated yet.</h5>
                                            <p className='text-center  text-white text-large ' >Until they activate their wishlist, this user won't be able to receive gifts</p>
                                        </div> :
                                     ''
                                    }

                                    {its && its.length ?
                                            !loading && its.map((c, i) => {
                                                return <div className='col-xl-4 col-lg-6 col-6' >
                                                    <Wishlistbox
                                                    fetchingcats={fetchingcats}
                                                    categories={categories}
                                                    IsloggedIn={IsloggedIn}
                                                    auth={auth.user}
                                                    itemid={itemid} itm={c} key={`wish-${c.uuid}`} />
                                                </div>
                                            })
                                        :
                                        <>
                                            {!loading ? <div className='col-md-12' >
                                                <Nocontent text="Nothing to see." />
                                            </div> : ''}
                                        </>
                                    }


                                    {loading ? <LoadingScreen />:''}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Guest>
    );
}
