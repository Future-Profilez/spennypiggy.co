import React from "react";
import { useEffect } from "react";
import Axios from "axios";
import { useState } from "react";
import { usePage } from "@inertiajs/react";
import LoadingScreen from "@/includes/LoadingScreen";
import Nocontent from "@/includes/Nocontent";
import CartItems from "./CartItems";

export default function CartListing() {
    const { auth, user } = usePage().props;
    const [cartsItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const fetchCartItem = (e) => {
        setLoading(true);
        Axios.get(`get-cart-details`)
            .then((resp) => {
                if(resp?.data?.status){
                    // console.log(JSON.parse(resp?.data?.data[0]?.cart_details));
                    setCartItems(resp.data.data);
                }
                else{
                    setCartItems([]);
                }
                setLoading(false);
            })
            .catch((_err) => {
                console.error("error", _err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (auth) {
        fetchCartItem();
        }
    }, []);
    // console.log("user",user);
    // console.log("cartsItems", cartsItems);
    return (
        <div className="blackbg">
            <div className="container pb-5 ">
                <h2 className="text-bl font-GillSans pt-5 pt-3 pb-0 text-center text-2xl uppercase text-white">
                    Gift Items
                </h2>
                {loading ? <LoadingScreen /> : ""}
                {!loading && (
                    <>
                        {cartsItems && cartsItems.length>0 ? (
                            <>
                                {cartsItems?.map((c, i) => {
                                    console.log("c",c);
                                    let data=JSON.parse(c.cart_details);
                                    return (
                                        <CartItems
                                            // auth={auth && auth.user}
                                            // key={`user-cart-${i}`}
                                            fetchCartItem={fetchCartItem}
                                            cartsItems={c}
                                            data={data}
                                        />
                                    );
                                })}
                            </>
                        ) : (
                            <>
                                <div className="py-5 text-center">
                                    <div className="containerbox">
                                        <Nocontent
                                            classes={`py-5`}
                                            text={"Cart is empty."}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
