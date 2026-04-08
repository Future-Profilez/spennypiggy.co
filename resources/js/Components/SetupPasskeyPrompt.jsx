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

export default function SetupPasskeyPrompt({ isOpen, email, onSkip, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [publicKeyOptions, setPublicKeyOptions] = useState(null);
    const { successAlert, errorAlert } = useAlerts();

    useEffect(() => {
        if (isOpen && email) {
            axios.post(route("webauthn.register.options"), { email })
                .then(res => {
                    const options = res.data.publicKey ?? res.data;
                    options.challenge = base64urlToUint8Array(options.challenge);
                    options.user.id = base64urlToUint8Array(options.user.id);
                    if (options.excludeCredentials) {
                        if (options.excludeCredentials.length === 0) {
                            delete options.excludeCredentials; // Chrome sometimes fails on empty array
                        } else {
                            options.excludeCredentials = options.excludeCredentials.map(
                                (item) => ({
                                    ...item,
                                    id: base64urlToUint8Array(item.id),
                                })
                            );
                        }
                    }
                    
                    // Android Chrome prefers platform attachment explicitly
                    if (!options.authenticatorSelection) {
                        options.authenticatorSelection = {
                            authenticatorAttachment: "platform",
                            userVerification: "required"
                        };
                    }
                    
                    setPublicKeyOptions(options);
                })
                .catch(err => console.error("Failed to preload passkey options", err));
        }
    }, [isOpen, email]);

    if (!isOpen) return null;

    const handleSetup = async () => {
        if (!publicKeyOptions) {
            errorAlert("Loading secure options, please wait a moment and try again.");
            return;
        }

        try {
            setLoading(true);

            // Request browser to create credential directly (no delay for Safari)
            const credential = await navigator.credentials.create({
                publicKey: publicKeyOptions,
            });

            // Send credential back to server
            const response = await axios.post(
                route("webauthn.register"),
                formatCredentialForServer(credential)
            );

            if (response.data.success) {
                successAlert("Passkey registered successfully! You can now use it to login next time.");
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            } else {
                errorAlert(response.data.message || "Registration failed");
                setLoading(false);
            }
        } catch (error) {
            console.error("Registration error:", error);
            
            // Check if user cancelled
            if (error.name === 'NotAllowedError') {
                // User cancelled the prompt, just skip
                onSkip();
            } else if (error.name === 'InvalidStateError') {
                errorAlert("This device already has a passkey registered for this account.");
                setTimeout(() => onSkip(), 2000);
            } else {
                errorAlert("Failed to register passkey: " + (error.message || "Unknown error"));
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md px-6 ">
            <div className="bg-[#1a1a1a] border border-pink-500/30 rounded-xl md:rounded-3xl p-4 md:p-8 max-w-[400px] w-full shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-purple-500"></div>
                
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-pink-500/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                        </svg>
                    </div>
                    <h3 className="text-xl md:text-2xl text-white mb-2  uppercase font-bold">Faster Login Next Time?</h3>
                    <p className="text-gray-400">
                        Set up a Passkey to use FaceID, Fingerprint, or Windows Hello for instant login instead of typing your password.
                    </p>
                </div>

                <div className="space-y-4">
                    <LoaderButton
                        type="button"
                        onClick={handleSetup}
                        disabled={loading}
                        className="w-full !border-0  !bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white tracking-wider py-3 px-6 rounded-full transition-all transform hover:scale-[1.02] shadow-lg text-sm md:text-normal flex justify-center items-center"
                        spinnerclass="fill-white"
                    >
                        {loading ? "SETTING UP..." : "SET UP PASSKEY"}
                    </LoaderButton>
                    
                    <button
                        type="button"
                        onClick={onSkip}
                        disabled={loading}
                        className="w-full bg-transparent text-gray-400 hover:text-white font-medium py-2 px-4 rounded-full transition-colors focus:outline-none"
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </div>
    );
}