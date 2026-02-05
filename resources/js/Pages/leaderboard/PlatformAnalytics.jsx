import { useState, useEffect } from "react";
import axios from 'axios';
import { RiBarChart2Line, RiArrowUpLine, RiUser3Line, RiEarthLine, RiMedal2Line, RiFocus3Line } from 'react-icons/ri';

export default function PlatformAnalytics() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState({
        overview: {
            active_creators: 0,
            total_supporters: 0,
            avg_growth: 0,
            creators_trend: null,
            supporters_trend: null
        },
        milestones: [],
        countries: [],
        achievements: []
    });

    const fetchAnalytics = () => {
        setLoading(true);
        setError(null);
        axios.get('leaderboard/platform-analytics')
            .then((response) => {
                // Safely merge response data with defaults
                const responseData = response.data?.data || {};
                setData({
                    overview: {
                        active_creators: responseData.overview?.active_creators || 0,
                        total_supporters: responseData.overview?.total_supporters || 0,
                        avg_growth: responseData.overview?.avg_growth || 0,
                        creators_trend: responseData.overview?.creators_trend || null,
                        supporters_trend: responseData.overview?.supporters_trend || null
                    },
                    milestones: responseData.milestones || [],
                    countries: responseData.countries || [],
                    achievements: responseData.achievements || []
                });
            })
            .catch((error) => {
                console.error("Error fetching analytics:", error);
                setError("Failed to load platform analytics. Please try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'text-blue-600' }) => (
        <div className="stat-card bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">{title}</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg bg-gray-100`}>
                    <Icon size={24} className={color} />
                </div>
            </div>
            {trend && (
                <div className="flex items-center">
                    <RiArrowUpLine size={16} className={trend.positive ? 'text-green-500' : 'text-red-500'} />
                    <span className={`text-sm ml-1 ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                        {trend.positive ? '+' : ''}{trend.percentage}% from last month
                    </span>
                </div>
            )}
        </div>
    );

    const MilestoneCard = ({ milestone, isCompleted }) => (
        <div className={`milestone-card p-4 rounded-lg border-2 ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                {isCompleted && (
                    <div className="text-green-500">
                        <RiMedal2Line size={20} />
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                    {milestone.current?.toLocaleString()} / {milestone.target?.toLocaleString()}
                </span>
                <span className="text-sm text-gray-600">
                    {Math.round((milestone.current / milestone.target) * 100)}%
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                    className={`h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min((milestone.current / milestone.target) * 100, 100)}%` }}
                ></div>
            </div>
        </div>
    );

    const CountryCard = ({ country, rank }) => (
        <div className="country-card bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="rank-badge bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                        {rank}
                    </div>
                    <div className="text-2xl">{country.flag}</div>
                    <div>
                        <h4 className="font-semibold text-gray-900">{country.name}</h4>
                        <p className="text-sm text-gray-600">{country.creators} creators</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{country.supporters?.toLocaleString() || 0}</p>
                    <p className="text-sm text-gray-600">supporters</p>
                </div>
            </div>
        </div>
    );

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
                        onClick={fetchAnalytics}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 rounded-[25px] p-4 mb-6">
            <h2 className="font-GillSans text-2xl uppercase text-dark text-left mb-4">📊 Platform Analytics</h2>
            <p className="text-gray-500 mb-6">Insights into platform performance and growth</p>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Active Creators"
                    value={data.overview.active_creators?.toLocaleString()}
                    subtitle="Creating content this month"
                    icon={RiUser3Line}
                    color="text-blue-600"
                    trend={data.overview.creators_trend}
                />
                <StatCard
                    title="Global Supporters"
                    value={data.overview.total_supporters?.toLocaleString()}
                    subtitle="People supporting creators"
                    icon={RiEarthLine}
                    color="text-purple-600"
                    trend={data.overview.supporters_trend}
                />
                <StatCard
                    title="Avg. Monthly Growth"
                    value={data.overview.avg_growth?.toFixed(1) + '%'}
                    subtitle="Platform growth rate"
                    icon={RiArrowUpLine}
                    color="text-orange-600"
                />
            </div>

            {/* Milestones Section */}
            <div className="mb-8">
                <div className="flex items-center mb-4">
                    <RiFocus3Line size={24} className="text-blue-600" />
                    <h3 className="text-lg font-semibold ml-2">Platform Milestones</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.milestones?.map((milestone, index) => (
                        <MilestoneCard 
                            key={index} 
                            milestone={milestone} 
                            isCompleted={milestone.current >= milestone.target}
                        />
                    ))}
                </div>
            </div>

            {/* Top Countries */}
            <div className="mb-8">
                <div className="flex items-center mb-4">
                    <RiEarthLine size={24} className="text-green-600" />
                    <h3 className="text-lg font-semibold ml-2">Top Countries by Supporter Activity</h3>
                </div>
                <div className="space-y-3">
                    {data.countries?.map((country, index) => (
                        <CountryCard 
                            key={country.code} 
                            country={country} 
                            rank={index + 1}
                        />
                    ))}
                </div>
            </div>

            {/* Recent Achievements */}
            {data.achievements?.length > 0 && (
                <div>
                    <div className="flex items-center mb-4">
                        <RiMedal2Line size={24} className="text-yellow-600" />
                        <h3 className="text-lg font-semibold ml-2">Recent Platform Achievements</h3>
                    </div>
                    <div className="space-y-3">
                        {data.achievements.map((achievement, index) => (
                            <div key={index} className="achievement-card bg-white rounded-lg p-4 shadow-sm">
                                <div className="flex items-start space-x-3">
                                    <div className="text-2xl">{achievement.icon}</div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                                        <p className="text-sm text-gray-600">{achievement.description}</p>
                                        <p className="text-xs text-gray-500 mt-1">{achievement.date}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
