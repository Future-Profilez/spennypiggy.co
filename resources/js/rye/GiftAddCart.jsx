import React from "react";
import giftimg from "../../assets/img/giftimg.jpg";
const Popup = React.lazy(() => import('@/Components/Popup'));
// import ToCart from "./ToCart";
// import uploadedimg from "../../assets/img/uploadedimg.png";
// import ProgressBar from "react-bootstrap/ProgressBar";
import { useState } from "react";
import { useEffect } from "react";
import PriceFormat from "@/includes/PriceFormat";
import { Link, router } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
export default function GiftAddCart({data, action}) {
    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const { format , formatMultiPrice} = PriceFormat();
    const [cartamount, setcartamount] = useState(null);
    const [close, setClose] = useState(action);
    const[loading, setLoading] = useState(false);
    // const [is_cart, setIs_cart] = useState(item && item?.is_cart);

    // const ItemAdded = (e) => {
    //     if(e == 'added'){
    //         setIs_cart(true);
    //     }
    //     if(e == 'removed'){
    //         setIs_cart(false);
    //     }
    //     setClose(false);
    // }

    useEffect(() => {
        setClose(action);
    }, [action]);

    // const getPercentage = (actual, paid) => {
    //     const r = (paid/actual)*100;
    //     return r.toFixed(1);
    // }

    // const gotologin = (recure) => { 
    //     successAlert("You must login first.");
    //     const url = `/wish/checkout/${item.uuid}/${recure ? recure : ''}`
    //     router.visit(`/login?redirect=${url}`);
    // }

    return (
        <Popup size="md"
            action={close}
            modalclassName="pinkmodal"
            classes="d-none" >
            <div className="addCartModalHead rounded-3xl relative ">
                <h2 className="font-GillSans text-bl uppercase pt-8 text-lg relative z-1 px-3 text-center"> Add to Cart </h2>
            </div>
            <div className="cartModimg absolute left-0 top-0">
                <img src={giftimg} alt="img" />
            </div>
            <div className="bannerrr p-4">
                <div className="cartbanner">
                    <img src={data?.images[0]?.url} alt="img" />
                </div>
                <div className="cartTitle text-center line-clamp-2">{data?.title}</div>
                <div className="cartPrice font-CeraGRBold text-voilet mt-1 mb-3 text-center">
                    {data.price.displayValue}
                </div>                
                <div className=" pb-2">
                    <LoaderButton
                      disabled={loading}
                    //   onClick={() => addtocart(1)}
                      className={`flex btn-pink lg w-100 mb-3 font-CeraGR mx-auto`}
                      spinnerClassName="fill-red-600"
                    >
                    {loading ? "Processing" : "Add to Cart"}
                    </LoaderButton>
                    <LoaderButton
                      disabled={loading}
                    //   onClick={() => addtocart(1)}
                      className={`flex btn-pink lg w-100 mb-3 font-CeraGR mx-auto`}
                      spinnerClassName="fill-red-600"
                    >
                    {loading ? "Processing" : "Add To Cart And Checkout"}
                    </LoaderButton>
                </div>
            </div>
        </Popup>
    );
}
