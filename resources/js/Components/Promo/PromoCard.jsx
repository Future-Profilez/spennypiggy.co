import BioLinkCard from "./cards/BioLinkCard";
import BirthdayCard from "./cards/BirthdayCard";
import FastStartCard from "./cards/FastStartCard";
import FounderCard from "./cards/FounderCard";
import InstallAppCard from "./cards/InstallAppCard";
import LeaderboardCard from "./cards/LeaderboardCard";
import ReceiptCard from "./cards/ReceiptCard";
import ReferralCard from "./cards/ReferralCard";
import StatementCard from "./cards/StatementCard";
import SuggestCard from "./cards/SuggestCard";
import VerifiedCard from "./cards/VerifiedCard";

/**
 * The promo registry. It picks a card component and gets out of the way.
 *
 * 🚨 THERE IS NO SHARED CARD BODY, AND THERE MUST NOT BE ONE. Every promo is its own
 * component under `./cards`, free to lay itself out however it likes. Four earlier
 * passes drew all of them from one template and recoloured it; however good the
 * palette got, the deck still read as one card shown ten times, because **the eye
 * reads layout before it reads colour**. If a future promo looks like it could reuse
 * an existing card's body, that is a reason to design it differently, not a reason to
 * extract a component.
 *
 * What they DO share lives in `promoKit.jsx` and is strictly the deck's vocabulary:
 * fixed height, `border-black` frame, house radius tokens, the ground/accent palette,
 * `Chip`, and `Cta`. See that file for the two traps (`border-[#000]` not compiling;
 * the height being fixed rather than `min-h`).
 *
 * ⚠️ `layout` comes from `config/promos.php` and defaults to `statement` — which is
 * also what every timed announcement uses, and the ONLY card that renders its copy
 * from config.
 */
const CARDS = {
    birthday: BirthdayCard,
    founder: FounderCard,
    faststart: FastStartCard,
    receipt: ReceiptCard,
    badge: VerifiedCard,
    split: ReferralCard,
    ranking: LeaderboardCard,
    bio: BioLinkCard,
    install: InstallAppCard,
    suggest: SuggestCard,
    statement: StatementCard,
};

export default function PromoCard({ promo, onAction }) {
    const Card = CARDS[promo.layout] ?? StatementCard;

    return <Card promo={promo} onAction={onAction} />;
}
