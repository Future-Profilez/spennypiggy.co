import LoaderButton from "@/Components/LoaderButton";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import React, { useState } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { Inertia } from "@inertiajs/inertia";

export default function RejectedProfile({ data }) {
    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert } = useAlerts();

    const error = (() => {
        try {
            return JSON.parse(data?.identity_verification_error);
        } catch {
            return null;
        }
    })();

    // const handleProfileRedirect = () => {
    //     Inertia.visit(route("profile.edit"));
    // };

    const handleVerification = async () => {
        setLoading(true);
        try {
            const { data: response } = await axios.post(
                route("stripe.identity.verify")
            );
            if (response.url) {
                successAlert("Redirecting to Stripe...");
                window.location.href = response.url;
            } else {
                errorAlert("Unexpected server response. Please try again.");
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.error || "Network error. Please try again.";
            errorAlert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Authenticated>
            <div className="flex flex-col items-center justify-center min-h-[80vh] bg-red-50">
                <div className="bg-white shadow-xl border border-red-200 rounded-xl p-6 sm:p-10 max-w-xl w-full text-center">
                    <div className="mb-6">
                        <h2 className="text-2xl sm:text-3xl font-semibold text-red-700">
                            Your Profile Verification Was Rejected
                        </h2>
                        <p className="mt-2 text-sm text-gray-700">
                            Unfortunately, your profile did not meet our
                            verification requirements. As a result, you won't be
                            able to access certain features like sending
                            payments or receiving payouts.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 p-4 bg-red-100 border border-red-300 rounded-md text-sm text-left">
                            <p>
                                <strong>Issue:</strong>{" "}
                                {error.code?.replaceAll("_", " ") ||
                                    "Unspecified"}
                            </p>
                            <p>
                                <strong>Details:</strong>{" "}
                                {error.reason || "Not provided"}
                            </p>
                        </div>
                    )}

                    <p className="text-sm text-gray-600 mb-4">
                        Please review and update the required sections of your
                        profile such as bio, address, or social links. Once
                        submitted, our team will re-review your profile.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                        <LoaderButton
                            onClick={handleProfileRedirect}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 transition-all duration-200"
                        >
                            Review My Profile
                        </LoaderButton>

                        <LoaderButton
                            disabled={loading}
                            onClick={handleVerification}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring focus:ring-gray-300 transition-all duration-200"
                            spinnerClassName="fill-white"
                        >
                            {loading
                                ? "Redirecting..."
                                : "Retry Identity Verification"}
                        </LoaderButton>
                    </div>

                    <footer className="mt-8 text-xs text-gray-500">
                        <p>
                            Need help? Contact our support at
                            <a
                                href="mailto:support@spennypiggy.co"
                                className="text-blue-600 hover:underline ml-1"
                            >
                                support@spennypiggy.co
                            </a>
                        </p>
                    </footer>
                </div>
            </div>
        </Authenticated>
    );
}
