import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";
import Popup from "@/Components/Popup";
import { router, usePage } from "@inertiajs/react";
import axios from "axios";
import { useEffect, useState, useCallback, useMemo } from "react";
import clsx from "clsx";
import {
    FaCheck,
    FaExclamationTriangle,
    FaTimes,
    FaExternalLinkAlt,
    FaCopy,
    FaInfoCircle,
} from "react-icons/fa";

import {
    getPrimaryPlatforms,
    getPlatform,
    SOCIAL_PLATFORMS,
} from "@/utils/socialPlatforms";

import {
    validatePlatformValue,
    validateAllPlatforms,
    getPreviewUrl,
    extractHandleFromUrl,
    getCharacterInfo,
    debounce,
} from "@/utils/socialValidation";

export default function AddSocial({
    removetext,
    openSocial,
    classes,
    sLinks,
    links,
    type,
    buttontext,
    redirect_url,
}) {
    const { auth } = usePage().props;
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const [close, setClose] = useState();
    const [loading, setLoading] = useState(false);
    const [showSecondaryPlatforms, setShowSecondaryPlatforms] = useState(false);

    // Initialize form data with all supported platforms
    const initialData = useMemo(() => {
        const data = {};
        const sourceLinks = sLinks || links || {};
        Object.keys(SOCIAL_PLATFORMS).forEach((platformId) => {
            const raw = sourceLinks?.[platformId] || "";
            const platform = getPlatform(platformId);
            // If a handle-type field came in as a full URL, normalize to handle
            if (platform?.type === "handle" && raw && raw.startsWith("http")) {
                data[platformId] = extractHandleFromUrl(platformId, raw);
            } else {
                data[platformId] = raw;
            }
        });
        return data;
    }, [sLinks, links]);

    const [data, setData] = useState(initialData);

    /*
     * 🚨 HIDDEN BY DEFAULT. `public_platforms` is a list of platform keys the creator
     * has chosen to SHOW; a missing or empty value means nothing is public, which is
     * what every row that existed before 6 Sep 2026 reads as. Never treat an absent
     * value as "show everything" — that is the behaviour this control exists to end.
     *
     * ⚠️ Seeded from the same row the handles are, so re-opening the sheet shows the
     * creator what is actually live rather than a fresh set of switches.
     */
    const [publicPlatforms, setPublicPlatforms] = useState(() => {
        const source = sLinks || links || {};
        const stored = source?.public_platforms;
        if (Array.isArray(stored))
            return stored.filter((k) => typeof k === "string");
        if (typeof stored === "string") {
            try {
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed)
                    ? parsed.filter((k) => typeof k === "string")
                    : [];
            } catch {
                return [];
            }
        }
        return [];
    });

    const isPublic = (platformId) => publicPlatforms.includes(platformId);

    const togglePublic = (platformId) => {
        setIsDirty(true);
        setPublicPlatforms((prev) =>
            prev.includes(platformId)
                ? prev.filter((k) => k !== platformId)
                : [...prev, platformId],
        );
    };
    const [validationResults, setValidationResults] = useState({});
    const [displayValues, setDisplayValues] = useState({});
    const [isDirty, setIsDirty] = useState(false);

    // Debounced validation
    const debouncedValidate = useCallback(
        debounce((platformId, value) => {
            const result = validatePlatformValue(platformId, value);
            setValidationResults((prev) => ({
                ...prev,
                [platformId]: result,
            }));
        }, 250),
        [],
    );

    useEffect(() => {
        if (openSocial === "open") {
            setClose(true);
        }
    }, [openSocial]);

    // Initialize display values for existing data
    useEffect(() => {
        const newDisplayValues = {};
        Object.entries(data).forEach(([platformId, value]) => {
            if (value) {
                const platform = getPlatform(platformId);
                if (platform?.type === "handle" && value.startsWith("http")) {
                    // Extract handle from URL for display
                    newDisplayValues[platformId] = extractHandleFromUrl(
                        platformId,
                        value,
                    );
                } else {
                    newDisplayValues[platformId] = value;
                }
            } else {
                newDisplayValues[platformId] = "";
            }
        });
        setDisplayValues(newDisplayValues);
    }, [data]);

    const handleInput = (e) => {
        const { name: platformId, value } = e.target;

        setIsDirty(true); // ✅ mark form as changed

        setDisplayValues((prev) => ({ ...prev, [platformId]: value }));
        setData((prev) => ({ ...prev, [platformId]: value }));
        debouncedValidate(platformId, value);
    };

    const handleBlur = (platformId) => {
        const value = displayValues[platformId];
        const result = validatePlatformValue(platformId, value);
        setValidationResults((prev) => ({ ...prev, [platformId]: result }));

        // Store canonical form for submission
        // For URL-type platforms, normalize and store the canonical URL.
        // For handle-type platforms, keep the handle in state; we'll convert to URL at submit time.
        const platform = getPlatform(platformId);
        if (result.canonical && platform?.type === "url") {
            setData((prev) => ({ ...prev, [platformId]: result.canonical }));
        } else {
            setData((prev) => ({ ...prev, [platformId]: value }));
        }
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            successAlert("Copied to clipboard!");
        } catch (err) {
            errorAlert("Failed to copy to clipboard");
        }
    };

    const hasAtLeastOneValue = useMemo(() => {
        return Object.values(data).some(
            (value) => value && value.trim() !== "",
        );
    }, [data]);

    // Form validation
    const formValidation = useMemo(() => {
        return validateAllPlatforms(data);
    }, [data]);

    // Keep field-level validation UI in sync with full-form validation
    useEffect(() => {
        if (formValidation?.results) {
            setValidationResults(formValidation.results);
        }
    }, [formValidation]);

    const createSocial = (e) => {
        e.preventDefault();

        // Fields are optional; users can submit empty values.
        // ❌ No social links provided
        if (!hasAtLeastOneValue) {
            errorAlert("Please add at least one social media link.");
            return;
        }

        // ❌ Invalid social links present
        if (formValidation.hasErrors) {
            errorAlert("Please fix the invalid social links above.");
            return;
        }

        setLoading(true);

        // Prepare normalized data for submission
        const submissionData = {};

        Object.entries(data).forEach(([platformId, value]) => {
            if (value && value.trim() !== "") {
                const result = validatePlatformValue(platformId, value);
                submissionData[platformId] = result.canonical || value;
            } else {
                // 🔥 IMPORTANT: explicitly send null to remove value in DB
                submissionData[platformId] = null;
            }
        });

        axios
            .post(route("save_social_links"), {
                ...submissionData,
                // ⚠️ Narrowed AGAIN on the server against the handles this save carries
                // (`SocialVisibility::forStorage`) — clearing a handle must also clear
                // its visibility, or re-adding that platform months later comes back
                // already public on the strength of an old decision.
                public_platforms: publicPlatforms.filter(
                    (key) =>
                        submissionData[key] &&
                        String(submissionData[key]).trim() !== "",
                ),
                redirect_url,
            })
            .then((res) => {
                setLoading(false);
                if (res.data.status) {
                    successAlert(
                        res.data.message ||
                            "Social links updated successfully!",
                    );

                    setIsDirty(false); // ✅ reset dirty state

                    setClose(false);
                    router.visit(route("user.show", auth?.user?.username), {
                        preserveScroll: true,
                    });
                    setTimeout(() => {
                        setClose();
                    }, 1000);
                } else {
                    errorAlert(res.data.msg);
                }
            })
            .catch((err) => {
                setLoading(false);
                errorsHandling(err);
            });
    };

    const renderPlatformField = (platform) => {
        const value = displayValues[platform.id] || "";
        const validation = validationResults[platform.id] || {
            status: "empty",
        };
        const charInfo = getCharacterInfo(platform.id, value);
        const previewUrl = getPreviewUrl(platform.id, value);

        const Icon = platform.icon;

        return (
            <li key={platform.id} className="mb-6 border-t pt-8">
                <div className="flex justify-between">
                    <label
                        htmlFor={platform.id}
                        className={clsx(
                            "block text-sm font-medium mb-2 flex items-center",
                            platform.color,
                        )}
                    >
                        <Icon className="mr-2 text-lg" />
                        {platform.label}
                        {platform.type === "handle" && (
                            <span className="ml-2 text-xs text-black/60 bg-gray-100 px-2 py-1 rounded">
                                handle
                            </span>
                        )}
                    </label>
                    {platform.type === "handle" && charInfo && value && (
                        <div className="mt-0 text-xs text-right">
                            <span
                                className={clsx({
                                    "text-black/60":
                                        !charInfo.showWarning &&
                                        !charInfo.isOverLimit,
                                    "text-yellow-600": charInfo.showWarning,
                                    "text-red-600": charInfo.isOverLimit,
                                })}
                            >
                                {charInfo.current}/{charInfo.max}
                            </span>
                        </div>
                    )}
                </div>
                <div className="relative">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon className={clsx("text-lg", platform.color)} />
                        </div>
                        <input
                            id={platform.id}
                            name={platform.id}
                            type="text"
                            value={value}
                            placeholder={platform.placeholder}
                            maxLength={platform.maxLength}
                            className={clsx(
                                "block w-full pl-12 pr-12 py-3 rounded-box   text-sm transition-all duration-200",
                                "focus:outline-none focus:ring-2 focus:ring-opacity-50",
                                {
                                    "border-2 border-gray-300 focus:border-gray-400 focus:ring-gray-200":
                                        validation.status === "empty",
                                    "border-2 border-green-500 bg-green-50 focus:ring-green-200":
                                        validation.status === "valid",
                                    "border-2 border-red-500 bg-red-50 focus:ring-red-200":
                                        validation.status === "invalid",
                                },
                            )}
                            onChange={handleInput}
                            onBlur={() => handleBlur(platform.id)}
                            aria-invalid={validation.status === "invalid"}
                            aria-describedby={`${platform.id}-hint ${platform.id}-error`}
                        />

                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                            {validation.status === "valid" && (
                                <FaCheck className="text-green-500" />
                            )}
                            {validation.status === "invalid" && (
                                <FaTimes className="text-red-500" />
                            )}
                        </div>
                    </div>

                    {/* Preview URL for handle platforms */}
                    {previewUrl && validation.status === "valid" && (
                        <div className="mt-2 flex items-center text-sm text-blue-600">
                            <FaExternalLinkAlt className="mr-1 text-xs" />
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline truncate "
                            >
                                {previewUrl}
                            </a>
                            <button
                                type="button"
                                onClick={() => copyToClipboard(previewUrl)}
                                className="ml-2 grid h-11 w-11 place-items-center hover:bg-blue-100 rounded-box-sm"
                                title="Copy URL"
                            >
                                <FaCopy className="text-xs" />
                            </button>
                        </div>
                    )}

                    {/* Hint text */}

                    {/* Error message */}
                    {validation.status === "invalid" && validation.message && (
                        <p
                            id={`${platform.id}-error`}
                            className="mt-1 text-sm text-red-600 flex items-center"
                        >
                            <FaExclamationTriangle className="mr-1" />
                            {validation.message}
                        </p>
                    )}
                </div>
                <p
                    id={`${platform.id}-hint`}
                    className="mt-1 mb-4 text-xs text-black/60"
                >
                    <FaInfoCircle className="inline mr-1" />
                    {platform.hint}
                </p>

                {/*
                    Who can see this handle. Rendered only once there is something to
                    show — a switch above an empty field asks the creator to decide
                    about a handle they have not given us.

                    ⚠️ It is a plain button, not a checkbox: the state IS the label, so
                    there is nothing for a separate control to be labelled by.
                */}
                {value && value.trim() !== "" && (
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-box-sm border-black bg-[#FFF6EC] px-3 py-2">
                        <span className="text-xs font-semibold text-black/70">
                            {isPublic(platform.id)
                                ? "Shown on your profile"
                                : "Private — only you and our review team"}
                        </span>
                        <button
                            type="button"
                            onClick={() => togglePublic(platform.id)}
                            aria-pressed={isPublic(platform.id)}
                            className={clsx(
                                "min-h-[44px] rounded-box-sm border-black px-4 text-xs font-bold uppercase transition-colors duration-200",
                                isPublic(platform.id)
                                    ? "bg-[#05EFB8] text-black hover:brightness-110 active:brightness-95"
                                    : "bg-white text-black hover:bg-[#F4F4F5]",
                            )}
                        >
                            {isPublic(platform.id) ? "Public" : "Hidden"}
                        </button>
                    </div>
                )}
            </li>
        );
    };

    // The three platforms a creator may verify against — Twitter, Instagram,
    // TikTok (client decision, 11 Aug 2026). The registry still holds every
    // platform so an existing creator's approved handle keeps rendering on
    // their profile; only submission is narrowed.
    //
    // `getSecondaryPlatforms()` and its `hasSecondaryData` flag were computed
    // here and rendered nowhere — dead since before the narrowing, and now
    // empty by definition.
    const primaryPlatforms = getPrimaryPlatforms();

    return (
        <Popup
            action={close}
            space="4"
            modalclass="pinkmodal full"
            size="md"
            classes={classes}
            text={
                buttontext ? buttontext : removetext ? "" : "Add Social Links"
            }
        >
            <div className="editprofileModalInner p-3  ">
                <div className="swishinfo">
                    <h2 className="pb-4 font-GillSans text-xl uppercase flex items-center">
                        <FaInfoCircle className="mr-2 text-blue-500" />
                        Social Media Links
                    </h2>

                    {/* Information Banner */}
                    <div
                        className={clsx(
                            // ⚠️ A full 2px frame, not a thick coloured rail down one side. A
                            // side-tab on a callout is the banned device — depth here comes
                            // from border weight and colour all the way round.
                            // (Do not write the class name in this comment: the design
                            // detector does not blank comments before matching.)
                            "mb-6 p-4 rounded-box-sm border-2 flex items-start",
                            {
                                "bg-yellow-50 border-yellow-500":
                                    !formValidation.hasValidFields,
                                "bg-green-50 border-green-500":
                                    formValidation.hasValidFields,
                            },
                        )}
                    >
                        <div
                            className={clsx("mr-3 mt-1", {
                                "text-yellow-500":
                                    !formValidation.hasValidFields,
                                "text-green-500": formValidation.hasValidFields,
                            })}
                        >
                            {formValidation.hasValidFields ? (
                                <FaCheck />
                            ) : (
                                <FaInfoCircle />
                            )}
                        </div>
                        <div className="flex-1">
                            <p
                                className={clsx("text-sm font-medium", {
                                    "text-yellow-800":
                                        !formValidation.hasValidFields,
                                    "text-green-800":
                                        formValidation.hasValidFields,
                                })}
                            >
                                {formValidation.hasValidFields
                                    ? "Your social links look good."
                                    : "One social account needed"}
                            </p>
                            <p
                                className={clsx("text-sm mt-1", {
                                    "text-yellow-700":
                                        !formValidation.hasValidFields,
                                    "text-green-700":
                                        formValidation.hasValidFields,
                                })}
                            >
                                {formValidation.hasValidFields
                                    ? "We use these to check you are really you. Each one stays private on your page unless you switch it to Public below."
                                    : "Add at least one so our team can verify you. Handles stay private on your page unless you choose to show them."}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={createSocial} className="space-y-0">
                        {/* Primary Platforms */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                                Main Social Platforms
                            </h3>
                            <ul className="space-y-0">
                                {primaryPlatforms.map(renderPlatformField)}
                            </ul>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-6 border-t">
                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    !isDirty ||
                                    !hasAtLeastOneValue ||
                                    formValidation.hasErrors
                                }
                                className={clsx(
                                    "w-full mb-4 py-3 rounded-full font-bold text-white transition-all duration-200 flex items-center justify-center gap-2",
                                    {
                                        "bg-pink-600 hover:bg-pink-700 ":
                                            isDirty &&
                                            hasAtLeastOneValue &&
                                            !formValidation.hasErrors &&
                                            !loading,

                                        "bg-gray-300 cursor-not-allowed":
                                            loading ||
                                            !isDirty ||
                                            !hasAtLeastOneValue ||
                                            formValidation.hasErrors,
                                    },
                                )}
                            >
                                {loading && (
                                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                )}
                                <span>
                                    {loading
                                        ? "Saving Links..."
                                        : "Save Social Links"}
                                </span>
                            </button>

                            {!formValidation.isFormValid &&
                                formValidation.hasErrors && (
                                    <p className="text-red-600 text-sm mt-2 text-center">
                                        Please fix the invalid links above
                                        before saving.
                                    </p>
                                )}
                            {/* Optional fields: No need to show a blocker when none are filled */}
                        </div>
                    </form>
                </div>
            </div>
        </Popup>
    );
}
