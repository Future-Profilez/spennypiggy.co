import { useRef, useState } from "react";
import { RyeClient, ENVIRONMENT, Marketplace } from "@rye-api/rye-sdk";
import PriceFormat from "@/includes/PriceFormat";
import { useEffect } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { Link, usePage } from "@inertiajs/react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function CartItems({ data, cartsItems, fetchCartItem }) {
    const { hcaptchakey } = usePage().props;
    const hcaptchaRef = useRef(null);
    const { formatMultiPrice } = PriceFormat();
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [totalPrice, setTotalPrice] = useState(0);
    const [isChecked, setIsChecked] = useState(false);
    const [checking, setChecking] = useState(false);
    const[loading,setLoading]=useState(false);

    console.log("data",data);
    console.log("cartsItems",cartsItems);
    const getShopperIp = async () => {
        try {
            const response = await fetch("https://api64.ipify.org?format=json");
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error("Error fetching shopper IP:", error);
            return "0.0.0.0"; // Fallback IP
        }
    };

    const handleQuantityChangeBackend = async (productId, finalQuantity) => {
        const shopperIp = await getShopperIp();
        const ryeClient = new RyeClient({
            authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
            shopperIp: shopperIp,
            environment: ENVIRONMENT.STAGING,
        });
        console.log(
            "data",
            productId,
            finalQuantity,
            data?.cart?.id,
            cartsItems?.creator_id
        );
        // return;
        const result = await ryeClient.updateCartItems({
            input: {
                id: data?.cart?.id,
                items: {
                    amazonCartItemsInput: [
                        {
                            productId: productId,
                            quantity: finalQuantity,
                        },
                    ],
                },
            },
        });
        console.log("result", result);
        const addCart = await axios.post(route("create.cart"), {
            data: result, // Pass productData as the request body
            cart_id: data?.cart?.id, // Pass productData as the request body
            creator_id: cartsItems?.creator_id,
        });
        console.log("addcart", addCart);
        // successAlert(addCart?.data?.message);
    };

    const handleRemove = async (productId) => {
        const shopperIp = await getShopperIp();
        const ryeClient = new RyeClient({
            authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
            shopperIp: shopperIp,
            environment: ENVIRONMENT.STAGING,
        });
        // console.log("data",productId,data?.cart?.id,cartsItems?.creator_id );
        // return;
        const result = await ryeClient.deleteCartItems({
            input: {
                id: data?.cart?.id,
                items: {
                    amazonProducts: [
                        {
                            productId: productId,
                        },
                    ],
                },
            },
        });
        console.log("result", result);
        const addCart = await axios.post(route("create.cart"), {
            data: result, // Pass productData as the request body
            cart_id: data?.cart?.id, // Pass productData as the request body
            creator_id: cartsItems?.creator_id,
        });
        console.log("addcart", addCart);
        // successAlert(addCart?.data?.message);
    };

    const [datatoMap, setDataToMap] = useState(
        data &&
            data?.cart &&
            data?.cart?.stores[0] &&
            data?.cart?.stores[0]?.cartLines
    );

    useEffect(() => {
        setDataToMap(
            data &&
                data?.cart &&
                data?.cart?.stores[0] &&
                data?.cart?.stores[0]?.cartLines
        );
    }, [data]);

    useEffect(() => {
        calculateTotalPrice();
    }, [datatoMap]); // Recalculate whenever datatoMap changes

    const calculateTotalPrice = () => {
        let newTotalPrice = 0;
        if (datatoMap) {
            // Check if datatoMap is not null or undefined
            datatoMap.forEach((item) => {
                newTotalPrice +=
                    (item.product.price.value / 100) * item.quantity; // Correct price calculation
            });
        }
        setTotalPrice(newTotalPrice);
    };

    const removeItem = async (productId) => {
        setDataToMap((prevData) =>
            prevData.filter((item) => item.product.id !== productId)
        );
        await handleRemove(productId);
        fetchCartItem();
    };

    const updateQuantity = (productId, finalQuantity) => {
        setDataToMap((prevData) => {
            return prevData.map((item) => {
                if (item.product.id === productId) {
                    const newQuantity = Math.max(1, finalQuantity);
                    return { ...item, quantity: newQuantity };
                }
                return item;
            });
        });
        handleQuantityChangeBackend(productId, finalQuantity);
    };

    const handleCartDeletion = async () => {
        const shopperIp = await getShopperIp();
        const ryeClient = new RyeClient({
            authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
            shopperIp: shopperIp,
            environment: ENVIRONMENT.STAGING,
        });
        const result = await ryeClient.removeCart({
            input: {
              id: data?.cart?.id,
            },
          });
          const addCart = await axios.get(`remove-cart/${data?.cart?.id}`);
          if(addCart?.data?.status  === "success"){
            successAlert(addCart?.data?.message);
          }
          else{
            errorAlert(addCart?.data?.message);
          }
        console.log("addcart", addCart);
    }

    const clearcart = async() => {
        setDataToMap([]);
        await handleCartDeletion();
        fetchCartItem();
    }

    const executeCaptcha = async(e) => {
        e.preventDefault();
        hcaptchaRef.current.execute();
        setChecking(true);
    };

    const onVerify = (token) => {
        handleSubmit();
    };

    const handleSubmit=async()=>{
        console.log("data?.cart?.id", data?.cart?.id);
        console.log("cartsItems?.creator?.id", cartsItems?.creator?.id);
        // return;
        try {
            const response = await axios.post(route('handle.rye.product.payment'),{
                    cart_id : data?.cart?.id,
                    creator_id : cartsItems?.creator?.id,
                }
            );
            console.log("response?.data", response?.data);
            if (response?.data?.status === true) {
                window.location.href = response?.data?.url;
            } else {
                errorAlert(response?.data?.message);
            }
        } catch (error) {
            console.log("error", error?.response?.data);
            errorAlert(error?.response?.data?.message);
        }

    }

    // const handleSubmit = async () => {
    //     const shopperIp = await getShopperIp();
    //     const ryeClient = new RyeClient({
    //         authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
    //         shopperIp: shopperIp,
    //         environment: ENVIRONMENT.STAGING,
    //     });

    //     console.log("data", data?.cart?.id);
    //     return;

    //     const result = await ryeClient.submitCart({
    //         input: {
    //             id: data?.cart?.id,
    //             token: "01JMYA3T67ESWNMRJABZP594CH",
    //             billingAddress: {
    //                 firstName: "Abhinav",
    //                 lastName: "Mathur",
    //                 phone: "7568311283",
    //                 address1: "Office No. D-105B, G-4, Golden OAK-1, Devi Marg",
    //                 city: "Jaipur",
    //                 provinceCode: "RJ",
    //                 countryCode: "IN",
    //                 postalCode: "302016",
    //             },
    //         },
    //     });

    //     console.log("result", result?.data);
    // };


    return (
        <div className={`px-2`}>
            <div className="my-4 cartPage bg-white p-4 p-md-5 border-pink shadow-pink border-pink rounded-3xl">
                <div className="cartMain">
                    <h2 className="pb-1 wishtitle">Your Basket for {cartsItems?.creator?.name || ""}
                    <Link
                            className="text-voilet"
                            href={`/${cartsItems?.creator?.username || ""}`}
                        >
                            @{cartsItems?.creator?.username || ""}
                        </Link>
                    </h2>
                    <p className="pb-4">
                        You are about to send a payout to
                        <strong> {cartsItems?.creator?.name || ""} </strong> to fund their lifestyle.
                    </p>
                    <div className="CartItemBox">
                        {datatoMap &&
                            datatoMap.length > 0 &&
                            datatoMap?.map((c, i) => {
                                return (
                                    <div
                                        className={`border cartlist flex flex-wrap justify-between content-between items-center border-purple shadow-purple rounded-xl
                                        mb-3 mb-md-4 mb-ml-5 p-3 p-md-4`}
                                    >
                                        <div className="prodcartbox items-center">
                                            <div className="productimg">
                                                <img
                                                    src={
                                                        c?.product?.images[0]
                                                            ?.url || ""
                                                    }
                                                    alt="img"
                                                />
                                            </div>
                                            <div>
                                                <div className="cartProdTitle ps-3 line-clamp-2">
                                                    {c?.product?.title?.length >
                                                    30
                                                        ? c.product.title.slice(
                                                              0,
                                                              30
                                                          ) + "..."
                                                        : c?.product?.title}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="cartProRtbox mt-3 items-center">
                                            <div className="quty flex items-center me-4 ">
                                                {/* Decrement Button */}
                                                <button
                                                    disabled={c?.quantity === 1}
                                                    onClick={() =>
                                                        updateQuantity(
                                                            c.product.id,
                                                            c?.quantity - 1
                                                        )
                                                    }
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                    >
                                                        <path
                                                            d="M19 12.998H5V10.998H19V12.998Z"
                                                            fill="black"
                                                        />
                                                    </svg>
                                                </button>
                                                <div className="qutynum">
                                                    {c?.quantity}
                                                </div>

                                                {/* Increment button */}
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(
                                                            c.product.id,
                                                            c?.quantity + 1
                                                        )
                                                    }
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="24"
                                                        height="24"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                    >
                                                        <path
                                                            d="M11 13H5V11H11V5H13V11H19V13H13V19H11V13Z"
                                                            fill="black"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="cartPric pe-4">
                                                {formatMultiPrice(
                                                    c?.product?.price?.value /
                                                        100,
                                                    c?.product?.price?.currency
                                                )}
                                                {/* {
                                                    c?.product?.price
                                                        ?.value
                                                } */}
                                            </div>
                                            <button
                                                className="del"
                                                onClick={() =>
                                                    removeItem(c.product.id)
                                                }
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.99933 19.5493 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.804 20.021 18.412 20.413C18.02 20.805 17.5493 21.0007 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z"
                                                        fill="#FF6565"
                                                    />
                                                </svg>
                                            </button>
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

                    <div className="cartTotal px-0 py-3">
                        {/* <div className="cartSubTotal text-right mt-1">
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
                        </div> */}
                        {/* <div className="cartSubTotal text-right mt-1">
                            <span>Subtotal :</span>{" "}
                            <strong className="text-end">
                                {formatMultiPrice(
                                    subtotal || "",
                                    datas?.user && datas?.user?.default_currency
                                )}
                            </strong>
                        </div> */}
                        {datatoMap?.length > 0 && (
                            <div className="cartSubTotal text-right mt-1">
                                <strong className="text-dark">Total :</strong>{" "}
                                <strong className="text-end">
                                    {formatMultiPrice(
                                        totalPrice || 0,
                                        datatoMap[0]?.product?.price?.currency
                                    )}
                                </strong>
                            </div>
                        )}
                    </div>

                    <div className="addMessage">
                        <form onSubmit={executeCaptcha}>
                            <ul className="row">
                                {/* <li>
                                    <label>Add Message </label>
                                    <textarea
                                        onChange={(e) =>
                                            setMessage(e.target.value)
                                        }
                                        placeholder="Send some words of support..."
                                    ></textarea>
                                </li> */}
                                {/* <li className="w-100 mt-3">
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
                                </li> */}
                                <li className="cheklistbox">
                                    {/* <label
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
                                    </label> */}
                                    {/* <p className="text-muted text-small mb-3">
                                        Your personal email and name will be
                                        private.
                                    </p> */}

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
                                    onClick={() => clearcart()}
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
                    </div>
                </div>
            </div>
        </div>
    );
}
