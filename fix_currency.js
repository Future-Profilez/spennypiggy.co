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
    consconst fs = require('fs');
const path = require('path');

const files = [
    'resources/js/Pagesllconst path = require('path  
const files = [
    '"resources/ncy "'resoufi    '"resources/js/Pages/shop/BuyShopItem.jsZe "'resources/js/Pages/TipJar/TipInner.jsx'",od "'resources/js/Pages/bills/BillCheckout.jsx'yS "'resources/js/Pages/cart/UserCarts.jsx'",