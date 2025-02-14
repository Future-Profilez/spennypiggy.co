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
                    shopperIp: shopperIp,
                    environment: ENVIRONMENT.STAGING,
                });

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
            )}
        </div>
    );
}
