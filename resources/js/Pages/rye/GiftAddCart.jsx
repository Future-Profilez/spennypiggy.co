import React from "react";
import giftimg from "../../../assets/img/giftimg.jpg";
const Popup = React.lazy(() => import("@/Components/Popup"));
// import ToCart from "./ToCart";
// import uploadedimg from "../../assets/img/uploadedimg.png";
// import ProgressBar from "react-bootstrap/ProgressBar";
import { useState } from "react";
import { useEffect } from "react";
import PriceFormat from "@/includes/PriceFormat";
import { Link, router } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
import { RyeClient, ENVIRONMENT, Marketplace } from "@rye-api/rye-sdk";
import axios from "axios";

export default function GiftAddCart({ data, action, user, IsloggedIn }) {
    // console.log("user", user?.id);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    // console.log("data",data);

    const { format, formatMultiPrice } = PriceFormat();
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

    const addtocart = async (navigate=false) => {
        {navigate ? setCheckoutLoading(true) : setLoading(true)}
        try {
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

            console.log("data.id", data.id);

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
                        // buyerIdentity: {
                        //     firstName: 'John',
                        //     lastName: 'Doe',
                        //     email: 'johndoe@example.com',
                        //     phone: '+1 212-555-1234', // US phone number format
                        //     address1: '1600 Amphitheatre Parkway',
                        //     address2: 'Suite 100', // Optional
                        //     city: 'Mountain View',
                        //     provinceCode: 'CA', // US state code (California)
                        //     countryCode: 'US', // US country code
                        //     postalCode: '94043', // US ZIP code format
                        //   },
                    },
                });
            }
            console.log("resultss", resultss);
            const addCart = await axios.post(route("create.cart"), {
                data: resultss, // Pass productData as the request body
                cart_id: resultss.cart.id, // Pass productData as the request body
                creator_id: user?.id,
            });
            console.log("addCart:", addCart);
            successAlert(addCart?.data?.message);
            setClose(false);
            console.log("navigate",navigate);
            {navigate && router.visit("cart")}
            {navigate ? setCheckoutLoading(false) : setLoading(false)}
        } catch (error) {
            console.log(error);
            {navigate ? setCheckoutLoading(false) : setLoading(false)}
        }
    };

    return (
        <Popup
            size="md"
            action={close}
            modalclassName="pinkmodal"
            classes="d-none"
        >
            <div className="addCartModalHead rounded-3xl relative ">
                <h2 className="font-GillSans text-bl uppercase pt-8 text-lg relative z-1 px-3 text-center">
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
                    {data.price.displayValue}
                </div>
                <div className=" pb-2">
                    <LoaderButton
                        disabled={loading}
                        onClick={() => addtocart(false)}
                        className={`flex btn-pink lg w-100 mb-3 font-CeraGR mx-auto`}
                        spinnerClassName="fill-red-600"
                    >
                        {loading ? "Processing" : "Add to Cart"}
                    </LoaderButton>
                    <LoaderButton
                        // disabled={checkoutloading(true)}
                          onClick={() => addtocart(true)}
                        className={`flex btn-pink lg w-100 mb-3 font-CeraGR mx-auto`}
                        spinnerClassName="fill-red-600"
                    >
                        {checkoutloading
                            ? "Processing"
                            : "Add To Cart And Checkout"}
                    </LoaderButton>
                </div>
            </div>
        </Popup>
    );
}
