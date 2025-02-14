<<<<<<< HEAD
import { useEffect, useState } from "react";
import { RyeClient, Marketplace, ENVIRONMENT } from "@rye-api/rye-sdk";
import axios from "axios";
=======
// import { useEffect, useState } from "react";
// import { RyeClient, ENVIRONMENT } from "@rye-api/rye-sdk";

// async function getShopperIp() {
//     try {
//         const response = await fetch("https://api64.ipify.org?format=json");
//         const data = await response.json();
//         return data.ip;
//     } catch (error) {
//         console.error("Error fetching shopper IP:", error);
//         return "0.0.0.0"; // Fallback IP
//     }
// }

// export default function ProductListing() {
//     const [products, setProducts] = useState([]);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);
//     const [page, setPage] = useState(1);
//     const limit = 9; // Number of products per page

//     useEffect(() => {
//         fetchProducts();
//     }, [page]);

//     const fetchProducts = async () => {
//         setLoading(true);
//         try {
//             const shopperIp = await getShopperIp();

//             const ryeClient = new RyeClient({
//                 authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
//                 shopperIp: shopperIp,
//                 environment: ENVIRONMENT.STAGING,
//             });

//             const result = await ryeClient.getProductsByDomainV2({
//                 input: { domain: "hiutdenim.co.uk" },
//                 pagination: { limit, offset: (page - 1) * limit }, // Pagination
//             });

//             setProducts(result || []);
//         } catch (err) {
//             console.error("Error fetching products:", err);
//             setError("Failed to fetch products.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div className="container mx-auto p-6">
//             <h1 className="text-3xl font-bold mb-6 text-center">Product Listing</h1>

//             {loading && <p className="text-center text-gray-500">Loading products...</p>}
//             {error && <p className="text-red-500 text-center">{error}</p>}

//             {products.length > 0 ? (
//                 <div>
//                     {/* Product Grid */}
//                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//                         {products.map((product) => (
//                             <div key={product.id} className="border rounded-lg p-4 shadow-md bg-white">
//                                 <img
//                                     src={product.images?.[0]?.url || "https://via.placeholder.com/150"}
//                                     alt={product.title}
//                                     className="w-full h-48 object-cover rounded-md mb-4"
//                                 />
//                                 <h2 className="text-lg font-semibold">{product.title}</h2>
//                                 <p className="text-gray-700">{product.description}</p>
//                                 <p className="text-gray-700 font-semibold mt-2">
//                                     Price: {product.price?.displayValue}
//                                 </p>
//                                 <p className="text-sm text-gray-500">
//                                     Tags: {product.tags?.join(", ")}
//                                 </p>
//                                 <button
//                                     className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 w-full"
//                                     onClick={() => addProductToStore(product)}
//                                 >
//                                     Add to Store
//                                 </button>
//                             </div>
//                         ))}
//                     </div>

//                     {/* Pagination */}
//                     <div className="flex justify-center gap-4 mt-6">
//                         <button
//                             className="bg-gray-500 text-white py-2 px-4 rounded-md disabled:opacity-50"
//                             onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
//                             disabled={page === 1}
//                         >
//                             Previous
//                         </button>
//                         <span className="text-lg font-medium">Page {page}</span>
//                         <button
//                             className="bg-gray-500 text-white py-2 px-4 rounded-md"
//                             onClick={() => setPage((prev) => prev + 1)}
//                         >
//                             Next
//                         </button>
//                     </div>
//                 </div>
//             ) : (
//                 <p className="text-center text-gray-500">No products found.</p>
//             )}
//         </div>
//     );
// }

import { useEffect, useState } from "react";
import { RyeClient, ENVIRONMENT } from "@rye-api/rye-sdk";
>>>>>>> 7c32762d860d1497ffa85f896140b6ae3bd1b0d2

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

