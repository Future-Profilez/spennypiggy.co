const fs = require('fs');
const path = require('path');

const files = [
    'resources/js/Pages/Tasks/Show.jsx',
    'resources/js/Pages/shop/BuyShopItem.jsx',
    'resources/js/Pages/TipJar/TipInner.jsx',
    'resources/js/Pages/bills/BillCheckout.jsx',
    'resources/js/Pages/cart/UserCarts.jsx',
    'resources/js/Pages/membership/MemberCheckout.jsx'
];

const passkeyFunctions = `
    const [passkeyLoading, setPasskeyLoading] = useState(false);

    // Helper function to encode ArrayBuffer to base64
    const arrayBufferToBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const formatCredentialForServer = (credential) => {
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
    };

    const base64urlToUint8Array = (base64url) => {
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
    };

    const isWebAuthnSupported = () => {
        return window.PublicKeyCredential !== undefined;
    };

    const handlePasskeyStepUp = async () => {
        try {
            setPasskeyLoading(true);
            const userEmail = email || auth?.user?.email;

            if (!userEmail) {
                toast.error("Email required for passkey verification.");
                setPasskeyLoading(false);
                return;
            }

            const { data: options } = await axios.post(
                route("webauthn.login.options"),
                { email: userEmail },
            );

            const publicKey = options.publicKey ?? options;
            publicKey.challenge = base64urlToUint8Array(
                publicKey.challenge,
            );

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

            // Reconstruct the request payload dynamically based on variables present in the component
            const amt = typeof subtotal !== 'undefined' ? subtotal : (typeof tipAmount !== 'undefined' ? tipAmount : amount);
            const amountInCents = Math.round(((typeof fee !== 'undefined' ? fee : 0) + amt) * (isZeroDecimalCurrency(currency) ? 1 : 100));
            
            let creatorId = null;
            if (typeof datas !== 'undefined' && datas?.user) {
                creatorId = datas.user.uuid || datas.user.id;
            } else if (typeof data !== 'undefined' && data?.creator) {
                creatorId = data.creator.uuid || data.creator.id;
            } else if (typeof data !== 'undefined' && data?.user) {
                creatorId = data.user.uuid || data.user.id;
            } else if (typeof product !== 'undefined' && product?.user) {
                creatorId = product.user.uuid || product.user.id;
            } else if (typeof bill !== 'undefined' && bill?.user) {
                creatorId = bill.user.uuid || bill.user.id;
            } else if (typeof tipDetails !== 'undefined' && tipDetails?.creator) {
                creatorId = tipDetails.creator.uuid || tipDetails.creator.id;
            }

            const payload = {
                ...formatCredentialForServer(credential),
                amount: amountInCents,
                currency: currency,
                creator_id: creatorId,
                email: userEmail,
                device_id: typeof deviceid !== 'undefined' ? deviceid : null,
                is_checkout_session: true,
                risk_identity_id: stepUpContext?.risk_identity_id
            };

            const response = await axios.post('/api/risk/step-up/verify-passkey', payload);
            
            if (response.data.success) {
                toast.success("Identity verified! Proceeding to checkout...");
                setShowStepUp(false);
                if (typeof setSkipCaptcha !== 'undefined') setSkipCaptcha(true);
                handleSubmit();
            } else {
                toast.error("Passkey verification failed.");
            }
        } catch (error) {
            console.error("Passkey error:", error);
            if (error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else if (error.name === "NotAllowedError") {
                toast.error("Authentication cancelled.");
            } else {
                toast.error("Unable to authenticate. Please try again.");
            }
        } finally {
            setPasskeyLoading(false);
        }
    };
`;

const buttonHtml = `
                    </form>
                    
                    {isWebAuthnSupported() && (
                        <div className="mt-6 border-t border-gray-200 pt-6">
                            <button
                                type="button"
                                onClick={handlePasskeyStepUp}
                                disabled={passkeyLoading || (typeof verifyingOtp !== 'undefined' ? verifyingOtp : false)}
                                className="relative flex flex-row justify-center items-center text-base px-4 py-[10px] focus:outline-none text-gray-600 border border-gray-300 bg-white hover:bg-gray-50 rounded-full transition-all w-full max-w-[260px] mx-auto disabled:opacity-50"
                            >
                                {passkeyLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-pink-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Checking device...
                                    </>
                                ) : "Use Face ID / Fingerprint"}
                            </button>
                            <p className="text-xs text-gray-500 text-center mt-2">
                                Bypass OTP by verifying your identity with a saved passkey.
                            </p>
                        </div>
                    )}
`;

for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // 1. Add functions right before handleVerifyStepUp
        if (!content.includes('handlePasskeyStepUp')) {
            content = content.replace('const handleVerifyStepUp = async', passkeyFunctions + '\n    const handleVerifyStepUp = async');
        }
        
        // 2. Add UI button after </form> in the modal
        if (!content.includes('Use Face ID / Fingerprint')) {
            // Find the form end tag inside the StepUp modal
            // We can match </form> that comes after "Type 'CONFIRM' to proceed"
            const parts = content.split("Type 'CONFIRM' to proceed");
            if (parts.length > 1) {
                const formEndIndex = parts[1].indexOf('</form>');
                if (formEndIndex !== -1) {
                    const beforeFormEnd = parts[1].substring(0, formEndIndex + 7);
                    const afterFormEnd = parts[1].substring(formEndIndex + 7);
                    content = parts[0] + "Type 'CONFIRM' to proceed" + beforeFormEnd + buttonHtml + afterFormEnd;
                }
            }
        }

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched', file);
    }
}
