import React, { useState, useEffect } from 'react';
import { Head, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FounderBadge from '@/Components/FounderBadge';
import { FaCrown, FaCalendarAlt, FaChartLine, FaGift, FaInfoCircle, FaTrophy, FaMedal } from 'react-icons/fa';
import { BiTrendingUp, BiDollarCircle } from 'react-icons/bi';
import PriceFormat from '@/includes/PriceFormat';
import userphoto from '../../../assets/siteicon.png';
import Avatar from '@/includes/Avatar';

export default function FounderBonusIndex() {
    const { auth, leaderboard, userInRace, userProgress, founderBonusData, programStats } = usePage().props;
    
    const qualificationDays = programStats?.qualificationDays || 30;
    const minEarnings = programStats?.minEarnings || 2500;
    const bonusPercentage = programStats?.bonusPercentage || 10;
    const currencySymbol = '£';
    const maxSeats = programStats?.maxSeats || 150;
    const totalFounders = programStats?.totalFounders || 0;
    const availableSeats = programStats?.availableSeats || 150;
    const currentMonth = programStats?.currentMonth || new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    
    const user = auth.user;
    const { formatMultiPrice } = PriceFormat();

    const getRankIcon = (position) => {
        if (position === 1) return <FaTrophy className="w-5 h-5 text-yellow-500" />;
        if (position === 2) return <FaMedal className="w-5 h-5 text-gray-400" />;
        if (position === 3) return <FaMedal className="w-5 h-5 text-amber-600" />;
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">#{position}</span>;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Founder Program - Current Month Race" >
                <meta name="description" content="Compete in our Founder Program to earn a special badge and exclusive rewards. New creators must earn £2,500 in their first 30 days to join." />
            </Head>

            
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 md:py-16 lg:py-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    
                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <div className="flex justify-center mb-4">
                            <FounderBadge size="lg" />
                        </div>
                        <h1 className="text-4xl font-gulfs uppercase text-gray-900 mb-2">
                            Exclusive Founder Bonus
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            New creators compete to earn £{minEarnings.toLocaleString()} in their first 30 days to join our exclusive Founder Program.
                        </p>
                    </div>

                    {/* Founder Congratulations Section */}
                    {auth && auth?.user && auth?.user?.is_founder && founderBonusData && (
                        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-[25px] shadow-xl ring-1 ring-white/20 p-4 md:p-6 mb-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 animate-pulse"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8 animate-pulse"></div>
                            <div className="relative">
                                <div className="text-center mb-4">
                                    <div className="flex justify-center mb-2">
                                        <div className="p-2 bg-white/5 rounded-full">
                                            <FaCrown className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-bold mb-1">🎉 Congratulations, {auth.user.name}!</h2>
                                    <p className="text-sm md:text-base opacity-90">You're officially a SpennyPiggy Founder!</p>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-black/5 rounded-xl p-3 backdrop-blur-sm text-center">
                                        <div className="flex items-center justify-center mb-1">
                                            <FaCalendarAlt className="w-5 h-5 mr-1" />
                                            <p className="text-lg font-bold opacity-90">Became Founder</p>
                                        </div>
                                        <p className="text-lg font-bold">
                                            {new Date(founderBonusData.qualification_date).toLocaleDateString('en-GB', { 
                                                day: 'numeric', 
                                                month: 'short', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-black/5 rounded-xl p-3 backdrop-blur-sm text-center">
                                        <div className="flex items-center justify-center mb-1">
                                            <BiDollarCircle className="w-5 h-5 mr-1" />
                                            <p className="text-lg font-bold opacity-90">First 30 Days</p>
                                        </div>
                                        <p className="text-lg font-bold">{formatMultiPrice(founderBonusData.first_30d_earnings)}</p>
                                    </div>
                                    
                                    <div className="bg-black/5 rounded-xl p-3 backdrop-blur-sm text-center">
                                        <div className="flex items-center justify-center mb-1">
                                            <FaGift className="w-5 h-5 mr-1" />
                                            <p className="text-lg font-bold opacity-90">Bonus Amount</p>
                                        </div>
                                        <p className="text-lg font-bold">{formatMultiPrice(founderBonusData.bonus_amount)}</p>
                                    </div>
                                    
                                    <div className="bg-black/5 rounded-xl p-3 backdrop-blur-sm text-center">
                                        <div className="flex items-center justify-center mb-1">
                                            <FaTrophy className="w-5 h-5 mr-1" />
                                            <p className="text-lg font-bold opacity-90">Status</p>
                                        </div>
                                        <p className="text-xs font-bold">
                                            {founderBonusData.payout_status === 'paid' ? '✅ Paid' : 
                                             founderBonusData.payout_status === 'pending' ? '⏳ Pending' : 
                                             founderBonusData.payout_status === 'rejected' ? '❌ Rejected' : 
                                             '📋 Processing'}
                                        </p>
                                        {founderBonusData.payout_status === 'paid' && founderBonusData.formatted_paid_date && (
                                            <p className="text-normal opacity-75 mt-1">
                                                Paid: {founderBonusData.formatted_paid_date}
                                            </p>
                                        )}
                                        {founderBonusData.payout_status === 'pending' && founderBonusData.estimated_payout_date && (
                                            <p className="text-xs opacity-75 mt-1">
                                                Expected: {new Date(founderBonusData.estimated_payout_date).toLocaleDateString('en-GB')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="bg-black/5 rounded-xl p-3 backdrop-blur-sm mb-3">
                                    <h3 className="text-xl font-bold mb-2 flex items-center">
                                        <FaCrown className="w-5 h-5 mr-1" />
                                        Your Founder Benefits
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-normal">
                                        <div className="flex items-center">
                                            <span className="w-4 h-4 bg-white/5 rounded-full flex items-center justify-center mr-2 text-xs">💰</span>
                                            <span>10% monthly bonus on earnings</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-4 h-4 bg-white/5 rounded-full flex items-center justify-center mr-2 text-xs">👑</span>
                                            <span>Exclusive Founder badge</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-4 h-4 bg-white/5 rounded-full flex items-center justify-center mr-2 text-xs">🎯</span>
                                            <span>Priority customer support</span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="w-4 h-4 bg-white/5 rounded-full flex items-center justify-center mr-2 text-xs">📊</span>
                                            <span>Advanced analytics</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {founderBonusData.payout_status === 'pending' && (
                                    <div className="text-center bg-black/5 rounded-xl p-3 backdrop-blur-sm">
                                        <p className="text-lg font-bold opacity-90">
                                            💡 Your bonus will be processed on {' '}
                                            {founderBonusData.estimated_payout_date ? 
                                                new Date(founderBonusData.estimated_payout_date).toLocaleDateString('en-GB', { 
                                                    day: 'numeric', 
                                                    month: 'long', 
                                                    year: 'numeric' 
                                                }) : 
                                                'the 7th of next month'
                                            }
                                        </p>
                                    </div>
                                )}
                                
                                {founderBonusData.payout_status === 'rejected' && founderBonusData.rejection_reason && (
                                    <div className="text-center bg-red-500/20 rounded-xl p-3 backdrop-blur-sm">
                                        <p className="text-xs font-semibold mb-1">❌ Payout Rejected</p>
                                        <p className="text-lg font-bold opacity-90">{founderBonusData.rejection_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )|| ''}

                    {auth && auth?.user && auth?.user?.role == 1 && userInRace && userProgress && (
                        <div className=" pinkbg rounded-[25px] md:rounded-[30px] shadow-2xl p-6 md:p-8 mb-12 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                            <div className="relative">
                                <div className="md:flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2">🚀 Your Founder Journey</h2>
                                        <p className="text-lg opacity-90">
                            {userProgress?.is_qualified 
                                ? "🎉 Congratulations! You're officially a Founder!" 
                                : userProgress?.current_earnings >= minEarnings
                                ? "🎉 Qualified for Founder Badge!"
                                : `💪 ${formatMultiPrice(minEarnings - userProgress?.current_earnings)} away from Founder Badge!`
                            }
                        </p>
                                    </div>
                                    <div className="mt-3 text-right bg-white/10 rounded-2xl p-3 md:p-2 backdrop-blur-sm flex items-center">
                                        <p className="text-lg opacity-90 me-2">⏰ Time Left : </p>
                                        <div className='flex items-center'>
                                            <p className="text-3xl font-bold">
                                                {userProgress?.days_remaining}
                                            </p>
                                            <p className="text-lg opacity-90 ms-1">Days</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    <div className="bg-black/5 rounded-2xl p-4 backdrop-blur-sm">
                                        <div className="flex items-center mb-2">
                                            <BiDollarCircle className="w-6 h-6 mr-2" />
                                            <p className="text-normal opacity-90">Current Earnings</p>
                                        </div>
                                        <p className="text-2xl font-bold">{formatMultiPrice(userProgress?.current_earnings)}</p>
                                        <p className="text-xs opacity-75 mt-1">
                                            {userProgress?.current_earnings > 0 
                                                ? "🔥 Keep the momentum going!" 
                                                : "💡 Start creating to earn your first £!"
                                            }
                                        </p>
                                    </div>
                                    
                                    <div className="bg-black/5 rounded-2xl p-4 backdrop-blur-sm">
                                        <div className="flex items-center mb-2">
                                            <FaChartLine className="w-6 h-6 mr-2" />
                                            <p className="text-normal opacity-90">Progress to Goal</p>
                                        </div>
                                        <div className="flex items-center mb-2">
                                            <div className="flex-1 bg-white/30 rounded-full h-3 mr-3">
                                                <div 
                                                    className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full transition-all duration-500 shadow-lg"
                                                    style={{ width: `${Math.min(userProgress?.qualification_progress, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-lg font-bold">{Math.round(userProgress?.qualification_progress)}%</span>
                                        </div>
                                        <p className="text-xs opacity-75">
                                            {userProgress?.qualification_progress >= 75 
                                                ? "🎯 Almost there! Final push!" 
                                                : userProgress?.qualification_progress >= 50 
                                                ? "⚡ Halfway there! You're doing great!" 
                                                : userProgress?.qualification_progress >= 25 
                                                ? "🌟 Great start! Keep building!" 
                                                : "🚀 Your journey begins now!"
                                            }
                                        </p>
                                    </div>
                                    
                                    <div className="bg-black/5 rounded-2xl p-4 backdrop-blur-sm">
                                        <div className="flex items-center mb-2">
                                            <FaCrown className="w-6 h-6 mr-2" />
                                            <p className="text-normal opacity-90">Status</p>
                                        </div>
                                        <p className="text-xl font-bold mb-1">
                                            {userProgress?.is_qualified ? '🎉 Founder Qualified!' : '🏃‍♂️ Racing to Qualify'}
                                        </p>
                                        <p className="text-xs opacity-75">
                                            {userProgress?.is_qualified 
                                                ? "🏆 Enjoy your exclusive benefits!" 
                                                : "💎 Exclusive rewards await you!"
                                            }
                                        </p>
                                    </div>
                                </div>
                                
                                {!userProgress?.is_qualified && (
                                    <div className="mt-6 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-lg font-bold mb-1">💡 Quick Tips to Boost Your Earnings:</p>
                                                <ul className="text-sm opacity-90 space-y-1">
                                                    <li>• Create high-quality content that your audience loves</li>
                                                    <li>• Engage with your followers regularly</li>
                                                    <li>• Share your profile on social media</li>
                                                    <li>• Offer exclusive content and experiences</li>
                                                </ul>
                                            </div>
                                            <div className="text-6xl ">🎯</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) || ''}

                    {/* Program Stats */}
                    <div className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                        {/* 5px 5px 0 0 rgba(0,0,0,1) */}
                        <div className="bg-white rounded-[25px] shadow-[5px_5px_0_0_var(--yellow)] !border-2 border-[var(--yellow)] p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-medium text-gray-600">Total Creators Racing</p>
                                    <p className="text-2xl font-bold text-gray-900">{leaderboard?.length || 0}</p>
                                </div>
                                <div className="p-3 bg-yellow-100 rounded-full">
                                    <BiTrendingUp className="w-6 h-6 text-yellow-600" />
                                </div>
                            </div>
                            <p className="text-normal text-gray-500 mt-2">Joined this month</p>
                        </div>

                        <div className="bg-white rounded-[25px] shadow-[5px_5px_0_0_var(--mint)] !border-2 border-[var(--mint)] p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-medium text-gray-600">Available Seats</p>
                                    <p className="text-2xl font-bold text-gray-900">{availableSeats}</p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <FaCrown className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                            <p className="text text-gray-500 mt-2">Out of {maxSeats} total</p>
                        </div>

                        <div className="bg-white rounded-[25px] shadow-[5px_5px_0_0_var(--pink)] !border-2 border-[var(--pink)] p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-medium text-gray-600">Qualification Target</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatMultiPrice(minEarnings)}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <FaGift className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <p className="text text-gray-500 mt-2">In first 30 days</p>
                        </div>

                        <div className="bg-white rounded-[25px] shadow-[5px_5px_0_0_var(--black)] !border-2 border-[var(--black)] p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-medium text-gray-600">Bonus Rate</p>
                                    <p className="text-2xl font-bold text-gray-900">{bonusPercentage}%</p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <BiDollarCircle className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                            <p className="text text-gray-500 mt-2">Monthly earnings bonus</p>
                        </div>
                    </div>
                    

                    <div className="mt-16 mb-8">
                        <div>
                            <h2 className="text-xl md:text-3xl font-gulfs uppercase font-bold flex items-center">
                                {currentMonth} Leaderboard
                            </h2>
                            <p className="text-gray-600 mt-1">
                                New creators racing for Founder status
                            </p>
                        </div>

                        <div className="py-6 overflow-auto">

                            <table className='w-full table-auto border-collapse border border-gray-200 shadow-sm rounded-[20px] overflow-hidden bg-gray-100'>
                                <thead>
                                    <tr>
                                        <th className='border pinkbg text-white !py-[15px] !px-[15px]'>Creator</th>
                                        <th className='border pinkbg text-white !py-[15px] !px-[15px]'>Earnings</th>
                                        <th className='border pinkbg text-white !py-[15px] !px-[15px]'>Progress</th>
                                        <th className='border pinkbg text-white !py-[15px] !px-[15px]'>Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {leaderboard && leaderboard.map((entry, index) => (
                                        <tr key={entry?.creator?.id} className={`hover:bg-gray-50 transition-colors ${entry?.creator?.id === user?.id ? 'bg-indigo-100' : ''}`}>
                                            <td className="border-r border-gray-200 p-3 flex items-center">
                                                {/* {getRankIcon(index + 1)} */}
                                                <Avatar profile_status_lock={entry?.creator?.profile_status_lock} role={entry?.creator?.role}
                                                    src={entry?.creator?.avatar_url || userphoto}
                                                    name={entry?.creator?.name}
                                                    username={entry?.creator?.username}
                                                />
                                            </td>
                                            <td className="border-r border-gray-200 p-3 text-lg font-bold text-gray-900"> 
                                                {formatMultiPrice(entry.current_earnings)}
                                            </td>
                                            <td className="border-r border-gray-200 p-3 text-lg font-bold text-gray-900"> 
                                                {entry.days_remaining > 0 
                                                    ? `${entry.days_remaining} days remaining`
                                                    : 'Challenge period complete'
                                                }
                                            </td>
                                            <td className="border-r border-gray-200 p-3"> 
                                                <div className="flex items-center">
                                                    <div className="w-32 bg-gray-200 rounded-full h-3 mr-3">
                                                        <div
                                                            className="bg-indigo-500 h-3 rounded-full"
                                                            style={{ width: `${Math.min(entry.progress ?? entry.qualification_progress ?? 0, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-500">{Math.round(entry.progress ?? entry.qualification_progress ?? 0)}%</span>
                                                </div>
                                            </td>
                                            {/* <td className="py-4 px-6">
                                                {entry.is_qualified && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <FaCrown className="w-5 h-5 mr-1" />
                                                        Qualified
                                                    </span>
                                                )}
                                            </td> */}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                           
                        </div>
                    </div>

                    <div className="bg-whites rounded-[30px] mt-16 mb-8">
                        <div className="flex items-center mb-4">
                            <FaInfoCircle className="w-5 h-5 text-blue-500 mr-2" />
                            <h2 className="text-xl font-bold text-gray-900">How the Founder Program Works</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center bg-white p-6 rounded-[20px]">
                                <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                    <FaCrown className="w-8 h-8 text-yellow-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Qualification</h3>
                                <p className="text-sm text-gray-600">
                                    New creators must earn £{minEarnings.toLocaleString()}+ in their first {qualificationDays} days to qualify for Founder status.
                                </p>
                            </div>
                            <div className="text-center bg-white p-6 rounded-[20px]">
                                <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                    <FaGift className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Monthly Bonus</h3>
                                <p className="text-sm text-gray-600">
                                    Qualified Founders earn {bonusPercentage}% extra on monthly earnings between £500-£10,000.
                                </p>
                            </div>
                            <div className="text-center bg-white p-6 rounded-[20px]">
                                <div className="p-4 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                    <FaChartLine className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Exclusive Benefits</h3>
                                <p className="text-sm text-gray-600">
                                    Priority support, founder badge, and advanced analytics for life.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                            Only {availableSeats} founder seats available. Qualification checked on the 1st of each month.
                            Bonuses paid on the 7th. Only new creators who joined this month can participate in the race.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}