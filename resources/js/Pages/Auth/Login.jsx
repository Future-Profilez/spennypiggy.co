import { useEffect, useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import GoogleButton, { AuthDivider } from "@/Components/GoogleButton";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";
import EnterOTP from "./EnterOTP";
import SetupPasskeyPrompt from "@/Components/SetupPasskeyPrompt";
import axios from "axios";
import DeviceID from "@/includes/DeviceID";
/**
 * The same field the person filled in to sign UP. Registration was rebuilt around
 * `register/Field.jsx` (label, control, inline status, error) and login kept its own
 * hand-rolled inputs, so the two halves of one flow had different heights, different
 * focus treatment and different error placement. One component, no drift.
 */
import Field from "./register/Field";

// Helper function to convert base64url to Uint8Array for WebAuthn
function base64urlToUint8Array(base64url) {
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
}

// Helper function to encode ArrayBuffer to base64url (important for Android/Chrome)
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    // Return base64url encoded string (replace + with -, / with _, remove =)
    return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Helper function to format WebAuthn credential for the server
function formatCredentialForServer(credential) {
    const formatted = {
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
            clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
        },
    };

    if (credential.response.authenticatorData) {
        formatted.response.authenticatorData = arrayBufferToBase64(credential.response.authenticatorData);
    }
    if (credential.response.signature) {
        formatted.response.signature = arrayBufferToBase64(credential.response.signature);
    }
    if (credential.response.userHandle) {
        formatted.response.userHandle = arrayBufferToBase64(credential.response.userHandle);
    }
    if (credential.response.attestationObject) {
        formatted.response.attestationObject = arrayBufferToBase64(credential.response.attestationObject);
    }

    return formatted;
}

/**
 * A landing page the URL asked for, but only if it is on this site.
 *
 * 🚨 `?redirect=` is attacker-controlled, and it was handed straight to
 * `router.visit()` after a SUCCESSFUL sign-in — the worst place for an open
 * redirect: the person signs in on the real domain, gets a real session, and is
 * then dropped on the attacker's page carrying all the trust of a login that just
 * worked. A "confirm your password" form there is very likely to be believed.
 *
 * Same rules as `GoogleController::safeRedirect()` on the server — keep the two in
 * step: must start with "/", must NOT start with "//" (protocol-relative, which
 * browsers read as another origin), must not start with "/\" (browsers normalise
 * the backslash, making "/\evil.com" equivalent to "//evil.com").
 */
const safeRedirect = (target) => {
    const value = String(target || "").trim();
    if (!value.startsWith("/")) return null;
    if (value.startsWith("//") || value.startsWith("/\\")) return null;
    return value;
};

