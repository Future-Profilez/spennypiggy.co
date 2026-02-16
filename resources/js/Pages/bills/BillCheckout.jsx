import { useCallback, useEffect, useRef, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import uploadedimg from "../../../assets/img/uploadedimg.png";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Turnstile from "@/Components/Turnstile";

export default function BillCheckout(props) {
    const turnstileRef = useRef(null);
    const { formatMultiPrice } = PriceFormat();
    const { bill, vat_amount, card_capabilities } = props;
    const { user, auth, turnstileSiteKey } = usePage().props;

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

    // Helper to identify zero decimal currencies
    const isZeroDecimalCurrency = (curr) => {
        const zeroDecimalCurrencies = [
            'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
            'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
        ];
        return zeroDecimalCurrencies.includes(curr?.toUpperCase());
    };

    // Calculate total price including all fees (Gross-Up Logic matching Helpers.php)
    const calculateTotalSupporterPays = (price, curr, vatAmount = 0) => {
        const listedPrice = parseFloat(price || 0);
        const vat = parseFloat(vatAmount || 0);
        const isZeroDecimal = isZeroDecimalCurrency(curr);
        
        // Client Rule: Add VAT before other fees
        const priceWithVat = listedPrice + vat;

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
    function checkanonymous(e) {
        setKeepAnonmyous(e.target.checked);
        if (e.target.checked) {
            setData("anonymous", 1);
        } else {
            setData("anonymous", 0);
        }
    }

    const [checking, setChecking] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");

    const onVerify = useCallback((token) => {
        setCaptchaToken(token || "");
    }, []);

    useEffect(() => {
        setData("cf_turnstile_response", captchaToken || "");
    }, [captchaToken, setData]);

    const handleSubmit = () => {
        if (turnstileSiteKey && !captchaToken) {
            errorAlert("Please verify the captcha");
            return;
        }
        setChecking(true);
        post(
            route(`bill.checkout`, {
                uuid: bill.uuid,
            }),
            {
                preserveScroll: true,
                onSuccess: (data) => {
                    if (props?.flash?.error) {
                        errorAlert(props?.flash?.error || "Checkout failed.");
                    }
                    if (props?.flash?.success) {
                        successAlert(
                            props?.flash?.success ||
                                "Checkout successful! Your payment is being processed."
                        );
                    }
                    // optionally redirect or show success alert
                },
                onError: (errorBag) => {
                    errorAlert(errorBag);
                    console.error("Checkout failed", errorBag);
                    setCaptchaToken("");
                    if (turnstileRef.current) {
                        turnstileRef.current.reset();
                    }
                    // show error toasts, alerts, or update error state
                },
                onFinish: () => {
                    console.log("Request finished (success or error)");
                    // cleanup, stop loader, etc.
                    setChecking(false);
                },
            }
        );
    };

    return (
        <>
            <Authenticated auth={auth.user} user={user}>
                <Head title={`Join - ${bill?.name} bill`} />
                <div className={`py-4 md:py-12 px-0 pb-3 lg:px-2 bg-white`}>
                    <div className="max-w-[800px] mx-auto">
                        <div className="cartMain p-6 md:p-8 ">
                    
                                <h2 className="pb-1 wishtitle">
                                Bill Basket for {bill?.user?.name || " "}
                                <Link
                                    className="text-violet-600"
                                    target="_blank"
                                    href={`/${bill?.user?.username || ""}`}
                                >
                                    @{bill?.user?.username || ""}
                                </Link>
                            </h2>
                            <p className="pb-4">
                                You are about to pay on {bill.name} bill.
                            </p>

                            <div className="CartItemBox">
                                <div
                                    className={`border cartlist flex flex-wrap justify-between items-center content-between border-voilet shadow-voilet rounded-[20px]  mb-3 md:mb-4 lg:mb-5 p-3 md:p-4`}
                                >
                                    <div className="prodcartbox items-center">
                                        <div className="productimg">
                                            <img
                                                src={
                                                    bill.perma_link ||
                                                    uploadedimg
                                                }
                                                alt="img"
                                            />
                                        </div>
                                        <div>
                                            <div className="cartProdTitle pl-3">
                                                {bill.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="cartProRtbox mt-3 items-center">
                                        <div className="cartPric pr-4">
                                            {formatMultiPrice(
                                                bill && bill.price,
                                                bill && bill.currency
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="cartTotal px-0 pt-4 flex justify-end">
                                <ul className="max-w-[300px] w-full">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-lg text-gray-700">
                                            Subtotal
                                        </div>
                                        <div className="text-lg text-gray-700">
                                            {formatMultiPrice(
                                                bill?.price || "",
                                                bill && bill?.currency
                                            )}
                                        </div>
                                    </div>
                                    {/* <li className="flex justify-between">
                                        <span className="min-w-[100px] block text-lg">
                                            Platform Fee :
                                        </span>
                                        <div>
                                            <strong className="text-lg">
                                                {formatMultiPrice(
                                                    bill?.tax_amount || "",
                                                    bill && bill?.currency,
                                                    "adminfee"
                                                )}
                                            </strong>
                                            <button className="relative group w-[13px] h-[14px] bg-gray-700 text-white text-[11px] rounded-full ml-1.5 inline-block">
                                                ?
                                                <p className="absolute bg-[#505050] p-[10px] rounded-[30px] md:rounded-[40px]  top-[22px] right-[-18px] text-left font-normal text-[15px] z-[1] hidden group-hover:block">
                                                    {window.platformFeePercentage || 20}% Card Fees and £1
                                                    administrative fee 
                                                    applies to all transactions.
                                                </p>
                                            </button>
                                        </div>
                                    </li> */}
                                    {vat_amount && vat_amount > 0 ? (
                                        <li className="text-gray-700 flex justify-between">
                                            <span className="min-w-[100px] block text-lg">
                                                VAT :
                                            </span>
                                            <strong className="text-lg">
                                                {formatMultiPrice(
                                                    vat_amount || "",
                                                    bill && bill.currency
                                                )}
                                            </strong>
                                        </li>
                                    ) : (
                                        ""
                                    )}
                                    <li className="flex justify-between">
                                        <span className="min-w-[100px] block text-lg">
                                            Total :
                                        </span>
                                        <div className="text-right">
                                            <strong className="text-lg block">
                                                {formatMultiPrice(
                                                    calculateTotalSupporterPays(
                                                        bill?.price, 
                                                        bill?.currency,
                                                        vat_amount
                                                    ),
                                                    bill && bill?.currency
                                                )}
                                            </strong>
                                            <span className="text-[10px] text-gray-500 font-normal mt-1 leading-tight block">
                                                * Includes all fees
                                            </span>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            <div className="addMessage mt-2">
                                <form onSubmit={(e) => e.preventDefault()}>
                                    <ul className="flex flex-wrap">
                                        <li className="w-full">
                                            <label className=" text-sm font-medium text-gray-900">Add Message </label>
                                            <textarea
                                                className="mt-2 border-gray-300 border rounded-[30px] md:rounded-[40px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[30px] md:rounded-[40px] "
                                                onKeyUp={(e) =>
                                                    setData(
                                                        "message",
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Write message in under 800 Words..."
                                                defaultValue={data.message}
                                            ></textarea>
                                            <span className="text-xs text-red-600">
                                                {errors.message}
                                            </span>
                                        </li>
                                        <li className="w-full mt-3">
                                            <div className="flex flex-wrap">
                                                <div className="w-full mb-4">
                                                    <label className=" text-left">
                                                        From
                                                    </label>
                                                    <input
                                                        className="mt-1 border-gray-300 border !rounded-[12px]  px-4 py-2 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 "
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
                                                        {errors.name}
                                                    </span>
                                                </div>
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
                                                            auth.user &&
                                                            auth.user.email
                                                                ? "disabled"
                                                                : ""
                                                        } mt-1 border-gray-300 border !rounded-[12px] !h-[55px] !px-4 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 `}
                                                        value={data.email}
                                                        disabled={
                                                            auth &&
                                                            auth.user &&
                                                            auth.user.email
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
                                            </div>
                                        </li>
                                        <li className="cheklistbox">
                                            <label
                                                htmlFor="anonymous"
                                                className="text-left flex items-center"
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
                                            <p className="text-gray-500 text-sm mb-3">
                                                Your personal email and name
                                                will be private.
                                            </p>
                                            <label
                                                htmlFor="agreeterm"
                                                className="text-left"
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
                                                        exclusive posts.{" "}
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
                                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                                            <strong className="font-bold">Payment Unavailable: </strong>
                                            <span className="block sm:inline">This creator cannot receive payments yet.</span>
                                        </div>
                                    )}
                                    {turnstileSiteKey ? (
                                        <div className="mt-4 flex items-center justify-center">
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
                                            type="button"
                                            className={`${
                                                !data.agree ||
                                                processing ||
                                                checking ||
                                                (turnstileSiteKey && !captchaToken) ||
                                                !card_capabilities
                                                    ? "disabled"
                                                    : ""
                                            } button p w-full`}
                                            disabled={
                                                !data.agree ||
                                                processing ||
                                                checking ||
                                                (turnstileSiteKey && !captchaToken) ||
                                                !card_capabilities
                                            }
                                            onClick={handleSubmit}
                                        >
                                            {processing || checking
                                                ? "Processing..."
                                                : `Subscribe & Pay Now - ${formatMultiPrice(
                                                    calculateTotalSupporterPays(
                                                        bill?.price, 
                                                        bill?.currency,
                                                        vat_amount
                                                    ),
                                                    bill && bill?.currency
                                                )}`}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <Toaster />
            </Authenticated>
        </>
    );
}
