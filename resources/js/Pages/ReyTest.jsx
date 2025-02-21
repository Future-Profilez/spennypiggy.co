import { useState } from "react";
import axios from "axios";
import { RyeClient, ENVIRONMENT, Marketplace } from "@rye-api/rye-sdk";

const ProductFetcher = () => {
    const [url, setUrl] = useState("");
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [products, setProducts] = useState([]);
    const [cartId, setCartId] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const [message, setMessage] = useState("");

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

        // try {
        // };

        // Get the shopper's IP
        const shopperIp = await getShopperIp();

        const ryeClient = new RyeClient({
            authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
            shopperIp: shopperIp,
            environment: ENVIRONMENT.STAGING,
        });

        const getPaymentToken = async (cartId) => {
            try {
                const results = await ryeClient.getCart({
                    id: "LNfIWLWacr9qNi6VF0tu",
                    fetchBuyerIdentity: true, // Set to true to fetch buyer identity
                    fetchOffer: true, // Set to true to fetch offers for each store
                    fetchCartLines: true, // Set to true to fetch cart lines
                    fetchShippingMethods: true, // Set to true to fetch shipping methods
                });

                console.log("Cart Data with Buyer Identity:", results);
                return results?.buyerIdentity?.token || null;
            } catch (error) {
                console.error("Error fetching payment token:", error);
                return null;
            }
        };

        const submitAmazonCart = async (cartId) => {
            console.log("cartId", cartId);
            try {
                const token = "56wyNnSmuA6CWYP7w0MiYCVIbW6";
                // if (!token) {
                //     console.error("No payment token available");
                //     return;
                // }

                const result = await ryeClient.submitCart({
                    input: {
                        id: cartId,
                        token: token,
                        billingAddress: {
                            firstName: "John",
                            lastName: "Doe",
                            phone: "+61212345678", // Valid E.164 format (US number)
                            address1: "123 Main Street",
                            address2: "Apt 4B",
                            city: "New York",
                            provinceCode: "NY", // New York state code
                            countryCode: "US", // United States country code
                            postalCode: "10001", // Valid US ZIP code
                        },
                    },
                });

                console.log("Cart submitted successfully:", result);
            } catch (error) {
                console.error("Error submitting cart:", error);
            }
        };

        const a = submitAmazonCart("LNfIWLWacr9qNi6VF0tu");
        console.log("a", a);
        // Requesting product details from Rye API using Amazon URL
        // const result = await ryeClient.requestProductByUrl({
        //     input: {
        //         url: url,
        //         marketplace: Marketplace.Amazon,
        //     },
        // });

        // console.log("result details", result);

        // User Identity Details
        // const buyerIdentity = {
        //     firstName: "John",
        //     lastName: "Doe",
        //     email: "johndoe@example.com",
        //     phone: "+15551234567", // Dummy US phone number
        //     address1: "123 Main Street",
        //     address2: "Apt 4B",
        //     city: "New York",
        //     provinceCode: "NY",
        //     postalCode: "10001",
        // };

        // Function to create a cart with buyer identity
        // const createCartWithIdentity = async () => {
        // setLoading(true);
        // setError(null);
        // setMessage("");

        // // try {
        // const resultss = await ryeClient.createCart({
        //     input: {
        //         items: {
        //             amazonCartItemsInput: [
        //                 {
        //                     quantity: 1,
        //                     productId: result.productID, // Example Amazon Product ID
        //                 },
        //             ],
        //         },
        //         buyerIdentity: {
        //             firstName: 'John',
        //             lastName: 'Doe',
        //             email: 'johndoe@example.com',
        //             phone: '+1 212-555-1234', // US phone number format
        //             address1: '1600 Amphitheatre Parkway',
        //             address2: 'Suite 100', // Optional
        //             city: 'Mountain View',
        //             provinceCode: 'CA', // US state code (California)
        //             countryCode: 'US', // US country code
        //             postalCode: '94043', // US ZIP code format
        //           },
        //     },
        // });

        // // Send the fetched product data to your API
        // const addCart = await axios.post(route("create.cart"), {
        //     data: resultss, // Pass productData as the request body
        //     cart_id: resultss.cart.id, // Pass productData as the request body
        // });

        // console.log("addCart:", addCart);
        // setCartId(resultss.id);
        // setMessage("Cart created successfully!");
        // } catch (err) {
        //     console.error("Error creating cart:", err);
        //     setError("Failed to create cart.");
        // } finally {
        //     setLoading(false);
        // }
        // };

        // Function to add items to an existing cart
        // const addToCart = async () => {
        // if (!cartId) {
        //     setError("Create a cart first.");
        //     return;
        // }

        // setLoading(true);
        // setError(null);
        // setMessage("");

        // try {
        // const results = await ryeClient.addCartItems({
        //     input: {
        //         id: resultss.cart.id,
        //         items: {
        //             amazonCartItemsInput: [
        //                 {
        //                     quantity: 1,
        //                     productId: result.productID,
        //                 },
        //             ],
        //         },
        //     },
        // });

        // console.log("Item Added to Cart:", results);
        // setCartItems(results.cartItems || []);
        // setMessage("Item added to cart successfully!");
        // } catch (err) {
        //     console.error("Error adding item to cart:", err);
        //     setError("Failed to add item to cart.");
        // } finally {
        //     setLoading(false);
        // }

        // Fetching the product details using the productID
        //     const productData = await ryeClient.getProductById({
        //         input: {
        //             id: result.productID,
        //             marketplace: "AMAZON",
        //         },
        //     });

        //     // Send the fetched product data to your API
        //     const res = await axios.post(route("create.creator.product"), {
        //         url: productData, // Pass productData as the request body
        //     });

        //     setProducts(result ? [result] : []); // Set result if found, otherwise empty array
        //     setResponse(res.data); // Set the response from your API
        // } catch (err) {
        //     console.error("Error fetching products:", err);
        //     setError("Failed to fetch product details.");
        // } finally {
        //     setLoading(false);
        // }
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-xl font-bold mb-4">Fetch Product Details</h2>

            <form onSubmit={handleSubmit} className="mb-4">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Product URL Example: - https://www.amazon.com/ROG-B550-F-II-Motherboard-Addressable/dp/B09GP7P1XS"
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

            {cartId && <p>this is a cart ID:- {cartId}</p>}
            {cartId && <p>this is a cart Item Detail:- {cartItems}</p>}
        </div>
    );
};

export default ProductFetcher;
