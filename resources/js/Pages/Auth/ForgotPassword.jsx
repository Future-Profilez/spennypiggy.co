import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { Head, useForm, Link, router } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";

export default function ForgotPassword(props) {
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { status, auth } = props;
    const { data, setData, post, processing, errors } = useForm({
        email: "",
    });

    const submit = (e) => {
        e.preventDefault();
        console.log(data.email);
        router.post("forgot-password", { email: data.email }),
            {
                preserveScroll: true,
                onSuccess: (resp) => {
                    if (resp.props.flash?.success) {
                        successAlert(
                            resp.props.flash?.success || "Updated successfully."
                        );
                    }
                    if (resp.props.flash?.error) {
                        errorAlert(
                            resp.props.flash?.error || "Something went wrong."
                        );
                    }
                    reset();
                },
                onError: (_err) => {
                    console.error(_err);
                    errorAlert(resp.props.flash?.success || "Added");
                },
            };
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

                    <div className="loginform mt-4 mt-md-5 mx-auto border-black whbg shadow-mint">
                        <div className="loginheadbox pinkbg">
                            <span className="mintbg"></span>
                            <span className="bluebg"></span>
                        </div>

                        {status && (
                            <div className="mb-4 font-medium text-sm text-green-600">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit}>
                            <div className="login-step1">
                                <p className="text-start text-dark mb-5 text-md m-auto">
                                    Forgot your password? No problem. Just let
                                    us know your email address and we will email
                                    you a password reset link that will allow
                                    you to choose a new one.
                                </p>

                                <ul>
                                    <li>
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
                                        <div className="wishlistbtn mt-3 text-center flex justify-center ">
                                            <LoaderButton
                                                disabled={processing}
                                                className="btn-pink lg lg2  mb-md-0"
                                                spinnerClassName="fill-red-600"
                                            >
                                                {processing
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
