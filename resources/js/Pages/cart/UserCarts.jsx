import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CartItem from "./CartItem";
import { Link, router, usePage } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import DeviceID from "@/includes/DeviceID";
import axios from "axios";
import { add_to_cart } from "@/Pages/redux/UserSlice";
import Turnstile from "@/Components/Turnstile";
import toast, { Toaster } from "react-hot-toast";

export default function UserCarts(props) {
    const turnstileRef = useRef(null);
    const { turnstileSiteKey } = usePage().props;
    const deviceid = useMemo(() => DeviceID(), []);
    const { auth, removeFromCart, currency } = props;
    const { format, formatMultiPrice } = PriceFormat();
    const datas = props.data;
    const card_capabilities = datas?.card_capabilities;
    
    // Helper to identify zero decimal currencies
    const isZeroDecimalCurrency = (curr) => {
        const zeroDecimalCurrencies = [
            'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
            'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
        ];
        return zeroDecimalCurrencies.includes(curr?.toUpperCase());
    };

    // Calculate total price including all fees (Gross-Up Logic matching Helpers.php)
    const calculateTotalSupporterPays = (price, curr, vatPercent = 0) => {
        const listedPrice = parseFloat(price || 0);
        const isZeroDecimal = isZeroDecimalCurrency(curr);
        
        // Calculate VAT if applicable (Client Rule: Add VAT before other fees)
        const vatAmount = listedPrice * (vatPercent || 0) / 100;
        const priceWithVat = listedPrice + vatAmount;

        // Constants must match backend configuration (Helpers.php)
        const stripeFeeRate = 0.029;
        const stripeFixedFee = isZeroDecimal ? 0 : 0.30;
        const platformFeeRate = 0.15; 
        const complianceFeeRate = 0.02; 
        const adminFee = 1.00; 

        const totalDeductionRate = stripeFeeRate + platformFeeRate + complianceFeeRate;
        
        if (totalDeductionRate >= 1) return priceWithVat;

        const totalSupporterPays = (priceWithVat + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
        
        return totalSupporterPays;
    };

    const [keepAnonmyous, setKeepAnonmyous] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [message, setMessage] = useState(null);
    const [name, setName] = useState((auth && auth.user && auth.user.name) || "");
    const [email, setEmail] = useState((auth && auth.user && auth.user.email) || "");

    const [checking, setChecking] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");
    const onVerify = useCallback((token) => {
        setCaptchaToken(token || "");
    }, []);

    const handleSubmit = () => {
        if (!card_capabilities) {
             toast.error("This creator cannot accept payments at the moment.");
             return;
        }
        if (!captchaToken) {
            toast.error("Please complete the CAPTCHA verification.");
            return;
        }
        setChecking(true);
        const checkoutUrl = auth && auth.user && auth.user.id 
            ? `/create-checkout-session/${datas?.user?.id}/${datas?.user?.id || "notid"}`
            : `/create-checkout-session/${datas?.user?.id}/${deviceid}`;
        
        const queryParams = {
            message: message || '',
            from: name || '',
            email: email || '',
            anonymous: keepAnonmyous ? 1 : 0,
            cf_turnstile_response: captchaToken || "",
        };
        
        // Use Inertia navigation instead of window.location.href to properly handle flash messages
        router.visit(checkoutUrl, {
            method: 'get',
            data: queryParams,
            onError: (errors) => {
                console.error('Checkout error:', errors);
                setChecking(false);
                if (turnstileRef.current) {
                    turnstileRef.current.reset();
                }
            },
            onFinish: () => {
                setChecking(false);
            }
        });
    };
    
    // const executeCaptcha = (e) => {
    //     e.preventDefault();
        
    //     if (!turnstileSiteKey) {
    //         handleSubmit();
    //         return;
    //     }
        
    //     if (turnstileRef.current) {
    //         turnstileRef.current.execute();
    //     }
    //     setChecking(true);
    // };

    const [loading, setLoading] = useState(false);
    const [cartCleared, setCartCleared] = useState(false);
    const clearcart = (ownerid, index) => {
        setLoading(true);
        router.get(`/clear-cart/${deviceid}/${ownerid}`, {
            preserveScroll: true,
            onSuccess: (resp) => {
                setCartCleared(true);
                setLoading(false);
                if (index == 0) {
                    window.location.reload = false;
                }
            },
            onError: (_err) => {
                console.error("error", _err);
                setLoading(false);
            },
        });
    };

    const [items, setItems] = useState(datas?.items);
    const removeCart = (id) => {
        const removeUrl = auth && auth.user && auth.user.id 
            ? `/api/remove-from-cart/${id}` 
            : `/api/remove-from-cart/${id}/${deviceid}`;
        
        axios.get(removeUrl, {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then((response) => {
            if (response.data.success) {
                const updatedItems = items.filter((item) => item.uuid !== id);
                setItems(updatedItems || []);
            } else {
                console.error("Failed to remove cart item:", response.data.message);
            }
        })
        .catch((error) => {
            console.error("Error removing cart item:", error);
            if (error.response && error.response.data && error.response.data.message) {
                console.error("Server error:", error.response.data.message);
            }
        });
    };

    const [subtotal, setsubtotal] = useState();
    const [fee, setFee] = useState((window.platformFeePercentage || 20) / 100 * subtotal);

     function updateTotals() {
        const subtotalValue =
            items &&
            items.reduce(
                (total, item) => +total + +item.price * (+item.quantity || 1),
                0
            );
        setsubtotal(subtotalValue);
        
        // Calculate fees based on the difference between Total Supporter Pays and Listed Price
        const feesValue =
            items &&
            items.reduce(
                (total, item) => {
                    const unitTotal = calculateTotalSupporterPays(item.price, datas?.user && currency, datas?.user?.vat_amount_percentage);
                    const unitFee = unitTotal - parseFloat(item.price || 0);
                    return +total + unitFee * (+item.quantity || 1);
                },
                0
            );
        setFee(feesValue);
    }

    const quantityUpdate = (type, amount, tax) => {
        // Instead of manually updating totals, let the useEffect handle it
        // This prevents double calculations and ensures consistency
        setTimeout(() => {
            updateTotals();
        }, 100); // Small delay to ensure cart update API call completes
    };

    useEffect(() => {
        updateTotals();
    }, [items]);


    return (
        <div className={`${cartCleared ? "hidden" : ""} px-2 containerbox`}>
            <div className="containerbox mx-auto">
                    {/* <div className='hidden md:flex p-4 md:p-6 pinkbg !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center '>
                        <span className=' border-black border-2 bg-red-700 mr-2 md:w-5 h-4 w-4 md:h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-yellow-400 mr-2 h-4 w-4 md:w-5 md:h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-mint mr-2 md:w-5 h-4 w-4 md:h-5 rounded-full block'></span>
                    </div> */}
                    <div className="w-full">
                        <div className="cartMain">
                            <h2 className="pb-1 wishtitle fading">
                                Your Basket for {datas?.user?.name || ""}
                                <Link className="text-violet-600" href={`/${datas?.user?.username || ""}`}>
                                    (@{datas?.user?.username || ""})
                                </Link>
                            </h2>
                            <p className="md:pb-4 text-lg mt-2 mb-4">
                                You are about to send a payout to <strong> {datas?.user?.name || ""} </strong> to fund their lifestyle.
                            </p>
                            {!card_capabilities && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r" role="alert">
                                    <p className="font-bold">Payments Unavailable</p>
                                    <p>This creator cannot accept payments at the moment (Card Payments capability missing).</p>
                                </div>
                            )}
                            <div className="CartItemBox">
                                {items &&
                                    items.map((c, i) => {
                                        return (
                                            <CartItem
                                                currency={datas?.user && currency}
                                                // currency={datas?.user && datas?.user?.default_currency}
                                                quantityUpdate={quantityUpdate}
                                                removeCart={removeCart}
                                                data={c}
                                                key={i}
                                                isLoggedIn={!!auth?.user}
                                                totalPrice={calculateTotalSupporterPays(c.price, datas?.user && currency, datas?.user?.vat_amount_percentage)}
                                            />
                                        );
                                    })}
                            </div>

                            <div className="cartTotal pt-3 pb-6">
                                {/* <div className="fading cartSubTotal text-right mt-2">
                                    <span>Subtotal : </span>
                                    <strong className="!text-right text-black">
                                        {auth?.user ? 
                                            formatMultiPrice(subtotal || "", datas?.user && currency) : 
                                            formatMultiPrice((subtotal || 0) + (fee || 0), datas?.user && currency)
                                        }
                                    </strong>
                                </div> */}

                                <div className="fading cartSubTotal text-right mt-2">
                                    <strong className="!text-black">Total :</strong>
                                    <strong className="!text-right !text-black">
                                        {formatMultiPrice((fee + subtotal) || "",datas?.user && currency, 'adminfees')}
                                    </strong>
                                    <div className="text-[10px] text-gray-500 font-normal mt-1 leading-tight text-right">
                                        * Includes all applicable fees
                                    </div>
                                </div>
                            </div>

                            <div className="addMessage">
                                <form onSubmit={(e) => e.preventDefault()}>
                                    <ul className="flex flex-wrap">
                                        <li className="fading w-full">
                                            <label>Add Message </label>
                                            <textarea rows={2}
                                                onChange={(e) =>
                                                    setMessage(e.target.value)
                                                }
                                                placeholder="Send some words of support..."
                                            ></textarea>
                                        </li>
                                        <li className="w-full mt-3 fading">
                                            <div className="flex flex-wrap">
                                                <div className="w-full mb-4">
                                                    <label className=" text-start w-full">
                                                        Email{" "}
                                                    </label>
                                                    <p className="text-sm text-gray-500 mb-1">
                                                        Your e-mail remains private.
                                                    </p>
                                                    <input
                                                        required
                                                        className={`${ auth && auth.email ? "disabled" : "" } border-gray-300 border rounded-[10px] p-3 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] md:rounded-[40px] `}
                                                        value={auth && auth.email}
                                                        disabled={ auth && auth.email ? true : false }
                                                        onChange={ (e) => setEmail(e.target.value) }
                                                        type="email"
                                                        placeholder="Enter Your Email..."
                                                    />
                                                </div>
                                                <div className="w-full mb-4">
                                                    <label className="text-start w-full">
                                                        From
                                                    </label>
                                                    <input
                                                        className="border-gray-300 mt-1 border p-3 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 !rounded-[10px] "
                                                        onChange={(e) =>
                                                            setName(e.target.value)
                                                        }
                                                        value={name}
                                                        type="text"
                                                        placeholder="Enter Your Name..."
                                                    />
                                                </div>
                                            </div>
                                        </li>
                                        <li className="cheklistbox fading">
                                            <label
                                                htmlFor="anonymous"
                                                className="text-left"
                                            >
                                                <input
                                                    onChange={(e) =>
                                                        setKeepAnonmyous(
                                                            e.target.checked
                                                        )
                                                    }
                                                    type="checkbox"
                                                    id="anonymous"
                                                    name="anonymous"
                                                    className="mr-2"
                                                    value="anonymous"
                                                ></input>
                                                Keep anonymous
                                            </label>
                                            <p className="text-gray-500 text-sm mb-3">
                                                Your personal email and name will be
                                                private.
                                            </p>

                                            <label
                                                htmlFor="agreeterm"
                                                className="text-left fading"
                                            >
                                                <input
                                                    onChange={(e) =>
                                                        setIsChecked(e.target.checked)
                                                    }
                                                    type="checkbox"
                                                    id="agreeterm"
                                                    name="agreeterm"
                                                    className="mr-2"
                                                    value="agreeterm"
                                                ></input>
                                                I understand I am paying the creator
                                                directly and I agree to the{" "}
                                                <Link
                                                    target="_blank"
                                                    className="text-violet-600"
                                                    href={route("terms-and-conditions")}
                                                >
                                                    Terms of Service
                                                </Link>{" "}
                                                and{" "}
                                                <a
                                                    className="text-violet-600"
                                                    target="_blank"
                                                    href="https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6"
                                                >
                                                    {" "}
                                                    Privacy Policy{" "}
                                                </a>{" "}
                                                and the following statements:
                                            </label>
                                            <div className="tearmlist pl-3">
                                                <ul className="pl-0  ">
                                                    <li> 
                                                        For Memberships and
                                                        subscriptions, I understand I am
                                                        making a non-refundable purchase
                                                        that provides access to
                                                        exclusive posts. This payment
                                                        will be automatically taken on a
                                                        daily, weekly, monthly or yearly
                                                        basis depending on the
                                                        subscription type. Can be
                                                        cancelled anytime.
                                                    </li>
                                                    <li>
                                                        {" "}
                                                        I understand that for wishes or
                                                        support payments I am making a
                                                        non-refundable gift of support
                                                        and understand in exchange i
                                                        will recieve a supporter
                                                        membership or exclusive content
                                                        reward.{" "}
                                                    </li>
                                                    <li>
                                                        I understand that all Profile
                                                        shop purchases are non
                                                        refundable and I have taken all
                                                        necessary steps to understand
                                                        what I am purchasing
                                                    </li>
                                                    <li>
                                                        I have taken the necessary steps
                                                        to confirm the account owner is
                                                        authentic and I understand that
                                                        Spenny Piggy will not be held
                                                        responsible for any issues
                                                        arising from a catfishing
                                                        situation.
                                                    </li>
                                                    <li>
                                                        I understand that by violating
                                                        these terms I may be subject to
                                                        legal action or can fall a
                                                        victim of scams.
                                                    </li>
                                                    <li>
                                                        I understand that by checking
                                                        the box above and then clicking
                                                        "CHECKOUT", I will have created
                                                        a legally binding e-signature to
                                                        this agreement.
                                                    </li>
                                                    <li>
                                                        By providing an e-mail, you
                                                        confirm that you are happy to
                                                        receive marketing updates. You
                                                        can opt out at anytime.
                                                    </li>
                                                </ul>
                                            </div>
                                        </li>
                                    </ul>
                                    {turnstileSiteKey ? (
                                        <div className="flex justify-center my-3">
                                            <Turnstile
                                                ref={turnstileRef}
                                                size="normal"
                                                theme="light"
                                                onVerify={onVerify}
                                            />
                                        </div>
                                    ) : null}
                                    <div className=" mt-4 sm:flex gap-3 items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => clearcart(datas?.user?.id)}
                                            className={`  w-full main-button b mb-3 md:!mb-0`}
                                        >
                                            {loading ? "Wait.." : "Clear"}{" "}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={!isChecked || checking || (turnstileSiteKey && !captchaToken) || !card_capabilities}
                                            onClick={handleSubmit}
                                            className={`${
                                                isChecked && !(turnstileSiteKey && !captchaToken) && !checking && card_capabilities ? "" : "disabled"
                                            } main-button p w-full`}
                                        >
                                            {checking ? "Wait.." : "Checkout"}{" "}
                                        </button>
                                    </div>
                                    
                                </form>
                            </div>
                        </div>
                    </div>
            </div>
        </div>
    );
}
