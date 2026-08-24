import { useState } from "react";
import { Link } from "@inertiajs/react";
import useBundleSection from './useBundle';
import VerifiedBadge from '@/Components/VerifiedBadge';
import userphoto from "../../../assets/siteicon.png";
import PriceFormat from '@/includes/PriceFormat';
import { RiHeartLine, RiGiftLine, RiShoppingBagLine, RiBankCardLine, RiGroupLine, RiStarLine } from 'react-icons/ri';
import { trackSearchClick } from "@/includes/Analytics";
import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";

export default function CategoryLeaders() {
    const { formatMultiPrice } = PriceFormat();
    const [activeTab, setActiveTab] = useState('wishes');
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

    const categories = [
        { key: 'wishes', label: 'Wishes', icon: RiHeartLine, color: 'text-[#FF007F]' },
        { key: 'tips', label: 'Supports', icon: RiStarLine, color: 'text-yellow-600' },
        // { key: 'subscriptions', label: 'Subscriptions', icon: RiGroupLine, color: 'text-purple-600' },
        { key: 'memberships', label: 'Memberships', icon: RiBankCardLine, color: 'text-blue-600' },
        { key: 'bills', label: 'Bills', icon: RiBankCardLine, color: 'text-green-600' },
        { key: 'shop', label: 'Shop', icon: RiShoppingBagLine, color: 'text-orange-600' }
    ];

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

                <span className="shrink-0 whitespace-nowrap text-14 font-semibold tabular-nums text-[#0B0B0C]">
                    {creator.engagement_score
                        ? `${creator.engagement_score} pts`
                        : formatMultiPrice(creator.total_amount, creator.currency || 'GBP')}
                </span>
            </div>
        );
    };

    const EmptyState = ({ category }) => (
        <div className="animate-fading text-center py-12">
            <div className="mb-4">
                <RiGiftLine size={48} className="text-black/60 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {category} Leaders Yet</h3>
            <p className="text-black/80">Be the first to make it to the {category} leaderboard!</p>
        </div>
    );

    if (loading) {
        return (
            <div className="animate-fading bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4 mb-6 flex justify-center items-center min-h-[400px]">
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
            <div className="animate-fading bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4 mb-6 text-center">
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
        <div className="bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4 mb-6 mt-6">
            <h2 className="animate-fading text-19 font-semibold tracking-tight text-[#0B0B0C] text-left mb-2">🏆 Category Leaders Creators</h2>
            <p className="animate-fading text-black/60 mb-6 ">Top performers in each category</p>

            {/* Category Tabs */}
            <div className="category-tabs mb-6 mt-2">
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <button
                                key={category.key}
                                onClick={() => setActiveTab(category.key)}
                                className={`animate-fading category-tab flex min-h-[44px] items-center space-x-2 rounded-full px-4 py-2 text-13 font-semibold transition-colors ${
                                    activeTab === category.key
                                        ? 'bg-[#0B0B0C] text-white'
                                        : 'text-black/60 ring-1 ring-inset ring-black/[0.08] hover:text-[#0B0B0C] hover:ring-black/25'
                                }`}
                            >
                                <Icon size={16} className={category.color} />
                                <span>{category.label}</span>
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
                    <EmptyState category={currentCategory?.label || 'Category'} />
                )}
            </div>
        </div>
    );
}
