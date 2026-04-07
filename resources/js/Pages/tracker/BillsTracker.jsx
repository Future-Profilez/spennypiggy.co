import { useEffect, useState } from "react";
import axios from "axios";
import { Transition } from "@headlessui/react";
import PriceFormat from "@/includes/PriceFormat";
import Nocontent from "@/includes/Nocontent";
import Avatar from "@/includes/Avatar";
import userphoto from "../../../assets/siteicon.png";
import TweetNow from "./TweetNow";
import { TimeFormat } from "@/includes/TimeFormat";
const defaultsec = "https://ucarecdn.com/55965522-e075-4ef3-8afc-195dacbf267b/";

export default function BillsTracker({ auth }) {
    const { formatMultiPrice } = PriceFormat();
    const [bills, serBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBills = () => {
        setLoading(true);
        setError(null);
        axios
            .get(`bill-tracker`)
            .then((resp) => {
                serBills(resp.data.bill_payments);
            })
            .catch((_err) => {
                console.error("error", _err);
                setError("Failed to load bill payments. Please try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const getPercentage = (actual, paid) => {
        const r = (paid / actual) * 100;
        return r.toFixed(2);
    };

    const GoalItem = ({ n }) => {
        const [open, setOpen] = useState(false);
        const openState = () => {
            setOpen(!open);
        };
        return (
            <>
                <div className="trackItem cursor-pointer shadow-pink box mb-4">
                    <div
                        onClick={openState}
                        aria-controls="example-collapse-text"
                        aria-expanded={open}
                        className=" cursor-pointer trackbar "
                    >
                        <div className="flex items-center justify-between">
                            <div className="text-dark">
                                {n.anonymous == 1 && n.sender == false ? (
                                    <Avatar
                                        name={`From : Anonymous`}
                                        subhead={
                                            (n.bill && n.bill.name) ||
                                            "Surprise Gift"
                                        }
                                        src={userphoto || ""}
                                    />
                                ) : (
                                    <Avatar

                                        role={n && n.user && n.user.role}
                                        profile_status_lock={
                                            n && n.user && n.user.profile_status_lock == 2 ? true : false}
                                        name={`From : ${
                                            (n && n.user && n.user.name) ||
                                            n.guest_name
                                        }`}
                                        link={
                                            (n.user && n.user.username) || null
                                        }
                                        subhead={
                                            (n.bill && n.bill.name) ||
                                            "Surprise Gift"
                                        }
                                        username={
                                            (n.user && n.user.username) || ""
                                        }
                                        src={
                                            (n &&
                                                n.user &&
                                                n.user.avatar_url) ||
                                            userphoto
                                        }
                                    />
                                )}
                            </div>
                            <div className="text-gray-500 rightbar flex items-center ">
                                <div>
                                    {n && n.sender ? (
                                        <div className="identity text-red-600 text-nowrap">
                                            -
                                            {formatMultiPrice(
                                                n.amount,
                                                n.currency
                                            )}
                                        </div>
                                    ) : (
                                        <div className="identity text-green-600 text-nowrap">
                                            +
                                            {formatMultiPrice(
                                                n.amount,
                                                n.currency
                                            )}
                                        </div>
                                    )}
                                    <p className="text-[13px] text-right">
                                        <TimeFormat
                                            dateString={n && n && n.created_at}
                                        />
                                    </p>
                                </div>

                                <div className="angle-icon">
                                    <svg
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        {" "}
                                        <g
                                            id="SVGRepo_bgCarrier"
                                            strokeWidth="0"
                                        ></g>{" "}
                                        <g
                                            id="SVGRepo_tracerCarrier"
                                            stroke-linecap="round"
                                            strokeLinejoin="round"
                                        ></g>{" "}
                                        <g id="SVGRepo_iconCarrier">
                                            {" "}
                                            <path
                                                d="M12 14.5C11.9015 14.5005 11.8038 14.4813 11.7128 14.4435C11.6218 14.4057 11.5392 14.3501 11.47 14.28L8 10.78C7.90861 10.6391 7.86719 10.4715 7.88238 10.3042C7.89756 10.1369 7.96848 9.97954 8.08376 9.85735C8.19904 9.73515 8.352 9.65519 8.51814 9.63029C8.68428 9.6054 8.85396 9.63699 9 9.72003L12 12.72L15 9.72003C15.146 9.63699 15.3157 9.6054 15.4819 9.63029C15.648 9.65519 15.801 9.73515 15.9162 9.85735C16.0315 9.97954 16.1024 10.1369 16.1176 10.3042C16.1328 10.4715 16.0914 10.6391 16 10.78L12.5 14.28C12.3675 14.4144 12.1886 14.4931 12 14.5Z"
                                                fill="#000000"
                                            ></path>{" "}
                                        </g>{" "}
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Transition
                        show={open}
                        enter="transition-all duration-300 ease-out overflow-hidden"
                        enterFrom="transform opacity-0 max-h-0"
                        enterTo="transform opacity-100 max-h-[1000px]"
                        leave="transition-all duration-200 ease-in overflow-hidden"
                        leaveFrom="transform opacity-100 max-h-[1000px]"
                        leaveTo="transform opacity-0 max-h-0"
                    >
                        <div id="example-collapse-text">
                            <div className="track-summary mt-4">
                                <div className="wishitem-des box border rounded-[30px]  ">
                                    <div className="flex justify-between items-center">
                                        <div className="wish-item">
                                            <img
                                                src={
                                                    (n.bill &&
                                                        n.bill.perma_link) ||
                                                    defaultsec
                                                }
                                                alt="image"
                                                className="max-w-full h-auto"
                                            />
                                        </div>
                                        <div className="item-dd pl-3">
                                            <p className="mb-0 pr-2">
                                                {(n.bill && n.bill.name) ||
                                                    "Surprise Gift"}
                                            </p>
                                            <p className="text-gray-500 text-sm">
                                                QTY : {n.quantity || 1} x{" "}
                                                {formatMultiPrice(
                                                    n.amount,
                                                    n?.currency || "gbp"
                                                )}
                                                {n && n.sender == false
                                                    ? " + VAT"
                                                    : ""}
                                            </p>
                                        </div>
                                    </div>
                                    {n && n.message ? (
                                        <div className="border-t pt-3 mt-3 flex justify-between items-center">
                                            <p className="mb-0 pr-2">
                                                Message :
                                            </p>
                                            <p className="text-gray-500 text-sm">
                                                {n && n.message}
                                            </p>
                                        </div>
                                    ) : (
                                        ""
                                    )}

                                    <div className="border-t pt-3 mt-3  flex justify-between items-center">
                                        <p className="mb-0 pr-2">Paid in </p>
                                        <p className="text-gray-500 text-sm">
                                            {n && n && n.currency}
                                        </p>
                                    </div>
                                    <div className="border-t pt-3 mt-3  flex justify-between items-center">
                                        <p className="mb-0 pr-2">
                                            Guest Email{" "}
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            {n && n.guest_email}
                                        </p>
                                    </div>
                                    <div className="border-t pt-3 mt-3  flex justify-between items-center">
                                        <p className="mb-0 pr-2">Guest Name </p>
                                        <p className="text-gray-500 text-sm capitalize">
                                            {n && n.guest_name}
                                        </p>
                                    </div>
                                </div>

                                {/* {n && n.sender == false ? (
                                    <TweetNow
                                        type="purchase"
                                        id={n && n.uuid}
                                    />
                                ) : (
                                    ""
                                )} */}
                                {/* <p className="mt-3 mb-2">Exclusive Rewards </p>
                                {n && n.message_url ? (
                                    <div className="message-media my-2">
                                        <LazyLoadImage
                                            src={n.message_url}
                                            alt="image"
                                            height={"100%"}

                                            effect="blur"
                                            width={"100%"}
                                        />
                                    </div>
                                ) : (
                                    ""
                                )} */}
                            </div>
                        </div>
                    </Transition>
                </div>
            </>
        );
    };
    if (loading) {
        return (
            <div className="tips flex justify-center items-center" style={{minHeight: '200px'}}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tips text-center" style={{minHeight: '200px'}}>
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    {error}
                    <button 
                        className="bg-transparent hover:bg-red-500 text-red-700 font-semibold hover:text-white py-1 px-2 border border-red-500 hover:border-transparent rounded ml-2" 
                        onClick={fetchBills}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="tips ">
            {bills &&
                bills.map((g, i) => {
                    return <GoalItem key={g.id || i} n={g} />;
                })}
            {bills && bills.length < 1 ? (
                <Nocontent text="nothing to see" />
            ) : (
                ""
            )}
        </div>
    );
}
