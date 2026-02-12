import React, { useState, useEffect } from 'react';
import { FaCrown, FaTrophy, FaMedal, FaAward, FaUser } from 'react-icons/fa';
import { BiTrendingUp } from 'react-icons/bi';
import PriceFormat from '@/includes/PriceFormat';
import axios from 'axios';

export default function FounderLeaderboard({ currentUser }) {
    const [leaderboardData, setLeaderboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { formatMultiPrice } = PriceFormat();

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        
        // Check if user is authenticated
        if (!currentUser) {
            setError('Please log in to view the leaderboard');
            setLoading(false);
            return;
        }
        
        try {
            const response = await axios.get('/founder/leaderboard');
            
            if (response.data) {
                setLeaderboardData(response.data);
            } else {
                setError('No leaderboard data available');
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            console.error('Error response:', error.response);
            
            if (error.response && error.response.status === 401) {
                setError('Authentication failed. Please refresh the page and try again.');
            } else if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError('Failed to load leaderboard data. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const getPositionIcon = (position) => {
        switch (position) {
            case 1:
                return <FaTrophy className="w-5 h-5 text-yellow-500" />;
            case 2:
                return <FaMedal className="w-5 h-5 text-gray-400" />;
            case 3:
                return <FaAward className="w-5 h-5 text-amber-600" />;
            default:
                return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">#{position}</span>;
        }
    };

    const getPositionBadgeColor = (position) => {
        switch (position) {
            case 1:
                return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
            case 2:
                return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
            case 3:
                return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[40px]  shadow-lg p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-[40px]  shadow-lg p-6">
                <div className="text-center text-red-600">
                    <p>{error}</p>
                    <button 
                        onClick={fetchLeaderboard}
                        className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    if (!leaderboardData || !leaderboardData.leaderboard || leaderboardData.leaderboard.length === 0) {
        return (
            <div className="bg-white rounded-[40px]  shadow-lg p-6">
                <div className="text-center text-gray-500">
                    <FaCrown className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No leaderboard data available for {leaderboardData?.current_month || 'this month'}.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[40px]  shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center">
                            <FaCrown className="w-6 h-6 mr-2" />
                            Founder Leaderboard
                        </h2>
                        <p className="text-purple-100 mt-1">
                            {leaderboardData.display_period}
                        </p>
                    </div>
                    <div className="text-right">
                        <BiTrendingUp className="w-8 h-8 mx-auto mb-1" />
                        <p className="text-sm text-purple-100">
                            {leaderboardData.is_previous_month_view 
                                ? 'Previous Month Winners' 
                                : `${leaderboardData.period_days} days of earnings`}
                        </p>
                    </div>
                </div>
            </div>

            {/* User Position Banner (if user is in leaderboard) */}
            {leaderboardData.user_position && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-b border-green-200 p-4">
                    <div className="flex items-center justify-center">
                        <FaUser className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">
                            Your Position: #{leaderboardData.user_position}
                        </span>
                    </div>
                </div>
            )}

            {/* Leaderboard List */}
            <div className="divide-y divide-gray-100">
                {leaderboardData.leaderboard.map((creator, index) => {
                    const isCurrentUser = currentUser && creator.creator.id === currentUser.id;
                    
                    return (
                        <div 
                            key={creator.creator.id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${
                                isCurrentUser ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                {/* Left side - Position, Avatar, Name */}
                                <div className="flex items-center space-x-4">
                                    {/* Position Badge */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getPositionBadgeColor(creator.position)}`}>
                                        {getPositionIcon(creator.position)}
                                    </div>

                                    {/* Avatar */}
                                    <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                        {creator.creator.avatar ? (
                                            <img 
                                                src={creator.creator.avatar} 
                                                alt={creator.creator.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                                                {creator.creator.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Name and Username */}
                                    <div>
                                        <h3 className={`font-semibold ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                                            {creator.creator.name}
                                            {isCurrentUser && (
                                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                    You
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-gray-500">@{creator.creator.username}</p>
                                    </div>
                                </div>

                                {/* Right side - Earnings and Progress */}
                                <div className="text-right">
                                    <div className="flex-1">
                                        <div className="text-lg font-bold text-gray-900">
                                            £{(creator.earnings || 0).toLocaleString()}
                                        </div>
                                        <div className="text-sm text-green-600 font-medium">
                                            +£{(creator.bonus_amount || 0).toFixed(2)} bonus
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {creator.transaction_count || 0} transactions
                                        </div>
                                    </div>
                                    
                                    {/* Progress Bar */}
                                    <div className="mt-2 w-24 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${Math.min(100, Math.max(0, creator.progress_percentage || 0))}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {Math.round(creator.progress_percentage || 0)}% of max
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-600">
                    {leaderboardData.is_previous_month_view 
                        ? 'Showing previous month winners (qualification period ended)'
                        : `Rankings based on last ${leaderboardData.period_days} days of real earnings data`}
                </p>
                {leaderboardData.date_range && (
                    <p className="text-xs text-gray-500 mt-1">
                        Period: {new Date(leaderboardData.date_range.start).toLocaleDateString()} - {new Date(leaderboardData.date_range.end).toLocaleDateString()}
                    </p>
                )}
            </div>
        </div>
    );
}