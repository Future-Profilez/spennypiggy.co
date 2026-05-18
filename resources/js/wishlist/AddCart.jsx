import { useState, lazy, useEffect } from "react";
import ToCart from "./ToCart";
import uploadedimg from "../../assets/img/uploadedimg.png";
import CustomProgressBar from "../Components/CustomProgressBar";
const Popup = lazy(() => import("@/Components/Popup"));
import PriceFormat from "@/includes/PriceFormat";
import { Link, router, usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import { trackSearchClick } from "@/includes/Analytics";

export default function AddCart(props) {
    const {  action, uuid, item, currency, showall, IsloggedIn } = props;
    const { auth, card_capabilities, platform_fee_percentage, transaction_fee_percentage } = usePage().props;
    const [sub, setSub] = useState("daily");
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { usdtogbp, formatMultiPrice, adminFeeInCurrency, calculateTotalSupporterPays } = PriceFormat();
    const [cartamount, setcartamount] = useState(null);

    const gbpprice = usdtogbp(item.price, "GBP");

    const isCreator = auth?.user?.id === item?.user_id;

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

    return (
        <Popup
            size="md"
            action={close} space='p-0'
            modalclass="pinkmodal"
            classes="hidden" >
           
            <div className="!rounded-none p-4">
                
                <div className="items-center mb-4">
                    <div className="m-auto h-[150px] max-w-[200px] flex justify-center items-center bg-gray-200 rounded-[15px]  border !border-gray-200 overflow-hidden">
                        <img
                            src={item.perma_link ? item.perma_link : uploadedimg}
                            alt="img" className="h-full w-full object-cover"
                        />
                    </div>
                    <div className="pt-4">
                        <div className="text-center text-xl font-bold line-clamp-2 ">{item.wishname}</div>
                        <div className="cartPrice text-center font-CeraGRBold text-violet-600 mt-1">
                            {IsloggedIn ? (
                                <>
                                    {formatMultiPrice(item.price, item?.currency || 'USD')}
                                </>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <span>
                                        {formatMultiPrice(
                                            calculateTotalSupporterPays(
                                                (parseFloat(item.price || 0) * (1 + (item?.user?.vat_amount_percentage || 0) / 100)), 
                                                item?.currency || 'USD'
                                            ).total_supporter_pays, 
                                            item?.currency || 'USD'
                                        )}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-normal mt-1 leading-tight">
                                        *Includes platform and payment processing fees. You will be charged in {item?.currency || 'USD'}.
                                    </span>
                                </div>
                            )}
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
                                className="block w-full rounded-[30px]  border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 mt-1"
                            />
                        </div>
                        <p className="text-[10px] text-gray-500 font-normal mt-1 leading-tight">
                            *Includes platform and payment processing fees. You will be charged in {item?.currency || 'USD'}. Amounts shown in {currency || 'GBP'} are estimates.
                        </p>
                        <div className="crowd pt-2 mb-4">
                            <CustomProgressBar
                                now={item.fullfill_amount}
                                max={item.price}
                            />
                            <div className="flex items-center justify-between">
                                <p className="mt-1 mb-0 text-sm">
                                    {getPercentage(
                                        item.price,
                                        item.fullfill_amount
                                    )}
                                    % granted
                                </p>
                                <p className="mt-1 mb-0 text-sm">
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
                        {card_capabilities === false ? (
                             <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-[30px] ">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-700">
                                            This creator cannot receive payments at the moment.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        <Link
                            className={`btn-pink lg2 block text-center !w-full ${card_capabilities === false ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                            href={card_capabilities === false ? '#' : route("wish.subscribe.checkout", {uuid: item.uuid,reccure: "onetime"})}>OneTime Purchase
                        </Link>
                        <Link
                            className={`btn-pink mt-2 mb-2 lg2 block text-center !w-full ${card_capabilities === false ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                            href={card_capabilities === false ? '#' : route("wish.subscribe.checkout", {uuid: item.uuid})}>
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
                            classes={`button-pink btn-shadow shadow-[4px_4px_0px_0px_#FF007F]lack !rounded-full !border-0 mt-2 mb-2 lg2 block text-center !w-full ${item.subscription == "2" &&item.price <= item.fullfill_amount? "hidden": ""}`}
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
                            classes={`button-pink btn-shadow shadow-[4px_4px_0px_0px_#FF007F]lack !rounded-full !border-0 mt-2 mb-2 lg2 block text-center !w-full ${item.subscription == "2" &&item.price <= item.fullfill_amount? "hidden": ""}`}
                            uuid={uuid}
                        />
                    </div>
                )}

                {item.user ? (

                    <div className="flex py-3 justify-center">
                        <Link onClick={() => trackSearchClick(item?.user?.id, item?.user?.username)}
                        href={`/${item.user && item.user.username}`}
                        className="mx-auto block text-blue-600" >
                            See All {item.user && item.user.name}'s Wishes
                        </Link>
                    </div>
                ) : (
                    ""
                )}
            </div>
        </Popup>
    );
}
