import LoaderButton from "@/Components/LoaderButton";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import { useState } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import ActivateCard from "./ActivateCard";

export default function GifterCardVerification({ auth, gifterCardVerification}) {
    const user = auth?.user || null;
    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert } = useAlerts();

    const handlePaymentRedirect = async () => {
        setLoading(true);
        try {
            const { data: response } = await axios.get(
                route("gifter.card.verification")
            );
            if (response.checkout_url) {
                window.location.href = response.checkout_url;
            } else {
                errorAlert(
                    "Unexpected response from the server. Please try again later."
                );
            }
        } catch (err) {
            const errorMessage =
                err.response?.data?.error ||
                "Unable to connect to the server. Please check your network and try again.";
            errorAlert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Authenticated>
            <div className="bg-[#A2E4B8] py-6 ">
                <div className="container">
                    <div className="!h-[80vh]  flex items-center  ">
                    <div className="max-w-[800px] m-auto ">
                        <ActivateCard />
                    </div>
                    </div>
                </div>
            </div>
        </Authenticated>
    );
}
