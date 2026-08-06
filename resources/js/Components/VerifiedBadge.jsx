import { RiVerifiedBadgeFill } from 'react-icons/ri';
import { FaCrown } from 'react-icons/fa';

/**
 * The verified tick, everywhere.
 *
 * Eight surfaces used to draw this themselves and no two agreed: the profile
 * header a blue `#1d3ef8`, the right rail a green `#12A150`, discover cards
 * `#3BA3FF`, the leaderboard brand pink, `Components/Avatar` a green-400 — five
 * colours for one idea, three of them outside the palette. The conditions
 * differed too: some required `role == 1`, one read the column alone, one read
 * an ad-hoc `is_verified` field that duplicated it.
 *
 * Two tiers, and the colour is the difference:
 *
 *   grey  — an admin reviewed and approved this profile. Gifters and creators.
 *   pink  — a creator whose identity Stripe has verified AND whose Connect
 *           onboarding is finished. It says the platform can pay this person,
 *           which is a much stronger claim than "their photo is fine".
 *
 * 🚨 The tier is decided by the SERVER (`App\Support\VerifiedBadge`) and
 * arrives as `user.verified_badge`. Do not re-derive it here — a second
 * definition is how the profile page and the leaderboard end up disagreeing
 * about the same person.
 */

const TIERS = {
  basic: {
    className: 'text-[#9AA0A6]',
    label: 'Verified — profile reviewed and approved',
  },
  creator: {
    className: 'text-[#FF007F]',
    label: 'Verified creator — identity confirmed and payouts set up',
  },
};

const SIZES = { xs: 12, sm: 14, md: 18, lg: 24, xl: 32 };

/**
 * ⚠️ Transitional fallback, and it can only ever DOWNGRADE.
 *
 * A payload the server has not been updated for carries `profile_status_lock`
 * but no `verified_badge`. Rendering nothing there would silently remove a tick
 * those screens already showed, so an approved profile still gets the grey
 * badge — never the pink one, which needs facts the payload does not carry.
 *
 * `undefined` means "this surface was never told"; an explicit `null` means the
 * server looked and said no badge, and is honoured as such.
 */
function tierOf(user, tier) {
  if (tier !== undefined) return tier;
  if (user?.verified_badge !== undefined) return user.verified_badge;

  return Number(user?.profile_status_lock) === 2 ? 'basic' : null;
}

export default function VerifiedBadge({
  user,
  tier,
  size = 'sm',
  className = '',
  founder,
}) {
  const resolved = tierOf(user, tier);
  const meta = TIERS[resolved];

  if (!meta) return null;

  /*
   * The founder crown REPLACES the tick, everywhere.
   *
   * It used to be wired per surface — the profile header and one avatar had
   * it, and the leaderboard, discover and every card did not, so the platform's
   * most-earned status was invisible on the screens where creators are ranked
   * against each other. Handling it here means a surface gets the crown by
   * rendering this component, with nothing to remember.
   *
   * ⚠️ Gated on there being a badge tier at all. Founder status is earned by
   * earning, so in practice they are always approved — but an unapproved
   * account must never be able to wear a crown.
   */
  const isFounder = founder ?? user?.is_founder;

  if (isFounder) {
    const label = 'Founder — one of the platform’s first earning creators';

    return (
      <FaCrown
        size={SIZES[size] ?? SIZES.sm}
        role="img"
        aria-label={label}
        title={label}
        className={`inline-block shrink-0 text-yellow-500 ${className}`}
      />
    );
  }

  return (
    <RiVerifiedBadgeFill
      size={SIZES[size] ?? SIZES.sm}
      // A tick is meaning, not decoration: it needs a name a screen reader can
      // read and a title a mouse can rest on. Every ad-hoc version had neither.
      role="img"
      aria-label={meta.label}
      title={meta.label}
      className={`inline-block shrink-0 ${meta.className} ${className}`}
    />
  );
}

/** For a caller that needs the tier itself (a label, a filter). */
export function verifiedTier(user) {
  return tierOf(user, undefined);
}
