import { useEffect, useState } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";
import InputError from "@/Components/InputError";
import EnterOTP from "./EnterOTP";
import axios from "axios";
import DeviceID from "@/includes/DeviceID";
import { FaCircleUser } from "react-icons/fa6";
import { RiLockPasswordLine } from "react-icons/ri";
import * as webauthn from "@github/webauthn-json";

export default function Login({ status, canResetPassword }) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramValue = urlParams.get("redirect");
    const redirectmessage = urlParams.get("message");
    const [open, setOpen] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(null); // null = unknown, true = has passkey, false = no passkey
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

    const { flash } = usePage().props;

    const [animate, setAnimate] = useState("");

    // Check if WebAuthn is supported
    const isWebAuthnSupported = () => {
        return window.PublicKeyCredential !== undefined;
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

    const handlePasskeyAction = async () => {
        if (!data.email) {
            errorAlert("Enter email first");
            return;
        }

        setPasskeyLoading(true);

        try {
            /*
        LOGIN FLOW
        */

            if (hasPasskey === true) {
                const options = await axios.post("/webauthn/login/options", {
                    email: data.email,
                });

                const credential = await webauthn.get(options.data);

                const response = await axios.post(
                    "/webauthn/login",
                    credential,
                );

                if (response.data?.redirect_url) {
                    router.visit(response.data.redirect_url);
                } else {
                    window.location.reload();
                }
            } else {

            /*
        REGISTER FLOW
        */
                const options = await axios.post("/webauthn/register/options", {
                    email: data.email,
                });
                console.log("Registration options:", options.data);

                const credential = await webauthn.create(options.data);

                await axios.post("/webauthn/register", credential);

                successAlert("Fingerprint / Face ID registered successfully");

                setHasPasskey(true);
            }
        } catch (error) {
            console.log(error);

            if (hasPasskey) {
                errorAlert("Fingerprint login failed");
            } else {
                errorAlert("Passkey registration failed");
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
            .then((response) => {
                localStorage.removeItem("cart");
                reset();
                if (paramValue) {
                    router.visit(paramValue);
                    setAnimate("animate-pulse");
                } else if (response.data && response.data.redirect_url) {
                    router.visit(response.data.redirect_url);
                } else {
                    window.location.reload();
                }
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

    const checkTFA = (e) => {
        e.preventDefault();
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

    // Get button text based on state
    const getPasskeyButtonText = () => {
        if (passkeyLoading) return "PROCESSING...";
        if (hasPasskey === true) return "LOGIN WITH PASSKEY";
        if (hasPasskey === false) return "REGISTER PASSKEY";
        return "SETUP PASSKEY";
    };

    // Get button styling based on state
    const getPasskeyButtonStyle = () => {
        if (hasPasskey === true) {
            return "hover:!bg-green-500"; // Green for login
        }
        return "hover:!bg-purple-500"; // Purple for registration
    };

    return (
        <GuestLayout>
            <Head title="Log in" description="Log in to your account" />
            <div className="min-h-[90vh] bg-black relative flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-float"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-float-delayed"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full mix-blend-screen filter blur-[128px] animate-pulse"></div>
                </div>

                {status && (
                    <div className="mb-6 font-medium text-sm text-green-400 bg-green-900/30 px-4 py-2 rounded-[30px] md:rounded-[40px] border border-green-500/30 backdrop-blur-sm relative z-20">
                        {status}
                    </div>
                )}

                <div className="relative w-full">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl md:text-5xl font-gulfs whitespace-nowrap text-white uppercase tracking-wider mb-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Welcome{" "}
                            <span className="text-gradient-wishlist">
                                Back!
                            </span>
                        </h2>
                        <h1 className="hidden">Login to your account.</h1>
                        <p className="text-gray-400 text-lg font-medium">
                            Don't have an account?{" "}
                            <Link
                                href={route("register")}
                                className="text-pink-500 hover:text-pink-400 font-bold transition-all duration-300 hover:underline decoration-2 underline-offset-4"
                            >
                                Signup
                            </Link>
                        </p>
                    </div>

                    <div className="max-w-md m-auto !bg-black/20 backdrop-blur-xl border !border-pink-500/40 rounded-[30px] md:rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="!bg-[#121212]/20 border-b border-pink-500/30 flex items-center p-4 space-x-2 rounded-t-xl">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>

                        <div className="p-6 sm:p-8 bg-black/20 rounded-b-xl">
                            <form onSubmit={checkTFA} className="space-y-6">
                                {redirectmessage && (
                                    <p className="text-center font-bold text-red-400 text-sm bg-red-900/20 py-2 rounded-[30px] md:rounded-[40px] border border-red-500/20 animate-pulse">
                                        {redirectmessage}
                                    </p>
                                )}

                                <div>
                                    <label
                                        className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide"
                                        htmlFor="email"
                                    >
                                        Email Address
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-[30px] md:rounded-[40px] opacity-0 group-focus-within:opacity-75 transition duration-300 blur-sm"></div>
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
                                            className={`${animate} relative w-full bg-white border border-gray-700 text-black text-lg rounded-[30px] md:rounded-[40px] focus:ring-0 focus:border-transparent block py-[12px] px-3 placeholder-gray-500 !ps-[40px] transition-all duration-300`}
                                            autoComplete="username"
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
                                        className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-wide"
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>
                                    <div className="relative group relative">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-[30px] md:rounded-[40px] opacity-0 group-focus-within:opacity-75 transition duration-300 blur-sm"></div>
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
                                            className={`${animate} relative w-full bg-white border border-gray-700 text-black text-lg rounded-[30px] md:rounded-[40px] focus:ring-0 focus:border-transparent block py-[12px] px-3 placeholder-gray-500 transition-all duration-300 !ps-[40px]`}
                                            autoComplete="current-password"
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
                                        <div className="flex justify-end mt-2 relative z-1">
                                            <Link
                                                method="get"
                                                href={route("password.request")}
                                                className="!cursor-pointer text-sm text-gray-400 hover:text-white transition-colors duration-200"
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
                                        className={`${animate} ${loading ? "!animate-pulse" : ""} relative flex flex-row items-center text-xl px-4 py-[10px] focus:outline-none text-gray-600 border-l-4 border-transparent hover:!bg-pink-500 hover:!text-white pr-6 !text-black w-full`}
                                        spinnerclass="fill-white"
                                    >
                                        {loading ? "Logging In..." : "LOG IN"}
                                    </LoaderButton>
                                </div>

                                {/* OR Divider */}
                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-gray-600"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-2 bg-black/20 text-gray-400 backdrop-blur-sm">
                                            OR
                                        </span>
                                    </div>
                                </div>

                                {/* Single Smart Passkey Button */}
                                {isWebAuthnSupported() && (
                                    <div className="space-y-2">
                                        <LoaderButton
                                            type="button"
                                            onClick={handlePasskeyAction}
                                            disabled={
                                                passkeyLoading ||
                                                !data.email ||
                                                hasPasskey === null
                                            }
                                            className={`relative flex flex-row items-center text-xl px-4 py-[10px] focus:outline-none text-gray-600 border-l-4 border-transparent ${getPasskeyButtonStyle()} hover:!text-white pr-6 !text-black w-full ${passkeyLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                                            spinnerclass="fill-white"
                                        >
                                            {passkeyLoading
                                                ? hasPasskey === true
                                                    ? "LOGGING WITH PASSKEY..."
                                                    : "REGISTERING PASSKEY..."
                                                : getPasskeyButtonText()}
                                        </LoaderButton>
                                        <p className="text-xs text-gray-500 text-center">
                                            {hasPasskey === true
                                                ? "Use your fingerprint, face ID, or security key to login instantly"
                                                : hasPasskey === false
                                                  ? "Register your fingerprint, face ID, or security key for faster login"
                                                  : "Enter email to check passkey availability"}
                                        </p>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <EnterOTP action={open} user={data} />
        </GuestLayout>
    );
}
