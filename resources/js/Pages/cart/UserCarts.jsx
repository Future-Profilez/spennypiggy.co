import React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CartItem from "./CartItem";
import { Link, router, usePage } from "@inertiajs/react";
import PriceFormat from "@/includes/PriceFormat";
import DeviceID from "@/includes/DeviceID";
import axios from "axios";
import { add_to_cart } from "@/Pages/redux/UserSlice";
import Turnstile from "@/Components/Turnstile";
import Popup from "@/Components/Popup";
import CheckoutLegalTerms from "@/Components/CheckoutLegalTerms";
import toast, { Toaster } from "react-hot-toast";

export default function UserCarts(props) {
    const {
        flash,
        rates,
        platform_fee_percentage,
        transaction_fee_percentage,
        turnstileSiteKey,
    } = usePage().props;
    const turnstileRef = useRef(null);
    const deviceid = useMemo(() => DeviceID(), []);
    const { auth, removeFromCart, currency } = props;
    const {
        format,
        formatMultiPrice,
        adminFeeInCurrency,
        calculateTotalSupporterPays,
    } = PriceFormat();
    const datas = props.data;
    const card_capabilities = datas?.card_capabilities;

    // Derived currency from items (priority: item currency > creator currency > prop currency > GBP)
    const itemCurrency = useMemo(() => {
        const firstItemCurrency = datas?.items?.[0]?.currency;
        const creatorCurrency =
            datas?.user?.currency || datas?.user?.default_currency;
        return (
            firstItemCurrency ||
            creatorCurrency ||
            props.currency ||
            "GBP"
        ).toUpperCase();
    }, [
        datas?.items,
        datas?.user?.currency,
        datas?.user?.default_currency,
        props.currency,
    ]);

    const chargeCurrency = itemCurrency;
    const debugEnabled = useMemo(() => {
        try {
            return window.location.search.includes("debug_cart_checkout=1");
        } catch {
            return false;
        }
    }, []);
    const [debugEvents, setDebugEvents] = useState([]);
    const debugStorageKey = useMemo(() => {
        const ownerId = datas?.user?.id || "unknown";
        return `cart_checkout_debug:${ownerId}`;
    }, [datas?.user?.id]);
    const pushDebug = useCallback(
        (label, payload = null) => {
            if (!debugEnabled) return;
            const entry = {
                ts: new Date().toISOString(),
                label,
                payload,
            };
            setDebugEvents((prev) => [entry, ...prev].slice(0, 30));
            try {
                console.log("[CartCheckoutDebug]", entry);
            } catch {}
        },
        [debugEnabled],
    );

    useEffect(() => {
        if (!debugEnabled) return;
        try {
            const raw = sessionStorage.getItem(debugStorageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    setDebugEvents(parsed);
                }
            }
        } catch {}
    }, [debugEnabled, debugStorageKey]);

    useEffect(() => {
        if (!debugEnabled) return;
        try {
            sessionStorage.setItem(
                debugStorageKey,
                JSON.stringify(debugEvents),
            );
        } catch {}
    }, [debugEnabled, debugStorageKey, debugEvents]);

    const isCreator = auth?.user?.id === datas?.user?.id;
    const vatPercentage = datas?.user?.vat_amount_percentage || 0;

    const [keepAnonmyous, setKeepAnonmyous] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [digitalWaiver, setDigitalWaiver] = useState(false);
    const [message, setMessage] = useState(null);
    const [name, setName] = useState(
        (auth && auth.user && auth.user.name) || "",
    );
    const [email, setEmail] = useState(
        (auth && auth.user && auth.user.email) || "",
    );
    const [subtotal, setsubtotal] = useState(0);
    const [fee, setFee] = useState(0);

    const [checking, setChecking] = useState(false);
    const [captchaToken, setCaptchaToken] = useState("");
    const [skipCaptcha, setSkipCaptcha] = useState(false);
    const lastFlashRef = useRef({
        error: null,
        success: null,
        warning: null,
        info: null,
    });

    // Step-Up Modal State
    const [showStepUp, setShowStepUp] = useState(false);
    const [stepUpData, setStepUpData] = useState(null);
    const [stepUpContext, setStepUpContext] = useState(null);
    const [otpCode, setOtpCode] = useState("");
    const [typedConfirmation, setTypedConfirmation] = useState("");
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [resendingOtp, setResendingOtp] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [guestAllowed, setGuestAllowed] = useState(null);

    // Check for flash messages indicating Step-Up is required
    useEffect(() => {
        if (flash?.step_up_required && flash?.step_up_data) {
            setStepUpData(flash.step_up_data);
            setStepUpContext(flash.step_up_context || null);
            setShowStepUp(true);
            setChecking(false);
        }
    }, [flash]);

    useEffect(() => {
        if (flash?.error && flash.error !== lastFlashRef.current.error) {
            lastFlashRef.current.error = flash.error;
            toast.error(flash.error, { id: "cart-error" });
            window.alert(flash.error);
        }
        if (flash?.success && flash.success !== lastFlashRef.current.success) {
            lastFlashRef.current.success = flash.success;
            toast.success(flash.success, { id: "cart-success" });
        }
        if (flash?.warning && flash.warning !== lastFlashRef.current.warning) {
            lastFlashRef.current.warning = flash.warning;
            toast(flash.warning, { id: "cart-warning" });
        }
        if (flash?.info && flash.info !== lastFlashRef.current.info) {
            lastFlashRef.current.info = flash.info;
            toast(flash.info, { id: "cart-info" });
        }
    }, [flash?.error, flash?.success, flash?.warning, flash?.info]);

    useEffect(() => {
        if (auth?.user) {
            setGuestAllowed(true);
            return;
        }
        axios
            .get("/api/risk/limits")
            .then((res) => {
                const allowed = res?.data?.guest_allowed !== false;
                setGuestAllowed(allowed);
            })
            .catch(() => {
                setGuestAllowed(true);
            });
    }, [auth?.user]);

    useEffect(() => {
        if (!debugEnabled) return;
        pushDebug("state_snapshot", {
            isChecked,
            checking,
            hasCaptcha: !!captchaToken,
            skipCaptcha,
            hasAuthUser: !!auth?.user,
            guestAllowed,
            card_capabilities: !!card_capabilities,
            subtotal,
            fee,
        });
    }, [
        debugEnabled,
        pushDebug,
        isChecked,
        checking,
        captchaToken,
        skipCaptcha,
        auth?.user,
        guestAllowed,
        card_capabilities,
        subtotal,
        fee,
    ]);

    useEffect(() => {
        let interval = null;

        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown((prev) => prev - 1);
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [resendCooldown]);

    const [passkeyLoading, setPasskeyLoading] = useState(false);

    // Helper function to encode ArrayBuffer to base64
    const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const formatCredentialForServer = (credential) => {
        const formatted = {
            id: credential.id,
            rawId: arrayBufferToBase64(credential.rawId),
            type: credential.type,
            response: {
                clientDataJSON: arrayBufferToBase64(
                    credential.response.clientDataJSON,
                ),
            },
        };

        if (credential.response.authenticatorData) {
            formatted.response.authenticatorData = arrayBufferToBase64(
                credential.response.authenticatorData,
            );
        }
        if (credential.response.signature) {
            formatted.response.signature = arrayBufferToBase64(
                credential.response.signature,
            );
        }
        if (credential.response.userHandle) {
            formatted.response.userHandle = arrayBufferToBase64(
                credential.response.userHandle,
            );
        }
        if (credential.response.attestationObject) {
            formatted.response.attestationObject = arrayBufferToBase64(
                credential.response.attestationObject,
            );
        }

        return formatted;
    };

    const base64urlToUint8Array = (base64url) => {
        const base64 = base64url
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), "=");

        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    };

    const isWebAuthnSupported = () => {
        return window.PublicKeyCredential !== undefined;
    };

    const [hasPasskey, setHasPasskey] = React.useState(false);

    React.useEffect(() => {
        const checkPasskey = async () => {
            const userEmail =
                (typeof email !== "undefined" ? email : null) ||
                (typeof data !== "undefined" && data?.email
                    ? data.email
                    : null) ||
                auth?.user?.email;
            if (userEmail && isWebAuthnSupported()) {
                try {
                    const res = await axios.post("/webauthn/check", {
                        email: userEmail,
                    });
                    setHasPasskey(res.data.has_passkey);
                } catch (e) {
                    setHasPasskey(false);
                }
            }
        };
        if (typeof showStepUp !== "undefined" && showStepUp) {
            checkPasskey();
        }
    }, [typeof showStepUp !== "undefined" ? showStepUp : false]);

    const handlePasskeyStepUp = async () => {
        try {
            setPasskeyLoading(true);
            const userEmail =
                (typeof email !== "undefined" ? email : null) ||
                (typeof data !== "undefined" && data?.email
                    ? data.email
                    : null) ||
                auth?.user?.email;

            if (!userEmail) {
                toast.error("Email required for passkey verification.");
                setPasskeyLoading(false);
                return;
            }

            const { data: options } = await axios.post(
                route("webauthn.login.options"),
                { email: userEmail },
            );

            const publicKey = options.publicKey ?? options;
            publicKey.challenge = base64urlToUint8Array(publicKey.challenge);

            if (publicKey.allowCredentials) {
                publicKey.allowCredentials = publicKey.allowCredentials.map(
                    (item) => ({
                        ...item,
                        id: base64urlToUint8Array(item.id),
                    }),
                );
            }

            const credential = await navigator.credentials.get({
                publicKey,
            });

            const payload = {
                ...formatCredentialForServer(credential),
                amount:
                    stepUpContext?.amount ||
                    Math.round(
                        (fee + subtotal) *
                            (isZeroDecimalCurrency(chargeCurrency) ? 1 : 100),
                    ),
                currency: stepUpContext?.currency || chargeCurrency,
                creator_id:
                    stepUpContext?.creator_id ||
                    datas?.user?.uuid ||
                    datas?.user?.id,
                email: stepUpContext?.email || email || auth?.user?.email,
                device_id: stepUpContext?.device_id || deviceid,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id,
            };

            const response = await axios.post(
                "/api/risk/step-up/verify-passkey",
                payload,
            );

            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                if (typeof setSkipCaptcha !== "undefined") setSkipCaptcha(true);
                handleSubmit();
            } else {
                toast.error("Passkey verification failed.");
            }
        } catch (error) {
            console.error("Passkey error:", error);
            if (error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else if (error.name === "NotAllowedError") {
                toast.error("Authentication cancelled.");
            } else {
                toast.error("Unable to authenticate. Please try again.");
            }
        } finally {
            setPasskeyLoading(false);
        }
    };

    const isZeroDecimalCurrency = (curr) => {
        const zeroDecimalCurrencies = [
            "BIF",
            "CLP",
            "DJF",
            "GNF",
            "JPY",
            "KMF",
            "KRW",
            "MGA",
            "PYG",
            "RWF",
            "UGX",
            "VND",
            "VUV",
            "XAF",
            "XOF",
            "XPF",
        ];

        return zeroDecimalCurrencies.includes(curr?.toUpperCase());
    };

    const handleResendOtp = async () => {
        try {
            setResendingOtp(true);

            const amountInCents = Math.round(
                (fee + subtotal) *
                    (isZeroDecimalCurrency(chargeCurrency) ? 1 : 100),
            );

            const payload = {
                amount: amountInCents,
                currency: chargeCurrency,
                creator_id: datas?.user?.uuid || datas?.user?.id,
                email: email || auth?.user?.email,
                device_id: deviceid,
                is_checkout_session: true,

                // IMPORTANT
                risk_identity_id: stepUpContext?.risk_identity_id || null,
            };

            console.log("RESEND OTP PAYLOAD", payload);

            const response = await axios.post(
                "/api/risk/step-up/resend",
                payload,
            );

            console.log("RESEND OTP RESPONSE", response?.data);

            if (response?.data?.success) {
                toast.success("OTP resent successfully.");

                // reset timer
                setResendCooldown(30);
            } else {
                toast.error(response?.data?.error || "Failed to resend OTP.");
            }
        } catch (error) {
            console.log("RESEND OTP ERROR", error?.response?.data || error);

            toast.error(
                error?.response?.data?.error ||
                    error?.response?.data?.message ||
                    "Failed to resend OTP.",
            );
        } finally {
            setResendingOtp(false);
        }
    };

    const handleVerifyStepUp = async (e) => {
        e.preventDefault();

        setVerifyingOtp(true);

        try {
            const amountInCents = Math.round(
                (fee + subtotal) *
                    (isZeroDecimalCurrency(chargeCurrency) ? 1 : 100),
            );

            // Debug Log
            console.log("STEP UP VERIFY PAYLOAD", {
                otp: otpCode?.trim(),
                typed_confirmation: typedConfirmation?.toUpperCase()?.trim(),
                amount: amountInCents,
                currency: chargeCurrency,
                creator_id: datas?.user?.uuid || datas?.user?.id,
                email: email || auth?.user?.email,
                device_id: deviceid,
                risk_identity_id: stepUpContext?.risk_identity_id,
            });

            const response = await axios.post("/api/risk/step-up/verify", {
                otp: otpCode?.trim(),
                typed_confirmation: typedConfirmation?.toUpperCase()?.trim(),

                // Required Context
                amount: amountInCents,
                currency: chargeCurrency,
                creator_id: datas?.user?.uuid || datas?.user?.id,
                email: email || auth?.user?.email,
                device_id: deviceid,

                // Important
                is_checkout_session: true,

                // Step Up Context
                risk_identity_id: stepUpContext?.risk_identity_id || null,
            });

            console.log("STEP UP VERIFY RESPONSE", response?.data);

            if (response?.data?.success) {
                toast.success("Identity verified! Proceeding to checkout...");

                setShowStepUp(false);

                setSkipCaptcha(true);

                // Re-trigger checkout
                handleSubmit();
            } else {
                toast.error(response?.data?.error || "Verification failed.");
            }
        } catch (error) {
            console.log(
                "OTP verification FULL error:",
                error?.response?.data || error,
            );

            toast.error(
                error?.response?.data?.error ||
                    error?.response?.data?.message ||
                    "OTP Verification failed.",
            );
        } finally {
            setVerifyingOtp(false);
        }
    };

    const onVerify = useCallback(
        (token) => {
            setCaptchaToken(token || "");
            pushDebug("turnstile_verified", {
                token_len: (token || "").length,
            });
        },
        [pushDebug],
    );

    const handleSubmit = () => {
        pushDebug("checkout_clicked", {
            isChecked,
            checking,
            hasCaptcha: !!captchaToken,
            skipCaptcha,
            hasAuthUser: !!auth?.user,
            creator_id: datas?.user?.id,
        });
        if (!card_capabilities) {
            toast.error("This creator cannot accept payments at the moment.");
            if (debugEnabled) {
                console.warn("DEBUG: creator card_capabilities missing");
            }
            return;
        }
        if (!auth?.user) {
            if (guestAllowed === false) {
                const msg =
                    "Guest checkout is currently disabled. Please log in to continue.";
                pushDebug("blocked_guest_disabled", { msg });
                if (window.confirm("Login Required\n\n" + msg)) {
                    window.location = `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent(msg)}`;
                }
                return;
            }
            const upCurrency = (chargeCurrency || "GBP").toUpperCase();
            const rate = rates?.[upCurrency];
            const totalGbp = rate ? (fee + subtotal) / rate : fee + subtotal;
            if (totalGbp > 50) {
                pushDebug("blocked_guest_high_value", { totalGbp });
                if (
                    window.confirm(
                        "Login required\n\nLarger payments more than £50 need to login.",
                    )
                ) {
                    window.location = `/login?redirect=${encodeURIComponent(window.location.href)}&message=${encodeURIComponent("Larger payments more than £50 need to login.")}`;
                }
                return;
            }
        }
        if (!captchaToken && !skipCaptcha) {
            toast.error("Please complete the CAPTCHA verification.");
            pushDebug("blocked_missing_captcha", { turnstileSiteKey });
            if (debugEnabled) {
                console.warn(
                    "DEBUG: captchaToken is empty. Please complete captcha.",
                );
            }
            return;
        }
        setChecking(true);
        const checkoutUrl =
            auth && auth.user && auth.user.id
                ? `/create-checkout-session/${datas?.user?.id}/${datas?.user?.id || "notid"}`
                : `/create-checkout-session/${datas?.user?.id}/${deviceid}`;

        const queryParams = {
            message: message || "",
            from: name || "",
            email: email || auth?.user?.email || "",
            anonymous: keepAnonmyous ? 1 : 0,
            device_id: deviceid,
            cf_turnstile_response: skipCaptcha ? "" : captchaToken || "",
            digital_waiver: 1,
            debug_id: debugEnabled
                ? `${Date.now()}-${Math.random().toString(16).slice(2)}`
                : undefined,
        };
        pushDebug("navigating_to_checkout", { checkoutUrl, queryParams });
        // Use Inertia navigation instead of window.location.href to properly handle flash messages
        router.visit(checkoutUrl, {
            method: "get",
            data: queryParams,
            onError: (errors) => {
                const msg =
                    (Array.isArray(errors?.cf_turnstile_response)
                        ? errors.cf_turnstile_response[0]
                        : errors?.cf_turnstile_response) ||
                    errors?.message ||
                    errors?.error ||
                    "Checkout failed. Please try again.";
                toast.error(msg, { id: "cart-error-inline" });
                // Remove window.alert(msg) here because it causes the double popup (Inertia flash error effect already catches and alerts)
                pushDebug("checkout_onError", { errors, msg });
                setChecking(false);
                if (turnstileRef.current) {
                    turnstileRef.current.reset();
                }
                setSkipCaptcha(false);
            },
            onFinish: () => {
                pushDebug("checkout_onFinish", {});
                setChecking(false);
            },
        });
    };

    // const executeCaptcha = (e) => {
    //     e.preventDefault();

    //     if (!turnstileSiteKey) {
    //         handleSubmit();
    //         return;
    //     }

    //     if (turnstileRef.current) {
    //         turnstileRef.current.execute();
    //     }
    //     setChecking(true);
    // };

    const [loading, setLoading] = useState(false);
    const [cartCleared, setCartCleared] = useState(false);
    const clearcart = (ownerid, index) => {
        setLoading(true);
        router.get(`/clear-cart/${deviceid}/${ownerid}`, {
            preserveScroll: true,
            onSuccess: (resp) => {
                setCartCleared(true);
                setLoading(false);
                if (index == 0) {
                    window.location.reload = false;
                }
            },
            onError: (_err) => {
                console.error("error", _err);
                setLoading(false);
            },
        });
    };

    const [items, setItems] = useState(datas?.items);
    const removeCart = (id) => {
        const removeUrl =
            auth && auth.user && auth.user.id
                ? `/api/remove-from-cart/${id}`
                : `/api/remove-from-cart/${id}/${deviceid}`;

        axios
            .get(removeUrl, {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            })
            .then((response) => {
                if (response.data.success) {
                    const updatedItems = items.filter(
                        (item) => item.uuid !== id,
                    );
                    setItems(updatedItems || []);
                } else {
                    console.error(
                        "Failed to remove cart item:",
                        response.data.message,
                    );
                }
            })
            .catch((error) => {
                console.error("Error removing cart item:", error);
                if (
                    error.response &&
                    error.response.data &&
                    error.response.data.message
                ) {
                    console.error("Server error:", error.response.data.message);
                }
            });
    };

    function updateTotals() {
        if (!items || items.length === 0) {
            setsubtotal(0);
            setFee(0);
            return;
        }

        // 1. Calculate Total Net (Price + VAT + Shipping)
        const totalNetWithVatAndShipping = items.reduce((total, item) => {
            // Get baseline shipping price (matching ProfileProduct.jsx logic)
            const shippingPrice =
                item?.type === "physical"
                    ? (() => {
                          const shippingRates = item?.shop_shipping_info || [];
                          const baselineRate =
                              shippingRates.find(
                                  (s) =>
                                      s.country?.toLowerCase() === "all" ||
                                      s.country?.toLowerCase() === "worldwide",
                              ) || shippingRates[0];
                          return parseFloat(baselineRate?.shipping_price || 0);
                      })()
                    : 0;

            const vatAmount =
                (parseFloat(item.price || 0) * vatPercentage) / 100;
            const itemNetPlusVatPlusShipping =
                parseFloat(item.price || 0) + vatAmount + shippingPrice;

            return total + itemNetPlusVatPlusShipping * (+item.quantity || 1);
        }, 0);

        // 2. Calculate Total Gross (Supporter Pays) - Fixed fees added ONCE here for optimized transaction
        const breakdown = calculateTotalSupporterPays(
            totalNetWithVatAndShipping,
            chargeCurrency,
        );
        const totalGross = breakdown.total_supporter_pays;

        // 3. Calculate Total Base Net (Listed Price only) for the subtotal display
        const totalBaseNet = items.reduce((total, item) => {
            return total + parseFloat(item.price || 0) * (+item.quantity || 1);
        }, 0);

        setsubtotal(totalBaseNet);
        setFee(totalGross - totalBaseNet);
    }

    const quantityUpdate = (type, amount, tax) => {
        // Instead of manually updating totals, let the useEffect handle it
        // This prevents double calculations and ensures consistency
        setTimeout(() => {
            updateTotals();
        }, 100); // Small delay to ensure cart update API call completes
    };

    useEffect(() => {
        updateTotals();
    }, [items]);

    return (
        <div className={`${cartCleared ? "hidden" : ""} px-2 containerbox`}>
            <Toaster position="top-center" />
            <div className="containerbox mx-auto">
                {/* <div className='hidden md:flex p-4 md:p-6 pinkbg !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center '>
                        <span className=' border-black border-2 bg-red-700 mr-2 md:w-5 h-4 w-4 md:h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-yellow-400 mr-2 h-4 w-4 md:w-5 md:h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-mint mr-2 md:w-5 h-4 w-4 md:h-5 rounded-full block'></span>
                    </div> */}
                <div className="w-full">
                    <div className="cartMain">
                        <h2 className="pb-1 wishtitle fading">
                            Your Basket for {datas?.user?.name || ""}
                            <Link
                                className="text-violet-600"
                                href={`/${datas?.user?.username || ""}`}
                            >
                                (@{datas?.user?.username || ""})
                            </Link>
                        </h2>
                        <p className="md:pb-4 text-lg mt-2 mb-4">
                            You are about to send a payout to{" "}
                            <strong> {datas?.user?.name || ""} </strong> to fund
                            their lifestyle.
                        </p>
                        {debugEnabled ? (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-900 p-3 mb-4 rounded">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="font-semibold">
                                        Cart Checkout Debug
                                    </div>
                                    <button
                                        type="button"
                                        className="border border-yellow-300 px-2 py-1 rounded text-sm"
                                        onClick={() => {
                                            try {
                                                const text = JSON.stringify(
                                                    debugEvents,
                                                    null,
                                                    2,
                                                );
                                                navigator.clipboard?.writeText(
                                                    text,
                                                );
                                                window.alert(
                                                    "Debug copied to clipboard",
                                                );
                                            } catch {
                                                window.alert(
                                                    "Unable to copy debug",
                                                );
                                            }
                                        }}
                                    >
                                        Copy
                                    </button>
                                </div>
                                <pre className="text-xs whitespace-pre-wrap mt-2 max-h-40 overflow-auto">
                                    {JSON.stringify(debugEvents, null, 2)}
                                </pre>
                            </div>
                        ) : null}
                        {!card_capabilities && (
                            <div
                                className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-r"
                                role="alert"
                            >
                                <p className="font-bold">
                                    Payments Unavailable
                                </p>
                                <p>
                                    This creator cannot accept payments at the
                                    moment (Card Payments capability missing).
                                </p>
                            </div>
                        )}
                        <div className="CartItemBox">
                            {items &&
                                items.map((c, i) => {
                                    const itemCurrency =
                                        c?.currency ||
                                        datas?.user?.default_currency ||
                                        chargeCurrency;

                                    // Calculate total price using the same logic as Shop Detail page
                                    // Get baseline shipping price (matching ProfileProduct.jsx logic)
                                    const shippingPrice =
                                        c?.type === "physical"
                                            ? (() => {
                                                  const shippingRates =
                                                      c?.shop_shipping_info ||
                                                      [];
                                                  const baselineRate =
                                                      shippingRates.find(
                                                          (s) =>
                                                              s.country?.toLowerCase() ===
                                                                  "all" ||
                                                              s.country?.toLowerCase() ===
                                                                  "worldwide",
                                                      ) || shippingRates[0];
                                                  return parseFloat(
                                                      baselineRate?.shipping_price ||
                                                          0,
                                                  );
                                              })()
                                            : 0;

                                    const vatAmount =
                                        (parseFloat(c.price || 0) *
                                            vatPercentage) /
                                        100;
                                    const basePriceToGrossUp =
                                        parseFloat(c.price || 0) +
                                        vatAmount +
                                        shippingPrice;

                                    const breakdown =
                                        calculateTotalSupporterPays(
                                            basePriceToGrossUp,
                                            itemCurrency,
                                        );
                                    const itemTotalPrice =
                                        breakdown.total_supporter_pays;

                                    return (
                                        <CartItem
                                            currency={itemCurrency}
                                            quantityUpdate={quantityUpdate}
                                            removeCart={removeCart}
                                            data={c}
                                            key={i}
                                            isLoggedIn={!!auth?.user}
                                            totalPrice={itemTotalPrice}
                                        />
                                    );
                                })}
                        </div>

                        <div className="cartTotal pt-3 pb-6">
                            <div className="fading cartSubTotal text-right mt-2">
                                <strong className="!text-black">Total :</strong>
                                <strong className="!text-right !text-black">
                                    {formatMultiPrice(
                                        fee + subtotal || "",
                                        chargeCurrency,
                                    )}
                                </strong>
                                <div className="text-[10px] text-gray-500 font-normal mt-1 leading-tight text-right">
                                    *Includes platform and payment processing
                                    fees
                                </div>
                            </div>
                        </div>

                        <div className="addMessage">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <ul className="flex flex-wrap">
                                    <li className="fading w-full">
                                        <label>Add Message </label>
                                        <textarea
                                            rows={2}
                                            onChange={(e) =>
                                                setMessage(e.target.value)
                                            }
                                            placeholder="Send some words of support..."
                                        ></textarea>
                                    </li>
                                    <li className="w-full mt-3 fading">
                                        <div className="flex flex-wrap">
                                            <div className="w-full mb-4">
                                                <label className=" text-start w-full">
                                                    Email{" "}
                                                </label>
                                                <p className="text-sm text-gray-500 mb-1">
                                                    Your e-mail remains private.
                                                </p>
                                                <input
                                                    required
                                                    className={`${auth?.user?.email ? "disabled" : ""} border-gray-300 border rounded-[10px] p-3 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 rounded-[12px] md:rounded-[12px] `}
                                                    value={email}
                                                    disabled={
                                                        !!auth?.user?.email
                                                    }
                                                    onChange={(e) =>
                                                        setEmail(e.target.value)
                                                    }
                                                    type="email"
                                                    placeholder="Enter Your Email..."
                                                />
                                            </div>
                                            <div className="w-full mb-4">
                                                <label className="text-start w-full">
                                                    From
                                                </label>
                                                <input
                                                    className="border-gray-300 mt-1 border p-3 w-full focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 !rounded-[10px] "
                                                    onChange={(e) =>
                                                        setName(e.target.value)
                                                    }
                                                    value={name}
                                                    type="text"
                                                    placeholder="Enter Your Name..."
                                                />
                                                {auth && auth.name}
                                                {auth && auth.name}
                                            </div>
                                        </div>
                                    </li>
                                    <li className="cheklistbox fading">
                                        <label
                                            htmlFor="anonymous"
                                            className="text-left"
                                        >
                                            <input
                                                onChange={(e) =>
                                                    setKeepAnonmyous(
                                                        e.target.checked,
                                                    )
                                                }
                                                type="checkbox"
                                                id="anonymous"
                                                name="anonymous"
                                                className="mr-2"
                                                value="anonymous"
                                            ></input>
                                            Keep anonymous
                                        </label>
                                        <p className="text-gray-500 text-sm mb-3">
                                            Your personal email and name will be
                                            private.
                                        </p>

                                        <CheckoutLegalTerms
                                            onAgreeChange={(checked) => {
                                                setIsChecked(checked);
                                                setDigitalWaiver(checked);
                                            }}
                                        />
                                    </li>
                                </ul>
                                {turnstileSiteKey ? (
                                    <div className="flex justify-center my-3">
                                        <Turnstile
                                            ref={turnstileRef}
                                            size="normal"
                                            theme="light"
                                            onVerify={onVerify}
                                        />
                                    </div>
                                ) : null}
                                <div className=" mt-4 sm:flex gap-3 items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            clearcart(datas?.user?.id)
                                        }
                                        className={`  w-full main-button b mb-3 md:!mb-0`}
                                    >
                                        {loading ? "Wait.." : "Clear"}{" "}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            !isChecked ||
                                            !digitalWaiver ||
                                            checking ||
                                            (turnstileSiteKey &&
                                                !captchaToken &&
                                                !skipCaptcha) ||
                                            !card_capabilities
                                        }
                                        onClick={handleSubmit}
                                        className={`${
                                            isChecked &&
                                            digitalWaiver &&
                                            !(
                                                turnstileSiteKey &&
                                                !captchaToken &&
                                                !skipCaptcha
                                            ) &&
                                            !checking &&
                                            card_capabilities
                                                ? ""
                                                : "disabled"
                                        } main-button p w-full`}
                                    >
                                        {checking ? "Wait.." : "Checkout"}{" "}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Step-Up Verification Modal */}
            <Popup
                size="md"
                action={showStepUp}
                space="p-0"
                modalclass="pinkmodal"
                classes="hidden"
            >
                <div className="!rounded-none p-6">
                    <h2 className="text-xl font-bold mb-2 text-center">
                        {stepUpData?.ui?.title || "Confirm Your Payment"}
                    </h2>
                    <p className="text-gray-600 mb-6 text-center">
                        {stepUpData?.ui?.body ||
                            "For your security, please confirm this payment."}
                    </p>
                    <form onSubmit={handleVerifyStepUp}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Enter OTP Code (Check your email)
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                placeholder="e.g. 123456"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value)}
                                required
                            />
                        </div>
                        <div className="mb-4 flex justify-end">
                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resendingOtp || resendCooldown > 0}
                                className={`text-sm font-medium transition-all ${
                                    resendingOtp || resendCooldown > 0
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-pink-600 hover:text-pink-700"
                                }`}
                            >
                                {resendingOtp
                                    ? "Resending OTP..."
                                    : resendCooldown > 0
                                      ? `Resend OTP in ${resendCooldown}s`
                                      : "Resend OTP"}
                            </button>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type 'CONFIRM' to proceed
                            </label>
                            <input
                                type="text"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                placeholder="CONFIRM"
                                value={typedConfirmation}
                                onChange={(e) =>
                                    setTypedConfirmation(e.target.value)
                                }
                                required
                            />
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowStepUp(false);
                                    setSkipCaptcha(false);
                                }}
                                className="w-full main-button b"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={
                                    verifyingOtp ||
                                    !otpCode ||
                                    typedConfirmation.toUpperCase() !==
                                        "CONFIRM"
                                }
                                className={`w-full main-button p ${!otpCode || typedConfirmation.toUpperCase() !== "CONFIRM" || verifyingOtp ? "disabled" : ""}`}
                            >
                                {verifyingOtp
                                    ? "Verifying..."
                                    : "Verify & Checkout"}
                            </button>
                        </div>
                    </form>

                    {isWebAuthnSupported() && hasPasskey && (
                        <div className="mt-6 border-t border-gray-200 pt-6">
                            <button
                                type="button"
                                onClick={handlePasskeyStepUp}
                                disabled={
                                    passkeyLoading ||
                                    (typeof verifyingOtp !== "undefined"
                                        ? verifyingOtp
                                        : false)
                                }
                                className="relative flex flex-row justify-center items-center text-base px-4 py-[10px] focus:outline-none text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 rounded-full transition-all w-full max-w-[260px] mx-auto disabled:opacity-50"
                            >
                                {passkeyLoading ? (
                                    <>
                                        <svg
                                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-pink-500"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            ></circle>
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                        </svg>
                                        Checking device...
                                    </>
                                ) : (
                                    "Use Face ID / Fingerprint"
                                )}
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Bypass OTP by verifying your identity with a
                                saved passkey.
                            </p>
                        </div>
                    )}
                </div>
            </Popup>
        </div>
    );
}
