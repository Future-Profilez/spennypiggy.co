import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import Popup from "@/Components/Popup";
import {
    itemErrorClass,
    itemFieldClass,
    itemLabelClass,
} from "@/Components/ItemForm/ItemFormKit";
import useDirtyGuard from "@/lib/useDirtyGuard";
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

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        clearErrors,
        setError,
    } = useForm(defaultValues);

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

    // Nine fields in one scroll: Esc or a backdrop tap must not throw them
    // away silently. Returning false from onHide vetoes the dismissal.
    const confirmDiscard = useDirtyGuard(show, data);

    const handleClose = () => {
        reset();
        clearErrors();
        onClose();
    };

    const requestClose = () => {
        if (!confirmDiscard()) return false;
        handleClose();
        return true;
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
            errorAlert(
                "Please upload the content file the supporter receives.",
            );
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
                    // successAlert(isEditing ? "Piggy Pot updated successfully!" : "Piggy Pot created successfully!",);
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
        // ⚠️ This is a SECOND Piggy Pot form. `Pages/PiggyPots/Index.jsx` has its
        // own on `ItemFormShell`; this one is what the dashboard opens, so both
        // have to look like the same product. Full page for the same reason as
        // the post composer and the item shell — creating something to sell is
        // not a task for a 576px box.
        <Popup
            title={pot ? "Edit content goal" : "New content goal"}
            dismissable
            size="lg"
            classes="hidden"
            action={show}
            onHide={requestClose}
        >
            {/* 🚨 NO HEADER BAR AND NO PINNED SUBMIT. This panel drew its own
                black bar carrying a title, a subtitle and a second copy of the
                Create button — the exact chrome removed from `Sheet` and
                `Popup` on 12 Sep 2026 — so the Piggy Pot form opened from the
                dashboard looked like a different product from the one opened
                on /piggy-pots, which is the SAME FORM. The panel supplies the
                ground, the scroll and the one close control; this file supplies
                the words and the fields. The submit at the foot of the form is
                now the only one. */}
            <div>
                <h3 className="font-gulfs text-[32px] uppercase leading-[1.05] text-black md:text-[46px]">
                    {isEditing ? "Edit Piggy Pot" : "Create Piggy Pot"}
                </h3>
                <p className="mt-3 text-base font-bold leading-[1.55] text-black/70 md:text-lg">
                    Sell content towards a visible goal.
                </p>

                {/* 🚨 Frameless on a phone — see the same note in
                    `ItemFormShell`. The panel is already the whole screen, so a
                    card around the form is a second frame on the same content
                    and costs 22px a side. It returns at `sm`. */}
                <div className="mt-7 rounded-box border-2 border-black bg-white p-5 sm:p-6 max-sm:!rounded-none max-sm:!border-0 max-sm:!bg-transparent max-sm:!p-0">

                <form id="piggy-pot-form" onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className={itemLabelClass}>
                            Content Title*
                        </label>
                        <input
                            type="text"
                            className={itemFieldClass}
                            placeholder="e.g. Exclusive photo set"
                            value={data.title}
                            onChange={(e) => setData("title", e.target.value)}
                            required
                        />
                        {errors.title && (
                            <div className={itemErrorClass}>
                                {errors.title}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className={itemLabelClass}>
                            Description
                        </label>
                        <textarea
                            className={itemFieldClass}
                            rows="3"
                            placeholder="Tell backers what they unlock by chipping in..."
                            value={data.description}
                            onChange={(e) =>
                                setData("description", e.target.value)
                            }
                        />
                        {errors.description && (
                            <div className={itemErrorClass}>
                                {errors.description}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className={itemLabelClass}>
                                Progress Goal* ({data.currency}) — optional
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="1"
                                className={itemFieldClass}
                                placeholder="e.g. 500"
                                value={data.target_amount}
                                onChange={(e) =>
                                    setData("target_amount", e.target.value)
                                }
                                required
                            />
                            {errors.target_amount && (
                                <div className={itemErrorClass}>
                                    {errors.target_amount}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className={itemLabelClass}>
                                Deadline (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                className={itemFieldClass}
                                value={data.deadline}
                                onChange={(e) =>
                                    setData("deadline", e.target.value)
                                }
                            />
                            {errors.deadline && (
                                <div className={itemErrorClass}>
                                    {errors.deadline}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <label className={itemLabelClass}>
                            Cover Image (Optional)
                        </label>
                        <p className="text-xs text-black/60 mb-3">
                            Upload a cover image to make your pot stand out.
                        </p>
                        <div className="border-2 border-black rounded-box p-1 bg-gray-50 border-dashed hover:border-pink-500 transition-colors">
                            {data.cover_media && (
                                <div className="mb-3 bg-white border-2 border-black rounded-box-sm overflow-hidden relative group">
                                    <img
                                        src={data.cover_media}
                                        className="w-full h-[150px] object-cover"
                                        alt="Cover Preview"
                                    />
                                    {/* Always visible on touch — a hover-only overlay leaves a
                                        phone with no way to remove the cover at all. */}
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setData("cover_media", "")
                                            }
                                            className="bg-white text-red-600 font-bold min-h-[44px] px-4 py-2 border-2 border-black rounded-full hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
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
                                            file?.url ||
                                                file?.cdnUrl ||
                                                file?.originalUrl,
                                        )
                                    }
                                    options={st.avatar}
                                />
                            </div>
                        </div>
                        {errors.cover_media && (
                            <div className={itemErrorClass}>
                                {errors.cover_media}
                            </div>
                        )}
                    </div>

                    <div className="pt-2 border-t-2 border-gray-200 mt-6">
                        <label className={itemLabelClass}>
                            Content the supporter receives
                        </label>
                        <p className="text-xs text-black/60 mb-3">
                            Supporters automatically unlock this content after
                            they purchase.
                        </p>
                        <div className="mb-4">
                            <label className={itemLabelClass}>
                                Content Description
                            </label>
                            <textarea
                                className={itemFieldClass}
                                rows="2"
                                placeholder="Describe the exclusive content they will get..."
                                value={data.content_description}
                                onChange={(e) =>
                                    setData(
                                        "content_description",
                                        e.target.value,
                                    )
                                }
                            />
                        </div>
                        <span className={itemLabelClass}>Upload content file *</span>
                        <div className="border-2 border-black rounded-box p-1 bg-gray-50 border-dashed hover:border-pink-500 transition-colors">
                            {data.content_file && (
                                <div className="mb-3 p-3 bg-white border-2 border-black rounded-box-sm text-sm font-bold flex justify-between items-center">
                                    <span className="truncate">
                                        File Uploaded!
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setData("content_file", "")
                                        }
                                        className="min-h-[44px] text-red-600 hover:text-red-700 text-xs px-3 py-1 border border-red-200 rounded-box-sm transition-colors duration-200"
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
                                            file?.uuid ||
                                                file?.url ||
                                                file?.cdnUrl ||
                                                "",
                                        )
                                    }
                                    options={st.wishlistcontent}
                                />
                            </div>
                        </div>
                        {errors.content_file && (
                            <div className={itemErrorClass}>
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
                                    onChange={(e) =>
                                        setData("is_pinned", e.target.checked)
                                    }
                                />
                                <div
                                    className={`block w-14 h-8 rounded-full border-2 border-black transition-colors ${
                                        data.is_pinned
                                            ? "bg-[#A2E4B8]"
                                            : "bg-gray-300"
                                    }`}
                                ></div>
                                <div
                                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full border-2 border-black transition-transform ${
                                        data.is_pinned
                                            ? "transform translate-x-6"
                                            : ""
                                    }`}
                                ></div>
                            </div>
                            <span className="ml-3 font-bold text-black">
                                Pin to profile (Featured Goal)
                            </span>
                        </label>

                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={data.enable_leaderboard}
                                    onChange={(e) =>
                                        setData(
                                            "enable_leaderboard",
                                            e.target.checked,
                                        )
                                    }
                                />
                                <div
                                    className={`block w-14 h-8 rounded-full border-2 border-black transition-colors ${
                                        data.enable_leaderboard
                                            ? "bg-[#A2E4B8]"
                                            : "bg-gray-300"
                                    }`}
                                ></div>
                                <div
                                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full border-2 border-black transition-transform ${
                                        data.enable_leaderboard
                                            ? "transform translate-x-6"
                                            : ""
                                    }`}
                                ></div>
                            </div>
                            <span className="ml-3 font-bold text-black">
                                Show most-active supporters
                            </span>
                        </label>
                    </div>

                    {isEditing && (
                        <div className="pt-4">
                            <label className={itemLabelClass}>
                                Status
                            </label>
                            <select
                                className={`${itemFieldClass} appearance-none`}
                                value={data.status}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
                            >
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="expired">Expired</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                    )}

                    <div className="modal-action mt-8">
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex min-h-[52px] w-full items-center justify-center rounded-box-sm border-2 border-black bg-[#FF007F] px-8 text-sm font-black uppercase tracking-[0.14em] text-black transition-all disabled:opacity-50"
                        >
                            {processing ? "Saving…" : isEditing ? "Save changes" : "Create pot"}
                        </button>
                    </div>
                </form>
                </div>
            </div>
        </Popup>
    );
}
