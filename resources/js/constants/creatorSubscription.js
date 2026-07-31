/**
 * Client-side mirror of config/creator_subscription.php — keep the two in step.
 *
 * The subscription price and the "no charge until your first sale" promise are
 * printed on four creator screens and seven marketing pages. Each one used to
 * hardcode its own wording and its own figure, which is how the site came to
 * advertise a 3-day trial on the home page, "3 days free" on the creators page
 * and "£8.99 + VAT / month" in a `const PRICE` inside one component.
 *
 * Import from here. Do not retype the price or the promise anywhere.
 */

export const SUBSCRIPTION_PRICE = 8.99;
export const SUBSCRIPTION_VAT_RATE = 20;
export const SUBSCRIPTION_CURRENCY_SYMBOL = "£";

/**
 * Client decision, 31 July 2026: nothing is charged until the creator's first
 * completed sale. The server is authoritative — a page that receives a
 * `subscriptionPlan` prop should prefer it over these defaults, which exist so
 * a static marketing page renders correctly without one.
 */
export const FREE_UNTIL_FIRST_SALE = true;

export const formatSubscriptionMoney = (amount) =>
    `${SUBSCRIPTION_CURRENCY_SYMBOL}${Number(amount).toFixed(2)}`;

export const SUBSCRIPTION_VAT = Number(
    ((SUBSCRIPTION_PRICE * SUBSCRIPTION_VAT_RATE) / 100).toFixed(2),
);

export const SUBSCRIPTION_TOTAL = Number(
    (SUBSCRIPTION_PRICE + SUBSCRIPTION_VAT).toFixed(2),
);

export const PRICE_FORMATTED = formatSubscriptionMoney(SUBSCRIPTION_PRICE);
export const TOTAL_FORMATTED = formatSubscriptionMoney(SUBSCRIPTION_TOTAL);

/** The one set of words. Mirrors config/creator_subscription.php `copy`. */
export const SUBSCRIPTION_COPY = {
    promise: "No charge until your first sale",
    promiseLong:
        "Add your card now — you won't be charged anything until you make your first sale.",
    priceLine: `${PRICE_FORMATTED} + VAT / month, starting after your first sale`,
    reassurance: "If you never make a sale, you never pay.",
    activePriceLine: `${PRICE_FORMATTED} + VAT / month`,
};

/**
 * Merge whatever the server sent with the defaults above.
 *
 * Pages receive `subscriptionPlan` from the controller where it matters; the
 * marketing pages are static and render from the defaults. Returning a shape
 * that is always complete means a component never has to null-check a price
 * before printing it.
 */
export const subscriptionPlan = (fromServer) => ({
    price: SUBSCRIPTION_PRICE,
    vat: SUBSCRIPTION_VAT,
    total: SUBSCRIPTION_TOTAL,
    price_formatted: PRICE_FORMATTED,
    total_formatted: TOTAL_FORMATTED,
    free_until_first_sale: FREE_UNTIL_FIRST_SALE,
    promise: SUBSCRIPTION_COPY.promise,
    promise_long: SUBSCRIPTION_COPY.promiseLong,
    price_line: SUBSCRIPTION_COPY.priceLine,
    reassurance: SUBSCRIPTION_COPY.reassurance,
    active_price_line: SUBSCRIPTION_COPY.activePriceLine,
    ...(fromServer ?? {}),
});
