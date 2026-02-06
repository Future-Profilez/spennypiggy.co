import { useEffect } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";
import InputError from "@/Components/InputError";
import EnterOTP from "./EnterOTP";
import axios from "axios";
import { useState } from "react";
import DeviceID from "@/includes/DeviceID";
import { HiOutlineMail } from "react-icons/hi";
import { RiLockPasswordLine } from "react-icons/ri";

export default function Login({ status, canResetPassword }) {
    const urlParams = new URLSearchParams(window.location.search);
    const paramValue = urlParams.get("redirect");
    const redirectmessage = urlParams.get("message");
    const [open, setOpen] = useState(false);
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
    // useEffect(() => {
    //     if(errors){
    //         Object.entries(errors).forEach(([key, value]) => {
    //             errorAlert(value);
    //         });
    //     }
    //     if (flash?.error) {
    //         errorAlert(flash.error);
    //     }
    //     if (flash?.success) {
    //         successAlert(flash.success);
    //     }
    //     if (flash?.warning) {
    //         warningAlert(flash.warning);
    //     }
    //     if (flash?.info) {
    //         successAlert(flash.info);
    //     }
    // },[]);

    const submit = (e) => {
        const deviceId = DeviceID();
        const loginData = {
            ...data,
            device_id: deviceId,
        };
        setLoading(true);

        // axios will automatically handle CSRF token from cookie
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
                } else if (response.data && response.data.redirect_url) {
                    router.visit(response.data.redirect_url);
                } else {
                    window.location.reload();
                }
            })
            .catch((error) => {
                setLoading(false);
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

                // if (error.response) {
                //     if (error.response.status === 422 || error.response.status === 429) {
                //         const errorData = error.response.data;
                //         if (errorData.message) {
                //             errorAlert(errorData.message);
                //         }
                //         if (errorData.errors) {
                //             Object.entries(errorData.errors).forEach(([field, messages]) => {
                //                 if (Array.isArray(messages)) {
                //                     messages.forEach(message => errorAlert(message));
                //                 }
                //             });
                //         }
                //     } else {
                //         errorAlert('An unexpected error occurred. Please try again.');
                //     }
                // } else if (error.request) {
                //     errorAlert('Network error. Please check your connection and try again.');
                // } else {
                //     errorAlert('An error occurred. Please try again.');
                // }
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
                    <div className="mb-6 font-medium text-sm text-green-400 bg-green-900/30 px-4 py-2 rounded-lg border border-green-500/30 backdrop-blur-sm relative z-20">
                        {status}
                    </div>
                )}

                <div className="relative  w-full ">
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

                    <div className="max-w-md m-auto !bg-black/20 backdrop-blur-xl border !border-pink-500/40 rounded-[40px]  shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="!bg-[#121212]/20 border-b border-pink-500/30 flex items-center p-4 space-x-2 rounded-t-[20px]">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>

                        <div className="p-6 sm:p-8 bg-black/20 rounded-b-[20px]">
                            <form onSubmit={checkTFA} className="space-y-6">
                                {redirectmessage && (
                                    <p className="text-center font-bold text-red-400 text-sm bg-red-900/20 py-2 rounded-lg border border-red-500/20 animate-pulse">
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
                                    <div className="relative group relative">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-75 transition duration-300 blur-sm"></div>
                                        <HiOutlineMail
                                            size="24"
                                            className="absolute top-[15px] left-3 z-1"
                                        />
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            className="relative w-full bg-white border border-gray-700 text-black text-lg rounded-[17px] focus:ring-0 focus:border-transparent block py-[12px] px-3 placeholder-gray-500 !ps-[40px] transition-all duration-300"
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
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl opacity-0 group-focus-within:opacity-75 transition duration-300 blur-sm"></div>
                                        <RiLockPasswordLine
                                            size="24"
                                            className="absolute top-[14px] left-3 z-1"
                                        />
                                        <input
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className="relative w-full bg-white border border-gray-700 text-black text-lg rounded-[17px] focus:ring-0 focus:border-transparent block py-[12px] px-3 placeholder-gray-500 transition-all duration-300 !ps-[40px]"
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

                                <div className="">
                                    <LoaderButton
                                        disabled={loading}
                                        className="relative flex flex-row items-center text-xl px-4 py-[10px] focus:outline-none  text-gray-600 border-l-4 border-transparent hover:!bg-pink-500 hover:!text-white pr-6 !text-black w-full"
                                        spinnerClassName="fill-white"
                                    >
                                        {loading ? "Logging In..." : "Log In"}
                                    </LoaderButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <EnterOTP action={open} user={data} />
        </GuestLayout>
    );
}
