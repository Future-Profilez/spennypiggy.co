import { useState, useEffect } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";

// Helper function to encode ArrayBuffer to base64
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

// Helper function to format WebAuthn credential for the server
function formatCredentialForServer(credential) {
    const formatted = {
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
            clientDataJSON: arrayBufferToBase64(credential.response.clientDataJSON),
        },
    };

    if (credential.response.authenticatorData) {
        formatted.response.authenticatorData = arrayBufferToBase64(credential.response.authenticatorData);
    }
    if (credential.response.signature) {
        formatted.response.signature = arrayBufferToBase64(credential.response.signature);
    }
    if (credential.response.userHandle) {
        formatted.response.userHandle = arrayBufferToBase64(credential.response.userHandle);
    }
    if (credential.response.attestationObject) {
        formatted.response.attestationObject = arrayBufferToBase64(credential.response.attestationObject);
    }

    return formatted;
}

function base64urlToUint8Array(base64url) {
    const base64 = base64url
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), "=");

    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

export default function ManagePasskey({ email }) {
    const [loading, setLoading] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(null);
    const { successAlert, errorAlert } = useAlerts();

    const isWebAuthnSupported = () => {
        return window.PublicKeyCredential !== undefined;
    };

    const checkPasskeyStatus = async () => {
        if (!email) return;
        try {
            const response = await axios.post("/webauthn/check", { email });
            setHasPasskey(response.data.has_passkey || false);
        } catch (error) {
            console.error("Error checking passkey:", error);
            setHasPasskey(false);
        }
    };

    useEffect(() => {
        if (isWebAuthnSupported()) {
            checkPasskeyStatus();
        }
    }, [email]);

    const handleRegister = async () => {
        try {
            setLoading(true);

            const { data: options } = await axios.post(
                route("webauthn.register.options"),
                { email }
            );

            const publicKey = options.publicKey ?? options;
            publicKey.challenge = base64urlToUint8Array(publicKey.challenge);
            publicKey.user.id = base64urlToUint8Array(publicKey.user.id);

            const credential = await navigator.credentials.create({
                publicKey,
            });

            const response = await axios.post(
                route("webauthn.register"),
                formatCredentialForServer(credential)
            );

            if (response.data.success) {
                successAlert("Passkey registered successfully!");
                checkPasskeyStatus();
            } else {
                errorAlert(response.data.message || "Registration failed");
            }
        } catch (error) {
            console.error("Registration error:", error);
            if (error.name === 'NotAllowedError') {
                // cancelled
            } else if (error.name === 'InvalidStateError') {
                errorAlert("This device already has a passkey registered.");
            } else {
                errorAlert("Failed to register passkey: " + (error.message || "Unknown error"));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async () => {
        if (!window.confirm("Are you sure you want to remove your passkey? You will need to login with your password next time.")) {
            return;
        }

        try {
            setLoading(true);
            // Wait, does delete route exist? We saw it in auth.php
            const response = await axios.delete(route("webauthn.delete"));
            if (response.data.success) {
                successAlert("Passkey removed successfully.");
                checkPasskeyStatus();
            } else {
                errorAlert("Failed to remove passkey.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            errorAlert("Failed to remove passkey.");
        } finally {
            setLoading(false);
        }
    };

    if (!isWebAuthnSupported()) {
        return null;
    }

    return (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-[20px] border border-gray-200 mb-4">
            <div>
                <h4 className="font-medium text-gray-800">Passkey / FaceID Login</h4>
                <p className="text-xs text-gray-500 mt-1">
                    {hasPasskey 
                        ? "You have a passkey configured for instant login."
                        : "Set up a passkey to login instantly without a password."}
                </p>
            </div>
            
            <div>
                {hasPasskey === true ? (
                    <button 
                        type="button"
                        onClick={handleRemove}
                        disabled={loading}
                        className="px-4 py-2 bg-red-100 text-red-600 rounded-full text-sm font-medium hover:bg-red-200 transition disabled:opacity-50"
                    >
                        {loading ? "Removing..." : "Remove"}
                    </button>
                ) : hasPasskey === false ? (
                    <button 
                        type="button"
                        onClick={handleRegister}
                        disabled={loading}
                        className="px-4 py-2 bg-pink-100 text-pink-600 rounded-full text-sm font-medium hover:bg-pink-200 transition disabled:opacity-50"
                    >
                        {loading ? "Setting up..." : "Setup"}
                    </button>
                ) : (
                    <span className="text-sm text-gray-400">Loading...</span>
                )}
            </div>
        </div>
    );
}