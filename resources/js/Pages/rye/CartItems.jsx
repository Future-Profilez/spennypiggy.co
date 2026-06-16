import { useRef, useState } from "react";
import { RyeClient, ENVIRONMENT, Marketplace } from "@rye-api/rye-sdk";
import PriceFormat from "@/includes/PriceFormat";
import { useEffect } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { Link, usePage } from "@inertiajs/react";
import Turnstile from "@/Components/Turnstile";
import CheckoutLegalTerms from "@/Components/CheckoutLegalTerms";
import AllCountries from '../../includes/AllCountries';

export default function CartItems({ data, cartsItems, fetchCartItem, auth }) {
    const { turnstileSiteKey } = usePage().props;
    const turnstileRef = useRef(null);
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [totalPrice, setTotalPrice] = useState(0);
    const [isChecked, setIsChecked] = useState(false);
    const [digitalWaiver, setDigitalWaiver] = useState(false);
    const [checking, setChecking] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    // const [formData, setFormData] = useState({
    //       country: '',
    //       street_address: '',
    //       city: '',
    //       state: '',
    //       postal_code: '',
    //    });

    // const handleChange = (e) => {
    //     setFormData({
    //       ...formData,
    //       [e.target.name]: e.target.value
    //     });
    // }

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
        // console.log(
        //     "data",
        //     productId,
        //     finalQuantity,
        //     data?.cart?.id,
        //     cartsItems?.creator_id
        // );
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
        const addCart = await axios.post(route("create.cart"), {
            data: result, // Pass productData as the request body
            cart_id: data?.cart?.id, // Pass productData as the request body
            creator_id: cartsItems?.creator_id,
        });
        if (addCart?.data?.status) {
            successAlert(addCart?.data?.message);
        } else {
            errorAlert(response.data.message);
        }
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
        const addCart = await axios.post(route("create.cart"), {
            data: result, // Pass productData as the request body
            cart_id: data?.cart?.id, // Pass productData as the request body
            creator_id: cartsItems?.creator_id,
        });
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
        let baseTotal = 0;
        let currency = 'USD';
        if (datatoMap && datatoMap.length > 0) {
            currency = datatoMap[0]?.product?.price?.currency || 'USD';
            datatoMap.forEach((item) => {
                baseTotal += (item.product.price.value / 100) * item.quantity;
            });
        }
        
        // Rye items are grossed up as a batch in the backend
        const breakdown = calculateTotalSupporterPays(baseTotal, currency);
        setTotalPrice(breakdown.total_supporter_pays);
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
        if (addCart?.data?.status) {
            successAlert(addCart?.data?.message);
        } else {
            errorAlert(addCart?.data?.message);
        }
    };

    const clearcart = async () => {
        setDataToMap([]);
        await handleCartDeletion();
        fetchCartItem();
    };

    // const executeCaptcha = async (e) => {
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

    const [captchaToken, setCaptchaToken] = useState("");
    const onVerify = (token) => {
        setCaptchaToken(token || "");
        // handleSubmit(token);
    };


    const handleSubmit = async () => {
        try {
            if (!captchaToken) {
                errorAlert("Please verify the captcha");
                return false;
            }
            if (!digitalWaiver) {
                errorAlert("Please accept the digital waiver");
                return false;
            }
            const response = await axios.post(
                route("handle.rye.product.payment"),
                {
                    cart_id: data?.cart?.id,
                    creator_id: cartsItems?.creator?.id,
                    is_anonymous: isAnonymous,
                    cf_turnstile_response: captchaToken || "",
                    digital_waiver: digitalWaiver,
                }
            );
            if (response?.data?.status === true) {
                localStorage &&
                    localStorage.setItem(
                        "orderDetails",
                        JSON.stringify(response?.data?.orderDetails) || ""
                    );
                window.location.href = response?.data?.url;
                setChecking(false);
            } else {
                errorAlert(response?.data?.message);
                setChecking(false);
                if (turnstileRef.current) {
                    turnstileRef.current.reset();
                }
            }
        } catch (error) {
            errorAlert(error?.response?.data?.message);
            setChecking(false);
            if (turnstileRef.current) {
                turnstileRef.current.reset();
            }
        }
    };

    return (
        <div className={`px-2`}>
            <div className="my-4 cartPage bg-white p-4 md:p-5 border-pink shadow-[4px_4px_0px_0px_#FF007F]ink border-pink rounded-[30px]   ">
                <div className="cartMain">
                    <h2 className="pb-1 wishtitle">
                        Your Basket for {cartsItems?.creator?.name || ""}
                        <Link
                            className="text-violet-600"
                            href={`/${cartsItems?.creator?.username || ""}`}
                        >
                            @{cartsItems?.creator?.username || ""}
                        </Link>
                    </h2>
                    <p className="pb-4">
                        You are about to purchase content from
                        <strong> {cartsItems?.creator?.name || ""}</strong>.
                    </p>
                    <div className="CartItemBox">
                        {datatoMap &&
                            datatoMap.length > 0 &&
                            datatoMap?.map((c, i) => {
                                return (
                                    <div
                                        className={`border cartlist flex flex-wrap justify-between content-between items-center border-violet-600 shadow-violet rounded-[30px]  
                                        mb-3 md:mb-4 md:ml-5 p-3 md:p-4`}
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
                                                <div className="cartProdTitle pl-3 line-clamp-2">
                                                    {c?.product?.title?.length >
                                                    30
                                                        ? c.product.title.slice(
                                                              0,
                                                              29
                                                          ) + "..."
                                                        : c?.product?.title}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="cartProRtbox mt-3 items-center">
                                            <div className="quty flex items-center mr-4 ">
                                                {/* Decrement Button */}
                                                <button
                                                    type="button"
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
                                                    type="button"
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
                                            <div className="cartPric pr-4">
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
                                                type="button"
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
                                                    <path d="M7 21C6.45 21 5.979 20.804 5.587 20.412C5.195 20.02 4.99933 19.5493 5 19V6H4V4H9V3H15V4H20V6H19V19C19 19.55 18.804 20.021 18.412 20.413C18.02 20.805 17.5493 21.0007 17 21H7ZM17 6H7V19H17V6ZM9 17H11V8H9V17ZM13 17H15V8H13V17Z"fill="#FF6565"/>
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
                            <strong className="text-right">
                                {formatMultiPrice(
                                    fee || "",
                                    datas?.user && datas?.user?.default_currency
                                )}
                                <button className="relative group w-[13px] h-[14px] bg-gray-700 text-white text-[11px] rounded-full ml-1.5 inline-block">
                                    ?
                                    <p className="absolute bg-[#505050] p-[10px] rounded-[30px]   top-[20px] right-[-28px] text-left font-normal text-[15px] z-[1] hidden group-hover:block">
                                        <strong className="text-white font-normal">
                                            Card Payments:
                                        </strong>{" "}
                                        <br />
                                        Bills - 10%
                                        <br />
                                        Memberships - 10%
                                        <br />
                                        Piggy Bank - {window.platformFeePercentage || 20}%
                                        <br />
                                        Crowdfunding - {window.platformFeePercentage || 20}%
                                        <br />
                                        Subscriptions - 10%
                                        <br />
                                        Single Purchases - {window.platformFeePercentage || 20}%
                                        <br />
                                        Profile Shop - {window.platformFeePercentage || 20}%
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
                                <strong className="text-gray-900">Total :</strong>{" "}
                                <strong className="text-right">
                                    {formatMultiPrice(
                                        totalPrice || 0,
                                        datatoMap[0]?.product?.price?.currency
                                    )}
                                </strong>
                            </div>
                        )}
                    </div>

                    <div className="addMessage">
                            <ul className="flex flex-wrap">
                                <li className="cheklistbox">
                                    {/* Form fields starts here */}
                                    <p className="py-2">
                                     The below information will be used while
                                    sending your gift to <strong> {cartsItems?.creator?.name || ""} </strong>.
                                    </p>
                                    <div className="mb-3">
                                        <p className='mb-1'>Name</p>
                                        <input required disabled={auth && auth.user?.name ? true : false}
                                            className="border-gray-300 border rounded-[30px]   px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-[30px]  "
                                            defaultValue={auth && auth.user?.name}
                                            // onChange={(e) => setName(e.target.value)}
                                            type="text" placeholder="Enter name.. " />
                                    </div>
                                    <div className="form-field mb-3 ">
                                        <p className='mb-1'>Email</p>
                                        <input required  disabled={auth && auth.user?.email ? true : false}
                                            className="border-gray-300 border rounded-[30px]   px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-[30px]  "
                                            defaultValue={auth && auth.user?.email}
                                            // onChange={(e) => setEmail(e.target.value)}
                                            type="email" placeholder="Enter email.. " />
                                        <p className='text-[12px] text-gray-500 mt-1 ' >Your email address is kept private and will not be shown to anyone.</p>
                                    </div>
                                    
                                    <div className="form-field mb-3">
                                        <label htmlFor="anonymous" className="flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                id="anonymous"
                                                name="anonymous"
                                                className="mr-2"
                                                onChange={(e) => setIsAnonymous(e.target.checked)}
                                            />
                                            <span>Send anonymously</span>
                                        </label>
                                        <p className='text-[12px] text-gray-500 mt-1'>Your name will not be shown to the recipient if checked.</p>
                                    </div>


                                    {/* <div className="form-field mb-3 ">
                                        <p className='mb-2'>Shipping Information</p>
                                        <select required className="border-gray-300 border rounded-[30px]   px-4 py-2 w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500 rounded-[30px]  " name="country"
                                        onChange={handleChange}
                                        >
                                            <option value={''} >Choose Country</option>
                                            {AllCountries && AllCountries.map((c, i) => <option key={i} value={c.code}>{c.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-field mb-3 ">
                                        <input required
                                            className="form-input w-100 rounded"
                                            onChange={handleChange}
                                            name="street_address"
                                            type="text" placeholder="Address" />
                                    </div>
                                    <div className="form-field mb-3 ">
                                        <input required
                                            className="form-input w-100 rounded"
                                            onChange={handleChange}
                                            name="city"
                                            type="text" placeholder="City" />
                                    </div>
                                    <div className='grid grid-cols-2 gap-3' >
                                        <div className="form-field mb-3 ">
                                            <input required
                                            className="form-input w-100 rounded"
                                            onChange={handleChange}
                                             name="state"
                                            type="text" placeholder="State" />
                                        </div>
                                        <div className="form-field mb-3 ">
                                            <input required
                                            className="form-input w-100 rounded"
                                            onChange={handleChange}
                                            name="postal_code"
                                            type="number" placeholder="Postal Code" />
                                        </div>
                                    </div> */}
                                    {/* Form fields ends here */}
                                    <CheckoutLegalTerms onAgreeChange={(checked) => {
                                        setIsChecked(checked);
                                        setDigitalWaiver(checked);
                                    }} />
                                </li>
                            </ul>

                            {turnstileSiteKey ? (
                                <Turnstile
                                    ref={turnstileRef}
                                    size="normal"
                                    theme="light"
                                    onVerify={onVerify}
                                />
                            ) : null}

                            <div className="mt-4 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => clearcart()}
                                    className={`btn-pink md mt-3 px-4 text-center`}
                                >
                                    {loading ? "Wait.." : "Clear"}{" "}
                                </button>
                                <button
                                    type="button"
                                    disabled={!isChecked || !digitalWaiver || checking || (turnstileSiteKey && !captchaToken)}
                                    onClick={handleSubmit}
                                    className={`${isChecked && digitalWaiver && !(turnstileSiteKey && !captchaToken) && !checking ? "" : "disabled"} btn-pink md mt-3 text-center`} >
                                    {checking ? "Wait.." : "Checkout"}{" "}
                                </button>
                            </div>
                            
                    </div>
                </div>
            </div>
        </div>
    );
}
