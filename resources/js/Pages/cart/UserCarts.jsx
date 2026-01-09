import { useMemo, useRef, useState } from "react";
import CartItem from "./CartItem";
import { Link, router, usePage } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import DeviceID from "@/includes/DeviceID";
import axios from "axios";
import { useEffect } from "react";
import { add_to_cart } from "@/Pages/redux/UserSlice";
import Turnstile from "@/Components/Turnstile";

export default function UserCarts(props) {
    const turnstileRef = useRef(null);
    const { turnstileSiteKey } = usePage().props;
    const deviceid = useMemo(() => DeviceID(), []);
    const { auth, removeFromCart } = props;
    const { format, formatMultiPrice } = PriceFormat();
    const datas = props.data;
    
    const [keepAnonmyous, setKeepAnonmyous] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [message, setMessage] = useState(null);
    const [name, setName] = useState((auth && auth.user && auth.user.name) || "");
    const [email, setEmail] = useState((auth && auth.user && auth.user.email) || "");

    const [checking, setChecking] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");
    const onVerify = (token) => {
        setCaptchaToken(token || "");
        // handleSubmit(token);
    };
    const handleSubmit = (token) => {
        if(!captchaToken) {
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
            cf_turnstile_response: token || captchaToken || "",
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
        
        const feesValue =
            items &&
            items.reduce(
                (total, item) => +total + +item.tax * (+item.quantity || 1),
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
        <div className={`${cartCleared ? "d-none" : ""} px-2 containerbox`}>
            <div className="my-4 pb-12 mb-16 border-b border-[#000] cartPage overflow-hidden bg-white md:shadow-black md:border md:border-black md:rounded-[35px]">
                    <div className='hidden md:flex p-3 md:p-4 pinkbg flex  !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center '>
                        <span className=' border-black border-2 bg-red-700 me-2 md:w-5 h-4 w-4 md:h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-yellow-400 me-2 h-4 w-4 md:w-5 md:h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-mint me-2 md:w-5 h-4 w-4 md:h-5 rounded-full block'></span>
                    </div>
                    <div className="cartMain md:p-4 m-2 md:p-12">
                        <h2 className="pb-1 wishtitle fading">
                            Your Basket for {datas?.user?.name || ""}
                            <Link className="text-voilet" href={`/${datas?.user?.username || ""}`}>
                                (@{datas?.user?.username || ""})
                            </Link>
                        </h2>
                        <p className="md:pb-4 text-lg mt-2 mb-4">
                            You are about to send a payout to <strong> {datas?.user?.name || ""} </strong> to fund their lifestyle.
                        </p>
                        <div className="CartItemBox">
                            {items &&
                                items.map((c, i) => {
                                    return (
                                        <CartItem
                                            currency={datas?.user && datas?.user?.default_currency}
                                            quantityUpdate={quantityUpdate}
                                            removeCart={removeCart}
                                            data={c}
                                            key={i}
                                        />
                                    );
                                })}
                        </div>

                        <div className="cartTotal pt-3 pb-6">
                            <div className="fading cartSubTotal text-right mt-1">
                                <span>Subtotal :</span>
                                <strong className="text-end text-black">
                                    {formatMultiPrice(subtotal || "",datas?.user && datas?.user?.default_currency)}
                                </strong>
                            </div>
                            <div className="fading cartSubTotal whitespace-nowrap text-right mt-1">
                                <span className="sm:ps-[5px]">Platform Fee :</span>{" "}
                                <strong className="text-end text-black">  
                                    {formatMultiPrice(fee || "",datas?.user && datas?.user?.default_currency, 'adminfee')}
                                    <button className="relative group w-[13px] h-[14px] bg-gray-700 text-white text-[11px] rounded-full ml-1.5 inline-block">?
                                        <p className="fading max-w-[200px] min-w-[200px] !whitespace-normal absolute bg-[#505050] p-[10px] rounded-[20px] bottom-[20px] right-[10px] text-left font-normal text-[15px] z-[99] hidden group-hover:block">
                                            {window.platformFeePercentage || 20}% Card Fees and £1 administrative fee applies to
                                            all transactions.
                                        </p>
                                    </button>
                                </strong>
                            </div>

                            <div className="fading cartSubTotal text-right mt-1">
                                <strong className="text-dark">Total :</strong>
                                <strong className="text-end text-black">
                                    {formatMultiPrice((fee + subtotal) || "",datas?.user && datas?.user?.default_currency, 'adminfees')}
                                </strong>
                            </div>
                        </div>

                        <div className="addMessage">
                            <form  >
                                <ul className="row">
                                    <li className="fading">
                                        <label>Add Message </label>
                                        <textarea rows={2}
                                            onChange={(e) =>
                                                setMessage(e.target.value)
                                            }
                                            placeholder="Send some words of support..."
                                        ></textarea>
                                    </li>
                                    <li className="w-100 mt-3 fading">
                                        <li className="row">
                                            <div className="col-md-12 mb-4">
                                                <label className="d-block text-start">
                                                    Email{" "}
                                                </label>
                                                <p className="text-small text-muted mb-1">
                                                    Your e-mail remains private.
                                                </p>
                                                <input
                                                    required
                                                    className={`${
                                                        auth && auth.email
                                                            ? "disabled"
                                                            : ""
                                                    } form-input w-100 rounded`}
                                                    value={auth && auth.email}
                                                    disabled={
                                                        auth && auth.email
                                                            ? true
                                                            : false
                                                    }
                                                    onChange={(e) =>
                                                        setEmail(e.target.value)
                                                    }
                                                    type="email"
                                                    placeholder="Enter Your Email..."
                                                />
                                            </div>
                                            <div className="col-md-12 mb-4">
                                                <label className="d-block text-start">
                                                    From
                                                </label>
                                                <input
                                                    className="form-input w-100 rounded"
                                                    onChange={(e) =>
                                                        setName(e.target.value)
                                                    }
                                                    value={name}
                                                    type="text"
                                                    placeholder="Enter Your Name..."
                                                />
                                            </div>
                                        </li>
                                    </li>
                                    <li className="cheklistbox fading">
                                        <label
                                            htmlFor="anonymous"
                                            className="text-start"
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
                                                className="me-2"
                                                value="anonymous"
                                            ></input>
                                            Keep anonymous
                                        </label>
                                        <p className="text-muted text-small mb-3">
                                            Your personal email and name will be
                                            private.
                                        </p>

                                        <label
                                            htmlFor="agreeterm"
                                            className="text-start fading"
                                        >
                                            <input
                                                onChange={(e) =>
                                                    setIsChecked(e.target.checked)
                                                }
                                                type="checkbox"
                                                // id="agreeterm"
                                                name="agreeterm"
                                                className="me-2"
                                                value="agreeterm"
                                            ></input>
                                            I understand I am paying the creator
                                            directly and I agree to the{" "}
                                            <Link
                                                target="_blank"
                                                className="text-voilet"
                                                href={route("terms-and-conditions")}
                                            >
                                                Terms of Service
                                            </Link>{" "}
                                            and{" "}
                                            <a
                                                className="text-voilet"
                                                target="_blank"
                                                href="https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6"
                                            >
                                                {" "}
                                                Privacy Policy{" "}
                                            </a>{" "}
                                            and the following statements:
                                        </label>
                                        <div className="tearmlist ps-3">
                                            <ul className="ps-0  ">
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
                                <Turnstile
                                    ref={turnstileRef}
                                    size="normal"
                                    theme="light"
                                    onVerify={onVerify}
                                />
                                {/* {turnstileSiteKey ? (
                                    <Turnstile
                                        ref={turnstileRef}
                                        size="normal"
                                        theme="light"
                                        onVerify={onVerify}
                                    />
                                ) : null} */}
                                <div className=" mt-4 sm:flex gap-3 items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => clearcart(datas?.user?.id)}
                                        className={`  w-full main-button b mb-3 md:!mb-0`}
                                    >
                                        {loading ? "Wait.." : "Clear"}{" "}
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        className={`${
                                            isChecked ? "" : "disabled"
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
    );
}
