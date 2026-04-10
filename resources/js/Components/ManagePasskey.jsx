import { useState, useEffect } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import LoaderButton from "@/Components/LoaderButton";

// Helper function to encode ArrayBuffer to base64url (important for Android/Chrome)
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    // Return base64url encoded string (replace + with -, / with _, remove =)
    return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
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

export default function ManagePasskey({ email, className }) {
    const [loading, setLoading] = useState(false);
    const [hasPasskey, setHasPasskey] = useState(null);
    const [passkeys, setPasskeys] = useState([]);
    const { successAlert, errorAlert } = useAlerts();

    const isWebAuthnSupported = () => {
        return window.PublicKeyCredential !== undefined;
    };

    const checkPasskeyStatus = async () => {
        if (!email) return;
        try {
            const response = await axios.post("/webauthn/check", { email });
            setHasPasskey(response.data.has_passkey || false);
            setPasskeys(response.data.passkeys || []);
        } catch (error) {
            console.error("Error checking passkey:", error);
            setHasPasskey(false);
            setPasskeys([]);
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

            if (publicKey.excludeCredentials) {
                publicKey.excludeCredentials = publicKey.excludeCredentials.map(
                    (item) => ({
                        ...item,
                        id: base64urlToUint8Array(item.id),
                    })
                );
            }

            // Safari requires this to be called directly after user gesture if possible,
            // but for Management it's less strict than after a long login flow. 
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

    const handleRemove = async (id = null) => {
        if (!window.confirm("Are you sure you want to remove this passkey?")) {
            return;
        }

        try {
            setLoading(true);
            const url = id ? route("webauthn.delete", { id }) : route("webauthn.delete");
            const response = await axios.delete(url);
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

    const getDeviceName = (pk) => {
        if (pk.platform && pk.platform !== 'Unknown' && pk.browser && pk.browser !== 'Unknown') {
            return `${pk.platform} (${pk.browser})`;
        }
        if (pk.platform && pk.platform !== 'Unknown') return pk.platform;
        if (pk.browser && pk.browser !== 'Unknown') return pk.browser;
        return 'Unknown Device';
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        let date = new Date(dateString);
        if (isNaN(date.getTime())) {
            // Fix for Safari: convert "YYYY-MM-DD HH:MM:SS" to "YYYY/MM/DD HH:MM:SS"
            const safeString = dateString.replace(/-/g, "/");
            date = new Date(safeString);
        }
        if (isNaN(date.getTime())) {
            // If still invalid, just return the date part
            return dateString.split('T')[0].split(' ')[0];
        }
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
        <div className={`bg-gray-50 rounded-[20px] border border-gray-200 mb-4 overflow-hidden ${className || ""}`}>
            <div className="p-4 flex items-center justify-between border-b border-gray-200">
                <div className="pe-4">
                    <h4 className="font-medium text-gray-800">Passkeys / FaceID</h4>
                    <p className="text-xs text-gray-500 mt-1">
                        Register multiple devices to login instantly without a password.
                    </p>
                </div>
                
                <div>
                    <button 
                        type="button"
                        onClick={handleRegister}
                        disabled={loading}
                        className=" whitespace-nowrap px-4 py-2 bg-pink-100 text-pink-600 rounded-full text-sm font-medium hover:bg-pink-200 transition disabled:opacity-50 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {loading ? "Adding..." : "Add Device"}
                    </button>
                </div>
            </div>

            {passkeys.length > 0 ? (
                <div className="divide-y divide-gray-100">
                    {passkeys.map((pk) => (
                        <div key={pk.id} className="p-4 flex items-center justify-between hover:bg-gray-100 transition-colors">
                            <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center mr-3 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        {getDeviceName(pk)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Added: {formatDate(pk.created_at)}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleRemove(pk.id)}
                                disabled={loading}
                                className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-full transition disabled:opacity-50"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center">
                    <p className="text-sm text-gray-500">No passkeys registered yet.</p>
                </div>
            )}
        </div>
    );
}