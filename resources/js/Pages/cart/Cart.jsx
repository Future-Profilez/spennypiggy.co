import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState, lazy, useCallback, useMemo } from "react";
import { Head } from "@inertiajs/react";
import DeviceID from "@/includes/DeviceID";
import { useEffect, useRef } from "react";
import Axios from "axios";
import CartListing from "../rye/CartListing";
const UserCarts = lazy(() => import("../cart/UserCarts"));
const LoadingScreen = lazy(() => import("@/includes/LoadingScreen"));
const Nocontent = lazy(() => import("@/includes/Nocontent"));

export default function Cart(props) {
    // Memoize deviceid to prevent re-computation on every render
    const deviceid = useMemo(() => DeviceID(), []);
    
    const { auth, user } = props;
    // Always start with empty cart and fetch fresh data to prevent stale server-side data
    const [cartsItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);
    // Stabilize the auth state to prevent re-renders
    const isAuthenticated = useMemo(() => Boolean(auth?.user), [auth?.user?.id]);
    
    const fetchCartItem = useCallback(() => {
        console.log("fetchCartItem called for anonymous user with deviceid:", deviceid);
        setLoading(true);
        Axios.get(`anonymous-cart/${deviceid}`)
            .then((resp) => {
                console.log("Anonymous cart response:", resp.data);
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
        Axios.get(`authenticated-cart?_t=${timestamp}`, config)
            .then((resp) => {
                console.log("Authenticated cart response:", resp.data);
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
                    // console.log(JSON.parse(resp?.data?.data[0]?.cart_details));
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

    // Initial data fetch - run when authentication state is determined
    useEffect(() => {
        console.log("Cart useEffect running, isAuthenticated:", isAuthenticated);
        console.log("Auth object:", auth);
        console.log("Auth user:", auth?.user);
        
        if (isAuthenticated) {
            console.log("User is authenticated, fetching authenticated cart");
            fetchRyeItems();
            fetchAuthenticatedCartItems();
        } else {
            console.log("User is NOT authenticated, fetching anonymous cart");
            fetchCartItem();
        }
    }, [isAuthenticated, fetchAuthenticatedCartItems, fetchCartItem, fetchRyeItems, auth]); // Depend on authentication state

    // Listen to global cart refresh events
    useEffect(() => {
        console.log("Setting up Cart component event listeners");
        
        const handleCartItemsRefresh = (event) => {
            console.log("Cart component received cartItemsRefreshed event:", event.detail);
            console.log("Event carts data:", event.detail.carts);
            console.log("Setting cart items to:", event.detail.carts);
            if (event.detail.carts) {
                setCartItems(event.detail.carts);
            }
        };
        
        const handleRyeItemsRefresh = (event) => {
            console.log("Cart component received ryeItemsRefreshed event:", event.detail);
            if (event.detail.ryeItems) {
                setRyeItems(event.detail.ryeItems);
            }
        };
        
        // Add event listeners for global cart refresh events
        window.addEventListener('cartItemsRefreshed', handleCartItemsRefresh);
        window.addEventListener('ryeItemsRefreshed', handleRyeItemsRefresh);
        
        console.log("Cart component event listeners added");
        
        // Cleanup event listeners
        return () => {
            console.log("Removing Cart component event listeners");
            window.removeEventListener('cartItemsRefreshed', handleCartItemsRefresh);
            window.removeEventListener('ryeItemsRefreshed', handleRyeItemsRefresh);
        };
    }, []);

    return (
        <Authenticated auth={auth.user} user={user}>
            <div className="bg-white">
                <Head title={"Cart"} />
                {/* Debug information - remove in production */}
                <div style={{padding: '10px', background: '#f0f0f0', margin: '10px', fontSize: '12px'}}>
                    <strong>Debug Info:</strong><br/>
                    Auth User ID: {auth?.user?.id || 'null'}<br/>
                    Is Authenticated: {isAuthenticated.toString()}<br/>
                    Cart Items Count: {cartsItems?.length || 0}<br/>
                    Rye Items Count: {ryeItems?.length || 0}<br/>
                    Loading: {loading.toString()}<br/>
                    Loading2: {loading2.toString()}<br/>
                    Device ID: {deviceid}<br/>
                    <button 
                        onClick={() => {
                            console.log('Manual refresh triggered');
                            if (isAuthenticated) {
                                fetchAuthenticatedCartItems();
                                fetchRyeItems();
                            } else {
                                fetchCartItem();
                            }
                        }}
                        style={{marginTop: '10px', padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer'}}
                        disabled={loading || loading2}
                    >
                        {loading || loading2 ? 'Refreshing...' : 'Refresh Cart'}
                    </button>
                </div>
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
                            <h2 className="text-bl font-GillSans pt-5 pt-3 pb-0 text-center text-2xl uppercase text-whites">
                                Cart
                            </h2>
                            {loading ? <LoadingScreen /> : ""}
                            {!loading && (
                                <>
                                    {cartsItems && cartsItems.length ? (
                                        <>
                                            {cartsItems.map((c, i) => {
                                                return (
                                                    <UserCarts
                                                        auth={auth && auth.user}
                                                        key={`user-cart-${i}`}
                                                        data={c}
                                                    />
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
                        <div className="containerbox">
                            <Nocontent
                                classes={`py-5`}
                                text={"Cart is empty."}
                            />
                        </div>
                    </div>
                )}
            </div>

        </Authenticated>
    );
}
