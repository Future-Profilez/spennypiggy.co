import { useEffect, useState } from "react";
import { RyeClient, ENVIRONMENT } from "@rye-api/rye-sdk";

// Function to get user's IP address
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

const Cart = () => {
  const [cartData, setCartData] = useState([]);
  console.log(cartData)
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarts = async () => {
      try {
        const storedCartData = localStorage.getItem("cartId");
        if (!storedCartData) {
          setError("No cart data found in localStorage");
          setLoading(false);
          return;
        }

        let cartRecords;
        try {
          cartRecords = JSON.parse(storedCartData);
        } catch (parseError) {
          setError("Invalid cart data format in localStorage");
          setLoading(false);
          return;
        }

        if (!Array.isArray(cartRecords)) {
          setError("Cart data is not an array");
          setLoading(false);
          return;
        }

        const shopperIp = await getShopperIp();

        const ryeClient = new RyeClient({
          authHeader: `Basic UllFL3N0YWdpbmctYTlmYjk0YjhmYTM1NGE4MTg5NWI6`, // Use env variable
          shopperIp: shopperIp,
          environment: ENVIRONMENT.STAGING,
        });

        const uniqueCartIds = [...new Set(cartRecords.map(cart => cart.cartId))]; // Remove duplicates

        const cartResponses = await Promise.all(
          uniqueCartIds.map(async (id) => {
            try {
              const response = await ryeClient.getCart({
                id: String(id),
                fetchBuyerIdentity: true,
                fetchOffer: true,
                fetchCartLines: true,
                fetchShippingMethods: false,
              });
              return response;
            } catch (err) {
              console.error(`Error fetching cart ${id}:`, err);
              return { id, error: err.message };
            }
          })
        );

        setCartData(cartResponses);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchCarts();
  }, []);

  if (loading) return <p>Loading carts...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Shopping Carts</h2>
      {cartData.length > 0 ? (
        cartData.map((cart, index) => (
            <div key={index} style={{ border: "1px solid #ddd", padding: "10px", marginBottom: "10px" }}>
              {console.log('cart',cart)}
            <h3>Cart ID: {cart?.cart?.id}</h3>
            {cart.error ? (
              <p style={{ color: "red" }}>Error: {cart.error}</p>
            ) : (
              <>
                <p>Buyer: {cart?.cart?.buyerIdentity?.firstName || "N/A"} {cart?.cart?.buyerIdentity?.lastName || "N/A"}</p>
                <h4>Stores:</h4>
                {cart.stores && cart.stores.length > 0 ? (
                  cart.stores.map((store, index) => (
                    <div key={index}>
                      <h5>Store: {store?.cart?.store}</h5>
                      <p>Subtotal: {store?.cart?.offer?.subtotal.displayValue || "N/A"}</p>
                    </div>
                  ))
                ) : (
                  <p>No stores found</p>
                )}
              </>
            )}
          </div>
        ))
      ) : (
        <p>No cart data available</p>
      )}
    </div>
  );
};

export default Cart;
