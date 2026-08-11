import { useEffect } from "react";
import GuestLayout from "@/Layouts/GuestLayout";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import { Head, useForm } from "@inertiajs/react";
import LoaderButton from "@/Components/LoaderButton";
import { useAlerts } from "@/Components/Alerts";

export default function ConfirmPassword(props) {
    const { uuid, token = "", auth } = props;
    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    // `token` is the single-use reset token from the emailed link. The uuid alone is
    // a public identifier and proves nothing — the server refuses without this.
    const { data, setData, post, processing, errors, reset } = useForm({
        password: "",
        password_confirmation: "",
        token,
    });

    useEffect(() => {
        return () => {
            reset("password");
            reset("password_confirmation");
        };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        if (processing) return;
        if (!token) {
            errorAlert(
                "This reset link is missing its security token. Please open the link from your email again, or request a new one.",
            );
            return;
        }
        post(route("changePassword", { uuid: uuid }), {
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
            <Head title="Set a new password" />

            <div className="loginPage blackbg py-14">
                <div className="containerbox ">
                    <div className="loginform mx-auto border-4 border-black bg-white rounded-[32px] overflow-hidden shadow-[10px_10px_0px_0px_#00FFD1] max-w-[520px]">
                        <div className="bg-gradient-to-r from-[#FF008A] to-[#FF4FB3] px-6 py-5 border-b-4 border-black">
                            <div className="flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-[#2EE6C5] border-2 border-black"></span>
                                <span className="w-5 h-5 rounded-full bg-[#8B5CF6] border-2 border-black"></span>

                                <h2 className="text-white text-xl font-black tracking-wide ml-2">
                                    Set a new password
                                </h2>
                            </div>
                        </div>

                        <form onSubmit={submit} className="p-6 md:p-8">
                            {/* This screen resets a forgotten password — it is not the
                                "confirm your password to continue" gate the old copy
                                described, which is a different flow entirely. */}
                            <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                Choose a new password for your account. This link
                                works once, and any "remember me" sessions will
                                need to sign in again.
                            </p>

                            <ul>
                                <li className="mb-0">
                                    <div className="mb-5">
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
                                                    e.target.value,
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
                                    <div className="mb-5">
                                        <label
                                            htmlFor="password_confirmation"
                                            className="block text-sm font-bold text-gray-800 mb-2"
                                        >
                                            Confirm Password
                                        </label>
                                        <TextInput
                                            id="password_confirmation"
                                            type="password"
                                            name="password_confirmation"
                                            value={data.password_confirmation}
                                            className="mt-1 block w-full"
                                            onChange={(e) =>
                                                setData(
                                                    "password_confirmation",
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors.password_confirmation
                                            }
                                            className="mt-2"
                                        />
                                    </div>
                                </li>
                            </ul>

                            <LoaderButton
                                spinnerclass="fill-white"
                                className="w-full bg-gradient-to-r from-[#FF008A] to-[#FF4FB3] 
                                hover:scale-[1.02] transition-all duration-300 
                                border-4 border-black rounded-[18px] 
                                py-4 text-white font-black uppercase tracking-wide 
                                shadow-[4px_4px_0px_0px_#000]"
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
