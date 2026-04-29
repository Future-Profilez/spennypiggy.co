import LoaderButton from "@/Components/LoaderButton";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import { useAlerts } from "@/Components/Alerts";
import userphoto from "../../../assets/siteicon.png";

const datas = [
    { code: "AT", label: "Austria", phone: "43", currency: "EUR" },
    { code: "AU", label: "Australia", phone: "61", currency: "AUD" },
    {
        code: "AE",
        label: "United Arab Emirates",
        phone: "971",
        currency: "AED",
    },
    { code: "BE", label: "Belgium", phone: "32", currency: "EUR" },
    { code: "BG", label: "Bulgaria", phone: "359", currency: "BGN" },
    { code: "BR", label: "Brazil", phone: "55", currency: "BRL" },
    { code: "CA", label: "Canada", phone: "1", currency: "CAD" },
    { code: "CH", label: "Switzerland", phone: "41", currency: "CHF" },
    { code: "CY", label: "Cyprus", phone: "357", currency: "EUR" },
    { code: "CZ", label: "Czech Republic", phone: "420", currency: "CZK" },
    { code: "DE", label: "Germany", phone: "49", currency: "EUR" },
    { code: "DK", label: "Denmark", phone: "45", currency: "DKK" },
    { code: "EE", label: "Estonia", phone: "372", currency: "EUR" },
    { code: "ES", label: "Spain", phone: "34", currency: "EUR" },
    { code: "FI", label: "Finland", phone: "358", currency: "EUR" },
    { code: "FR", label: "France", phone: "33", currency: "EUR" },
    { code: "GH", label: "Ghana", phone: "233", currency: "GHS" },
    { code: "GI", label: "Gibraltar", phone: "350", currency: "GIP" },
    { code: "GR", label: "Greece", phone: "30", currency: "EUR" },
    { code: "HK", label: "Hong Kong", phone: "852", currency: "HKD" },
    { code: "HR", label: "Croatia", phone: "385", currency: "EUR" },
    { code: "HU", label: "Hungary", phone: "36", currency: "HUF" },
    { code: "ID", label: "Indonesia", phone: "62", currency: "IDR" },
    { code: "IE", label: "Ireland", phone: "353", currency: "EUR" },
    { code: "IN", label: "India", phone: "91", currency: "INR" },
    { code: "IT", label: "Italy", phone: "39", currency: "EUR" },
    { code: "JP", label: "Japan", phone: "81", currency: "JPY" },
    { code: "KE", label: "Kenya", phone: "254", currency: "KES" },
    { code: "LI", label: "Liechtenstein", phone: "423", currency: "CHF" },
    { code: "LT", label: "Lithuania", phone: "370", currency: "EUR" },
    { code: "LU", label: "Luxembourg", phone: "352", currency: "EUR" },
    { code: "LV", label: "Latvia", phone: "371", currency: "EUR" },
    { code: "MT", label: "Malta", phone: "356", currency: "EUR" },
    { code: "MX", label: "Mexico", phone: "52", currency: "MXN" },
    { code: "MY", label: "Malaysia", phone: "60", currency: "MYR" },
    { code: "NG", label: "Nigeria", phone: "234", currency: "NGN" },
    { code: "NL", label: "Netherlands", phone: "31", currency: "EUR" },
    { code: "NO", label: "Norway", phone: "47", currency: "NOK" },
    { code: "NZ", label: "New Zealand", phone: "64", currency: "NZD" },
    { code: "PL", label: "Poland", phone: "48", currency: "PLN" },
    { code: "PT", label: "Portugal", phone: "351", currency: "EUR" },
    { code: "RO", label: "Romania", phone: "40", currency: "RON" },
    { code: "SE", label: "Sweden", phone: "46", currency: "SEK" },
    { code: "SG", label: "Singapore", phone: "65", currency: "SGD" },
    { code: "SI", label: "Slovenia", phone: "386", currency: "EUR" },
    { code: "SK", label: "Slovakia", phone: "421", currency: "EUR" },
    { code: "TH", label: "Thailand", phone: "66", currency: "THB" },
    { code: "US", label: "United States", phone: "1", currency: "USD" },
    { code: "ZA", label: "South Africa", phone: "27", currency: "ZAR" },
];

