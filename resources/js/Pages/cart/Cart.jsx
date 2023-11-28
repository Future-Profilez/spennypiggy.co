import React from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import UserCarts from "../cart/UserCarts";
import Nocontent from "@/includes/Nocontent";
import { Head } from "@inertiajs/react";
import { useSelector } from "react-redux";
import { useEffect } from "react";
import CartTransform from "@/includes/CartTransform";

export default function Cart(props) {

    const {transform} = CartTransform();
    const { auth, user } = props;
    const [cartsItems, setCartItems] = useState(props.carts);
    const cartData = useSelector(state => state.data.cart.cart);
 
    const loggedInUserId = 2; 

    useEffect(()=>{
        if(cartData && cartData.length){
            const data = transform(cartData, loggedInUserId);
            localStorage.setItem('cart',JSON.stringify(data));
            setCartItems(data);
        } else {
            const local_data = localStorage && localStorage.getItem('cart');
            console.log("local_data",local_data)
            setCartItems(JSON.parse(local_data));
        }
    },[cartData]);

    return (
            <Authenticated auth={auth.user} user={user}>
                <Head title={"My Cart"} />
                <div className=" blackbg">
                    <div className="container pb-5 ">
                        <h2 className="text-bl font-GillSans pt-5 pt-3 pb-0 text-center text-2xl uppercase text-white">Cart</h2>
                        {cartsItems && cartsItems.length ? (
                            <>
                                {cartsItems.map((c, i) => {
                                    return <UserCarts auth={auth && auth.user} key={i} data={c} />;
                                })}
                            </>
                        ) : (
                            <>
                                <div className="py-5 text-center">
                                    <div className="containerbox">
                                        <Nocontent  classes={`py-5`} text={"Cart is empty."} />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </Authenticated>
    );
}
