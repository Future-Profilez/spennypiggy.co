import { useState } from "react";
import Popup from "@/Components/Popup";
import { piggy } from "@/includes/Icons";
import LoaderButton from "@/Components/LoaderButton";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAlerts } from "@/Components/Alerts";
import { CiGift } from "react-icons/ci";
import { RyeClient, ENVIRONMENT, Marketplace } from "@rye-api/rye-sdk";
import Countries from "@/includes/Countries";
import AddressForm from "../rye/AddressForm";

export default function AddGift({
    item,
    classes, text,
    updateState,
    fetch_gifts,
    addressAdded,
}) {
    const [close, setClose] = useState();
    const { errorsHandling, successAlert, errorAlert } = useAlerts();
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState(item?.title || "");
    const [hasAdded, setHasAdded] = useState(addressAdded);
    // const [hasAdded, setHasAdded] = useState(false);

    const handleInput = (e) => {
        setTitle(e.target.value);
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

        if (!title.includes("www.amazon")) {
            errorAlert("Only Amazon products are supported");
            setLoading(false);
            return;
        }

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
            if (!productData) {
                errorAlert("Product not found");
                setLoading(false);
                return;
            }
            // Send the fetched product data to your API
            const response = await axios.post(route("create.creator.product"), {
                url: productData,
            });
            if (response && response?.data && response?.data?.status) {
                successAlert(response?.data?.message);
                fetch_gifts && fetch_gifts();
                updateState && updateState(new Date());
                setClose(false);
                window.dispatchEvent(new Event("closeAddOptions"));
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
            <div className="p-1 rounded-[30px]    bg-[#ffe8f2] flex items-center justify-center w-[50px] min-w-[50px] h-[50px]">
                <CiGift color="var(--pink)" size="1.5rem" />
            </div>
            <div className="pl-3 text-left">
                <h2 className="text-md font-normal font-GillSans uppercase">{text ? text :'Add Surprise Gift'}</h2>
                <p className="text-sm font-poppins">
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
            classes={`w-full addop bg-white rounded-[30px]   py-2 px-3 ${classes}`}
            text={<AddItem />}
        >
            {!hasAdded ? (
                <form onSubmit={submitPost}>
                    <div className="flex items-center">
                        <div
                            className={`gift-icon mr-2 voilet`}
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
                        className="text-normal border-gray-300 border px-3 py-3 text-gray-900 rounded-[30px]   w-full focus:outline-none focus:border-[#FF007F] focus:ring-1 focus:ring-pink-500"
                    />
                    <LoaderButton
                        type="submit"
                        disabled={loading}
                        className="p w-full "
                        spinnerclass="fill-red-600"
                    >
                        {loading ? "Adding..." : "Add Item"}
                    </LoaderButton>
                </form>
            ) : (
                <AddressForm setHasAdded={setHasAdded} />
            )}
        </Popup>
    );
}
