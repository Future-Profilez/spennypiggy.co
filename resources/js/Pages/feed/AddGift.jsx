import React, { useState } from "react";
import Popup from "@/Components/Popup";
import { piggy } from "@/includes/Icons";
import LoaderButton from "@/Components/LoaderButton";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAlerts } from "@/Components/Alerts";
import { CiGift } from "react-icons/ci";
import { RyeClient, ENVIRONMENT, Marketplace } from "@rye-api/rye-sdk";
import Countries from "@/includes/Countries";

export default function AddGift({
    item,
    classes,
    updateState,
    fetch_gifts,
    addressAdded,
}) {
    const [close, setClose] = useState();
    const { errorsHandling, successAlert, errorAlert } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(item?.title || "");
    const [hasAdded, setHasAdded] = useState(addressAdded);
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
    console.log("addressAdded", addressAdded);

    const data = [
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

    const updated = data.sort((a, b) => a.label.localeCompare(b.label));

    const handleInput = (e) => {
        setTitle(e.target.value);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("formData", formData);
        // Send the fetched product data to your API
        try {
            const response = await axios.post(
                "creator-store-address",
                formData
            );
            console.log("response?.data", response?.data);
            if (response?.data?.status === "success") {
                successAlert(response?.data?.message);
                setHasAdded(true);
            } else {
                errorAlert(response?.data?.message);
            }
        } catch (error) {
            errorAlert(error);
        }
    };

    const getCountry = (e) => {
        const selectedCode = e.target.value;
        const selectedCountry = data.find(
            (country) => country.code === selectedCode
        );

        if (selectedCountry) {
            console.log("Selected Country:", selectedCountry.label);
            setFormData({ ...formData, country_code: selectedCountry.code });
        } else {
            setFormData({ ...formData, country_code: "" });
        }
    };

    const getShopperIp = async () => {
        try {
            const response = await fetch("https://api64.ipify.org?format=json");
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error("Error fetching shopper IP:", error);
            return "0.0.0.0"; // Fallback IP
        }
    };

    const submitPost = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Get the shopper's IP
            const shopperIp = await getShopperIp();

            const ryeClient = new RyeClient({
                authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
                shopperIp: shopperIp,
                environment: ENVIRONMENT.STAGING,
            });

            // Requesting product details from Rye API using Amazon URL
            const result = await ryeClient.requestProductByUrl({
                input: {
                    url: title,
                    marketplace: Marketplace.Amazon,
                },
            });

            // Fetching the product details using the productID
            const productData = await ryeClient.getProductById({
                input: {
                    id: result.productID,
                    marketplace: "AMAZON",
                },
            });

            console.log("productData:", productData);
            console.log("Product details fetched from Rye API:", result);

            // Send the fetched product data to your API
            const response = await axios.post(route("create.creator.product"), {
                url: productData,
            });
            console.log("response:", response);
            if (response.data.status === "success") {
                successAlert(response.data.message);
                fetch_gifts && fetch_gifts();
                updateState && updateState(new Date());
                setClose(false);
                setTimeout(() => {
                    setClose();
                }, 100);
            } else {
                errorAlert(response.data.message);
            }

            setLoading(false);
        } catch (err) {
            setLoading(false);
            errorsHandling(err);
        }
    };

    const AddItem = () => (
        <div className="flex items-center">
            <div className="p-1 rounded-lg bg-[#ffe8f2] flex items-center justify-center w-[50px] h-[50px]">
                <CiGift color="var(--pink)" size="1.5rem" />
            </div>
            <div className="ps-3 text-start">
                <h2 className="text-md">Add a Gift</h2>
                <p className="text-sm font-normal">
                    Add a gift link or URL from Amazon
                </p>
            </div>
        </div>
    );

    return (
        <Popup
            modalclass=""
            space="4"
            size={hasAdded ? "md" : "lg"}
            action={close}
            classes={`w-full addop bg-white rounded-xl py-2 px-3 ${classes}`}
            text={<AddItem />}
        >
            {hasAdded ? (
                <form onSubmit={submitPost}>
                    <div className="flex align-items-center">
                        <div
                            className={`gift-icon me-2 voilet`}
                            dangerouslySetInnerHTML={{ __html: piggy }}
                        />
                        <h2 className="text-xl font-bold text-dark-500">
                            Add Gift Item
                        </h2>
                    </div>
                    <p className="text-grey-500 mb-3 mt-4">
                        Enter a Product URL here
                    </p>
                    <input
                        onChange={handleInput}
                        value={title}
                        name="title"
                        required
                        placeholder="Example - https://www.amazon.com/Gaming-Headphone-Controller-Holder-Organizer-Black/dp/B0BPSP3BQH"
                        className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                    />
                    <LoaderButton
                        type="submit"
                        disabled={loading}
                        className="flex btn-pink lg mt-4 w-full "
                        spinnerClassName="fill-red-600"
                    >
                        {loading ? "Adding..." : "Add Item"}
                    </LoaderButton>
                </form>
            ) : (
                <form
                    onSubmit={handleSubmit}
                    className="overflow-auto max-h-[70vh]"
                >
                    <div className="flex flex-col align-items-center">
                        <div className="flex align-items-center">
                            <div
                                className={`gift-icon me-2 voilet`}
                                dangerouslySetInnerHTML={{ __html: piggy }}
                            />
                            <h2 className="text-xl font-bold text-dark-500">
                                Add Your Biiling Address Details
                            </h2>
                        </div>
                        <p className="text-red-500">
                            These details will be used to send you the project
                            from amazon, when someone orders it.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-3 mt-4">
                        <div className="flex flex-col w-full">
                            <p className="text-grey-500 mb-1">
                                Enter your First Name here
                            </p>
                            <input
                                onChange={handleChange}
                                value={formData.first_name}
                                name="first_name"
                                placeholder="First Name"
                                className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                                required
                            />
                        </div>
                        <div className="flex flex-col w-full">
                            <p className="text-grey-500 mb-1">
                                Enter your Last Name here
                            </p>
                            <input
                                onChange={handleChange}
                                value={formData.last_name}
                                name="last_name"
                                placeholder="Last Name"
                                className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                                required
                            />
                        </div>
                    </div>
                    <p className="text-grey-500 mb-1 mt-2">
                        Enter your Phone Number here
                    </p>
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
                        className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control mb-3"
                        required
                    />
                    <div className="my-2">
                        <p className="text-grey-500 mb-1">
                            Enter your Address details below
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 ">
                            <div className="flex flex-col w-full">
                                <input
                                    onChange={handleChange}
                                    value={formData.address_1}
                                    name="address_1"
                                    placeholder="Address 1"
                                    className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                                    required
                                />
                            </div>
                            <div className="flex flex-col w-full">
                                {/* <p className="text-grey-500 mb-1">
                                Enter your Last Name here
                            </p> */}
                                <input
                                    onChange={handleChange}
                                    value={formData.address_2}
                                    name="address_2"
                                    placeholder="Address 2"
                                    className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-3">
                        <input
                            onChange={handleChange}
                            value={formData.city}
                            name="city"
                            placeholder="City"
                            className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                            required
                        />
                        <input
                            onChange={(e) => {
                                if (e.target.value.length <= 3) {
                                    handleChange(e);
                                }
                            }}
                            value={formData.province_code}
                            name="province_code"
                            placeholder="Province Code"
                            className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                            required
                        />
                        {/* <Countries
                            send={handleChange}
                            className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                        /> */}
                        <select
                            onChange={getCountry}
                            name="country_code"
                            className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                            required
                        >
                            <option value="" disabled selected>
                                Choose
                            </option>
                            {updated &&
                                updated.map((c, i) => (
                                    <option key={`country-${i}`} value={c.code}>
                                        {c.label}
                                    </option>
                                ))}
                        </select>
                        <input
                            onChange={handleChange}
                            type="number"
                            value={formData.postal_code}
                            name="postal_code"
                            placeholder="Postal Code"
                            className="text-normal form-input border px-3 py-3 text-dark rounded-4 text-post-content form-control"
                            required
                        />
                    </div>

                    <LoaderButton
                        type="submit"
                        disabled={loading}
                        className="flex btn-pink lg mt-4 w-full "
                        spinnerClassName="fill-red-600"
                    >
                        {loading ? "Adding..." : "Add Details"}
                    </LoaderButton>
                </form>
            )}
        </Popup>
    );
}
