import { useEffect, useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";
import InputError from "@/Components/InputError";
import EnterOTP from "./EnterOTP";
import SetupPasskeyPrompt from "@/Components/SetupPasskeyPrompt";
import axios from "axios";
import DeviceID from "@/includes/DeviceID";
import { FaCircleUser } from "react-icons/fa6";
import { RiLockPasswordLine } from "react-icons/ri";

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

export default function Login({ status, canResetPassword }) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramValue = urlParams.get("redirect");
    const redirectmessage = urlParams.get("message");
    const [open, setOpen] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(null); // null = unknown, true = has passkey, false = no passkey
    const [showSetupPrompt, setShowSetupPrompt] = useState(false);
    const [promptEmail, setPromptEmail] = useState("");
    const [pendingRedirectUrl, setPendingRedirectUrl] = useState(null);
    const [abortController, setAbortController] = useState(null);
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

        if (isWebAuthnSupported() && userHasPasskey === false) {
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

    const handlePasskeyLogin = async () => {
        setPasskeyLoading(true);
        try {
            const { data: options } = await axios.post(
                route("webauthn.login.userless.options"),
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

            if (credential) {
                const response = await axios.post(
                    route("webauthn.login"),
                    formatCredentialForServer(credential),
                );

                if (response.data.success) {
                    const redirectUrl = response.data.redirect_url || "/";
                    window.location.href = redirectUrl;
                } else {
                    errorAlert(response.data.message || "Passkey login failed");
                }
            }
        } catch (error) {
            if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
                console.error("Passkey login error:", error);
                errorAlert("Passkey authentication failed");
            }
        } finally {
            setPasskeyLoading(false);
        }
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
                
                if (isWebAuthnSupported() && userHasPasskey === false) {
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

                if (error.response) {
                    if (error.response.data?.message) {
                        errorAlert(error.response.data.message);
                    }

                    if (error.response.data?.errors) {
                        Object.entries(error.response.data.errors).forEach(
                            ([field, messages]) => {
                                if (Array.isArray(messages)) {
                                    messages.forEach((message) =>
                                        errorAlert(message),
                                    );
                                }
                            },
                        );
                    }
                }
            });
    };

    const checkTFA = async (e) => {
        e.preventDefault();
        
        // If user has a passkey and is using a supported browser, 
        // try passkey login first for a seamless "system prompt" experience
        if (isWebAuthnSupported() && hasPasskey === true) {
            handlePasskeyLogin();
            return;
        }

        setLoading(true);
        axios
            .post("/verify-user", data)
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


  

    const handlePromptClose = () => {
        setShowSetupPrompt(false);
        if (pendingRedirectUrl) {
            router.visit(pendingRedirectUrl);
        } else {
            window.location.reload();
        }
    };

    console.log("hasPasskey:", isWebAuthnSupported());

    return (
        <GuestLayout className="bg-[#A2E4B8]">
            <Head title="Log in" description="Log in to your account" />
            <div className="min-h-[90vh]  relative flex flex-col items-center justify-center py-12 md:py-18 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Decorative Background Elements */}
                {/* <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-float"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-float-delayed"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[128px] animate-pulse"></div>
                </div> */}   

                {status && (
                    <div className="mb-6 font-medium text-sm text-green-400 bg-green-900/30 px-4 py-2 rounded-[30px] border border-green-500/30 backdrop-blur-sm relative z-20">
                        {status}
                    </div>
                )}

                <div className="relative w-full">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl md:text-5xl lg:text-6xl font-gulfs whitespace-nowrap text-black uppercase tracking-wider mb-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Welcome{" "}
                            <span className="text-gradient-wishlist">
                                Back!
                            </span>
                        </h2>
                        <h1 className="hidden">Login to your account.</h1>
                        <p className="text-gray-800 text-lg font-medium">
                            Don't have an account?{" "}
                            <Link
                                href={route("register")}
                                className="text-pink-500 hover:text-pink-400 font-bold transition-all duration-300 hover:underline decoration-2 underline-offset-4"
                            >
                                Signup
                            </Link>
                        </p>
                    </div>

                    <div className="max-w-md m-auto bg-white rounded-[30px] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
                        <div className="!border-r-0 !border-l-0 !border-t-0 border-b border-black flex items-center p-4 space-x-2 rounded-t-xl">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>

                        <div className="p-6 sm:p-8   rounded-b-xl">
                            <form onSubmit={checkTFA} className="space-y-6">
                                {redirectmessage && (
                                    <p className="text-center font-bold text-red-400 text-sm bg-red-900/20 py-2 rounded-[30px] border border-red-500/20 animate-pulse">
                                        {redirectmessage}
                                    </p>
                                )}

                                {/* Quick Login with Fingerprint/Face/Windows Hello Button */}
                                 

                                {/* OR Divider */}
                                {/* <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-600"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-black/20 text-gray-400 backdrop-blur-sm">
                                            OR LOGIN WITH EMAIL
                                        </span>
                                    </div>
                                </div> */}

                                <div>
                                    <label
                                        className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide"
                                        htmlFor="email"
                                    >
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-[20px] opacity-0 group-focus-within:opacity-75 transition duration-300 blur-sm"></div>
                                        <FaCircleUser
                                            size="24"
                                            color="#000000"
                                            className="absolute top-[15px] left-3 z-1 login-icon"
                                        />
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className={`${animate} relative w-full bg-white border border-gray-700 text-black text-lg rounded-[20px] focus:ring-0 focus:border-transparent block py-[12px] px-3 placeholder-gray-500 !ps-[40px] transition-all duration-300`}
                                            autoComplete="username webauthn"
                                            autoFocus={true}
                                            placeholder="you@example.com"
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
                                        />
                                    </div>
                                    <InputError
                                        message={errors.email}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <label
                                        className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide"
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>
                                    <div className="relative group relative">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-[20px] opacity-0 group-focus-within:opacity-75 transition duration-300 blur-sm"></div>
                                        <RiLockPasswordLine
                                            color="#000000"
                                            size="24"
                                            className="absolute top-[14px] left-3 z-1 login-icon"
                                        />
                                        <input
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className={`${animate} relative w-full bg-white border border-gray-700 text-black text-lg rounded-[20px] focus:ring-0 focus:border-transparent block py-[12px] px-3 placeholder-gray-500 transition-all duration-300 !ps-[40px]`}
                                            autoComplete="current-password webauthn"
                                            placeholder="••••••••"
                                            onChange={(e) =>
                                                setData(
                                                    "password",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <InputError
                                        message={errors.password}
                                        className="mt-2"
                                    />

                                    {canResetPassword && (
                                        <div className="flex justify-center mt-2 relative z-1">
                                            <Link
                                                method="get"
                                                href={route("password.request")}
                                                className="!cursor-pointer text-sm text-gray-600 hover:text-black transition-colors duration-200"
                                            >
                                                Forgot your password?
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Login Button */}
                                <div>
                                    <LoaderButton
                                        disabled={loading}
                                        className={`${animate} ${loading || passkeyLoading ? "!animate-pulse !bg-green-400 text-white" : ""} relative flex flex-row items-center text-xl px-4 py-[10px] focus:outline-none text-gray-600 border-l-4 border-transparent hover:!bg-pink-500 hover:!text-white pr-6 bg-black !text-white w-full`}
                                        spinnerclass="fill-white"
                                    >   
                                        {loading || passkeyLoading ? "Logging In..." : "LOG IN"}
                                    </LoaderButton>
                                </div>

                                {/* Single Smart Passkey Button for Email Users */}
                                {/* {isWebAuthnSupported() && hasPasskey === true && (
                                    <div className="space-y-2">
                                        <LoaderButton
                                            type="button"
                                            onClick={handlePasskeyAction}
                                            disabled={passkeyLoading}
                                            className={`relative flex flex-row items-center text-xl px-4 py-[10px] focus:outline-none text-gray-600 border-l-4 border-transparent ${getPasskeyButtonStyle()} hover:!text-white pr-6 !text-black w-full ${passkeyLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                            spinnerclass="fill-white"
                                        >
                                            {passkeyLoading
                                                ? "LOGGING WITH PASSKEY..."
                                                : getPasskeyButtonText()}
                                        </LoaderButton>
                                        <p className="text-xs text-gray-500 text-center">
                                            Use your fingerprint, face ID, or security key to login instantly
                                        </p>
                                    </div>
                                )} */}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <EnterOTP action={open} user={data} hasPasskey={hasPasskey} onSuccess={handleOTPSuccess} />
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
