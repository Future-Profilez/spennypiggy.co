import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import { Head, useForm, Link, router } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";
import axios from "axios";
import { useState } from "react";

export default function ForgotPassword(props) {
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { status, auth } = props;
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const [loading, setLoading] = useState(false);
    const submit = (e) => {
        e.preventDefault();
        // Re-entrancy guard: the disabled re-render loses the double-tap race, and
        // each extra submit sends another reset mail and invalidates the last link.
        if (loading) return;
        setLoading(true);
        axios
            // Absolute, never relative. This page is served at BOTH `/forgot-password`
            // and (after a failed reset) other paths — a relative "forgot-password"
            // resolves against whatever the current directory happens to be.
            .post(route("password.email"), { email: data.email })
            .then((resp) => {
                if (resp.data.status) {
                    successAlert(resp.data.message);
                    setData("email", "");
                } else {
                    errorAlert(resp.data.message);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Forgot password error:", err);
                // ⚠️ This branch called `setQuantity(intialItem)` — neither exists
                // here — so every failed request threw a ReferenceError instead of
                // showing anything, under the message "Unable to update quantity."
                const status = err?.response?.status;
                if (status === 429) {
                    errorAlert(
                        "Too many attempts. Please wait a minute and try again.",
                    );
                } else {
                    errorAlert(
                        err?.response?.data?.message ||
                            "We couldn't send the reset email. Please try again.",
                    );
                }
                setLoading(false);
            });
    };

    return (
        <GuestLayout auth={auth && auth.user} user={auth && auth.user}>
            <Head title="Forgot Password" />
            <div className="loginPage blackbg py-14">
                <div className="containerbox ">
                    <h2 className="headingLg pb-0 pb-md-4 text-center px-3">
                        Forgot password ?
                    </h2>
                    <p className="text-center text-white mb-5 text-large m-auto">
                        Have an another account ?{" "}
                        <Link className={"text-pink"} href={route("login")}>
                            {" "}
                            Log In
                        </Link>
                    </p>
                    <div className="shadow-layout inputs max-w-[600px] pink-shadow-layout mx-auto  !border-3 border-black  bg-white shadow-pink overflow-hidden">
                        <div className='p-4 pinkbg flex  !border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center '>
                        <span className=' border-black border-2 bg-red-700 me-2 w-5 h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-yellow-400 me-2 w-5 h-5 rounded-full block'></span>
                        <span className=' border-black border-2 bg-mint me-2 w-5 h-5 rounded-full block'></span>
                    </div>
                        <form className="!p-4 sm:!p-6" onSubmit={submit}>
                               
                            {status && (
                                <div className="mb-4 font-medium text-sm text-green-600">
                                    {status}
                                </div>
                            )}
                            <div className="login-step1">
                                <p className="text-start text-dark mb-2 text-md m-auto">
                                    Forgot your password?
                                </p>
                                <p className="text-start text-muted mb-5 text-small m-auto">
                                    No problem. Just let us know your email
                                    address and we will email you a password
                                    reset link that will allow you to choose a
                                    new one.
                                </p>
                                <ul>
                                    <li className="mb-0">
                                        <label>Email Address</label>
                                        <TextInput
                                            id="email"
                                            required="required"
                                            type="email"
                                            placeholder="Enter your email address"
                                            name="email"
                                            value={data.email}
                                            className="mt-1 block w-full"
                                            isFocused={true}
                                            onChange={(e) =>
                                                setData("email", e.target.value)
                                            }
                                        />
                                        <InputError
                                            message={errors.email}
                                            className="mt-2"
                                        />
                                        <div className="wishlistbtn mt-3  mb-0 text-center flex justify-center ">
                                            <LoaderButton
                                                disabled={loading}
                                                className="p w-full"
                                                spinnerclass="fill-red-600"
                                            >
                                                {loading
                                                    ? "Sending..."
                                                    : "Email Password Reset Link"}
                                            </LoaderButton>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
