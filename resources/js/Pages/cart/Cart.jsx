import React from "react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import UserCarts from "./UserCarts";

export default function Cart(props) {

    console.log("props", props);

    const [cartsItems, setCartItems] = useState(props.carts);

    return (
        <>
        <Authenticated>
            <div className="container">
                <h2 className="text-bl font-GillSans pt-5 py-3   text-center text-2xl uppercase">Cart</h2>
                {/* {cartsItems && cartsItems.map((c, i)=> { 
                    return <UserCarts key={i} data={v} />
                })} */}
                <UserCarts  />
            </div>
        </Authenticated>
        </>
    );
}
