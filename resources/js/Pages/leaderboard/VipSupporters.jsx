import { useState, useEffect } from "react";
import axios from 'axios';
import { RiVipDiamondLine, RiStarLine, RiHeartLine, RiTrophyLine, RiGiftLine, RiUserStarLine, RiCalendarLine } from 'react-icons/ri';
import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';
import { trackSearchClick } from "@/includes/Analytics";

export default function VipSupporters() {
    const { formatMultiPrice } = PriceFormat();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [vipSupporters, setVipSupporters] = useState([]);

    const fetchVipSupporters = () => {
        setLoading(true);
        setError(null);
        axios.get('leaderboard/vip-supporters')
            .then((response) => {
                setVipSupporters(response.data?.data || []);
            })
            .catch((error) => {
                console.error("Error fetching VIP supporters:", error);
                setError("Failed to load VIP supporters. Please try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchVipSupporters();
    }, []);

    const VipCard = ({ supporter }) => {
        const { vip_level } = supporter;
        const badgeStyle = {
            backgroundColor: vip_level.color,
            background: `linear-gradient(135deg, ${vip_level.color}20, ${vip_level.color}40)`,
            borderColor: vip_level.color,
        };

        return (
            <div className="vip-card bg-white rounded-[35px]  p-4 mb-4 shadow-md hover:shadow-lg transition-all duration-300 border-l-4" 
                 style={{borderLeftColor: vip_level.color}}>
                <div className="flex relative items-center justify-between mb-3">
                    <div className="flex items-center">
                        <div className="absolute top-[-10px] left-[-10px] z-1 rank-badge bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                            {supporter.rank}
                        </div>
                        <Avatar
                            name={supporter.name}
                            src={supporter.avatar_url}
                            role={supporter.role}
                            profile_status_lock={supporter.profile_status_lock}
                            username={supporter.username}
                            link={supporter.username}
                            size="md"
                            onClick={() => trackSearchClick(supporter.id, supporter.username)}
                        />
                        {/* <div className="flex flex-col">
                            <h3 className="font-semibold text-gray-900 text-sm">{supporter.name}</h3>
                            <p className="text-xs text-gray-600">@{supporter.username}</p>
                        </div> */}
                    </div>
                    
                </div>
                <div className="flex justify-between gap-3 text-center">
                    {/* <div className="stat-item">
                        <div className="flex items-center justify-center mb-1">
                            <RiGiftLine size={16} className="text-pink-500 mr-1" />
                            <span className="text-xs text-gray-500">Gifts</span>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{supporter.total_gifts}</p>
                    </div> */}
                    {/* <div className="stat-item">
                        <div className="flex items-center justify-center mb-1">
                            <RiHeartLine size={16} className="text-red-500 mr-1" />
                            <span className="text-xs text-gray-500">Total</span>
                        </div>
                        <p className="font-bold text-gray-900 text-sm">
                            {formatMultiPrice(supporter.total_amount, supporter.currency)}
                        </p>
                    </div> */}
                    <div className="stat-item">
                        <p className="font-bold text-gray-900 text-sm">{supporter.creators_supported_count}</p>
                        <div className="flex items-center justify-center mb-1">
                            <RiUserStarLine size={16} className="text-blue-500 mr-1" />
                            <span className="text-xs text-gray-500">Supportors</span>
                        </div>
                    </div>
                    <div className="stat-item">
                        <p className="font-bold text-gray-900 text-sm">{Math.round(supporter.vip_score)}</p>
                        <div className="flex items-center justify-center mb-1">
                            <RiStarLine size={16} className="text-yellow-500 mr-1" />
                            <span className="text-xs text-gray-500">VIP Score</span>
                        </div>
                    </div>
                </div>
                <div className="vip-badge flex   mt-3 text-center justify-center items-center px-3 py-1 rounded-full text-sm font-semibold" style={badgeStyle}>
                    <span className="mr-1">{vip_level.icon}</span>
                    <span style={{color: vip_level.color}}>{vip_level.level}</span>
                </div>

                {/* <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                        <RiCalendarLine size={14} className="mr-1" />
                        <span>Last support: {supporter.latest_support_date}</span>
                    </div>
                    <div className="flex space-x-1">
                        {supporter.support_types.map((type, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600 capitalize">
                                {type}
                            </span>
                        ))}
                    </div>
                </div> */}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-gray-100 rounded-[30px] md:rounded-[40px]  p-4 mb-6 flex justify-center items-center" style={{minHeight: '200px'}}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading VIP Supporters...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-gray-100 rounded-[30px] md:rounded-[40px]  p-4 mb-6 text-center">
                <div className="alert alert-danger" role="alert">
                    {error}
                    <button 
                        className="button esm border-red-600 text-red-600 ml-2" 
                        onClick={fetchVipSupporters} >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return vipSupporters.length > 0 ? (
        <div className="bg-gray-100 rounded-[30px] md:rounded-[40px]  p-4 mb-6">
            <h2 className="font-GillSans text-2xl uppercase text-dark text-start mb-2">
                💎 VIP Supporters
            </h2>
            <p className="text-gray-600 text-sm mb-4">
                Most active and generous supporters in the last 3 months
            </p>

            <div className="space-y-3">
                <VipCard supporter={vipSupporters[0]} />
                {vipSupporters.slice(0, 5).map((supporter, index) => (
                    <div key={supporter.id} className={`${index === 0 ? 'hidden':""} fading  rank py-3 border-bottom flex items-center justify-between relative`}>
                        <div className="flex items-center space-x-3">
                            <div className="absolute top-2 left-1 z-1 rank-badge bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                                {supporter.rank}
                            </div>
                            <Avatar
                                name={supporter.name}
                                src={supporter.avatar_url}
                                role={supporter.role}
                                profile_status_lock={supporter.profile_status_lock}
                                username={supporter.username}
                                link={supporter.username}
                                size="md"
                                onClick={() => { try { const payload = { creator_id: supporter.id, creator_username: supporter.username }; if (payload.creator_id || payload.creator_username) { axios.post('/analytics/search-click', payload); } } catch(_e) {} }}
                            />
                            {/* <div className="flex flex-col">
                                <h3 className="font-semibold text-gray-900 text-sm">{supporter.name}</h3>
                                <p className="text-xs text-gray-600">@{supporter.username}</p>
                            </div> */}
                        </div>
                        <div className="flexs items-center space-x-2">
                            <div className="text-sm text-center font-bold text-gray-900">{Math.round(supporter.vip_score)}</div>
                            <div className="vip-badge flex items-center px-2 py-1 rounded-full text-xs font-semibold" 
                                 style={{ backgroundColor: supporter.vip_level.color + '20', borderColor: supporter.vip_level.color }}>
                                <span className="mr-1">{supporter.vip_level.icon}</span>
                                <span style={{color: supporter.vip_level.color}}>{supporter.vip_level.level}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* {vipSupporters.length > 5 && (
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-500">+ {vipSupporters.length - 5} more VIP supporters</p>
                </div>
            )} */}
        </div>
    ) : '';
}
