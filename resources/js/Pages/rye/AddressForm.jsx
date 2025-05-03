import React from "react";
import LoaderButton from "@/Components/LoaderButton";
import { piggy } from "@/includes/Icons";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";
import { useAlerts } from "@/Components/Alerts";
import { BiSolidShow } from "react-icons/bi";
import { BiHide } from "react-icons/bi";

const datas = [
    {
        code: "AT",
        label: "Austria",
        phone: "43",
        currency: "EUR",
    },
    {
        code: "AU",
        label: "Australia",
        phone: "61",
        currency: "AUD",
    },

    {
        code: "AE",
        label: "United Arab Emirates",
        phone: "971",
        currency: "AED",
    },
    {
        code: "BE",
        label: "Belgium",
        phone: "32",
        currency: "EUR",
    },

    {
        code: "BG",
        label: "Bulgaria",
        phone: "359",
        currency: "BGN",
    },

    {
        code: "BR",
        label: "Brazil",
        phone: "55",
        currency: "BRL",
    },

    {
        code: "CA",
        label: "Canada",
        phone: "1",
        currency: "CAD",
    },

    {
        code: "CH",
        label: "Switzerland",
        phone: "41",
        currency: "CHF",
    },

    {
        code: "CY",
        label: "Cyprus",
        phone: "357",
        currency: "EUR",
    },
    {
        code: "CZ",
        label: "Czech Republic",
        phone: "420",
        currency: "CZK",
    },
    {
        code: "DE",
        label: "Germany",
        phone: "49",
        currency: "EUR",
    },

    {
        code: "DK",
        label: "Denmark",
        phone: "45",
        currency: "DKK",
    },

    {
        code: "EE",
        label: "Estonia",
        phone: "372",
        currency: "EUR",
    },

    {
        code: "ES",
        label: "Spain",
        phone: "34",
        currency: "EUR",
    },

    {
        code: "FI",
        label: "Finland",
        phone: "358",
        currency: "EUR",
    },

    {
        code: "FR",
        label: "France",
        phone: "33",
        currency: "EUR",
    },
    {
        code: "GH",
        label: "Ghana",
        phone: "233",
        currency: "GHS",
    },
    {
        code: "GI",
        label: "Gibraltar",
        phone: "350",
        currency: "GIP",
    },

    {
        code: "GR",
        label: "Greece",
        phone: "30",
        currency: "EUR",
    },
    {
        code: "HK",
        label: "Hong Kong",
        phone: "852",
        currency: "HKD",
    },

    {
        code: "HR",
        label: "Croatia",
        phone: "385",
        currency: "EUR",
    },

    {
        code: "HU",
        label: "Hungary",
        phone: "36",
        currency: "HUF",
    },
    {
        code: "ID",
        label: "Indonesia",
        phone: "62",
        currency: "IDR",
    },
    {
        code: "IE",
        label: "Ireland",
        phone: "353",
        currency: "EUR",
    },
    {
        code: "IN",
        label: "India",
        phone: "91",
        currency: "INR",
    },
    {
        code: "IT",
        label: "Italy",
        phone: "39",
        currency: "EUR",
    },
    {
        code: "JP",
        label: "Japan",
        phone: "81",
        currency: "JPY",
    },
    {
        code: "KE",
        label: "Kenya",
        phone: "254",
        currency: "KES",
    },

    {
        code: "LI",
        label: "Liechtenstein",
        phone: "423",
        currency: "CHF",
    },

    {
        code: "LT",
        label: "Lithuania",
        phone: "370",
        currency: "EUR",
    },
    {
        code: "LU",
        label: "Luxembourg",
        phone: "352",
        currency: "EUR",
    },
    {
        code: "LV",
        label: "Latvia",
        phone: "371",
        currency: "EUR",
    },

    {
        code: "MT",
        label: "Malta",
        phone: "356",
        currency: "EUR",
    },

    {
        code: "MX",
        label: "Mexico",
        phone: "52",
        currency: "MXN",
    },
    {
        code: "MY",
        label: "Malaysia",
        phone: "60",
        currency: "MYR",
    },

    {
        code: "NG",
        label: "Nigeria",
        phone: "234",
        currency: "NGN",
    },

    {
        code: "NL",
        label: "Netherlands",
        phone: "31",
        currency: "EUR",
    },
    {
        code: "NO",
        label: "Norway",
        phone: "47",
        currency: "NOK",
    },
    {
        code: "NZ",
        label: "New Zealand",
        phone: "64",
        currency: "NZD",
    },
    {
        code: "PL",
        label: "Poland",
        phone: "48",
        currency: "PLN",
    },
    {
        code: "PT",
        label: "Portugal",
        phone: "351",
        currency: "EUR",
    },
    {
        code: "RO",
        label: "Romania",
        phone: "40",
        currency: "RON",
    },
    {
        code: "SE",
        label: "Sweden",
        phone: "46",
        currency: "SEK",
    },
    {
        code: "SG",
        label: "Singapore",
        phone: "65",
        currency: "SGD",
    },
    {
        code: "SI",
        label: "Slovenia",
        phone: "386",
        currency: "EUR",
    },
    {
        code: "SK",
        label: "Slovakia",
        phone: "421",
        currency: "EUR",
    },
    {
        code: "TH",
        label: "Thailand",
        phone: "66",
        currency: "THB",
    },
    {
        code: "US",
        label: "United States",
        phone: "1",
        currency: "USD",
    },
    {
        code: "ZA",
        label: "South Africa",
        phone: "27",
        currency: "ZAR",
    },
];


