import { useState } from "react";
import axios from "axios";
import { RyeClient, ENVIRONMENT, Marketplace } from "@rye-api/rye-sdk";

const ProductFetcher = () => {
    const [url, setUrl] = useState("");
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);

    // Function to get the shopper's IP
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);
        setProducts([]); // Reset products before fetching new ones

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
                    url: url,
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
            const res = await axios.post(route("get.all.products"), {
                url: productData, // Pass productData as the request body
            });

            setProducts(result ? [result] : []); // Set result if found, otherwise empty array
            setResponse(res.data); // Set the response from your API
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Failed to fetch product details.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-xl font-bold mb-4">Fetch Product Details</h2>

            <form onSubmit={handleSubmit} className="mb-4">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Example: - https://www.amazon.com/ROG-B550-F-II-Motherboard-Addressable/dp/B09GP7P1XS"
                    className="border p-2 rounded w-full mb-2"
                    required
                />
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    disabled={loading}
                >
                    {loading ? "Fetching..." : "Fetch Product"}
                </button>
            </form>

            {error && <p className="text-red-500">{error}</p>}

            {response && (
                <div className="border p-4 mt-4">
                    <h3 className="text-lg font-semibold">API Response</h3>
                    {response.message && response.status == "success" ? (
                        <p className="text-green-500">{response.message}</p>
                    ) : (
                        <p className="text-red-500">{response.message}</p>
                    )}{" "}
                </div>
            )}
        </div>
    );
};

export default ProductFetcher;
