import { useState, useEffect } from "react";
import axios from 'axios';
import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';
import { RiAwardLine, RiStarLine, RiTrophyLine, RiVipCrownLine, RiShieldLine, RiFocus3Line, RiSpeedLine, RiHeartLine } from 'react-icons/ri';

export default function AchievementSystem() {
    const { formatMultiPrice } = PriceFormat();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('recent');
    const [data, setData] = useState({
        recent_achievements: [],
        milestone_holders: [],
        badge_categories: {},
        leaderboard_badges: []
    });

    const fetchAchievements = () => {
        setLoading(true);
        setError(null);
        axios.get('leaderboard/achievements')
            .then((response) => {
                setData(response.data.data);
            })
            .catch((error) => {
                console.error("Error fetching achievements:", error);
                setError("Failed to load achievements. Please try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchAchievements();
    }, []);

    const badgeIcons = {
        'first_supporter': RiHeartLine,
        'top_creator': RiVipCrownLine,
        'milestone_reached': RiFocus3Line,
        'growth_champion': RiSpeedLine,
        'community_hero': RiShieldLine,
        'trending_star': RiStarLine,
        'loyal_supporter': RiAwardLine,
        'platform_veteran': RiTrophyLine
    };

    const badgeColors = {
        'first_supporter': 'text-pink-600 bg-pink-100',
        'top_creator': 'text-yellow-600 bg-yellow-100',
        'milestone_reached': 'text-blue-600 bg-blue-100',
        'growth_champion': 'text-green-600 bg-green-100',
        'community_hero': 'text-purple-600 bg-purple-100',
        'trending_star': 'text-orange-600 bg-orange-100',
        'loyal_supporter': 'text-red-600 bg-red-100',
        'platform_veteran': 'text-gray-600 bg-gray-100'
    };

    const AchievementCard = ({ achievement }) => {
        const IconComponent = badgeIcons[achievement.badge_type] || RiAwardLine;
        const colorClass = badgeColors[achievement.badge_type] || 'text-blue-600 bg-blue-100';
        
        return (
            <div className="achievement-card bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-full ${colorClass}`}>
                        <IconComponent size={24} />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                                <p className="text-sm text-gray-600">{achievement.description}</p>
                            </div>
                            <span className="text-xs text-gray-500">{achievement.earned_date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <Avatar
                                name={achievement.user.name}
                                src={achievement.user.avatar_url}
                                username={achievement.user.username}
                                link={achievement.user.username}
                                size="sm"
                            />
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">@{achievement.user.username}</p>
                                {achievement.achievement_value && (
                                    <p className="text-xs text-gray-600">
                                        {formatMultiPrice(achievement.achievement_value, achievement.currency || 'USD')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const MilestoneCard = ({ milestone }) => (
        <div className="milestone-card bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <RiTrophyLine size={28} />
                    <h3 className="text-xl font-bold">{milestone.title}</h3>
                </div>
                <span className="text-sm opacity-90">{milestone.category}</span>
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Avatar
                        name={milestone.holder.name}
                        src={milestone.holder.avatar_url}
                        username={milestone.holder.username}
                        link={milestone.holder.username}
                        size="md"
                    />
                    <div>
                        <h4 className="font-semibold">{milestone.holder.name}</h4>
                        <p className="text-sm opacity-90">@{milestone.holder.username}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{formatMultiPrice(milestone.value, milestone.currency)}</p>
                    <p className="text-sm opacity-90">{milestone.description}</p>
                </div>
            </div>
        </div>
    );

    const BadgeCategoryCard = ({ category, badges }) => (
        <div className="badge-category bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{category}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {badges.map((badge, index) => {
                    const IconComponent = badgeIcons[badge.type] || RiAwardLine;
                    const colorClass = badgeColors[badge.type] || 'text-blue-600 bg-blue-100';
                    
                    return (
                        <div key={index} className="badge-item text-center p-4 border rounded-lg hover:shadow-sm transition-shadow">
                            <div className={`p-3 rounded-full ${colorClass} inline-flex mb-2`}>
                                <IconComponent size={20} />
                            </div>
                            <h4 className="font-medium text-sm text-gray-900">{badge.name}</h4>
                            <p className="text-xs text-gray-600 mt-1">{badge.holders} holders</p>
                            <p className="text-xs text-gray-500">{badge.description}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const tabs = [
        { key: 'recent', label: 'Recent Achievements', icon: RiAwardLine },
        { key: 'milestones', label: 'Milestone Holders', icon: RiTrophyLine },
        { key: 'badges', label: 'Badge System', icon: RiStarLine }
    ];

    if (loading) {
        return (
            <div className="bg-gray-100 rounded-[25px] p-4 mb-6 flex justify-center items-center" style={{minHeight: '400px'}}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-100 rounded-[25px] p-4 mb-6 text-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    {error}
                    <button 
                        className="px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors ml-2 text-sm" 
                        onClick={fetchAchievements}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 rounded-[25px] p-4 mb-6">
            <h2 className="font-GillSans text-2xl uppercase text-dark text-left mb-4">🏅 Achievements & Badges</h2>
            <p className="text-gray-500 mb-6">Celebrate accomplishments and milestones</p>

            {/* Achievement Tabs */}
            <div className="achievement-tabs mb-6">
                <div className="flex flex-wrap gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`achievement-tab flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                    activeTab === tab.key
                                        ? 'bg-white shadow-md text-gray-900'
                                        : 'text-gray-600 hover:bg-white/50'
                                }`}
                            >
                                <Icon size={16} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {activeTab === 'recent' && (
                    <div className="space-y-4">
                        {data.recent_achievements?.length > 0 ? (
                            data.recent_achievements.map((achievement, index) => (
                                <AchievementCard key={index} achievement={achievement} />
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <RiAwardLine size={48} className="text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Achievements</h3>
                                <p className="text-gray-600">New achievements will appear here as they're earned!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'milestones' && (
                    <div className="space-y-6">
                        {data.milestone_holders?.length > 0 ? (
                            data.milestone_holders.map((milestone, index) => (
                                <MilestoneCard key={index} milestone={milestone} />
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <RiTrophyLine size={48} className="text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No Milestones Yet</h3>
                                <p className="text-gray-600">Major platform milestones will be celebrated here!</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'badges' && (
                    <div className="space-y-6">
                        {Object.entries(data.badge_categories || {}).map(([category, badges]) => (
                            <BadgeCategoryCard key={category} category={category} badges={badges} />
                        ))}
                    </div>
                )}
            </div>

            {/* Achievement Stats */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Achievement Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-lg">
                        <RiAwardLine size={20} className="text-blue-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                            {data.recent_achievements?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Recent Achievements</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                        <RiTrophyLine size={20} className="text-yellow-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                            {data.milestone_holders?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Milestone Holders</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                        <RiStarLine size={20} className="text-purple-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                            {Object.values(data.badge_categories || {}).reduce((sum, badges) => sum + badges.length, 0)}
                        </p>
                        <p className="text-sm text-gray-600">Available Badges</p>
                    </div>
                    <div className="text-center p-4 bg-white rounded-lg">
                        <RiVipCrownLine size={20} className="text-orange-600 mx-auto mb-2" />
                        <p className="text-2xl font-bold text-gray-900">
                            {data.leaderboard_badges?.length || 0}
                        </p>
                        <p className="text-sm text-gray-600">Leaderboard Badges</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