export default function AddressForm({
    setHasAdded,
    isEditPopup,
    setSassClose,
}) {
    const [loading, setLoading] = useState(false);
    const [addressData, setAddressData] = useState({});
    const { errorsHandling, successAlert, errorAlert } = useAlerts();
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
            .get(`get-creator-address`)
            .then((resp) => {
                if (resp?.data?.status) {
                    setAddressData(resp?.data?.data);
                } else {
                    setAddressData({});
                }
            })
            .catch((_err) => {
                console.error("error", _err);
            });
    };

    // Fetch data when component mounts
    useEffect(() => {
        if (isEditPopup) {
            fetchAddressData();
        }
    }, []);

    // Update formData when addressData changes
    useEffect(() => {
        if (addressData && Object.keys(addressData).length > 0) {
            setFormData({
                first_name: addressData?.first_name || "",
                last_name: addressData?.last_name || "",
                phone: addressData?.phone || "",
                address_1: addressData?.address_1 || "",
                address_2: addressData?.address_2 || "",
                city: addressData?.city || "",
                province_code: addressData?.province_code || "",
                country_code: addressData?.country_code || "",
                postal_code: addressData?.postal_code || "",
            });
        }
    }, [addressData]); // Runs when addressData updates

    

    const updated = datas.sort((a, b) => a.label.localeCompare(b.label));

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getCountry = (e) => {
        const selectedCode = e.target.value;
        const selectedCountry = datas.find(
            (country) => country.code === selectedCode
        );

        if (selectedCountry) {
            setFormData({ ...formData, country_code: selectedCountry.code });
        } else {
            setFormData({ ...formData, country_code: "" });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(
                "creator-store-address",
                formData
            );

            if (response?.data?.status) {
                successAlert(response?.data?.message);
                if (!isEditPopup) {
                    setHasAdded(true);
                } else {
                    setSassClose(false);
                }
            } else {
                if (response?.data?.errors) {
                    const errorMessages = Object.values(response.data.errors)
                        .flat()
                        .join(" \n");
                    errorsHandling(errorMessages);
                } else {
                    errorAlert(response?.data?.message);
                }
            }
        } catch (error) {
            console.log("error", error);
            errorAlert(error?.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };
    const [showDetails, setShowDetails] = useState(addressData ? true : false);


    return (
        <form onSubmit={handleSubmit} className="overflow-auto max-h-[70vh]">
            <div className="flex flex-col align-items-center">
                <div className="flex align-items-center">
                    <div
                        className={`gift-icon me-2 voilet`}
                        dangerouslySetInnerHTML={{ __html: piggy }}
                    />
                    <h2 className="text-xl font-bold text-dark-500">
                        Add Your Billing Address Details
                    </h2>
                </div>
                <p className="text-red-500 mb-4 mt-2">
                    Please Triple check your address. These details will be used
                    to ship the product to you. If these details are not correct
                    we will NOT be liable for any lost packages.
                    {/* These details will be used to ship the gifts directly to your door. These details are kept secure and not shared with the gifter. */}
                </p>
            </div>
            {showDetails ?<div>
                {/* First Name */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-grey-500">First Name</label>
                    <input
                        onChange={handleChange}
                        value={formData.first_name}
                        name="first_name"
                        placeholder="First Name"
                        className="flex-1 text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                        required
                    />
                </div>

                {/* Last Name */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-grey-500">Last Name</label>
                    <input
                        onChange={handleChange}
                        value={formData.last_name}
                        name="last_name"
                        placeholder="Last Name"
                        className="flex-1 text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                        required
                    />
                </div>

                {/* Phone */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-grey-500">Phone</label>
                    <input
                        onChange={(e) => {
                            if (
                                e.target.value.length <= 10 &&
                                /^[0-9]*$/.test(e.target.value)
                            ) {
                                handleChange(e);
                            }
                        }}
                        value={formData.phone}
                        name="phone"
                        type="text"
                        maxLength="10"
                        placeholder="Phone"
                        className="flex-1 text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                        required
                    />
                </div>

                {/* Address 1 */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-grey-500">Address 1</label>
                    <input
                        onChange={handleChange}
                        value={formData.address_1}
                        name="address_1"
                        placeholder="Address 1"
                        className="flex-1 text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                        required
                    />
                </div>

                {/* Address 2 */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-grey-500">Address 2</label>
                    <input
                        onChange={handleChange}
                        value={formData.address_2}
                        name="address_2"
                        placeholder="Address 2"
                        className="flex-1 text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                        required
                    />
                </div>

                {/* City */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-grey-500">City</label>
                    <input
                        onChange={handleChange}
                        value={formData.city}
                        name="city"
                        placeholder="City"
                        className="flex-1 text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                        required
                    />
                </div>

                {/* Province Code */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-grey-500">Province</label>
                    <input
                        onChange={(e) => {
                            if (e.target.value.length <= 3) {
                                handleChange(e);
                            }
                        }}
                        value={formData.province_code}
                        name="province_code"
                        placeholder="Province Code"
                        className="flex-1 text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                        required
                    />
                </div>

                {/* Country Select */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-grey-500">Country</label>
                    <select
                        onChange={getCountry}
                        name="country_code"
                        value={formData.country_code}
                        className="flex-1 text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                        required
                    >
                        <option value="" disabled>
                            Choose
                        </option>
                        {updated.map((c, i) => (
                            <option key={`country-${i}`} value={c.code}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Postal Code */}
                <div className="flex items-center mb-3">
                    <label className="w-28 text-grey-500">Postal Code</label>
                    <input
                        onChange={handleChange}
                        type="number"
                        value={formData.postal_code}
                        name="postal_code"
                        placeholder="Postal Code"
                        className="flex-1 text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                        required
                    />
                </div>

                <LoaderButton
                    type="submit"
                    disabled={loading}
                    className="flex btn-pink lg mt-2 w-full "
                    spinnerClassName="fill-red-600"
                >
                    {loading && isEditPopup
                        ? "Updating..."
                        : loading && !isEditPopup
                        ? "Adding..."
                        : isEditPopup
                        ? "Update Details"
                        : "Add Details"}
                </LoaderButton>
            </div> 
            :
            <div className="showHideDetailsCol flex justify-center my-4">
                <div>
                    <div className="h-[50px] w-[50px] flex items-center justify-center rounded-full bluebg text-white  m-auto"><BiHide size={'1.6rem'} /></div>
                    <h2 className="text-center text-xl font-bold mt-2">Your Details are hidden</h2>
                    <p className="text-gray-500 text-center mt-2">Your address is hidden to keep you safe.</p>
                    <p className="text-gray-500 text-center mt-1">Please do not this information on stream or while you are record.</p>
                    <button  className="cursor-pointer m-auto flex items-center pinkbg text-white p-2 rounded-xl px-3 my-3" onClick={() => setShowDetails(!showDetails)} > {showDetails  ? <> <BiHide size={'1.6rem'} className="me-1" /> Hide Details</> : <> <BiSolidShow className="me-1" size={'1.6rem'} /> Show Details</> } </button>
                </div>
            </div>
            }
        </form>
    );
}
