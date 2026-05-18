import LoaderButton from "@/Components/LoaderButton";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { Head, Link } from "@inertiajs/react";

export default function StripeIdentity({ auth }) {

    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert } = useAlerts();
    const adminIdentity = auth?.admin_identity;

    // Parse error details if available
    const error = (() => {
        try {
            return JSON.parse(auth?.user?.identity_verification_error);
        } catch {
            return null;
        }
    })();

    // Handle identity verification
    const handleVerification = async () => {
        setLoading(true);
        try {
            const { data: response } = await axios.post(route("stripe.identity.verify"));
            if (response.url) {
                window.location.href = response.url;
                successAlert("Redirecting to Stripe for identity verification...");
            } else {
                errorAlert("Unexpected response from the server. Please try again later.");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || "Unable to connect to the server. Please check your network and try again.";
            errorAlert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Authenticated auth={auth?.user || ""} user={auth?.user || ""}>
            <Head title="Identity Verification" />
            <div className="min-h-[90vh] bg-[#A2E4B8] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-7xl mx-auto">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-gulfs text-black uppercase tracking-wider mb-2">
                            Identity{" "}
                            <span className="text-gradient-wishlist">
                                Verification
                            </span>
                        </h2>
                        <p className="text-gray-800 text-lg font-medium max-w-2xl mx-auto">
                            Complete Stripe identity verification to unlock creator features and payments.
                        </p>
                    </div>

                    <div className="max-w-xl m-auto bg-white rounded-[30px] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <div className="!border-r-0 !border-l-0 !border-t-0 border-b border-black flex items-center p-4 space-x-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                        </div>

                        <div className="p-6 sm:p-8">
                            {auth?.user?.identity_status == 1 && (
                                <div className="mb-4 text-yellow-800 bg-yellow-50 p-4 rounded-[20px] border border-yellow-200">
                                    <p className="font-bold mb-1">
                                        Verification submitted
                                    </p>
                                    <p className="text-sm">
                                        Your documents are with our admin team for review. You can continue setting up your profile while waiting.
                                    </p>
                                </div>
                            )}

                            {auth?.user?.identity_status === 2 && (
                                <div className="mb-4 text-red-800 bg-red-50 p-4 rounded-[20px] border border-red-200">
                                    <p className="font-bold mb-1">
                                        Verification rejected
                                    </p>
                                    <p className="text-sm">
                                        {adminIdentity?.notes ||
                                            "Please re-submit your identity documents following the guidelines."}
                                    </p>
                                </div>
                            )}

                            {auth?.user?.identity_verification_error && (
                                <div className="mb-4 text-yellow-800 bg-yellow-50 p-4 rounded-[20px] border border-yellow-200">
                                    <p className="font-bold mb-2">
                                        Why are you seeing this error?
                                    </p>
                                    <p className="text-sm">
                                        Your last attempt was unsuccessful. Review the details below and try again.
                                    </p>
                                    <div className="mt-2 text-sm capitalize">
                                        <p>
                                            Error:{" "}
                                            {error?.code?.replaceAll("_", " ") ||
                                                error?.code ||
                                                "Unknown error"}
                                        </p>
                                        <p>
                                            Possible reason:{" "}
                                            {error?.reason || "N/A"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-[20px] border border-gray-200 bg-gray-50 p-4">
                                <p className="font-bold text-gray-900">
                                    What happens next?
                                </p>
                                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                                    <li>1) You upload your documents in Stripe.</li>
                                    <li>2) Stripe verifies them.</li>
                                    <li>3) Our admin team reviews the result.</li>
                                </ul>
                            </div>

                            <div className="mt-6">
                                <LoaderButton
                                    disabled={loading || auth?.user?.identity_status == 1}
                                    onClick={handleVerification}
                                    className={`relative flex flex-row items-center text-xl px-4 py-[10px] focus:outline-none border-l-4 border-transparent pr-6 bg-black !text-white w-full ${
                                        loading ? "!animate-pulse !bg-green-400" : "hover:!bg-[#FF007F]"
                                    }`}
                                    spinnerclass="fill-white"
                                >
                                    {loading
                                        ? "Processing..."
                                        : auth?.user?.identity_status === 2
                                            ? "REVERIFY NOW"
                                            : auth?.user?.identity_status == 1
                                                ? "VERIFICATION SUBMITTED"
                                                : "VERIFY NOW"}
                                </LoaderButton>
                            </div>

                            <div className="mt-4 flex items-center justify-between text-sm">
                                <Link
                                    href={route("user.show", {
                                        username: auth?.user?.username,
                                    })}
                                    className="text-gray-700 hover:text-black font-semibold"
                                >
                                    Back to profile
                                </Link>
                                <a
                                    href="mailto:support@spennypiggy.co"
                                    className="text-[#FF007F] hover:underline font-semibold"
                                >
                                    support@spennypiggy.co
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
