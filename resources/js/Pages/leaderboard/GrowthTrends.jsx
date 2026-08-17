import useBundleSection from './useBundle';
import { RiArrowUpLine, RiArrowDownLine, RiPulseLine } from 'react-icons/ri';
import PriceFormat from '@/includes/PriceFormat';
import Avatar from '@/includes/Avatar';

export default function GrowthTrends() {
    const { formatMultiPrice } = PriceFormat();
    // Shared with every other panel on the page — one request, not seven.
    const { data: section, loading, error, retry: fetchGrowthData } = useBundleSection('growth_trends');
    const responseData = section?.data || {};

    const data = {
        fastest_growing: responseData.fastest_growing || [],
        momentum_leaders: responseData.momentum_leaders || [],
        comeback_creators: responseData.comeback_creators || [],
        platform_stats: {
            total_creators: responseData.platform_stats?.total_creators ?? 0,
            creators_growth: responseData.platform_stats?.creators_growth ?? 0,
            total_interactions: responseData.platform_stats?.total_interactions ?? 0,
            engagement_growth: responseData.platform_stats?.engagement_growth ?? 0,
            new_supporters: responseData.platform_stats?.new_supporters ?? 0,
            supporters_growth: responseData.platform_stats?.supporters_growth ?? 0,
            avg_community_score: responseData.platform_stats?.avg_community_score ?? 0,
            community_growth: responseData.platform_stats?.community_growth ?? 0,
            monthly_revenue: responseData.platform_stats?.monthly_revenue ?? 0,
            revenue_growth: responseData.platform_stats?.revenue_growth ?? 0,
            avg_support: responseData.platform_stats?.avg_support ?? 0,
            avg_growth: responseData.platform_stats?.avg_growth ?? 0,
        },
    };

    const TrendCard = ({ title, value, change, icon: Icon, type = 'positive' }) => (
        <div className="trend-card bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4">
            <div className="flex items-center justify-between mb-2">
                <Icon size={24} className={`${type === 'positive' ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm font-medium ${type === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {change > 0 ? '+' : ''}{change}%
                </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <p className="text-sm text-black/80">{title}</p>
        </div>
    );

    const CreatorCard = ({ creator, rank, badge }) => (
        <div className="creator-growth-card bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4 mb-3">
            <div className="flex items-center justify-between">
                <div className="flex min-w-0 items-center space-x-2">
                    {/* `Avatar` already renders the name and the handle. The card
                        printed both again beside it, so every creator appeared
                        twice on the same row. */}
                    <Avatar
                        name={creator.name}
                        src={creator.avatar_url}
                        role={creator.role}
                        profile_status_lock={creator.profile_status_lock}
                        username={creator.username}
                        link={creator.username}
                        size="md"
                    />
                    {/* The flame sits beside the block, not on top of it — an
                        absolute badge anchored to `Avatar` lands at the far right
                        of its TEXT, which is what put it through the name. */}
                    {badge && (
                        <span
                            title="Fastest growing"
                            className="shrink-0 rounded-full bg-yellow-400/20 px-1.5 py-1 text-xs leading-none ring-1 ring-inset ring-yellow-500/30"
                        >
                            🔥
                        </span>
                    )}
                </div>
                <div className="shrink-0 text-right">
                    {/* Show engagement metrics if available, otherwise show monetary */}
                    {creator.supporters ? (
                        <>
                            <p className="font-bold text-lg">👥 {creator.supporters}</p>
                            <p className="text-sm text-green-600">+{creator.growth_percentage}% growth</p>
                        </>
                    ) : (
                        <>
                            <p className="font-bold text-lg tabular-nums">{formatMultiPrice(creator.current_amount, creator.currency)}</p>
                            <p className="text-sm text-green-600">+{creator.growth_percentage}% growth</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4 mb-6 flex justify-center items-center" style={{minHeight: '300px'}}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4 mb-6 text-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    {error}
                    <button 
                        className="py-1 border border-red-500 text-red-500 inline-flex items-center min-h-[44px] px-3 rounded-box-sm hover:bg-red-50 transition-colors ml-2 text-sm" 
                        onClick={fetchGrowthData}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-box ring-1 ring-inset ring-black/[0.06] p-4 mb-6">
            <h2 className="text-19 font-semibold tracking-tight text-[#0B0B0C] text-left mb-4">📈 Growth & Momentum</h2>
            <p className="text-black/60 mb-6">Creators with the fastest growth and momentum</p>

            {/* Platform Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <TrendCard 
                    title="Total Active Creators"
                    value={data.platform_stats.total_creators}
                    change={data.platform_stats.creators_growth}
                    icon={RiPulseLine}
                />
                <TrendCard 
                    title="Community Engagement"
                    value={data.platform_stats.total_interactions || formatMultiPrice(data.platform_stats.monthly_revenue, 'USD')}
                    change={data.platform_stats.engagement_growth || data.platform_stats.revenue_growth}
                    icon={RiArrowUpLine}
                />
                <TrendCard 
                    title="New Supporters"
                    value={data.platform_stats.new_supporters}
                    change={data.platform_stats.supporters_growth}
                    icon={RiArrowUpLine}
                />
                <TrendCard 
                    title="Avg. Community Score"
                    value={data.platform_stats.avg_community_score || formatMultiPrice(data.platform_stats.avg_support, 'USD')}
                    change={data.platform_stats.community_growth || data.platform_stats.avg_growth}
                    icon={RiArrowUpLine}
                />
            </div>

            {/* Fastest Growing Creators */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">🚀 Fastest Growing This Month</h3>
                {data.fastest_growing.map((creator, index) => (
                    <CreatorCard 
                        key={creator.id} 
                        creator={creator} 
                        rank={index + 1}
                        badge={index < 3}
                    />
                ))}
            </div>

            {/* Momentum Leaders */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">⚡ Weekly Momentum Leaders</h3>
                {data.momentum_leaders.map((creator, index) => (
                    <CreatorCard 
                        key={creator.id} 
                        creator={creator} 
                        rank={index + 1}
                    />
                ))}
            </div>

            {/* Comeback Creators */}
            {data.comeback_creators.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-3">🔄 Comeback Creators</h3>
                    <p className="text-sm text-black/80 mb-3">Creators making a strong return</p>
                    {data.comeback_creators.map((creator, index) => (
                        <CreatorCard 
                            key={creator.id} 
                            creator={creator} 
                            rank={index + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
