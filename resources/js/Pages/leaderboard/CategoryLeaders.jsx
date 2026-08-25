import { useState } from "react";
import { Link } from "@inertiajs/react";
import useBundleSection from './useBundle';
import VerifiedBadge from '@/Components/VerifiedBadge';
import userphoto from "../../../assets/siteicon.png";
import { RiHeartLine, RiShoppingBagLine, RiBankCardLine, RiStarLine } from 'react-icons/ri';
import { trackSearchClick } from "@/includes/Analytics";
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";

/**
 * The category row, in display order. Supports is FIRST and is the tab the panel
 * opens on — every creator can appear in it, so it is the only one that reads as
 * a leaderboard of the platform rather than of one product; Wishes opened on a
 * board that excluded most of the people looking at it.
 *
 * ⚠️ Module scope, so `useState` can default to `CATEGORIES[0].key`. A hardcoded
 * default is a second copy of the key that stops matching the day the row is
 * reordered — and the panel would open on a tab that renders nothing.
 */
const CATEGORIES = [
    { key: 'tips', label: 'Supports', icon: RiStarLine, product: 'Piggy Bank' },
    { key: 'wishes', label: 'Wishes', icon: RiHeartLine, product: 'Wishlist' },
    // { key: 'subscriptions', label: 'Subscriptions', icon: RiGroupLine }, // ⚠️ re-import RiGroupLine to restore
    { key: 'memberships', label: 'Memberships', icon: RiBankCardLine, product: 'Memberships' },
    { key: 'bills', label: 'Bills', icon: RiBankCardLine, product: 'Recurring content' },
    { key: 'shop', label: 'Shop', icon: RiShoppingBagLine, product: 'Shop' },
];

