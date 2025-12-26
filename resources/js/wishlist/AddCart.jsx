import { useState, lazy, useEffect } from "react";
import ToCart from "./ToCart";
import uploadedimg from "../../assets/img/uploadedimg.png";
import ProgressBar from "react-bootstrap/ProgressBar";
const Popup = lazy(() => import("@/Components/Popup"));
import PriceFormat from "@/includes/PriceFormat";
import { Link, router, usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import { trackSearchClick } from "@/includes/Analytics";

export default function AddCart(props) {
    const {  action, uuid, item, currency, showall, IsloggedIn } = props;
    const { auth} = usePage().props;
    const [sub, setSub] = useState("daily");
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { usdtogbp, formatMultiPrice } = PriceFormat();
    const [cartamount, setcartamount] = useState(null);

    const gbpprice = usdtogbp(item.price, "GBP");

    const [close, setClose] = useState(action);
    const [is_cart, setIs_cart] = useState(item && item?.is_cart);
    const ItemAdded = (e) => {
        if (e == "added") {
            setIs_cart(true);
        }
        if (e == "removed") {
            setIs_cart(false);
        }
        setClose(false);
    };

    useEffect(() => {
        setClose(action);
        return () => {
            setSub("onetime");
        };
    }, [action]);

    const getPercentage = (actual, paid) => {
        const r = (paid / actual) * 100;
        return r.toFixed(1);
    };

    const gotologin = (recure) => {
        errorAlert("For larger payments more than £50 need to login  first.");
        const url = `/wish/checkout/${item.uuid}/${recure ? recure : ""}`;
        router.visit(`/login?redirect=${url}&message=Larger payments more than £50 need to login.`);
    };
    const processingFee = (item?.price||0) * (window.platformFeePercentage || 20) / 100;

    return (
        <Popup
            size="md"
            action={close} space='p-0'
            modalclassName="pinkmodal"
            classes="d-none" >
           
            <div className="bannerrr !rounded-none p-4">
                
                <div className="flex items-center mb-4">
                    <div className="h-[100px] bg-gray-200 rounded-xl border !border-gray-200 overflow-hidden w-[100px]">
                        <img
                            src={item.perma_link ? item.perma_link : uploadedimg}
                            alt="img" className="max-h-[100px] w-full object-cover"
                        />
                    </div>
                    <div className="ps-3">
                        <div className="text-xl font-bold line-clamp-2 ">{item.wishname}</div>
                        <div className="cartPrice font-CeraGRBold text-voilet mt-1 text-center">
                            {IsloggedIn ?
                                <>
                                    {formatMultiPrice(item.price, item?.currency || 'USD')}
                                </> :
                                <>
                                    {formatMultiPrice((parseInt(item.price)+parseInt(processingFee || 0)), item?.currency || 'USD', 'adminfee')}
                                </>
                            }
                        </div>
                    </div>
                </div>


                {item.subscription == "2" ? (
                    <>
                        <p className="mb-0">Amount </p>
                        <div className="croud-add  global-currency-wrap ">
                            <div className="global-currency">
                                {currency || "GBP"}
                            </div>
                            <input
                                onChange={(e) => setcartamount(e.target.value)}
                                placeholder={`Eg. 50`}
                                type="number"
                                className="form-control mt-1"
                            />
                        </div>
                        <div className="crowd pt-2 mb-4">
                            <ProgressBar
                                now={formatMultiPrice(
                                    item.fullfill_amount,
                                    item?.currency || "GBP"
                                )}
                                max={formatMultiPrice(
                                    item.price,
                                    item?.currency || "GBP"
                                )}
                            />
                            <div className="flex items-center justify-between">
                                <p className="mt-1 mb-0 text-small">
                                    {getPercentage(
                                        item.price,
                                        item.fullfill_amount
                                    )}
                                    % granted
                                </p>
                                <p className="mt-1 mb-0 text-small">
                                    Remaining{" "}
                                    {formatMultiPrice(
                                        item.price - item.fullfill_amount,
                                        item?.currency || "GBP"
                                    )}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    ""
                )}
                {item.subscription == 1 ? (
                    <>
                    <div className=" pb-2">
                        <Link
                            className="btn-pink lg2 block text-center !w-full "
                            href={route("wish.subscribe.checkout", {uuid: item.uuid,reccure: "onetime"})}>OneTime Purchase
                        </Link>
                        <Link
                            className="btn-pink mt-2 mb-2 lg2 block text-center !w-full"
                            href={route("wish.subscribe.checkout", {uuid: item.uuid})}>
                            Pay Every
                            {item.subscription_period == "daily"? " Day": ""}
                            {item.subscription_period == "weekly"? " Week": ""}
                            {item.subscription_period == "monthly"? " Month": ""}
                        </Link>
                        <p className="text-center">
                            Gain access to my exclusive subscriber
                            only posts
                        </p>
                    </div>
                    {/* {auth?.user?.username || parseInt(gbpprice) < 51 ? (
                        <>
                            <div className=" pb-2">
                                <Link
                                    className="btn-pink lg2 block text-center !w-full "
                                    href={route("wish.subscribe.checkout", {
                                        uuid: item.uuid,
                                        reccure: "onetime",
                                    })}
                                >
                                    OneTime Purchase
                                </Link>
                                <Link
                                    className="btn-pink mt-2 mb-2 lg2 block text-center !w-full"
                                    href={route("wish.subscribe.checkout", {
                                        uuid: item.uuid,
                                    })}
                                >
                                    Pay Every{" "}
                                    {item.subscription_period == "daily"
                                        ? " Day"
                                        : ""}
                                    {item.subscription_period == "weekly"
                                        ? " Week"
                                        : ""}
                                    {item.subscription_period == "monthly"
                                        ? " Month"
                                        : ""}
                                </Link>
                                <p className="text-center">
                                    Gain access to my exclusive subscriber
                                    only posts
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className=" pb-2">
                                <button
                                    className="btn-pink mt-2 mb-2 lg2 block text-center !w-full"
                                    onClick={() => gotologin("onetime")}>OneTime Purchase
                                </button>
                                <button
                                    className="btn-pink mt-2 mb-2 lg2 block text-center !w-full"
                                    onClick={() => gotologin()}>
                                    Pay Every
                                    {item.subscription_period == "daily"? " Day": ""}
                                    {item.subscription_period == "weekly"? " Week": ""}
                                    {item.subscription_period == "monthly"? " Month": ""}
                                </button>
                                <p className="text-center">
                                    Gain access to my exclusive subscriber
                                    only posts
                                </p>
                            </div>
                        </>
                    )} */}
                    </>
                ) : (
                    <div className=" pb-2">

                        <ToCart
                            currency={currency}
                            sub={sub}
                            ItemAdded={ItemAdded}
                            auth={auth}
                            pending={item.price - item.fullfill_amount}
                            crowd={item.subscription == 2}
                            amount={cartamount}
                            item={item}
                            isEqual={item.price <= item.fullfill_amount}
                            is_cart={is_cart}
                            text={`Add To Cart And Keep Shopping`}
                            classes={`btn-pink mt-2 mb-2 lg2 block text-center !w-full ${item.subscription == "2" &&item.price <= item.fullfill_amount? "d-none": ""}`}
                            uuid={uuid}
                        />
                        <ToCart
                            currency={currency}
                            sub={sub}
                            auth={auth}
                            ItemAdded={ItemAdded}
                            pending={item.price - item.fullfill_amount}
                            crowd={item.subscription == 2}
                            amount={cartamount}
                            item={item}
                            isEqual={item.price <= item.fullfill_amount}
                            is_cart={is_cart}
                            text={`Add To Cart And Checkout`}
                            checkoutbtn={true}
                            classes={`btn-pink mt-2 mb-2 lg2 block text-center !w-full ${item.subscription == "2" &&item.price <= item.fullfill_amount? "d-none": ""}`}
                            uuid={uuid}
                        />
                    </div>
                )}

                {item.user ? (
                    <Link 
                        onClick={() => trackSearchClick(item?.user?.id, item?.user?.username)}
                        href={`/${item.user && item.user.username}`}
                        className="m-auto d-table text-primary"
                    >
                        See All {item.user && item.user.name}'s Wishes
                    </Link>
                ) : (
                    ""
                )}
            </div>
        </Popup>
    );
}
