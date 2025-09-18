import { useRef, useState, useMemo } from "react";
import CartItem from "./CartItem";
import { Link, router, usePage } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import DeviceID from "@/includes/DeviceID";
import axios from "axios";
import { useEffect } from "react";
import { add_to_cart } from "@/Pages/redux/UserSlice";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function UserCarts(props) {
    const hcaptchaRef = useRef(null);
    const { hcaptchakey } = usePage().props;
    // Memoize deviceid to prevent re-computation on every render
    const deviceid = useMemo(() => DeviceID(), []);
    const { auth, removeFromCart } = props;
    const { format, formatMultiPrice } = PriceFormat();
    const datas = props.data;
    
    // Debug logging
    console.log("UserCarts component data:", datas);
    console.log("UserCarts auth:", auth);
    console.log("DeviceID:", deviceid);
    console.log("Creator ID from datas:", datas?.user?.id);
    
    const [keepAnonmyous, setKeepAnonmyous] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [message, setMessage] = useState(null);
    const [name, setName] = useState((auth && auth.name) || "");
    const [email, setEmail] = useState((auth && auth.email) || "");

    const [checking, setChecking] = useState(false);
    const handleSubmit = (e) => {
        setChecking(true);
        const checkoutUrl = auth && auth.id 
            ? `/create-checkout-session/${datas?.user?.id}/${datas?.user?.id || "notid"}`
            : `/create-checkout-session/${datas?.user?.id}/${deviceid}`;
        
        const queryParams = {
            message: message || '',
            from: name || '',
            email: email || '',
            anonymous: keepAnonmyous ? 1 : 0
        };
        
        // Use Inertia navigation instead of window.location.href to properly handle flash messages
        router.visit(checkoutUrl, {
            method: 'get',
            data: queryParams,
            onError: (errors) => {
                console.error('Checkout error:', errors);
                setChecking(false);
            },
            onFinish: () => {
                setChecking(false);
            }
        });
    };
    console.log("device id, owner id", deviceid, datas?.user?.id);
    const onVerify = (token) => {
        handleSubmit();
    };

    const executeCaptcha = (e) => {
        e.preventDefault();
        
        // If no hCaptcha key is configured, skip captcha
        if (!hcaptchakey || hcaptchakey === '') {
            handleSubmit();
            return;
        }
        
        hcaptchaRef.current.execute();
        setChecking(true);
    };

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
        const removeUrl = auth && auth.id 
            ? `/remove-from-cart/${id}` 
            : `/remove-from-cart/${id}/${deviceid}`;
        router.get(removeUrl, {
            preserveScroll: true,
            onSuccess: (resp) => {
                console.log("Cart item removed successfully:", resp);
                const updatedItems = items.filter((item) => item.uuid !== id);
                setItems(updatedItems ||[]);
            },
            onError: (_err) => {
                console.error("Error removing cart item:", _err);
            },
        });
    };

    const [subtotal, setsubtotal] = useState();
    const [fee, setFee] = useState((window.platformFeePercentage || 20) / 100 * subtotal);

    function updateTotals(p) {
        const value =
            items &&
            items.reduce(
                (total, item) => +total + +item.price * (+item.quantity || 1),
                0
            ) + p;
        setsubtotal(value);
        const fees =
            items &&
            items.reduce(
                (total, item) => +total + +item.tax * (+item.quantity || 1),
                0
            ) + p;
        setFee(fees);
    }

    const quantityUpdate = (type, amount, tax) => {
        if (type == "add") {
            const updated = subtotal + amount;
            setsubtotal(updated);
            const totalfee = fee + tax;
            setFee(totalfee);
        } else {
            const updated = subtotal - amount;
            setsubtotal(updated);
            const totalfee = fee - tax;
            setFee(totalfee);
        }
    };

    useEffect(() => {
        updateTotals(0);
    }, [items]);

    return (
        <div className={`${cartCleared ? "d-none" : ""} px-2 containerbox`}>
            <div className="my-4 cartPage overflow-hidden bg-white border-pink shadow-black border-black rounded-[35px]">
                    <div className='p-3 md:p-4 pinkbg flex  !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center '>
                        <span className=' border-black border-2 bg-red-700 me-2 md:w-5 h-4 w-4 md:h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-yellow-400 me-2 h-4 w-4 md:w-5 md:h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-mint me-2 md:w-5 h-4 w-4 md:h-5 rounded-full block'></span>
                    </div>
                    {/* dfdf - ${ownerid}/${deviceid} */}
                    <div className="cartMain p-4 m-2 md:p-12">
                        <h2 className="pb-1 wishtitle">
                            Your Basket for {datas?.user?.name || ""}
                            <Link className="text-voilet" href={`/${datas?.user?.username || ""}`}>
                                (@{datas?.user?.username || ""})
                            </Link>
                        </h2>
                        <p className="pb-4 text-lg mt-2 mb-4">
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
                            <div className="cartSubTotal text-right mt-1">
                                <span>Subtotal :</span>
                                <strong className="text-end text-black">
                                    {formatMultiPrice(subtotal || "",datas?.user && datas?.user?.default_currency)}
                                </strong>
                            </div>
                            <div className="cartSubTotal whitespace-nowrap text-right mt-1">
                                <span className="sm:ps-[5px]">Platform Fee :</span>{" "}
                                <strong className="text-end text-black">
                                    {formatMultiPrice(fee || "",datas?.user && datas?.user?.default_currency, 'adminfee')}
                                    <button className="relative group w-[13px] h-[14px] bg-gray-700 text-white text-[11px] rounded-full ml-1.5 inline-block">?
                                        <p className="max-w-[200px] min-w-[200px] !whitespace-normal absolute bg-[#505050] p-[10px] rounded-md top-[20px] right-[-28px] text-left font-normal text-[15px] z-[1] hidden group-hover:block">
                                            {window.platformFeePercentage || 20}% Card Fees and £1 administrative fee of applies to
                                            all transactions.
                                        </p>
                                    </button>
                                </strong>
                            </div>

                            <div className="cartSubTotal text-right mt-1">
                                <strong className="text-dark">Total :</strong>
                                <strong className="text-end text-black">
                                    {formatMultiPrice((fee + subtotal) || "",datas?.user && datas?.user?.default_currency, 'adminfees')}
                                </strong>
                            </div>
                        </div>

                        <div className="addMessage">
                            <form onSubmit={executeCaptcha}>
                                <ul className="row">
                                    <li>
                                        <label>Add Message </label>
                                        <textarea rows={2}
                                            onChange={(e) =>
                                                setMessage(e.target.value)
                                            }
                                            placeholder="Send some words of support..."
                                        ></textarea>
                                    </li>
                                    <li className="w-100 mt-3">
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
                                    <li className="cheklistbox">
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
                                            className="text-start"
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
                                            <ul className="ps-0">
                                                <li>
                                                    {" "}
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
                                <div className="mt-4 sm:flex gap-3 items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => clearcart(datas?.user?.id)}
                                        className={`  w-full btn-pink !text-sm !bg-gray-300 md mt-3 px-4 text-center text-black`}
                                    >
                                        {loading ? "Wait.." : "Clear"}{" "}
                                    </button>
                                    <button
                                        type="submit"
                                        className={`${
                                            isChecked ? "" : "disabled"
                                        } btn-shadow btn-pink md mt-3 text-center !text-sm w-full `}
                                    >
                                        {checking ? "Wait.." : "Checkout"}{" "}
                                    </button>
                                </div>
                                {hcaptchakey && hcaptchakey !== '' && (
                                    <HCaptcha
                                        ref={hcaptchaRef}
                                        sitekey={hcaptchakey}
                                        data-theme="light"
                                        size="invisible"
                                        onVerify={onVerify}
                                        required
                                    />
                                )}
                            </form>
                        </div>
                    </div>
            </div>
        </div>
    );
}