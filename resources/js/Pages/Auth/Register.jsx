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
                >
                    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                    <g
                        id="SVGRepo_tracerCarrier"
                        stroke-linecap="round"
                        strokeLinejoin="round"
                    ></g>
                    <g id="SVGRepo_iconCarrier">
                        {" "}
                        <path
                            opacity="0.1"
                            d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            fill="#000000"
                        ></path>{" "}
                        <path
                            d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                            stroke="#000000"
                            strokeWidth="2"
                        ></path>{" "}
                        <path
                            d="M9 12L10.6828 13.6828V13.6828C10.858 13.858 11.142 13.858 11.3172 13.6828V13.6828L15 10"
                            stroke="#000000"
                            strokeWidth="2"
                            stroke-linecap="round"
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
    const lowerLetter = /[a-z]/g;
    const capitalLetter = /[A-Z]/g;
    const numberLetter = /[0-9]/g;
    const specialLetter = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/]/g;

    const inputField =
        typeof window !== "undefined" && document.getElementById("password");
    const letter =
        typeof window !== "undefined" && document.getElementById("letter");
    const capital =
        typeof window !== "undefined" && document.getElementById("capital");
    const number =
        typeof window !== "undefined" && document.getElementById("number");
    const special =
        typeof window !== "undefined" && document.getElementById("special");
    const length =
        typeof window !== "undefined" && document.getElementById("length");
    const [mypass, setmypass] = useState();

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

    const { ziggy, turnstileSiteKey } = usePage().props;
    const { url } = usePage(); // Access the current URL

    // Extract query parameters from the URL
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
    const [fieldValidity, setFieldValidity] = useState({});
    const validationTimersRef = useRef({});

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
                        next[field] = msg ? false : true;
                    });
                    return next;
                });

                if (toastOnError) {
                    const firstMsg =
                        Object.values(responseErrors).flat().filter(Boolean)[0];
                    if (firstMsg) {
                        errorAlert(firstMsg);
                    }
                }
            }
        },
        [errorAlert]
    );

    const getFieldError = useCallback(
        (field) => {
            if (!showFieldErrors) return "";

            const liveMsg = liveErrors?.[field];
            if (liveMsg) return liveMsg;

            const serverMsg = errors?.[field];
            if (Array.isArray(serverMsg)) return serverMsg[0] || "";
            return serverMsg || "";
        },
        [errors, liveErrors, showFieldErrors]
    );

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
        [address, data]
    );

    const getFieldStatus = useCallback(
        (field) => {
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
        [data?.name, errors, fieldValidity, liveErrors, showFieldErrors]
    );

    const getFieldClassName = useCallback(
        (field, baseClassName = "mt-1 block w-full") => {
            const status = getFieldStatus(field);
            const value = getFieldValue(field);
            const padded = `${baseClassName} pr-10`;

            if (status === "idle") return baseClassName;
            if (!String(value || "").trim()) return baseClassName;
            return padded;
        },
        [getFieldStatus, getFieldValue]
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
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <FieldStatusIcon status={status} />
                </div>
            );
        },
        [getFieldStatus, getFieldValue]
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
        setFieldValidity((prev) => {
            const next = { ...prev };
            delete next.username;
            return next;
        });
        validationTimersRef.current.username = setTimeout(() => {
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
        if (!data.email || !data.email.includes("@")) {
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
        setFieldValidity((prev) => {
            const next = { ...prev };
            delete next.email;
            return next;
        });
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
        if (!data.password_confirmation) {
            setLiveErrors((prev) => {
                const next = { ...prev };
                delete next.password_confirmation;
                return next;
            });
            setFieldValidity((prev) => {
                const next = { ...prev };
                delete next.password_confirmation;
                return next;
            });
            return;
        }

        if (data.password && data.password_confirmation !== data.password) {
            setLiveErrors((prev) => ({
                ...prev,
                password_confirmation: "Passwords do not match.",
            }));
            setFieldValidity((prev) => ({
                ...prev,
                password_confirmation: false,
            }));
            return;
        }

        setLiveErrors((prev) => {
            const next = { ...prev };
            delete next.password_confirmation;
            return next;
        });
        setFieldValidity((prev) => ({
            ...prev,
            password_confirmation: true,
        }));
    }, [data.password, data.password_confirmation]);

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
        setData("cf_turnstile_response", token || "");
        setVerified(!!token);
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
                }
            );
        };

        if (window.turnstile) {
            renderWidget();
            return;
        }

        const existingScript = document.querySelector(
            'script[data-turnstile-script="true"]'
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
                ? [
                      "country",
                      "street_address",
                      "state",
                      "city",
                      "postal_code",
                  ]
                : [];

        const liveErrorMessages = Object.entries(liveErrors || {})
            .filter(
                ([field, msg]) =>
                    !!msg && !ignoredLiveErrorFields.includes(field)
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
        if (role == 0 && !addressCheck.current.checked) {
            errorAlert("Please accept all terms and conditions.");
            addressCheck.current.focus();
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
                        resp.props.flash?.success || "Signup successfully."
                    );
                }
                if (resp.props.flash?.error) {
                    errorAlert(
                        resp.props.flash?.error || "Something went wrong."
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
        promoinput.current.value = "";
        setData("promo", "");
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
                } else {
                    setCodeValid(false);
                    errorAlert(resp.data.msg);
                }
            })
            .catch(() => {
                setCodeValid(false);
            });
    };

    const inputFieldRef = useRef(null);
    const letterRef = useRef(null);
    const capitalRef = useRef(null);
    const numberRef = useRef(null);
    const specialRef = useRef(null);
    const lengthRef = useRef(null);

    const handlePassHints = (e) => {
        const value = e.target.value;
        setmypass(value);
        setData("password", value);

        if (letterRef.current)
            letterRef.current.className = value.match(lowerLetter)
                ? "valid"
                : "text-grey";

        if (capitalRef.current)
            capitalRef.current.className = value.match(capitalLetter)
                ? "valid"
                : "text-grey";

        if (numberRef.current)
            numberRef.current.className = value.match(numberLetter)
                ? "valid"
                : "text-grey";

        if (specialRef.current)
            specialRef.current.className = value.match(specialLetter)
                ? "valid"
                : "text-grey";

        if (lengthRef.current)
            lengthRef.current.className =
                value.length > 7 ? "valid" : "text-grey";
    };

    return (
        <GuestLayout>
            {/* <IpRedirection />/ */}
            <Head title="Create Wishlist" />
            <div className="loginPage  bg-white pb-4 pb-md-5">
                <div className="containerbox   md:flex !pb-4 md:!pb-12  !pt-12 items-center justify-content-center">
                    {/* <div className="shadow-layout inputs !max-w-[800px] w-full pink-shadow-layout mx-auto  !border-3 border-black  bg-white shadow-pink overflow-hidden"> */}
                    <div className=" inputs !max-w-[800px] w-full   mx-auto  ! bg-white  overflow-hidden">
                        {/* <div className="p-4 pinkbg flex  !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center ">
                            <span className=" border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block"></span>
                            <span className=" border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block"></span>
                            <span className=" border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block"></span>
                        </div> */}

                        <h1 className="text-[30px] font-GillSans text-uppercase d-none pt-8 text-center px-2">
                            Create Wishlist
                        </h1>
                        <h2 className="text-[30px] font-GillSans text-uppercase pt-8 text-center px-2">
                            Create Account
                        </h2>
                        <p className="text-center text-[18px] text-dark mb-4 ">
                            Already registered?{" "}
                            <Link className={"text-pink"} href={route("login")}>
                                {" "}
                                Log In
                            </Link>
                        </p>
                        {step === 0 && (
                            <div
                                className={`${step === 0 ? "" : "d-none"}   px-3 py-3 pb-5`}>
                                <div className=" flex gap-4 justify-center">
                                    <div className="w-full max-w-[400px] ">
                                        <div
                                            onClick={() => handleBecomeCreator(1)}
                                            className={`${
                                                role == 1 ? "active" : ""
                                            }  cursor-pointer create-select border p-4 border-gray-300 rounded-4 text-center`}
                                        >
                                            <h2 className="text-[22px] font-GillSans text-uppercase">
                                                I'm a Creator
                                            </h2>
                                            <p className="text-muted text-[16px] mt-1 mb-0">
                                                I'd like to create a wishlist
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full max-w-[400px]">
                                        <div
                                            onClick={() => handleBecomeCreator(0)}
                                            className={`${
                                                role == 0 ? "active" : ""
                                            }  cursor-pointer create-select border p-4 border-gray-300 rounded-4 text-center`}
                                        >
                                            <h2 className="text-[22px] font-GillSans text-uppercase">
                                                I'm a Fan
                                            </h2>
                                            <p className="text-muted text-[16px] mt-1 mb-0">
                                                I'm here to follow and support
                                                creators
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-muted text-base text-center max-w-[450px] m-auto mt-4">
                                    You can support other creators with either
                                    of the account types and can change your
                                    account type anytime.
                                </p>
                            </div>
                        )}

                        {step === 1 && (
                            <div
                                className={`${
                                    step === 1 ? "" : "d-none"
                                }    px-3`}
                            >
                                <div className="px-0 px-md-4 px-lg-5 pb-4">
                                    <h2 className="font-gulfs uppercase text-center text-xl md:text-2xl mb-2">
                                        Heads up, Babe! 🚨
                                    </h2>
                                    <p className="text-center text-[17px] max-w-[600px] m-auto text-muted ">
                                        Your social media link is how we verify
                                        you’re real — no bots, no fakes, no
                                        funny business. Make sure it’s an active
                                        profile with clear posts, or your
                                        application might be rejected.
                                    </p>
                                    <div className="flex justify-center">

                                        <button
                                            onClick={handleNext}
                                            className="btn-pink !font-normal max-w-[400px] md m-auto mt-3 w-full"
                                        >
                                            {" "}
                                            Got it – I’ll link my socials
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div
                                className={`${
                                    step === 2 ? "" : "d-none"
                                }    px-3`}
                            >
                                <div className="px-0 px-md-4 px-lg-5 pb-4">
                                    <p className="text-center text-[17px] text-muted ">
                                        Choose from the following categories.
                                        This helps people find your profile. You
                                        can change these at any time.
                                    </p>

                                    <div className="flex creator-tags justify-content-center flex-wrap mt-4">
                                        {creatortypes.map((s, index) => (
                                            <div
                                                key={s.value}
                                                className="flex items-center"
                                            >
                                                <input
                                                    id={`tyeps-${index}`}
                                                    name={s.value}
                                                    type="checkbox"
                                                    value={s.value}
                                                    className="mr-2  text-indigo-500  hidden"
                                                    onChange={handleProfileTags}
                                                />
                                                <label
                                                    htmlFor={`tyeps-${index}`}
                                                    className="me-1 mb-1 bg-gray-200 px-4 py-[10px] rounded-[40px] text-[15px] text-gray-600 cursor-pointer"
                                                >
                                                    {s.label}
                                                </label>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        className={`${
                                            profileTags &&
                                            profileTags.length < 1
                                                ? "disabled"
                                                : ""
                                        } btn-pink md m-auto mt-3 w-full`}
                                    >
                                        {" "}
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className={`${step === 3 ? "" : "d-none"}`}>
                                <form onSubmit={submit} className="px-2 md:px-4">
                                    <div className="login-step1 loginform !max-w-[100%] !w-full">
                                        <div className="">
                                            <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
                                                <div className=" mb-4 formfield">
                                                    <label>Display Name</label>
                                                    <div className="relative">
                                                        <input
                                                            id="name"
                                                            name="name"
                                                            value={data.name}
                                                            className={getFieldClassName(
                                                                "name"
                                                            )}
                                                            autoComplete="name"
                                                            onChange={(e) =>
                                                                setData(
                                                                    "name",
                                                                    e.target.value
                                                                )
                                                            }
                                                            required
                                                        />
                                                        {renderFieldStatusIcon(
                                                            "name"
                                                        )}
                                                    </div>
                                                    <InputError>
                                                        {getFieldError("name")}
                                                    </InputError>
                                                </div>
                                                <div className=" mb-4 formfield">
                                                    <label>Username</label>
                                                    <div className="relative">
                                                        <input
                                                            id="username"
                                                            name="username"
                                                            value={data.username}
                                                            className={getFieldClassName(
                                                                "username"
                                                            )}
                                                            autoComplete="username"
                                                            isFocused={true}
                                                            onChange={(e) =>
                                                                setData(
                                                                    "username",
                                                                    e.target.value
                                                                )
                                                            }
                                                            onBlur={() =>
                                                                validateRegistration(
                                                                    {
                                                                        username: data.username,
                                                                    }
                                                                )
                                                            }
                                                            required
                                                        />
                                                        {renderFieldStatusIcon(
                                                            "username"
                                                        )}
                                                    </div>
                                                    <InputError>
                                                        {getFieldError("username")}
                                                    </InputError>
                                                </div>
                                                <div className=" mb-4 formfield">
                                                    <label>Gender</label>
                                                    <select
                                                        onChange={(e) =>
                                                            setData(
                                                                "gender",
                                                                e.target.value
                                                            )
                                                        }
                                                    >
                                                        <option disabled>
                                                            Choose Gender
                                                        </option>
                                                        <option value={"he"}>
                                                            He
                                                        </option>
                                                        <option value={"she"}>
                                                            She
                                                        </option>
                                                        <option value={"they"}>
                                                            They
                                                        </option>
                                                    </select>
                                                    <InputError>
                                                        {getFieldError("gender")}
                                                    </InputError>
                                                </div>
                                            </div>
                                            
                                            <div className=" mb-4 formfield">
                                                <label>Email</label>
                                                <div className="relative">
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        name="email"
                                                        value={data.email}
                                                        className={getFieldClassName(
                                                            "email"
                                                        )}
                                                        autoComplete="username"
                                                        onChange={(e) =>
                                                            setData(
                                                                "email",
                                                                e.target.value
                                                            )
                                                        }
                                                        onBlur={() =>
                                                            validateRegistration(
                                                                { email: data.email }
                                                            )
                                                        }
                                                        required
                                                    />
                                                    {renderFieldStatusIcon(
                                                        "email"
                                                    )}
                                                </div>
                                                <InputError>
                                                    {getFieldError("email")}
                                                </InputError>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4">
                                                <div className=" mb-4 formfield">
                                                    <label>Password</label>
                                                    <div className="relative">
                                                        <input
                                                            id="password"
                                                            type="password"
                                                            name="password"
                                                            value={mypass}
                                                            ref={inputFieldRef}
                                                            className={getFieldClassName(
                                                                "password"
                                                            )}
                                                            autoComplete="off"
                                                            onChange={handlePassHints}
                                                            onBlur={() =>
                                                                validateRegistration(
                                                                    {
                                                                        password: data.password,
                                                                        password_confirmation:
                                                                            data.password_confirmation,
                                                                    }
                                                                )
                                                            }
                                                            required
                                                        />
                                                        {renderFieldStatusIcon(
                                                            "password"
                                                        )}
                                                    </div>
                                                    <InputError>
                                                        {getFieldError("password")}
                                                    </InputError>
                                                </div>
                                                <div className=" formfield">
                                                    <div>
                                                        <label>
                                                            Confirm Password
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                id="password_confirmation"
                                                                type="password"
                                                                name="password_confirmation"
                                                                value={
                                                                    data.password_confirmation
                                                                }
                                                                className={getFieldClassName(
                                                                    "password_confirmation"
                                                                )}
                                                                autoComplete="off"
                                                                onChange={(e) =>
                                                                    setData(
                                                                        "password_confirmation",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                onBlur={() =>
                                                                    validateRegistration(
                                                                        {
                                                                            password: data.password,
                                                                            password_confirmation:
                                                                                data.password_confirmation,
                                                                        }
                                                                    )
                                                                }
                                                                required
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "password_confirmation"
                                                            )}
                                                        </div>
                                                        <InputError>
                                                            {getFieldError(
                                                                "password_confirmation"
                                                            )}
                                                        </InputError>
                                                    </div>
                                                </div>
                                            </div>


                                            <div
                                                className={`mb-3  ${
                                                    mypass
                                                        ? "d-block"
                                                        : "d-none"
                                                }`}
                                            >
                                                <div className="pass greybox border-0 p-3">
                                                    <div id="msgText">
                                                        <h3 className="mt-2">
                                                            Password must
                                                            contain the
                                                            following:
                                                        </h3>
                                                        <p
                                                            ref={letterRef}
                                                            id="letter"
                                                            className="text-grey"
                                                        >
                                                            <CheckCircleIcon />{" "}
                                                            &nbsp;A{" "}
                                                            <b> lowercase</b>{" "}
                                                            letter
                                                        </p>
                                                        <p
                                                            ref={capitalRef}
                                                            id="capital"
                                                            className="text-grey"
                                                        >
                                                            <CheckCircleIcon />{" "}
                                                            &nbsp;A{" "}
                                                            <b>
                                                                {" "}
                                                                capital
                                                                (uppercase)
                                                            </b>{" "}
                                                            letter
                                                        </p>
                                                        <p
                                                            ref={numberRef}
                                                            id="number"
                                                            className="text-grey"
                                                        >
                                                            <CheckCircleIcon />{" "}
                                                            &nbsp;A{" "}
                                                            <b> number</b>
                                                        </p>
                                                        <p
                                                            ref={specialRef}
                                                            id="special"
                                                            className="text-grey"
                                                        >
                                                            <CheckCircleIcon />{" "}
                                                            &nbsp;Special
                                                            characters
                                                        </p>
                                                        <p
                                                            ref={lengthRef}
                                                            id="length"
                                                            className="text-grey mb-0"
                                                        >
                                                            <CheckCircleIcon />{" "}
                                                            &nbsp;Password
                                                            should minimum 8
                                                            characters.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {role == 0 && role !== 1 ? (
                                            <>
                                                <p className="border-t mt-3 pt-4 text-grey uppercase text-normal mb-2">
                                                    Billing address information
                                                </p>
                                                <div className="row">
                                                    <div className="col-md-12 mb-4 formfield">
                                                        <label>
                                                            street_address
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                id="street_address"
                                                                name="street_address"
                                                                value={
                                                                    address.street_address
                                                                }
                                                                className={getFieldClassName(
                                                                    "street_address"
                                                                )}
                                                                autoComplete="street_address"
                                                                onChange={
                                                                    handleAddressInput
                                                                }
                                                                onBlur={() =>
                                                                    validateRegistration(
                                                                        {
                                                                            street_address:
                                                                                address.street_address,
                                                                        }
                                                                    )
                                                                }
                                                                required
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "street_address"
                                                            )}
                                                        </div>
                                                        <InputError>
                                                            {getFieldError(
                                                                "street_address"
                                                            )}
                                                        </InputError>
                                                    </div>
                                                    <div className="col-md-6 mb-4 formfield">
                                                        <label>
                                                            Choose Country
                                                        </label>
                                                        <div className="relative">
                                                            <Countries
                                                                send={getCountry}
                                                                selectClassName={getFieldClassName(
                                                                    "country",
                                                                    "w-full"
                                                                )}
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "country"
                                                            )}
                                                        </div>
                                                        <InputError>
                                                            {getFieldError(
                                                                "country"
                                                            )}
                                                        </InputError>
                                                    </div>
                                                    <div className="col-md-6 mb-4 formfield">
                                                        <label>State</label>
                                                        <div className="relative">
                                                            <input
                                                                id="state"
                                                                name="state"
                                                                value={address.state}
                                                                className={getFieldClassName(
                                                                    "state"
                                                                )}
                                                                autoComplete="state"
                                                                onChange={
                                                                    handleAddressInput
                                                                }
                                                                onBlur={() =>
                                                                    validateRegistration(
                                                                        {
                                                                            state: address.state,
                                                                        }
                                                                    )
                                                                }
                                                                required
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "state"
                                                            )}
                                                        </div>
                                                        <InputError>
                                                            {getFieldError(
                                                                "state"
                                                            )}
                                                        </InputError>
                                                    </div>
                                                    <div className="col-md-6 mb-4 formfield">
                                                        <label>City</label>
                                                        <div className="relative">
                                                            <input
                                                                id="city"
                                                                name="city"
                                                                value={address.city}
                                                                className={getFieldClassName(
                                                                    "city"
                                                                )}
                                                                autoComplete="city"
                                                                onChange={
                                                                    handleAddressInput
                                                                }
                                                                onBlur={() =>
                                                                    validateRegistration(
                                                                        {
                                                                            city: address.city,
                                                                        }
                                                                    )
                                                                }
                                                                required
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "city"
                                                            )}
                                                        </div>
                                                        <InputError>
                                                            {getFieldError(
                                                                "city"
                                                            )}
                                                        </InputError>
                                                    </div>
                                                    <div className="col-md-6 mb-4 formfield">
                                                        <label>
                                                            Postal Code
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                id="postal_code"
                                                                name="postal_code"
                                                                value={
                                                                    address.postal_code
                                                                }
                                                                onChange={
                                                                    handleAddressInput
                                                                }
                                                                className={getFieldClassName(
                                                                    "postal_code"
                                                                )}
                                                                autoComplete="postal_code"
                                                                onBlur={() =>
                                                                    validateRegistration(
                                                                        {
                                                                            postal_code:
                                                                                address.postal_code,
                                                                        }
                                                                    )
                                                                }
                                                                required
                                                            />
                                                            {renderFieldStatusIcon(
                                                                "postal_code"
                                                            )}
                                                        </div>
                                                        <InputError>
                                                            {getFieldError(
                                                                "postal_code"
                                                            )}
                                                        </InputError>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <></>
                                        )}

                                        <div className="promocode mb-4 mt-4">
                                            <label className="mb-2 block">
                                                Referral (optional)
                                            </label>

                                            <div className="relative">
                                                <input
                                                    value={promoInputValue}
                                                    placeholder={
                                                        hasReferralFromUrl
                                                            ? "Referral code applied automatically"
                                                            : "Enter referral code (optional)"
                                                    }
                                                    disabled={false}
                                                    readOnly={
                                                        hasReferralFromUrl
                                                    }
                                                    className={`form-control ${
                                                        hasReferralFromUrl
                                                            ? "bg-gray-200 cursor-not-allowed"
                                                            : ""
                                                    }`}
                                                    onChange={(e) => {
                                                        setPromoInputValue(
                                                            e.target.value
                                                        );
                                                        setCodeValid(false);
                                                        setData("promo", "");
                                                    }}
                                                />

                                                {/* Creator manual referral success */}
                                                {role === 1 &&
                                                    codevalid &&
                                                    !hasReferralFromUrl && (
                                                        <p className="mt-2 text-sm text-green-600">
                                                            ✅ Referral code
                                                            applied
                                                            successfully.
                                                        </p>
                                                    )}

                                                {/* FAN ONLY BUTTON */}
                                                {!hasReferralFromUrl &&
                                                    (codevalid ? (
                                                        <div
                                                            onClick={removecode}
                                                            className="cursor-pointer mintbg text-dark promocode-btn ms-2 text-center"
                                                        >
                                                            Remove
                                                        </div>
                                                    ) : (
                                                        <div
                                                            onClick={
                                                                role === 1
                                                                    ? checkCreatorReferral
                                                                    : checkPromo
                                                            }
                                                            className="absolute top-2 right-2 cursor-pointer mintbg text-dark promocode-btn !py-2 text-center"
                                                        >
                                                            Apply
                                                        </div>
                                                    ))}
                                            </div>

                                            {/* ✅ MESSAGE BELOW INPUT */}
                                            {hasReferralFromUrl && (
                                                <p className="mt-2 text-sm text-green-600">
                                                    ✅ Referral code applied
                                                    from your invitation link.
                                                </p>
                                            )}

                                            {/* Manual promo success (fan only) */}
                                            {role === 0 && codevalid && (
                                                <p className="mt-2 text-sm text-green-600">
                                                    ✅ Promo code applied
                                                    successfully.
                                                </p>
                                            )}
                                        </div>

                                        <div className="termselect">
                                            <label htmlFor="termaccept">
                                                <p className="tersms-accept">
                                                    <input
                                                        type="checkbox"
                                                        ref={checkRef}
                                                        id="termaccept"
                                                        name="termaccept"
                                                        value="termaccept"
                                                        required
                                                        onChange={(e) =>
                                                            setData(
                                                                "termaccept",
                                                                e.target.value
                                                            )
                                                        }
                                                    ></input>
                                                    By signing up you agree to
                                                    our{" "}
                                                    <a
                                                        className="text-voilet font-bold"
                                                        target="_blank"
                                                        href={route(
                                                            "terms-and-conditions"
                                                        )}
                                                    >
                                                        Terms & Conditions
                                                    </a>{" "}
                                                    and{" "}
                                                    <a
                                                        className="text-voilet font-bold"
                                                        target="_blank"
                                                        href={
                                                            "https://app.termly.io/document/privacy-policy/696baafc-17cd-4a28-b758-a8f597cf2ad6"
                                                        }
                                                    >
                                                        Privacy Policy,
                                                    </a>{" "}
                                                    and confirm that you are at
                                                    least 18. years old. Pages
                                                    that break our terms will be
                                                    unpublished.
                                                </p>
                                            </label>
                                            {role == 0 ? (
                                                <>
                                                    {/* <label htmlFor="gifterCheck">
                                                    <p className='tersms-accept mt-3' >
                                                        <input type="checkbox" ref={gifterref} id="gifterCheck" name="gifterCheck" value="gifterCheck"
                                                        required ></input>
                                                        The above matches the details on the bank card they will use. If it doesn’t their account will be suspended.
                                                    </p>
                                                </label> */}
                                                    <label htmlFor="addressCheck">
                                                        <p className="tersms-accept mt-3">
                                                            <input
                                                                type="checkbox"
                                                                ref={
                                                                    addressCheck
                                                                }
                                                                id="addressCheck"
                                                                name="addressCheck"
                                                                value="addressCheck"
                                                                required
                                                            ></input>
                                                            The above address
                                                            and name matches on
                                                            the bank card I will
                                                            later use for
                                                            purchases. My
                                                            account will be
                                                            suspended if I use
                                                            any other details.
                                                        </p>
                                                    </label>
                                                </>
                                            ) : (
                                                ""
                                            )}
                                        </div>

                                        {turnstileSiteKey ? (
                                            <div className="m-auto turnstile-wrap d-table mb-2 mt-4  mt-md-3">
                                                <div
                                                    ref={bindTurnstileContainerRef}
                                                />
                                            </div>
                                        ) : null}

                                        <div className="wishlistbtn text-center flex justify-center mt-2">
                                            <Popup
                                                action={hasPop}
                                                modalclassName=" full stripe-terms shadow-pink ps-0"
                                                space="4"
                                                size="md"
                                                classes={`hidden`}
                                                text={`Create Account`}
                                            >
                                                <div className="addgoal">
                                                    <h2 className="text-uppercase font-GillSans pb-4 font-large">
                                                        Important notice !
                                                    </h2>
                                                    <p className="mb-2">
                                                        {" "}
                                                        You must not use any
                                                        other individual’s
                                                        information. Only a
                                                        single account can be
                                                        used with the
                                                        information you confirm
                                                        to us.{" "}
                                                    </p>
                                                    <ol className="d-block py-3">
                                                        <li className="font-bold  text-[16px] mb-2 w-full">
                                                            1. First and Last
                                                            name{" "}
                                                        </li>
                                                        <li className="font-bold  text-[16px] mb-2 w-full">
                                                            2. Address
                                                            registered for the
                                                            bank card that will
                                                            be used during
                                                            checkouts{" "}
                                                        </li>
                                                        <li className="font-bold  text-[16px] mb-2 w-full">
                                                            3. The e-mail used
                                                            during checkouts.{" "}
                                                        </li>
                                                    </ol>
                                                    <div className="termselect mt-4 mb-4">
                                                        <label htmlFor="hasNotified">
                                                            <p className="text-[15px]">
                                                                <input
                                                                    type="checkbox"
                                                                    ref={
                                                                        hasNotifiedRef
                                                                    }
                                                                    id="hasNotified"
                                                                    name="hasNotified"
                                                                    value="hasNotified"
                                                                    required
                                                                ></input>
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
                                                            </p>
                                                        </label>
                                                    </div>
                                                    <LoaderButton
                                                        onClick={accepted}
                                                        disabled={processing}
                                                        className="p w-full mb-4 mb-md-0"
                                                        spinnerClassName="fill-red-600"
                                                    >
                                                        {processing
                                                            ? "Processing"
                                                            : " Accept Terms"}
                                                    </LoaderButton>
                                                </div>
                                            </Popup>
                                            <LoaderButton
                                                disabled={processing}
                                                className="p w-full mb-4 mb-md-0"
                                                spinnerClassName="fill-red-600"
                                            >
                                                {processing
                                                    ? "Processing"
                                                    : " Create Account"}
                                            </LoaderButton>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
