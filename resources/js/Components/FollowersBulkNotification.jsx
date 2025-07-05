import { useState } from "react";
import InputError from "@/Components/InputError";
import { useAlerts } from "@/Components/Alerts";
import axios from "axios";
import Popup from "./Popup";

export default function FollowersBulkNotification() {
    const { successAlert, errorAlert } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ title: "", body: "" });
    const [Error, setError] = useState({});

    const maxTitleLength = 50;
    const maxBodyLength = 200;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        const limitedValue =
            name === "title"
                ? value.slice(0, maxTitleLength)
                : value.slice(0, maxBodyLength);

        setFormData((prev) => ({ ...prev, [name]: limitedValue }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await axios.post(
                route("send.pwa.to.follower"),
                formData
            );

            if (response?.data?.status) {
                successAlert(response.data.msg);
                setFormData({ title: "", body: "" });
                onClose(); // close modal
            } else {
                errorAlert(response?.data?.msg);
            }
        } catch (error) {
            errorAlert(error?.response?.data?.msg || "An error occurred");
            setError(error?.response?.data?.errors || {});
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popup
            space="4"
            classes="uppercase"
            modalclass="pinkmodal"
            text={<>Notification Campaign</>}
        >
            <h2 className="text-uppercase font-GillSans text-lg">
                Send Push Notification
            </h2>

            <p className="pb-4 text-gray-500">
                Send a bulk push notification to all of your followers.
            </p>

            {/* Title Field */}
            <div className="mb-2">
                <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                maxLength={maxTitleLength}
                className="px-3 py-[13px] bg-gray-100 !border-gray-200 border-1 rounded-lg w-full"
                placeholder="Notification Title" />
                <div className="text-right text-xs text-gray-500">
                    {formData.title.length}/{maxTitleLength}
                </div>
                <InputError message={Error.title} />
            </div>

            {/* Body Field */}
            <div className="mb-2">
                <textarea
                    name="body"
                    rows={4}
                    value={formData.body}
                    onChange={handleInputChange}
                    maxLength={maxBodyLength}
                    className="px-3 py-[10px] bg-gray-100 !border-gray-200 border-1 rounded-lg w-full"
                    placeholder="Enter something..." ></textarea>
                <div className="text-right text-xs text-gray-500">
                    {formData.body.length}/{maxBodyLength}
                </div>
                <InputError message={Error.body} />
            </div>

            {/* Submit Button */}
            <div className={`flex justify-end ${formData.title === '' || formData.body === '' ? "disabled" : ""}`}>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`${loading? "bg-gray-400 text-black": "bg-pink-500 hover:bg-pink-600"} uppercase w-full btn-shadow font-gulfs rounded-full px-4 pt-[10px] pb-[7px] pinkbg text-white`} >
                    {loading ? "Sending..." : "Send Notification"}
                </button>
            </div>
        </Popup>
    );
}