export default function Login({ status, canResetPassword, googleEnabled = false, google2faPendingEmail = null }) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramValue = safeRedirect(urlParams.get("redirect"));
    const redirectmessage = urlParams.get("message");
    const [open, setOpen] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(null); // null = unknown, true = has passkey, false = no passkey
    const [showSetupPrompt, setShowSetupPrompt] = useState(false);
    const [promptEmail, setPromptEmail] = useState("");
    const [pendingRedirectUrl, setPendingRedirectUrl] = useState(null);
    const [abortController, setAbortController] = useState(null);
    // A reveal toggle, not a second "confirm password" box — the same reasoning that
    // removed confirm-password from registration. Retyping a password you cannot see
    // only ever costs time; being able to read it is what actually prevents the typo.
    const [showPassword, setShowPassword] = useState(false);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
    });

    const [loading, setLoading] = useState(false);
    useEffect(() => {
        setLoading(processing);
    }, [processing]);

    useEffect(() => {
        if (google2faPendingEmail) {
            setData("email", google2faPendingEmail);
            setOpen("open");
        }
    }, [google2faPendingEmail]);

    // Prime CSRF cookie when component mounts
    useEffect(() => {
        axios.get("/csrf-cookie").catch((err) => {
            console.warn("Failed to prime CSRF cookie:", err);
        });
    }, []);

    useEffect(() => {
        return () => {
            reset("password");
        };
    }, []);

    const handleOTPSuccess = async (redirectUrl) => {
        let targetUrl = null;
        if (paramValue) {
            targetUrl = paramValue;
        } else if (redirectUrl) {
            targetUrl = redirectUrl;
        }

        let userHasPasskey = hasPasskey;
        if (userHasPasskey === null && data.email && isWebAuthnSupported()) {
            userHasPasskey = await checkUserHasPasskey(data.email);
            setHasPasskey(userHasPasskey);
        }

        const platformAuthAvailable = await isPlatformAuthenticatorAvailable();

        if (platformAuthAvailable && userHasPasskey === false) {
            // Abort conditional UI before showing prompt
            if (abortController) {
                abortController.abort("Showing setup prompt");
            }
            setPromptEmail(data.email);
            setPendingRedirectUrl(targetUrl);
            setShowSetupPrompt(true);
        } else {
            if (targetUrl) {
                router.visit(targetUrl);
            } else {
                window.location.reload();
            }
        }
    };

    const { flash } = usePage().props;

    const [animate, setAnimate] = useState("");

    // Check if WebAuthn is supported
    const isWebAuthnSupported = () => {
        return typeof window !== 'undefined' && window.PublicKeyCredential !== undefined;
    };

    // Check if platform authenticator (FaceID/Windows Hello) is available
    const isPlatformAuthenticatorAvailable = async () => {
        if (!isWebAuthnSupported()) return false;
        try {
            return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (e) {
            return false;
        }
    };

    // Check if user has passkey registered
    const checkUserHasPasskey = async (email) => {
        if (!email) return false;

        try {
            const response = await axios.post("/webauthn/check", {
                email: email,
            });
            return response.data.has_passkey || false;
        } catch (error) {
            console.error("Error checking passkey:", error);
            return false;
        }
    };

    // Check passkey status when email changes
    useEffect(() => {
        const checkPasskeyStatus = async () => {
            if (data.email && isWebAuthnSupported()) {
                const hasKey = await checkUserHasPasskey(data.email);
                setHasPasskey(hasKey);
            } else {
                setHasPasskey(null);
            }
        };

        const debounceTimer = setTimeout(() => {
            checkPasskeyStatus();
        }, 500); // Debounce to avoid too many requests

        return () => clearTimeout(debounceTimer);
    }, [data.email]);

    // Setup Conditional UI (Autofill) for Passkeys
    useEffect(() => {
        let controller = new AbortController();
        setAbortController(controller);

        const setupConditionalUI = async () => {
            if (
                !isWebAuthnSupported() ||
                !window.PublicKeyCredential.isConditionalMediationAvailable
            ) {
                return;
            }

            const isCMAvailable =
                await window.PublicKeyCredential.isConditionalMediationAvailable();
            if (!isCMAvailable) {
                return;
            }

            try {
                const { data: options } = await axios.post(
                    route("webauthn.login.userless.options"),
                );

                const publicKey = options.publicKey ?? options;
                publicKey.challenge = base64urlToUint8Array(
                    publicKey.challenge,
                );

                const credential = await navigator.credentials.get({
                    publicKey,
                    mediation: "conditional",
                    signal: controller.signal,
                });

                if (credential) {
                    setPasskeyLoading(true);
                    const response = await axios.post(
                        route("webauthn.login"),
                        formatCredentialForServer(credential),
                    );

                    if (response.data.success) {
                        const redirectUrl = response.data.redirect_url || "/";
                        router.visit(redirectUrl);
                    } else {
                        errorAlert(response.data.message || "Passkey login failed");
                        setPasskeyLoading(false);
                    }
                }
            } catch (error) {
                if (error.name !== "AbortError") {
                    console.error("Conditional UI error:", error);
                    if (error.response?.data?.message) {
                        errorAlert(error.response.data.message);
                    }
                }
                setPasskeyLoading(false);
            }
        };

        setupConditionalUI();

        return () => {
            controller.abort("Component unmounted");
        };
    }, []);

    const handlePasskeyLogin = async (fallbackToPassword = false) => {
        setPasskeyLoading(true);
        try {
            const hasEmail = data.email && data.email.trim().length > 0;
            const endpoint = hasEmail
                ? route("webauthn.login.options")
                : route("webauthn.login.userless.options");
            
            const payload = hasEmail ? { email: data.email } : {};

            const { data: options } = await axios.post(endpoint, payload);

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

            if (credential) {
                const response = await axios.post(
                    route("webauthn.login"),
                    formatCredentialForServer(credential),
                );

                if (response.data.success) {
                    const redirectUrl = response.data.redirect_url || "/";
                    window.location.href = redirectUrl;
                } else {
                    if (!fallbackToPassword) {
                        errorAlert(response.data.message || "Passkey login failed");
                    }
                    if (fallbackToPassword) proceedToStandardLogin();
                }
            } else if (fallbackToPassword) {
                proceedToStandardLogin();
            }
        } catch (error) {
            if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
                console.error("Passkey login error:", error);
                if (!fallbackToPassword) {
                    errorAlert("Passkey authentication failed");
                }
            }
            if (fallbackToPassword) {
                proceedToStandardLogin();
            }
        } finally {
            setPasskeyLoading(false);
        }
    };

    const proceedToStandardLogin = () => {
        // Re-entrancy guard. The disabled re-render loses the double-tap race, and
        // each extra submit spends one of the five attempts the login throttle allows.
        if (loading) return;
        if (!data.email.trim() || !data.password) {
            errorAlert("Enter your email address and password.");
            return;
        }
        setLoading(true);
        axios
            .post(route("verifyUser"), data)
            .then((resp) => {
                if (resp.data.status) {
                    if (resp.data.is_2fa) {
                        setOpen("open");
                        setLoading(false);
                        setTimeout(() => {
                            setOpen(false);
                        }, 1000);
                    } else {
                        submit();
                    }
                } else {
                    errorAlert(resp.data.msg);
                    setLoading(false);
                }
            })
            .catch((err) => {
                console.error("Verify user error:", err);
                if (
                    err.response &&
                    err.response.data &&
                    err.response.data.message
                ) {
                    errorAlert(err.response.data.message);
                } else if (
                    err.response &&
                    err.response.data &&
                    err.response.data.msg
                ) {
                    errorAlert(err.response.data.msg);
                } else if (err.message) {
                    errorAlert(err.message);
                } else {
                    errorAlert(
                        "An error occurred during login. Please try again.",
                    );
                }
                setLoading(false);
            });
    };

    const submit = (e) => {
        setAnimate("");
        const deviceId = DeviceID();
        const loginData = {
            ...data,
            device_id: deviceId,
        };
        setLoading(true);

        axios
            .post(route("login-user"), loginData, {
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            })
            .then(async (response) => {
                localStorage.removeItem("cart");
                
                let targetUrl = null;
                if (paramValue) {
                    targetUrl = paramValue;
                } else if (response.data && response.data.redirect_url) {
                    targetUrl = response.data.redirect_url;
                }

                let userHasPasskey = hasPasskey;
                if (userHasPasskey === null && data.email && isWebAuthnSupported()) {
                    userHasPasskey = await checkUserHasPasskey(data.email);
                    setHasPasskey(userHasPasskey);
                }
                
                const platformAuthAvailable = await isPlatformAuthenticatorAvailable();
                
                if (platformAuthAvailable && userHasPasskey === false) {
                    // Abort conditional UI before showing prompt
                    if (abortController) {
                        abortController.abort("Showing setup prompt");
                    }
                    setPromptEmail(data.email);
                    setPendingRedirectUrl(targetUrl);
                    setShowSetupPrompt(true);
                    setLoading(false);
                } else {
                    if (targetUrl) {
                        router.visit(targetUrl);
                    } else {
                        window.location.reload();
                    }
                }
                reset();
            })
            .catch((error) => {
                setLoading(false);
                setAnimate("animate-shake");
                reset("password");

                // One toast, not two. `LoginRequest` returns `message` AND
                // `errors.email` carrying the SAME string, so showing both put the
                // identical failure on screen twice.
                const payload = error.response?.data;
                const fieldErrors = Object.values(payload?.errors || {})
                    .flat()
                    .filter(Boolean);

                if (fieldErrors.length) {
                    fieldErrors.forEach((message) => errorAlert(message));
                } else if (payload?.message) {
                    errorAlert(payload.message);
                } else {
                    errorAlert("We couldn't sign you in. Please try again.");
                }
            });
    };

    const checkTFA = async (e) => {
        e.preventDefault();

        // Standard LOG IN always uses password. Passkey is opt-in via the
        // dedicated "LOG IN WITH PASSKEY" button + Safari autofill (conditional UI).
        // We do NOT auto-trigger the passkey chooser here: `hasPasskey` only tells us
        // the user registered a passkey on *some* device, not on *this* one — so on a
        // device without a local passkey (e.g. Safari on a new machine) it popped a
        // cross-device/QR chooser at every login and blocked password sign-in.
        proceedToStandardLogin();
    };


  

    const handlePromptClose = () => {
        setShowSetupPrompt(false);
        if (pendingRedirectUrl) {
            router.visit(pendingRedirectUrl);
        } else {
            window.location.reload();
        }
    };

    const getPasskeyButtonText = () => {
        return "LOG IN WITH PASSKEY";
    };

    const getPasskeyButtonStyle = () => {
 return "bg-white border-2 border-black hover:bg-gray-50 transition-all duration-200 active:translate-x-[1px] active:translate-y-[1px]";
    };

    const handlePasskeyAction = (e) => {
        e.preventDefault();
        handlePasskeyLogin(false);
    };

    return (
        <GuestLayout>
            <Head title="Log in" description="Log in to your account" />

            {/*
                Registration is on #0B0B0C with a single accent wash and a white
                bordered panel; login was on mint green inside a fake browser window
                (traffic-light dots), so the two halves of one flow read as two
                different products. Same shell, same panel, same fields.

                The accent here is MINT, deliberately neither of registration's two:
                pink is the creator's colour and violet the supporter's, and this one
                screen serves both — picking either would signal a role the page
                cannot know yet.

                `Header` already renders its own 75px spacer, so this only adds
                breathing room on top of it.
            */}
 <div className="relative flex min-h-[85dvh] flex-col justify-center overflow-hidden bg-[#0B0B0C] px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-8 sm:px-6 sm:pt-12 lg:py-16">
                <div
                    aria-hidden="true"
                    /* Follows the content now the page centres it — pinned to top-0 it
                       sat in empty space above the fold on a tall desktop viewport. */
                    className="pointer-events-none absolute inset-0 opacity-20"
                    style={{
                        background:
                            "radial-gradient(55% 55% at 50% 38%, #05EFB8 0%, transparent 70%)",
                    }}
                />

                {/*
                    Two columns from `lg`: the words on the left, the form on the right.

                    ONE DOM order — heading, form, then the other doors — so a phone
                    stacks in the order someone actually uses them and the guest block
                    still lands BELOW the form. The desktop split is explicit cell
                    placement, never a second copy of the markup.

                    Both columns start at the same line: the panel's top edge against the
                    top of the headline. Rows are `auto`, never `1fr 1fr` — equal
                    fractions force the short row under the heading to match the
                    heading's own height, which inflates the block and drops the panel
                    down the page against nothing.
                */}
                <div className="relative mx-auto grid w-full max-w-[440px] gap-6 lg:max-w-[980px] lg:grid-cols-[minmax(0,1fr)_440px] lg:grid-rows-[auto_auto] lg:gap-x-14 lg:gap-y-6">
                    <header className="lg:col-start-1 lg:row-start-1 lg:self-start">
                        <h1 className="font-gulfs text-3xl uppercase leading-[1.05] text-white sm:text-4xl lg:text-[52px] lg:leading-[0.95]">
                            Welcome back
                        </h1>
                        {/* The house device: the accent carries as a rule under the
                            headline rather than colouring the type. */}
                        <span
                            aria-hidden="true"
                            className="mt-4 block h-1 w-16 rounded-full bg-[#05EFB8]"
                        />
                        <p className="mt-4 max-w-[34ch] text-sm text-white/70 lg:text-base">
                            Sign in to reach your dashboard, your purchases and
                            your payouts.
                        </p>
                    </header>

                    {/* The banners belong to the form, so they travel with it.
                        `self-start` so the panel's top edge lines up with the top of
                        the headline. */}
                    <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-start">
                    {status && (
                        <p className="mb-4 rounded-box-sm border-2 border-[#05EFB8]/40 bg-[#05EFB8]/10 px-4 py-3 text-sm font-medium text-[#05EFB8]">
                            {status}
                        </p>
                    )}

                    {/* 🚨 THE FLASH IS RENDERED TOO, NOT JUST `?message=`.
                        `flash` was destructured on this page and never used, so
                        every controller that sends a guest here with
                        `->with('error', …)` — buying a Bill or a Membership,
                        which both require an account — dropped them on a login
                        screen with NO explanation at all. The message was
                        written, stored and thrown away. The wish path uses a
                        query parameter and was the only one that ever showed.

                        ⚠️ Both are rendered, never one or the other: a redirect
                        can carry either, and preferring one silently loses the
                        other. */}
                    {(redirectmessage || flash?.error) && (
                        <p
                            role="alert"
                            className="mb-4 rounded-box-sm border-2 border-[#FF3B30]/50 bg-[#FF3B30]/10 px-4 py-3 text-sm font-medium text-[#FF8A80]"
                        >
                            {redirectmessage || flash.error}
                        </p>
                    )}

                    <div
 className={`${animate} motion-reduce:animate-none rounded-box border-[3px] border-black bg-white p-4 sm:p-6`}
                    >
                        <div>
                            <form onSubmit={checkTFA} className="space-y-4" noValidate>

                                {/* `autoComplete="username webauthn"` is what the passkey
                                    conditional-UI (Safari autofill) binds to — it is not
                                    decoration, do not shorten it. */}
                                <Field
                                    id="email"
                                    label="Email address"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username webauthn"
                                    autoFocus
                                    placeholder="you@example.com"
                                    error={errors.email}
                                    status={errors.email ? "error" : "idle"}
                                    onChange={(e) => setData("email", e.target.value)}
                                />

                                <Field
                                    id="password"
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password webauthn"
                                    placeholder="Your password"
                                    error={errors.password}
                                    status={errors.password ? "error" : "idle"}
                                    onChange={(e) => setData("password", e.target.value)}
                                    suffix={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((v) => !v)}
                                            aria-label={
                                                showPassword
                                                    ? "Hide password"
                                                    : "Show password"
                                            }
                                            aria-pressed={showPassword}
                                            className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-black/60 transition-colors hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                                        >
                                            {showPassword ? (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M3 3l18 18" />
                                                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                                                    <path d="M16.7 16.7A9.7 9.7 0 0 1 12 18c-5 0-9-6-9-6a17 17 0 0 1 4.2-4.7m3-1.1A9.7 9.7 0 0 1 12 6c5 0 9 6 9 6a17 17 0 0 1-2.2 2.8" />
                                                </svg>
                                            ) : (
                                                <svg
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="h-5 w-5"
                                                    aria-hidden="true"
                                                >
                                                    <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6Z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            )}
                                        </button>
                                    }
                                />

                                {/* One row, two jobs. These were three centred grey links
                                    stacked under the password — all the same weight, so
                                    none of them was findable. */}
                                <div className="flex items-center justify-between gap-3 pt-1">
 {/* ⚠️ min-h-[44px] on the LABEL, not the box. Measured at
 390px the row was 20px tall; the checkbox itself stays
 small because the label is the real tap target. */}
 <label className="flex min-h-[44px] cursor-pointer select-none items-center gap-2 text-sm text-black/70">
                                        <input
                                            type="checkbox"
                                            name="remember"
                                            checked={data.remember}
                                            onChange={(e) =>
                                                setData("remember", e.target.checked)
                                            }
                                            /* Inline, because index.css styles every
                                               checkbox on the site pink — a third colour
                                               inside a mint-accented panel. */
                                            style={{ accentColor: "#000000" }}
                                            className="h-4 w-4 cursor-pointer"
                                        />
                                        Remember me
                                    </label>

                                    {canResetPassword && (
                                        <Link
                                            method="get"
                                            href={route("password.request")}
 className="inline-flex min-h-[44px] items-center text-sm font-semibold text-black underline decoration-2 underline-offset-4 transition-colors hover:text-[#FF007F]"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>

                                <LoaderButton
                                    disabled={loading || passkeyLoading}
                                    className={`!mt-5 flex min-h-[56px] w-full items-center justify-center rounded-box-sm border-[3px] border-black !bg-[#05EFB8] font-gulfs text-base uppercase tracking-[0.14em] !text-black transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20 motion-reduce:hover:translate-y-0 ${
                                        loading || passkeyLoading
                                            ? "cursor-not-allowed opacity-70 hover:translate-y-0"
                                            : ""
                                    }`}
                                    spinnerclass="fill-black"
                                >
                                    {loading || passkeyLoading
                                        ? "Signing in…"
                                        : "Sign in"}
                                </LoaderButton>

                                {/* Below the password form, not above it: most people arriving
                                    here already have a password. `tone="light"` because this
                                    card is white, unlike the register page. */}
                                {googleEnabled && (
                                    <div>
                                        <AuthDivider tone="light" />
                                        <GoogleButton enabled />
                                    </div>
                                )}

                                {/* Smart Passkey Button */}
                                {isWebAuthnSupported() && (
                                    <div className="hidden space-y-2 pt-2">
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-200"></div>
                                            </div>
                                            <div className="relative flex justify-center text-xs uppercase">
 <span className="px-2 bg-white text-black/60">
                                                    Or use passkey
                                                </span>
                                            </div>
                                        </div>
                                        <LoaderButton
                                            type="button"
                                            onClick={handlePasskeyAction}
                                            disabled={passkeyLoading || loading}
                                            className={`relative flex flex-row items-center text-lg px-4 py-[8px] focus:outline-none text-gray-700 border-l-4 border-transparent ${getPasskeyButtonStyle()} hover:!text-black pr-6 !text-black w-full ${(passkeyLoading || loading) ? "opacity-70 cursor-not-allowed" : ""}`}
                                            spinnerclass="fill-black"
                                        >
                                            <div className="flex items-center justify-center w-full space-x-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
                                                    <path d="M12 6c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z"/>
                                                    <path d="M12 9c-1.654 0-3 1.346-3 3s1.346 3 3 3 3-1.346 3-3-1.346-3-3-3z"/>
                                                </svg>
                                                <span>{passkeyLoading ? "LOGGING IN..." : getPasskeyButtonText()}</span>
                                            </div>
                                        </LoaderButton>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                    </div>

                    {/* The other two doors. Second in the DOM after the form, so a
                        phone reads password → sign up → no account; on desktop they
                        sit under the heading in the left column. */}
                    <aside className="lg:col-start-1 lg:row-start-2 lg:self-start">
                    <p className="text-center text-sm text-white/60 lg:text-left">
                        New to Spenny Piggy?{" "}
 {/* ⚠️ This link sits INSIDE a sentence, so it cannot take a 44px
 height without breaking the line. `py-3 -my-3` grows the hit
 area to ~44px and pulls the same amount back off the layout,
 so the tap target is real and nothing moves. */}
                        <Link
                            href={route("register")}
 className="inline-block py-3 -my-3 font-semibold text-[#05EFB8] underline decoration-2 underline-offset-4"
                        >
                            Create an account
                        </Link>
                    </p>

                    {/*
                        Its own row, not a grey link among the password footnotes.
                        Guest checkout is allowed on Piggy Pot, Wishes and the Piggy
                        Bank, so a real supporter can be here with no account at all —
                        trying to sign in is exactly what they do when the receipt
                        email is gone, and this page is the only thing that catches
                        them. They are a different person from everyone else on this
                        screen, so they get a different block.
                    */}
                    <div className="mt-6 rounded-box-sm border-2 border-dashed border-white/20 bg-white/5 p-4">
                        <p className="text-sm font-semibold text-white">
                            Bought something without an account?
                        </p>
                        <p className="mt-1 text-sm text-white/60">
                            There is nothing to sign in to — we'll email your
                            purchases to the address you paid with.
                        </p>
                        <Link
                            method="get"
                            href={route("guest-purchases.form")}
                            className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-[#05EFB8] underline decoration-2 underline-offset-4"
                        >
                            Find my purchase
                        </Link>
                    </div>
                    </aside>
                </div>
            </div>
            <EnterOTP
                action={open}
                user={data}
                hasPasskey={hasPasskey}
                onSuccess={handleOTPSuccess}
                onHide={() => {
                    if (google2faPendingEmail) {
                        router.post(route("auth.google.cancel", { target: "login" }));
                    }
                }}
            />
            <SetupPasskeyPrompt
                isOpen={showSetupPrompt}
                email={promptEmail}
                onSkip={handlePromptClose}
                onSuccess={handlePromptClose}
                silent={true}
            />
        </GuestLayout>
    );
}
