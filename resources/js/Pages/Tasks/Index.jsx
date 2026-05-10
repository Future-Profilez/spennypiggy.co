import { Head, Link } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import { useState, useEffect } from "react";
import PriceFormat from "@/includes/PriceFormat";
import Nocontent from "../../includes/Nocontent";

const Countdown = ({ createdAt, hours }) => {
    if (!createdAt || !hours) return null;

    const targetDate = new Date(
        new Date(createdAt).getTime() + hours * 60 * 60 * 1000,
    );

    const calculateTimeLeft = () => {
        const diff = targetDate - new Date();
        if (diff <= 0) return null;

        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
        };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [createdAt, hours]);

    if (!timeLeft) {
        return (
            <span className="text-red-600 font-bold text-xs uppercase">
                SLA Overdue
            </span>
        );
    }

    return (
        <span className="font-mono font-bold text-pink-600 text-sm">
            {timeLeft.days > 0 && `${timeLeft.days}d `}
            {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </span>
    );
};

export default function Index({
    auth,
    tasks,
    orders,
    completed_orders,
    purchased_tasks,
}) {
    const { formatMultiPrice } = PriceFormat();

    const getStatusColor = (status) => {
        const colors = {
            paid: "bg-blue-100 text-blue-800 border-blue-200",
            assigned: "bg-blue-100 text-blue-800 border-blue-200",
            pending_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
            rejected_once: "bg-red-100 text-red-800 border-red-200",
            escalated: "bg-red-200 text-red-900 border-red-300",
            completed_accepted: "bg-green-100 text-green-800 border-green-200",
            delivered: "bg-green-100 text-green-800 border-green-200",
            paid_out: "bg-green-100 text-green-800 border-green-200",
            completed: "bg-green-100 text-green-800 border-green-200",
            running_late: "bg-orange-100 text-orange-800 border-orange-200",
            refunded: "bg-gray-200 text-gray-800 border-gray-300",
            disputed: "bg-red-200 text-red-900 border-red-300",
            expired: "bg-gray-200 text-gray-800 border-gray-300",
        };
        return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    // Function to determine task status based on is_approved values
    const getTaskStatus = (task) => {
        if (Number(task?.is_suspended) === 1) return "suspended";
        if (task.is_approved === 1) return "approved";
        if (task.is_approved === 2) return "rejected";
        return "pending"; // is_approved === 0 or null/undefined
    };

    // Function to get status display text
    const getStatusDisplay = (task) => {
        const status = getTaskStatus(task);
        const statusMap = {
            suspended: "Suspended",
            approved: "Approved",
            rejected: "Rejected",
            pending: "Pending Review",
        };
        return statusMap[status] || "Unknown";
    };

    // Function to get status badge color
    const getStatusBadgeColor = (task) => {
        const status = getTaskStatus(task);
        const colorMap = {
            suspended: "bg-red-100 text-red-800 border-red-200",
            approved: "bg-green-100 text-green-800 border-green-200",
            rejected: "bg-red-100 text-red-800 border-red-200",
            pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
        };
        return colorMap[status] || "bg-gray-100 text-gray-800 border-gray-200";
    };

    const getCreatorNote = (task) => {
        const status = getTaskStatus(task);

        switch (status) {
            case "suspended":
                return {
                    title: "🚫 Task Suspended",
                    message:
                        task?.suspend_reason?.trim() ||
                        "This task has been suspended by admin. Please contact support if you want to appeal.",
                    color: "red",
                    bgColor: "bg-red-50",
                    borderColor: "!border-red-400",
                    textColor: "text-red-800",
                    lightTextColor: "text-red-700",
                    icon: (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-7.938 4h15.876c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L2.342 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    ),
                };

            case "rejected":
                return {
                    title: "⚠️ Action Required",
                    message:
                        "Your task has been rejected. Please review the feedback below, make necessary edits, and resubmit for admin review.",
                    color: "red",
                    bgColor: "bg-red-50",
                    borderColor: "!border-red-300",
                    textColor: "text-red-700",
                    lightTextColor: "text-red-600",
                    icon: (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.342 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                        </svg>
                    ),
                };

            case "pending":
                return {
                    title: "⏳ Under Review",
                    message:
                        "Your task is currently being reviewed by our admin team. This usually takes 24-48 hours. You'll be notified once a decision is made.",
                    action: "Wait for Review",
                    color: "yellow",
                    bgColor: "bg-yellow-50",
                    borderColor: "!border-yellow-300",
                    textColor: "text-yellow-700",
                    lightTextColor: "text-yellow-600",
                    icon: (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    ),
                };

            case "approved":
                return {
                    title: "✅ Task Live",
                    message:
                        "Your task is now live and visible to supporters. You can still make edits if needed, but major changes may require re-approval.",
                    action: "Task is Active",
                    color: "green",
                    bgColor: "bg-green-50",
                    borderColor: "!border-green-500",
                    textColor: "!text-green-800",
                    lightTextColor: "text-green-700",
                    icon: (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    ),
                };

            default:
                return null;
        }
    };

    const SLA_RUNNING_STATUSES = [
        "paid",
        "assigned",
        "pending_review",
        "rejected_once",
        "initiated",
    ];

    const SLA_CLOSED_STATUSES = ["completed", "paid_out", "escalated"];

    const shouldRunSLA = (status) => SLA_RUNNING_STATUSES.includes(status);

    const isSLAFrozen = (status) => SLA_CLOSED_STATUSES.includes(status);

    return (
        <Guest auth={auth.user} user={auth.user}>
            <Head title="My Tasks" />
            <div className="px-3 py-8 md:py-18 min-h-screen !bg-white">
                <h2 className="text-3xl md:text-4xl font-fre uppercase mb-8 text-center text-pink-500">
                    Task Dashboard
                </h2>
                <div className="max-w-4xl mx-auto space-y-8">
                    {orders && orders.length > 0 && (
                        <div className="shadow-layout  !border-3 border-black bg-white shadow-black overflow-hidden rounded-[30px] ">
                            <div className="py-4 px-4 pinkbg flex !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center justify-between">
                                <h3 className="font-bold text-xl text-white">
                                    Active Orders (Action Required)
                                </h3>
                                <div className="flex items-center">
                                    <span className=" border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block"></span>
                                    <span className=" border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block"></span>
                                    <span className=" border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block"></span>
                                </div>
                            </div>

                            <ul className="divide-y divide-gray-200">
                                {orders?.length > 0 ? (
                                    <>
                                        {orders &&
                                            orders.map((order) => (
                                                <li key={order.id}
                                                    className="p-6 hover:bg-red-50 transition-colors" >
                                                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                                        <div className="w-full md:w-auto">
                                                            <h3 className="text-xl font-[500] text-gray-900  font-bold ">
                                                                Order #
                                                                {order.uuid.substring(
                                                                    0,
                                                                    8,
                                                                )}{" "}
                                                                -{" "}
                                                                {
                                                                    order.task
                                                                        .title
                                                                }
                                                            </h3>
                                                            <p className="text-sm text-gray-600 mt-1">
                                                                Supporter:{" "}
                                                                <span className="font-semibold">
                                                                    {order
                                                                        .supporter
                                                                        ?.name ||
                                                                        "Guest"}
                                                                </span>{" "}
                                                                | Ordered:{" "}
                                                                {new Date(
                                                                    order.created_at,
                                                                ).toLocaleDateString()}
                                                                <span className="mx-1">
                                                                    |
                                                                </span>
                                                                {shouldRunSLA(
                                                                    order?.status,
                                                                ) ? (
                                                                    <>
                                                                        <span>
                                                                            Remaining:
                                                                        </span>
                                                                        <Countdown
                                                                            createdAt={
                                                                                order.created_at
                                                                            }
                                                                            hours={
                                                                                order
                                                                                    ?.task
                                                                                    ?.sla_hours
                                                                            }
                                                                        />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span>
                                                                            SLA Deadline :
                                                                        </span>
                                                                        <span className="text-gray-500">
                                                                            {order?.task?.sla_hours === 168 ? '7d' : `${order?.task?.sla_hours}h`}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </p>
                                                            <div className="mt-2">
                                                                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase border border-red-200 bg-red-100 text-red-800">
                                                                    {order.status.replace(
                                                                        "_",
                                                                        " ",
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {order.gifter_message && (
                                                                <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-[20px] text-sm italic text-gray-700">
                                                                    "{order.gifter_message}"
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <Link
                                                                href={route(
                                                                    "task.order",
                                                                    order.uuid,
                                                                )}
                                                                className="button block !text-sm sm"
                                                            >
                                                                Manage Order
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                    </>
                                ) : (
                                    <Nocontent text="No active orders found." />
                                )}
                            </ul>
                        </div>
                    )}

                    {/* Purchased Tasks */}
                    {purchased_tasks && purchased_tasks.length > 0 ? (
                        <div className="bg-white border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,9)] rounded-[30px]  overflow-hidden">
                            <div className="p-4 bg-blue-100 flex !border-b-2 !border-black items-center justify-between">
                                <h3 className="font-bold text-xl uppercase tracking-tight">
                                    Tasks I've Purchased
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="border-2 border-black bg-red-500 w-4 h-4 rounded-full block"></span>
                                    <span className="border-2 border-black bg-yellow-400 w-4 h-4 rounded-full block"></span>
                                    <span className="border-2 border-black bg-green-400 w-4 h-4 rounded-full block"></span>
                                </div>
                            </div>

                            <ul className="divide-y-2 divide-black">
                                {purchased_tasks.map((purchase) => (
                                    <li
                                        key={purchase.id}
                                        className="p-6 hover:bg-blue-50 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="w-full md:w-auto">
                                                <h3 className="text-xl font-bold text-gray-900 font-anton tracking-wide">
                                                    <Link
                                                        href={route(
                                                            "task.order",
                                                            purchase.uuid,
                                                        )}
                                                        className="hover:underline"
                                                    >
                                                        {purchase.task.title}
                                                    </Link>
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Creator:{" "}
                                                    <span className="font-semibold">
                                                        {purchase.task.creator
                                                            ?.name || "Unknown"}
                                                    </span>{" "}
                                                    | Purchased:{" "}
                                                    {new Date(
                                                        purchase.created_at,
                                                    ).toLocaleDateString()}
                                                    {[
                                                        "paid",
                                                        "assigned",
                                                        "pending_review",
                                                        "rejected_once",
                                                        "escalated",
                                                        "initiated",
                                                    ].includes(
                                                        purchase.status,
                                                    ) &&
                                                        purchase.task
                                                            .sla_hours && (
                                                            <>
                                                                {" "}
                                                                | Remaining:{" "}
                                                                <Countdown
                                                                    createdAt={
                                                                        purchase.created_at
                                                                    }
                                                                    hours={
                                                                        purchase
                                                                            .task
                                                                            .sla_hours
                                                                    }
                                                                />
                                                            </>
                                                        )}
                                                </p>
                                                <div className="mt-2">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusColor(
                                                            purchase.status,
                                                        )}`}
                                                    >
                                                        {purchase.status.replace(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Link
                                                    href={route(
                                                        "task.order",
                                                        purchase.uuid,
                                                    )}
                                                    className="inline-block bg-white border-2 border-black text-black px-6 py-2 rounded-[30px]  font-bold hover:bg-gray-100 uppercase text-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,8)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                                >
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <>
                            {auth && auth.user.role !== 1 && (
                                <Nocontent
                                    mode="clean"
                                    classes={"bg-white"}
                                    text="Nothing to see"
                                />
                            )}
                        </>
                    )}

                    {auth.user.role === 1 && (
                        <div className="shadow-layout !border-3 border-black bg-white shadow-black overflow-hidden rounded-[30px] ">
                            <div className="py-3 px-4 bg-mint flex !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center justify-between">
                                <h3 className="font-bold text-xl text-black">
                                    My Task Definitions
                                </h3>
                                <Link
                                    href={route("task.create")}
                                    className="bg-black text-white px-4 py-2 rounded-full text-sm font-bold uppercase hover:bg-gray-800 transition-colors"
                                >
                                    + New Task
                                </Link>
                            </div>

                            {tasks.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-gray-500 mb-4 font-medium">
                                        No tasks created yet.
                                    </p>
                                    <Link
                                        href={route("task.create")}
                                        className="button p"
                                    >
                                        Create Your First Task
                                    </Link>
                                </div>
                            ) : (
                                <ul className="divide-y divide-gray-200">
                                    {tasks.map((task) => {
                                        const taskStatus = getTaskStatus(task);
                                        const statusDisplay =
                                            getStatusDisplay(task);
                                        const statusBadgeColor =
                                            getStatusBadgeColor(task);
                                        const creatorNote =
                                            getCreatorNote(task);

                                        return (
                                            <li
                                                key={task.id}
                                                className="p-6 hover:bg-gray-50 transition-colors"
                                            >
                                                {/* Main Task Info Row */}
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-3">
                                                    <div className="flex-1">
                                                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                                                            <div className="flex-1">
                                                                <h3 className="text-xl font-bold text-gray-900  mb-1">
                                                                    <Link
                                                                        href={route(
                                                                            "task.show",
                                                                            task.uuid,
                                                                        )}
                                                                        className="hover:text-pink-500"
                                                                    >
                                                                        {
                                                                            task.title
                                                                        }
                                                                    </Link>
                                                                </h3>
                                                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                                    {
                                                                        task.description
                                                                    }
                                                                </p>
                                                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                    <span
                                                                        className={`uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadgeColor}`}
                                                                    >
                                                                        {
                                                                            statusDisplay
                                                                        }
                                                                    </span>
                                                                    {taskStatus ===
                                                                        "approved" && (
                                                                        <>
                                                                            <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-blue-100 text-blue-800 !border-blue-200">
                                                                                {
                                                                                    task.type
                                                                                }{" "}
                                                                                Delivery
                                                                            </span>
                                                                            {task?.sla_hours && (
                                                                                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-yellow-100 text-yellow-800 !border-yellow-200">
                                                                                    {task.sla_hours === 168 ? '7d' : `${task.sla_hours}h`}
                                                                                </span>
                                                                            )}
                                                                            <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border !bg-pink-100 text-pink-800 !border-pink-200">
                                                                                {task.category ||
                                                                                    "Paid Task"}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-gray-500 font-bold uppercase">
                                                                    Created:{" "}
                                                                    {new Date(
                                                                        task.created_at,
                                                                    ).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="text-right min-w-[100px]">
                                                                    <p className="text-2xl font-black text-pink-500 font-bold">
                                                                        {formatMultiPrice(
                                                                            task.price,
                                                                            task.currency ||
                                                                                "USD",
                                                                        )}
                                                                    </p>
                                                                </div>
                                                                <div className="flex-shrink-0">
                                                                    <Link
                                                                        href={route(
                                                                            "task.edit",
                                                                            task.uuid,
                                                                        )}
                                                                        className="inline-block bg-yellow-300 text-black border-2 border-black px-4 py-2 rounded-[15px] md:rounded-[20px]   font-bold uppercase text-sm  "
                                                                    >
                                                                        Edit
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Creator Note Section - Properly structured container */}
                                                {creatorNote && (
                                                    <div className={`mt-4 p-3 ${creatorNote.bgColor} border ${creatorNote.borderColor} rounded-[15px] md:rounded-[20px]  `} >
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                                                    <div className="flex-1">
                                                                        <h4
                                                                            className={`${creatorNote.textColor} font-bold text-sm mb-1`}
                                                                        >
                                                                            {
                                                                                creatorNote.title
                                                                            }
                                                                        </h4>
                                                                        <p
                                                                            className={`${creatorNote.lightTextColor} text-sm`}
                                                                        >
                                                                            {
                                                                                creatorNote.message
                                                                            }
                                                                        </p>

                                                                        {/* Rejection Reason Details - Shows only for rejected tasks */}
                                                                        {taskStatus ===
                                                                            "rejected" &&
                                                                            task.reason && (
                                                                                <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
                                                                                    <p className="text-red-800 font-bold text-xs mb-1">
                                                                                        Rejection
                                                                                        Feedback:
                                                                                    </p>
                                                                                    <p className="text-red-700 text-sm whitespace-pre-wrap">
                                                                                        {
                                                                                            task.reason
                                                                                        }
                                                                                    </p>
                                                                                    {task.rejected_at && (
                                                                                        <p className="text-red-600 text-xs mt-2">
                                                                                            Rejected
                                                                                            on:{" "}
                                                                                            {new Date(
                                                                                                task.rejected_at,
                                                                                            ).toLocaleDateString()}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            )}

                                                                        {/* Pending Review Details - Shows only for pending tasks */}
                                                                        {taskStatus ===
                                                                            "pending" &&
                                                                            task.is_approved_reason && (
                                                                                <div className="mt-3 p-3 bg-yellow-100 border border-yellow-200 rounded">
                                                                                    <p className="text-yellow-800 font-bold text-xs mb-1">
                                                                                        Additional
                                                                                        Info:
                                                                                    </p>
                                                                                    <p className="text-yellow-700 text-sm">
                                                                                        {
                                                                                            task.is_approved_reason
                                                                                        }
                                                                                    </p>
                                                                                </div>
                                                                            )}

                                                                        {/* Approved Details - Shows only for approved tasks */}
                                                                        {taskStatus ===
                                                                            "approved" &&
                                                                            task.approved_at && (
                                                                                <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded">
                                                                                    <p className="text-green-800 font-bold text-xs mb-1">
                                                                                        Approval
                                                                                        Details:
                                                                                    </p>
                                                                                    <p className="text-green-700 text-sm">
                                                                                        Approved
                                                                                        on:{" "}
                                                                                        {new Date(
                                                                                            task.approved_at,
                                                                                        ).toLocaleDateString()}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Completed Orders / Sales History */}
                    {completed_orders && completed_orders.length > 0 && (
                        <div className="shadow-layout !border-3 border-black bg-white shadow-black overflow-hidden rounded-[30px] ">
                            <div className="py-3 px-4 bg-green-100 flex !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center justify-between">
                                <h3 className="font-bold text-xl text-black">
                                    Sales History
                                </h3>
                                <div className="flex items-center">
                                    <span className=" border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block"></span>
                                    <span className=" border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block"></span>
                                    <span className=" border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block"></span>
                                </div>
                            </div>

                            <ul className="divide-y divide-gray-200">
                                {completed_orders.map((order) => (
                                    <li
                                        key={order.id}
                                        className="p-6 hover:bg-green-50 transition-colors"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div className="w-full md:w-auto">
                                                <h3 className="text-xl font-bold text-gray-900  ">
                                                    Order #
                                                    {order.uuid.substring(0, 8)}{" "}
                                                    - {order.task.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    Supporter:{" "}
                                                    <span className="font-semibold">
                                                        {order.supporter
                                                            ?.name || "Guest"}
                                                    </span>{" "}
                                                    | Ordered:{" "}
                                                    {new Date(
                                                        order.created_at,
                                                    ).toLocaleDateString()}
                                                </p>
                                                <div className="mt-2">
                                                    <span
                                                        className={`px-3 py-1 !rounded-[20px] text-xs font-bold uppercase border ${getStatusColor(
                                                            order.status,
                                                        )}`}
                                                    >
                                                        {order.status.replace(
                                                            "_",
                                                            " ",
                                                        )}
                                                    </span>
                                                </div>
                                                {order.gifter_message && (
                                                    <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-[20px] text-sm italic text-gray-600">
                                                        "{order.gifter_message}"
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <Link
                                                    href={route(
                                                        "task.order",
                                                        order.uuid,
                                                    )}
                                                    className="button  text-sm"
                                                >
                                                    View Details
                                                </Link>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </Guest>
    );
}
