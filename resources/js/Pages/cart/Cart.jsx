import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState, lazy, useCallback, useMemo, Suspense } from "react";
import { Head, usePage } from "@inertiajs/react";
import DeviceID from "@/includes/DeviceID";
import { useEffect, useRef } from "react";
import Axios from "axios";
import CartListing from "../rye/CartListing";
import WhiteLoading from "@/includes/LoadingScreen";
import PriceFormat from "@/includes/PriceFormat";
const UserCarts = lazy(() => import("../cart/UserCarts"));
import { GiCardboardBox } from "react-icons/gi";

export default function Cart(props) {
    const deviceid = useMemo(() => DeviceID(), []);
    const { auth, user, carts } = props;
    const { rates, global_currency } = usePage().props;
    const { formatMultiPrice } = PriceFormat();
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

    /*
     * 🚨 `?add={uuid}` — THE BIO PAGE'S "UNLOCK" LANDS HERE.
     *
     * On a profile, tapping a wish opens a popup that collects what the checkout
     * needs. A bio card is a link, so it used to land on the wish checkout page,
     * whose every refusal answers with `redirect()->back()` — and a visitor
     * arriving from `/bio/buy/…` has no meaningful "back", so they were dropped
     * on the homepage with a flash the homepage never renders. They tapped
     * Unlock and nothing happened.
     *
     * ⚠️ THE ADD HAPPENS HERE AND NOT ON THE SERVER because a guest's basket row
     * is keyed on a device id the BROWSER derives (user agent, platform, screen).
     * The server cannot compute it, so a server-side write would create a row
     * the guest can never see.
     *
     * ⚠️ The parameter is stripped with `replaceState` once used. Left in place,
     * a refresh or a shared URL adds the item again, and a basket that grows on
     * reload is a support ticket.
     */
    const addHandled = useRef(false);

    useEffect(() => {
        if (addHandled.current || !deviceid) return;

        const params = new URLSearchParams(window.location.search);
        const uuid = params.get('add');

        if (!uuid) return;

        addHandled.current = true;

        Axios.get(`/add-to-cart/${uuid}/${deviceid}/onetime`)
            .then(() => {
                isAuthenticated ? fetchAuthenticatedCartItems() : fetchCartItem();
            })
            .catch((_err) => {
                console.error('Could not add the item to your basket:', _err);
            })
            .finally(() => {
                params.delete('add');
                const qs = params.toString();
                window.history.replaceState(
                    {},
                    '',
                    window.location.pathname + (qs ? `?${qs}` : ''),
                );
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deviceid, isAuthenticated]);

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

    // --- Multi-creator accordion -------------------------------------------
    // Checkout is one Stripe session per creator (`/create-checkout-session/{ownerId}`),
    // so a basket spanning several creators is several payments. Rendering every
    // creator's form at once meant N message/email/name fields, N payment-method
    // selectors each hitting /payments/price-preview, and N Turnstile widgets on
    // one screen. Only the OPEN creator mounts its checkout.
    const creatorIds = useMemo(
        () => (cartsItems || []).map((c, i) => c?.user?.id ?? `idx-${i}`),
        [cartsItems],
    );
    const [openId, setOpenId] = useState(null);

    // Open the first creator by default, and never leave the accordion pointing
    // at a creator who is no longer in the basket.
    useEffect(() => {
        if (!creatorIds.length) {
            setOpenId(null);
            return;
        }
        setOpenId((current) =>
            current != null && creatorIds.includes(current)
                ? current
                : creatorIds[0],
        );
    }, [creatorIds]);

    const toggleCreator = useCallback((id) => {
        setOpenId((current) => (current === id ? null : id));
    }, []);

    // Each basket reports its own gross so the header can state the whole thing.
    // Reported by the child rather than recomputed here — a second copy of the
    // gross-up would drift from the figure the buyer is actually charged.
    const [summaries, setSummaries] = useState({});
    const reportSummary = useCallback((id, summary) => {
        setSummaries((prev) => {
            const before = prev[id];
            if (
                before &&
                before.total === summary.total &&
                before.currency === summary.currency &&
                before.count === summary.count &&
                before.cleared === summary.cleared
            ) {
                return prev;
            }
            return { ...prev, [id]: summary };
        });
    }, []);

    // ⚠️ Baskets are converted into the viewer's display currency BEFORE they
    // are added up. `formatMultiPrice` always renders in `global_currency`, so
    // grouping by CHARGE currency and printing each group produced two figures
    // in the same symbol sitting side by side — which reads as one total the
    // reader is expected to add themselves. A creator charging USD and one
    // charging GBP are one basket to the person paying.
    const { basketTotal, itemCount, creatorCount } = useMemo(() => {
        const display = (global_currency || "GBP").toUpperCase();
        const displayRate = rates?.[display] || 1;
        let total = 0;
        let items = 0;
        let creators = 0;
        creatorIds.forEach((id) => {
            const s = summaries[id];
            if (!s || s.cleared) return;
            creators += 1;
            items += s.count || 0;
            const cur = (s.currency || "GBP").toUpperCase();
            const chargeRate = rates?.[cur];
            // No rate is the same fallback each row already takes — the header
            // and the rows under it must never disagree about one basket.
            total +=
                cur === display || !chargeRate || !isFinite(chargeRate)
                    ? s.total || 0
                    : ((s.total || 0) / chargeRate) * displayRate;
        });
        return {
            basketTotal: total,
            itemCount: items,
            creatorCount: creators,
        };
    }, [creatorIds, summaries, rates, global_currency]);

    const multiCreator = creatorIds.length > 1;

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
                    // The fixed bottom nav covers the end of this page, and on
                    // iOS standalone the home indicator covers that.
                    <div
                        className="pb-28"
                        style={{
                            paddingBottom: "calc(7rem + env(safe-area-inset-bottom))",
                        }}
                    >
                        <div className="container">
                            {/* ⚠️ Desktop spacing at every width put ~57px of empty
                                page between the header strip and the heading on a
                                phone — the basket total was below the fold before
                                anything had been read. */}
                            <div className="m-auto max-w-[820px] px-2 pt-2 md:pt-5">
                                <header className="mb-4 md:mb-5">
                                    {/* `font-gulfs` ink sits low in its own line box, so
                                        default leading reads as a second top margin. */}
                                    <h1 className="font-gulfs text-2xl uppercase leading-none text-black md:text-3xl">
                                        Your basket
                                    </h1>
                                    <p className="mt-1 text-sm text-black/60">
                                        {itemCount} {itemCount === 1 ? "item" : "items"}
                                        {creatorCount > 0
                                            ? ` from ${creatorCount} ${creatorCount === 1 ? "creator" : "creators"}`
                                            : ""}
                                    </p>

                                    {creatorCount > 0 ? (
                                        <div className="mt-3 rounded-box-sm border-2 border-black bg-white p-4">
                                            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                                <span className="text-sm font-bold uppercase tracking-wide text-black/70">
                                                    Basket total
                                                </span>
                                                <span className="text-lg font-black text-black">
                                                    {formatMultiPrice(
                                                        basketTotal,
                                                        global_currency || "GBP",
                                                    )}
                                                </span>
                                            </div>
                                            {multiCreator ? (
                                                <p className="mt-2 text-xs leading-tight text-black/60">
                                                    Each creator is paid separately, so you
                                                    check out one creator at a time. Open a
                                                    creator below to pay for their items.
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </header>

                                {loading ? <WhiteLoading /> : ""}
                                {!loading && (
                                    <div className="space-y-4">
                                        {cartsItems.map((c, i) => {
                                            const id = c?.user?.id ?? `idx-${i}`;
                                            return (
                                                <Suspense
                                                    key={`user-cart-${id}`}
                                                    fallback={
                                                        <div className="h-20 animate-pulse rounded-box border-2 border-black bg-gray-100" />
                                                    }
                                                >
                                                    <UserCarts
                                                        auth={auth}
                                                        data={c}
                                                        currency={
                                                            c?.user?.default_currency ||
                                                            c?.user?.currency
                                                        }
                                                        creatorKey={id}
                                                        collapsible={multiCreator}
                                                        expanded={
                                                            !multiCreator || openId === id
                                                        }
                                                        onToggle={toggleCreator}
                                                        onSummary={reportSummary}
                                                    />
                                                </Suspense>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
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
                        {/* dvh, never vh — a mobile/standalone viewport is not
                            the height the browser reports for vh. */}
                        <div className="containerbox flex min-h-[60dvh] items-center justify-center">
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
