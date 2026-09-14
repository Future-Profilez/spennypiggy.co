/*
 * The advertised supporter fee, read from the server and never typed here.
 *
 * 🚨 THREE CREATOR-FACING FORMS SAID "Our fee is 19%" — Tasks/Create, Tasks/Edit and
 * Auth/Wishlist. It was true under the legacy markup and became wrong the moment the
 * platform moved to an all-in rate on 11 Sep 2026, with nothing to catch it: a number
 * in JSX cannot follow a config change, and nothing errors when it stops matching what
 * the checkout charges.
 *
 * The server shares `fees` from `App\Services\Pricing\FeeModel` on every page. Read it
 * through here so a surface never has to know the shape.
 */

/**
 * ⚠️ Every reader accepts EITHER the page object or its props. Half this codebase
 * destructures `usePage().props` and half keeps the page — a helper that only accepts
 * one of them is a helper somebody calls wrongly, and the failure mode here is a
 * silently missing fee rather than an error.
 */
function feeBag(pageOrProps) {
    return pageOrProps?.props?.fees ?? pageOrProps?.fees ?? null;
}

/** The label to print — "12%". Falls back to the word rather than a wrong number. */
export function feeRateLabel(page, fallback = "our standard rate") {
    const label = feeBag(page)?.rate_label;

    // ⚠️ A missing prop must NOT render a plausible wrong figure. "our standard rate"
    // is vague and correct; "19%" is specific and false, which is far worse on a page
    // telling a creator what they will be charged.
    return typeof label === "string" && label.length > 0 ? label : fallback;
}

/** The numeric rate, or null when the server did not send one. */
export function feeRate(page) {
    const rate = feeBag(page)?.rate;

    return typeof rate === "number" && Number.isFinite(rate) ? rate : null;
}

/** Is the platform on the all-in model? Copy differs between the two. */
export function feeIsAllIn(page) {
    return feeBag(page)?.all_in === true;
}

/**
 * The caption under a SUPPORTER-FACING price — a listing card, a basket row, a
 * checkout total. It says what the number already includes.
 *
 * 🚨 "INCLUDES PLATFORM AND PAYMENT PROCESSING FEES" NAMES TWO CHARGES THE
 * PLATFORM NO LONGER MAKES. Under the all-in model (11 Sep 2026) the supporter
 * pays the listed price plus ONE advertised percentage and the processor is paid
 * from inside it — there is no separate processing line and no £1 administration
 * fee. Nineteen surfaces carried some spelling of the old sentence, each typed by
 * hand, so they could not follow a model change and several disagreed with each
 * other about how many fees there were.
 *
 * ⚠️ The rate is NOT in the default caption. It is printed on a card beside a
 * price the supporter is about to pay, where the number that matters is the total
 * — and a percentage there invites the reader to check our arithmetic rather than
 * buy. Pass `withRate` on a CHECKOUT surface, where naming the fee is the point.
 *
 * ⚠️ Under the legacy markup it keeps the old wording, which was true then.
 */
export function supporterFeeCaption(page, { withRate = false } = {}) {
    if (!feeIsAllIn(page)) {
        return "Includes platform and payment processing fees";
    }

    const label = feeRateLabel(page, null);

    return withRate && label
        ? `Includes our ${label} supporter fee — card processing is inside it, with nothing added afterwards`
        : "Fees included — nothing is added at checkout";
}

/**
 * The sentence under a price field, telling a creator what a supporter will pay.
 *
 * ⚠️ Says the creator receives 100% FIRST. That is the part that did not change and the
 * part they care about; leading with the fee reads as a deduction from their earnings,
 * which it has never been.
 */
export function creatorFeeNote(page) {
    const label = feeRateLabel(page, null);

    if (!label) {
        return "You receive 100% of your listed price — supporters cover the fee on top.";
    }

    return feeIsAllIn(page)
        ? `You receive 100% of your listed price. Supporters pay ${label} on top, all-in — card processing is included, with nothing added afterwards.`
        : `You receive 100% of your listed price. Supporters cover the fees on top, so the total they see is higher than your price.`;
}
