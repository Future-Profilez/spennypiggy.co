import Popup from "@/Components/Popup";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { usePage } from "@inertiajs/react";

export default function OrderDetail({ classes, text, item, date, onSuccess }) {
    const [close, setClose] = useState(false);
    const [status, setStatus] = useState(item.status || "pending");
    const [tracking, setTracking] = useState(item.tracking_id || "");
    const [courier, setCourier] = useState(item.courier_name || "");
    const [expectedDelivery, setExpectedDelivery] = useState(
        item.expected_delivery_date || "",
    );
    const [creatorNote, setCreatorNote] = useState(
        item.creator_note ?? item.metadata?.creator_note ?? "",
    );
    const [answerText, setAnswerText] = useState("");
    const [submittedAnswer, setSubmittedAnswer] = useState(item.answer || "");
    const { successAlert, errorAlert } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [answerLoading, setAnswerLoading] = useState(false);
    const { auth } = usePage().props;

    useEffect(() => {
        setStatus(item.status || "pending");
        setTracking(item.tracking_id || "");
        setCourier(item.courier_name || "");
        setExpectedDelivery(
            item.expected_delivery_date
                ? item.expected_delivery_date.split("T")[0]
                : "",
        );
        setCreatorNote(item.creator_note ?? item.metadata?.creator_note ?? "");
        setSubmittedAnswer(item.answer || "");
    }, [item]);

    const isCreator = auth?.user?.role == 1;
    const isPhysical = item?.shop?.type === "physical";

    // Helper function to parse shipping information
    const parseShippingInfo = (shippingData) => {
        if (!shippingData) return null;

        // If it's already an object, return it
        if (typeof shippingData === "object") return shippingData;

        // If it's a string, try to parse it as JSON
        if (typeof shippingData === "string") {
            try {
                return JSON.parse(shippingData);
            } catch (e) {
                // If parsing fails, return as plain text
                return { raw: shippingData };
            }
        }

        return null;
    };

    // Render buyer's shipping address (existing functionality)
    const renderBuyerShippingInfo = () => {
        if (!isPhysical) return null;

        // This is the buyer's shipping address (shipping_info)
        const shippingData = item?.shipping_info;

        if (!shippingData) {
            return (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mt-4">
                    <h3 className="font-black text-red-800 uppercase text-sm mb-1">
                        📍 Shipping Address
                    </h3>
                    <p className="text-sm font-bold text-red-600 italic">
                        No shipping address provided for this physical order.
                    </p>
                </div>
            );
        }

        const address = parseShippingInfo(shippingData);

        // If it's raw text (not JSON)
        if (address?.raw) {
            return (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-[20px] mb-3 p-4 mt-4">
                    <h3 className="font-black text-blue-800 uppercase text-sm mb-2 flex items-center gap-2">
                        <span className="text-lg">📍</span> Buyer's Shipping
                        Address
                    </h3>
                    <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap">
                        {address.raw}
                    </div>
                </div>
            );
        }

        // If it's structured JSON data
        if (address && typeof address === "object") {
            return (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-[20px] mb-3 p-4 mt-4">
                    <h3 className="font-black text-blue-800 uppercase text-sm mb-3 flex items-center gap-2">
                        <span className="text-lg">📍</span> Buyer's Shipping
                        Address
                    </h3>
                    <div className="text-sm font-bold text-gray-800 space-y-1.5">
                        {address.full_name && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    Name:
                                </span>{" "}
                                {address.full_name}
                            </p>
                        )}
                        {address.street_address && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    Address:
                                </span>{" "}
                                {address.street_address}
                            </p>
                        )}
                        {address.apartment && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    Apartment/Suite:
                                </span>{" "}
                                {address.apartment}
                            </p>
                        )}
                        {address.city && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    City:
                                </span>{" "}
                                {address.city}
                            </p>
                        )}
                        {address.state && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    State/Province:
                                </span>{" "}
                                {address.state}
                            </p>
                        )}
                        {address.postal_code && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    Postal Code:
                                </span>{" "}
                                {address.postal_code}
                            </p>
                        )}
                        {address.country && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    Country:
                                </span>{" "}
                                {address.country}
                            </p>
                        )}
                        {address.phone && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    Phone:
                                </span>{" "}
                                {address.phone}
                            </p>
                        )}
                        {address.email && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    Email:
                                </span>{" "}
                                {address.email}
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        // Fallback: show as string
        return (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-[20px] mb-3 p-4 mt-4">
                <h3 className="font-black text-blue-800 uppercase text-sm mb-2">
                    📍 Buyer's Shipping Address
                </h3>
                <p className="text-sm font-bold text-gray-800 whitespace-pre-wrap">
                    {String(shippingData)}
                </p>
            </div>
        );
    };

    // NEW: Render creator's shipping information from shops table
    const renderCreatorShippingInfo = () => {
        if (!isPhysical) return null;

        // Get shipping information from the shop (creator's shipping info)
        const shopShippingInfo = item?.shop?.description;

        if (!shopShippingInfo) {
            return null; // Don't show anything if no shipping info provided by creator
        }

        const shippingData = parseShippingInfo(shopShippingInfo);

        // If it's raw text
        if (shippingData?.raw) {
            return (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-[20px] p-4 mt-4">
                    <h3 className="font-black text-purple-800 uppercase text-sm mb-2 flex items-center gap-2">
                        <span className="text-lg">📦</span> Shipping Information
                    </h3>
                    <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap">
                        {shippingData.raw}
                    </div>
                </div>
            );
        }

        // If it's structured JSON data
        if (shippingData && typeof shippingData === "object") {
            return (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-[20px] p-4 mt-4">
                    <h3 className="font-black text-purple-800 uppercase text-sm mb-3 flex items-center gap-2">
                        <span className="text-lg">📦</span> Shipping Information
                    </h3>
                    <div className="text-sm font-bold text-gray-800 space-y-1.5">
                        {shippingData.shipping_method && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    Shipping Method:
                                </span>{" "}
                                {shippingData.shipping_method}
                            </p>
                        )}
                        {shippingData.shipping_cost && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    Shipping Cost:
                                </span>{" "}
                                ${shippingData.shipping_cost}
                            </p>
                        )}
                        {shippingData.estimated_delivery && (
                            <p>
                                <span className="text-gray-600 font-medium">
                                    Estimated Delivery:
                                </span>{" "}
                                {shippingData.estimated_delivery}
                            </p>
                        )}
                        {shippingData.shipping_policy && (
                            <div className="mt-2">
                                <p className="text-gray-600 font-medium">
                                    Shipping Policy:
                                </p>
                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                                    {shippingData.shipping_policy}
                                </p>
                            </div>
                        )}
                        {shippingData.additional_instructions && (
                            <div className="mt-2">
                                <p className="text-gray-600 font-medium">
                                    Additional Instructions:
                                </p>
                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                                    {shippingData.additional_instructions}
                                </p>
                            </div>
                        )}
                        {/* Show any other fields that might be present */}
                        {Object.entries(shippingData).map(([key, value]) => {
                            // Skip fields that are already displayed above or are empty
                            const skipFields = [
                                "shipping_method",
                                "shipping_cost",
                                "estimated_delivery",
                                "shipping_policy",
                                "additional_instructions",
                            ];
                            if (skipFields.includes(key) || !value) return null;
                            return (
                                <p key={key}>
                                    <span className="text-gray-600 font-medium">
                                        {key
                                            .replace(/_/g, " ")
                                            .replace(/\b\w/g, (l) =>
                                                l.toUpperCase(),
                                            )}
                                        :
                                    </span>{" "}
                                    {value}
                                </p>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // Fallback: show as string
        return (
            <div className="bg-purple-50 border-2 border-purple-200 rounded-[20px] p-4 mt-4">
                <h3 className="font-black text-purple-800 uppercase text-sm mb-2">
                    📦 Shipping Information
                </h3>
                <p className="text-sm font-bold text-gray-800 whitespace-pre-wrap">
                    {String(shopShippingInfo)}
                </p>
            </div>
        );
    };

    const updateFulfillment = async () => {
        setLoading(true);
        try {
            const res = await axios.post(`/shop/fulfillment/${item.uuid}`, {
                status,
                tracking_id: tracking,
                courier_name: courier,
                expected_delivery_date: expectedDelivery,
                creator_note: creatorNote,
            });
            if (res.data.status) {
                successAlert(res.data.message);
                setClose(true);
                setTimeout(() => {
                    setClose(false);
                    if (onSuccess) onSuccess();
                }, 100);
            }
        } catch (err) {
            errorAlert(err?.response?.data?.message || "Failed to update");
        }
        setLoading(false);
    };

    const submitAnswer = async () => {
        if (!answerText.trim()) return;
        setAnswerLoading(true);
        try {
            const res = await axios.post(`/shop/answer-to-payment/${item.id}`, {
                answer: answerText,
            });
            if (res.data.status) {
                successAlert(res.data.message);
                setSubmittedAnswer(res.data.answer);
            } else {
                errorAlert(res.data.message);
            }
        } catch (err) {
            errorAlert(
                err?.response?.data?.message || "Failed to submit answer",
            );
        }
        setAnswerLoading(false);
    };

    return (
        <Popup
            modalclass="order-detail-modal full"
            space="4"
            size="md"
            action={close}
            text={text || "open"}
            classes={`${classes ? classes : "px-3 py-2"}`}
        >
            <div className="p-0">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <h2 className="font-bold text-xl capitalize">
                        {item?.name || "User"} claimed{" "}
                        {item?.shop?.name || "an item"}.
                    </h2>
                    <span
                        className={`px-3 py-1 rounded-lg border-2 border-black text-[10px] font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${item?.shop?.type === "physical" ? "bg-blue-300" : "bg-green-300"}`}
                    >
                        {item?.shop?.type === "physical"
                            ? "Physical"
                            : "Digital"}
                    </span>
                </div>
                <p className="mb-2">{date}</p>

                {(item.creator_note || item.metadata?.creator_note) && (
                    <div className="mt-3 p-3 bg-pink-50 border border-pink-100 rounded-[20px]">
                        <p className="text-xs font-black uppercase text-[#FF007F] mb-1">
                            Note from Creator
                        </p>
                        <p className="text-sm text-gray-700">
                            {item.creator_note || item.metadata?.creator_note}
                        </p>
                    </div>
                )}

                {/* Render Creator's Shipping Information (from shops table) */}
                {renderCreatorShippingInfo()}

                {/* Render Buyer's Shipping Address (existing functionality) */}
                {renderBuyerShippingInfo()}

                {(item.payment_status === "refunded" || isPhysical) && (
                    <div className="text-left">
                        {item.payment_status === "refunded" ? (
                            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-gray-200 text-gray-700">
                                Refunded
                            </span>
                        ) : item.status === "delivered" ? (
                            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-green-100 text-green-700">
                                Completed
                            </span>
                        ) : item.is_delayed ? (
                            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-red-100 text-red-700">
                                Delayed
                            </span>
                        ) : (
                            <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
                                Funds Reserved
                            </span>
                        )}
                        {isCreator && item.status !== "delivered" && (
                            <p className="text-[10px] text-gray-500 mt-3">
                                Funds will be added to your payout once marked
                                as delivered.
                            </p>
                        )}
                    </div>
                )}
                <div className=" border-t pt-2 mt-3">
                    <strong>Shop Item</strong>
                    <p>{item?.shop?.name || "Unknown Item"}</p>
                </div>

                {item?.shop?.success_page_value && (
                    <div className=" border-t pt-2 mt-3">
                        <strong>Shop Content</strong>
                        {item.shop.success_page_type === "url" ? (
                            <p>
                                <a
                                    href={item.shop.success_page_value}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[#FF007F] hover:underline break-all"
                                >
                                    {item.shop.success_page_value}
                                </a>
                            </p>
                        ) : (
                            <p className="whitespace-pre-wrap">
                                {item.shop.success_page_value}
                            </p>
                        )}
                    </div>
                )}
                <div className=" border-t pt-2 mt-3">
                    <strong>Email</strong>
                    <p>{item?.email}</p>
                </div>

                {isPhysical && item?.expected_delivery_date && (
                    <div className=" border-t pt-2 mt-3">
                        <strong>Expected Delivery Date</strong>
                        <p className="whitespace-pre-wrap">
                            {item.expected_delivery_date.split("T")[0]}
                        </p>
                    </div>
                )}

                {/* <div className=' border-t pt-2 mt-3'>
                  <strong>Quantity</strong>
                  <p>{item.quantity || 1}</p>
               </div> */}
                {!isPhysical && item?.shop?.reward_file_url && (
                    <div className=" border-t pt-2 mt-3">
                        <strong>Digital File</strong>
                        <p>
                            <a
                                href={item.shop.reward_file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#FF007F] hover:underline"
                            >
                                Download / View
                            </a>
                        </p>
                    </div>
                )}
                {item?.shop?.ask_question ? (
                    <div className=" border-t pt-2 mt-3">
                        <strong>Question</strong>
                        <p>{item.shop.ask_question || ""} ?</p>

                        {submittedAnswer ? (
                            <p className="text-sm mt-2">
                                Reply : {submittedAnswer}
                            </p>
                        ) : !isCreator ? (
                            <div className="mt-3">
                                <textarea
                                    value={answerText}
                                    onChange={(e) =>
                                        setAnswerText(e.target.value)
                                    }
                                    placeholder="Write your reply here..."
                                    className="w-full rounded-[15px] border-gray-300 text-sm mb-2"
                                    rows="3"
                                />
                                <button
                                    onClick={submitAnswer}
                                    disabled={
                                        answerLoading || !answerText.trim()
                                    }
                                    className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {answerLoading
                                        ? "Submitting..."
                                        : "Submit Reply"}
                                </button>
                            </div>
                        ) : (
                            <p className="text-sm mt-2 italic text-gray-500">
                                Waiting for user to reply...
                            </p>
                        )}

                        {item.message ? (
                            <p className="text-sm mt-2">
                                Message : {item.message || ""}
                            </p>
                        ) : (
                            ""
                        )}
                    </div>
                ) : (
                    ""
                )}

                {isPhysical &&
                    isCreator &&
                    item.payment_status !== "refunded" && (
                        <div className="border-t pt-4 mt-4">
                            <h3 className="font-bold mb-3">Fulfillment</h3>
                            <div className="grid gap-3">
                                <div>
                                    <label className="block text-sm mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)
                                        }
                                        className="w-full rounded-[15px] border-gray-300"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">
                                            Processing
                                        </option>
                                        <option value="shipped">Shipped</option>
                                        <option value="delivered">
                                            Delivered
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">
                                        Tracking ID
                                    </label>
                                    <input
                                        type="text"
                                        value={tracking}
                                        onChange={(e) =>
                                            setTracking(e.target.value)
                                        }
                                        className="w-full rounded-[15px] border-gray-300"
                                        placeholder="e.g. 1Z9999999999999999"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">
                                        Courier Name
                                    </label>
                                    <input
                                        type="text"
                                        value={courier}
                                        onChange={(e) =>
                                            setCourier(e.target.value)
                                        }
                                        className="w-full rounded-[15px] border-gray-300"
                                        placeholder="e.g. UPS, FedEx, Royal Mail"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1">
                                        Expected Delivery Date
                                    </label>
                                    <input
                                        type="date"
                                        value={expectedDelivery}
                                        onChange={(e) =>
                                            setExpectedDelivery(e.target.value)
                                        }
                                        className="w-full rounded-[15px] border-gray-300"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 font-bold">
                                        Creator Note (e.g. if there's an issue)
                                    </label>
                                    <textarea
                                        value={creatorNote}
                                        onChange={(e) =>
                                            setCreatorNote(e.target.value)
                                        }
                                        className="w-full rounded-[15px] border-gray-300 text-sm"
                                        placeholder="Add a note or update about the order..."
                                        rows="3"
                                    />
                                    <p className="text-[10px] text-gray-500">
                                        This note will be saved with the order
                                        details.
                                    </p>
                                </div>
                                <button
                                    onClick={updateFulfillment}
                                    disabled={loading}
                                    className="btn-pink w-full mt-2"
                                >
                                    {loading
                                        ? "Saving..."
                                        : "Update Fulfillment"}
                                </button>
                            </div>
                        </div>
                    )}

                {isPhysical && !isCreator && (
                    <div className="border-t pt-4 mt-4">
                        <h3 className="font-bold mb-2 text-[#FF007F]">
                            Tracking Information
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-[20px] border border-gray-100">
                            <p className="mb-2">
                                <strong>Status:</strong>{" "}
                                <span className="capitalize font-medium text-gray-700">
                                    {item.status || "Pending"}
                                </span>
                            </p>
                            {item.courier_name && (
                                <p className="mb-2">
                                    <strong>Courier:</strong>{" "}
                                    <span className="font-medium text-gray-700">
                                        {item.courier_name}
                                    </span>
                                </p>
                            )}
                            {item.tracking_id && (
                                <p className="mb-2">
                                    <strong>Tracking ID:</strong>{" "}
                                    <span className="font-medium text-[#FF007F]">
                                        {item.tracking_id}
                                    </span>
                                </p>
                            )}
                            {item.expected_delivery_date && (
                                <p className="mb-0">
                                    <strong>Expected Delivery:</strong>{" "}
                                    <span className="font-medium text-gray-700">
                                        {item.expected_delivery_date}
                                    </span>
                                </p>
                            )}
                            {!item.tracking_id &&
                                item.status !== "delivered" && (
                                    <p className="text-xs text-gray-500 mt-2 italic">
                                        Tracking details will appear here once
                                        the creator ships your order.
                                    </p>
                                )}
                        </div>
                    </div>
                )}
            </div>
        </Popup>
    );
}
