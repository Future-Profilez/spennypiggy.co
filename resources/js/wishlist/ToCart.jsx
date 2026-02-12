import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import DeviceID from "@/includes/DeviceID";
import { useDispatch, useSelector } from "react-redux";
import { add_to_cart } from "@/Pages/redux/UserSlice";
import { router, usePage } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";

export default function ToCart({
    sub,
    surprise_amount,
    surprise_message,
    owner,
    actionfrom,
    checkoutbtn,
    ItemAdded,
    item,
    crowd,
    pending,
    uuid,
    text,
    classes,
    custom,
    removeItem,
    type,
    is_cart,
    amount,
    isEqual,
}) {
    const deviceID = DeviceID();
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const cart = useSelector((state) => state.data.cart.cart);
    const {auth, card_capabilities} = usePage().props;
    const { usdtogbp } = PriceFormat();
    const gbpprice = usdtogbp(item.price);
    function check() {
            if (checkoutbtn) {
                window.location = "/cart";
            }
        }
        
    const addtocart = async () => {
       
        if (card_capabilities === false) {
            errorAlert("This creator cannot receive payments at the moment.");
            return false;
        }

        // Uncomment if you want to enforce login for payments over £50 for anonymous users
        // if(!auth?.user && gbpprice > 50){
        //     router.visit(`/login?redirect=${window.location.pathname}&message=Larger payments more than £50 need to login.`);
        //     errorAlert("You must login first.");
        //     return false;
        // }

        
        if (item && item.subscription == "2" && isEqual) {
            toast.error(`Wish item funding is completed.`);
            return false;
        }
        if (!item?.is_cart && crowd && !amount) {
            toast.error(`Please enter a amount to gift this item.`);
            return false;
        }

        // if (crowd && amount > pending) {
        //     toast.error(`Amount can not be more than remaining amount.`);
        //     return false;
        // }
        setLoading(true);
        axios.get(`/add-to-cart/${uuid}/${deviceID}${sub ? `/${sub}` : "/onetime"}${amount ? `/${amount}/` : ""}`)
            .then((resp) => {
                if (resp.data.success) {
                    if (resp.data.added == true) {
                        successAlert(resp.data.msg);
                        ItemAdded && ItemAdded("added");
                        
                        // Refresh cart items, rye items, and cart counter
                        if (typeof window !== 'undefined') {
                            if (window.refreshCartItems) {
                                setTimeout(() => {
                                    window.refreshCartItems();
                                }, 500); // Small delay to ensure backend has processed the addition
                            } else {
                                console.warn("window.refreshCartItems function not found - Cart component may not be loaded");
                            }
                            if (window.refreshRyeItems) {
                                setTimeout(() => {
                                    window.refreshRyeItems();
                                }, 500);
                            } else {
                                console.warn("window.refreshRyeItems function not found - Cart component may not be loaded");
                            }
                            if (window.refreshCartCounter) {
                                setTimeout(() => {
                                    window.refreshCartCounter();
                                }, 100); // Refresh counter immediately
                            } else {
                                console.warn("window.refreshCartCounter function not found - Header component may not be loaded");
                            }
                        }
                        
                        check();
                    } else {
                        successAlert(resp.data.msg);
                    }
                    if (resp.data.uuid) {
                        removeItem && removeItem(uuid);
                    }
                } else {
                    errorAlert(resp.data.msg);
                }
                setLoading(false);
            })
            .catch((_err) => {
                console.error("error", _err);
                setLoading(false);
                errorAlert("Something went wrong !!.");
            });
    };

    return (
        <>
            {custom ? (
                <div onClick={addtocart}>{custom}</div>
            ) : (
                <LoaderButton
                    disabled={loading}
                    onClick={() => addtocart(1)}
                    className={` ${classes} p w-full flex mx-auto`}
                    spinnerclass="fill-red-600"
                >
                    {loading ? "Processing" : text}
                </LoaderButton>
            )}
        </>
    );
}
