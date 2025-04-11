import Popup from "@/Components/Popup";
import { usePage, router, useForm } from "@inertiajs/react";
import React, { useEffect, useState } from "react";
import { CiCircleCheck } from "react-icons/ci";
import { FaCheckCircle } from "react-icons/fa";
import britishflag from "../../../assets/img/british-flag.png";
import euflag from "../../../assets/img/flag-european.png";
import pci from "../../../assets/img/PCICompliance.png";
import ssl from "../../../assets/img/ssl.png";
import plaid from "../../../assets/img/plaid.jpg";
import axios from "axios";
import { MdDelete } from "react-icons/md";
import DeviceID from "@/includes/DeviceID";

import { CiSquareCheck } from "react-icons/ci";
import toast from "react-hot-toast";

export default function GlobalCheckout({
    action,
    finalsubmit,
    getVariables,
    classes,
    text,
}) {
    const deviceID = DeviceID();

    const [close, setClose] = useState();
    useEffect(() => {
        setClose(action);
    }, [action]);

    const [checked, setChecked] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState("");
    const [iban, setiban] = useState("");
    const [sortCode, setSortCode] = useState("");
    const [accountNo, setAccountNo] = useState("");

    const [selectedSavedMethod, setselectedSavedMethod] = useState("");
    const selectSavedMethod = (e, type) => {
        if (e.uuid == selectedSavedMethod) {
            setselectedSavedMethod();
            setAccountNo("");
            setSortCode("");
        } else {
            if (type === "EUR") {
                setiban(e.account_number);
                setSortCode("");
            } else {
                setAccountNo(e.account_number);
                setSortCode(e.sort_code);
            }
            setselectedSavedMethod(e.uuid);
        }
    };

    const handleSortCode = (e) => {
        let input = e.target.value.replace(/\D/g, ""); // Remove all non-numeric characters
        if (input.length > 6) {
            input = input.slice(0, 6); // Limit to 6 digits
        }
        const formattedValue = input
            .replace(/(\d{2})(\d{2})(\d{0,2})/, "$1-$2-$3") // Format as 00-00-00
            .replace(/-$/, ""); // Remove trailing dash if exists
        setSortCode(formattedValue);
    };

    useEffect(() => {
        getVariables &&
            getVariables({
                sort_code: sortCode.replace(/-/g, ""),
                account_number: accountNo,
                iban: iban,
                currency: selectedCurrency,
                checked: checked,
            });
    }, [sortCode, accountNo, iban, selectedCurrency, checked]);

    const savePaymentDetails = () => {
        axios
            .post("/save-user-payment-detail", {
                account_type: selectedCurrency == "GBP" ? "british" : "eu",
                account_number: iban ? iban : accountNo,
                sort_code: sortCode ? sortCode.replace(/-/g, "") : "",
                bank_name: "",
                account_holder_name: "",
                swift_code: "",
                paypal_email: "",
                device_id: deviceID,
                currency: selectedCurrency,
            })
            .then((res) => {
                console.log(res);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    const handleSubmit = () => {
        setLoading(true);
        savePaymentDetails();
        if (finalsubmit) {
            finalsubmit();
        }
        setTimeout(() => {
            setLoading(false);
        }, 10000);
    };

    // const [GBPpaymentMethods, setGBPPaymentMethods] = useState([]);
    // const [EURpaymentMethods, setEURPaymentMethods] = useState([]);
    // const getUserPaymentDetails = () => {
    //     axios.get("/payment/fetch-user-payment-details", {
    //             params: { device_id: deviceID }, // Pass deviceId as query parameter
    //         })
    //         .then((res) => {
    //             setGBPPaymentMethods(res.data.data || []);
    //             const methods = res.data.data || [];
    //             const gbps = [];
    //             const eurs = [];
    //             methods.forEach((element) => {
    //                 if (element.account_type == "british") {
    //                     gbps.push(element);
    //                 }
    //                 if (element.account_type == "eu") {
    //                     eurs.push(element);
    //                 }
    //             });
    //             setGBPPaymentMethods(gbps);
    //             setEURPaymentMethods(eurs);
    //         })
    //         .catch((err) => {
    //             console.log(err);
    //         });
    // };

    // useEffect(() => {
    //     getUserPaymentDetails();
    // }, []);

    const removePaymentMethod = (uuid) => {
        axios
            .get(`/delete-user-payment-details/${uuid}`, {
                params: { device_id: deviceID }, // Pass deviceId as query parameter
            })
            .then((res) => {
                toast.success(res.data.message);
                getUserPaymentDetails();
                setiban("");
                setSortCode("");
                setAccountNo("");
                setselectedSavedMethod("");
            })
            .catch((err) => {
                console.log(err);
            });
    };
    return (
        <>
            <style>{`
            .active.paybox{background:var(--pink) !important;color:#fff !important;}
            .active.paybox p{color:#fff !important;}
            .active.paybox svg{color:#fff !important;}
          `}</style>

            <Popup
                modalclass={`pinkmodal full stripe-terms shadow-pink ps-0`}
                space="4"
                size="md"
                action={close}
                classes={`${classes} btn-pink md`}
                text={text || `Checkout`}
            >
                <div className="addgoal">
                    <div className={` page1`}>
                        <h2 className="text-uppercase font-GillSans pb-4 text-2xl">
                            Choose how to pay
                        </h2>
                        <div
                            onClick={() => setChecked("plaid")}
                            className={`paybox  cursor-pointer`}
                        >
                            <div className="mb-3">
                                <div className="flex items-center">
                                    {checked === "plaid" ? (
                                        <FaCheckCircle
                                            color={`#f94f97`}
                                            className="me-2 h-8 w-8"
                                        />
                                    ) : (
                                        <CiCircleCheck
                                            color={`#696969`}
                                            className="me-2 h-8 w-8"
                                        />
                                    )}
                                    <div className=" ps-2  items-center justify-between flex w-full">
                                        <div className="pay-content">
                                            <h2 className=" text-[17px] mb-0 uppercase font-bold ">
                                                Pay via Bank
                                            </h2>
                                            <p className="text-gray-800 mt-0 text-[13px]">
                                                Available in UK/EU only *{" "}
                                            </p>
                                        </div>
                                        <div className="block cards-accepted text-center">
                                            <div class="flex -space-x-5 rtl:space-x-reverse justify-center">
                                                <img
                                                    class="w-[35px] min-w-[35px] me-2 h-[35px] object-contain border-1 border-gray-800 rounded-full bg-white"
                                                    src="https://th.bing.com/th/id/R.755107bb9d77abcd0451fcd28b18f9ee?rik=kAZlSvLYq5USrg&riu=http%3a%2f%2fwww.pngplay.com%2fwp-content%2fuploads%2f3%2fHSBC-Logo-Transparent-File.png&ehk=PHVQ0QyPzGV6vzGKukviYHYPbRNVzENGNCL40ggNDQI%3d&risl=&pid=ImgRaw&r=0"
                                                    alt="HSBC"
                                                />
                                                <img
                                                    class="w-[35px] min-w-[35px] bg-[#006a4c] me-2 h-[35px] object-contain border-1 border-gray-800 rounded-full "
                                                    src="https://th.bing.com/th/id/R.2689a3b1bc0a082c49c26f2169766922?rik=hDh%2bPG7TLXoQ5Q&riu=http%3a%2f%2fcdn.mos.cms.futurecdn.net%2f5d04dbf2b31c1744d5531fb745e1b66d.jpg&ehk=CBJSj1SgxYngQnkg4y87juAbinPpWND50fdhtwpVt0o%3d&risl=&pid=ImgRaw&r=0"
                                                    alt=""
                                                />
                                                <img
                                                    class="w-[35px] min-w-[35px] me-2 h-[35px] object-contain border-1 border-gray-800 rounded-full bg-white"
                                                    src="https://logos-world.net/wp-content/uploads/2021/08/Barclays-Symbol.png"
                                                    alt=""
                                                />
                                                <a
                                                    class="flex items-center justify-center w-[35px] min-w-[35px] me-2 h-[35px] object-contain border-1 border-gray-800 rounded-full bg-white"
                                                    href="#"
                                                >
                                                    +
                                                </a>
                                            </div>
                                            <div className="flex justify-center w-full">
                                                <p className="text-sm text-center mt-1 w-full flex items-center ">
                                                    Secured By{" "}
                                                    <img
                                                        className="ms-1 max-w-[50px]"
                                                        src={plaid}
                                                    />
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div
                            onClick={() => setChecked("paypal")}
                            className={` disabled border-t border-gray-200 mt-3 pt-3  paybox   cursor-pointer`}
                        >
                            <div className="flex">
                                {checked === "paypal" ? (
                                    <FaCheckCircle
                                        color={`#f94f97`}
                                        className="me-2 h-8 w-8"
                                    />
                                ) : (
                                    <CiCircleCheck
                                        color={`#696969`}
                                        className="me-2 h-8 w-8"
                                    />
                                )}
                                <div className=" ps-2  conten">
                                    <h2 className="text-[17px] mb-0 uppercase font-bold ">
                                        Pay with card{" "}
                                    </h2>
                                    <p className=" text-gray-800  mt-0 text-[13px]">
                                        5% Higher Cost. Available Worldwide*{" "}
                                    </p>
                                    <h3 className="comming font-GillSans mt-2 uppercase text-pink   justify-center items-center ">
                                        Coming Soon
                                    </h3>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={`${checked ? "block" : "hidden"} page2`}>
                        <h2 className="capitalize pb-2 pt-8 text-lg text-black font-bold mt-3">
                            Process with your
                        </h2>
                        <div
                            onClick={() => setSelectedCurrency("GBP")}
                            className={`paybox cursor-pointer `}
                        >
                            <div className="flex">
                                {selectedCurrency === "GBP" ? (
                                    <FaCheckCircle
                                        color={`#f94f97`}
                                        className="me-[12px] h-7 w-7"
                                    />
                                ) : (
                                    <CiCircleCheck
                                        color={`#696969`}
                                        className="me-[12px] h-8 w-8"
                                    />
                                )}
                                <h2 className="text-lg mb-0 flex items-center  ">
                                    <img
                                        className="w-[25px] min-w-[27px] me-2"
                                        src={britishflag}
                                        alt="british flag"
                                    />{" "}
                                    British Bank Account{" "}
                                </h2>
                            </div>
                        </div>

                        <div
                            onClick={() => setSelectedCurrency("EUR")}
                            className={` mt-3 paybox cursor-pointer `}
                        >
                            <div className="flex">
                                {selectedCurrency === "EUR" ? (
                                    <FaCheckCircle
                                        color={`#f94f97`}
                                        className="me-2 h-7 w-7"
                                    />
                                ) : (
                                    <CiCircleCheck
                                        color={`#696969`}
                                        className="me-2 h-8 w-8"
                                    />
                                )}
                                <h2 className="text-lg mb-0 flex items-center">
                                    <img
                                        className="w-[27px] min-w-[27px] me-2"
                                        src={euflag}
                                        alt="british flag"
                                    />{" "}
                                    EU Bank Account
                                </h2>
                            </div>
                        </div>
                        <p className="mt-3">
                            After your first transaction, your details will be
                            securely saved via a Device ID for Faster checkouts
                        </p>
                    </div>

                    <div className={` page3`}>
                        {checked && selectedCurrency === "GBP" ? (
                            <>
                                <h2 className="capitalize pt-4 text-lg text-black font-bold mt-3">
                                    Enter BACS{" "}
                                </h2>
                                <input
                                    type="text"
                                    value={accountNo}
                                    onChange={(e) =>
                                        setAccountNo(e.target.value)
                                    }
                                    placeholder="Enter Account number"
                                    className="px-3 py-[12px] text-black w-full bg-gray-200 text-normal border border-gray-300 rounded-xl mt-2"
                                />
                                <input
                                    type="text"
                                    value={sortCode}
                                    onChange={handleSortCode}
                                    placeholder="Sort Code eg. 00-00-00"
                                    className="px-3 py-[12px] text-black w-full bg-gray-200 text-normal border border-gray-300 rounded-xl mt-2"
                                />

                                {GBPpaymentMethods &&
                                GBPpaymentMethods.length > 0 ? (
                                    <>
                                        <h2 className="text-center w-full my-3">
                                            OR
                                        </h2>
                                        <h3>Saved Payment Method</h3>
                                    </>
                                ) : (
                                    ""
                                )}
                                {GBPpaymentMethods &&
                                    GBPpaymentMethods.map((method, index) => (
                                        <div
                                            onClick={() =>
                                                selectSavedMethod(method)
                                            }
                                            className={`flex items-center justify-between mt-3 ${
                                                selectedSavedMethod ==
                                                method.uuid
                                                    ? "pinkbg text-white"
                                                    : "bg-gray-200"
                                            }  p-3 rounded-xl cursor-pointer mb-2`}
                                            key={index}
                                        >
                                            <div className="flex justify-start items-center relative w-full">
                                                <h2 className="me-3">
                                                    <CiSquareCheck
                                                        size={"2rem"}
                                                    />
                                                </h2>
                                                <div>
                                                    <h2>Account No</h2>
                                                    <h2>
                                                        {method.account_number}
                                                    </h2>
                                                    <button
                                                        className="text-red-800 absolute top-3 right-2"
                                                        onClick={() =>
                                                            removePaymentMethod(
                                                                method.uuid
                                                            )
                                                        }
                                                    >
                                                        <MdDelete />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </>
                        ) : (
                            ""
                        )}

                        {checked && selectedCurrency === "EUR" ? (
                            <>
                                <h2 className="capitalize pt-4 text-lg text-black font-bold mt-3">
                                    Enter IBAN{" "}
                                </h2>
                                <input
                                    type="text"
                                    onChange={(e) => setiban(e.target.value)}
                                    placeholder="Enter IBAN number"
                                    className="px-3 py-[12px] text-black w-full bg-gray-200 text-normal border border-gray-300 rounded-xl mt-2"
                                />

                                {EURpaymentMethods &&
                                EURpaymentMethods.length > 0 ? (
                                    <>
                                        <h2 className="text-center w-full my-3">
                                            OR
                                        </h2>
                                        <h3>Saved Payment Method</h3>
                                    </>
                                ) : (
                                    ""
                                )}

                                {EURpaymentMethods &&
                                    EURpaymentMethods.map((method, index) => (
                                        <div
                                            onClick={() =>
                                                selectSavedMethod(method, "EUR")
                                            }
                                            className={`flex items-center justify-between mt-3 ${
                                                selectedSavedMethod ==
                                                method.uuid
                                                    ? "pinkbg text-white"
                                                    : "bg-gray-200"
                                            }  p-3 rounded-xl cursor-pointer mb-2`}
                                            key={index}
                                        >
                                            <div className="flex justify-start items-center relative w-full">
                                                <h2 className="me-3">
                                                    <CiSquareCheck
                                                        size={"2rem"}
                                                    />
                                                </h2>
                                                <div>
                                                    <h2>IBAN No</h2>
                                                    <h2>
                                                        {method.account_number}
                                                    </h2>
                                                    <button
                                                        className="text-red-800 absolute top-3 right-2"
                                                        onClick={() =>
                                                            removePaymentMethod(
                                                                method.uuid
                                                            )
                                                        }
                                                    >
                                                        <MdDelete />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </>
                        ) : (
                            ""
                        )}
                        {selectedCurrency ? (
                            <button
                                onClick={handleSubmit}
                                className="btn-pink md m-auto mt-4  d-table"
                            >
                                {loading ? "Processing" : "Pay Now"}
                            </button>
                        ) : (
                            ""
                        )}
                        <div className="flex items-center justify-center mt-8">
                            <img
                                src={pci}
                                className="w-full max-w-[130px]"
                                alt="pci compliant"
                            />
                            <img
                                src={ssl}
                                className="w-full max-w-[100px]"
                                alt="ssl encrypted"
                            />
                        </div>
                    </div>
                </div>
            </Popup>
        </>
    );
}
