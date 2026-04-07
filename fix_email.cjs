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

for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Safely check for email existence using typeof
        content = content.replace(
            /const userEmail = email \|\| auth\?\.user\?\.email;/g,
            "const userEmail = (typeof email !== 'undefined' ? email : null) || (typeof data !== 'undefined' && data?.email ? data.email : null) || auth?.user?.email;"
        );
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed email in', file);
    }
}
