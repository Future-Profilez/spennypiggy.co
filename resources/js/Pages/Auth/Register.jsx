import { useCallback, useEffect, useRef, useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import { useAlerts } from "@/Components/Alerts";
import { Head, Link, useForm, usePage } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import axios from "axios";
import { handleIpRedirection } from "../../includes/useIpRedirection";
import Countries from "../../includes/Countries";
import Popup from "@/Components/Popup";

export default function Register(props) {
    const CheckCircleIcon = () => {
        return (
            <>
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 inline-block"
                >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                        id="SVGRepo_tracerCarrier"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                            opacity="0.1"
                            d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            fill="currentColor"
                        ></path>{" "}
                        <path
                            d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            stroke="currentColor"
                            strokeWidth="2"
                        ></path>{" "}
                        <path
                            d="M9 12L10.6828 13.6828V13.6828C10.858 13.858 11.142 13.858 11.3172 13.6828V13.6828L15 10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        ></path>{" "}
                    </g>
                </svg>
            </>
        );
    };
    const turnstileContainerRef = useRef(null);
    const [turnstileContainerEl, setTurnstileContainerEl] = useState(null);
    const turnstileWidgetIdRef = useRef(null);
    const checkRef = useRef();
    const gifterref = useRef();
    const addressCheck = useRef();
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const errorAlertRef = useRef(errorAlert);
    const lowerLetter = /[a-z]/;
    const capitalLetter = /[A-Z]/;
    const numberLetter = /[0-9]/;
    const specialLetter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/]/;

    const [passwordCriteria, setPasswordCriteria] = useState({
        lower: false,
        upper: false,
        number: false,
        special: false,
        length: false,
    });

    const [mypass, setmypass] = useState("");

    useEffect(() => {
        errorAlertRef.current = errorAlert;
    }, [errorAlert]);

    const creatortypes = [
        { label: "Artist", value: "Artist" },
        { label: "Activist", value: "Activist" },
        { label: "DJ", value: "DJ" },
        { label: "Beauty Creator", value: "Beauty Creator" },
        { label: "Dancer", value: "Dancer" },
        { label: "Developer", value: "Developer" },
        { label: "Cosplay Creator", value: "Cosplay Creator" },
        { label: "Education Creator", value: "Education Creator" },
        { label: "Fashionista", value: "Fashionista" },
        { label: "Gamer", value: "Gamer" },
        { label: "Gym Bunny", value: "Gym Bunny" },
        { label: "Musician", value: "Musician" },
        { label: "Model", value: "Model" },
        { label: "Podcaster", value: "Podcaster" },
        { label: "Streamer", value: "Streamer" },
        { label: "Video Creator", value: "Video Creator" },
        { label: "Writer", value: "Writer" },
    ];

    const { turnstileSiteKey } = usePage().props;
    const { url } = usePage(); // Access the current URL

    const params = new URLSearchParams(url.split("?")[1]); // Extract the query string
    const referralFromUrl = params.get("ref");
    const type = params.get("type"); // Get the 'type' parameter
    const { data, setData, post, get, processing, errors, reset } = useForm({
        name: "",
        username: "",
        email: "",
        password: "",
        gender: "he",
        password_confirmation: "",
        promo: "",
        role: type && type === "creator" ? 1 : 0,
        creator_category: "",
        cf_turnstile_response: "",
    });

    const [referralMessage, setReferralMessage] = useState("");
    const [referralType, setReferralType] = useState(""); // success | error
    const [codevalid, setCodeValid] = useState(false);
    const [promoInputValue, setPromoInputValue] = useState("");
    const [role, setRole] = useState(type && type === "creator" ? 1 : 0);
    const hasReferralFromUrl = role === 1 && !!referralFromUrl;

    useEffect(() => {
        if (role === 1 && referralFromUrl) {
            setPromoInputValue(referralFromUrl);
            setData("promo", referralFromUrl);
        }
        if (role === 1 && !referralFromUrl) {
            setPromoInputValue("");
            setData("promo", "");
        }
    }, [role, referralFromUrl]);

    const [step, setStep] = useState(type && type === "creator" ? 1 : 0);
    const handleBecomeCreator = async (e) => {
        setData("role", e);
        setRole(e);
        if (e == 1) {
            // await handleIpRedirection(ziggy);
            setStep(1);
        } else {
            setStep(3);
        }
    };

    const [address, setAddressData] = useState({
        country_code: "",
        country: "",
        state: "",
        city: "",
        postal_code: "",
        street_address: "",
    });

    const getCountry = (e) => {
        const c = JSON.parse(e);
        setAddressData({
            ...address,
            country: c.label,
            country_code: c.code,
        });
        markFieldTouched("country");
        validateRegistration({ country: c.label });
    };

    const handleAddressInput = (e) => {
        setAddressData({
            ...address,
            [e.target.name]: e.target.value,
        });
    };

    const [liveErrors, setLiveErrors] = useState({});
    const [showFieldErrors, setShowFieldErrors] = useState(false);
    const [touchedFields, setTouchedFields] = useState({});
    const [fieldValidity, setFieldValidity] = useState({});
    const validationTimersRef = useRef({});
    const [showPassword, setShowPassword] = useState(false);

    const validateRegistration = useCallback(
        async (payload, { toastOnError = false } = {}) => {
            const fields = Object.keys(payload || {});
            if (fields.length === 0) return;

            try {
                await axios.post(route("register.validate"), payload);
                setLiveErrors((prev) => {
                    const next = { ...prev };
                    fields.forEach((field) => {
                        delete next[field];
                    });
                    return next;
                });
                setFieldValidity((prev) => {
                    const next = { ...prev };
                    fields.forEach((field) => {
                        next[field] = true;
                    });
                    return next;
                });
            } catch (err) {
                console.error("Validation error:", err);
                const responseErrors = err?.response?.data?.errors || {};
                setLiveErrors((prev) => {
                    const next = { ...prev };
                    fields.forEach((field) => {
                        const msg = responseErrors?.[field]?.[0];
                        if (msg) {
                            next[field] = msg;
                        } else {
                            delete next[field];
                        }
                    });
                    return next;
                });
                setFieldValidity((prev) => {
                    const next = { ...prev };
                    fields.forEach((field) => {
                        const msg = responseErrors?.[field]?.[0];
                        if (err?.response?.status === 422) {
                            next[field] = msg ? false : true;
                        } else {
                            // If not a validation error (e.g. 500 or network), mark as invalid
                            next[field] = false;
                        }
                    });
                    return next;
                });

                if (toastOnError) {
                    const firstMsg = Object.values(responseErrors)
                        .flat()
                        .filter(Boolean)[0];
                    if (firstMsg) {
                        errorAlertRef.current?.(firstMsg);
                    }
                }
            }
        },
        [],
    );

    const getFieldError = useCallback(
        (field) => {
            const alwaysShowLiveErrorFields = new Set(["username", "email"]);
            const liveMsg = liveErrors?.[field];
            if (alwaysShowLiveErrorFields.has(field) && liveMsg) {
                return liveMsg;
            }

            if (field === "password_confirmation") {
                const isTouched = !!touchedFields?.[field];
                const canShow = showFieldErrors || isTouched;
                if (!canShow) return "";

                if (
                    data?.password_confirmation &&
                    data?.password &&
                    data.password_confirmation !== data.password
                ) {
                    return "Passwords do not match.";
                }
            }

            const isTouched = !!touchedFields?.[field];
            const canShow = showFieldErrors || isTouched;
            if (!canShow) return "";

            if (liveMsg) return liveMsg;

            const serverMsg = errors?.[field];
            if (Array.isArray(serverMsg)) return serverMsg[0] || "";
            return serverMsg || "";
        },
        [errors, liveErrors, showFieldErrors, touchedFields],
    );

    const markFieldTouched = useCallback((field) => {
        setTouchedFields((prev) => ({ ...prev, [field]: true }));
    }, []);

    const getFieldValue = useCallback(
        (field) => {
            const addressFields = new Set([
                "country",
                "street_address",
                "state",
                "city",
                "postal_code",
            ]);
            if (addressFields.has(field)) {
                return address?.[field] || "";
            }
            return data?.[field] || "";
        },
        [address, data],
    );

    const getFieldStatus = useCallback(
        (field) => {
            if (field === "password_confirmation") {
                if (!data?.password_confirmation) return "idle";
                if (
                    data?.password &&
                    data.password_confirmation !== data.password
                ) {
                    return "error";
                }
                if (
                    data?.password &&
                    data.password_confirmation === data.password
                ) {
                    return "success";
                }
                return "idle";
            }

            const hasLiveError = !!liveErrors?.[field];
            const hasServerError = showFieldErrors && !!errors?.[field];
            const validity = fieldValidity?.[field];

            if (hasLiveError || hasServerError || validity === false) {
                return "error";
            }
            if (validity === true) {
                return "success";
            }
            if (field === "name" && !!data?.name?.trim()) {
                return "success";
            }
            return "idle";
        },
        [data?.name, errors, fieldValidity, liveErrors, showFieldErrors],
    );

    const getFieldClassName = useCallback(
        (
            field,
            baseClassName = "mt-1 block w-full bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent rounded-[30px]  p-3",
        ) => {
            const status = getFieldStatus(field);
            const value = getFieldValue(field);
            const padded = `${baseClassName} pr-10`;

            if (status === "idle") return baseClassName;
            if (!String(value || "").trim()) return baseClassName;
            return padded;
        },
        [getFieldStatus, getFieldValue],
    );

    const FieldStatusIcon = ({ status }) => {
        if (status === "success") {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-green-600"
                >
                    <path d="M20 6 9 17l-5-5" />
                </svg>
            );
        }
        if (status === "error") {
            return (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-red-600"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v5" />
                    <path d="M12 16h.01" />
                </svg>
            );
        }
        return null;
    };

    const renderFieldStatusIcon = useCallback(
        (field) => {
            const status = getFieldStatus(field);
            if (status === "idle") return null;

            const value = getFieldValue(field);
            if (!String(value || "").trim()) return null;

            return (
                <div className="absolute bg-white p-2 right-2 rounded-[30px]  top-1/2 -translate-y-1/2">
                    <FieldStatusIcon status={status} />
                </div>
            );
        },
        [getFieldStatus, getFieldValue],
    );

    useEffect(() => {
        if (validationTimersRef.current.username) {
            clearTimeout(validationTimersRef.current.username);
        }
        if (!data.username) {
            setLiveErrors((prev) => {
                const next = { ...prev };
                delete next.username;
                return next;
            });
            setFieldValidity((prev) => {
                const next = { ...prev };
                delete next.username;
                return next;
            });
            return;
        }

        // Clear existing errors/validity while typing (debounce behavior)
        setLiveErrors((prev) => {
            const next = { ...prev };
            delete next.username;
            return next;
        });
        setFieldValidity((prev) => {
            const next = { ...prev };
            delete next.username;
            return next;
        });

        validationTimersRef.current.username = setTimeout(() => {
            // Local validation based on backend rules
            let localError = null;
            if (data.username.length < 5) {
                localError = "The username must be at least 5 characters.";
            } else if (data.username.length > 20) {
                localError =
                    "The username must not be greater than 20 characters.";
            } else if (/[A-Z]/.test(data.username)) {
                localError = "The username must be lowercase.";
            } else if (/\s/.test(data.username)) {
                localError = "The username must not contain spaces.";
            } else if (/[^a-z0-9]/.test(data.username)) {
                localError =
                    "The username must only contain letters and numbers.";
            }

            if (localError) {
                setLiveErrors((prev) => ({ ...prev, username: localError }));
                setFieldValidity((prev) => ({ ...prev, username: false }));
                return;
            }

            validateRegistration({ username: data.username });
        }, 500);
        return () => {
            if (validationTimersRef.current.username) {
                clearTimeout(validationTimersRef.current.username);
            }
        };
    }, [data.username, validateRegistration]);

    useEffect(() => {
        if (validationTimersRef.current.email) {
            clearTimeout(validationTimersRef.current.email);
        }
        if (!data.email) {
            setLiveErrors((prev) => {
                const next = { ...prev };
                delete next.email;
                return next;
            });
            setFieldValidity((prev) => {
                const next = { ...prev };
                delete next.email;
                return next;
            });
            return;
        }

        validationTimersRef.current.email = setTimeout(() => {
            validateRegistration({ email: data.email });
        }, 600);
        return () => {
            if (validationTimersRef.current.email) {
                clearTimeout(validationTimersRef.current.email);
            }
        };
    }, [data.email, validateRegistration]);

    useEffect(() => {
        setFieldValidity((prev) => {
            const next = { ...prev };
            delete next.password;
            return next;
        });
    }, [data.password]);

    useEffect(() => {
        setReferralMessage("");
        setReferralType("");
        setCodeValid(false);
    }, [role]);

    useEffect(() => {
        if (Number(data.role) !== 0) {
            setLiveErrors((prev) => {
                const next = { ...prev };
                delete next.country;
                delete next.street_address;
                delete next.state;
                delete next.city;
                delete next.postal_code;
                return next;
            });
            setFieldValidity((prev) => {
                const next = { ...prev };
                delete next.country;
                delete next.street_address;
                delete next.state;
                delete next.city;
                delete next.postal_code;
                return next;
            });
            return;
        }

        if (validationTimersRef.current.address) {
            clearTimeout(validationTimersRef.current.address);
        }

        const payload = {};
        const fieldsToClear = [];

        const addressFields = [
            "country",
            "street_address",
            "state",
            "city",
            "postal_code",
        ];

        addressFields.forEach((field) => {
            const val = address?.[field];
            if (val) {
                payload[field] = val;
            } else {
                fieldsToClear.push(field);
            }
        });

        if (Object.keys(payload).length > 0) {
            setFieldValidity((prev) => {
                const next = { ...prev };
                Object.keys(payload).forEach((field) => {
                    delete next[field];
                });
                return next;
            });
        }

        if (fieldsToClear.length > 0) {
            setLiveErrors((prev) => {
                const next = { ...prev };
                fieldsToClear.forEach((field) => delete next[field]);
                return next;
            });
            setFieldValidity((prev) => {
                const next = { ...prev };
                fieldsToClear.forEach((field) => delete next[field]);
                return next;
            });
        }

        if (Object.keys(payload).length === 0) {
            return;
        }

        validationTimersRef.current.address = setTimeout(() => {
            validateRegistration(payload);
        }, 600);

        return () => {
            if (validationTimersRef.current.address) {
                clearTimeout(validationTimersRef.current.address);
            }
        };
    }, [
        data.role,
        address.country,
        address.street_address,
        address.state,
        address.city,
        address.postal_code,
        validateRegistration,
    ]);

    const [verified, setVerified] = useState(false);
    const onVerify = (token) => {
        if (token !== null || token !== "" || token !== undefined) {
            setData("cf_turnstile_response", token || "");
            setVerified(!!token);
            console.warn("Turnstile token VERIFIED");
        } else {
            console.warn("No Turnstile token VERIFIED");
        }
    };

    const bindTurnstileContainerRef = useCallback((el) => {
        turnstileContainerRef.current = el;
        setTurnstileContainerEl(el);
    }, []);

    const resetCaptcha = () => {
        setVerified(false);
        setData("cf_turnstile_response", "");
        if (turnstileWidgetIdRef.current !== null && window.turnstile) {
            window.turnstile.reset(turnstileWidgetIdRef.current);
        }
    };

    useEffect(() => {
        if (!turnstileSiteKey || !turnstileContainerEl) {
            return;
        }

        const renderWidget = () => {
            if (!window.turnstile || !turnstileContainerEl) {
                return;
            }

            if (turnstileWidgetIdRef.current !== null) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
                turnstileWidgetIdRef.current = null;
            }

            turnstileContainerEl.innerHTML = "";
            turnstileWidgetIdRef.current = window.turnstile.render(
                turnstileContainerEl,
                {
                    sitekey: turnstileSiteKey,
                    theme: "light",
                    size: "flexible",
                    callback: (token) => onVerify(token),
                    "expired-callback": () => onVerify(""),
                    "error-callback": () => onVerify(""),
                },
            );
        };

        if (window.turnstile) {
            renderWidget();
            return;
        }

        const existingScript = document.querySelector(
            'script[data-turnstile-script="true"]',
        );
        if (existingScript) {
            existingScript.addEventListener("load", renderWidget);
            setTimeout(renderWidget, 0);
            return () => {
                existingScript.removeEventListener("load", renderWidget);
            };
        }

        const script = document.createElement("script");
        script.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstileScript = "true";
        script.onload = renderWidget;
        document.head.appendChild(script);

        return () => {
            if (turnstileWidgetIdRef.current !== null && window.turnstile) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
                turnstileWidgetIdRef.current = null;
            }
        };
    }, [turnstileSiteKey, turnstileContainerEl]);

    const [profileTags, setProfileTags] = useState([]);
    const handleProfileTags = (e) => {
        const tags = e.target.value.split(",");
        const tagsArray = [...profileTags]; // Make a copy of the current state
        for (let i = 0; i < tags.length; i++) {
            const trimmedTag = tags[i].trim();
            const tagIndex = tagsArray.indexOf(trimmedTag);
            if (tagIndex !== -1) {
                tagsArray.splice(tagIndex, 1);
            } else {
                tagsArray.push(trimmedTag);
            }
        }
        setData("creator_category", JSON.stringify(tagsArray));
        setProfileTags(tagsArray);
    };

    const handleNext = () => {
        if (step === 2 && profileTags && profileTags.length < 1) {
            errorAlert("Please select at least one tag");
            return false;
        } else {
            setStep(step + 1);
        }
    };

    const [hasPop, setHasPop] = useState(false);
    const hasNotifiedRef = useRef();
    const accepted = () => {
        if (hasNotifiedRef && !hasNotifiedRef.current?.checked) {
            errorAlert("Please check and accept the terms and conditions.");
            hasNotifiedRef.current.focus();
            return false;
        } else {
            setHasPop(false);
            submit();
        }
    };

    const submit = (e) => {
        e && e.preventDefault();
        setShowFieldErrors(true);
        if (turnstileSiteKey && !verified) {
            errorAlert("Please verify you are not a robot.");
            return false;
        }

        const ignoredLiveErrorFields =
            Number(data.role) === 1
                ? ["country", "street_address", "state", "city", "postal_code"]
                : [];

        const liveErrorMessages = Object.entries(liveErrors || {})
            .filter(
                ([field, msg]) =>
                    !!msg && !ignoredLiveErrorFields.includes(field),
            )
            .map(([, msg]) => msg)
            .filter(Boolean);

        if (liveErrorMessages.length > 0) {
            [...new Set(liveErrorMessages)].forEach((msg) => errorAlert(msg));
            return false;
        }

        if (role !== 1 && address.country === "") {
            errorAlert("Country is required.");
            return false;
        }

        if (!checkRef.current.checked) {
            errorAlert("Please check accept terms & conditions checkbox");
            checkRef.current.focus();
            return false;
        }
        if (!verified) {
            errorAlert("Please verify you are not a robot.");
            return false;
        }
        if (
            role == 0 &&
            addressCheck &&
            addressCheck?.current?.checked == false
        ) {
            errorAlert("Please accept all terms and conditions.");
            // addressCheck && addressCheck?.current && addressCheck?.current?.focus();
            return false;
        }

        if (role == 0 && hasNotifiedRef && !hasNotifiedRef?.current?.checked) {
            setHasPop(true);
            setTimeout(() => {
                setHasPop();
            }, []);
            return false;
        }

        post(route("register", { ...data, ...address }), {
            preserveScroll: true,
            preserveState: true,
            onSuccess: (resp) => {
                if (resp.props.flash?.success) {
                    successAlert(
                        resp.props.flash?.success || "Signup successfully.",
                    );
                }
                if (resp.props.flash?.error) {
                    errorAlert(
                        resp.props.flash?.error || "Something went wrong.",
                    );
                }
            },
            onError: (err) => {
                Object.keys(err).map((key) => {
                    errorAlert(err[key]);
                });
                resetCaptcha();
            },
        });
    };

    const promoinput = useRef();
    const checkPromo = () => {
        // Fan can apply promo manually
        if (role !== 0) return;

        const p = promoInputValue;
        if (!p) return;

        axios
            .get(`/check-coupon-code/${p}`)
            .then((resp) => {
                if (resp.data.status) {
                    setCodeValid(true);
                    setData("promo", p);
                } else {
                    setCodeValid(false);
                    errorAlert(resp.data.msg);
                }
            })
            .catch(() => {
                setCodeValid(false);
            });
    };

    const removecode = () => {
        setCodeValid(false);
        setPromoInputValue(""); // ✅ clear input state
        setData("promo", "");

        // ✅ clear referral UI
        setReferralMessage("");
        setReferralType("");
    };

    const checkCreatorReferral = () => {
        if (role !== 1) return;

        const p = promoInputValue;
        if (!p) return;

        axios
            .get(`/check-referral-code/${p}`)
            .then((resp) => {
                if (resp.data.status) {
                    setCodeValid(true);
                    setData("promo", p);
                    setReferralMessage(resp.data.msg);
                    setReferralType("success");
                } else {
                    setCodeValid(false);
                    setReferralMessage(resp.data.msg);
                    setReferralType("error");
                    errorAlert(resp.data.msg);
                }
            })
            .catch(() => {
                setCodeValid(false);
                setReferralMessage(
                    "Unable to verify referral code. Please try again.",
                );
                setReferralType("error");
            });
    };

    const inputFieldRef = useRef(null);

    const handlePassHints = (e) => {
        const value = e.target.value;
        setmypass(value);
        setData("password", value);

        setPasswordCriteria({
            lower: !!value.match(lowerLetter),
            upper: !!value.match(capitalLetter),
            number: !!value.match(numberLetter),
            special: !!value.match(specialLetter),
            length: value.length > 7,
        });
    };

    return (
        <GuestLayout>
            <Head title="Create Account" />
            <div className="min-h-[92vh]  bg-black relative flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-purple-600/30 rounded-full mix-blend-screen filter blur-[70px] md:blur-[120px] animate-float"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-pink-600/30 rounded-full mix-blend-screen filter blur-[70px] md:blur-[120px] animate-float-delayed"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[128px] animate-pulse"></div>
                </div>

                <div className="relative z-1 w-full max-w-4xl">
                    <div className="text-center mb-10">
                        <h2 className="px-4 text-4xl md:text-5xl font-gulfs text-white uppercase tracking-wider mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Create{" "}
                            <span className="text-gradient-wishlist">
                                Account
                            </span>
                        </h2>
                        <p className="text-gray-400 space-x-1 text-lg font-medium">
                            Already registered ?
                            <Link
                                href={route("login")}
                                className="ml-1 text-pink-500 hover:text-pink-400 font-bold transition-all duration-300 hover:underline decoration-2 underline-offset-4"
                            >
                                Log In
                            </Link>
                        </p>
                    </div>

                    <div className="md:!bg-gray-900/40 md:!backdrop-blur-xl md:border md:border-white/10 md:rounded-[30px]   p-0 md:p-1 md:shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="hidden md:flex md:bg-black/20 md:border-b border-white/5 flex items-center !p-5 space-x-2 rounded-t-xl">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>

                        <div className="p-2 md:!p-8 md:bg-black/20 rounded-b-xl">
                            {step === 0 && (
                                <div className="animate-fade-in-up px-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div
                                            onClick={() =>
                                                handleBecomeCreator(1)
                                            }
                                            className={`cursor-pointer rounded-[30px]   p-6 border-2 transition-all duration-300 transform hover:-translate-y-2 group ${
                                                role == 1
                                                    ? "border-pink-500 bg-pink-500/10"
                                                    : "border-white/10 bg-white/5 hover:border-pink-500/50 hover:bg-white/10"
                                            }`}
                                        >
                                            <div className="text-center">
                                                <h3 className="text-2xl font-gulfs text-white mb-2 group-hover:text-pink-500 transition-colors uppercase">
                                                    I'm a Creator
                                                </h3>
                                                <p className="text-gray-400 text-sm">
                                                    I'd like to create a
                                                    wishlist
                                                </p>
                                            </div>
                                        </div>

                                        <div
                                            onClick={() =>
                                                handleBecomeCreator(0)
                                            }
                                            className={`cursor-pointer rounded-[30px]   p-6 border-2 transition-all duration-300 transform hover:-translate-y-2 group ${
                                                role == 0
                                                    ? "border-blue-500 bg-blue-500/10"
                                                    : "border-white/10 bg-white/5 hover:border-blue-500/50 hover:bg-white/10"
                                            }`}
                                        >
                                            <div className="text-center">
                                                <h3 className="text-2xl font-gulfs text-white mb-2 group-hover:text-blue-500 transition-colors uppercase">
                                                    I'm a Fan
                                                </h3>
                                                <p className="text-gray-400 text-sm">
                                                    I'm here to follow and
                                                    support creators
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-500 text-center text-sm mt-6 max-w-md mx-auto">
                                        You can support other creators with
                                        either of the account types and can
                                        change your account type anytime.
                                    </p>
                                </div>
                            )}

                            {step === 1 && (
                                <div className="animate-fade-in-up text-center px-4">
                                    <h3 className="text-2xl font-gulfs text-white mb-4 uppercase">
                                        Heads up, Babe! 🚨
                                    </h3>
                                    <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                                        Your social media link is how we verify
                                        you’re real — no bots, no fakes, no
                                        funny business. Make sure it’s an active
                                        profile with clear posts, or your
                                        application might be rejected.
                                    </p>
                                    <button
                                        onClick={handleNext}
                                        className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-anton uppercase tracking-widest text-normal py-[12px] px-8 rounded-[30px]  shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transform hover:-translate-y-1 transition-all duration-300   w-fit"
                                    >
                                        Got it – I’ll link my socials
                                    </button>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="animate-fade-in-up md:px-4">
                                    <p className="text-center text-2xl text-gray-300 mb-6">
                                        Choose from the following categories.
                                        This helps people find your profile. You
                                        can change these at any time.
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-2 md:gap-3  mb-8">
                                        {creatortypes.map((s, index) => {
                                            const isSelected =
                                                profileTags.includes(s.value);
                                            return (
                                                <div
                                                    key={s.value}
                                                    className="relative"
                                                >
                                                    <input
                                                        id={`types-${index}`}
                                                        type="checkbox"
                                                        value={s.value}
                                                        className="hidden"
                                                        onChange={
                                                            handleProfileTags
                                                        }
                                                        checked={isSelected}
                                                    />
                                                    <label
                                                        htmlFor={`types-${index}`}
                                                        className={`block px-6 py-2 font-cera text-lg md:text-lg rounded-full text-normal 
                                                            font-medium cursor-pointer transition-all duration-300 border 
                                                            ${
                                                                isSelected
                                                                    ? "bg-pink-600 !border-pink-500 text-white shadow-lg shadow-pink-500/30"
                                                                    : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20"
                                                            }`}
                                                    >
                                                        {s.label}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-center">
                                        <button
                                            onClick={handleNext}
                                            disabled={
                                                profileTags &&
                                                profileTags.length < 1
                                            }
                                            className={`bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-anton uppercase tracking-widest text-normal py-2 px-12 rounded-[30px]  shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 transform hover:-translate-y-1 transition-all duration-300  w-fit disabled:opacity-50 disabled:cursor-not-allowed`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="animate-fade-in-up">
                                    <form
                                        onSubmit={submit}
                                        className="space-y-6"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Display Name
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="name"
                                                        name="name"
                                                        value={data.name}
                                                        className={getFieldClassName(
                                                            "name",
                                                        )}
                                                        autoComplete="name"
                                                        onChange={(e) =>
                                                            setData(
                                                                "name",
                                                                e.target.value,
                                                            )
                                                        }
                                                        required
                                                    />
                                                    {renderFieldStatusIcon(
                                                        "name",
                                                    )}
                                                </div>
                                                <InputError
                                                    message={getFieldError(
                                                        "name",
                                                    )}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Username
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="username"
                                                        name="username"
                                                        value={data.username}
                                                        className={getFieldClassName(
                                                            "username",
                                                        )}
                                                        autoComplete="username"
                                                        onChange={(e) =>
                                                            setData(
                                                                "username",
                                                                e.target.value,
                                                            )
                                                        }
                                                        onBlur={() => {
                                                            markFieldTouched(
                                                                "username",
                                                            );
                                                            let localError =
                                                                null;
                                                            if (
                                                                data.username
                                                                    .length < 5
                                                            ) {
                                                                localError =
                                                                    "The username must be at least 5 characters.";
                                                            } else if (
                                                                data.username
                                                                    .length > 20
                                                            ) {
                                                                localError =
                                                                    "The username must not be greater than 20 characters.";
                                                            } else if (
                                                                /[A-Z]/.test(
                                                                    data.username,
                                                                )
                                                            ) {
                                                                localError =
                                                                    "The username must be lowercase.";
                                                            } else if (
                                                                /\s/.test(
                                                                    data.username,
                                                                )
                                                            ) {
                                                                localError =
                                                                    "The username must not contain spaces.";
                                                            } else if (
                                                                /[^a-z0-9]/.test(
                                                                    data.username,
                                                                )
                                                            ) {
                                                                localError =
                                                                    "The username must only contain letters and numbers.";
                                                            }

                                                            if (localError) {
                                                                setLiveErrors(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        username:
                                                                            localError,
                                                                    }),
                                                                );
                                                                setFieldValidity(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        username: false,
                                                                    }),
                                                                );
                                                                return;
                                                            }
                                                            validateRegistration(
                                                                {
                                                                    username:
                                                                        data.username,
                                                                },
                                                            );
                                                        }}
                                                        required
                                                    />
                                                    {renderFieldStatusIcon(
                                                        "username",
                                                    )}
                                                </div>
                                                <InputError
                                                    message={getFieldError(
                                                        "username",
                                                    )}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Gender
                                                </label>
                                                <select
                                                    onChange={(e) =>
                                                        setData(
                                                            "gender",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="mt-1 block w-full bg-white/5 border border-white/10 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent rounded-[30px]  p-3"
                                                    value={data.gender}
                                                >
                                                    <option value="" disabled>
                                                        Choose Gender
                                                    </option>
                                                    <option
                                                        value="he"
                                                        className="text-black"
                                                    >
                                                        He
                                                    </option>
                                                    <option
                                                        value="she"
                                                        className="text-black"
                                                    >
                                                        She
                                                    </option>
                                                    <option
                                                        value="they"
                                                        className="text-black"
                                                    >
                                                        They
                                                    </option>
                                                </select>
                                                <InputError
                                                    message={getFieldError(
                                                        "gender",
                                                    )}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Email
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        value={data.email}
                                                        className={getFieldClassName(
                                                            "email",
                                                        )}
                                                        autoComplete="username"
                                                        onChange={(e) =>
                                                            setData(
                                                                "email",
                                                                e.target.value,
                                                            )
                                                        }
                                                        onBlur={() => {
                                                            markFieldTouched(
                                                                "email",
                                                            );
                                                            validateRegistration(
                                                                {
                                                                    email: data.email,
                                                                },
                                                            );
                                                        }}
                                                        required
                                                    />
                                                    {renderFieldStatusIcon(
                                                        "email",
                                                    )}
                                                </div>
                                                <InputError
                                                    message={getFieldError(
                                                        "email",
                                                    )}
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="password"
                                                        type={
                                                            showPassword
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        name="password"
                                                        value={mypass}
                                                        ref={inputFieldRef}
                                                        className={getFieldClassName(
                                                            "password",
                                                        )}
                                                        autoComplete="off"
                                                        onChange={
                                                            handlePassHints
                                                        }
                                                        onBlur={() => {
                                                            markFieldTouched(
                                                                "password",
                                                            );
                                                            validateRegistration(
                                                                {
                                                                    password:
                                                                        data.password,
                                                                    password_confirmation:
                                                                        data.password_confirmation,
                                                                },
                                                            );
                                                        }}
                                                        required
                                                    />

                                                    {renderFieldStatusIcon(
                                                        "password",
                                                    )}
                                                </div>

                                                <p className="w-full">
                                                    <InputError
                                                        message={getFieldError(
                                                            "password",
                                                        )}
                                                        className="mt-2"
                                                    />
                                                </p>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowPassword(
                                                            (prev) => !prev,
                                                        )
                                                    }
                                                    className="mt-2 text-sm font-medium text-pink-400 hover:text-pink-300 underline underline-offset-4"
                                                >
                                                    {showPassword
                                                        ? "Hide Passwords"
                                                        : "Show Passwords"}
                                                </button>
                                            </div>

                                            <div className="md:col-span-1">
                                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                                    Confirm Password
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        id="password_confirmation"
                                                        type={
                                                            showPassword
                                                                ? "text"
                                                                : "password"
                                                        }
                                                        name="password_confirmation"
                                                        value={
                                                            data.password_confirmation
                                                        }
                                                        className={getFieldClassName(
                                                            "password_confirmation",
                                                        )}
                                                        autoComplete="off"
                                                        onChange={(e) =>
                                                            setData(
                                                                "password_confirmation",
                                                                e.target.value,
                                                            )
                                                        }
                                                        onBlur={() => {
                                                            markFieldTouched(
                                                                "password_confirmation",
                                                            );
                                                            validateRegistration(
                                                                {
                                                                    password:
                                                                        data.password,
                                                                    password_confirmation:
                                                                        data.password_confirmation,
                                                                },
                                                            );
                                                        }}
                                                        required
                                                    />
                                                    {renderFieldStatusIcon(
                                                        "password_confirmation",
                                                    )}
                                                </div>
                                                <InputError
                                                    message={getFieldError(
                                                        "password_confirmation",
                                                    )}
                                                    className="mt-2"
                                                />
                                            </div>
                                        </div>

                                        <div
                                            className={`${
                                                mypass ? "block" : "hidden"
                                            } bg-white/5 rounded-[30px]  p-4 border border-white/10`}
                                        >
                                            <h3 className="text-white font-medium mb-2">
                                                Password must contain:
                                            </h3>
                                            <div className="space-y-1">
                                                <p
                                                    className={`${
                                                        passwordCriteria.lower
                                                            ? "text-green-500"
                                                            : "text-gray-300"
                                                    } flex items-center gap-2 text-sm`}
                                                >
                                                    <CheckCircleIcon />{" "}
                                                    Lowercase letter
                                                </p>
                                                <p
                                                    className={`${
                                                        passwordCriteria.upper
                                                            ? "text-green-500"
                                                            : "text-gray-300"
                                                    } flex items-center gap-2 text-sm`}
                                                >
                                                    <CheckCircleIcon />{" "}
                                                    Uppercase letter
                                                </p>
                                                <p
                                                    className={`${
                                                        passwordCriteria.number
                                                            ? "text-green-500"
                                                            : "text-gray-300"
                                                    } flex items-center gap-2 text-sm`}
                                                >
                                                    <CheckCircleIcon /> Number
                                                </p>
                                                <p
                                                    className={`${
                                                        passwordCriteria.special
                                                            ? "text-green-500"
                                                            : "text-gray-300"
                                                    } flex items-center gap-2 text-sm`}
                                                >
                                                    <CheckCircleIcon /> Special
                                                    character
                                                </p>
                                                <p
                                                    className={`${
                                                        passwordCriteria.length
                                                            ? "text-green-500"
                                                            : "text-gray-300"
                                                    } flex items-center gap-2 text-sm`}
                                                >
                                                    <CheckCircleIcon /> Minimum
                                                    8 characters
                                                </p>
                                            </div>
                                        </div>

                                        {role == 0 && role !== 1 && (
                                            <div className="pt-4 border-t border-white/10">
                                                <h3 className="text-white font-medium mb-4 uppercase">
                                                    Billing Address Information
                                                </h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                                            Street Address
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                id="street_address"
                                                                name="street_address"
                                                                value={
                                                                    address.street_address
                                                                }
                                                                className={getFieldClassName(
                                                                    "street_address",
                                                                )}
                                                                autoComplete="street_address"
                                                                onChange={
                                                                    handleAddressInput
                                                                }
                                                                onBlur={() => {
                                                                    markFieldTouched(
                                                                        "street_address",
                                                                    );
                                                                    validateRegistration(
                                                                        {
                                                                            street_address:
                                                                                address.street_address,
                                                                        },
                                                                    );
                                                                }}
                                                                required
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "street_address",
                                                            )}
                                                        </div>
                                                        <InputError
                                                            message={getFieldError(
                                                                "street_address",
                                                            )}
                                                            className="mt-2"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                                            Country
                                                        </label>
                                                        <div className="relative">
                                                            <Countries
                                                                send={
                                                                    getCountry
                                                                }
                                                                selectClassName={getFieldClassName(
                                                                    "country",
                                                                    "w-full bg-[#ffffff0d] border border-white/10 text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent rounded-[30px] p-3",
                                                                )}
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "country",
                                                            )}
                                                        </div>
                                                        <InputError
                                                            message={getFieldError(
                                                                "country",
                                                            )}
                                                            className="mt-2"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                                            State
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                id="state"
                                                                name="state"
                                                                value={
                                                                    address.state
                                                                }
                                                                className={getFieldClassName(
                                                                    "state",
                                                                )}
                                                                autoComplete="state"
                                                                onChange={
                                                                    handleAddressInput
                                                                }
                                                                onBlur={() => {
                                                                    markFieldTouched(
                                                                        "state",
                                                                    );
                                                                    validateRegistration(
                                                                        {
                                                                            state: address.state,
                                                                        },
                                                                    );
                                                                }}
                                                                required
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "state",
                                                            )}
                                                        </div>
                                                        <InputError
                                                            message={getFieldError(
                                                                "state",
                                                            )}
                                                            className="mt-2"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                                            City
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                id="city"
                                                                name="city"
                                                                value={
                                                                    address.city
                                                                }
                                                                className={getFieldClassName(
                                                                    "city",
                                                                )}
                                                                autoComplete="city"
                                                                onChange={
                                                                    handleAddressInput
                                                                }
                                                                onBlur={() => {
                                                                    markFieldTouched(
                                                                        "city",
                                                                    );
                                                                    validateRegistration(
                                                                        {
                                                                            city: address.city,
                                                                        },
                                                                    );
                                                                }}
                                                                required
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "city",
                                                            )}
                                                        </div>
                                                        <InputError
                                                            message={getFieldError(
                                                                "city",
                                                            )}
                                                            className="mt-2"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                                            Postal Code
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                id="postal_code"
                                                                name="postal_code"
                                                                value={
                                                                    address.postal_code
                                                                }
                                                                className={getFieldClassName(
                                                                    "postal_code",
                                                                )}
                                                                autoComplete="postal_code"
                                                                onChange={
                                                                    handleAddressInput
                                                                }
                                                                onBlur={() => {
                                                                    markFieldTouched(
                                                                        "postal_code",
                                                                    );
                                                                    validateRegistration(
                                                                        {
                                                                            postal_code:
                                                                                address.postal_code,
                                                                        },
                                                                    );
                                                                }}
                                                                required
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "postal_code",
                                                            )}
                                                        </div>
                                                        <InputError
                                                            message={getFieldError(
                                                                "postal_code",
                                                            )}
                                                            className="mt-2"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-white/10">
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Referral (Optional)
                                            </label>
                                            <div className="relative flex gap-2">
                                                <input
                                                    value={promoInputValue}
                                                    placeholder={
                                                        hasReferralFromUrl
                                                            ? "Referral code applied automatically"
                                                            : "Enter referral code"
                                                    }
                                                    disabled={false}
                                                    readOnly={
                                                        hasReferralFromUrl
                                                    }
                                                    className={`flex-1 bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent rounded-[30px]  p-3 ${
                                                        hasReferralFromUrl
                                                            ? "opacity-50 cursor-not-allowed"
                                                            : ""
                                                    }`}
                                                    onChange={(e) => {
                                                        setPromoInputValue(
                                                            e.target.value,
                                                        );
                                                        setCodeValid(false);
                                                        setData("promo", "");

                                                        // ✅ clear old referral message
                                                        setReferralMessage("");
                                                        setReferralType("");
                                                    }}
                                                />
                                                {!hasReferralFromUrl &&
                                                    (codevalid ? (
                                                        <button
                                                            type="button"
                                                            onClick={removecode}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-4 rounded-[30px]  font-medium transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                role === 1
                                                                    ? checkCreatorReferral
                                                                    : checkPromo
                                                            }
                                                            className="bg-pink-600 hover:bg-pink-500 text-white px-4 rounded-[30px]  font-medium transition-colors"
                                                        >
                                                            Apply
                                                        </button>
                                                    ))}
                                            </div>
                                            {referralMessage && (
                                                <div
                                                    className={`mt-3 rounded-[30px]  px-4 py-3 text-sm font-medium border ${
                                                        referralType ===
                                                        "success"
                                                            ? "bg-green-500/10 text-green-400 border-green-500/30"
                                                            : "bg-red-500/10 text-red-400 border-red-500/30"
                                                    }`}
                                                >
                                                    {referralMessage}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    ref={checkRef}
                                                    id="termaccept"
                                                    name="termaccept"
                                                    className="h-6 w-6 mt-1 rounded bg-white/10 border-white/20 text-pink-500 focus:ring-pink-500"
                                                    onChange={(e) =>
                                                        setData(
                                                            "termaccept",
                                                            e?.target?.value,
                                                        )
                                                    }
                                                    required
                                                />
                                                <span className="text-normal text-gray-400">
                                                    By signing up you agree to
                                                    our{" "}
                                                    <a
                                                        href={route(
                                                            "terms-and-conditions",
                                                        )}
                                                        target="_blank"
                                                        className="text-pink-400 hover:text-pink-300 underline"
                                                    >
                                                        Terms & Conditions
                                                    </a>{" "}
                                                    and{" "}
                                                    <a
                                                        href="https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6"
                                                        target="_blank"
                                                        className="text-pink-400 hover:text-pink-300 underline"
                                                    >
                                                        Privacy Policy
                                                    </a>
                                                    , and confirm that you are
                                                    at least 18 years old.
                                                </span>
                                            </label>

                                            {role === 0 ? (
                                                <label
                                                    className={`flex items-start gap-3 cursor-pointer ${role === 0 ? "" : "hidden"}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        ref={addressCheck}
                                                        id="addressCheck"
                                                        name="addressCheck"
                                                        onChange={(e) =>
                                                            setData(
                                                                "addressCheck",
                                                                e?.target
                                                                    ?.value,
                                                            )
                                                        }
                                                        className="h-6 w-6 mt-1 rounded bg-white/10 border-white/20 text-pink-500 focus:ring-pink-500"
                                                        required
                                                    />
                                                    <span className="text-normal text-gray-400">
                                                        The above address and
                                                        name matches on the bank
                                                        card I will later use
                                                        for purchases. My
                                                        account will be
                                                        suspended if I use any
                                                        other details.
                                                    </span>
                                                </label>
                                            ) : (
                                                ""
                                            )}
                                        </div>

                                        {turnstileSiteKey && (
                                            <div className="flex justify-center my-4">
                                                <div
                                                    ref={
                                                        bindTurnstileContainerRef
                                                    }
                                                />
                                            </div>
                                        )}

                                        <div className="">
                                            <Popup
                                                action={hasPop}
                                                modalclass="bg-gray-900 border border-white/10 shadow-2xl rounded-[30px]   p-6 max-w-lg w-full"
                                                space="4"
                                                size="md"
                                                classes={`hidden`}
                                                text={`Create Account`}
                                            >
                                                <div className="text-white">
                                                    <h2 className="text-2xl font-gulfs text-black mb-4 uppercase">
                                                        Important notice !
                                                    </h2>
                                                    <p className="text-black text-lg mb-4">
                                                        You must not use any
                                                        other individual’s
                                                        information. Only a
                                                        single account can be
                                                        used with the
                                                        information you confirm
                                                        to us.
                                                    </p>
                                                    <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-500">
                                                        <li>
                                                            First and Last name
                                                        </li>
                                                        <li>
                                                            Address registered
                                                            for the bank card
                                                            that will be used
                                                            during checkouts
                                                        </li>
                                                        <li>
                                                            The e-mail used
                                                            during checkouts.
                                                        </li>
                                                    </ol>
                                                    <div className="mb-4">
                                                        <label className="flex items-start gap-3 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                ref={
                                                                    hasNotifiedRef
                                                                }
                                                                id="hasNotified"
                                                                onChange={() =>
                                                                    setData(
                                                                        "hasNotified",
                                                                        1,
                                                                    )
                                                                }
                                                                name="hasNotified"
                                                                value="hasNotified"
                                                                required
                                                                className="mt-1 h-5 w-5 rounded bg-white/90 border-black/30 text-pink-500 focus:ring-pink-500"
                                                            />
                                                            <span className="text-sm text-gray-500">
                                                                I confirm that
                                                                the above
                                                                details are
                                                                correct and the
                                                                only details I
                                                                will use. If I
                                                                use other
                                                                information than
                                                                the above. My
                                                                account will be
                                                                suspended. If I
                                                                need to update
                                                                any details, I
                                                                will contact
                                                                support via live
                                                                chat who can
                                                                update my
                                                                account.
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <LoaderButton
                                                        onClick={accepted}
                                                        disabled={processing}
                                                        className={`
                                                            ${hasNotifiedRef && !hasNotifiedRef?.current?.checked ? "opacity-50 cursor-not-allowed disabled" : ""}
                                                            w-full justify-center bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-gulfs uppercase tracking-widest text-normal py-3 rounded-[30px]    `}
                                                        spinnerclass="fill-white"
                                                    >
                                                        {processing
                                                            ? "Processing"
                                                            : "Accept Terms"}
                                                    </LoaderButton>
                                                </div>
                                            </Popup>

                                            <LoaderButton
                                                disabled={processing}
                                                className={`relative flex flex-row items-center text-xl px-4 py-[10px] focus:outline-none  text-gray-600 border-l-4 border-transparent hover:!bg-pink-500 hover:!text-white pr-6 !text-black w-full 
                                                    ${!verified ? "opacity-50 cursor-not-allowed disabled" : ""}
                                                    ${!checkRef?.current?.checked ? "opacity-50 cursor-not-allowed disabled" : ""}
                                                    ${role == 0 && !addressCheck?.current?.checked ? "opacity-50 cursor-not-allowed disabled" : ""}
                                                ]`}
                                                spinnerclass="fill-white"
                                            >
                                                {processing
                                                    ? "Processing"
                                                    : "Create Account"}
                                            </LoaderButton>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
