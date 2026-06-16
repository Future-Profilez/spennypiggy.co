import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import Popup from "@/Components/Popup";
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../css/uploader.module.css";

export default function PiggyPotModal({
    show,
    onClose,
    mode = "create",
    pot = null,
    auth,
    onSuccessCallback = null,
}) {
    const isEditing = mode === "edit";

    const { successAlert, errorAlert } = useAlerts();

    const defaultCurrency = auth?.user?.default_currency || "GBP";

    const defaultValues = {
        title: "",
        description: "",
        target_amount: "",
        currency: defaultCurrency,
        deadline: "",
        is_pinned: false,
        enable_leaderboard: true,
        allow_anonymous: true,
        status: "active",
        content_file: "",
        content_description: "",
        cover_media:
            "https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/",
    };

    const { data, setData, post, processing, errors, reset, clearErrors, setError } =
        useForm(defaultValues);

    /*
    |--------------------------------------------------------------------------
    | Fill Edit Data
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (show && isEditing && pot) {
            setData({
                title: pot.title || "",
                description: pot.description || "",
                target_amount: pot.target_amount || "",
                currency: pot.currency || "GBP",
                deadline: pot.deadline
                    ? new Date(pot.deadline).toISOString().slice(0, 16)
                    : "",
                is_pinned: pot.is_pinned == 1 || pot.is_pinned === true,
                enable_leaderboard:
                    pot.enable_leaderboard == 1 ||
                    pot.enable_leaderboard === true,
                allow_anonymous:
                    pot.allow_anonymous == 1 || pot.allow_anonymous === true,
                status: pot.status || "active",
                content_file: pot.content_file || "",
                content_description: pot.content_description || "",
                cover_media: pot.cover_media || defaultValues.cover_media,
            });
        } else if (show && !isEditing) {
            reset();
            setData(defaultValues);
        }
    }, [show, pot]);

    /*
    |--------------------------------------------------------------------------
    | Close Modal
    |--------------------------------------------------------------------------
    */

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    /*
    |--------------------------------------------------------------------------
    | Submit
    |--------------------------------------------------------------------------
    */

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!data.content_file) {
            setError("content_file", "Content file is required.");
            errorAlert("Please upload the content file the supporter receives.");
            return;
        }

        const options = {
            onSuccess: (page) => {
                if (
                    page.props.errors &&
                    Object.keys(page.props.errors).length > 0
                ) {
                    errorAlert("Please check the form for errors.");
                } else {
                    successAlert(
                        isEditing
                            ? "Piggy Pot updated successfully!"
                            : "Piggy Pot created successfully!",
                    );

                    handleClose();

                    if (onSuccessCallback) {
                        onSuccessCallback();
                    }
                }
            },

            onError: () => {
                errorAlert("Please check the form for errors.");
            },
        };

        if (isEditing) {
            post(route("piggy-pots.update", pot.id), options);
        } else {
            post(route("piggy-pots.store"), options);
        }
    };

    return (
        <Popup size="xl" classes="hidden" action={show} onHide={handleClose}>
            <div className="p-6">
                <h3 className="font-GillSans uppercase text-3xl mb-6">
                    {isEditing ? "Edit Piggy Pot" : "Create Piggy Pot"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">
                            Content Title
                        </label>
                        <input
                            type="text"
                            className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            placeholder="e.g. Exclusive photo set"
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            required
                        />
                        {errors.title && (
                            <div className="text-red-500 text-xs mt-1 font-bold">
                                {errors.title}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-1">
                            Description
                        </label>
                        <textarea
                            className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                            rows="3"
                            placeholder="Describe the content supporters will unlock..."
                            value={data.description}
                            onChange={(e) => setData("description", e.target.value)}
                        />
                        {errors.description && (
                            <div className="text-red-500 text-xs mt-1 font-bold">
                                {errors.description}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                Progress Goal ({data.currency}) — optional
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="1"
                                className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                placeholder="e.g. 500"
                                value={data.target_amount}
                                onChange={(e) => setData("target_amount", e.target.value)}
                                required
                            />
                            {errors.target_amount && (
                                <div className="text-red-500 text-xs mt-1 font-bold">
                                    {errors.target_amount}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                Deadline (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                value={data.deadline}
                                onChange={(e) => setData("deadline", e.target.value)}
                            />
                            {errors.deadline && (
                                <div className="text-red-500 text-xs mt-1 font-bold">
                                    {errors.deadline}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Cover Image (Optional)
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Upload a cover image to make your pot stand out.
                        </p>
                        <div className="border-2 border-black rounded-[20px] p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-50 border-dashed hover:border-pink-500 transition-colors">
                            {data.cover_media && (
                                <div className="mb-3 bg-white border-2 border-black rounded-xl overflow-hidden relative group">
                                    <img
                                        src={data.cover_media}
                                        className="w-full h-[150px] object-cover"
                                        alt="Cover Preview"
                                    />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() => setData("cover_media", "")}
                                            className="bg-white text-red-600 font-bold px-4 py-2 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                                        >
                                            Remove Cover
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="uploader overflow-hidden">
                                <GlobalUploader
                                    ctxName="piggy-pot-cover"
                                    type="minimal"
                                    accept="image/*"
                                    imgonly={true}
                                    sendFile={(file) =>
                                        setData(
                                            "cover_media",
                                            file?.url || file?.cdnUrl || file?.originalUrl,
                                        )
                                    }
                                    options={st.avatar}
                                />
                            </div>
                        </div>
                        {errors.cover_media && (
                            <div className="text-red-500 text-xs mt-2 font-bold">
                                {errors.cover_media}
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t-2 border-gray-200 mt-6">
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Content the supporter receives
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Supporters automatically unlock this content after they purchase.
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                Content Description
                            </label>
                            <textarea
                                className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                rows="2"
                                placeholder="Describe the exclusive content they will get..."
                                value={data.content_description}
                                onChange={(e) => setData("content_description", e.target.value)}
                            />
                        </div>
                        <div className="border-2 border-black rounded-[20px] p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-50 border-dashed hover:border-pink-500 transition-colors">
                            {data.content_file && (
                                <div className="mb-3 p-3 bg-white border-2 border-black rounded-xl text-sm font-bold flex justify-between items-center">
                                    <span className="truncate">File Uploaded!</span>
                                    <button
                                        type="button"
                                        onClick={() => setData("content_file", "")}
                                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded-lg"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                            <div className="uploader overflow-hidden">
                                <GlobalUploader
                                    ctxName="piggy-pot-context"
                                    type="minimal"
                                    accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/rtf,application/zip,application/x-zip-compressed"
                                    imgonly={false}
                                    sendFile={(file) =>
                                        setData(
                                            "content_file",
                                            file?.uuid || file?.url || file?.cdnUrl || "",
                                        )
                                    }
                                    options={st.wishlistcontent}
                                />
                            </div>
                        </div>
                        {errors.content_file && (
                            <div className="text-red-500 text-xs mt-2 font-bold">
                                {errors.content_file}
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t-2 border-gray-200 mt-6">
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={data.is_pinned}
                                    onChange={(e) => setData("is_pinned", e.target.checked)}
                                />
                                <div
                                    className={`block w-14 h-8 rounded-full border-2 border-black transition-colors ${
                                        data.is_pinned ? "bg-[#A2E4B8]" : "bg-gray-300"
                                    }`}
                                ></div>
                                <div
                                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full border-2 border-black transition-transform ${
                                        data.is_pinned ? "transform translate-x-6" : ""
                                    }`}
                                ></div>
                            </div>
                            <span className="ml-3 font-bold text-gray-900">
                                Pin to profile (Featured Goal)
                            </span>
                        </label>

                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={data.enable_leaderboard}
                                    onChange={(e) => setData("enable_leaderboard", e.target.checked)}
                                />
                                <div
                                    className={`block w-14 h-8 rounded-full border-2 border-black transition-colors ${
                                        data.enable_leaderboard ? "bg-[#A2E4B8]" : "bg-gray-300"
                                    }`}
                                ></div>
                                <div
                                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full border-2 border-black transition-transform ${
                                        data.enable_leaderboard ? "transform translate-x-6" : ""
                                    }`}
                                ></div>
                            </div>
                            <span className="ml-3 font-bold text-gray-900">
                                Show most-active supporters
                            </span>
                        </label>
                    </div>

                    {isEditing && (
                        <div className="pt-4">
                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                Status
                            </label>
                            <select
                                className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white appearance-none"
                                value={data.status}
                                onChange={(e) => setData("status", e.target.value)}
                            >
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="expired">Expired</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    )}

                    <div className="modal-action flex justify-center space-x-4 mt-8">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 px-8 py-3 border-2 border-black rounded-full font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                        >
                            {processing ? "Saving..." : "Save Piggy Pot"}
                        </button>
                    </div>
                </form>
            </div>
        </Popup>
    );
}
