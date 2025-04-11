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

                return results?.buyerIdentity?.token || null;
            } catch (error) {
                console.error("Error fetching payment token:", error);
                return null;
import { useEffect, useState } from "react";
import { RyeClient, Marketplace, ENVIRONMENT } from "@rye-api/rye-sdk";
import axios from "axios";

async function getShopperIp() {
    try {
        const response = await fetch("https://api64.ipify.org?format=json");
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("Error fetching shopper IP:", error);
        return "0.0.0.0"; // Fallback IP
    }
}

export default function RyeCartTest() {
    const [storeData, setStoreData] = useState(null);
    const [productList, setProductList] = useState([]);
    const [cartResponse, setCartResponse] = useState(null);
    const [cartDetails, setCartDetails] = useState(null);
    const [error, setError] = useState(null);

    


    useEffect(() => {
        const fetchAndAddProducts = async () => {
            try {

                // Create RyeClient instance
                const ryeClient = new RyeClient({
                    authHeader:
                        "Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6", // Replace with your actual API key
                    shopperIp: shopperIp,
                    environment: ENVIRONMENT.STAGING,
                });

                // Step 1: Add products to Rye Inventory
                const productResult = await ryeClient.requestProductByUrl({
                    input: {
                        url: "https://www.amazon.com/dp/B07FZ8S74R",
                        marketplace: Marketplace.Amazon,
                    },
                });

                console.log("Added Product:", productResult);

                // Extract product ID
                const productId = productResult?.productID;
                if (!productId) {
                    throw new Error("Product ID not returned");
                }

                const response = await fetch(
                    "https://graphql.api.rye.com/v1/query",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Basic <your_encoded_credentials>`, // Replace <your_encoded_credentials> with the actual key
                        },
                        body: JSON.stringify({
                            query: `
                            mutation {
                                requestStoreByURL(input: { url: "https://www.amazon.com" }) {
                                    id
                                    name
                                    details {
                                        domain
                                        createdAt
                                    }
                                }
                            }
                        `,
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                const result = await response.json();
                setStoreData(result.data.requestStoreByURL);

                // console.log("store by url Product:", result);
                // Step 2: Query products from Rye Inventory
                // const products = await ryeClient.getProductsByDomainV2({
                //     input: {
                //         domain: "https://spennypiggy.co/naveen", // Replace with a valid domain
                //     },
                //     pagination: { limit: 10, offset: 0 },
                // });

                // console.log("Fetched Products:", products);
                // setProductList(products);

                // Fetch product details
                // const products = await Promise.all(
                //     productIds.map(async (id) =>
                //         ryeClient.getProductById({
                //             input: { productId: id },
                //         })
                //     )
                // );

                // console.log("Fetched Product Details:", products);

                // Step 3: Create a cart
                // const cartResult = await ryeClient.createCart({
                //     input: {
                //         items: {
                //             amazonCartItemsInput: [
                //                 {
                //                     quantity: 1,
                //                     productId: productId, // Use the fetched product ID
                //                 },
                //             ],
                //         },
                //         buyerIdentity: {
                //             firstName: "Danny",
                //             lastName: "Jangid",
                //             email: "amatata156@gmail.com",
                //             phone: "+1234567890",
                //             address1: "123 Main Street",
                //             city: "New York",
                //             provinceCode: "NY",
                //             countryCode: "US",
                //             postalCode: "10001",
                //         },
                //     },
                //     fetchBuyerIdentity: true,
                // });

                // console.log("Cart Created:", cartResult);
                // setCartResponse(cartResult);

                // const cartId = cartResult?.cart?.id;

                // console.log("cartId", cartId);
                // // // Fetch cart details
                // const cartResults = await ryeClient.getCart({
                //     id: cartId,
                //     fetchBuyerIdentity: true, // Set to true to fetch buyer identity
                //     fetchOffer: false, // Set to true to fetch offers for each store
                //     fetchCartLines: false, // Set to true to fetch cart lines
                //     fetchShippingMethods: false,
                // });

                // console.log("Cart Details:", cartResults);
                // setCartDetails(cartResults);
            } catch (err) {
                console.error("Error:", err);
                setError(
                    "Failed to process your request. Check the console for details."
                );
            }
        };

        const submitAmazonCart = async (cartId) => {
            try {
                const token = "56wyNnSmuA6CWYP7w0MiYCVIbW6";
                // if (!token) {
                //     console.error("No payment token available");
                //     return;
                // }

<<<<<<< HEAD
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

            } catch (error) {
                console.error("Error submitting cart:", error);
            }
        };

        const a = submitAmazonCart("LNfIWLWacr9qNi6VF0tu");
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
=======
    async function addProduct() {
        const shopperIp = await getShopperIp();
        const ryeClient = new RyeClient({
            authHeader: "Basic UllFL3N0YWdpbmctYTA2ZWYwZmYzYTZiNGVjNWI2Y2I6",
            shopperIp: shopperIp,
            environment: ENVIRONMENT.STAGING,
        });
        console.log("ryeClient",ryeClient)
        const url = 'https://www.amazon.com/Casio-MDV106-1AV-Analog-Watch-Black/dp/B009KYJAJY';
        const product = await ryeClient.requestProductByUrl({ 
            input: {
                url: url,
                marketplace: Marketplace.Amazon,
            },
         });
        console.log("product", product);
    }

    const getProducts = async () => { 
        const shopperIp = await getShopperIp();
        const ryeClient = new RyeClient({
            authHeader: "Basic UllFL3N0YWdpbmctYTA2ZWYwZmYzYTZiNGVjNWI2Y2I6",
            shopperIp: shopperIp,
            environment: ENVIRONMENT.STAGING,
        });
        const products = await ryeClient.getProductsByDomainV2({
            input: {
                domain: "https://dev.uk.spennypiggy.co/naveendevuk",
            },
            pagination: { limit: 10, offset: 0 },
        });
        console.log("Fetched Products:", products);
    }


    const addStore = async () => {
        const query = `
            mutation {
                requestStoreByURL(input: { url: "https://www.amazon.com" }) {
                    storeId
                    storeUrl
                    storeStatus
                }
            }
        `;
        try {
            const response = await axios.post(
                "https://staging.graphql.api.rye.com/v1/query",
                { query },
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: "Basic UllFL3N0YWdpbmctYTA2ZWYwZmYzYTZiNGVjNWI2Y2I6",
                    },
                }
            );
            console.log("Store Registered:", response.data);
        } catch (error) {
            console.error("Error Registering Store:", error);
        }
    };
    
    return (
        <div>
        <button className="btn-pink" onClick={addProduct}>Add Product</button>
        <button className="btn-pink" onClick={getProducts}>getProducts</button>
        <button className="btn-pink" onClick={()=>addStore()}>createStore</button>
            <h1>Rye Cart Test</h1>
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <>
                    {productList.length > 0 ? (
                        <div>
                            <h2>Fetched Products</h2>
                            <ul>
                                {productList.map((product, index) => (
                                    <li key={index}>
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                        />
                                        <h3>{product.name}</h3>
                                        <p>{product.description}</p>
                                        <p>Price: ${product.price}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p>Loading products...</p>
                    )}
                    {cartResponse ? (
                        <div>
                            <h2>Cart Response</h2>
                            <pre>{JSON.stringify(cartResponse, null, 2)}</pre>
                        </div>
                    ) : (
                        <p>Loading cart...</p>
                    )}
                </>
>>>>>>> 1dd784816540d81829a9f94cd33c338912f2c0b0
            )}

            {cartId && <p>this is a cart ID:- {cartId}</p>}
            {cartId && <p>this is a cart Item Detail:- {cartItems}</p>}
        </div>
    );
};

export default ProductFetcher;
