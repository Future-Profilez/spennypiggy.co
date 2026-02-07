import { useEffect } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { Head, useForm } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";

export default function ConfirmPassword(props) {
    const { uuid, auth } = props;
    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const { data, setData, post, processing, errors, reset } = useForm({
        password: "",
        confirmpassword: "",
    });

    useEffect(() => {
        return () => {
            reset("password");
            reset("confirmpassword");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route("changePassword", { uuid: uuid }),{
                preserveScroll: true,
                onSuccess: (resp) => {
                    if (resp.props.flash?.success) {
                        successAlert(resp.props.flash?.success);
                    }
                    if (resp.props.flash?.error) {
                        errorAlert(resp.props.flash?.error);
                    }
                    reset();
                },
                onError: (err) => {
                    reset("password");
                    Object.keys(err).map((key) => {
                        errorAlert(err[key]);
                    });
                },
            });
    };

    // useEffect(() => {

    // }, []);

    return (
        <GuestLayout auth={auth && auth.user} user={auth && auth.user}>
            <Head title="Confirm Password" />

            <div className="loginPage blackbg py-14">
                <div className="containerbox ">
                    <div className="loginform mx-auto border-black whbg shadow-mint">
                        <div className="loginheadbox pinkbg">
                            <span className="mintbg"></span>
                            <span className="bluebg"></span>
                        </div>

                        <form onSubmit={submit}>
                            <p className="text-start text-muted mb-5 text-small m-auto">
                                This is a secure area of the application. Please
                                confirm your password before continuing.
                            </p>

                            <ul>
                                <li className="mb-0">
                                    <div className="mt-4">
                                        <InputLabel
                                            htmlFor="password"
                                            value="Password"
                                        />
                                        <TextInput
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            className="mt-1 block w-full"
                                            isFocused={true}
                                            onChange={(e) =>
                                                setData(
                                                    "password",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errors.password}
                                            className="mt-2"
                                        />
                                    </div>
                                </li>
                                <li>
                                    <div className="mt-4">
                                        <label htmlFor="confirmpassword">
                                            Confirm Password
                                        </label>
                                        <TextInput
                                            id="confirmpassword"
                                            type="password"
                                            name="confirmpassword"
                                            value={data.confirmpassword}
                                            className="mt-1 block w-full"
                                            isFocused={true}
                                            onChange={(e) =>
                                                setData(
                                                    "confirmpassword",
                                                    e.target.value
                                                )
                                            }
                                        />
                                        <InputError
                                            message={errors.confirmpassword}
                                            className="mt-2"
                                        />
                                    </div>
                                </li>
                            </ul>

                            <LoaderButton
                                spinnerclass="fill-red-600"
                                className="p w-full"
                                disabled={processing}
                            >
                                {processing ? "Updating..." : "Confirm"}
                            </LoaderButton>
                        </form>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
