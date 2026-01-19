import { useForm, Head } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import GlobalUploader from "@/uploadcare/Uploader";
import InputError from "@/Components/InputError";

export default function Create({ auth, currencySymbol }) {
    const { data, setData, post, processing, errors } = useForm({
        title: "",
        description: "",
        price: "",
        category: "",
        type: "instant",
        sla_hours: 48,
        deliverable_file: null,
        deliverable_note: "",
        media_file: null,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route("task.store"));
    };

    const handleDeliverableUpload = (file) => {
        setData("deliverable_file", file);
    };

    const handleMediaUpload = (file) => {
        setData("media_file", file);
    };

    return (
        <Guest auth={auth.user} user={auth.user}>
            <Head title="Create Task" />
            <div className="loginPage bg-white px-3 py-5 min-h-screen font-public-sans">
                <div className="container">
                    <div className="mx-auto max-w-[900px]">
                        <div className="text-center">
                            <h2 className="font-fre text-3xl md:text-4xl uppercase tracking-wider ">
                                Create New Task
                            </h2>
                            <p className="text-black mt-1 font-bold text-lg tracking-wide capitalize">
                                Offer something unique to your supporters
                            </p>
                        </div>

                        <div className="">
                            <form
                                onSubmit={submit}
                                className="p-6 md:p-10 space-y-6 bg-white"
                            >
                                {/* Title */}
                                <div className="mb-0">
                                    {/* <label className="block font-black text-normal mb-2 capitalize tracking-wide">Title</label> */}
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
                                    {/* <label className="block font-black text-xl mb-2 uppercase tracking-wide border-l-4 border-blue-500 pl-3">Description (PG-13)</label> */}
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
                                        {/* <label className="block font-black text-xl mb-2 uppercase tracking-wide border-l-4 border-green-500 pl-3">Price ({currencySymbol})</label> */}
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl text-green-700 z-10 pointer-events-none">
                                                {currencySymbol}
                                            </span>

                                            <input
                                                type="number"
                                                placeholder={`Price (${currencySymbol})`}
                                                step="0.01"
                                                className="relative z-0 w-full border-2 border-black rounded-[15px] 
                                                p-[18px] pl-10 text-normal font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                                focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] 
                                                focus:outline-none transition-all bg-green-50"
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
                                        {/* <label className="block font-black text-xl mb-2 uppercase tracking-wide border-l-4 border-purple-500 pl-3">Category</label> */}
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
                                                className={`text-sm font-medium ${data.type === "instant" ? "text-pink-100" : "text-gray-600"}`}
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
                                                className={`text-sm font-medium ${data.type === "timed" ? "text-blue-100" : "text-gray-600"}`}
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
                                                Upload Deliverable Content
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
                                                    <span>✅</span> File
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

                                {/* Cover Image */}
                                {/* <div className="group">
                                    <label className="block font-black text-xl mb-2 uppercase tracking-wide border-l-4 border-gray-500 pl-3">Cover Image (Optional)</label>
                                    <div className="border-2 border-black rounded-xl p-6 bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <GlobalUploader
                                            ctxName="task-cover"
                                            type="minimal"
                                            sendFile={handleMediaUpload}
                                            accept="image/*"
                                            imgonly={true}
                                        />
                                        {data.media_file && (
                                            <div className="mt-3 text-sm text-green-800 font-bold bg-green-100 p-3 rounded-lg border-2 border-black flex items-center gap-2">
                                                <span>✅</span> Image selected: {data.media_file.name}
                                            </div>
                                        )}
                                    </div>
                                    <InputError message={errors.media_file} className="mt-2" />
                                </div> */}

                                {/* Terms */}
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

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full button b mt-4"
                                >
                                    {processing ? "Creating..." : "Create Task"}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </Guest>
    );
}
