import { useForm, Head, Link, router } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import GlobalUploader from "@/uploadcare/Uploader";
import InputError from "@/Components/InputError";
import { usePage } from "@inertiajs/react";

export default function Edit({ auth, currencySymbol, task }) {
    const { data, setData, post, processing, errors } = useForm({
        title: task.title || "",
        description: task.description || "",
        price: task.price || "",
        category: task.category || "",
        type: task.type || "instant",
        sla_hours: task.sla_hours || 48,
        deliverable_file: null,
        deliverable_note: task.deliverable_note || "",
        media_file: null,
    });

    const { url } = usePage();

    // Check if task is rejected (is_approved === 2)
    const isRejected = task.is_approved === 2;
    const submitText = isRejected ? "Resubmit Task" : "Update Task";
    const titleText = isRejected ? "Resubmit Task" : "Edit Task";
    const descriptionText = isRejected
        ? "Make changes based on feedback and resubmit for admin review"
        : "Update your task details";

    // Handle back button click
    const handleBack = (e) => {
        e.preventDefault();
        // Go back in history or redirect to dashboard
        if (
            document.referrer &&
            document.referrer.includes(window.location.origin)
        ) {
            window.history.back();
        } else {
            router.visit(route("task.dashboard"));
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route("task.update", task.uuid));
    };

    const handleDeliverableUpload = (file) => {
        setData("deliverable_file", file);
    };

    const handleMediaUpload = (file) => {
        setData("media_file", file);
    };

    return (
        <Guest auth={auth.user} user={auth.user}>
            <Head title={titleText} />
            <div className="loginPage bg-white px-3 py-5 min-h-screen font-public-sans">
                <div className="container">
                    <div className="mx-auto max-w-[900px]">
                        {/* Back Button - Top Left */}
                        <div className="mb-6">
                            <button
                                onClick={handleBack}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-[10px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                    />
                                </svg>
                                Back to Task Lists
                            </button>
                        </div>

                        {/* Rejection Notice Banner */}
                        {isRejected && (
                            <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-[15px] shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
                                <div className="flex items-start gap-3">
                                    {/* <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                                        <svg
                                            className="w-6 h-6 text-red-600"
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
                                    </div> */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-red-800 mb-1">
                                            ⚠️ Task Rejected - Action Required
                                        </h3>
                                        <p className="text-red-700 font-medium mb-2">
                                            Your task was rejected by the admin.
                                            Please review the feedback below,
                                            make necessary changes, and resubmit
                                            for review.
                                        </p>
                                        {task.reason && (
                                            <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                                                <p className="text-red-800 font-bold text-sm mb-1">
                                                    Rejection Feedback:
                                                </p>
                                                <p className="text-red-700 text-sm whitespace-pre-wrap">
                                                    {task.reason}
                                                </p>
                                                {task.rejected_at && (
                                                    <p className="text-red-600 text-xs mt-2">
                                                        Rejected on:{" "}
                                                        {new Date(
                                                            task.rejected_at,
                                                        ).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="text-center">
                            <h2 className="font-fre text-3xl md:text-4xl uppercase tracking-wider">
                                {titleText}
                            </h2>
                            <p className="text-black mt-1 font-bold text-lg tracking-wide capitalize">
                                {descriptionText}
                            </p>
                        </div>

                        <div className="">
                            <form
                                onSubmit={submit}
                                className="mt-4  space-y-6 bg-white"
                            >
                                {/* Title */}
                                <div className="mb-0">
                                    <input
                                        type="text"
                                        className="w-full border-2 border-black rounded-[15px] p-[18px] text-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:outline-none transition-all bg-yellow-50 placeholder-gray-400"
                                        value={data.title}
                                        onChange={(e) =>
                                            setData("title", e.target.value)
                                        }
                                        placeholder="Task Title e.g. Custom Video Greeting"
                                    />
                                    <InputError
                                        message={errors.title}
                                        className="mt-2 font-bold text-red-600 bg-red-100 p-2 rounded border-2 border-red-500 inline-block"
                                    />
                                </div>

                                {/* Description */}
                                <div className="mb-0">
                                    <textarea
                                        className="w-full border-2 border-black rounded-[20px] p-4 text-lg font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:outline-none transition-all min-h-[120px] bg-blue-50 placeholder-gray-400"
                                        rows="4"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                "description",
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Describe exactly what you will provide..."
                                    ></textarea>
                                    <InputError
                                        message={errors.description}
                                        className="mt-2 font-bold text-red-600 bg-red-100 p-2 rounded border-2 border-red-500 inline-block"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Price */}
                                    <div className="mb-0">
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl text-green-700 z-10 pointer-events-none">
                                                {currencySymbol}
                                            </span>
                                            <input
                                                type="number"
                                                placeholder={`Price (${currencySymbol})`}
                                                step="0.01"
                                                className="w-full border-2 border-black rounded-[15px] p-[18px] pl-10 text-normal font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:outline-none transition-all bg-green-50"
                                                value={data.price}
                                                onChange={(e) =>
                                                    setData(
                                                        "price",
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <InputError
                                            message={errors.price}
                                            className="mt-2 font-bold text-red-600 bg-red-100 p-2 rounded border-2 border-red-500 inline-block"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div className="mb-0">
                                        <input
                                            type="text"
                                            className="w-full border-2 border-black rounded-[15px] p-[18px] text-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:outline-none transition-all bg-purple-50 placeholder-gray-400"
                                            value={data.category}
                                            onChange={(e) =>
                                                setData(
                                                    "category",
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Category (e.g. Shoutout, Art)"
                                        />
                                        <InputError
                                            message={errors.category}
                                            className="mt-2 font-bold text-red-600 bg-red-100 p-2 rounded border-2 border-red-500 inline-block"
                                        />
                                    </div>
                                </div>

                                {/* Type Selection */}
                                <div className="">
                                    <label className="block font-black text-normal mb-2 mt-8 capitalize tracking-wide text-start">
                                        Delivery Method
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData("type", "instant")
                                            }
                                            className={`p-4 rounded-[18px] border-2 border-black text-left transition-all ${
                                                data.type === "instant"
                                                    ? "bg-pink-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                                                    : "bg-white hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="font-black text-lg uppercase mb-1">
                                                ⚡ Instant Delivery
                                            </div>
                                            <div
                                                className={`text-sm font-medium ${
                                                    data.type === "instant"
                                                        ? "text-pink-100"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                Content is delivered
                                                automatically immediately after
                                                payment.
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData("type", "timed")
                                            }
                                            className={`p-4 rounded-[18px] border-2 border-black text-left transition-all ${
                                                data.type === "timed"
                                                    ? "bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                                                    : "bg-white hover:bg-gray-50"
                                            }`}
                                        >
                                            <div className="font-black text-lg uppercase mb-1">
                                                ⏳ Timed / Manual
                                            </div>
                                            <div
                                                className={`text-sm font-medium ${
                                                    data.type === "timed"
                                                        ? "text-blue-100"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                You upload proof of completion
                                                within a set timeframe.
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {/* SLA (Only for Timed) */}
                                {data.type === "timed" && (
                                    <div className="">
                                        <label className="block font-black text-lg mb-2 text-blue-900 uppercase">
                                            SLA (Hours to complete)
                                        </label>
                                        <input
                                            type="number"
                                            className="w-full border-2 bg-blue-100 border-black rounded-[18px] p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold text-xl"
                                            value={data.sla_hours}
                                            onChange={(e) =>
                                                setData(
                                                    "sla_hours",
                                                    e.target.value,
                                                )
                                            }
                                            min="1"
                                            max="168"
                                        />
                                        <p className="text-sm text-blue-800 mt-3 font-bold">
                                            You have {data.sla_hours} hours to
                                            complete the task after purchase.
                                            After {data.sla_hours} hours, the
                                            task will be marked as expired.
                                        </p>
                                        <InputError
                                            message={errors.sla_hours}
                                            className="mt-2"
                                        />
                                    </div>
                                )}

                                {/* Deliverable File (Only for Instant) */}
                                {data.type === "instant" && (
                                    <div className="">
                                        <div className="border-2 border-black rounded-[20px] p-4 bg-pink-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                            <label className="block font-black text-lg mb-3 text-pink-900 uppercase flex items-center gap-2">
                                                <span className="bg-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm border-2 border-black">
                                                    1
                                                </span>
                                                Update Deliverable Content
                                            </label>
                                            <textarea
                                                className="bg-white w-full border-2 border-black rounded-[15px] p-3 mb-4 font-medium focus:!shadow-none"
                                                rows="2"
                                                placeholder="Add a note or external link (optional if file provided)..."
                                                value={data.deliverable_note}
                                                onChange={(e) =>
                                                    setData(
                                                        "deliverable_note",
                                                        e.target.value,
                                                    )
                                                }
                                            ></textarea>
                                            <p className="text-sm font-black text-gray-900 mb-2 uppercase">
                                                OR Upload File
                                            </p>

                                            {task.deliverable_content &&
                                                !data.deliverable_file && (
                                                    <div className="mb-4 text-sm text-blue-800 font-bold bg-blue-100 p-3 rounded-lg border-2 border-black flex flex-col gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <span>📁</span>
                                                            <span>
                                                                Current File:{" "}
                                                                <strong>
                                                                    {task.deliverable_content
                                                                        .split(
                                                                            "/",
                                                                        )
                                                                        .pop()}
                                                                </strong>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 ml-6">
                                                            <a
                                                                href={route(
                                                                    "task.download",
                                                                    task.uuid,
                                                                )}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-md text-xs font-bold uppercase transition-colors"
                                                            >
                                                                Download / View
                                                            </a>
                                                            <span className="text-xs text-blue-700 font-medium">
                                                                (Uploading a new
                                                                file will
                                                                replace this)
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                            <GlobalUploader
                                                ctxName="task-deliverable"
                                                type="minimal"
                                                sendFile={
                                                    handleDeliverableUpload
                                                }
                                                accept="image/*,video/*,audio/*,application/pdf,text/plain,application/zip,application/x-zip-compressed,application/x-rar-compressed"
                                                imgonly={false}
                                            />
                                            {data.deliverable_file && (
                                                <div className="mt-3 text-sm text-green-800 font-bold bg-green-100 p-3 rounded-lg border-2 border-black flex items-center gap-2">
                                                    <span>✅</span> New File
                                                    selected:{" "}
                                                    {data.deliverable_file.name}
                                                </div>
                                            )}
                                        </div>
                                        <InputError
                                            message={errors.deliverable_file}
                                            className="mt-2 font-bold text-red-600"
                                        />
                                    </div>
                                )}

                                <div className="flex items-center !mt-12">
                                    <input
                                        id="terms-checkbox"
                                        type="checkbox"
                                        required
                                        className="mt-1 mr-3 h-6 w-6 text-pink-600 border-2 border-black rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                    />
                                    <label
                                        htmlFor="terms-checkbox"
                                        className="cursor-pointer text-normal text-black font-bold leading-relaxed"
                                    >
                                        I accept the terms: PG-13 only, No
                                        sexual content, No custom requests
                                        outside of these parameters.
                                    </label>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    {/* Cancel Button - Bottom */}
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-[10px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all text-center flex items-center justify-center gap-2"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                                            />
                                        </svg>
                                        Cancel
                                    </button>

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className={`flex-1 px-6 py-3 ${
                                            isRejected
                                                ? "bg-red-600 hover:bg-red-700"
                                                : "bg-black hover:bg-gray-800"
                                        } text-white font-bold rounded-[10px] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all`}
                                    >
                                        {processing
                                            ? isRejected
                                                ? "Resubmitting..."
                                                : "Updating..."
                                            : submitText}
                                    </button>
                                </div>

                                {/* Additional info for rejected tasks */}
                                {isRejected && (
                                    <div className="mt-4 p-4 bg-gray-50 border border-gray-300 rounded-lg text-center">
                                        <p className="text-gray-700 text-sm font-medium">
                                            <span className="font-bold">
                                                Note:
                                            </span>{" "}
                                            After resubmitting, your task will
                                            be sent back to admin for review.
                                            You'll be notified once a decision
                                            is made.
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Guest>
    );
}
