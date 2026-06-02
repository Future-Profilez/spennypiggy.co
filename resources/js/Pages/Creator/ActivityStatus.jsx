import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';

const ActivityStatus = ({ activityStatus, contentBreakdown, blockedPayments, activityTimeline, user }) => {
    const [refreshing, setRefreshing] = useState(false);

    const pge = usePage().props;

    const getStatusBadge = (status) => {
        const badges = {
            'grace_period': { color: 'bg-blue-500', text: 'Grace Period', icon: '🆕' },
            'active': { color: 'bg-green-500', text: 'Active', icon: '✅' },
            'insufficient_content': { color: 'bg-red-500', text: 'Payments Paused', icon: '⚠️' },
            'grace_period_ending': { color: 'bg-yellow-500', text: 'Grace Ending', icon: '⏰' }
        };

        const badge = badges[status] || { color: 'bg-gray-500', text: 'Unknown', icon: 'ℹ️' };

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-black ${badge.color}`}>
                <span className="mr-1">{badge.icon}</span>
                {badge.text}
            </span>
        );
    };

    const ActivityChart = ({ timeline }) => {
        const maxContent = Math.max(...timeline.map(day => day.content_count));
        const today = new Date().toISOString().split('T')[0];
        const totalDaysWithContent = timeline.filter(day => day.content_count > 0).length;
        const averageContent = (timeline.reduce((sum, day) => sum + day.content_count, 0) / timeline.length).toFixed(1);
        const totalContent = timeline.reduce((sum, day) => sum + day.content_count, 0);
        
        return (
            <div className="space-y-4">
                {/* Header with Summary Stats */}
                <div className="md:flex justify-between items-start mb-4">
                    <div>
                        <h4 className="font-medium text-lg mb-2">Last 30 Days Activity</h4>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>📊 You posted content on <strong className="text-green-600">{totalDaysWithContent} of 30 days</strong></span>
                            <span>📈 Average daily content: <strong className="text-blue-600">{averageContent}</strong></span>
                            <span>🎯 Total items created: <strong className="text-purple-600">{totalContent}</strong></span>
                        </div>
                    </div>
                    <div className="mt-6 md:mt-0 flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded mr-1"></div>
                            Content Created
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-gray-200 rounded mr-1"></div>
                            No Activity
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 bg-yellow-400 rounded mr-1 ring-2 ring-yellow-300"></div>
                            Today
                        </div>
                    </div>
                </div>
                
                {/* Activity Chart */}
                <div className="relative">
                    <div className="space-y-2 p-4 bg-gray-50 rounded-[30px]    max-h-96 overflow-y-auto">
                        {timeline.map((day, index) => {
                            const width = maxContent > 0 ? Math.max((day.content_count / maxContent) * 100, 5) : 5;
                            const hasContent = day.content_count > 0;
                            const isToday = day.date === today;
                            const date = new Date(day.date);
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            
                            // Enhanced color coding with gradients
                            let barColor = 'bg-gray-200';
                            if (hasContent) {
                                if (day.content_count === 1) barColor = 'bg-gradient-to-r from-blue-300 to-blue-400';
                                else if (day.content_count <= 3) barColor = 'bg-gradient-to-r from-blue-400 to-blue-500';
                                else barColor = 'bg-gradient-to-r from-blue-500 to-blue-600';
                            }
                            
                            return (
                                <div
                                    key={day.date}
                                    className="group relative flex items-center cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                                >
                                    {/* Date Label */}
                                    <div className="flex items-center space-x-2 w-20 flex-shrink-0">
                                        <div className="text-xs text-gray-600 text-right">
                                            <div className="font-medium">{dayName}</div>
                                            <div className="text-gray-400">{dateStr.replace(', ', '')}</div>
                                        </div>
                                        {isToday && (
                                            <div className="w-2 h-2 bg-yellow-400 rounded-full ring-2 ring-yellow-300"></div>
                                        )}
                                    </div>
                                    
                                    {/* Activity Bar Container */}
                                    <div className="flex-1 relative ml-3">
                                        {/* Weekend background shading */}
                                        {day.is_weekend && (
                                            <div className="absolute inset-0 bg-blue-50 rounded-sm -z-10 opacity-30"></div>
                                        )}
                                        
                                        {/* Activity Bar */}
                                        <div 
                                            className={`h-6 rounded-sm transition-all duration-200 ${
                                                barColor
                                            } ${
                                                isToday ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                                            } ${
                                                day.is_weekend && !hasContent ? 'opacity-40' : ''
                                            } relative`}
                                            style={{ width: width + '%' }}
                                        >
                                            {/* Content count display inside bar for larger values */}
                                            {hasContent && day.content_count > 0 && width > 15 && (
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-black">
                                                    {day.content_count}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Content count display outside bar for smaller values */}
                                        {hasContent && day.content_count > 0 && width <= 15 && (
                                            <span className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 text-xs font-medium text-gray-600">
                                                {day.content_count}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Enhanced Tooltip */}
                                    <div className="absolute left-full ml-4 top-1/2 transform -translate-y-1/2 px-3 py-2 bg-gray-900 text-black text-xs rounded-[30px]    opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                        <div className="font-semibold">{dateStr} ({dayName})</div>
                                        <div className={hasContent ? 'text-green-300' : 'text-gray-400'}>
                                            {hasContent ? `${day.content_count} item${day.content_count !== 1 ? 's' : ''} created` : 'No activity'}
                                        </div>
                                        {isToday && <div className="text-yellow-300 text-xs">Today</div>}
                                        {day.is_weekend && <div className="text-blue-300 text-xs">Weekend</div>}
                                        {/* Tooltip arrow */}
                                        <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Progress indicator */}
                    <div className="mt-3 flex justify-between items-center text-xs text-gray-500 px-4">
                        <span>{timeline[0]?.date && new Date(timeline[0].date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</span>
                        <span>Today ({new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})</span>
                    </div>
                </div>
                
                {/* Activity Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-blue-50 rounded-[30px]  md:rounded-[20px]   p-4">
                        <div className="text-blue-600 text-sm font-medium">Most Active Day</div>
                        <div className="text-blue-900 font-semibold">
                            {(() => {
                                const mostActiveDay = timeline.reduce((prev, current) => 
                                    (prev.content_count > current.content_count) ? prev : current
                                );
                                return mostActiveDay.content_count > 0 
                                    ? `${new Date(mostActiveDay.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} (${mostActiveDay.content_count} items)`
                                    : 'No activity yet';
                            })()
                            }
                        </div>
                    </div>
                    
                    <div className="bg-green-50 rounded-[30px]  md:rounded-[20px]   p-4">
                        <div className="text-green-600 text-sm font-medium">Consistency Score</div>
                        <div className="text-green-900 font-semibold">
                            {Math.round((totalDaysWithContent / 30) * 100)}%
                            <span className="text-xs text-green-600 ml-1">
                                ({totalDaysWithContent}/30 days)
                            </span>
                        </div>
                    </div>
                    
                    <div className="bg-purple-50 rounded-[30px]  md:rounded-[20px]   p-4">
                        <div className="text-purple-600 text-sm font-medium">Content Velocity</div>
                        <div className="text-purple-900 font-semibold">
                            {(() => {
                                const lastWeek = timeline.slice(-7).reduce((sum, day) => sum + day.content_count, 0);
                                const prevWeek = timeline.slice(-14, -7).reduce((sum, day) => sum + day.content_count, 0);
                                const trend = lastWeek - prevWeek;
                                return (
                                    <span className={trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'}>
                                        {trend > 0 ? '↗️' : trend < 0 ? '↘️' : '→'} {lastWeek} this week
                                        {trend !== 0 && <span className="text-xs ml-1">({trend > 0 ? '+' : ''}{trend})</span>}
                                    </span>
                                );
                            })()
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className='bg-[#A2E4B8] !py-8'>
            <GuestLayout>
                <Head title="Creator Activity Status" />
                
                <div className="container !pt-12 mx-auto px-4 py-8 max-w-6xl">
                    <div className="flex justify-between items-start mb-6">
                        <div> 
                            <h1 className="text-black font-gulfs uppercase text-4xl  text-gray-900">Activity Status</h1>
                            <p className="text-gray-900 mt-1">Monitor your content activity and payment eligibility</p>
                        </div>
                    </div>

                    {/* Current Status Card */}
                    <div className="bg-white rounded-[30px]    shadow-lg p-6 mb-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center space-x-3 mb-3">
                                    <h2 className="text-xl font-semibold">Current Status</h2>
                                    {getStatusBadge(activityStatus.status)}
                                </div>
                                
                                {activityStatus.status === 'grace_period' && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-[30px]    p-4">
                                        <p className="text-blue-800">
                                            🎉 Welcome to SpennypPiggy! You're in your <strong>{activityStatus.days_remaining} day grace period</strong>. 
                                            During this time, you can receive payments regardless of your activity level. 
                                            After your grace period ends, you'll need at least 3 approved content items in the last 28 days to continue receiving payments.
                                        </p>
                                    </div>
                                )}

                                {activityStatus.status === 'active' && (
                                    <div className="bg-green-50 border border-green-200 rounded-[20px]   p-4">
                                        <p className="text-green-800">
                                            ✨ Great job! You have <strong>{activityStatus.current_content} approved content items</strong> in the last 28 days. 
                                            Your payments are active and you're meeting all requirements.
                                        </p>
                                    </div>
                                )}

                                
                                {activityStatus.status === 'insufficient_content' && (
                                    <div className="bg-red-50 border border-red-200 rounded-[30px]    p-4">
                                        <p className="text-red-800">
                                            ⚠️ <strong>Payments are currently paused.</strong> You have {activityStatus.current_content || 0} approved content items, 
                                            but need at least 3 in the last 28 days to receive payments.
                                        </p>
                                    </div>
                                )}

                                {activityStatus.status === 'grace_period_ending' && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-[30px]    p-4">
                                        <p className="text-yellow-800">
                                            ⏰ Your grace period ends in <strong>{activityStatus.days_remaining} days</strong>. 
                                            You currently have {activityStatus.current_content || 0} approved content items. 
                                            {(activityStatus.current_content || 0) < 3 ? 
                                                ` You need ${3 - (activityStatus.current_content || 0)} more to maintain payment eligibility.` :
                                                ' You\'re all set to continue receiving payments after your grace period ends!'
                                            }
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content Breakdown */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white rounded-[30px]    shadow p-6">
                            <h3 className="text-lg font-gulfs uppercase mb-4">Content Breakdown (Last 28 Days)</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">📝 Posts</span>
                                    <span className="font-medium">{contentBreakdown.posts}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">🎁 Wish Items</span>
                                    <span className="font-medium">{contentBreakdown.wishes}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">💎 Memberships</span>
                                    <span className="font-medium">{contentBreakdown.memberships}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">🛍️ Shop Items</span>
                                    <span className="font-medium">{contentBreakdown.shops}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">🧾 Bills</span>
                                    <span className="font-medium">{contentBreakdown.bills}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">📋 Tasks</span>
                                    <span className="font-medium">{contentBreakdown.tasks}</span>
                                </div>
                                <hr className='!my-4' />
                                <div className="flex justify-between items-center font-semibold">
                                    <span>Total Active Content</span>
                                    <span className={`${contentBreakdown.total >= 3 ? 'text-green-600' : 'text-red-600'}`}>
                                        {contentBreakdown.total} / 3
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[30px]    shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-gulfs uppercase">Payment Impact</h3>
                                <button 
                                    onClick={() => {
                                        setRefreshing(true);
                                        router.reload({ only: ['blockedPayments'] });
                                        setTimeout(() => setRefreshing(false), 1000);
                                    }}
                                    disabled={refreshing}
                                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-[30px]    transition-colors"
                                >
                                    {refreshing ? '🔄' : '↻'} Refresh
                                </button>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Recent Blocked Payments (30 days)</span>
                                    <span className={`font-medium ${blockedPayments.count > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {blockedPayments.count}
                                    </span>
                                </div>
                                
                                {blockedPayments.last_blocked_at && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Last Blocked Payment</span>
                                            <div className="text-right text-sm">
                                                <div className="font-medium text-red-600">
                                                    {blockedPayments.last_blocked_at_human || new Date(blockedPayments.last_blocked_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(blockedPayments.last_blocked_at).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {blockedPayments.recent_attempts && blockedPayments.recent_attempts.length > 0 && (
                                            <div className="bg-gray-50 rounded-[30px]    p-3">
                                                <div className="text-xs text-gray-600 mb-2">Most Recent Blocked Payment:</div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-700">
                                                        {blockedPayments.recent_attempts[0].payment_type} • {blockedPayments.recent_attempts[0].amount}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {blockedPayments.recent_attempts[0].blocked_at}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Total Blocked Amount</span>
                                    <span className="font-medium text-red-600">
                                        {blockedPayments.currency} {blockedPayments.total_amount_blocked}
                                    </span>
                                </div>
                            </div>
                            
                            {blockedPayments.count > 0 && (
                                <div className="mt-4 p-3 bg-red-50 rounded-[30px]   ">
                                    <p className="text-red-700 text-sm">
                                        💡 <strong>Tip:</strong> Once you add enough content to meet requirements, payments will resume automatically within a few minutes!
                                    </p>
                                    
                                    {blockedPayments.recent_attempts && blockedPayments.recent_attempts.length > 1 && (
                                        <details className="mt-2">
                                            <summary className="text-xs text-red-600 cursor-pointer hover:text-red-700">
                                                View all {blockedPayments.recent_attempts.length} blocked payments ↓
                                            </summary>
                                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                                {blockedPayments.recent_attempts.map((attempt, index) => (
                                                    <div key={attempt.id} className="text-xs text-gray-600 flex justify-between">
                                                        <span>{attempt.payment_type} • {attempt.amount}</span>
                                                        <span>{attempt.blocked_at}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            )}
                            
                            {blockedPayments.count === 0 && (
                                <div className="mt-4 p-3 bg-green-50 rounded-[30px]   ">
                                    <p className="text-green-700 text-sm">
                                        ✅ <strong>Great!</strong> No payments have been blocked in the last 30 days.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Activity Timeline */}
                    <div className="bg-white rounded-[30px]    shadow p-6">
                        <ActivityChart timeline={activityTimeline} />
                        <div className="mt-4 text-sm text-gray-600">
                            <p>Each bar represents content created on that day. Weekend activity is shown with reduced opacity.</p>
                        </div>
                    </div>
                </div>
            </GuestLayout>
        </div>
    );
};

export default ActivityStatus;
