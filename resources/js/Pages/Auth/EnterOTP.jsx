import Authenticated from "@/Layouts/AuthenticatedLayout";
import { Head, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";
import { useRef } from "react";
import Popup from "@/Components/Popup";
import { useEffect } from "react";
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
    return window
        .btoa(binary)
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

// Helper function to format WebAuthn credential for the server
function formatCredentialForServer(credential) {
    const formatted = {
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
            clientDataJSON: arrayBufferToBase64(
                credential.response.clientDataJSON,
            ),
        },
    };

    if (credential.response.authenticatorData) {
        formatted.response.authenticatorData = arrayBufferToBase64(
            credential.response.authenticatorData,
        );
    }
    if (credential.response.signature) {
        formatted.response.signature = arrayBufferToBase64(
            credential.response.signature,
        );
    }
    if (credential.response.userHandle) {
        formatted.response.userHandle = arrayBufferToBase64(
            credential.response.userHandle,
        );
    }
    if (credential.response.attestationObject) {
        formatted.response.attestationObject = arrayBufferToBase64(
            credential.response.attestationObject,
        );
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

export default function EnterOTP({ user, action, hasPasskey, onSuccess }) {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (action === "open") {
            setOpen(true);
            // Automatically trigger passkey if available
            if (hasPasskey) {
                setTimeout(() => {
                    handlePasskeyAction();
                }, 100); // Shorter delay to preserve user gesture context
            }
        } else {
            setOpen();
        }
    }, [action, hasPasskey]);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
    });

    const inputRefs = useRef([]);
    const [backup, setBackup] = useState(false);
    const [bCode, setBcode] = useState("");
    const [otp, setOtp] = useState(new Array(6).fill(""));

    const enterBCode = (e) => {
        setBcode(e.target.value);
        setOtp(new Array(6).fill(""));
    };
    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !otp[index] && index !== 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const [loading, setLoading] = useState(false);
    const [passkeyLoading, setPasskeyLoading] = useState(false);

    const handlePasskeyAction = async () => {
        try {
            setPasskeyLoading(true);

            const { data: options } = await axios.post(
                route("webauthn.login.options"),
                { email: user.email },
            );

            const publicKey = options.publicKey ?? options;
            publicKey.challenge = base64urlToUint8Array(publicKey.challenge);

            if (publicKey.allowCredentials) {
                publicKey.allowCredentials = publicKey.allowCredentials.map(
                    (item) => ({
                        ...item,
                        id: base64urlToUint8Array(item.id),
                    }),
                );
            }

            const credential = await navigator.credentials.get({
                publicKey,
            });

            const response = await axios.post(
                route("webauthn.login"),
                formatCredentialForServer(credential),
            );

            if (response.data.success) {
                if (onSuccess) {
                    onSuccess(response.data.redirect_url);
                } else if (response.data.redirect_url) {
                    window.location.href = response.data.redirect_url;
                }
            } else {
                errorAlert(response.data.message || "Passkey login failed");
            }
        } catch (error) {
            console.error("Passkey error:", error);

            if (error.response?.data?.message) {
                errorAlert(error.response.data.message);
            } else if (error.name === "NotAllowedError") {
                errorAlert("Authentication cancelled. Please try again.");
            } else if (error.name === "InvalidStateError") {
                errorAlert("This device already has a passkey registered.");
            } else {
                errorAlert("Unable to authenticate. Please try again.");
            }
        } finally {
            setPasskeyLoading(false);
        }
    };

    const verify = (e) => {
        e.preventDefault();
        setLoading(true);
        axios
            .post(route("verify2FA"), {
                otp: otp.join(""),
                backup_code: bCode || "",
                email: user.email,
                password: user.password,
            })
            .then((resp) => {
                setLoading(false);
                if (resp.data.status) {
                    setOpen(false); // <-- Close popup here
                    if (onSuccess) {
                        onSuccess(resp.data.redirect_url);
                    } else if (resp.data.redirect_url) {
                        window.location.href = resp.data.redirect_url;
                    }
                } else {
                    errorAlert(resp.data.msg || "Something went wrong.");
                }
            })
            .catch((err) => {
                setLoading(false);
                console.log(err);
                if (
                    err.response &&
                    err.response.data &&
                    err.response.data.message
                ) {
                    errorAlert(err.response.data.message);
                } else {
                    errorAlert("Something went wrong.");
                }
            });
    };

    return (
        <>
            <Popup space="2 md:p-4" action={open} modalclass="" text={<></>}>
                <div className=" text-center py-10">
                    <header className="mb-8">
                        <h1 className="text-2xl font-bold mb-1">
                            OTP Verification
                        </h1>
                        <p className="text-[15px] text-slate-500 max-w-[300px] m-auto ">
                            Enter the 6-digit verification code from your
                            authenticator app.
                        </p>
                    </header>
                    <form>
                        {backup ? (
                            <>
                                <div className="flex items-center justify-center gap-3">
                                    <input
                                        type="text"
                                        className="w-full  text-center text-md text-slate-900 bg-slate-100 border border-transparent hover:border-slate-200 appearance-none rounded-[30px]  p-3 max-w-[85%] outline-none focus:bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100"
                                        pattern="\d*"
                                        onChange={enterBCode}
                                        placeholder="Enter backup code..."
                                    />
                                </div>
                                <div className="max-w-[260px] mx-auto mt-4">
                                    <button
                                        disabled={loading}
                                        onClick={verify}
                                        className="pinkbg-i text-white px-3 py-2 w-full rounded-[30px] "
                                    >
                                        {processing || loading
                                            ? "processing..."
                                            : "Verify"}
                                    </button>
                                </div>
                                <div className="text-sm text-slate-500 mt-4">
                                    {" "}
                                    Don't have backup code ?{" "}
                                    <button
                                        className="font-medium text-indigo-500 hover:text-indigo-600"
                                        onClick={() => setBackup(false)}
                                        type="button"
                                    >
                                        Use Authenticator app
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                {" "}
                                <div className="flex items-center justify-center  gap-1">
                                    {otp.map((data, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            className="border-gray-300  text-center bg-gray-200 
                                    text-black rounded-[12px] 
                                    md:rounded-[15px]  w-full   text-xl font-bold
                                     max-w-[50px] min-h-[50px] otp-input  px-1 py-1 "
                                            maxLength="1"
                                            value={data}
                                            onChange={(e) =>
                                                handleChange(e.target, index)
                                            }
                                            onKeyDown={(e) =>
                                                handleKeyDown(e, index)
                                            }
                                            ref={(el) =>
                                                (inputRefs.current[index] = el)
                                            }
                                        />
                                    ))}
                                </div>
                                <div className="max-w-[260px] mx-auto mt-4">
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={verify}
                                        className="pinkbg-i text-white px-6 w-full py-3 my-3 rounded-[30px] "
                                    >
                                        {loading
                                            ? "processing..."
                                            : "Verify & Login"}
                                    </button>
                                </div>
                                <div className="text-sm text-slate-500 mt-4">
                                    {" "}
                                    Don't have phone ?{" "}
                                    <button
                                        className="font-medium text-indigo-500 hover:text-indigo-600"
                                        onClick={() => setBackup(true)}
                                        type="button"
                                    >
                                        Use Backup code
                                    </button>
                                </div>
                            </>
                        )}

                        {hasPasskey && (
                            <div className="mt-6 border-t border-gray-200 pt-6">
                                <button
                                    type="button"
                                    onClick={handlePasskeyAction}
                                    disabled={passkeyLoading || loading}
                                    className="relative flex justify-center items-center
                            text-base px-4 py-[10px]
                            rounded-full w-full max-w-[260px] mx-auto
                            transition-all

                            border border-gray-400

                            text-gray-900

                            hover:bg-gray-50

                            disabled:opacity-70 disabled:cursor-not-allowed"
                                    spinnerclass="fill-pink-500"
                                >
                                    {passkeyLoading
                                        ? "Checking device..."
                                        : "Use Face ID / Fingerprint"}
                                </button>
                                <p className="text-xs text-gray-500 text-center mt-2">
                                    Bypass OTP by verifying your identity with a
                                    saved passkey.
                                </p>
                            </div>
                        )}
                    </form>
                </div>
            </Popup>
        </>
    );
}
