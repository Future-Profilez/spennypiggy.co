import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState, lazy, useCallback, useMemo } from "react";
import { Head } from "@inertiajs/react";
import DeviceID from "@/includes/DeviceID";
import { useEffect, useRef } from "react";
import Axios from "axios";
import CartListing from "../rye/CartListing";
import WhiteLoading from "@/includes/LoadingScreen";
const UserCarts = lazy(() => import("../cart/UserCarts"));
import { GiCardboardBox } from "react-icons/gi";

export default function Cart(props) {
    const deviceid = useMemo(() => DeviceID(), []);
    const { auth, user, carts } = props;
    const [cartsItems, setCartItems] = useState(carts);
    const [loading, setLoading] = useState(false);
    const isAuthenticated = useMemo(() => Boolean(auth?.user), [auth?.user?.id]);
    const fetchCartItem = useCallback(() => {
        setLoading(true);
        const timestamp = new Date().getTime();
        const config = {
            // headers: {
            //     'Cache-Control': 'no-cache, no-store, must-revalidate',
            //     'Pragma': 'no-cache',
            //     'Expires': '0'
            // }
        };
        Axios.get(`anonymous-cart/${deviceid}?_t=${timestamp}`, config)
            .then((resp) => {
                setCartItems(resp.data.carts);
                setLoading(false);
            })
            .catch((_err) => {
                console.error("Error fetching anonymous cart:", _err);
                setLoading(false);
            });
    }, [deviceid]);

    const fetchAuthenticatedCartItems = useCallback(() => {
        setLoading(true);
        // Include device_id for potential cart merging fallback + cache busting
        const config = {
            headers: {
                'X-Device-ID': deviceid,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        };
        // Add cache-busting parameter
        const timestamp = new Date().getTime();
        Axios.get(`authenticated-cart?_t=${timestamp}`)
            .then((resp) => {
                if (resp.data.success) {
                    setCartItems(resp.data.carts);
                }
                setLoading(false);
            })
            .catch((_err) => {
                console.error("error", _err);
                setLoading(false);
            });
    }, [deviceid]);

    const [ryeItems, setRyeItems] = useState([]);
    const [loading2, setLoading2] = useState(false);
    const refreshIntervalRef = useRef(null);
    const fetchRyeItems = useCallback(() => {
        setLoading2(true);
        Axios.get(`get-cart-details`)
            .then((resp) => {
                if (resp?.data?.status) {
                    setRyeItems(resp.data.data);
                } else {
                    setRyeItems([]);
                }
                setLoading2(false);
            })
            .catch((_err) => {
                console.error("error", _err);
                setLoading2(false);
            });
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchRyeItems();
            fetchAuthenticatedCartItems();
        } else {
            fetchCartItem();
        }
    }, [isAuthenticated, fetchAuthenticatedCartItems, fetchCartItem, fetchRyeItems, auth]); // Depend on authentication state

    // Listen to global cart refresh events
    useEffect(() => {
        const handleCartItemsRefresh = (event) => {
            if (event.detail.carts) {
                setCartItems(event.detail.carts);
            }
        };
        
        const handleRyeItemsRefresh = (event) => {
            if (event.detail.ryeItems) {
                setRyeItems(event.detail.ryeItems);
            }
        };
        
        // Add event listeners for global cart refresh events
        window.addEventListener('cartItemsRefreshed', handleCartItemsRefresh);
        window.addEventListener('ryeItemsRefreshed', handleRyeItemsRefresh);
        
        return () => {
            window.removeEventListener('cartItemsRefreshed', handleCartItemsRefresh);
            window.removeEventListener('ryeItemsRefreshed', handleRyeItemsRefresh);
        };
    }, []);

    return (
        <Authenticated auth={auth.user} user={user}>
            <div className="bg-white">
                <Head title={"Cart"} />

                {ryeItems && ryeItems.length ? (
                    <CartListing
                        loading2={loading2}
                        ryeItems={ryeItems}
                        fetchRyeItems={fetchRyeItems}
                    />
                ) : (
                    ""
                )}

                {cartsItems && cartsItems.length ? (
                    <div className=" ">
                        <div className="container pb-5 ">
                            <h2 className="text-bl font-GillSans pt-5 pt-3 pb-0 text-center text-3xl uppercase text-whites">
                                Cart
                            </h2>
                            {loading ? <WhiteLoading /> : ""}
                            {!loading && (
                                <>
                                    {cartsItems && cartsItems.length ? (
                                        <>
                                            {cartsItems.map((c, i) => {
                                                return (
                                                    <>
                                                        <UserCarts
                                                            auth={auth && auth.user}
                                                            key={`user-cart-${i}`}
                                                            data={c}
                                                            currency={carts[0]?.user?.currency}
                                                        /> 
                                                    </>
                                                );
                                            })}
                                        </>
                                    ) : (
                                        ""
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    ""
                )}

                {ryeItems &&
                ryeItems.length < 1 &&
                cartsItems &&
                cartsItems.length < 1 &&
                !loading &&
                !loading2 && (
                    <div className="py-5 text-center">
                        <div className="containerbox h-[70vh] flex items-center justify-center">
                            <div className="p-6">
                                <div className="flex justify-center ">
                                    <GiCardboardBox className="text-center text-gray-500" size={100} />
                                </div>

                                <h1 className="text-xl md:text-3xl text-black mt-4 font-gulfs uppercase">Your Cart is Empty</h1>
                                <p className="mt-2 text-normal md:text-xl text-gray-500">Looks like you haven't added anything to your cart yet.</p>
                            </div>
                            
                        </div>
                    </div>
                )}
            </div>

        </Authenticated>
    );
}
