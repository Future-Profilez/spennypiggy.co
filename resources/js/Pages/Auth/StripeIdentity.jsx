import LoaderButton from "@/Components/LoaderButton";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";

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
        <Authenticated>
            <div className="flex flex-col py-12 items-center justify-center min-h-[80vh] bg-gray-100">
                <div className="rounded-[30px] md:rounded-[40px]   p-6 sm:p-10 max-w-xl w-full">
                    {/* Admin Review Banners */}
                    {/* {auth?.user?.identity_status == 1 && (!adminIdentity || adminIdentity?.status !== 1) && (
                        <div className="mb-4 text-blue-800 bg-blue-100 p-4 rounded-[30px] md:rounded-[40px]   border border-blue-200 text-center">
                            <p className="font-semibold mb-1">Identity Submitted</p>
                            <p className="text-sm">Your documents are with our admin team for review. You'll receive an email once approved.</p>
                        </div>
                    )} */}
                    {/* {auth?.user?.identity_status === 2 && (
                        <div className="mb-4 text-red-800 bg-red-100 p-4 rounded-[30px] md:rounded-[40px]   border border-red-200 text-center">
                            <p className="font-semibold mb-1">Admin Review: Rejected</p>
                            <p className="text-sm">{adminIdentity?.notes || "Please re-submit your identity documents following the guidelines below."}</p>
                        </div>
                    )} */}

                    {/* Display error explanation */}
                    {auth?.user?.identity_verification_error && (
                        <div className="mb-4 text-yellow-700 bg-yellow-100 p-4 rounded-[30px] md:rounded-[40px]   border border-yellow-200 text-center">
                            <p className="font-semibold mb-2">Why are you seeing this error?</p>
                            <p className="text-sm">
                                Your last attempt to complete identity verification was unsuccessful. Please review the details below and try again.
                            </p>
                            <p>Error: {error?.code?.replaceAll("_", " ") || error?.code || "Unknown Error Occurred"}</p>
                            <p>Possible Reason: {error?.reason || "N/A"}</p>
                        </div>
                    )}


                    <h2 className="text-center welcomeHeading !text-3xl shadow-yellow font-GillSans uppercase mb-1">
                        Identity Verification Required
                    </h2>
                    <p className="mt-4 text-gray-600 text-center">
                        To access all features, please complete your Stripe identity verification. This process ensures your account's security and compliance.
                    </p>

                    <div className="mt-6 flex justify-center">
                        <LoaderButton
                            disabled={loading || (auth?.user?.identity_status == 1)}
                            onClick={handleVerification}
                            className="p  px-6 py-[13px]"
                            spinnerclass="fill-white" >
                            {loading ? "Processing..." :auth?.user?.identity_status === 2 ? "Reverify Now" : auth?.user?.identity_status == 1 ? "Verification Submitted" : "Verify Now"}
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
