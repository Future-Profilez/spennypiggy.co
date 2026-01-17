import { useRef, useState } from "react";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import PrimaryButton from "@/Components/PrimaryButton";
import TextInput from "@/Components/TextInput";
import { useForm } from "@inertiajs/react";
import SafeTransition from "@/Components/SafeTransition";
import { useAlerts } from "@/Components/Alerts";

export default function UpdatePasswordForm({ passwordUpdate, className = "" }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();
    const successShownRef = useRef(false);
    const [requiredErrors, setRequiredErrors] = useState({});

    const {
        data,
        setData,
        errors,
        put,
        reset,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: "",
        password: "",
        password_confirmation: "",
    });

    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const updatePassword = (e) => {
        e.preventDefault();

        // Client-side required validation
        if (!validateRequiredFields()) {
            errorAlert("Please fix the errors below.");
            return;
        }

        put(route("password.update"), {
            preserveScroll: true,
            onSuccess: (resp) => {
                reset();
                setRequiredErrors({});

                if (resp.props.flash?.success) {
                    successAlert(resp.props.flash?.success || "Updated !!");
                    passwordUpdate(false);
                }

                if (resp.props.flash?.error) {
                    errorAlert(resp.props.flash?.error);
                }
            },
            onError: (errors) => {
                errorAlert("Failed to reset password.");

                if (errors.password) {
                    reset("password", "password_confirmation");
                    passwordInput.current.focus();
                }

                if (errors.current_password) {
                    reset("current_password");
                    currentPasswordInput.current.focus();
                }
            },
        });
    };

    const validateRequiredFields = () => {
        const newErrors = {};

        if (!data.current_password) {
            newErrors.current_password = "Current password is required.";
        }

        if (!data.password) {
            newErrors.password = "New password is required.";
        }

        if (!data.password_confirmation) {
            newErrors.password_confirmation = "Confirm password is required.";
        }

        if (
            data.password &&
            data.password_confirmation &&
            data.password !== data.password_confirmation
        ) {
            newErrors.password_confirmation = "Passwords do not match.";
        }

        setRequiredErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Update Password
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Ensure your account is using a long, random password to stay
                    secure.
                </p>
            </header>

            <form onSubmit={updatePassword} className="mt-6 space-y-6">
                <div>
                    <InputLabel
                        htmlFor="current_password"
                        value="Current Password"
                    />
                    <TextInput
                        id="current_password"
                        ref={currentPasswordInput}
                        value={data.current_password}
                        onChange={(e) => {
                            setData("current_password", e.target.value);
                            setRequiredErrors((prev) => ({
                                ...prev,
                                current_password: null,
                            }));
                        }}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="current-password"
                    />
                    <InputError
                        message={
                            requiredErrors.current_password ||
                            errors.current_password
                        }
                        className="mt-2"
                    />
                </div>
                <div>
                    <InputLabel htmlFor="password" value="New Password" />
                    <TextInput
                        id="password"
                        ref={passwordInput}
                        value={data.password}
                        onChange={(e) => {
                            setData("password", e.target.value);
                            setRequiredErrors((prev) => ({
                                ...prev,
                                password: null,
                            }));
                        }}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />
                    <InputError
                        message={requiredErrors.password || errors.password}
                        className="mt-2"
                    />
                </div>

                <div>
                    <InputLabel
                        htmlFor="password_confirmation"
                        value="Confirm Password"
                    />
                    <TextInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(e) => {
                            setData("password_confirmation", e.target.value);
                            setRequiredErrors((prev) => ({
                                ...prev,
                                password_confirmation: null,
                            }));
                        }}
                        type="password"
                        className="mt-1 block w-full"
                        autoComplete="new-password"
                    />
                    <InputError
                        message={
                            requiredErrors.password_confirmation ||
                            errors.password_confirmation
                        }
                        className="mt-2"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>
                    <SafeTransition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">Saved.</p>
                    </SafeTransition>
                </div>
            </form>
        </section>
    );
}
