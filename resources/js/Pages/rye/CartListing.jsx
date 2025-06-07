import React from "react";
import { useEffect } from "react";
import Axios from "axios";
import { useState } from "react";
import { usePage } from "@inertiajs/react";
import LoadingScreen from "@/includes/LoadingScreen";
import Nocontent from "@/includes/Nocontent";
import CartItems from "./CartItems";
import { use } from "react";

export default function CartListing({ryeItems, fetchRyeItems, loading}) {
    
    const {auth} = usePage().props;

    return (
        <div className="blackbg">
            <div className="container pb-5 ">
                <h2 className="text-bl font-GillSans pt-5 pt-3 pb-0 text-center text-2xl uppercase text-white">
                    Gift Items
                </h2>
                {loading ? <LoadingScreen /> : ""}
                {!loading && (
                    <>
                        {ryeItems && ryeItems.length>0 ? (
                            <>
                                {ryeItems?.map((c, i) => {
                                    let data=JSON.parse(c.cart_details);
                                    return (
                                        <CartItems
                                            // auth={auth && auth.user}
                                            // key={`user-cart-${i}`}
                                            fetchCartItem={fetchRyeItems}
                                            cartsItems={c}
                                            data={data}
                                            auth={auth}
                                        />
                                    );
                                })}
                            </>
                        ) : (
                            ''
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
