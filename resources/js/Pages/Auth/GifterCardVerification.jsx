import LoaderButton from "@/Components/LoaderButton";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import React, { useState } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";

export default function GifterCardVerification({ auth }) {
    const { data } = auth.user;
    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert } = useAlerts();

    const handlePaymentRedirect = async () => {
        setLoading(true);
        try {
            const { data: response } = await axios.get(route("card.verification.payment"));
            if (response.url) {
                window.location.href = response.url;
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

                    {/* Optional explanation */}
                    {data?.payment_error && (
                        <div className="mb-4 text-red-600 text-center flex flex-col gap-1">
                            <p className="font-semibold text-yellow-800 bg-yellow-100 p-4 rounded-lg border border-yellow-200">
                                Your previous payment attempt was unsuccessful. Please try again to complete your card verification.
                            </p>
                        </div>
                    )}

                    {/* Title & Description */}
                    <h2 className="text-center welcomeHeading !text-3xl shadow-yellow font-GillSans text-uppercase mb-1">
                        Card Verification Required
                    </h2>
                    <p className="mt-4 text-gray-600 text-center">
                        To continue using Spenny Piggy features, please verify your card by completing the payment process.
                    </p>

                    {/* Payment Button */}
                    <div className="mt-6 flex justify-center">
                        <LoaderButton
                            disabled={loading}
                            onClick={handlePaymentRedirect}
                            className="px-6 py-[13px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 transition-all ease-in-out duration-200"
                            spinnerClassName="fill-white"
                        >
                            {loading ? "Redirecting..." : "Verify with Payment"}
                        </LoaderButton>
                    </div>
                </div>

                <footer className="text-sm text-gray-500 mt-8">
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
