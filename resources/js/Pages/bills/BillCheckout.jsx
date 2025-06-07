import { useEffect, useRef, useState } from "react";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { Toaster } from "react-hot-toast";
import { useAlerts } from "@/Components/Alerts";
import PriceFormat from "@/includes/PriceFormat";
import uploadedimg from "../../../assets/img/uploadedimg.png";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function BillCheckout(props) {
    const hcaptchaRef = useRef(null);
    const { formatMultiPrice } = PriceFormat();
    const { bill, vat_amount } = props;
    const { user, auth, hcaptchakey } = usePage().props;

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
        post(
            route(`bill.checkout`, {
                uuid: bill.uuid,
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
        hcaptchaRef.current.execute();
        setChecking(true);
    };

    return (
        <>
            <Authenticated auth={auth.user} user={user}>
                <Head title={`Join - ${bill?.name} bill`} />
                <div className={`px-0 pb-3 px-lg-2`}>
                    <div className="my-4 cartsub cartPage bg-white p-4 p-md-5 border-pink shadow-pink border-pink rounded-3xl">
                        <div className="cartMain">
                            <h2 className="pb-1 wishtitle">
                                Bill Basket for {bill?.user?.name || " "}
                                <Link
                                    className="text-voilet"
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
                                    className={`border cartlist flex flex-wrap justify-between items-center content-between items-center border-purple shadow-purple rounded-xl mb-3 mb-md-4 mb-ml-5 p-3 p-md-4`}
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
                                            <div className="cartProdTitle ps-3">
                                                {bill.name}
                                            </div>
                                            <div className="badge bg-info text-dark me-4 ms-3 ">
                                                Pay Monthly
                                            </div>
                                        </div>
                                    </div>
                                    <div className="cartProRtbox mt-3 items-center">
                                        <div className="cartPric pe-4">
                                            {formatMultiPrice(
                                                bill && bill.price,
                                                bill && bill.currency
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="cartTotal px-0 py-3">
                                <div className="cartSubTotal text-right mt-1">
                                    <span>Platform Fee :</span>{" "}
                                    <strong className="text-end">
                                        {formatMultiPrice(
                                            bill.tax_amount || "", bill && bill.currency
                                        )}
                                    </strong>
                                     <button className="relative group w-[13px] h-[14px] bg-gray-700 text-white text-[11px] rounded-full ml-1.5 inline-block">
                                    ?
                                    <p className="absolute bg-[#505050] p-[10px] rounded-md top-[22px] right-[-18px] text-left font-normal text-[15px] z-[1] hidden group-hover:block">
                                        <strong className="text-white font-normal">
                                            Card Payments:
                                        </strong>{" "}
                                        <br />
                                        Bills - 10%
                                        <br />
                                        Memberships - 10%
                                        <br />
                                        Piggy Bank - 20%
                                        <br />
                                        Crowdfunding - 20%
                                        <br />
                                        Subscriptions - 10%
                                        <br />
                                        Single Purchases - 20%
                                        <br />
                                        Profile Shop - 20%
                                        <br />
                                        <br />
                                        Administrative Fee on all Transactions -
                                        £1
                                    </p>
                                </button>
                                </div>
                                {vat_amount && vat_amount > 0 ? (
                                    <div className="cartSubTotal text-right mt-1">
                                        <span>VAT :</span>{" "}
                                        <strong className="text-end">
                                            {formatMultiPrice(
                                                vat_amount || "",
                                                bill && bill.currency
                                            )}
                                        </strong>
                                    </div>
                                ) : (
                                    ""
                                )}
                                <div className="cartSubTotal text-right mt-1">
                                    <span>Subtotal :</span>{" "}
                                    <strong className="text-end">
                                        {formatMultiPrice(
                                            bill.price || "",
                                            bill && bill.currency
                                        )}
                                    </strong>
                                </div>
                                <div className="cartSubTotal text-right mt-1">
                                    <strong className="text-dark">
                                        Total :
                                    </strong>{" "}
                                    <strong className="text-end">
                                        {formatMultiPrice(
                                            bill.tax_amount +
                                                bill.price +
                                                vat_amount || "",
                                            bill && bill.currency
                                        )}
                                    </strong>
                                </div>
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
                                                        {errors.name}
                                                    </span>
                                                </div>
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
                                                            auth.user &&
                                                            auth.user.email
                                                                ? "disabled"
                                                                : ""
                                                        } form-input w-100 rounded`}
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
                                                        on yourchoice and can be
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
                                    <div className="mt-4 flex items-center justify-content-center">
                                        <button
                                            type="submit"
                                            className={`${
                                                !data.agree ||
                                                processing ||
                                                checking
                                                    ? "disabled"
                                                    : ""
                                            } btn-pink md px-4 mt-3 text-center`}
                                            disabled={
                                                !data.agree ||
                                                processing ||
                                                checking
                                            }
                                        >
                                            {processing || checking
                                                ? "Processing..."
                                                : "Pay Now"}
                                        </button>
                                        <HCaptcha
                                            ref={hcaptchaRef}
                                            sitekey={hcaptchakey || ""}
                                            data-theme="light"
                                            size="invisible"
                                            onVerify={onVerify}
                                            required
                                        />
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