<<<<<<< HEAD
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
=======
export default function ProductListing() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [cartId, setCartId] = useState(null); // Store cart ID
    const limit = 9; // Number of products per page

    useEffect(() => {
        fetchProducts();
    }, [page]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const shopperIp = await getShopperIp();

            const ryeClient = new RyeClient({
                authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
                shopperIp: shopperIp,
                environment: ENVIRONMENT.STAGING,
            });

            const result = await ryeClient.getProductsByDomainV2({
                input: { domain: "rye-test-store.myshopify.com/" },
                pagination: { limit, offset: (page - 1) * limit }, // Pagination
            });

            console.log('result',result)
            setProducts(result || []);
        } catch (err) {
            console.error("Error fetching products:", err);
            setError("Failed to fetch products.");
        } finally {
            setLoading(false);
        }
    };
    const shopperIp = getShopperIp();

    const ryeClient = new RyeClient({
        authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
        shopperIp: shopperIp,
        environment: ENVIRONMENT.STAGING,
    });

    const addProductToStore = async (product) => {
        if (!cartId) {
            // Create a new cart if it doesn't exist
            try {
                const createCartResult = await ryeClient.createCart({
                    input: {
                        items: {
                            amazonCartItemsInput: [
                                {
                                    quantity: 1,
                                    productId: product.id, // Use the product ID here
                                },
                            ],
                        },
                    },
                });

                console.log(createCartResult);
                setCartId(createCartResult.cart.id); // Save the cart ID
                alert("Cart created successfully!");
            } catch (err) {
                console.error("Error creating cart:", err);
                setError("Failed to create cart.");
            }
        } else {
            // Add product to the existing cart
            try {
                const shopperIp = await getShopperIp();

                const ryeClient = new RyeClient({
                    authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
>>>>>>> 7c32762d860d1497ffa85f896140b6ae3bd1b0d2
                    shopperIp: shopperIp,
                    environment: ENVIRONMENT.STAGING,
                });

<<<<<<< HEAD
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

        fetchAndAddProducts();
    }, []);

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
=======
                console.log(ryeClient);

                const addProductResult = await ryeClient.addCartItems({
                    input: {
                        id: cartId,
                        items: {
                            shopifyCartItemsInput: [
                                {
                                    quantity: 1,
                                    variantId: product.id, // Use the product's variant ID here
                                },
                            ],
                        },
                    },
                });
                console.log(addProductResult);

                alert("Product added to cart!");
            } catch (err) {
                console.error("Error adding product to cart:", err);
                setError("Failed to add product to cart.");
            }
        }
    };

    return (
        <div className="relative container mx-auto p-6">
            {/* Cart Button */}
            <button
                className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700"
            >
                Go to Cart
            </button>
            // Trigger cart navigation
            <h1 className="text-3xl font-bold mb-6 text-center">
                Product Listing
            </h1>
            {loading && (
                <p className="text-center text-gray-500">Loading products...</p>
            )}
            {error && <p className="text-red-500 text-center">{error}</p>}
            {products.length > 0 ? (
                <div>
                    {/* Product Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="border rounded-lg p-4 shadow-md bg-white"
                            >
                                <img
                                    src={
                                        product.images?.[0]?.url ||
                                        "https://via.placeholder.com/150"
                                    }
                                    alt={product.title}
                                    className="w-full h-48 object-cover rounded-md mb-4"
                                />
                                <h2 className="text-lg font-semibold">
                                    {product.title}
                                </h2>
                                <p className="text-gray-700">
                                    {product.description}
                                </p>
                                <p className="text-gray-700 font-semibold mt-2">
                                    Price: {product.price?.displayValue}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Tags: {product.tags?.join(", ")}
                                </p>
                                <button
                                    className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 w-full"
                                    onClick={() => addProductToStore(product)}
                                >
                                    Add to Store
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex justify-center gap-4 mt-6">
                        <button
                            className="bg-gray-500 text-white py-2 px-4 rounded-md disabled:opacity-50"
                            onClick={() =>
                                setPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={page === 1}
                        >
                            Previous
                        </button>
                        <span className="text-lg font-medium">Page {page}</span>
                        <button
                            className="bg-gray-500 text-white py-2 px-4 rounded-md"
                            onClick={() => setPage((prev) => prev + 1)}
                        >
                            Next
                        </button>
                    </div>
                </div>
            ) : (
                <p className="text-center text-gray-500">No products found.</p>
>>>>>>> 7c32762d860d1497ffa85f896140b6ae3bd1b0d2
            )}
        </div>
    );
}
