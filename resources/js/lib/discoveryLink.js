/**
 * Tag a link to a creator profile with the Discovery surface it came from.
 *
 * 🚨 A SURFACE THAT IS NOT TAGGED IS INVISIBLE FOR EVER. Discovery attribution
 * is recorded at the moment of the visit — there is no backfill for a click
 * nobody marked. Every internal link that puts a creator in front of a
 * supporter because SPENNY PIGGY chose to (a collection, a recommendation, a
 * search result, a post-payment suggestion) must go through this helper.
 *
 * ⚠️ A creator's OWN link is not tagged. Their socials, their direct link and
 * their bio page are their traffic, not ours — the server records `bio-link` as
 * creator-generated for exactly this reason. Tagging a creator's own link with
 * an SP source would inflate the one number this system exists to make
 * credible.
 *
 * ⚠️ THE KEYS MIRROR `App\Support\DiscoverySources::KEYS`. The server refuses
 * anything not on that list, so a typo here does not corrupt the data — it
 * silently drops the attribution, which is worse. Keep the two in step;
 * `DiscoveryAttributionTest` asserts they match.
 */

/** Reserved source keys. Must match the PHP list exactly. */
export const DISCOVERY_SOURCE = {
    MORE_CREATORS: 'more-creators',
    BIRTHDAY_REMINDER: 'birthday-reminder',
    BIRTHDAYS_THIS_WEEK: 'birthdays-this-week',
    NEW_CREATORS: 'new-creators',
    HIDDEN_GEMS: 'hidden-gems',
    TRENDING: 'trending',
    ALMOST_FUNDED: 'almost-funded',
    NEW_WISHES: 'new-wishes',
    PAYMENT_SUCCESS: 'payment-success',
    SEARCH_RECS: 'search-recs',
    PERSONALISED: 'personalised',
    // Phase 5 collections — see the note in DiscoverySources::KEYS.
    SPOTLIGHT: 'spotlight',
    POPULAR: 'popular',
    MEMBERSHIPS: 'memberships',
    BIO_LINK: 'bio-link',
};

/** The query parameter the server reads. Mirrors `DiscoverySources::PARAM`. */
export const DISCOVERY_PARAM = 'sp_d';

/**
 * `discoveryLink('jane', 'trending')` → `/jane?sp_d=trending`
 *
 * @param {string} username
 * @param {string} source     one of DISCOVERY_SOURCE
 * @param {string} [campaign] optional named collection or campaign
 */
export default function discoveryLink(username, source, campaign) {
    if (!username) return '/';
    if (!source) return `/${username}`;

    const params = new URLSearchParams({ [DISCOVERY_PARAM]: source });

    if (campaign) params.set('sp_c', campaign);

    return `/${username}?${params.toString()}`;
}
