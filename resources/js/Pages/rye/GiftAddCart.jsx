import { useState, useEffect } from "react";
import giftimg from "../../../assets/img/giftimg.jpg";

// Lazy-loaded components
const Popup = lazyRetry(() => import("@/Components/Popup"));
import PriceFormat from "@/includes/PriceFormat";
import { Link, router } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
import { RyeClient, ENVIRONMENT, Marketplace } from "@rye-api/rye-sdk";
import axios from "axios";
import lazyRetry from "@/utils/lazyRetry";

export default function GiftAddCart({ data, action, user, IsloggedIn, auth }) {
    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const { format, formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const [cartamount, setcartamount] = useState(null);
    const [close, setClose] = useState(action);
    const [loading, setLoading] = useState(false);
    const [checkoutloading, setCheckoutLoading] = useState(false);

    useEffect(() => {
        setClose(action);
    }, [action]);

    const getShopperIp = async () => {
        try {
            const response = await fetch("https://api64.ipify.org?format=json");
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error("Error fetching shopper IP:", error);
            return "0.0.0.0"; // Fallback IP
        }
    };

    const gotologin = (recure) => {
            errorAlert("You must login first.");
            const url = `/${user?.username || ""}`
            router.visit(`/login?redirect=${url}`);
        }

    const addtocart = async (navigate=false) => {
        {navigate ? setCheckoutLoading(true) : setLoading(true)}
        try {
            if(auth && auth?.user === null)
                {
                    gotologin();
                    return;
                }
            const shopperIp = await getShopperIp();
            const ryeClient = new RyeClient({
                authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
                shopperIp: shopperIp,
                environment: ENVIRONMENT.STAGING,
            });

            const checkCartExist = await axios.get(
                route("check.cart.exist", user?.id)
            );

            let resultss;

            if (checkCartExist.data.status == true) {
                resultss = await ryeClient.addCartItems({
                    input: {
                        id: checkCartExist.data.cart_id,
                        items: {
                            amazonCartItemsInput: [
                                {
                                    quantity: 1,
                                    productId: data.id,
                                },
                            ],
                        },
                    },
                });
            } else {
                resultss = await ryeClient.createCart({
                    input: {
                        items: {
                            amazonCartItemsInput: [
                                {
                                    quantity: 1,
                                    productId: data.id,
                                },
                            ],
                        },
                        buyerIdentity: {
                            firstName: 'John',
                            lastName: 'Doe',
                            email: 'johndoe@example.com',
                            phone: '+1 212-555-1234', // US phone number format
                            address1: '1600 Amphitheatre Parkway',
                            address2: 'Suite 100', // Optional
                            city: 'Mountain View',
                            provinceCode: 'CA', // US state code (California)
                            countryCode: 'US', // US country code
                            postalCode: '94043', // US ZIP code format
                          },
                    },
                });
            }
            const addCart = await axios.post(route("create.cart"), {
                data: resultss, // Pass productData as the request body
                cart_id: resultss.cart.id, // Pass productData as the request body
                creator_id: user?.id,
            });
            if(addCart?.data?.status){
                successAlert(addCart?.data?.message);
                setClose(false);
                
                // Refresh cart items, rye items, and cart counter
                if (typeof window !== 'undefined') {
                    if (window.refreshCartItems) {
                        setTimeout(() => {
                            window.refreshCartItems();
                        }, 500);
                    }
                    if (window.refreshRyeItems) {
                        setTimeout(() => {
                            window.refreshRyeItems();
                        }, 500);
                    }
                    if (window.refreshCartCounter) {
                        setTimeout(() => {
                            window.refreshCartCounter();
                        }, 100); // Refresh counter immediately
                    }
                }
                
                {navigate && router.visit("cart")}
                {navigate ? setCheckoutLoading(false) : setLoading(false)}
            }
        else{
            errorAlert(response.data.message);
        }
        } catch (error) {
            console.log(error);
            {navigate ? setCheckoutLoading(false) : setLoading(false)}
        }
    };

    return (
        <Popup
            size="md"
            action={close}
            modalclass="pinkmodal"
            classes="hidden"
        >
            <div className="addCartModalHead rounded-box    relative ">
                <h2 className="font-GillSans text-bl uppercase pt-8 text-lg relative z-10 px-3 text-center">
                    {" "}
                    Add to Cart{" "}
                </h2>
            </div>
            <div className="cartModimg absolute left-0 top-0">
                <img src={giftimg} alt="img" />
            </div>
            <div className="bannerrr p-4">
                <div className="cartbanner">
                    <img src={data?.images[0]?.url} alt="img" />
                </div>
                <div className="cartTitle text-center line-clamp-2">
                    {data?.title}
                </div>
                <div className="cartPrice font-CeraGRBold text-voilet mt-1 mb-3 text-center">
                    <div className="flex flex-col items-center">
                        <span>
                            {formatMultiPrice(
                                calculateTotalSupporterPays(
                                    data.price.value / 100, 
                                    data.price.currency
                                ).total_supporter_pays, 
                                data.price.currency
                            )}
                        </span>
                        <span className="text-[12px] text-gray-500 font-normal mt-1 leading-tight">
                            *Includes platform and payment processing fees
                        </span>
                    </div>
                </div>
                <div className=" pb-2">
                    <LoaderButton
                        disabled={loading}
                        onClick={() => addtocart(false)}
                        className={`p w-full`}
                        spinnerclass="fill-red-600"
                    >
                        {loading ? "Processing..." : "Add to Cart"}
                    </LoaderButton>
                    <LoaderButton
                        disabled={checkoutloading}
                         onClick={() => addtocart(true)}
                        className={`p w-full`}
                        spinnerclass="fill-red-600"
                    >
                        {checkoutloading
                            ? "Processing..."
                            : "Add To Cart And Checkout"}
                    </LoaderButton>
                </div>
            </div>
        </Popup>
    );
}