export default function AddressForm({
    setHasAdded,
    isEditPopup,
    setSassClose,
}) {
    const [loading, setLoading] = useState(false);
    const { errorsHandling, successAlert, errorAlert } = useAlerts();
    const [fieldErrors, setFieldErrors] = useState({});
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        address_1: "",
        address_2: "",
        city: "",
        province_code: "",
        country_code: "",
        postal_code: "",
    });

    const fetchAddressData = () => {
        axios
            .get(`/get-creator-address`)
            .then((resp) => {
                if (resp?.data?.status && resp?.data?.data) {
                    const data = resp.data.data;
                    setFormData({
                        first_name: data.first_name || "",
                        last_name: data.last_name || "",
                        phone: data.phone || "",
                        address_1: data.address_1 || "",
                        address_2: data.address_2 || "",
                        city: data.city || "",
                        province_code: data.province_code || "",
                        country_code: data.country_code || "",
                        postal_code: data.postal_code || "",
                    });
                }
            })
            .catch((error) => {
                console.error("Error fetching address:", error);
                if (error.response?.status !== 404) {
                    errorAlert("Failed to load address data");
                }
            });
    };

    // Fetch data when component mounts
    useEffect(() => {
        fetchAddressData();
    }, []);

    const updated = [...datas].sort((a, b) => a.label.localeCompare(b.label));

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear field error when user starts typing
        if (fieldErrors[e.target.name]) {
            setFieldErrors((prev) => ({
                ...prev,
                [e.target.name]: "",
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFieldErrors({});

        try {
            const response = await axios.post(
                "creator-store-address",
                formData,
            );

            if (response?.data?.status) {
                successAlert(response?.data?.message);

                if (!isEditPopup) {
                    // For add new address
                    setHasAdded(true);
                } else {
                    // For edit/update - close the popup
                    setSassClose(false);
                }

                // Optional: Add a small delay before closing to show success message
                // setTimeout(() => {
                //     if (isEditPopup) {
                //         setSassClose(false);
                //     }
                // }, 1500);
            } else {
                if (response?.data?.errors) {
                    setFieldErrors(response.data.errors);
                    const errorMessages = Object.values(response.data.errors)
                        .flat()
                        .join("\n");
                    errorsHandling(errorMessages);
                } else {
                    errorAlert(
                        response?.data?.message || "Something went wrong",
                    );
                }
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setFieldErrors(error.response.data.errors);
                const errorMessages = Object.values(error.response.data.errors)
                    .flat()
                    .join("\n");
                errorsHandling(errorMessages);
            } else if (error.response?.data?.message) {
                errorAlert(error.response.data.message);
            } else {
                errorAlert("An error occurred. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="flex flex-col items-center flex-shrink-0">
                <div className="flex items-center">
                    <div className="gift-icon me-2 voilet">
                        <img
                            src={userphoto}
                            alt=""
                            className="h-10 w-10 object-fill rounded-full"
                        />
                    </div>
                    <h2 className="text-xl font-bold text-dark-500">
                        {isEditPopup
                            ? "Edit Your Billing Address"
                            : "Add Your Billing Address Details"}
                    </h2>
                </div>
                <p className="text-red-500 mb-4 mt-2 text-center">
                    Please Triple check your address. These details will be used
                    to ship the product to you. If these details are not correct
                    we will NOT be liable for any lost packages.
                </p>
            </div>

            <div className="flex-1 overflow-y-auto px-1">
                {/* First Name */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-gray-500">First Name</label>
                    <div className="flex-1">
                        <input
                            onChange={handleChange}
                            value={formData.first_name}
                            name="first_name"
                            placeholder="First Name"
                            className={`text-normal border-gray-300 border px-4 py-3 w-full rounded-[30px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-900 ${
                                fieldErrors.first_name ? "border-red-500" : ""
                            }`}
                            required
                        />
                        {fieldErrors.first_name && (
                            <p className="text-red-500 text-sm mt-1 ml-4">
                                {fieldErrors.first_name[0] ||
                                    fieldErrors.first_name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Last Name */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-gray-500">Last Name</label>
                    <div className="flex-1">
                        <input
                            onChange={handleChange}
                            value={formData.last_name}
                            name="last_name"
                            placeholder="Last Name"
                            className={`text-normal border-gray-300 border px-4 py-3 w-full rounded-[30px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-900 ${
                                fieldErrors.last_name ? "border-red-500" : ""
                            }`}
                            required
                        />
                        {fieldErrors.last_name && (
                            <p className="text-red-500 text-sm mt-1 ml-4">
                                {fieldErrors.last_name[0] ||
                                    fieldErrors.last_name}
                            </p>
                        )}
                    </div>
                </div>

                {/* Phone */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-gray-500">Phone</label>
                    <div className="flex-1">
                        <input
                            onChange={(e) => {
                                if (/^[0-9]*$/.test(e.target.value)) {
                                    handleChange(e);
                                }
                            }}
                            value={formData.phone}
                            name="phone"
                            type="tel"
                            placeholder="Phone"
                            className={`text-normal border-gray-300 border px-4 py-3 w-full rounded-[30px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-900 ${
                                fieldErrors.phone ? "border-red-500" : ""
                            }`}
                            required
                        />
                        {fieldErrors.phone && (
                            <p className="text-red-500 text-sm mt-1 ml-4">
                                {fieldErrors.phone[0] || fieldErrors.phone}
                            </p>
                        )}
                    </div>
                </div>

                {/* Address 1 */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-gray-500">Address 1</label>
                    <div className="flex-1">
                        <input
                            onChange={handleChange}
                            value={formData.address_1}
                            name="address_1"
                            placeholder="Address 1"
                            className={`text-normal border-gray-300 border px-4 py-3 w-full rounded-[30px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-900 ${
                                fieldErrors.address_1 ? "border-red-500" : ""
                            }`}
                            required
                        />
                        {fieldErrors.address_1 && (
                            <p className="text-red-500 text-sm mt-1 ml-4">
                                {fieldErrors.address_1[0] ||
                                    fieldErrors.address_1}
                            </p>
                        )}
                    </div>
                </div>

                {/* Address 2 */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-gray-500">Address 2</label>
                    <div className="flex-1">
                        <input
                            onChange={handleChange}
                            value={formData.address_2}
                            name="address_2"
                            placeholder="Address 2"
                            className={`text-normal border-gray-300 border px-4 py-3 w-full rounded-[30px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-900 ${
                                fieldErrors.address_2 ? "border-red-500" : ""
                            }`}
                        />
                        {fieldErrors.address_2 && (
                            <p className="text-red-500 text-sm mt-1 ml-4">
                                {fieldErrors.address_2[0] ||
                                    fieldErrors.address_2}
                            </p>
                        )}
                    </div>
                </div>

                {/* City */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-gray-500">City</label>
                    <div className="flex-1">
                        <input
                            onChange={handleChange}
                            value={formData.city}
                            name="city"
                            placeholder="City"
                            className={`text-normal border-gray-300 border px-4 py-3 w-full rounded-[30px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-900 ${
                                fieldErrors.city ? "border-red-500" : ""
                            }`}
                            required
                        />
                        {fieldErrors.city && (
                            <p className="text-red-500 text-sm mt-1 ml-4">
                                {fieldErrors.city[0] || fieldErrors.city}
                            </p>
                        )}
                    </div>
                </div>

                {/* Province Code */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-gray-500">Province Code</label>
                    <div className="flex-1">
                        <input
                            onChange={(e) => {
                                const numericValue = e.target.value.replace(
                                    /[^0-9]/g,
                                    "",
                                );
                                if (numericValue.length <= 3) {
                                    handleChange({
                                        target: {
                                            name: "province_code",
                                            value: numericValue,
                                        },
                                    });
                                }
                            }}
                            value={formData.province_code}
                            name="province_code"
                            placeholder="Province Code (3 digits)"
                            type="tel"
                            maxLength="3"
                            className={`text-normal border-gray-300 border px-4 py-3 w-full rounded-[30px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-900 ${
                                fieldErrors.province_code
                                    ? "border-red-500"
                                    : ""
                            }`}
                            required
                        />
                        {fieldErrors.province_code && (
                            <p className="text-red-500 text-sm mt-1 ml-4">
                                {fieldErrors.province_code[0] ||
                                    fieldErrors.province_code}
                            </p>
                        )}
                    </div>
                </div>

                {/* Country Select */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-gray-500">Country</label>
                    <div className="flex-1">
                        <select
                            onChange={handleChange}
                            name="country_code"
                            value={formData.country_code}
                            className={`text-normal border-gray-300 border px-4 py-3 w-full rounded-[30px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-900 ${
                                fieldErrors.country_code ? "border-red-500" : ""
                            }`}
                            required
                        >
                            <option value="" disabled>
                                Choose Country
                            </option>
                            {updated.map((c, i) => (
                                <option key={`country-${i}`} value={c.code}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        {fieldErrors.country_code && (
                            <p className="text-red-500 text-sm mt-1 ml-4">
                                {fieldErrors.country_code[0] ||
                                    fieldErrors.country_code}
                            </p>
                        )}
                    </div>
                </div>

                {/* Postal Code */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-gray-500">Postal Code</label>
                    <div className="flex-1">
                        <input
                            onChange={(e) => {
                                if (/^[0-9]*$/.test(e.target.value)) {
                                    handleChange(e);
                                }
                            }}
                            type="tel"
                            value={formData.postal_code}
                            name="postal_code"
                            placeholder="Postal Code"
                            className={`text-normal border-gray-300 border px-4 py-3 w-full rounded-[30px] focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 text-gray-900 ${
                                fieldErrors.postal_code ? "border-red-500" : ""
                            }`}
                            required
                        />
                        {fieldErrors.postal_code && (
                            <p className="text-red-500 text-sm mt-1 ml-4">
                                {fieldErrors.postal_code[0] ||
                                    fieldErrors.postal_code}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 pt-4">
                <LoaderButton
                    type="submit"
                    disabled={loading}
                    className="button p mt-2 w-full"
                    spinnerclass="fill-red-600"
                >
                    {loading
                        ? "Processing..."
                        : isEditPopup
                          ? "Update Address"
                          : "Add Details"}
                </LoaderButton>
            </div>
        </form>
    );
}
