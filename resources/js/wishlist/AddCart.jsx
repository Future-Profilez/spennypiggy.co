import React from "react";
import giftimg from "../../assets/img/giftimg.jpg";
import Popup from "@/Components/Popup";
import ToCart from "./ToCart";
import uploadedimg from "../../assets/img/uploadedimg.png";
import DirectCheckout from "./DirectCheckout";
import ProgressBar from "react-bootstrap/ProgressBar";
import { useState } from "react";
import { useEffect } from "react";
import PriceFormat from "@/includes/PriceFormat";

export default function AddCart(props) {
    
    const { format } = PriceFormat();
    const { auth, action, uuid, item, IsloggedIn } = props;
    const [cartamount, setcartamount] = useState(null);
    const [close, setClose] = useState(action);
    const [is_cart, setIs_cart] = useState(item && item?.is_cart);

    const ItemAdded = (e) => { 
        if(e == 'added'){
            setIs_cart(true);
        }
        if(e == 'removed'){
            setIs_cart(false);
        }
        setClose(false);
    }

    useEffect(()=>{
        setClose(action);
    },[action])

    const getPercentage = (actual, paid) => { 
        const r = (paid/actual)*100;
        return r.toFixed(1);
    }

    const price = () => { 
        if(!IsloggedIn && item.subscription !== 2){
            const p = (+item.price) + (+item.tax_amount)
            return p
        } else { 
          return item.price
        }
    };

    const checkoutnow = () => { 
        window.location = '/cart';
    }
   
    return (
        <Popup
            size="md"
            action={close}
            modalclass="pinkmodal"
            classes="d-none" >
            <div className="addCartModalHead rounded-3xl relative shadow-pink">
                <h2 className="font-GillSans text-bl uppercase pt-8 text-lg relative z-1 px-3 text-center">
                    Add to Cart
                </h2>
            </div>
            <div className="cartModimg absolute left-0 top-0">
                <img src={giftimg} alt="img" />
            </div>
            <div className="bannerrr p-4">
                <div className="cartbanner">
                    <img
                        src={item.perma_link ? item.perma_link : uploadedimg}
                        alt="img"
                    />
                </div>
                <div className="cartTitle text-center">{item.wishname}</div>
                <div className="cartPrice font-CeraGRBold text-voilet mt-1 mb-3 text-center">
                    {format(price())}
                </div>

                {item.subscription == "2" ? (
                    <>
                        <p className="mb-0">Amount </p>
                        <div className="croud-add">
                            <input
                                onChange={(e) => setcartamount(e.target.value)}
                                placeholder="Eg. 50"
                                type="number" 
                                className="form-control mt-1"
                            />
                        </div>
                        <div className="crowd pt-2 mb-4">
                            <ProgressBar
                                now={item.fullfill_amount}
                                max={item.price}
                            />
                            <div className="d-flex align-items-center justify-content-between">
                                <p className="mt-1 mb-0 text-small">
                                    {getPercentage(
                                        item.price,
                                        item.fullfill_amount
                                    )}% granted
                                </p>
                                <p className="mt-1 mb-0 text-small">
                                    Remaining  {format(item.price - item.fullfill_amount)}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    ""
                )}

                <div className=" pb-2">
                    <ToCart ItemAdded={ItemAdded}  auth={auth} 
                        pending={item.price - item.fullfill_amount}
                        crowd={item.subscription == 2}
                        amount={cartamount} 
                        item={item}
                        isEqual={item.price <= item.fullfill_amount}
                        is_cart={is_cart}
                        text={`Add To Cart And Keep Shopping`}
                        classes={`btn-pink lg w-100 mb-3 font-CeraGR ${item.subscription == "2" && item.price <= item.fullfill_amount ? 'd-none' : '' }`}
                        uuid={uuid}
                    />
                    <ToCart auth={auth} 
                        ItemAdded={ItemAdded}
                        pending={item.price - item.fullfill_amount}
                        crowd={item.subscription == 2}
                        amount={cartamount} 
                        item={item}
                        isEqual={item.price <= item.fullfill_amount}
                        is_cart={is_cart}
                        text={`Add To Cart And Checkout`}
                        checkoutbtn={true}
                        classes={`btn-pink lg w-100 mb-3 font-CeraGR ${item.subscription == "2" && item.price <= item.fullfill_amount ? 'd-none' : '' }`}
                        uuid={uuid}
                    />
                </div>
            </div>
        </Popup>
    );
}
