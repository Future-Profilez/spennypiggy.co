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

const passkeyCheckCode = `
    const [hasPasskey, setHasPasskey] = React.useState(false);
    
    React.useEffect(() => {
        const checkPasskey = async () => {
            const userEmail = (typeof email !== 'undefined' ? email : null) || (typeof data !== 'undefined' && data?.email ? data.email : null) || auth?.user?.email;
            if (userEmail && isWebAuthnSupported()) {
                try {
                    const res = await axios.post('/webauthn/check', { email: userEmail });
                    setHasPasskey(res.data.has_passkey);
                    
                    // Automatically trigger passkey if available
                    if (res.data.has_passkey && typeof showStepUp !== 'undefined' && showStepUp) {
                        setTimeout(() => {
                            handlePasskeyStepUp();
                        }, 100); // Shorter delay to preserve user gesture context
                    }
                } catch (e) {
                    setHasPasskey(false);
                }
            }
        };
        if (typeof showStepUp !== 'undefined' && showStepUp) {
            checkPasskey();
        }
    }, [typeof showStepUp !== 'undefined' ? showStepUp : false]);
`;

for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // 1. Inject state and effect
        if (!content.includes('const [hasPasskey, setHasPasskey]')) {
            content = content.replace('const handlePasskeyStepUp = async () => {', passkeyCheckCode + '\n    const handlePasskeyStepUp = async () => {');
        }
        
        // 2. Update condition to hide button if hasPasskey is false
        if (content.includes('{isWebAuthnSupported() && (')) {
            content = content.replace('{isWebAuthnSupported() && (', '{isWebAuthnSupported() && hasPasskey && (');
        }

        // Just in case React is not imported, let's make sure we use React.useState and React.useEffect
        if (!content.includes('import React')) {
            content = "import React from 'react';\n" + content;
        }

        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Patched visibility in', file);
    }
}
