import React from "react";
import giftimg from "../../assets/img/giftimg.jpg";
import Popup from "@/Components/Popup";
import ToCart from "./ToCart";
import uploadedimg from "../../assets/img/uploadedimg.png";
import { Link } from "@inertiajs/react";
import DirectCheckout from "./DirectCheckout";
import ProgressBar from "react-bootstrap/ProgressBar";
import { useState } from "react";

export default function AddCart(props) {
    const { auth, action, uuid, item } = props;
    const [cartamount, setcartamount] = useState(null);

    console.log("props addCard", props);

    const getPercentage = (actual, paid) => { 
        const r = (paid/actual)*100;
        console.log("add percentage", r);
        return r.toFixed(1);
    }

    return (
        <Popup
            size="md"
            action={action}
            modalclass="pinkmodal"
            classes="d-none"
        >
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
                    £ {item.price}
                </div>

                {item.subscription == "2" ? (
                    <>
                        <p className="mb-0">Amount </p>
                        <div className="croud-add">
                            <input
                                onChange={(e) => setcartamount(e.target.value)}
                                placeholder="£ eg. 50"
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
                                    )}
                                    % granted
                                </p>
                                <p className="mt-1 mb-0 text-small">
                                    Remaining £
                                    {item.price - item.fullfill_amount}
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    ""
                )}

                <div className=" pb-2">
                    {auth ? (
                        <>
                            <ToCart
                                pending={item.price - item.fullfill_amount}
                                crowd={item.subscription == 2}
                                amount={cartamount}
                                is_cart={item?.is_cart}
                                text={`Add to cart`}
                                classes="btn-pink lg w-100 mb-3 font-CeraGR"
                                uuid={uuid}
                            />
                            <Link
                                href={route("cart")}
                                className="text-pink font-CeraGR text-center m-auto d-table"
                            >
                                {" "}
                                View Cart
                            </Link>
                        </>
                    ) : (
                        <DirectCheckout item={item} amount={cartamount} />
                    )}
                </div>
            </div>
        </Popup>
    );
}
