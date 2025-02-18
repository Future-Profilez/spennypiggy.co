import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useAlerts } from "@/Components/Alerts";
import { Head, Link, usePage } from "@inertiajs/react";
import wishlistbannerimg from "../../assets/img/wishlistbannerimg.jpg";
import { addicon } from "@/includes/Icons";
const AddGoal = React.lazy(() => import("./TipJar/AddGoal"));
const Wishlist = React.lazy(() => import("./Auth/Wishlist"));
const Wishlistbox = React.lazy(() => import("@/wishlist/Wishlistbox"));
const Userprofile = React.lazy(() => import("@/wishlist/Userprofile"));
const ShareProfile = React.lazy(() => import("@/wishlist/ShareProfile"));
const Nocontent = React.lazy(() => import("@/includes/Nocontent"));
const LoadingScreen = React.lazy(() => import("@/includes/LoadingScreen"));
const Social = React.lazy(() => import("./Auth/Social"));
const VersionUpdate = React.lazy(() => import("@/Components/VersionUpdate"));
const PaymentDashboard = React.lazy(() => import("./stripe/PaymentDashboard"));
const ChangeCurrency = React.lazy(() => import("@/Components/ChangeCurrency"));
const Popup = React.lazy(() => import("@/Components/Popup"));
const MembershipsLists = React.lazy(() =>import("./membership/MembershipsLists"));
const AddMembership = React.lazy(() => import("./membership/AddMembership"));
const Gifter = React.lazy(() => import("./gifter/Gifter"));
const AddBills = React.lazy(() => import("./bills/AddBills"));
const EditCategories = React.lazy(() => import("@/wishlist/EditCategories"));
const TipInner = React.lazy(() => import("./TipJar/TipInner"));
const Billslist = React.lazy(() => import("./bills/Billslist"));
const FeedList = React.lazy(() => import("./feed/FeedList"));
const AddPost = React.lazy(() => import("./feed/AddPost"));
const AddIntro = React.lazy(() => import("./intros/AddIntro"));
const MyGoal = React.lazy(() => import("./TipJar/MyGoal"));
const SocialLinks = React.lazy(() => import("@/includes/SocialLinks"));
const SiteSubscription = React.lazy(() => import("./Profile/SiteSubscription"));
import axios from "axios";
import Guest from "@/Layouts/GuestLayout";
import { LazyLoadImage } from "react-lazy-load-image-component";
import useWidthCount from "@/Components/useWidthCount";
import{arrayMove,SortableContext,sortableKeyboardCoordinates,useSortable,rectSortingStrategy,}from "@dnd-kit/sortable";
import{closestCenter,DndContext,KeyboardSensor,MouseSensor,TouchSensor,useSensor,useSensors,}from "@dnd-kit/core";
import PaymentUnActivated from "@/Components/PaymentUnActivated";
import { Tabs, Tab } from "react-tabs-scrollable";
import "react-tabs-scrollable/dist/rts.css";
import ProfileSteps from "./Profile/ProfileSteps";
import ProfileProductLists from "./shop/profile/ProfileProductLists";
import AddItem from "./shop/AddItem";
import AddGift from "./feed/AddGift";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import PriceFormat from "@/includes/PriceFormat";
import GiftListing from "@/rye/GiftListing";


