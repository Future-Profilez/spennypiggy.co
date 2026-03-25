import Popup from "@/Components/Popup";
import { Link, router, usePage } from "@inertiajs/react";
import { useState } from "react";
import userdefaultphoto from "../../../assets/img/userphoto.png";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import toast from "react-hot-toast";
import PriceFormat from "@/includes/PriceFormat";
import { useEffect } from "react";
import { useRef } from "react";
import AllContries from "../../includes/AllCountries";
import Turnstile from "@/Components/Turnstile";

export default function BuyShopItem({
    vat_percent,
    opened,
    classes,
    text,
    s,
    open,
    isPaid,
    selectedVarient,
    country,
    shippingPrice,
    card_capabilities,
}) {
    const { formatMultiPrice } = PriceFormat();
    const { global_currency, auth, turnstileSiteKey, shop } = usePage().props;
    const turnstileRef = useRef(null);
    const [close, setClose] = useState();

    useEffect(() => {
        if (open) {
            setClose(true);
        }
    }, [open]);

    const { successAlert, errorAlert, infoAlert, errorsHandling } = useAlerts();
    const [isfairPrice, setIsfaiPrice] = useState(false);

    const actualPrice = () => {
        if (s && s.is_member == 1 && s.special_member_price) {
            return s.special_member_price;
        } else {
            return s.price;
        }
    };

    const [shipping_info, setshipping_info] = useState({
        country: "",
        street_address: "",
        city: "",
        state: "",
        postal_code: "",
    });
    const handleShipInput = (e) => {
        setshipping_info({
            ...shipping_info,
            [e.target.name]: e.target.value,
        });
    };

    const [fairPrice, setfaiPrice] = useState(actualPrice());

    const enterFairPrice = (e) => {
        if (e.target.value) {
            setIsfaiPrice(true);
        } else {
            setIsfaiPrice(false);
        }
        setfaiPrice(e.target.value);
    };
    const slug = (inputString) => {
        return inputString
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    const [email, setEmail] = useState((auth && auth.user?.email) || "");
    const [name, setName] = useState((auth && auth.user?.name) || "");
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    const [checking, setChecking] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");

    const onVerify = (token) => {
        setCaptchaToken(token || "");
    };

    const executeCaptcha = (e) => {
        e.preventDefault();
        buyItem();
    };

    const buyItem = (token) => {
        if (!card_capabilities) {
             errorAlert("This creator cannot accept payments at the moment.");
             return false;
        }
        if (email === "" || name === "") {
            errorAlert("Please enter your name and email");
            return false;
        }
        const captchaQuery = (token || captchaToken)
            ? `&cf_turnstile_response=${encodeURIComponent(token || captchaToken)}`
            : "";
        if (shop.type === "physical") {
            axios
                .post(
                    `/shop/buy/${s.uuid}/${selectedVarient}?from=${name}&email=${email}&quantity=${quantity}&amount=${fairPrice}&country=${country}${captchaQuery}`,
                    {
                        shipping_info: JSON.stringify(shipping_info),
                    }
                )
                .then((res) => {
                    if (res.data.status == false) {
                        if (res.data.message === 'Login required' || res.data.code === 'AUTH_REQUIRED') {
                            const msg = res.data.msg || 'Guest checkout is disabled. Please log in.';
                            router.visit(
                                `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent(msg)}`
                            );
                        } else {
                            errorAlert(res.data.message || res.data.msg || "Transaction declined.");
                        }
                    } else if (res.data.url) {
                        window.location.href = res.data.url;
                    } else {
                        setLoading(false);
                        errorAlert(res.data.message || "Something went wrong");
                    }
                })
                .catch((err) => {
                    setLoading(false);
                    errorsHandling(err);
                });
        } else {
            setLoading(true);
            axios
                .get(
                    `/shop/buy/${s.uuid}/no_varient?from=${name}&email=${email}&quantity=${quantity}&amount=${fairPrice}${captchaQuery}`
                )
                .then((res) => {
                    if (res.data.status == false) {
                        if (res.data.message === 'Login required' || res.data.code === 'AUTH_REQUIRED') {
                            const msg = res.data.msg || 'Guest checkout is disabled. Please log in.';
                            router.visit(
                                `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent(msg)}`
                            );
                        } else {
                            errorAlert(res.data.message || res.data.msg || "Transaction declined.");
                        }
                    } else if (res.data.url) {
                        window.location.href = res.data.url;
                    } else {
                        setLoading(false);
                        errorAlert(res.data.message || "Something went wrong");
                    }
                })
                .catch((err) => {
                    setLoading(false);
                    errorsHandling(err);
                });
        }
    };

    const [replySent, setReplySent] = useState(false);
    const [posting, setposting] = useState(false);
    const [reply, setReply] = useState();
    const inputref = useRef();

    const sendReply = async () => {
        setposting(true);
        axios
            .post(`/shop/answer-to-payment/${isPaid}`, {
                answer: reply,
            })
            .then((res) => {
                if (res.data.status) {
                    inputref.current.value = "";
                    setReply();
                    successAlert(res.data.msg || res.data.message);
                    setReplySent(true);
                } else {
                    errorAlert(res.data.msg || res.data.message);
                }
                setposting(false);
            })
            .catch((err) => {
                setposting(false);
                errorsHandling(err);
            });
    };

    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        const text = window.location.href;
        navigator.clipboard
            .writeText(text)
            .then(() => {
                setCopied(true);
                toast.success("Copied to clipboard");
                setTimeout(() => setCopied(false), 2000);
            })
            .catch((err) => {
                console.error("Failed to copy: ", err);
            });
    };

    return (
        <>
            <Popup
                modalclass="pinkmodal sendSurprize-modal"
                space="4"
                size="md"
                action={close}
                classes={classes}
                text={text}
            >
                <div className={`${loading ? "item-purchasing" : ""}`}>
                    <div className="mx-auto w-32 h-32 relative -mt-16 border-2 border-white rounded-full overflow-hidden">
                        <img
                            className="object-cover object-center h-32 w-full"
                            src={s.user.avatar_url || userdefaultphoto}
                            alt="Woman looking front"
                        />
                    </div>
                    <div className="text-center mt-2">
                        <Link
                            href={`/${s.user.username}`}
                            className="font-semibold text-black"
                        >
                            {s.user.name || "User"}
                        </Link>
                    </div>

                    {isPaid && opened == 0 ? (
                        <>
                            <h2 className="text-center font-bold text-xl py-2">
                                Thank you for your purchase!
                            </h2>
                            <div className="border border-gray-200 p-3 rounded-[30px] md:rounded-[40px]  mt-4">
                                <div className="mb-3 shop-item flex justify-between w-full items-center bg-white rounded-[30px] md:rounded-[40px] ">
                                    <div className="shop-item-user w-full flex bg-gray-100 p-3 rounded-[30px] md:rounded-[40px]  items-center">
                                        <Link
                                            href={`/shop/item/${slug(s.name)}/${
                                                s.uuid
                                            }`}
                                            className="shop-img w-12 h-12 min-w-12"
                                        >
                                            <img
                                                className="w-full h-full object-cover rounded-[30px] md:rounded-[40px]  "
                                                src={s.perma_link}
                                                alt=""
                                            />
                                        </Link>
                                        <Link
                                            href={`/shop/item/${slug(s.name)}/${
                                                s.uuid
                                            }`}
                                            className="shop-text pl-3 "
                                        >
                                            <h2 className="text-md font-bold">
                                                {s.name}
                                            </h2>
                                            <p className="text-gray-500 text-sm line-clamp-1 ">
                                                {s.description}
                                            </p>
                                        </Link>
                                    </div>
                                </div>

                                {s && s.success_page_type == "text" ? (
                                    <p>{s && s.success_page_value}</p>
                                ) : (
                                    <a
                                        target="_blank"
                                        className="text-blue-800 break-all"
                                        href={s && s.success_page_value}
                                    >
                                        {s && s.success_page_value}
                                    </a>
                                )}

                                {s.ask_question && !replySent ? (
                                    <>
                                        <p className="text-start mt-3">
                                            {s.ask_question} ?
                                        </p>
                                        <input
                                            ref={inputref}
                                            onChange={(e) =>
                                                setReply(e.target.value)
                                            }
                                            className="text-black bg-gray-100 rounded-[30px] md:rounded-[40px]   w-full mt-2 px-3 py-2 border border-gray-200"
                                            type="text"
                                            placeholder="Ask your question ??"
                                        />
                                        {reply ? (
                                            <button
                                                onClick={sendReply}
                                                className="pinkbg text-center text-white px-3 py-1 mt-3 mx-auto block rounded-[30px] md:rounded-[40px] "
                                            >
                                                {posting ? "Posting" : "Post"}
                                            </button>
                                        ) : (
                                            ""
                                        )}
                                    </>
                                ) : (
                                    ""
                                )}
                            </div>

                            <div className="ShareSupport">
                                <h2 className="text-black font-bold text-center font-2xl mb-2 mt-10">
                                    Share your support
                                </h2>
                                <p className="text-center">
                                    {s.user.name} would love a shoutout! Share
                                    it out or tell your friends using this link:
                                </p>
                                <button
                                    onClick={handleCopy}
                                    className="bg-gray-200 rounded-[30px] md:rounded-[40px]  px-4 py-2 mx-auto block mt-3 text-sm"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center mt-2">
                                {fairPrice ? (
                                    <p className="text-gray-500 my-2 ">
                                        You will be charged{" "}
                                        <strong className="text-black">
                                            {formatMultiPrice(
                                                fairPrice || s.price,
                                                s?.currency || "GBP"
                                            )}{" "}
                                            {vat_percent
                                                ? `+${formatMultiPrice(
                                                      vat_percent,
                                                      s?.currency || "GBP"
                                                  )}`
                                                : ""}{" "}
                                            + processing fee
                                        </strong>
                                        <span className="text-[10px] text-gray-500 font-normal mt-1 leading-tight block">
                                            * Includes all fees. You will be charged in {s?.currency || "GBP"}.
                                        </span>
                                        <button className="tooltipbtn flex justify-center items-center !font-normal">
                                            ?
                                            <p className="!text-left">
                                                {window.platformFeePercentage || 20}% Card Fees and £1
                                                administrative fee applies to
                                                all transactions.
                                            </p>
                                        </button>
                                    </p>
                                ) : (
                                    <p className="text-gray-500 my-2 ">
                                        You will get it for free.
                                    </p>
                                )}
                            </div>
                            <div className="my-3 shop-item flex justify-between w-full items-center bg-white rounded-[30px] md:rounded-[40px] ">
                                <div className="shop-item-user w-full flex bg-gray-100 p-3 rounded-[30px] md:rounded-[40px]  items-center">
                                    <Link
                                        href={`/shop/item/${slug(s.name)}/${
                                            s.uuid
                                        }`}
                                        className="shop-img w-12 h-12 min-w-12"
                                    >
                                        <img
                                            className="w-full h-full object-cover rounded-[30px] md:rounded-[40px]  "
                                            src={s.perma_link}
                                            alt=""
                                        />
                                    </Link>
                                    <Link
                                        href={`/shop/item/${slug(s.name)}/${
                                            s.uuid
                                        }`}
                                        className="shop-text pl-3 "
                                    >
                                        <h2 className="text-md font-bold">
                                            {s.name}
                                        </h2>
                                        <p className="text-gray-500 text-sm line-clamp-1 ">
                                            {s.description}
                                        </p>
                                    </Link>
                                </div>
                            </div>
                            {/* <p className='mb-1' >Enter a fair price (optional)</p>
               <input required onChange={enterFairPrice} min={s.price}
               className="w-full border-gray-300 border px-4 py-2 rounded-[30px] md:rounded-[40px]  focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 mb-3" placeholder={`+${s.price}`} type="number" /> */}

                            <div className="form-field mb-3">
                                <p className="mb-1">Name</p>
                                <input
                                    required
                                    disabled={
                                        auth && auth.user?.name ? true : false
                                    }
                                    className="border-gray-300 border rounded-[30px] md:rounded-[40px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded"
                                    defaultValue={auth && auth.user?.name}
                                    onChange={(e) => setName(e.target.value)}
                                    type="text"
                                    placeholder="Enter name.. "
                                />
                            </div>
                            <div className="form-field mb-3 ">
                                <p className="mb-1">Email</p>
                                <input
                                    required
                                    disabled={
                                        auth && auth.user?.email ? true : false
                                    }
                                    className="border-gray-300 border rounded-[30px] md:rounded-[40px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] md:rounded-[40px] "
                                    defaultValue={auth && auth.user?.email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                    placeholder="Enter email.. "
                                />
                                <p className="text-[12px] text-gray-500 mt-1 ">
                                    Your email address is kept private and will
                                    not be shown to anyone.
                                </p>
                            </div>

                            {shop.type === "physical" ? (
                                <>
                                    <div className="mb-3">
                                        <p className="mb-2">
                                            Shipping Information
                                        </p>
                                        <select
                                            className="border-gray-300 border rounded-[30px] md:rounded-[40px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] md:rounded-[40px] "
                                            name="country"
                                            onChange={handleShipInput}
                                        >
                                            <option value={""}>
                                                Choose Country
                                            </option>
                                            {AllContries &&
                                                AllContries.map((c, i) => (
                                                    <option
                                                        key={i}
                                                        value={c.code}
                                                    >
                                                        {c.label}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <input
                                            required
                                            className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] md:rounded-[40px] "
                                            onChange={handleShipInput}
                                            name="street_address"
                                            type="text"
                                            placeholder="Street Address"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <input
                                            required
                                            className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] md:rounded-[40px] "
                                            onChange={handleShipInput}
                                            name="city"
                                            type="text"
                                            placeholder="City"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="mb-3">
                                            <input
                                                required
                                                className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] md:rounded-[40px] "
                                                onChange={handleShipInput}
                                                name="state"
                                                type="text"
                                                placeholder="State"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <input
                                                required
                                                className="border-gray-300 border px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] md:rounded-[40px] "
                                                onChange={handleShipInput}
                                                name="postal_code"
                                                type="email"
                                                placeholder="Postal Code"
                                            />
                                        </div>
                                    </div>
                                </>
                            ) : (
                                ""
                            )}

                            {turnstileSiteKey ? (
                                <Turnstile
                                    ref={turnstileRef}
                                    size="normal"
                                    theme="light"
                                    onVerify={onVerify}
                                />
                            ) : null}

                            {!card_capabilities && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                    <strong className="font-bold">Payment Unavailable: </strong>
                                    <span className="block sm:inline">This creator cannot receive payments yet.</span>
                                </div>
                            )}

                            <button
                                disabled={checking || (turnstileSiteKey && !captchaToken) || !card_capabilities}
                                onClick={executeCaptcha}
                                className={`${
                                    checking || (turnstileSiteKey && !captchaToken) || !card_capabilities ? "opacity-[0.5] disabled" : ""
                                }  w-1/2 block mx-auto rounded-full bg-gray-900 hover:shadow-lg font-semibold text-white px-6 py-2`}
                            >
                                {checking ? "Buying.." : "Pay"}
                            </button>
                            <div className='securestripe text-center mt-3' >
                                🔒 Secured via <b>Stripe</b>
                            </div>
                        </>
                    )}
                </div>
            </Popup>
        </>
    );
}
