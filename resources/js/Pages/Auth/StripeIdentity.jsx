import LoaderButton from "@/Components/LoaderButton";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import React, { useState } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";

export default function StripeIdentity(props) {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const handleVerification = async () => {
        setLoading(true);
        setMessage(""); // Clear any previous messages

        try {
            const response = await axios.post(route("stripe.identity.verify"));
            if (response.data.url) {
                // Redirect user to the Stripe verification URL
                window.location.href = response.data.url;
            } else {
                // Handle unexpected success response without URL
                errorAlert(
                    "Unexpected response from the server. Please try again later."
                );
            }
        } catch (error) {
            if (error.response) {
                // Server error response
                errorAlert(
                    error.response.data.error ||
                        "An error occurred. Please try again."
                );
            } else {
                // Network or other errors
                errorAlert(
                    "Unable to connect to the server. Please check your network and try again."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Authenticated>
            <div className="flex flex-col items-center justify-center  h-[80vh] bg-gray-100">
                <div>
                    <div className=" rounded-lg p-6 sm:p-10 max-w-xl w-full">
                        {props?.data?.identity_verification_error && (
                            <div className="mb-4 text-red-600 text-center flex flex-col gap-1 capitalize">
                            Error: {props?.data?.identity_verification_error?.code?.replaceAll("_"," ") || "Unknown Error Occured"} 
                            Possible Reason:{props?.data?.identity_verification_error?.reason || "N/A"}
                        </div>
                        
                        )}
                        <h2 className="text-center welcomeHeading !text-3xl shadow-yellow font-GillSans text-uppercase mb-1">
                            Identity Verification Required
                        </h2>
                        <p className="mt-4 text-gray-600 text-center">
                            To access all features, please complete your Stripe
                            identity verification. This process ensures your
                            account's security and compliance.
                        </p>
                        <div className="mt-6 flex justify-center">
                            <LoaderButton
                                disabled={loading}
                                onClick={handleVerification}
                                className="px-6 py-[13px] bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300 transition-all ease-in-out duration-200"
                                spinnerClassName="fill-white"
                            >
                                {loading ? "Processing..." :
                                props.data?.identity_verification_error && 
                                props.data?.identity_status == 0 ? "Reverify Now":
                                "Verify Now"}
                            </LoaderButton>
                        </div>
                    </div>

                    <footer className=" text-sm text-gray-500">
                        <p className="text-center">
                            Need help? Contact our support team at
                            <a href="mailto:mailto:support@spennypiggy.co" className="text-blue-600 hover:underline ml-1">
                                support@spennypiggy.co
                            </a>
                        </p>
                    </footer>
                </div>
            </div>
        </Authenticated>
    );
}
