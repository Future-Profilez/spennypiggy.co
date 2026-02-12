import { useCallback, useEffect, useRef, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import toast, { Toaster } from "react-hot-toast";
import Membership from "./Membership";
import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Turnstile from "@/Components/Turnstile";
import Social from "../Auth/Social";
import axios from "axios";

export default function SubCheckout(props) {
    const turnstileRef = useRef(null);
    const { turnstileSiteKey } = usePage().props;
    const { user, auth, membership, vat_amount, isSocilAdded, card_capabilities } = props;
    const { formatMultiPrice } = PriceFormat();
    const [username, setUserName] = useState(
        (auth && auth.user && auth.user.username) || ""
    );
    const [name, setName] = useState(
        (auth && auth.user && auth.user.name) || ""
    );
    const [email, setEmail] = useState(
        (auth && auth.user && auth.user.email) || ""
    );
    const { successAlert, errorAlert, warningAlert, infoAlert } = useAlerts();
    const { data, setData, post, processing, errors } = useForm({
        name: name,
        email: email,
        message: "",
        agree: false,
        anonymous: 0,
        cf_turnstile_response: "",
    });

    const [keepAnonmyous, setKeepAnonmyous] = useState(false);
    function checkanonymous(e) {
        setKeepAnonmyous(e.target.checked);
        if (e.target.checked) {
            setData("anonymous", 1);
        } else {
            setData("anonymous", 0);
        }
    }

    const [checking, setChecking] = useState(false);
    const [verified, setVerified] = useState(false);
    const handleSubmit = (e) => {
        e && e.preventDefault();
        if (turnstileRef.current) {
            turnstileRef.current.execute();
        }
        if (turnstileSiteKey && !verified) {
            toast.error("Please complete the CAPTCHA verification.");
            return false;
        }
        setChecking(true);
        post(
            route(`membership.checkout`, {
                uuid: membership?.uuid || null,
                reccure:
                    membership?.level == "lifetime" ? "onetime" : "continue",
            }),
            {
                preserveScroll: true,
                onFinish: () => {
                    setChecking(false);
                },
                onError: () => {
                    setChecking(false);
                    setVerified(false);
                    setData("cf_turnstile_response", "");
                    if (turnstileRef.current) {
                        turnstileRef.current.reset();
                    }
                },
            }
        );
    };
    

    const onVerify = useCallback((token) => {
        setData("cf_turnstile_response", token || "");
        setVerified(!!token);
    }, [setData, setVerified]);

    // const executeCaptcha = (e) => {
    //     e.preventDefault();
        
    //     if (!turnstileSiteKey) {
    //         handleSubmit();
    //         return;
    //     }
        
    //     if (turnstileRef.current && !verified) {
    //         turnstileRef.current.execute();
    //     }
    //     setChecking(true);
    // };

    const { flash } = usePage().props;
    useEffect(() => {
        if (flash?.error) {
            errorAlert(flash.error);
        }
        if (flash?.success) {
            successAlert(flash.success);
        }
        if (flash?.warning) {
            warningAlert(flash.warning);
        }
        if (flash?.info) {
            infoAlert(flash.info);
        }
    }, [flash]);

    const [socialLinks, setSocialLinks] = useState([]);
    const [sLinks, setLinks] = useState([]);
    const fetchingLinks = () => {
        axios
            .get(`/sociallinks/${username}`)
            .then((resp) => {
                setSocialLinks(resp.data.sociallinks);
                setLinks(resp.data.slinks);
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    useEffect(() => {
        fetchingLinks();
    }, []);

    return (
        <>
            <Authenticated auth={auth.user} user={user}>
                <Head title={`Join - ${membership?.level} membership`} />
                <div className={`px-0 mb-3 lg:px-2`}>
                    <div className="my-4 cartsub cartPage bg-white p-4 md:p-5 border-pink shadow-pink border-pink rounded-[40px]  md:rounded-[40px] ">
                        <div className="cartMain">
                            <div className="md:flex w-full gap-5">
                                <div className="w-full md:max-w-[40%]">
                                    <Membership hidebtn={true} item={membership} />
                                </div>
                                <div className="pt-6">
                                    <h2 className="pb-1 wishtitle">
                                        Membership Basket for{" "}
                                        {membership?.user?.name || " "}
                                        <Link
                                            className="text-violet-600"
                                            target="_blank"
                                            href={`/${
                                                membership?.user?.username || ""
                                            }`}
                                        >
                                            @{membership?.user?.username || ""}
                                        </Link>
                                    </h2>
                                    <p className="pb-4">
                                        You are about to join {membership?.level}{" "}
                                        membership.
                                    </p>
                                    <div className="w-full lg:max-w-[300px] cartTotal px-0 lg:pt-4 flex justify-end">
                                        <ul className="w-full">
                                            <li className="flex justify-between  border p-2">
                                                <span className="min-w-[100px] block">Subtotal :</span>
                                                <strong>{formatMultiPrice(membership?.price || "",membership && membership?.currency)}</strong>
                                            </li>
                                            {/* <li className="flex justify-between   border p-2">
                                                <span className="min-w-[100px] block">Platform Fee :</span>
                                                <div>
                                                    <strong>{formatMultiPrice(membership?.tax_amount || "",membership && membership?.currency, 'adminfee')}</strong>
                                                    <button className="relative group w-[13px] h-[14px] bg-gray-700 text-white text-[11px] rounded-full ml-1.5 inline-block">
                                                    ?
                                                    <p className="absolute bg-[#505050] p-[10px] rounded-[40px]  top-[22px] right-[-18px] text-left font-normal text-[15px] z-[1] hidden group-hover:block">
                                                        {window.platformFeePercentage || 20}% Card Fees and £1 administrative fee applies to
                                                    all transactions.
                                                    </p>
                                                    </button>
                                                </div>
                                            </li> */}
                                            {vat_amount && vat_amount > 0 ? (
                                                <li className="flex justify-between   border p-2">
                                                    <span className="min-w-[100px] block">VAT :</span>
                                                    <strong>{formatMultiPrice(
                                                            vat_amount || "",
                                                            membership &&
                                                                membership.currency
                                                        )}</strong>
                                                </li>
                                            ) : (
                                                ""
                                            )}
                                            <li className="flex justify-between border p-2">
                                                <span className="min-w-[100px] block">Total :</span>
                                                <strong>{formatMultiPrice(
                                                    membership?.tax_amount +
                                                        membership?.price +
                                                        vat_amount || "",
                                                    membership && membership?.currency, 'adminfee'
                                                )}</strong>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                            </div>

                            <div className="addMessage mt-5">
                                <ul className="flex flex-wrap">
                                    <li className="w-full">
                                        <label className=" mb-2 text-sm font-medium text-gray-900">Add Message </label>
                                        <textarea
                                            className="border-gray-300 border rounded-[40px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[40px] "
                                            onKeyUp={(e) => setData("message",e.target.value)}
                                            placeholder="Write message in under 800 Words..."
                                            defaultValue={data.message}
                                        ></textarea> 
                                        <span className="text-xs text-red-600"> {errors.message}</span>
                                    </li>
                                    <li className="w-full mt-3">
                                        <div className="flex flex-wrap">
                                            <div className="w-full mb-4">
                                                <label className=" text-left">
                                                    Email{" "}
                                                </label>
                                                <p className="text-sm text-gray-500 mb-1">
                                                    Your e-mail remains
                                                    private.
                                                </p>
                                                <input
                                        className={`${
                                            auth &&
                                            auth?.user &&
                                            auth?.user?.email
                                                ? "disabled"
                                                : ""
                                        } border-gray-300 border rounded-[20px] p-4 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500`}
                                                    value={data.email}
                                                    disabled={
                                                        auth &&
                                                        auth?.user &&
                                                        auth?.user?.email
                                                            ? true
                                                            : false
                                                    }
                                                    onChange={(e) =>
                                                        setData(
                                                            "email",
                                                            e.target.value
                                                        )
                                                    }
                                                    type="email"
                                                    placeholder="Enter Your Email..."
                                                />
                                                <span className="text-xs text-red-600">
                                                    {errors.email}
                                                </span>
                                            </div>
                                            <div className="w-full mb-4">
                                                <label className=" text-left">
                                                    From
                                                </label>
                                                <input
                                                    className="border-gray-300 border !rounded-[20px] p-4 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 "
                                                    onChange={(e) =>
                                                        setData(
                                                            "name",
                                                            e.target.value
                                                        )
                                                    }
                                                    value={data.name}
                                                    type="text"
                                                    placeholder="Enter Your Name..."
                                                />
                                                <span className="text-xs text-red-600">
                                                    {errors?.name}
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                    <li className="cheklistbox mt-6">
                                        <label
                                            htmlFor="anonymous"
                                            className="text-left"
                                        >
                                            <input
                                                onChange={checkanonymous}
                                                type="checkbox"
                                                id="anonymous"
                                                name="anonymous"
                                                className="mr-2"
                                                value="anonymous"
                                            ></input>
                                            Keep anonymous
                                        </label>
                                        <p className="text-gray-500 text-sm mb-6">
                                            Your personal email and name
                                            will be private.
                                        </p>
                                        <label
                                            htmlFor="agreeterm"
                                            className="text-left  "
                                        >
                                            <input
                                                onChange={(e) =>
                                                    setData(
                                                        "agree",
                                                        e.target.checked
                                                    )
                                                }
                                                type="checkbox"
                                                id="agreeterm"
                                                name="agreeterm"
                                                className="mr-2"
                                                value="agreeterm"
                                            ></input>
                                            I understand I am paying the
                                            creator directly and I agree to
                                            the{" "}
                                            <Link
                                                target="_blank"
                                                className="text-violet-600"
                                                href={route(
                                                    "terms-and-conditions"
                                                )}
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
                                            <ul className="pl-0">
                                                <li>
                                                    {" "}
                                                    This payment will be
                                                    automatically taken on a
                                                    daily,weekly,monthly or
                                                    yearly basis depending
                                                    on your choice and can be
                                                    cancelled anytime.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    For Memberships and
                                                    subscriptions, I
                                                    understand I am making a
                                                    non-refundable purchase
                                                    that provides access to
                                                    exclusive posts. This
                                                    payment will be
                                                    automatically taken on a
                                                    daily, weekly, monthly
                                                    or yearly basis
                                                    depending on the
                                                    subscription type. Can
                                                    be cancelled anytime.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    I understand that for
                                                    wishes or support
                                                    payments I am making a
                                                    non-refundable donation
                                                    of support and
                                                    understand I will
                                                    recieve a thank you
                                                    message as a reward.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    This payment of purchase
                                                    or donation is intended
                                                    soley for the wish
                                                    recipient{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    I have taken the
                                                    necessary steps to
                                                    confirm the account
                                                    owner is authentic and I
                                                    understand that Spenny
                                                    Piggy will not be held
                                                    responsible for any
                                                    issues arising from a
                                                    catfishing situation.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    I understand that by
                                                    violating these terms I
                                                    may be subject to legal
                                                    action or can fall a
                                                    victim of scams.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    I understand that by
                                                    checking the box above
                                                    and then clicking
                                                    "CHECKOUT",I will have
                                                    created a legally
                                                    binding e-signature to
                                                    this agreement.{" "}
                                                </li>
                                                <li>
                                                    {" "}
                                                    By providing an
                                                    e-mail,you confirm that
                                                    you are happy to receive
                                                    marketing updates. You
                                                    can opt out at anytime.{" "}
                                                </li>
                                            </ul>
                                        </div>
                                    </li>
                                </ul>
                                {!card_capabilities && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-3" role="alert">
                                        <strong className="font-bold">Payment Unavailable: </strong>
                                        <span className="block sm:inline">This creator cannot receive payments yet.</span>
                                    </div>
                                )}
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
                                <div className="mt-4 flex items-center justify-center">
                                    <button
                                         onClick={handleSubmit}
                                        className={`${
                                            !data.agree ||
                                            processing ||
                                            checking ||
                                            (turnstileSiteKey && !verified) ||
                                            !card_capabilities
                                                ? "disabled"
                                                : ""
                                        } btn-pink md !px-8 mt-3 text-center`}
                                        disabled={
                                            !data.agree ||
                                            processing ||
                                            checking ||
                                            (turnstileSiteKey && !verified) ||
                                            !card_capabilities
                                        }
                                    >
                                        {processing || checking
                                            ? "Processing..."
                                            : "Join Now"}
                                    </button>
                                    
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <Social
                    openSocial={isSocilAdded ? "no" : "open"}
                    removetext={true}
                    type="membership"
                    redirect_url={`/membership/checkout/${membership?.uuid}${
                        membership?.level == "lifetime" ? "/onetime" : ""
                    }`}
                    updatedLinks={fetchingLinks}
                    links={sLinks}
                />
                <Toaster />
            </Authenticated>
        </>
    );
}
