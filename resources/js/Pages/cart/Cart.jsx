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
                    <h2 className="text-bl font-GillSans pt-5 py-3 text-center text-2xl uppercase">
                        Cart
                    </h2>
                    {cartsItems && cartsItems.length ? (
                        <>
                            {cartsItems.map((c, i) => {
                                return <UserCarts key={i} data={c} />;
                            })}
                        </>
                    ) : (
                        <>
                            {" "}
                            <div className="p-5 text-center">
                                <h2 className="py-5 my-5">Nothing to show.</h2>
                            </div>{" "}
                        </>
                    )}
                </div>
            </Authenticated>
        </>
    );
}
