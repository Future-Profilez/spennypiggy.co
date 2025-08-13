import LoaderButton from "@/Components/LoaderButton";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";

export default function StripeIdentity({ auth }) {
    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert } = useAlerts();
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
        <Authenticated>
            <div className="flex flex-col items-center justify-center h-[80vh] bg-gray-100">
                <div className="rounded-lg p-6 sm:p-10 max-w-xl w-full">
                    {/* Display error explanation */}
                    {auth?.user?.identity_verification_error && (
                        <div className="mb-4 text-yellow-700 bg-yellow-100 p-4 rounded-lg border border-yellow-200 text-center">
                            <p className="font-semibold mb-2">Why are you seeing this error?</p>
                            <p className="text-sm">
                                Your last attempt to complete identity verification was unsuccessful. Please review the details below and try again.
                            </p>
                        </div>
                    )}

                    {/* Display error details */}
                    {auth?.user?.identity_verification_error && (
                        <div className="mb-4 text-red-600 text-center flex flex-col gap-1 capitalize">
                            <p>Error: {error?.code?.replaceAll("_", " ") || error?.code || "Unknown Error Occurred"}</p>
                            <p>Possible Reason: {error?.reason || "N/A"}</p>
                        </div>
                    )}

                    <h2 className="text-center welcomeHeading !text-3xl shadow-yellow font-GillSans text-uppercase mb-1">
                        Identity Verification Required
                    </h2>
                    <p className="mt-4 text-gray-600 text-center">
                        To access all features, please complete your Stripe identity verification. This process ensures your account's security and compliance.
                    </p>

                    {/* Guidelines Link */}
                    <div className="mt-4 text-center text-sm text-gray-700">
                        For details on acceptable documents and instructions on how to upload, visit the
                        <a href="https://docs.stripe.com/acceptable-verification-documents" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> Stripe Verification Guidelines
                        </a>.
                    </div>

                    {/* Verification Button */}
                    <div className="mt-6 flex justify-center">
                        <LoaderButton
                            disabled={loading}
                            onClick={handleVerification}
                            className="px-6 py-[13px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 transition-all ease-in-out duration-200"
                            spinnerClassName="fill-white"
                        >
                            {loading ? "Processing..." : error?.code ? "Reverify Now" : "Verify Now"}
                        </LoaderButton>
                    </div>
                </div>

                <footer className="text-sm text-gray-500">
                    <p className="text-center">
                        Need help? Contact our support team at
                        <a
                            href="mailto:support@spennypiggy.co"
                            className="text-blue-600 hover:underline ml-1"
                        >
                            support@spennypiggy.co
                        </a>
                    </p>
                </footer>
            </div>
        </Authenticated>
    );
}
