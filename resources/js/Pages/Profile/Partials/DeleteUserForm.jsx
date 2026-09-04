import { useRef, useState } from "react";
import DangerButton from "@/Components/DangerButton";
import InputError from "@/Components/InputError";
import InputLabel from "@/Components/InputLabel";
import SecondaryButton from "@/Components/SecondaryButton";
import TextInput from "@/Components/TextInput";
import { useForm, usePage } from "@inertiajs/react";

/*
 * 🚨 THE REASON LIST COMES FROM THE SERVER, NOT FROM A CONSTANT IN THE BUNDLE.
 * `config/account_deletion.php` both renders this select and validates the
 * submission, so the form can never offer a code the server would refuse — the
 * fault `priceLimits` was extracted to fix.
 */
export default function DeleteUserForm({ className = "" }) {
    const {
        deletion_reasons: reasons = {},
        deletion_comment_required_for: commentRequiredFor = "other",
    } = usePage().props;

    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
    } = useForm({
        password: "",
        deletion_reason: "",
        deletion_comment: "",
    });

    const commentRequired = data.deletion_reason === commentRequiredFor;

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();
        destroy(route("profile.destroy"), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            // ⚠️ The password is no longer the only field that can fail, so
            // focusing it on every error would move the cursor away from the
            // reason the person actually has to fix.
            onError: (bag) => {
                if (bag?.password) {
                    passwordInput.current?.focus();
                }
            },
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);
        reset();
    };

    const reasonEntries = Object.entries(reasons);

    return (
        <section className={`space-y-6 ${className}`}>
            {confirmingUserDeletion ? (
                <>
                    <form onSubmit={deleteUser} className="p-6">
                        <h2 className="text-lg font-medium text-gray-900">
                            Are you sure you want to delete your account?
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            Once your account is deleted, all of its resources
                            stripe account and data will be permanently deleted.
                            Please enter your password to confirm you would like
                            to permanently delete your account.
                        </p>

                        <div className="mt-6">
                            <InputLabel
                                htmlFor="deletion_reason"
                                value="Why are you leaving?"
                            />

                            <select
                                id="deletion_reason"
                                name="deletion_reason"
                                value={data.deletion_reason}
                                onChange={(e) =>
                                    setData("deletion_reason", e.target.value)
                                }
                                className="mt-1 block w-full rounded-box-sm border-black bg-white px-3 py-2 text-sm"
                            >
                                <option value="">Select a reason</option>
                                {reasonEntries.map(([code, label]) => (
                                    <option key={code} value={code}>
                                        {label}
                                    </option>
                                ))}
                            </select>

                            <InputError
                                message={errors.deletion_reason}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="deletion_comment"
                                value={
                                    commentRequired
                                        ? "Tell us more"
                                        : "Tell us more (optional)"
                                }
                            />

                            <textarea
                                id="deletion_comment"
                                name="deletion_comment"
                                rows={3}
                                maxLength={1000}
                                value={data.deletion_comment}
                                onChange={(e) =>
                                    setData("deletion_comment", e.target.value)
                                }
                                className="mt-1 block w-full rounded-box-sm border-black bg-white px-3 py-2 text-sm"
                                placeholder="Anything you want us to know"
                            />

                            <InputError
                                message={errors.deletion_comment}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="password"
                                value="Password"
                                className="sr-only"
                            />

                            <TextInput
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInput}
                                value={data.password}
                                onChange={(e) =>
                                    setData("password", e.target.value)
                                }
                                className="mt-1 block w-full"
                                isFocused
                                placeholder="Password"
                            />

                            <InputError
                                message={errors.password}
                                className="mt-2"
                            />
                        </div>

                        <div className="mt-6 flex justify-center">
                            <SecondaryButton onClick={closeModal}>
                                Cancel
                            </SecondaryButton>

                            <DangerButton
                                className="ml-3"
                                disabled={processing}
                            >
                                Delete
                            </DangerButton>
                        </div>
                    </form>
                </>
            ) : (
                <>
                    <header>
                        <h2 className="text-lg font-medium text-gray-900">
                            Delete Account
                        </h2>

                        <p className="mt-1 text-sm text-gray-600">
                            Once your account is deleted, all of its resources
                            and Stripe account data will be permanently deleted.
                            Before deleting your account, please download any
                            data or information that you wish to retain.
                            <br />
                            <br />
                            <strong>Note:</strong> All active subscriptions will
                            be automatically cancelled upon account deletion.
                        </p>
                    </header>

                    <DangerButton onClick={confirmUserDeletion}>
                        Delete Account
                    </DangerButton>
                </>
            )}
        </section>
    );
}
