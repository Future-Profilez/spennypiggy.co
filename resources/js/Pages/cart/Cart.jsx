import React from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import { Head } from "@inertiajs/react";
import DeviceID from "@/includes/DeviceID";
import { useEffect } from "react";
import Axios from "axios";
import CartListing from "../rye/CartListing";
const UserCarts = React.lazy(() => import('../cart/UserCarts'));
const LoadingScreen = React.lazy(() => import('@/includes/LoadingScreen'));
const Nocontent = React.lazy(() => import('@/includes/Nocontent'));

export default function Cart(props) {

    console.log("cart props", props);
    const deviceid = DeviceID();
    const { auth, user, carts } = props;
    const [ cartsItems, setCartItems ] = useState(carts);
    const [loading, setLoading]= useState(false);
    const fetchCartItem = (e) => {
        setLoading(true);
        Axios.get(`anonymous-cart/${deviceid}`).then(resp => {
            setCartItems(resp.data.carts);
            setLoading(false);
        }).catch(_err => {
            console.error("error", _err);
            setLoading(false);
        });
    };

    useEffect(()=>{
        if(auth && !auth.user){
            fetchCartItem();
        }
    },[]);

    return (
        <Authenticated auth={auth.user} user={user}>
            <Head title={"Cart"} />
            <CartListing/>
            <div className="blackbg">
                <div className="container pb-5 ">
                    <h2 className="text-bl font-GillSans pt-5 pt-3 pb-0 text-center text-2xl uppercase text-white">Cart</h2>
                    {loading ? <LoadingScreen /> : ""}
                    {!loading && <>
                        { cartsItems && cartsItems.length ? <>
                                {cartsItems.map((c, i) => {
                                    return <UserCarts  auth={auth && auth.user} key={`user-cart-${i}`} data={c} />;
                                })}
                            </>
                            : (
                            <>
                                <div className="py-5 text-center">
                                    <div className="containerbox">
                                        <Nocontent  classes={`py-5`} text={"Cart is empty."} />
                                    </div>
                                </div>
                            </>
                        )}
                    </>}
                </div>
            </div>

        </Authenticated>
    );
}
