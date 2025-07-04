// components/PushNotificationModal.jsx
import { useState } from "react";
import InputError from "@/Components/InputError";
import { useAlerts } from "@/Components/Alerts";
import axios from "axios";

export default function PushNotificationModal({ isOpen, onClose }) {
    const { successAlert, errorAlert } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ title: "", body: "" });
    const [Error, setError] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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
                setFormData({ title: "", content: "" });
                onClose(); // close modal
            } else {
                errorAlert(response?.data?.msg );
            }
        } catch (error) {
            errorAlert(error?.response?.data?.msg || "An error occurred");
            setError(error?.response?.data?.errors || {});
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-xl relative">
                <button
                    onClick={onClose}
                    className="absolute hover:text-black text-xl"
                >
                    &times;
                </button>

                <h2 className="text-xl font-semibold mb-4">
                    Send Push Notification
                </h2>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Title
                    </label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2"
                        placeholder="Enter notification title"
                    />
                    <InputError message={Error.title} />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                        Content
                    </label>
                    <textarea
                        name="body"
                        rows={4}
                        value={formData.body}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-lg p-2"
                        placeholder="Enter notification content"
                    ></textarea>
                    <InputError message={Error.body} />
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`${
                            loading
                                ? "bg-gray-400 text-black"
                                : "bg-pink-500 hover:bg-pink-600"
                        } text-white px-6 py-2 rounded-lg`}
                    >
                        {loading ? "Sending..." : "Send Notification"}
                    </button>
                </div>
            </div>
        </div>
    );
}
