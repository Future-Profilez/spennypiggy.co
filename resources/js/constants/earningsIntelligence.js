/**
 * Copy for the Enhanced Creator Earnings module — the words only.
 *
 * The house pattern (see `constants/discovery.js`, `constants/stablecoinTips.js`):
 * copy lives in a JS constant, the LIVE / COMING SOON switches live in PHP config
 * (`config/earnings_intelligence.php`). Section F of the 19 Aug Developer Master
 * Plan requires a label flip to be a config change with no deploy, which a JS
 * constant cannot be — so nothing in this file decides whether a row is live.
 *
 * ⚠️ Rows are keyed, never labelled here. The server sends `{ key, label, live }`
 * for all nine; this file only adds the one-line explanation shown under a row
 * that is greyed. A row moving from COMING SOON to LIVE therefore needs no edit
 * in either file.
 */

/** The module's own heading, sat directly under the Discovery panel. */
export const EI_PANEL_TITLE = 'Your supporters this month';

/**
 * The one line under the title.
 *
 * ⚠️ It has to explain what this module is FOR in one read, because it lands
 * beside the Discovery panel and the two answer different questions: Discovery
 * says what Spenny Piggy brought you, this says what to do with it.
 */
export const EI_PANEL_LEAD =
    'Who is buying, what they are worth, and what to do next.';

/** The badge on any row config has not marked live. */
export const EI_COMING_SOON = 'Coming soon';

/**
 * What a greyed row will do once it is live, one line each.
 *
 * ⚠️ A greyed row with no explanation is indistinguishable from a broken one.
 * The brief's instruction is that an unfinished row "is shown greyed with
 * 'Coming soon' rather than missing" — the point of showing it at all is that
 * the creator learns the capability is coming, which needs a sentence.
 */
export const EI_ROW_PENDING_COPY = {
    top_supporters:
        'Your highest-spending supporters, with their badge, lifetime and monthly spend.',
    revenue_by_feature:
        'Which of your seven ways to earn the money actually came from.',
    lifetime_value:
        'First purchase, last purchase, average order value and purchase count per supporter.',
    retention:
        'How many supporters are new, returning, reactivated or lost this month.',
    vip_alerts:
        'A heads-up when a big spender arrives, comes back, or goes quiet.',
    suggested_actions:
        'A short list of the next things worth doing, ordered by what they are worth.',
    reminder_action:
        'Send a quiet supporter the platform reminder, with your name on it.',
    social_prompt: 'Guidance on reaching a supporter without their contact details.',
    on_dashboard: 'This module, here on your dashboard beside your Discovery numbers.',
};

/** Retention bucket labels, in the brief's order. */
export const EI_RETENTION_LABELS = {
    new: 'New',
    returning: 'Returning',
    reactivated: 'Reactivated',
    lost: 'Lost',
};

/**
 * Empty states.
 *
 * 🚨 ZERO IS A STATE, NOT AN ABSENCE — the same rule the Discovery panel follows.
 * A creator with no sales yet sees the module with zeros and this line, never a
 * missing module: the module is how they learn the capability exists.
 */
export const EI_EMPTY_SUPPORTERS =
    'No purchases yet. Your supporters will appear here as they buy.';

export const EI_EMPTY_ACTIONS = 'Nothing needs your attention right now.';

/** The link through to the full Revenue Opportunity Centre. */
export const EI_FULL_VIEW_LABEL = 'Open Revenue Opportunity Centre';
