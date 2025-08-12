import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { RiFireLine, RiTrophyLine, RiHeartLine, RiStarLine, RiArrowUpLine, RiArrowDownLine, RiTimeLine } from 'react-icons/ri';
import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';

export default function CompetitionStats() {
    const { formatMultiPrice } = PriceFormat();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        daily_leaders: [],
        weekly_rising: [],
        monthly_champions: [],
        supporter_battles: [],
        competition_stats: {
            total_active_battles: 0,
            daily_transactions: 0,
            weekly_new_supporters: 0,
            monthly_new_creators: 0
        }
    });

    const fetchCompetitionData = () => {
        setLoading(true);
        setError(null);
        axios.get('leaderboard/competition-stats')
            .then((response) => {
                const responseData = response.data?.data || {};
                setData({
                    daily_leaders: responseData.daily_leaders || [],
                    weekly_rising: responseData.weekly_rising || [],
                    monthly_champions: responseData.monthly_champions || [],
                    supporter_battles: responseData.supporter_battles || [],
                    competition_stats: {
                        total_active_battles: responseData.competition_stats?.total_active_battles ?? 0,
                        daily_transactions: responseData.competition_stats?.daily_transactions ?? 0,
                        weekly_new_supporters: responseData.competition_stats?.weekly_new_supporters ?? 0,
                        monthly_new_creators: responseData.competition_stats?.monthly_new_creators ?? 0
                    }
                });
            })
            .catch((error) => {
                console.error("Error fetching competition stats:", error);
                setError("Failed to load competition stats. Please try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCompetitionData();
    }, []);

    const CompetitorCard = ({ competitor, rank, badge, showTrend = false }) => (
        <div className="competitor-card bg-white rounded-lg p-3 mb-2 shadow-sm hover:shadow-md transition-shadow border-l-4 border-pink-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="rank-badge bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                        {rank}
                    </div>
                    <Avatar
                        name={competitor.name}
                        src={competitor.avatar_url}
                        role={competitor.role}
                        profile_status_lock={competitor.profile_status_lock}
                        username={competitor.username}
                        link={competitor.username}
                        size="sm"
                    />
                    <div>
                        <h5 className="font-semibold text-gray-900 text-sm">{competitor.name}</h5>
                        <p className="text-xs text-gray-600">@{competitor.username}</p>
                    </div>
                    {badge && (
                        <div className="ml-2">
                            <span className="text-lg">{badge}</span>
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="flex items-center space-x-2">
                        {showTrend && competitor.trend && (
                            <div className={`flex items-center ${competitor.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {competitor.trend > 0 ? <RiArrowUpLine size={14} /> : <RiArrowDownLine size={14} />}
                                <span className="text-xs font-medium">{Math.abs(competitor.trend)}%</span>
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-sm text-gray-900">
                                {competitor.engagement_score ? (
                                    `${competitor.engagement_score} pts`
                                ) : (
                                    formatMultiPrice(competitor.total_amount, competitor.currency || 'USD')
                                )}
                            </p>
                            <p className="text-xs text-gray-600">
                                {competitor.supporters_count || 0} supporters
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const StatCard = ({ title, value, icon: Icon, color, trend }) => (
        <div className="stat-card bg-white rounded-lg p-4 shadow-sm border-l-4" style={{borderLeftColor: color}}>
            <div className="flex items-center justify-between mb-2">
                <Icon size={20} style={{color: color}} />
                {trend && (
                    <div className={`flex items-center ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? <RiArrowUpLine size={14} /> : <RiArrowDownLine size={14} />}
                        <span className="text-xs font-medium ml-1">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <h3 className="text-xl font-bold text-gray-900">{value}</h3>
            <p className="text-sm text-gray-600">{title}</p>
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
                        onClick={fetchCompetitionData}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 rounded-[25px] p-4 mb-6">
            <h2 className="font-GillSans text-2xl uppercase text-dark text-start mb-4">🏆 Creator Competition</h2>
            <p className="text-gray-500 mb-6">Live leaderboard showing top performing creators and supporters right now!</p>

            {/* Competition Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard 
                    title="Competing Creators"
                    value={data.competition_stats.total_active_battles}
                    icon={RiFireLine}
                    color="#ef4444"
                    trend={15}
                />
                <StatCard 
                    title="Gifts Sent Today"
                    value={data.competition_stats.daily_transactions}
                    icon={RiTrophyLine}
                    color="#f59e0b"
                    trend={8}
                />
                <StatCard 
                    title="New Supporters (7 days)"
                    value={data.competition_stats.weekly_new_supporters}
                    icon={RiHeartLine}
                    color="#ec4899"
                    trend={23}
                />
                <StatCard 
                    title="New Creators (30 days)"
                    value={data.competition_stats.monthly_new_creators}
                    icon={RiStarLine}
                    color="#8b5cf6"
                    trend={12}
                />
            </div>

            {/* Competition Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Daily Leaders */}
                <div className="competition-section">
                    <div className="flex items-center mb-3">
                        <RiTimeLine size={20} className="text-blue-600 mr-2" />
                        <h3 className="text-lg font-semibold">🔥 Today's Top Earners</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Creators with most support today</p>
                    <div className="space-y-2">
                        {data.daily_leaders.slice(0, 3).map((competitor, index) => (
                            <CompetitorCard 
                                key={competitor.id} 
                                competitor={competitor} 
                                rank={index + 1}
                                badge={index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                            />
                        ))}
                    </div>
                </div>

                {/* Weekly Rising */}
                <div className="competition-section">
                    <div className="flex items-center mb-3">
                        <RiArrowUpLine size={20} className="text-green-600 mr-2" />
                        <h3 className="text-lg font-semibold">📈 Weekly Rising Stars</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Fastest growth this week</p>
                    <div className="space-y-2">
                        {data.weekly_rising.slice(0, 3).map((competitor, index) => (
                            <CompetitorCard 
                                key={competitor.id} 
                                competitor={competitor} 
                                rank={index + 1}
                                badge={index === 0 ? "🚀" : index === 1 ? "⭐" : "✨"}
                                showTrend={true}
                            />
                        ))}
                    </div>
                </div>

                {/* Monthly Champions */}
                <div className="competition-section">
                    <div className="flex items-center mb-3">
                        <RiTrophyLine size={20} className="text-yellow-600 mr-2" />
                        <h3 className="text-lg font-semibold">👑 Monthly Champions</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Dominating this month</p>
                    <div className="space-y-2">
                        {data.monthly_champions.slice(0, 3).map((competitor, index) => (
                            <CompetitorCard 
                                key={competitor.id} 
                                competitor={competitor} 
                                rank={index + 1}
                                badge={index === 0 ? "👑" : index === 1 ? "🏆" : "🎖️"}
                            />
                        ))}
                    </div>
                </div>

                {/* Supporter Battles */}
                <div className="competition-section">
                    <div className="flex items-center mb-3">
                        <RiHeartLine size={20} className="text-pink-600 mr-2" />
                        <h3 className="text-lg font-semibold">💖 Supporter Showdown</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Most dedicated supporters</p>
                    <div className="space-y-2">
                        {data.supporter_battles.slice(0, 3).map((supporter, index) => (
                            <CompetitorCard 
                                key={supporter.id} 
                                competitor={supporter} 
                                rank={index + 1}
                                badge={index === 0 ? "💎" : index === 1 ? "💝" : "💗"}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Live Competition Feed */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold">⚡ Live Competition Feed</h4>
                    <div className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        Live updates
                    </div>
                </div>
                <div className="bg-white rounded-lg p-3">
                    <div className="text-center text-gray-500">
                        <RiFireLine size={32} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Competition feed coming soon!</p>
                        <p className="text-xs">Real-time updates on creator battles and supporter showdowns</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