export default function Dashboard(props) {

    const parsePageId = (path) => path.substring(path.lastIndexOf('/') + 1)
    const pageId = parsePageId(window.location.pathname);
      const { format, formatMultiPrice } = PriceFormat();



    const w = useWidthCount();
    const{auth,user,username,global_currency,itemid}= props;

    const [tab, setTab] = useState(0);
    // useEffect(() => {
    //     if(pageId == 'shop'){
    //         setTab(5);
    //     }
    // });
    const onTabClick = (e, d) => {
        setTab(d);
    };
    const { successAlert, errorAlert, infoAlert, warningAlert } = useAlerts();
    const [IsloggedIn, setIsLoggedIn] = useState((auth && auth.user && auth.user.username) == (user && user.username));
    const [loading, setLoading] = useState(false);
    const [socialLinks, setSocialLinks] = useState([]);
    const [sLinks, setLinks] = useState([]);
    const [categories, setcategories] = useState([]);
    const [gifts, setGifts] = useState([]);

    const fetch_categories = async (signal) => {
        axios.get(`/user_category/${username}`, { signal })
        .then((resp) => {
            setcategories(resp.data.categories);
        }).catch((_err) => {
            console.error("error", _err);
        });
    };

    const fetch_gifts = async (signal) => {
        axios.get(`/get-all-products`, { signal })
        .then((resp) => {
            let details=JSON.parse(resp?.data?.data[0]?.details);
            console.log("resp",details);
            setGifts(resp?.data?.data);
        }).catch((_err) => {
            console.error("error", _err);
        });
    };


    const [its, setIts] = useState();
    const fetchingcats = (cat, signal) => {
        setLoading(true);
        if(!cat){
            setSelectedCat('');
        }
        fetch(`/items/${username}${cat ? `/${cat}` : ""}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                setLoading(false);
                const result = data && data.items;
                setIts(result);
            })
            .catch((error) => {
                console.error("error", error);
                setLoading(false);
            });
        // }
    };

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        if(tab == '1'){
            fetch_categories(signal);
            fetchingcats(false, signal);
        }
        if(tab == '6'){
            fetch_gifts(signal);
            fetchingcats(false, signal);
        }
        return () => controller.abort();
    }, [tab]);


    const [selectedCat, setSelectedCat] = useState('')
    const showCategory = (e) => {
        fetchingcats(e);
        setSelectedCat(e);
    };

    const fetchingLinks = () => {
        axios.get(`sociallinks/${username}`)
        .then((resp) => {
            setSocialLinks(resp.data.sociallinks);
            setLinks(resp.data.slinks);
        })
        .catch((_err) => {
            console.error("error", _err);
        });
    };
    const [fetchingGoal, setfetchingGoal] = useState(false);
    const [goal, setGoal] = useState();
    const fetch_goal = async (signal) => {
        if (fetchingGoal) {
            return true;
        }
        setfetchingGoal(true);
        axios.get(`tip-jar/list/${user && user.uuid}`, { signal })
            .then((resp) => {
                setGoal(resp.data.goal);
                setfetchingGoal(false);
            })
            .catch((_err) => {
                console.error("error", _err);
                setfetchingGoal(false);
            });
    };

    useEffect(() => {
        const controller = new AbortController();
        const { signal } = controller;
        fetchingLinks(signal);
        fetch_goal(signal);
        return () => controller.abort();
    }, []);

    // Currency update
    const currencyaction = (e) => {
        if (e == "open") {
            setOpenCurrency(true);
        } else {
            setOpenCurrency(false);
        }
    };
    const [openCurrency, setOpenCurrency] = useState(null);
    useEffect(() => {
        if (global_currency == null) {
            setOpenCurrency(true);
        }
    });

    const updateMovement = async (updated) => {
        const array = [];
        updated.forEach((name) => {
            array.push(name.id);
        });
        axios
            .post(`move-wish`, {
                shuffled_items: array,
            })
            .then((resp) => {})
            .catch((_err) => {
                console.error("error", _err);
            });
    };
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 50, tolerance: 10 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );
    const handleDragEnd = (event) => {
        if (!IsloggedIn) {
            return false;
        }
        const { active, over } = event;
        const activeIndex = its.findIndex((item) => item.id === active.id);
        const newOverIndex = over
            ? its.findIndex((item) => item.id === over.id)
            : null;
        if (activeIndex !== newOverIndex) {
            const updated = arrayMove(its, activeIndex, newOverIndex, {
                key: "id",
            });
            setIts(updated);
            updateMovement(updated);
        }
    };

    const { flash, errors } = usePage().props;
    useEffect(() => {
        if (errors) {
            Object.entries(errors).forEach(([key, value]) => {
                errorAlert(value);
            });
        }
        if (flash?.success) {
            setTimeout(() => {
                successAlert(flash.success);
            }, 500);
        }
        if (flash?.error) {
            setTimeout(() => {
                errorAlert(flash.error);
            }, 500);
        }
        if (flash?.warning) {
            setTimeout(() => {
                warningAlert(flash.warning);
            }, 500);
        }
        if (flash?.info) {
            setTimeout(() => {
                infoAlert(flash.info);
            }, 500);
        }
    }, []);

    const [billupdated, setbillupdated] = useState("");
    function updatebill(e) {
        if (e == "updated") {
            setTimeout(() => {
                setbillupdated(new Date());
            }, 100);
        }
    }

    const [isUpdated, setIsUpdated] = useState();
    const updateState = (e) => {
        setIsUpdated(e);
    }

    // const Toggle = () => {
    //     return  <>
    //         {IsloggedIn ? (
    //             <Dropdown className="add-options ">
    //                 <Dropdown.Toggle
    //                     className="dropdown-add px-3"
    //                     variant="success"
    //                     id="dropdown-basic"
    //                     dangerouslySetInnerHTML={{__html:addicon}}
    //                 ></Dropdown.Toggle>
    //                 <Dropdown.Menu>
    //                     { auth.user && auth.user.stripe_details_submitted == 1 ?
    //                         <>
    //                             <Suspense fallback={"Add Wishlist"}>
    //                                 <Wishlist
    //                                     fetchcategories={fetch_categories}
    //                                     currency={global_currency}
    //                                     setuped={auth.user &&auth.user.stripe_details_submitted == 1? true : false}
    //                                     fetchingcats={fetchingcats}
    //                                     categories={categories}
    //                                 />
    //                             </Suspense>
    //                             <Suspense fallback={"Add Membership"}>
    //                                 <AddMembership updateState={updateState} />
    //                             </Suspense>
    //                             <Suspense fallback={"Add Membership"}>
    //                                 <AddBills updatebill={updatebill}/>
    //                             </Suspense>
    //                             <Suspense fallback={"Add Membership"}>
    //                                 <AddItem classes="dropdown-item"
    //                                 product_type="digital_products" title='Add Digital Product' />
    //                             </Suspense>
    //                         </>
    //                     : ''}
    //                     <Suspense fallback={"Add Post"}>
    //                         <AddPost updateState={updateState} />
    //                     </Suspense>
    //                 </Dropdown.Menu>

    //             </Dropdown>
    //         ) : (
    //             ""
    //         )}
    //     </>
    // }


    const Toggle = () => {
        const [showAdd, setShowAdd]= useState(false);
        useEffect(()=>{
            if(showAdd){
              document.body.classList.add('overflow-hidden');
            } else {
              document.body.classList.remove('overflow-hidden');
            }
          },[showAdd]);

        return  <>
            {IsloggedIn ? <>
                <div onClick={()=>setShowAdd(true)} className="addoption-action cursor-pointer px-3" dangerouslySetInnerHTML={{__html:addicon}} ></div>
                {showAdd ?
                    <div className="bg-[#0001] rounded-xl position-fixed shadow-lg z-[99999999999999999999] flex justify-center items-center
                     top-[50%] left-[50%] transform -translate-x-[50%] -translate-y-[50%] w-full h-full">
                        <div className="w-full max-w-[550px] px-3">
                            <Suspense fallback={"Loading.."}>
                                <div className="bg-gray-100 w-full p-6 md:p-10 rounded-3xl shadow-lg z-10">
                                    <h2 className="font-bold text-black  text-xl md:text-2xl mb-4 text-center m-auto ">Add Item to fund your lifestyle.</h2>
                                    {auth.user && auth.user.stripe_details_submitted == 1 ?
                                        <>
                                            <Wishlist
                                            fetchcategories={fetch_categories}
                                            currency={global_currency}
                                            setuped={auth.user &&auth.user.stripe_details_submitted == 1 ? true : false}
                                            fetchingcats={fetchingcats}
                                            categories={categories} />
                                            <AddMembership updateState={updateState} />
                                            <AddBills updatebill={updatebill}/>
                                            <AddItem  classes="w-full font-bold addop bg-white rounded-xl p-3 mb-2 text-center"
                                            product_type="digital_products"  />
                                        </>
                                    : '' }
                                    <AddPost classes="font-bold py-3 px-3 mb-2 text-center" updateState={updateState} />
                                    <AddGift classes="font-bold py-3 px-3 mb-2 text-center" updateState={updateState} />
                                    <button onClick={()=>setShowAdd(false)} className="m-auto table p-2 mt-3"  >Cancel</button>
                                </div>
                            </Suspense>
                        </div>
                    </div>
                : ""}
            </> : ""
            }
        </>
    }

    return (
        <>
            <Guest auth={auth.user} user={user}>
                <Head title={`${user?.name || auth?.user?.name} - Spenny Piggy`} />
                <div className="wishlistPage blackbg pt-6 pb-0 pb-sm-5 ">
                    <div className="containerbox">
                         {/* <CanvaButton />  */}
                        <VersionUpdate />
                        <div className="wishbanner relative ">
                        <LazyLoadImage
                            alt={"image"}
                            useIntersectionObserver={true}
                            effect="blur"
                            height={400}
                            className="w-full border-black border-2 shadow-mint rounded-2xl"
                            src={user?.cover_url || wishlistbannerimg}
                            width={1200}
                        />

                        {IsloggedIn && auth && auth?.user.cover_url && auth?.user?.cover_approved == 0 ?
                            <div className="absolute right-5 top-3 mx-auto">
                                <button className='tooltipbtn' >
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M9 15H11V9H9V15ZM10 7C10.2833 7 10.521 6.904 10.713 6.712C10.905 6.52 11.0007 6.28267 11 6C11 5.71667 10.904 5.47933 10.712 5.288C10.52 5.09667 10.2827 5.00067 10 5C9.71667 5 9.47933 5.096 9.288 5.288C9.09667 5.48 9.00067 5.71733 9 6C9 6.28333 9.096 6.521 9.288 6.713C9.48 6.905 9.71733 7.00067 10 7ZM10 20C8.61667 20 7.31667 19.7373 6.1 19.212C4.88333 18.6867 3.825 17.9743 2.925 17.075C2.025 16.175 1.31267 15.1167 0.788 13.9C0.263333 12.6833 0.000666667 11.3833 0 10C0 8.61667 0.262667 7.31667 0.788 6.1C1.31333 4.88333 2.02567 3.825 2.925 2.925C3.825 2.025 4.88333 1.31267 6.1 0.788C7.31667 0.263333 8.61667 0.000666667 10 0C11.3833 0 12.6833 0.262667 13.9 0.788C15.1167 1.31333 16.175 2.02567 17.075 2.925C17.975 3.825 18.6877 4.88333 19.213 6.1C19.7383 7.31667 20.0007 8.61667 20 10C20 11.3833 19.7373 12.6833 19.212 13.9C18.6867 15.1167 17.9743 16.175 17.075 17.075C16.175 17.975 15.1167 18.6877 13.9 19.213C12.6833 19.7383 11.3833 20.0007 10 20Z" fill="#FF8E25"/>
                                    </svg>
                                    <p>Cover image is waiting for approval. Currently only you can see this.</p>
                                </button>
                            </div>
                        : ""}

                        </div>

                        <Userprofile IsloggedIn={IsloggedIn} />

                        {user && user?.role == 1 && IsloggedIn ? <div className="alert bg-info">
                            In order to comply with Stripe it is required that you post content for memberships,
                            Bills and subscriptions regularly. Accounts not doing so will be suspended.
                            Please reach out to support for more information.</div>
                        : ''}

                        {user && user.role == 1 ? (
                            <div className="wishManage sticky top-8">
                                <div className="userManageRt mt-4">
                                    <div className={`tabs-container ${IsloggedIn ? "IsloggedIn" : ""}`} >

                                        <div className="inlinetab">
                                                <div className="newnav-tabs d-flex items-center justify-between mb-4 ">
                                                    <Tabs activeTab={tab}
                                                    onTabClick={onTabClick}
                                                    hideNavBtnsOnMobile={false} >
                                                        <Tab key="0">About</Tab>
                                                        <Tab key="1" >Wishes</Tab>
                                                        <Tab key="2" >Feed</Tab>
                                                        <Tab key="3" >Membership</Tab>
                                                        <Tab key="4" >Bills</Tab>
                                                        <Tab key="5" >Shop</Tab>
                                                        <Tab key="6" >Add Gift Item</Tab>
                                                    </Tabs>
                                                    {IsloggedIn ? <Toggle /> : ''}
                                                </div>
                                                <div className="tabs-containers min-height" >
                                                    {tab == '0' ?
                                                        <Suspense fallback={<LoadingScreen />} >
                                                            <div className="row about-sec align-self-start">
                                                                <div className="col-md-6  h-auto">
                                                                    <div className="about-sticky" >

                                                                        {user && goal && user?.stripe_details_submitted == 1 ?
                                                                        <MyGoal IsloggedIn={IsloggedIn} goal={goal} /> : ""}

                                                                        <div className="box p-2 p-md-4 shadow-voilet rounded-lg mb-4">
                                                                            <p className="font-bold">About me</p>
                                                                            <p className={`text-muted text-start mt-2 ${user &&!user.bio? "d-none": ""}`}>
                                                                                {(user &&user.bio) ||""}
                                                                            </p>

                                                                            <SocialLinks links={sLinks} />

                                                                            {IsloggedIn ? (
                                                                                <div className="userProfileDate pt-0 pt-md-3">
                                                                                    {auth.user && auth.user.role == 1 && <>
                                                                                        {auth.user && auth.user.monthly_charge_enabled ? '' : <SiteSubscription user={auth.user} /> }
                                                                                    </>
                                                                                    || ''}

                                                                                    {auth.user && auth.user.role == 1 && auth.user.monthly_charge_enabled &&
                                                                                    <>
                                                                                    {auth.user && auth.user.stripe_details_submitted == 1  ? (
                                                                                            <PaymentDashboard classes="btn-pink lg w-100 mt-3" text="Payment Dashboard" />
                                                                                        ) : (
                                                                                            <div className="finish mt-4 d-block">
                                                                                                <p className="mb-4"> Finish setting up your account to receive funds. You have more steps to complete your payment setup.</p>
                                                                                                <Link disabled={auth.user && auth.user.monthly_charge_enabled ? '' : true } href={"/stripe"} className="btn-pink text-xs lg" > Finish Setup
                                                                                                </Link>
                                                                                            </div>
                                                                                        )}
                                                                                    </> || ''}

                                                                                    {/* {auth.user && auth.user.stripe_details_submitted == 1 ?
                                                                                        <AddGoal
                                                                                        stripe_enabled={auth.user && auth.user.stripe_details_submitted}
                                                                                        fetch_goal={fetch_goal}
                                                                                        activegoal={goal}
                                                                                        />
                                                                                    : ''} */}

                                                                                    <div className="addsocial flex">
                                                                                        <ul>
                                                                                            <li>
                                                                                                <Social updatedLinks={fetchingLinks}links={sLinks}/>
                                                                                            </li>
                                                                                            <li>
                                                                                                <ShareProfile username={user && user.name} classes={"d-flex ms-auto"}>
                                                                                                    Share Profile
                                                                                                </ShareProfile>
                                                                                            </li>
                                                                                        </ul>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                ""
                                                                            )}
                                                                        </div>
                                                                        <AddIntro uuid={user?.id || null} IsloggedIn={IsloggedIn}/>

                                                                    </div>
                                                                </div>

                                                                <div className="ps-md-4 col-md-6">
                                                                    {IsloggedIn ? <ProfileSteps fetchingLinks={fetchingLinks} sLinks={sLinks} user={user} IsloggedIn={IsloggedIn} /> : ''}
                                                                    {tab == "0" ? <>
                                                                        {user && user.stripe_details_submitted == 1 && w > 767 ? <TipInner classes={`mb-4`} /> : ''}
                                                                        <FeedList isUpdated={isUpdated}
                                                                            user={user}
                                                                            IsloggedIn={IsloggedIn}
                                                                        />
                                                                    </> : ''}
                                                                </div>
                                                            </div>
                                                        </Suspense>
                                                    : ''}

                                                    {tab == '1' ?
                                                     <Suspense fallback={<LoadingScreen />} >
                                                        <div className="wishes-items ">
                                                            {categories && categories.length ?
                                                            <>
                                                            <div className="new-wish-cats d-flex mb-2" >
                                                                <div onClick={()=>showCategory('')} className={`${selectedCat == '' ? 'active' : ''} me-2  mb-2  wish-tags cursor-pointer`} >All</div>
                                                                {categories.map((c,i) => {
                                                                    return <>
                                                                    <div onClick={()=>showCategory(c.id)} className={`${selectedCat == c.id ? 'active' : ''} me-2  mb-2  wish-tags cursor-pointer`} key={`cats-${i}`} >{c.category}</div>
                                                                    </>;
                                                                })}
                                                                {IsloggedIn ? <EditCategories fetch_categories={fetch_categories} username={auth && auth?.user?.username || null} /> : ''}
                                                            </div>
                                                            </>
                                                            : ''}

                                                            {loading ? (
                                                                <LoadingScreen />
                                                            ) : (
                                                                ""
                                                            )}
                                                            <div className="row  items-lists">
                                                                {IsloggedIn || user?.stripe_details_submitted == 1 ? (
                                                                    <>
                                                                        {its &&
                                                                        its.length ? (
                                                                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                                                                <SortableContext strategy={rectSortingStrategy} items={its}>
                                                                                    {!loading && its.map((c, i) => {
                                                                                                return (
                                                                                                    <Wishlistbox key={`wish-item-${i}`} classes="col-xl-3 col-lg-3 col-md-4 col-6"
                                                                                                        currency={global_currency} fetchingcats={fetchingcats} categories={categories} IsloggedIn={IsloggedIn}
                                                                                                        auth={auth.user} itemid={itemid} setuped={auth && auth.user && auth.user.stripe_details_submitted == 1
                                                                                                                ? true : false} itm={c}
                                                                                                    />
                                                                                                );
                                                                                            }
                                                                                        )}
                                                                                </SortableContext>
                                                                            </DndContext>
                                                                        ) : (
                                                                            <>
                                                                                {(!loading && (
                                                                                    <div className="col-md-12">
                                                                                        <Nocontent text="Nothing to see." />
                                                                                    </div>
                                                                                )) ||
                                                                                    ""}
                                                                            </>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <PaymentUnActivated
                                                                    heading={`WishList not activated yet. `}
                                                                    subheading={`Until they activate their wishlist, this user won't be able to receive gifts.`} />
                                                                )}
                                                            </div>
                                                        </div>
                                                     </Suspense>
                                                    : ''}

                                                    {tab == '2' ?
                                                        <Suspense fallback={<LoadingScreen />}>
                                                            <FeedList isUpdated={isUpdated} user={user}  IsloggedIn={IsloggedIn} />
                                                        </Suspense>
                                                    : ''}

                                                    {tab == '3' ?
                                                        <Suspense
                                                            fallback={<LoadingScreen />} >
                                                                {IsloggedIn || user?.stripe_details_submitted == 1 ? (
                                                                    <MembershipsLists  isUpdated={isUpdated}
                                                                    IsloggedIn={IsloggedIn}
                                                                    username={user?.username || auth?.user ?.username}
                                                                    />
                                                                ) : (
                                                                    <PaymentUnActivated
                                                                    heading={`Memberships not activated yet. `}
                                                                    subheading={`Until they activate their Memberships, this user won't be able to receive gifts.`} />
                                                                )}
                                                        </Suspense>
                                                    : ''}

                                                    {tab == '4' ?
                                                        <Suspense fallback={<LoadingScreen />} >
                                                            {IsloggedIn || user?.stripe_details_submitted == 1 ? (
                                                                <Billslist billupdate={billupdated} IsloggedIn={IsloggedIn} />
                                                            ) : (
                                                                <PaymentUnActivated  heading={`Bills not activated yet. `}
                                                                subheading={`Until they activate their bills, this user won't be able to receive gifts.`} />
                                                            )}
                                                        </Suspense>
                                                    : "" }

                                                    {tab == '5' ?
                                                        <Suspense fallback={<LoadingScreen />} >
                                                            {IsloggedIn || user?.stripe_details_submitted == 1 ? (
                                                                 <ProfileProductLists  profileuser={user} />
                                                            ) : (
                                                                <PaymentUnActivated  heading={`Bills not activated yet. `}
                                                                subheading={`Until they activate their bills, this user won't be able to receive gifts.`} />
                                                            )}
                                                        </Suspense>
                                                    : "" }

                                                    {tab == '6' ?
                                                     <Suspense fallback={<LoadingScreen />} >
                                                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                                                     {gifts && gifts?.map((gift) => {
                                                        const details = JSON.parse(gift.details); // Parse the details JSON

                                                        return (
                                                            <GiftListing gift={gift} details={details}/>
                                                        );
                                                        })}

                                                     </div>
                                                  </Suspense>
                                                    : ''}
                                                </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : <>
                            <Gifter
                            fetchingLinks={fetchingLinks}
                            sLinks={sLinks}
                            IsloggedIn={IsloggedIn} />
                        </>
                        }
                    </div>
                </div>

                {IsloggedIn ? (
                    <Popup action={openCurrency} space="4"
                    modalclassName="pinkmodal" >
                    <ChangeCurrency
                        currencyaction={currencyaction}
                        defaultvalue={global_currency}
                    />
                    </Popup>
                ) : (
                    ""
                )}
            </Guest>
        </>
    );
}
