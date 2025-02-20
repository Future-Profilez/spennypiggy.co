// import { useRef, useState } from "react";
// import CartItem from "./CartItem";
// import { Link, router, usePage } from "@inertiajs/react";
// import PriceFormat from "@/includes/PriceFormat";
// import DeviceID from "@/includes/DeviceID";
// import axios from "axios";
// import { useEffect } from "react";
// import { add_to_cart } from "@/Pages/redux/UserSlice";
// import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function CartItems({data}) {
    return (
        <div className={`px-2`}>
            <div className="my-4 cartPage bg-white p-4 p-md-5 border-pink shadow-pink border-pink rounded-3xl">
                <div className="cartMain">
                    <h2 className="pb-1 wishtitle">
                        Your Basket is Here.
                    </h2>
                    <p className="pb-4">
                        You are about to send a payout to
                        <strong> a user </strong> to fund
                        their lifestyle.
                    </p>
                    <div className="CartItemBox">
                        {data && data?.cart && data?.cart?.stores[0] 
                        && data?.cart?.stores[0]?.cartLines &&
                          data?.cart?.stores[0]?.cartLines?.map((c, i) => {
                                return (
                                    <div className={`border cartlist flex flex-wrap justify-between content-between items-center border-purple shadow-purple rounded-xl 
                                        mb-3 mb-md-4 mb-ml-5 p-3 p-md-4`}>
                                        <div className='prodcartbox items-center'>
                                            <div className='productimg'>
                                                <img src={c?.product?.images[0]?.url} alt='img' />
                                            </div>
                                            <div>
                                                <div className='cartProdTitle ps-3 line-clamp-2'>
                                                {c?.product?.title?.length > 30 
                                                ? c.product.title.slice(0, 30) + "..." 
                                                : c?.product?.title}
                                                </div>
                                            </div>
                                        </div>
                            
                            
                                        <div className='cartProRtbox mt-3 items-center'>
                                            <div className="quty flex items-center me-4 ">
                                                <button 
                                                // disabled={quantity == 1} 
                                                // onClick={decrementCount}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                        <path d="M19 12.998H5V10.998H19V12.998Z" fill="black"/>
                                                    </svg>
                                                </button>
                                                <div className="qutynum">{c?.quantity}</div>
                                                <button 
                                                // onClick={incrementCount}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                    <path d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z" fill="black"/>
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className='cartPric pe-4'>
                                                {/* {formatMultiPrice(data.price, currency)} */}
                                                {c?.product?.price?.displayValue}
                                            </div>
                                            <button className='del' onClick={()=>removeCart(data && data.uuid)} ><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                <path d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.99933 19.5493 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.804 20.021 18.412 20.413C18.02 20.805 17.5493 21.0007 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z" fill="#FF6565"/>
                                                </svg></button>
                                                {/* <ToCart actionfrom={true} removeItem={removeItem} item={data}
                                                uuid={data.uuid} custom={<><button className='del'>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                    <path d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.99933 19.5493 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.804 20.021 18.412 20.413C18.02 20.805 17.5493 21.0007 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z" fill="#FF6565"/>
                                                    </svg>
                                                </button></>} >
                                                </ToCart> */}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* <div className="cartTotal px-0 py-3">
                        <div className="cartSubTotal text-right mt-1">
                            <span>Platform Fee :</span>{" "}
                            <strong className="text-end">
                                {formatMultiPrice(
                                    fee || "",
                                    datas?.user && datas?.user?.default_currency
                                )}
                                <button className="relative group w-[13px] h-[14px] bg-gray-700 text-white text-[11px] rounded-full ml-1.5 inline-block">
                                    ?
                                    <p className="absolute bg-[#505050] p-[10px] rounded-md top-[20px] right-[-28px] text-left font-normal text-[15px] z-[1] hidden group-hover:block">
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
                            </strong>
                        </div>
                        <div className="cartSubTotal text-right mt-1">
                            <span>Subtotal :</span>{" "}
                            <strong className="text-end">
                                {formatMultiPrice(
                                    subtotal || "",
                                    datas?.user && datas?.user?.default_currency
                                )}
                            </strong>
                        </div>
                        <div className="cartSubTotal text-right mt-1">
                            <strong className="text-dark">Total :</strong>{" "}
                            <strong className="text-end">
                                {formatMultiPrice(
                                    fee + subtotal || "",
                                    datas?.user && datas?.user?.default_currency
                                )}
                            </strong>
                        </div>
                    </div>

                    <div className="addMessage">
                        <form onSubmit={executeCaptcha}>
                            <ul className="row">
                                <li>
                                    <label>Add Message </label>
                                    <textarea
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
                                            id="agreeterm"
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
                            <div className="mt-4 d-flex align-items-center justify-content-between">
                                <button
                                    type="button"
                                    onClick={() => clearcart(datas?.user?.id)}
                                    className={`btn-pink md mt-3 px-4 text-center`}
                                >
                                    {" "}
                                    {loading ? "Wait.." : "Clear"}{" "}
                                </button>
                                <button
                                    type="submit"
                                    className={`${
                                        isChecked ? "" : "disabled"
                                    } btn-pink md mt-3 text-center`}
                                >
                                    {checking ? "Wait.." : "Checkout"}{" "}
                                </button>
                            </div>
                            <HCaptcha
                                ref={hcaptchaRef}
                                sitekey={hcaptchakey || ""}
                                data-theme="light"
                                size="invisible"
                                onVerify={onVerify}
                                required
                            />
                        </form>
                    </div> */}
                </div>
            </div>
        </div>
    );
}
