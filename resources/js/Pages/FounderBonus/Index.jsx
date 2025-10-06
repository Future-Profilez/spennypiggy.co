import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import FounderBadge from '@/Components/FounderBadge';
import { FaCrown, FaCalendarAlt, FaChartLine, FaGift, FaInfoCircle, FaTrophy, FaMedal } from 'react-icons/fa';
import { BiTrendingUp, BiDollarCircle } from 'react-icons/bi';
import PriceFormat from '@/includes/PriceFormat';

export default function FounderBonusIndex() {
    const { auth, leaderboard, userInRace, userProgress, programStats } = usePage().props;
    
    // Extract configurable values from programStats
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

                    {/* Program Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

                    {/* User Progress (if in race) */}
                    {userInRace && userProgress && (
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 mb-8 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold">Your Progress</h2>
                                <div className="text-right">
                                    <p className="text-sm opacity-90">Days Remaining</p>
                                    <p className="text-2xl font-bold">{userProgress.days_remaining}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm opacity-90">Current Earnings</p>
                                    <p className="text-xl font-bold">{formatMultiPrice(userProgress.current_earnings)}</p>
                                </div>
                                <div>
                                    <p className="text-sm opacity-90">Progress to Goal</p>
                                    <div className="flex items-center">
                                        <div className="flex-1 bg-white/20 rounded-full h-2 mr-2">
                                            <div 
                                                className="bg-white h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${Math.min(userProgress.qualification_progress, 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-sm font-medium">{Math.round(userProgress.qualification_progress)}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm opacity-90">Status</p>
                                    <p className="text-lg font-bold">
                                        {userProgress.is_qualified ? '🎉 Qualified!' : '🏃‍♂️ Racing'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white mt-4 rounded-[25px] shadow-sm overflow-hidden mb-8">
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center">
                                        {currentMonth} Leaderboard
                                    </h2>
                                    <p className="text-purple-100 mt-1">
                                        New creators racing for Founder status
                                    </p>
                                </div>
                                {/* <div className="text-right">
                                    <p className="text-normal flex items-center text-purple-100">
                                        <BiTrendingUp className="w-8 h-8 mx-auto me-2" />
                                        First 30 days progress
                                    </p>
                                </div> */}
                            </div>
                        </div>

                        <div className="p-6">
                            {leaderboard && leaderboard.length > 0 ? (
                                <div className="space-y-4">
                                    {leaderboard.map((entry, index) => (
                                        <div 
                                            key={entry.creator.id}
                                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                                                entry.is_qualified 
                                                    ? 'border-green-200 bg-green-50' 
                                                    : 'border-gray-200 bg-gray-50'
                                            } ${entry.creator.id === user.id ? 'ring-2 ring-blue-500' : ''}`}
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center justify-center w-10 h-10">
                                                    {getRankIcon(index + 1)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {entry.creator.name}
                                                        {entry.creator.id === user.id && (
                                                            <span className="ml-2 text-sm text-blue-600 font-medium">(You)</span>
                                                        )}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {entry.days_remaining > 0 
                                                            ? `${entry.days_remaining} days remaining`
                                                            : 'Challenge period complete'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">
                                                    {formatMultiPrice(entry.current_earnings)}
                                                </p>
                                                <div className="flex items-center justify-end mt-1">
                                                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                                        <div 
                                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                                entry.is_qualified ? 'bg-green-500' : 'bg-blue-500'
                                                            }`}
                                                            style={{ width: `${Math.min(entry.qualification_progress, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-gray-600">
                                                        {Math.round(entry.qualification_progress)}%
                                                    </span>
                                                </div>
                                                {entry.is_qualified && (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                                                        <FaCrown className="w-3 h-3 mr-1" />
                                                        Qualified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FaCalendarAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-xl font-medium text-gray-900 mb-2">No Racers Yet</h3>
                                    <p className="text-gray-600">
                                        Be the first new creator to join this month and start racing for Founder status!
                                    </p>
                                </div>
                            )}
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
                            Only {maxSeats} founder seats available. Qualification checked on the 1st of each month.
                            Bonuses paid on the 7th. Only new creators who joined this month can participate in the race.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}