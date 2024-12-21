import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe('pk_test_51OOc6oCmFHIIsmOrU0gsRlrFVQjlzUkaivjz6f4T2WRSEFjtYUT8vW803MgvLn2sFo1rOz8DElNPyEnxMDhNpwNc00Axuxt8ng');

function IdentityVerification() {
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [error, setError] = useState(null);

    const startVerification = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/stripe/identity/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (data.url) {
                console.log("data",data);
                window.location.href = data.url; // Redirect to Stripe verification
            } else {
                console.error("Error:", data.error);
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleIdentityVerification = async (sessionId) => {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
            sessionId: sessionId,
        });

        if (error) {
            setError(error.message);
        }
    };

    return (
        <div>
            <h1>Identity Verification</h1>
            {error && <div style={{ color: "red" }}>{error}</div>}
            <button onClick={startVerification} disabled={loading}>
                {loading ? "Loading..." : "Start Verification"}
            </button>
        </div>
    );
}

export default IdentityVerification;
