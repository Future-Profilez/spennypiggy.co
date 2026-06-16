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
    const { auth, leaderboard, userInRace, userProgress, userMissed, founderBonusData, programStats, previousMonthStats, previousMonthWinners, recentWinners } = usePage().props;
    const [allTimeWinners, setAllTimeWinners] = useState([]);
    const [allTimeLoading, setAllTimeLoading] = useState(false);
    
    const qualificationDays = programStats?.qualificationDays || 30;
    const minEarnings = programStats?.minEarnings || 2500;
    const bonusPercentage = programStats?.bonusPercentage || 10;
    const currencySymbol = '£';
    const maxSeats = programStats?.maxSeats || 150;
    const totalFounders = programStats?.totalFounders || 0;
    const availableSeats = programStats?.availableSeats || 150;
    const currentMonth = programStats?.currentMonth || new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    
    const user = auth?.user;
    const { formatMultiPrice } = PriceFormat();

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setAllTimeLoading(true);
            try {
                const res = await fetch('/founder/winners/all-time?limit=10');
                const data = await res.json();
                if (!cancelled) {
                    setAllTimeWinners(data?.winners || []);
                }
            } catch (e) {
                if (!cancelled) setAllTimeWinners([]);
            } finally {
                if (!cancelled) setAllTimeLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const getRankIcon = (position) => {
        if (position === 1) return <FaTrophy className="w-5 h-5 text-yellow-500" />;
        if (position === 2) return <FaMedal className="w-5 h-5 text-gray-400" />;
        if (position === 3) return <FaMedal className="w-5 h-5 text-amber-600" />;
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-gray-600">#{position}</span>;
    };

    return (
        <AuthenticatedLayout
            auth={auth}
            user={auth.user}
        >
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
                        <h1 className="fading text-4xl font-gulfs uppercase text-gray-900 mb-2">
                            Exclusive Founder Bonus
                        </h1>
                        <p className="fading text-xl text-gray-600 max-w-2xl mx-auto">
                            New creators compete to earn £{minEarnings.toLocaleString()} in their first 30 days to join our exclusive Founder Program.
                        </p>
                        <div className='mt-8'>
                            <Link href={'/register'} className="button p text-lg">Become a creator</Link>
                        </div>

                    </div>

                    {/* Founder Congratulations Section */}
                    {auth && auth?.user && auth?.user?.is_founder && founderBonusData && (
                        <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 rounded-[30px]   shadow-[4px_4px_0px_0px_#FF007F]l ring-1 ring-white/20 p-4 md:p-6 mb-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10 animate-pulse"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8 animate-pulse"></div>
                            <div className="relative">
                                <div className="text-center mb-4">
                                    <div className="fading flex justify-center mb-2">
                                        <div className="p-2 bg-white/5 rounded-full">
                                            <FaCrown className="w-6 h-6 text-white" />
                                        </div>
                                    </div>
                                    <h2 className="fading text-xl md:text-2xl font-bold mb-1">🎉 Congratulations, {auth?.user?.name}!</h2>
                                    <p className="fading text-sm md:text-base opacity-90">You're officially a SpennyPiggy Founder!</p>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                                    <div className="fading bg-black/5 rounded-[30px]   p-3 backdrop-blur-sm text-center">
                                        <div className=" flex items-center justify-center mb-1">
                                            <FaCalendarAlt className="w-5 h-5 mr-1" />
                                            <p className="text-lg font-bold opacity-90">Became Founder</p>
                                        </div>
                                        <p className=" text-lg font-bold">
                                            {new Date(founderBonusData.qualification_date).toLocaleDateString('en-GB', { 
                                                day: 'numeric', 
                                                month: 'short', 
                                                year: 'numeric' 
                                            })}
                                        </p>
                                    </div>
                                    
                                    <div className="fading bg-black/5 rounded-[30px]   p-3 backdrop-blur-sm text-center">
                                        <div className="fading flex items-center justify-center mb-1">
                                            <BiDollarCircle className="w-5 h-5 mr-1" />
                                            <p className="text-lg font-bold opacity-90">First 30 Days</p>
                                        </div>
                                        <p className="text-lg font-bold">{formatMultiPrice(founderBonusData.first_30d_earnings, 'GBP')}</p>
                                    </div>
                                    
                                    <div className="fading bg-black/5 rounded-[30px]   p-3 backdrop-blur-sm text-center">
                                        <div className="flex items-center justify-center mb-1">
                                            <FaGift className="w-5 h-5 mr-1" />
                                            <p className="text-lg font-bold opacity-90">Bonus Amount</p>
                                        </div>
                                        <p className="text-lg font-bold">{formatMultiPrice(founderBonusData.bonus_amount, 'GBP')}</p>
                                    </div>
                                    
                                    <div className="fading bg-black/5 rounded-[30px]   p-3 backdrop-blur-sm text-center">
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
                                
                                <div className="fading bg-black/5 rounded-[30px]   p-3 backdrop-blur-sm mb-3">
                                    <h3 className="fading text-xl font-bold mb-2 flex items-center">
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
                                    <div className="text-center bg-black/5 rounded-[30px]   p-3 backdrop-blur-sm">
                                        <p className="fading text-lg font-bold opacity-90">
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
                                    <div className="text-center bg-red-500/20 rounded-[30px]   p-3 backdrop-blur-sm">
                                        <p className="text-xs font-semibold mb-1">❌ Payout Rejected</p>
                                        <p className="text-lg font-bold opacity-90">{founderBonusData.rejection_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )|| ''}

                    {auth && auth?.user && auth?.user?.role == 1 && userInRace && userProgress && (
                        <div className=" pinkbg rounded-[30px]   md:rounded-[30px]   shadow-[4px_4px_0px_0px_#FF007F]xl p-6 md:p-8 mb-12 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                            <div className="relative">
                                <div className="fading md:flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2">🚀 Your Founder Journey</h2>
                                        <p className="text-lg opacity-90">
                            {userProgress?.is_qualified 
                                ? "🎉 Congratulations! You're officially a Founder!" 
                                : userProgress?.current_earnings >= minEarnings
                                ? "🎉 Qualified for Founder Badge!"
                                : `💪 ${formatMultiPrice(minEarnings - userProgress?.current_earnings, 'GBP')} away from Founder Badge!`
                            }
                        </p>
                                    </div>
                                    <div className="mt-3 text-right bg-white/10 rounded-[30px]    p-3 md:p-2 backdrop-blur-sm flex items-center">
                                        <p className="text-lg opacity-90 me-2">⏰ Time Left : </p>
                                        <div className='flex items-center'>
                                            <p className="text-3xl font-bold">
                                                {userProgress?.days_remaining}
                                            </p>
                                            <p className="text-lg opacity-90 ml-1">Days</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                                    <div className="bg-black/5 fading rounded-[30px]    p-4 backdrop-blur-sm">
                                        <div className="flex items-center mb-2">
                                            <BiDollarCircle className="w-6 h-6 mr-2" />
                                            <p className="text-normal opacity-90">Current Earnings</p>
                                        </div>
                                        <p className="text-2xl font-bold">{formatMultiPrice(userProgress?.current_earnings, 'GBP')}</p>
                                        <p className="text-xs opacity-75 mt-1">
                                            {userProgress?.current_earnings > 0 
                                                ? "🔥 Keep the momentum going!" 
                                                : "💡 Start creating to earn your first £!"
                                            }
                                        </p>
                                    </div>
                                    
                                    <div className="bg-black/5 fading rounded-[30px]    p-4 backdrop-blur-sm">
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
                                    
                                    <div className="bg-black/5 fading rounded-[30px]    p-4 backdrop-blur-sm">
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
                                    <div className="mt-6 bg-white/10 rounded-[30px]    p-4 backdrop-blur-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-lg font-bold mb-1">💡 Quick Tips to Boost Your Earnings:</p>
                                                <ul className="text-sm opacity-90 space-y-1">
                                                    <li className='fading'>• Create high-quality content that your audience loves</li>
                                                    <li className='fading'>• Engage with your followers regularly</li>
                                                    <li className='fading'>• Share your profile on social media</li>
                                                    <li className='fading'>• Offer exclusive content and experiences</li>
                                                </ul>
                                            </div>
                                            <div className="text-6xl ">🎯</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) || ''}

                    {auth && auth?.user && auth?.user?.role == 1 && !userInRace && !founderBonusData && userMissed && (
                        <div className="bg-gray-900 rounded-[30px] p-6 md:p-8 mb-12 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                            <div className="relative">
                                <div className="md:flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold mb-2">⏰ This round has ended</h2>
                                        <p className="text-lg opacity-90">
                                            {userMissed.reason === 'seats_full'
                                                ? 'You hit the earnings goal, but all Founder seats were taken this time.'
                                                : 'Your 30-day Founder window has ended and the earnings goal wasn\'t reached this time.'}
                                        </p>
                                    </div>
                                    <div className="mt-3 md:mt-0 text-right bg-white/10 rounded-[30px] p-3 backdrop-blur-sm">
                                        <p className="text-sm opacity-75">Window ended</p>
                                        <p className="text-xl font-bold">{userMissed.window_ended_at}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
                                    <div className="bg-white/10 rounded-[30px] p-4 backdrop-blur-sm">
                                        <p className="text-normal opacity-90 mb-1">Your first 30 days</p>
                                        <p className="text-2xl font-bold">{formatMultiPrice(userMissed.final_earnings, 'GBP')}</p>
                                        <p className="text-xs opacity-75 mt-1">Goal: {formatMultiPrice(userMissed.min_earnings, 'GBP')}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-[30px] p-4 backdrop-blur-sm">
                                        <p className="text-normal opacity-90 mb-2">You reached</p>
                                        <div className="flex items-center">
                                            <div className="flex-1 bg-white/30 rounded-full h-3 mr-3">
                                                <div
                                                    className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full"
                                                    style={{ width: `${Math.min(userMissed.qualification_progress, 100)}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-lg font-bold">{Math.round(userMissed.qualification_progress)}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/10 rounded-[30px] p-4 backdrop-blur-sm">
                                    <p className="text-lg font-bold mb-1">💜 Don't worry — more bonus opportunities are coming!</p>
                                    <p className="text-sm opacity-90">Stay updated and keep building your audience. New bonus programs and rewards launch regularly on SpennyPiggy.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Program Stats */}
                    <div className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                        {/* 5px 5px 0 0 rgba(0,0,0,1) */}
                        <div className="bg-white rounded-[30px]   shadow-[5px_5px_0_0_var(--yellow)] !border-2 border-[var(--yellow)] p-6">
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

                        <div className="bg-white rounded-[30px]   shadow-[5px_5px_0_0_var(--mint)] !border-2 border-[var(--mint)] p-6">
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

                        <div className="bg-white rounded-[30px]   shadow-[5px_5px_0_0_var(--pink)] !border-2 border-[var(--pink)] p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xl font-medium text-gray-600">Qualification Target</p>
                                    <p className="text-2xl font-bold text-gray-900">£{(minEarnings)}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <FaGift className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <p className="text text-gray-500 mt-2">In first 30 days</p>
                        </div>

                        <div className="bg-white rounded-[30px]   shadow-[5px_5px_0_0_var(--black)] !border-2 border-[var(--black)] p-6">
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

                    {(previousMonthStats || (recentWinners && recentWinners.length) || (previousMonthWinners && previousMonthWinners.length)) ? (
                        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">
                                    Previous Month Summary {previousMonthStats?.month ? `(${previousMonthStats.month})` : ''}
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="rounded-[20px] border border-gray-200 p-4">
                                        <div className="text-[11px] font-black uppercase tracking-widest text-gray-500">Qualified</div>
                                        <div className="text-2xl font-bold text-gray-900">{previousMonthStats?.qualified_count || 0}</div>
                                    </div>
                                    <div className="rounded-[20px] border border-gray-200 p-4">
                                        <div className="text-[11px] font-black uppercase tracking-widest text-gray-500">Total Bonus</div>
                                        <div className="text-2xl font-bold text-gray-900">{formatMultiPrice(previousMonthStats?.total_bonus_amount || 0, 'GBP')}</div>
                                    </div>
                                    <div className="rounded-[20px] border border-gray-200 p-4">
                                        <div className="text-[11px] font-black uppercase tracking-widest text-gray-500">Top Earnings</div>
                                        <div className="text-2xl font-bold text-gray-900">{formatMultiPrice(previousMonthStats?.top_earnings || 0, 'GBP')}</div>
                                    </div>
                                </div>

                                {previousMonthStats?.top_creator ? (
                                    <div className="mt-5 rounded-[20px] border border-gray-200 p-4 bg-gray-50">
                                        <div className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Top Winner</div>
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    profile_status_lock={previousMonthStats?.top_creator?.profile_status_lock}
                                                    role={previousMonthStats?.top_creator?.role}
                                                    src={previousMonthStats?.top_creator?.avatar_url || userphoto}
                                                    name={previousMonthStats?.top_creator?.name}
                                                    username={previousMonthStats?.top_creator?.username}
                                                />
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-gray-900">{formatMultiPrice(previousMonthStats?.top_bonus_amount || 0, 'GBP')}</div>
                                                <div className="text-xs text-gray-500">bonus</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {previousMonthWinners && previousMonthWinners.length ? (
                                    <div className="mt-5">
                                        <div className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">
                                            Winners List
                                        </div>
                                        <div className="overflow-auto">
                                            <table className="w-full table-auto border-collapse border border-gray-200 rounded-[20px] overflow-hidden bg-gray-50">
                                                <thead>
                                                    <tr>
                                                        <th className="border px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-600">Creator</th>
                                                        <th className="border px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-600">Earnings</th>
                                                        <th className="border px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-600">Bonus</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {previousMonthWinners.map((w) => (
                                                        <tr key={w.id} className="hover:bg-white">
                                                            <td className="border px-4 py-3">
                                                                {w.creator ? (
                                                                    <Avatar
                                                                        profile_status_lock={w.creator.profile_status_lock}
                                                                        role={w.creator.role}
                                                                        src={w.creator.avatar_url || userphoto}
                                                                        name={w.creator.name}
                                                                        username={w.creator.username}
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-500">—</span>
                                                                )}
                                                            </td>
                                                            <td className="border px-4 py-3 text-right text-sm font-bold text-gray-900">
                                                                {formatMultiPrice(w.first_30d_earnings || 0, 'GBP')}
                                                            </td>
                                                            <td className="border px-4 py-3 text-right text-sm font-bold text-gray-900">
                                                                {formatMultiPrice(w.bonus_amount || 0, 'GBP')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {previousMonthStats?.qualified_count > (previousMonthWinners?.length || 0) ? (
                                            <div className="text-xs text-gray-500 mt-2">
                                                Showing top {previousMonthWinners.length}. Total winners: {previousMonthStats.qualified_count}.
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>

                            <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Winners (Last 7 Days)</h2>
                                {recentWinners && recentWinners.length ? (
                                    <div className="overflow-auto">
                                        <table className="w-full table-auto border-collapse border border-gray-200 rounded-[20px] overflow-hidden bg-gray-50">
                                            <thead>
                                                <tr>
                                                    <th className="border px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-600">Creator</th>
                                                    <th className="border px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-600">Qualified</th>
                                                    <th className="border px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-600">Bonus</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {recentWinners.map((w) => (
                                                    <tr key={w.id} className="hover:bg-white">
                                                        <td className="border px-4 py-3">
                                                            {w.creator ? (
                                                                <Avatar
                                                                    profile_status_lock={w.creator.profile_status_lock}
                                                                    role={w.creator.role}
                                                                    src={w.creator.avatar_url || userphoto}
                                                                    name={w.creator.name}
                                                                    username={w.creator.username}
                                                                />
                                                            ) : (
                                                                <span className="text-gray-500">—</span>
                                                            )}
                                                        </td>
                                                        <td className="border px-4 py-3 text-sm font-bold text-gray-800">
                                                            {w.qualification_date ? new Date(w.qualification_date).toLocaleDateString('en-GB') : '—'}
                                                        </td>
                                                        <td className="border px-4 py-3 text-right text-sm font-bold text-gray-900">
                                                            {formatMultiPrice(w.bonus_amount || 0, 'GBP')}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">No winners qualified in the last 7 days.</div>
                                )}
                            </div>
                        </div>
                    ) : null}

                    <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-6 mb-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">All-time Winners</h2>
                        {allTimeLoading ? (
                            <div className="text-sm text-gray-500">Loading…</div>
                        ) : allTimeWinners && allTimeWinners.length ? (
                            <div className="overflow-auto">
                                <table className="w-full table-auto border-collapse border border-gray-200 rounded-[20px] overflow-hidden bg-gray-50">
                                    <thead>
                                        <tr>
                                            <th className="border px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-gray-600">Creator</th>
                                            <th className="border px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-600">Earnings</th>
                                            <th className="border px-4 py-3 text-right text-xs font-black uppercase tracking-widest text-gray-600">Bonus</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {allTimeWinners.map((w) => (
                                            <tr key={w.id} className="hover:bg-white">
                                                <td className="border px-4 py-3">
                                                    {w.creator ? (
                                                        <Avatar
                                                            profile_status_lock={w.creator.profile_status_lock}
                                                            role={w.creator.role}
                                                            src={w.creator.avatar_url || userphoto}
                                                            name={w.creator.name}
                                                            username={w.creator.username}
                                                        />
                                                    ) : (
                                                        <span className="text-gray-500">—</span>
                                                    )}
                                                </td>
                                                <td className="border px-4 py-3 text-right text-sm font-bold text-gray-900">
                                                    {formatMultiPrice(w.first_30d_earnings || 0, 'GBP')}
                                                </td>
                                                <td className="border px-4 py-3 text-right text-sm font-bold text-gray-900">
                                                    {formatMultiPrice(w.bonus_amount || 0, 'GBP')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">No winners yet.</div>
                        )}
                    </div>
                    

                    <div className="mt-16 mb-8">
                        <div>
                            <h2 className="fading text-xl md:text-3xl font-gulfs uppercase  flex items-center">
                                {new Date().toLocaleDateString('en-GB', { year: 'numeric' })}&nbsp;
                                Leaderboard
                            </h2>
                            <p className="fading text-gray-600 mt-1">
                                Last 60 days participants (in-window and completed)
                            </p>
                        </div>

                        <div className="py-6 overflow-auto">

                            {/* Your Position sticky card */}
                            {userInRace && userProgress && (() => {
                                const pos = leaderboard?.findIndex(e => e?.creator?.id === user?.id);
                                const rank = pos >= 0 ? pos + 1 : null;
                                const pct = Math.round(userProgress.progress_pct ?? userProgress.qualification_progress ?? 0);
                                return (
                                    <div className="sticky top-0 z-10 mb-4 bg-gradient-to-r from-[#8C52FF] to-[#FF007F] text-white rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg">
                                        <div className="flex items-center gap-3">
                                            {rank ? <span className="text-2xl font-black">#{rank}</span> : null}
                                            <div>
                                                <div className="text-sm font-semibold opacity-90">Your Position</div>
                                                <div className="text-xs opacity-75">{userProgress.days_remaining} days remaining</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="text-lg font-bold">{formatMultiPrice(userProgress.current_earnings, 'GBP')}</div>
                                                <div className="text-xs opacity-80">{pct}% of target</div>
                                            </div>
                                            <div className="w-16 h-16 relative">
                                                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
                                                    <circle cx="18" cy="18" r="15.9155" fill="none" stroke="white" strokeWidth="3"
                                                        strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
                                                </svg>
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold rotate-0">{pct}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            <table className='w-full table-auto border-collapse border border-gray-200 shadow-sm rounded-[30px]   overflow-hidden bg-gray-100'>
                                <thead>
                                    <tr>
                                        <th className='border pinkbg text-white !py-[15px] !px-[15px] w-10 text-center'>#</th>
                                        <th className='border pinkbg text-white !py-[15px] !px-[15px]'>Creator</th>
                                        <th className='border pinkbg text-white !py-[15px] !px-[15px]'>Earnings</th>
                                        <th className='border pinkbg text-white !py-[15px] !px-[15px]'>Progress</th>
                                        <th className='border pinkbg text-white !py-[15px] !px-[15px]'>Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {leaderboard && leaderboard.map((entry, index) => {
                                        const rank = entry.rank ?? (index + 1);
                                        const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
                                        const progressPct = Math.min(entry.progress_pct ?? entry.qualification_progress ?? 0, 100);
                                        const isMe = entry?.creator?.id === user?.id;
                                        return (
                                        <tr key={entry?.creator?.id} className={`hover:bg-gray-50 transition-colors ${isMe ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-300' : ''}`}>
                                            <td className="border-r border-gray-200 p-3 text-center font-bold text-lg">
                                                {medals[rank] || <span className="text-gray-400 text-sm">{rank}</span>}
                                            </td>
                                            <td className="border-r border-gray-200 p-3 flex items-center gap-2">
                                                <Avatar profile_status_lock={entry?.creator?.profile_status_lock} role={entry?.creator?.role}
                                                    src={entry?.creator?.avatar_url || userphoto}
                                                    name={entry?.creator?.name}
                                                    username={entry?.creator?.username}
                                                />
                                                {isMe && <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-1.5 py-0.5 rounded">You</span>}
                                            </td>
                                            <td className="border-r border-gray-200 p-3 text-lg font-bold text-gray-900">
                                                {formatMultiPrice(entry.current_earnings, 'GBP')}
                                            </td>
                                            <td className="border-r border-gray-200 p-3 text-sm font-medium text-gray-700">
                                                {entry.days_remaining > 0
                                                    ? `${entry.days_remaining}d remaining`
                                                    : entry.is_qualified
                                                        ? '✅ Qualified'
                                                        : 'Ended'
                                                }
                                            </td>
                                            <td className="border-r border-gray-200 p-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                        <div
                                                            className="h-3 rounded-full transition-all duration-700"
                                                            style={{
                                                                width: `${progressPct}%`,
                                                                background: progressPct >= 100
                                                                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                                                                    : 'linear-gradient(90deg, #8C52FF, #FF007F)',
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-semibold text-gray-600 w-10 shrink-0">{Math.round(progressPct)}%</span>
                                                    {entry.is_qualified && (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600">WINNER</span>
                                                    )}
                                                    {entry.days_remaining <= 0 && !entry.is_qualified && (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">ENDED</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                           
                        </div>
                    </div>

                    <div className="bg-whites rounded-[30px]   mt-16 mb-8">
                        <div className="flex items-center mb-4">
                            <FaInfoCircle className="w-5 h-5 text-blue-500 mr-2" />
                            <h2 className="text-xl font-bold text-gray-900">How the Founder Program Works</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center bg-white fading p-6 rounded-[30px]  ">
                                <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                    <FaCrown className="w-8 h-8 text-yellow-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Qualification</h3>
                                <p className="text-sm text-gray-600">
                                    New creators must earn £{minEarnings.toLocaleString()}+ in their first {qualificationDays} days to qualify for Founder status.
                                </p>
                            </div>
                            <div className="text-center bg-white fading p-6 rounded-[30px]  ">
                                <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                                    <FaGift className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Monthly Bonus</h3>
                                <p className="text-sm text-gray-600">
                                    Qualified Founders earn {bonusPercentage}% extra on monthly earnings between £500-£10,000.
                                </p>
                            </div>
                            <div className="text-center bg-white fading p-6 rounded-[30px]  ">
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

                           {/* {availableSeats} */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500">
                                    Hit £2,500 in your first 30 days and receive a year-long 10% platform-fee bonus (150 seats only; new creators from Nov 1st). We only confirm eligibility on the 1st of each month — so your first bonus pays on the 7th of the next month, no matter when you qualify during the month.
                        </p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
