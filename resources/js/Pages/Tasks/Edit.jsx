import { useForm, Head, Link, router, usePage } from "@inertiajs/react";
import Guest from "@/Layouts/GuestLayout";
import GlobalUploader from "@/uploadcare/Uploader";
import InputError from "@/Components/InputError";
import PriceFormat from "@/includes/PriceFormat";
import { useState } from "react";
import { Info, CheckCircle2, Clock, Zap, FileUp, ArrowLeft, AlertTriangle } from "lucide-react";
import RewardEditor, {
    rewardFromItem,
    rewardToPayload,
    validateReward,
} from "@/Components/Reward/RewardEditor";

export default function Edit({ auth, currencySymbol, task }) {
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const { global_currency } = usePage().props;
    const defaultCurrency = auth.user.default_currency || 'GBP';
    const [showSummary, setShowSummary] = useState(false);

    const categories = [
        "Shoutout / Name Feature",
        "Custom Message (Text / Audio)",
        "Custom Image (PG-13)",
        "Custom Video (PG-13)",
        "Task / Instruction (Non-sexual)",
        "Priority Access / Fast Response",
        "Leaderboard / Public Recognition",
        "Profile Feature / Pin",
        "Countdown / Deadline Task",
        "Challenge / Dare (PG-13)",
        "Decision Control (PG-13 framing)",
        "Reward / Unlockable",
        "Writing / Text Feature",
        "Digital File / Deliverable",
        "Other (Describe Clearly)"
    ];

    const timeframes = [
        { label: "1h", value: 1 },
        { label: "24h", value: 24 },
        { label: "48h", value: 48 },
        { label: "72h", value: 72 },
        { label: "7d", value: 168 }
    ];

    const { data, setData, post, transform, processing, errors } = useForm({
        // The buyer-facing reward. For an instant task it is also the file the
        // platform hands over automatically; for a timed task it is the promise
        // the creator fulfils after the order.
        reward: rewardFromItem(task, {
            file: "deliverable_content",
            mime: "deliverable_content_type",
            name: "deliverable_content_name",
            size: "deliverable_content_size",
        }),
        title: task.title || "",
        description: task.description || "",
        price: task.price || "",
        category: task.category || "Shoutout / Name Feature",
        type: task.type || "timed",
        sla_hours: task.sla_hours || 48,
        deliverable_file: null,
        deliverable_note: task.deliverable_note || "",
        media_file: null,
    });

    const isRejected = task.is_approved === 2;
    const submitText = isRejected ? "Resubmit Task" : "Update Task";
    const titleText = isRejected ? "Resubmit Task" : "Edit Task";

    const handleBack = (e) => {
        e.preventDefault();
        if (document.referrer && document.referrer.includes(window.location.origin)) {
            window.history.back();
        } else {
            router.visit(route("task.dashboard"));
        }
    };

    transform((payload) => {
        const { reward, ...rest } = payload;
        const isFile = reward.type === "file" && reward.file?.uuid;

        return {
            ...rest,
            ...rewardToPayload(reward),
            deliverable_file:
                rest.type === "instant" && isFile
                    ? {
                          url: `https://ucarecdn.com/${reward.file.uuid}/`,
                          mimeType: reward.file.mime,
                          name: reward.file.name,
                      }
                    : null,
            deliverable_note:
                reward.type === "message" ? reward.body : reward.description || "",
        };
    });

    const submit = (e) => {
        e.preventDefault();
        if (processing) return;
        if (!showSummary) {
            const rewardProblem = validateReward(data.reward);
            if (rewardProblem) {
                alert(rewardProblem);
                return;
            }
            setShowSummary(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        post(route("task.update", task.uuid));
    };

    const handleMediaUpload = (file) => {
        setData("media_file", file);
    };

    return (
        <Guest auth={auth.user} user={auth.user}>
            <Head title={titleText} />
            <div className="loginPage bg-white px-3 py-8 md:py-18 min-h-screen font-public-sans">
                <div className="container">
                    <div className="mx-auto max-w-[900px]">
                        {/* Back Button */}
                        <div className="mb-6">
                            <button
                                onClick={handleBack}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-[30px]  border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                            >
                                <ArrowLeft size={16} />
                                Back to Task Lists
                            </button>
                        </div>

                        <div className="text-center mb-8">
                            <h2 className="font-fre text-3xl md:text-4xl uppercase tracking-wider">
                                {titleText}
                            </h2>
                            <div className="mt-4 p-4 bg-yellow-50 border-2 border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-left">
                                <p className="text-black font-bold text-lg tracking-wide">
                                    Paid Tasks are for things you’re happy to do. You define the task, price, and delivery. No custom requests outside your description. PG-13 only.
                                </p>
                            </div>
                        </div>

                        {/* Rejection Notice Banner */}
                        {isRejected && (
                            <div className="mb-8 p-6 bg-red-50 border-2 border-red-500 rounded-[30px]  shadow-[4px_4px_0px_0px_rgba(220,38,38,1)]">
                                <div className="flex items-start gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black text-red-800 mb-1 flex items-center gap-2">
                                            <AlertTriangle className="text-red-600" /> Task Rejected - Action Required
                                        </h3>
                                        <p className="text-red-700 font-medium mb-4">
                                            Your task was rejected by the admin. Please review the feedback, make necessary changes, and resubmit for review.
                                        </p>
                                        {task.reason && (
                                            <div className="p-4 bg-red-100 border-2 border-red-200 rounded-[20px]">
                                                <p className="text-red-800 font-bold text-sm mb-1 uppercase tracking-wider">Feedback:</p>
                                                <p className="text-red-700 font-medium whitespace-pre-wrap">{task.reason}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {showSummary ? (
                            <div className="bg-white border-2 border-black rounded-[30px]  p-8 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-2xl font-black uppercase mb-6 flex items-center gap-2">
                                    <CheckCircle2 className="text-green-600" /> Confirm Task Changes
                                </h3>
                                
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between border-b-2 border-gray-100 pb-3">
                                        <span className="font-bold text-gray-500 uppercase text-sm">Title</span>
                                        <span className="font-black text-right max-w-[60%]">{data.title}</span>
                                    </div>
                                    <div className="flex justify-between border-b-2 border-gray-100 pb-3">
                                        <span className="font-bold text-gray-500 uppercase text-sm">Category</span>
                                        <span className="font-black">{data.category}</span>
                                    </div>
                                    <div className="flex justify-between border-b-2 border-gray-100 pb-3">
                                        <span className="font-bold text-gray-500 uppercase text-sm">Price</span>
                                        <span className="font-black text-green-600">{currencySymbol}{data.price}</span>
                                    </div>
                                    <div className="flex justify-between border-b-2 border-gray-100 pb-3">
                                        <span className="font-bold text-gray-500 uppercase text-sm">Delivery</span>
                                        <span className="font-black uppercase">{data.type === 'instant' ? '⚡ Instant' : '⏳ Manual'}</span>
                                    </div>
                                    {data.type === 'timed' && (
                                        <div className="flex justify-between border-b-2 border-gray-100 pb-3">
                                            <span className="font-bold text-gray-500 uppercase text-sm">Timeframe</span>
                                            <span className="font-black">{timeframes.find(tf => tf.value === data.sla_hours)?.label || `${data.sla_hours}h`}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-[20px] mb-8">
                                    <div className="flex gap-3">
                                        <Info className="text-blue-600 shrink-0" />
                                        <p className="text-sm font-bold text-blue-900">
                                            {data.type === 'timed' 
                                                ? "Funds for manual tasks are held until you upload delivery proof. High-value tasks may experience additional verification delays."
                                                : "Instant tasks are delivered immediately and are non-refundable once purchased."}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row gap-4">
                                    <button 
                                        onClick={() => setShowSummary(false)}
                                        className="flex-1 px-6 py-4 border-2 border-black rounded-[20px] font-black uppercase hover:bg-gray-50 transition-all"
                                    >
                                        Back to Edit
                                    </button>
                                    <button 
                                        onClick={submit}
                                        disabled={processing}
                                        className="flex-[2] bg-[#FF007F] text-white px-6 py-4 border-2 border-black rounded-[20px] font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                                    >
                                        {processing ? "Updating..." : "Save Changes & Resubmit"}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <form onSubmit={submit} className="space-y-8">
                                    {/* Title */}
                                    <div>
                                        <label className="block font-black text-sm mb-2 uppercase tracking-wide text-gray-500">Task Title</label>
                                        <input
                                            type="text"
                                            maxLength={100}
                                            className="w-full border-2 border-black rounded-[20px] p-[18px] text-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:outline-none transition-all bg-yellow-50 placeholder-gray-400 font-bold"
                                            value={data.title}
                                            onChange={(e) => setData("title", e.target.value)}
                                            placeholder="Keep the title clear and specific."
                                        />
                                        <div className="flex justify-between mt-2">
                                            <p className="text-xs font-bold text-gray-500">This is what supporters will see before purchasing.</p>
                                            <p className={`text-xs font-bold ${data.title.length >= 100 ? 'text-red-500' : 'text-gray-400'}`}>
                                                {data.title.length}/100
                                            </p>
                                        </div>
                                        <InputError message={errors.title} className="mt-2 font-bold text-red-600 bg-red-100 p-2 rounded border-2 border-red-500 inline-block" />
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block font-black text-sm mb-2 uppercase tracking-wide text-gray-500">Task Description</label>
                                        <textarea
                                            className="w-full border-2 border-black rounded-[20px] p-4 text-lg font-medium shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:outline-none transition-all min-h-[120px] bg-blue-50 placeholder-gray-400"
                                            rows="4"
                                            value={data.description}
                                            onChange={(e) => setData("description", e.target.value)}
                                            placeholder="Describe exactly what you will deliver."
                                        ></textarea>
                                        <InputError message={errors.description} className="mt-2 font-bold text-red-600 bg-red-100 p-2 rounded border-2 border-red-500 inline-block" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Price */}
                                        <div>
                                            <label className="block font-black text-sm mb-2 uppercase tracking-wide text-gray-500 flex items-center gap-2">
                                                Price ({currencySymbol})
                                                {data.type === 'timed' && (
                                                    <div className="group relative">
                                                        <Info size={14} className="text-blue-500 cursor-help" />
                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                                            High-value tasks may delay payout until delivery is confirmed.
                                                        </div>
                                                    </div>
                                                )}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-xl text-green-700 z-10 pointer-events-none">{currencySymbol}</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="w-full border-2 border-black rounded-[20px] p-[18px] pl-10 text-normal font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:outline-none transition-all bg-green-50"
                                                    value={data.price}
                                                    onChange={(e) => setData("price", e.target.value)}
                                                />
                                            </div>
                                            {data.price > 0 && (
                                                <div className="mt-4 p-4 bg-gray-50 rounded-[20px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-bold text-gray-700 uppercase">Fans pay:</span>
                                                        <span className="font-black text-xl text-black">
                                                            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: defaultCurrency }).format(calculateTotalSupporterPays(data.price, defaultCurrency).total_supporter_pays)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-bold text-gray-700 uppercase">You receive:</span>
                                                        <span className="font-black text-xl text-green-600">
                                                            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: defaultCurrency }).format(data.price)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-xs text-gray-500 font-medium">Fans only see the total price to improve conversion</p>
                                                    <p className="mt-1 text-xs text-gray-500 font-medium">Our fee is 19%. Uplift will show higher due to stripe / conversions to ensure you always receive 100% or slightly more.</p>
                                                </div>
                                            )}
                                            <InputError message={errors.price} className="mt-2 font-bold text-red-600 bg-red-100 p-2 rounded border-2 border-red-500 inline-block" />
                                        </div>

                                        {/* Category */}
                                        <div>
                                            <label className="block font-black text-sm mb-2 uppercase tracking-wide text-gray-500">Category</label>
                                            <select
                                                className="w-full border-2 border-black rounded-[20px] p-[18px] text-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:translate-x-[2px] focus:translate-y-[2px] focus:outline-none transition-all bg-purple-50 font-bold appearance-none cursor-pointer"
                                                value={data.category}
                                                onChange={(e) => setData("category", e.target.value)}
                                            >
                                                {categories.map((cat) => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                            <InputError message={errors.category} className="mt-2 font-bold text-red-600 bg-red-100 p-2 rounded border-2 border-red-500 inline-block" />
                                        </div>
                                    </div>

                                    {/* Type Selection */}
                                    <div>
                                        <label className="block font-black text-sm mb-4 uppercase tracking-wide text-gray-500">Delivery Method</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setData("type", "timed")}
                                                className={`p-6 rounded-[25px] border-2 border-black text-left transition-all ${data.type === "timed" ? "bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]" : "bg-white hover:bg-gray-50"}`}
                                            >
                                                <div className="font-black text-xl uppercase mb-2 flex items-center gap-2"><Clock size={20} /> Timed / Manual</div>
                                                <div className={`text-sm font-bold ${data.type === "timed" ? "text-blue-100" : "text-gray-500"}`}>Best for custom shoutouts. Funds are held until delivery.</div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setData("type", "instant")}
                                                className={`p-6 rounded-[25px] border-2 border-black text-left transition-all ${data.type === "instant" ? "bg-[#FF007F] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]" : "bg-white hover:bg-gray-50"}`}
                                            >
                                                <div className="font-black text-xl uppercase mb-2 flex items-center gap-2"><Zap size={20} /> Instant Delivery</div>
                                                <div className={`text-sm font-bold ${data.type === "instant" ? "text-pink-100" : "text-gray-500"}`}>Content is delivered immediately. Best for files or links.</div>
                                            </button>
                                        </div>
                                    </div>

                                    {/* SLA */}
                                    {data.type === "timed" && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                            <label className="block font-black text-sm mb-4 uppercase tracking-wide text-gray-500">Delivery Timeframe</label>
                                            <div className="flex flex-wrap gap-3">
                                                {timeframes.map((tf) => (
                                                    <button
                                                        key={tf.value}
                                                        type="button"
                                                        onClick={() => setData("sla_hours", tf.value)}
                                                        className={`px-6 py-3 rounded-full border-2 border-black font-black transition-all ${data.sla_hours == tf.value ? "bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1" : "bg-white hover:bg-blue-50"}`}
                                                    >
                                                        {tf.label}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-sm text-blue-800 mt-4 font-bold flex items-center gap-2"><Clock size={16} /> You will have {timeframes.find(tf => tf.value === data.sla_hours)?.label || `${data.sla_hours}h`} to complete the task.</p>
                                        </div>
                                    )}

                                    {/* What the buyer receives — one editor for every module. */}
                                    <div className="rounded-box border-[3px] border-black bg-pink-50 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <p className="mb-4 flex items-center gap-2 text-lg font-black uppercase text-pink-900">
                                            <FileUp className="text-[#FF007F]" /> What the buyer receives
                                        </p>
                                        {task.deliverable_content && data.reward.type !== "file" && (
                                            <a
                                                href={route("task.download", task.uuid)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mb-4 inline-flex rounded-full bg-blue-600 px-4 py-2 text-xs font-black uppercase text-white"
                                            >
                                                View current content
                                            </a>
                                        )}
                                        <RewardEditor
                                            value={data.reward}
                                            onChange={(next) => setData("reward", next)}
                                            ctxName="task-deliverable"
                                            errors={errors}
                                        />
                                    </div>

                                    {/* Terms */}
                                    <div className="p-6 bg-red-50 border-2 border-black rounded-[25px] !mt-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <div className="flex items-start">
                                            <input id="terms-checkbox" type="checkbox" required className="h-6 w-6 text-[#FF007F] border-2 border-black rounded focus:ring-0 cursor-pointer" />
                                            <div className="ml-4">
                                                <label htmlFor="terms-checkbox" className="cursor-pointer text-sm text-black font-black leading-tight flex flex-col gap-1">
                                                    <span>PG-13 only. No sexual content. No custom requests outside these parameters.</span>
                                                    <span className="text-red-600 text-xs">Failure to deliver may result in refunds or account action.</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full bg-black text-white px-8 py-5 rounded-[25px] font-black text-xl uppercase shadow-[8px_8px_0px_0px_rgba(236,72,153,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50"
                                    >
                                        {processing ? "Updating..." : "Continue to Summary"}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Guest>
    );
}
