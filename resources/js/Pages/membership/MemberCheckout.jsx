import { useEffect, useRef, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import Membership from "./Membership";
import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import Social from "../Auth/Social";
import axios from "axios";

export default function SubCheckout(props) {
    const hcaptchaRef = useRef(null);
    const { hcaptchakey } = usePage().props;
    const { user, auth, membership, vat_amount, isSocilAdded } = props;
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
    const handleSubmit = (e) => {
        e && e.preventDefault();
        post(
            route(`membership.checkout`, {
                uuid: membership?.uuid || null,
                reccure:
                    membership?.level == "lifetime" ? "onetime" : "continue",
            }),
            {
                preserveScroll: true,
            }
        );
    };

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
                <div className={`px-0 mb-3 px-lg-2`}>
                    <div className="my-4 cartsub cartPage bg-white p-4 p-md-5 border-pink shadow-pink border-pink rounded-3xl">
                        <div className="cartMain">
                            <h2 className="pb-1 wishtitle">
                                Membership Basket for{" "}
                                {membership?.user?.name || " "}
                                <Link
                                    className="text-voilet"
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

                            <Membership hidebtn={true} item={membership} />

                            <div className="cartTotal px-0 pt-4 flex justify-end">
                                <ul className="max-w-[300px] w-full">
                                    <li className="flex justify-content-between">
                                        <span className="min-w-[100px] block">Subtotal :</span>
                                        <strong>{formatMultiPrice(membership?.price || "",membership && membership?.currency)}</strong>
                                    </li>
                                    <li className="flex justify-content-between">
                                        <span className="min-w-[100px] block">Platform Fee :</span>
                                        <div>
                                            <strong>{formatMultiPrice(membership?.tax_amount || "",membership && membership?.currency, 'adminfee')}</strong>
                                            <button className="relative group w-[13px] h-[14px] bg-gray-700 text-white text-[11px] rounded-full ml-1.5 inline-block">
                                            ?
                                            <p className="absolute bg-[#505050] p-[10px] rounded-md top-[22px] right-[-18px] text-left font-normal text-[15px] z-[1] hidden group-hover:block">
                                                {window.platformFeePercentage || 20}% Card Fees and £1 administrative fee of applies to
                                            all transactions.
                                            </p>
                                            </button>
                                        </div>
                                    </li>
                                    {vat_amount && vat_amount > 0 ? (
                                        <li className="flex justify-content-between">
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
                                    <li className="flex justify-content-between">
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
                            <div className="addMessage mt-5">
                                <form onSubmit={executeCaptcha}>
                                    <ul className="row">
                                        <li>
                                            <label>Add Message </label>
                                            <textarea
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
                                        <li className="w-100 mt-3">
                                            <div className="row">
                                                <div className="col-md-12 mb-4">
                                                    <label className="d-block text-start">
                                                        Email{" "}
                                                    </label>
                                                    <p className="text-small text-muted mb-1">
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
                                                        } form-input w-100 rounded`}
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
                                                <div className="col-md-12 mb-4">
                                                    <label className="d-block text-start">
                                                        From
                                                    </label>
                                                    <input
                                                        className="form-input w-100 rounded"
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
                                        <li className="cheklistbox">
                                            <label
                                                htmlFor="anonymous"
                                                className="text-start"
                                            >
                                                <input
                                                    onChange={checkanonymous}
                                                    type="checkbox"
                                                    id="anonymous"
                                                    name="anonymous"
                                                    className="me-2"
                                                    value="anonymous"
                                                ></input>
                                                Keep anonymous
                                            </label>
                                            <p className="text-muted text-small mb-3">
                                                Your personal email and name
                                                will be private.
                                            </p>
                                            <label
                                                htmlFor="agreeterm"
                                                className="text-start"
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
                                                    className="me-2"
                                                    value="agreeterm"
                                                ></input>
                                                I understand I am paying the
                                                creator directly and I agree to
                                                the{" "}
                                                <Link
                                                    target="_blank"
                                                    className="text-voilet"
                                                    href={route(
                                                        "terms-and-conditions"
                                                    )}
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
                                    <div className="mt-4 flex items-center justify-content-center">
                                        <button
                                            type="submit"
                                            className={`${
                                                !data.agree ||
                                                processing ||
                                                checking
                                                    ? "disabled"
                                                    : ""
                                            } btn-pink md !px-8 mt-3 text-center`}
                                            disabled={
                                                !data.agree ||
                                                processing ||
                                                checking
                                            }
                                        >
                                            {processing || checking
                                                ? "Processing..."
                                                : "Join Now"}
                                        </button>
                                        {hcaptchakey && hcaptchakey !== '' && (
                                            <HCaptcha
                                                ref={hcaptchaRef}
                                                sitekey={hcaptchakey || '10000000-ffff-ffff-ffff-000000000001'}
                                                data-theme="light"
                                                size="invisible"
                                                onVerify={onVerify}
                                                required
                                            />
                                        )}
                                    </div>
                                </form>
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