export default function CategoryLeaders({ hideHeading = false }) {
    // Supports leads: it is the one category every creator can be in, so it is
    // the only tab that reads as a leaderboard of the whole platform rather than
    // of one product. `CATEGORIES[0]`, never a second copy of the key.
    const [activeTab, setActiveTab] = useState(CATEGORIES[0].key);
    // Shared with every other panel on the page — one request, not seven.
    const { data: section, loading, error, retry: fetchCategoryData } = useBundleSection('category_leaders');

    const data = {
        wishes: [],
        subscriptions: [],
        tips: [],
        memberships: [],
        bills: [],
        shop: [],
        ...(section?.data || {}),
    };

    const categories = CATEGORIES;

    /**
     * Same row grammar as the board's own rail: rank, squircle avatar, name,
     * then one wrapping meta line.
     *
     * The old card put "Last 3 months" and the transaction count in a right
     * column with no width of its own, so on a phone they broke mid-phrase —
     * "Last 3 / months", "4 / transactions" — while squeezing the name down to
     * "Sachin…" beside a handle that still fitted in full. Only the figure
     * stays on the right now, and it never wraps.
     */
    const CategoryItem = ({ creator, rank }) => {
        const count = creator.total_count || creator.supporters_count || 0;
        const countLabel = creator.supporters_count ? 'supporters' : 'transactions';

        return (
            <div className="animate-fading category-item flex items-center gap-2.5 border-b border-black/[0.06] py-3 last:border-b-0 sm:gap-3">
                <span className="w-6 shrink-0 text-center font-gulfs text-15 leading-none text-black/60">
                    {rank}
                </span>

                <Link
                    href={discoveryLink(creator.username, DISCOVERY_SOURCE.TRENDING)}
                    onClick={() => trackSearchClick(creator.id, creator.username)}
                    className="flex min-w-0 flex-1 items-center gap-2.5"
                >
                    <img
                        src={creator.avatar_url || userphoto}
                        alt=""
                        loading="lazy"
                        className="h-10 w-10 shrink-0 rounded-box-sm object-cover "
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="truncate text-14 font-semibold capitalize tracking-tight text-[#0B0B0C]">
                                {creator.name}
                            </span>
                            <VerifiedBadge user={creator} size="sm" />
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-12 text-black/60">
                            <span className="truncate">@{creator.username}</span>
                            {!creator.engagement_score && (
                                <span className="whitespace-nowrap">
                                    {count} {countLabel} · last 3 months
                                </span>
                            )}
                        </div>
                    </div>
                </Link>

                {/* 🚨 A COUNT, NEVER A REVENUE FIGURE. The fallback here used to
                    print `total_amount` — a creator's earnings, on a public page,
                    on the same screen whose main board sets `'amount' => 0` for
                    exactly this reason. `total_count` is already in the payload. */}
                <span className="shrink-0 whitespace-nowrap text-14 font-semibold tabular-nums text-[#0B0B0C]">
                    {creator.engagement_score
                        ? `${creator.engagement_score} pts`
                        : `${creator.total_count ?? 0} ${creator.total_count === 1 ? 'purchase' : 'purchases'}`}
                </span>
            </div>
        );
    };

    /**
     * ⚠️ An empty screen is an invitation to act, and the old one was neither.
     * "Be the first to make it to the Supports leaderboard!" tells a reader
     * nothing about what would put them on it — a creator cannot act on it and a
     * visitor is not the person it is addressed to. This names the product the
     * board is counting and gives the reader somewhere to go.
     */
    const EmptyState = ({ category }) => (
        <div className="animate-fading px-6 py-14 text-center">
            <div className="mb-4">
                {/* ⚠️ Not a gift box. An icon carries the same meaning as the word
                    on a payment-adjacent surface, and gift/tip vocabulary is banned. */}
                <RiStarLine size={40} className="mx-auto text-black/40" />
            </div>
            <h3 className="mb-1.5 text-17 font-semibold tracking-tight text-black">
                Nothing sold through {category.product} yet
            </h3>
            <p className="mx-auto mb-5 max-w-sm text-13 leading-[1.55] text-black/70">
                {/* ⚠️ No `.toLowerCase()` — these are PRODUCT names ("Piggy Bank",
                    "Wishlist"), and lowercasing one turns a feature into a noun
                    phrase the app does not use anywhere else. */}
                This board ranks creators by {category.product} purchases. It fills the moment the
                first one lands.
            </p>
            <Link
                href="/discover"
                className="inline-flex min-h-[44px] items-center rounded-full border-black bg-brandPink px-5 text-12 font-semibold uppercase tracking-[0.12em] text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95"
            >
                Browse creators
            </Link>
        </div>
    );

    if (loading) {
        return (
            <div className="animate-fading bg-white rounded-box border-black p-4 mb-6 flex justify-center items-center min-h-[400px]">
                <svg className="animate-spin h-8 w-8 text-[#FF007F]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animate-fading bg-white rounded-box border-black p-4 mb-6 text-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    {error}
                    <button 
                        className="py-1 border border-red-500 text-red-500 inline-flex items-center min-h-[44px] px-3 rounded-box-sm hover:bg-red-50 transition-colors ml-2" 
                        onClick={fetchCategoryData}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const currentCategory = categories.find(cat => cat.key === activeTab);
    const currentData = data[activeTab] || [];

    return (
        <div className="bg-white rounded-box border-black p-4 mb-6 mt-6">
            {!hideHeading && (
                <h2 className="animate-fading mb-2 text-left text-12 font-semibold uppercase tracking-[0.22em] text-black/70">Category leaders</h2>
            )}
            <p className="animate-fading mb-6 text-13 text-black/70">Top performers in each category</p>

            {/* 🚨 EVERY TAB CARRIES ITS COUNT. Without one, a category with
                nothing in it is indistinguishable from a full one until you have
                clicked it and been shown an empty panel — which is exactly how
                this was found. The count is a length, never an amount. */}
            <div
                className="category-tabs mb-6 mt-2"
                role="tablist"
                aria-label="Leaderboard categories"
            >
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        const count = (data[category.key] || []).length;
                        const isActive = activeTab === category.key;

                        return (
                            <button
                                key={category.key}
                                role="tab"
                                aria-selected={isActive}
                                onClick={() => setActiveTab(category.key)}
                                className={`animate-fading category-tab flex min-h-[44px] items-center space-x-2 rounded-full px-4 py-2 text-13 font-semibold transition-colors ${
                                    isActive
                                        ? 'bg-brandPink text-black border-black'
                                        : 'bg-white text-black/70 border-black hover:bg-black/[0.06] hover:text-black'
                                }`}
                            >
                                {/* ⚠️ `currentColor`, not the category's own hue. A
                                    green glyph on the pink active pill is a third
                                    colour on a 44px control, and the label already
                                    says which category it is. */}
                                <Icon size={16} />
                                <span>{category.label}</span>
                                <span
                                    className={`rounded-box-xs px-1.5 text-12 font-semibold tabular-nums ${
                                        isActive ? 'bg-black/15 text-black' : 'bg-black/[0.06] text-black/70'
                                    }`}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Category Content */}
            <div className="category-content">
                {currentData.length > 0 ? (
                    <>
                        {currentCategory && (
                            <div className="animate-fading flex items-center mb-4">
                                <currentCategory.icon size={24} className={currentCategory.color} />
                                <h3 className=" text-lg font-semibold ml-2">
                                    Top {currentCategory.label} Creators
                                </h3>
                            </div>
                        )}
                        {currentData.map((creator, index) => (
                            <CategoryItem 
                                key={creator.id} 
                                creator={creator} 
                                rank={index + 1}
                            />
                        ))}
                    </>
                ) : (
                    <EmptyState category={currentCategory ?? CATEGORIES[0]} />
                )}
            </div>
        </div>
    );
}
