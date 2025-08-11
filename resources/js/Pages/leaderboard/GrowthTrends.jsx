import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Activity } from 'react-feather';
import PriceFormat from '@/includes/PriceFormat';
import Avatar from '@/includes/Avatar';

export default function GrowthTrends() {
    const { formatMultiPrice } = PriceFormat();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        fastest_growing: [],
        momentum_leaders: [],
        comeback_creators: [],
        platform_stats: {}
    });

    const fetchGrowthData = () => {
        setLoading(true);
        setError(null);
        axios.get('leaderboard/growth-trends')
            .then((response) => {
                setData(response.data.data);
            })
            .catch((error) => {
                console.error("Error fetching growth trends:", error);
                setError("Failed to load growth trends. Please try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchGrowthData();
    }, []);

    const TrendCard = ({ title, value, change, icon: Icon, type = 'positive' }) => (
        <div className="trend-card bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <Icon size={24} className={`${type === 'positive' ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-sm font-medium ${type === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                    {change > 0 ? '+' : ''}{change}%
                </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            <p className="text-sm text-gray-600">{title}</p>
        </div>
    );

    const CreatorCard = ({ creator, rank, badge }) => (
        <div className="creator-growth-card bg-white rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <Avatar
                            name={creator.name}
                            src={creator.avatar_url}
                            role={creator.role}
                            profile_status_lock={creator.profile_status_lock}
                            username={creator.username}
                            link={creator.username}
                            size="md"
                        />
                        {badge && (
                            <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                                <span className="text-xs">🔥</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">{creator.name}</h4>
                        <p className="text-sm text-gray-600">@{creator.username}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{formatMultiPrice(creator.current_amount, creator.currency)}</p>
                    <p className="text-sm text-green-600">+{creator.growth_percentage}% growth</p>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="bg-gray-100 rounded-[25px] p-4 mb-6 d-flex justify-content-center align-items-center" style={{minHeight: '300px'}}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-100 rounded-[25px] p-4 mb-6 text-center">
                <div className="alert alert-danger" role="alert">
                    {error}
                    <button 
                        className="btn btn-sm btn-outline-danger ms-2" 
                        onClick={fetchGrowthData}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 rounded-[25px] p-4 mb-6">
            <h2 className="font-GillSans text-2xl uppercase text-dark text-start mb-4">📈 Growth & Momentum</h2>
            <p className="text-gray-500 mb-6">Creators with the fastest growth and momentum</p>

            {/* Platform Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <TrendCard 
                    title="Total Active Creators"
                    value={data.platform_stats.total_creators}
                    change={data.platform_stats.creators_growth}
                    icon={Activity}
                />
                <TrendCard 
                    title="This Month's Revenue"
                    value={formatMultiPrice(data.platform_stats.monthly_revenue, 'USD')}
                    change={data.platform_stats.revenue_growth}
                    icon={TrendingUp}
                />
                <TrendCard 
                    title="New Supporters"
                    value={data.platform_stats.new_supporters}
                    change={data.platform_stats.supporters_growth}
                    icon={TrendingUp}
                />
                <TrendCard 
                    title="Avg. Support Value"
                    value={formatMultiPrice(data.platform_stats.avg_support, 'USD')}
                    change={data.platform_stats.avg_growth}
                    icon={TrendingUp}
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
                    <p className="text-sm text-gray-600 mb-3">Creators making a strong return</p>
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
