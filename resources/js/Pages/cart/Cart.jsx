import React from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import UserCarts from "../cart/UserCarts";
import Nocontent from "@/includes/Nocontent";
import { Head } from "@inertiajs/react";

export default function Cart(props) {

    const { auth, user } = props;
    const [cartsItems, setCartItems] = useState(props.carts);
 
    return (
        <>
            <Authenticated auth={auth.user} user={user} >
                <Head title={"My Cart"} />
                <div className=" blackbg">
                    <div className="container pb-5 ">
                        <h2 className="text-bl font-GillSans pt-5 pt-3 pb-0 text-center text-2xl uppercase text-white">Cart</h2>
                        {cartsItems && cartsItems.length ?
                            <>{cartsItems.map((c, i) => {
                                return <UserCarts key={i} data={c} />
                            })}</>
                            : <> 
                            <div className="p-5 text-center" >
                                <div className="containerbox" >
                                <Nocontent text={"Cart is empty."}  />
                                </div>
                            </div> 
                        </>
                        }
                    </div>
                </div>
            </Authenticated>
        </>
    );
}
