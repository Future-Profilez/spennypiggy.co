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
import Dropdown from "react-bootstrap/Dropdown";
import Tab from "react-bootstrap/Tab";
import Tabs from "react-bootstrap/Tabs";
import axios from "axios";
import Guest from "@/Layouts/GuestLayout";
import { LazyLoadImage } from "react-lazy-load-image-component";
import useWidthCount from "@/Components/useWidthCount";

import{arrayMove,SortableContext,sortableKeyboardCoordinates,useSortable,rectSortingStrategy,}from "@dnd-kit/sortable";
import{closestCenter,DndContext,KeyboardSensor,MouseSensor,TouchSensor,useSensor,useSensors,}from "@dnd-kit/core";


export default function Dashboard(props) {
    const w = useWidthCount();
    const{auth,user,username,global_currency,itemid}= props;
    const [tab, setTab] = useState("home");
    const { successAlert, errorAlert, infoAlert, warningAlert } = useAlerts();
    const [IsloggedIn, setIsLoggedIn] = useState((auth && auth.user && auth.user.username) == (user && user.username));
    const [loading, setLoading] = useState(false);
    const [socialLinks, setSocialLinks] = useState([]);
    const [sLinks, setLinks] = useState([]);
    const [categories, setcategories] = useState([]);

    const fetch_categories = async (signal) => {
        axios.get(`/user_category/${username}`, { signal })
        .then((resp) => {
            setcategories(resp.data.categories);
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
        if(tab == 'wishes'){
            fetch_categories(signal);
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

    // Update movement of wish items
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

    const Toggle = () => {
        return  <>
            {IsloggedIn ? (
                <Dropdown className="add-options ">
                    <Dropdown.Toggle
                        className="dropdown-add px-3"
                        variant="success"
                        id="dropdown-basic"
                        dangerouslySetInnerHTML={{__html:addicon}}
                    ></Dropdown.Toggle>
                    <Dropdown.Menu>
                        { auth.user && auth.user.stripe_details_submitted == 1 ? 
                            <>
                                <Suspense fallback={"Add Wishlist"}>
                                    <Wishlist  
                                        fetchcategories={fetch_categories}
                                        currency={global_currency} 
                                        setuped={auth.user &&auth.user.stripe_details_submitted == 1? true : false}
                                        fetchingcats={fetchingcats}
                                        categories={categories} 
                                    />
                                </Suspense> 
                                <Suspense fallback={"Add Membership"}>
                                    <AddMembership updateState={updateState} />
                                </Suspense>
                                <Suspense fallback={"Add Membership"}>
                                    <AddBills updatebill={updatebill}/>
                                </Suspense>
                            </>
                        : ''}
                        <Suspense fallback={"Add Post"}>
                            <AddPost updateState={updateState} />
                        </Suspense>
                    </Dropdown.Menu>

                </Dropdown>
            ) : (
                ""
            )}
        </>
    }
    
    return (
        <>
            <Guest auth={auth.user} user={user}>
                <Head title={`${user?.name || auth?.user?.name} - Spenny Piggy`} />
                <div className="wishlistPage blackbg pt-6 pb-0 pb-sm-5 ">
                    <div className="containerbox">
                        <VersionUpdate />
                        <div className="wishbanner ">
                            <LazyLoadImage
                                alt={"image"}
                                useIntersectionObserver={true}
                                effect="blur"
                                height={400}
                                className="w-full border-black border-2 shadow-mint rounded-2xl"
                                src={user?.cover_url || wishlistbannerimg}
                                width={1200}
                            />
                        </div>
                        <Userprofile IsloggedIn={IsloggedIn} />

                        {user && user?.role == 1 && IsloggedIn ? <div className="alert bg-info">
                            In order to comply with Stripe it is required that you post content for memberships, 
                            Bills and subscriptions regularly. Accounts not doing so will be suspended. 
                            Please reach out to support for more information.</div>
                        : ''}                        
                        
                        {user && user.role == 1 ? (
                            <div className="wishManage">
                                <div className="userManageRt mt-4">
                                    <div className={`tabs-container ${IsloggedIn ? "IsloggedIn" : ""}`} >
                                        <Toggle />
                                        <div className="inlinetab">
                                            <Tabs
                                                defaultActiveKey="home"
                                                transition={true}
                                                onSelect={(e) => setTab(e)}
                                                id="noanim-tab-example"
                                                className="mb-3" >
                                                <Tab eventKey="home" title="Home">
                                                    <div className="row about-sec">
                                                        <div className="col-md-6">
                                                            <div className="box p-2 p-md-4 shadow-voilet rounded-lg mb-4">
                                                                <p className="font-bold">About me</p>
                                                                <p className={`text-muted text-start mt-2 ${user &&!user.bio? "d-none": ""}`}>
                                                                    {(user &&user.bio) ||""}
                                                                </p>

                                                                <SocialLinks links={sLinks} />
                                                                
                                                                {IsloggedIn ? (
                                                                    <div className="userProfileDate pt-0 pt-md-3">
                                                                        
                                                                        {auth.user && auth.user.role == 1 && <>
                                                                            {auth.user && auth.user.stripe_details_submitted == 1 ? (
                                                                                <PaymentDashboard classes="btn-pink lg w-100 mt-3" text="Payment Dashboard" />
                                                                            ) : (
                                                                                <div className="finish mt-4 d-block">
                                                                                    <p className="mb-4"> Finish setting up your account to receive funds. You have more steps to complete your payment setup.</p>
                                                                                    <Link href={"/stripe"} className="btn-pink lg" > Finish Setup
                                                                                    </Link>
                                                                                </div>
                                                                            )}
                                                                        </> || ''}

                                                                        {auth.user && auth.user.stripe_details_submitted == 1 ? 
                                                                            <AddGoal
                                                                            stripe_enabled={auth.user && auth.user.stripe_details_submitted}
                                                                            fetch_goal={fetch_goal}
                                                                            activegoal={goal}
                                                                            />
                                                                        : ''}

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

                                                            {user && user?.stripe_details_submitted == 1 && goal && goal.completed == 0 ? <MyGoal IsloggedIn={IsloggedIn} goal={goal} /> : ""}

                                                            <AddIntro uuid={user?.id || null} IsloggedIn={IsloggedIn}/>

                                                            </div>

                                                            {tab === "home" ? (
                                                                <div className="ps-md-4 col-md-6">
                                                                    {user && user.stripe_details_submitted == 1 && w > 767 ? <TipInner classes={`mb-4`} /> : ''}
                                                                    <FeedList isUpdated={isUpdated}
                                                                        user={user} 
                                                                        IsloggedIn={IsloggedIn} 
                                                                    />
                                                                </div>
                                                            ) : (
                                                                ""
                                                            )}
                                                    </div>
                                                </Tab>
                                                <Tab eventKey="wishes" title="Wishes">
                                                    <div className="min-height ">
                                                        {categories && categories.length ? <div className="new-wish-cats d-flex flex-wrap mb-3" >
                                                            <div onClick={()=>showCategory('')} className={`${selectedCat == '' ? 'active' : ''} me-2  mb-2  wish-tags cursor-pointer`} >All</div>
                                                            
                                                            {categories.map((c,i) => {
                                                                return (<div onClick={()=>showCategory(c.id)} className={`${selectedCat == c.id ? 'active' : ''} me-2  mb-2  wish-tags cursor-pointer`} key={`cats-${i}`} >{c.category}</div>);
                                                            })}

                                                            {IsloggedIn ? <EditCategories fetch_categories={fetch_categories} username={auth && auth?.user?.username || null} /> : ''} 
                                                        </div> : ''}
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
                                                                        <DndContext
                                                                            sensors={
                                                                                sensors
                                                                            }
                                                                            collisionDetection={
                                                                                closestCenter
                                                                            }
                                                                            onDragEnd={
                                                                                handleDragEnd
                                                                            }
                                                                        >
                                                                            <SortableContext
                                                                                strategy={
                                                                                    rectSortingStrategy
                                                                                }
                                                                                items={
                                                                                    its
                                                                                }
                                                                            >
                                                                                {!loading &&
                                                                                    its.map(
                                                                                        (
                                                                                            c,
                                                                                            i
                                                                                        ) => {
                                                                                            return (
                                                                                                <Wishlistbox
                                                                                                    key={`wish-item-${i}`}
                                                                                                    classes="col-xl-3 col-lg-3 col-md-4 col-6"
                                                                                                    currency={
                                                                                                        global_currency
                                                                                                    }
                                                                                                    fetchingcats={
                                                                                                        fetchingcats
                                                                                                    }
                                                                                                    categories={
                                                                                                        categories
                                                                                                    }
                                                                                                    IsloggedIn={
                                                                                                        IsloggedIn
                                                                                                    }
                                                                                                    auth={
                                                                                                        auth.user
                                                                                                    }
                                                                                                    itemid={
                                                                                                        itemid
                                                                                                    }
                                                                                                    setuped={
                                                                                                        auth &&
                                                                                                        auth.user &&
                                                                                                        auth
                                                                                                            .user
                                                                                                            .stripe_details_submitted ==
                                                                                                            1
                                                                                                            ? true
                                                                                                            : false
                                                                                                    }
                                                                                                    itm={
                                                                                                        c
                                                                                                    }
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
                                                                <div className="col-md-12 p-5 my-5 notactive">
                                                                    <h5 className="loadingtext w-full text-center text-white mb-1">
                                                                        {user.name}'s WishList not activated yet. 
                                                                    </h5>
                                                                    <p className="text-center text-white text-large "> Until they activate their wishlist,this user won't be able to receive gifts </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Tab>
                                                <Tab eventKey="feed" title="Feed">
                                                    <Suspense fallback={"Loading..."}>
                                                        {tab === "feed" ? (
                                                            <FeedList isUpdated={isUpdated}
                                                                user={user} 
                                                                IsloggedIn={IsloggedIn}
                                                            />
                                                        ) : ""}
                                                    </Suspense>
                                                </Tab>
                                                <Tab eventKey="membership" title="Membership" >
                                                    <Suspense
                                                        fallback={"Loading..."} >
                                                        {tab == "membership" ? (
                                                            <MembershipsLists  isUpdated={isUpdated} 
                                                                IsloggedIn={IsloggedIn}
                                                                username={user?.username || auth?.user ?.username}
                                                            />
                                                        ) : (
                                                            ""
                                                        )}
                                                    </Suspense>
                                                </Tab>
                                                <Tab eventKey="bills" title="Bills">
                                                    <Suspense
                                                        fallback={"Loading..."}
                                                    >
                                                        {tab === "bills" ? (
                                                            <Billslist
                                                                billupdate={
                                                                    billupdated
                                                                }
                                                                IsloggedIn={
                                                                    IsloggedIn
                                                                }
                                                            />
                                                        ) : (
                                                            ""
                                                        )}
                                                    </Suspense>
                                                </Tab>
                                            </Tabs>
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
