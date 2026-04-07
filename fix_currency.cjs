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

const helperFunction = `
    const isZeroDecimalCurrency = (currencyCode) => {
        const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];
        return zeroDecimalCurrencies.includes(currencyCode?.toUpperCase());
    };
`;

for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Check if isZeroDecimalCurrency is already defined in this component block
        if (!content.includes('const isZeroDecimalCurrency =')) {
            // Find a good place to insert it (e.g., right before handlePasskeyStepUp)
            content = content.replace('const handlePasskeyStepUp = async', helperFunction + '\n    const handlePasskeyStepUp = async');
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log('Added isZeroDecimalCurrency to', file);
        } else {
            console.log('isZeroDecimalCurrency already exists in', file);
        }
    }
}
