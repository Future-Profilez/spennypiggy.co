import { useState, useEffect } from "react";
import axios from 'axios';
import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';
import { RiHeartLine, RiGiftLine, RiShoppingBagLine, RiBankCardLine, RiGroupLine, RiStarLine } from 'react-icons/ri';
import { trackSearchClick } from "@/includes/Analytics";

export default function CategoryLeaders() {
    const { formatMultiPrice } = PriceFormat();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('tips');
    const [data, setData] = useState({
        wishes: [],
        subscriptions: [],
        tips: [],
        memberships: [],
        bills: [],
        shop: []
    });

    const fetchCategoryData = () => {
        setLoading(true);
        setError(null);
        axios.get('leaderboard/category-leaders')
            .then((response) => {
                setData(response.data.data);
            })
            .catch((error) => {
                console.error("Error fetching category leaders:", error);
                setError("Failed to load category leaders. Please try again.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCategoryData();
    }, []);

    const categories = [
        { key: 'tips', label: 'Supports', icon: RiStarLine, color: 'text-yellow-600' },
        { key: 'wishes', label: 'Wishes', icon: RiHeartLine, color: 'text-pink-600' },
        // { key: 'subscriptions', label: 'Subscriptions', icon: RiGroupLine, color: 'text-purple-600' },
        { key: 'memberships', label: 'Memberships', icon: RiBankCardLine, color: 'text-blue-600' },
        { key: 'bills', label: 'Bills', icon: RiBankCardLine, color: 'text-green-600' },
        { key: 'shop', label: 'Shop', icon: RiShoppingBagLine, color: 'text-orange-600' }
    ];

    const CategoryItem = ({ creator, rank }) => (
        <div className="animate-fading category-item relative bg-white rounded-[30px]  p-3 mb-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex items-center ">
                    <div className="absolute top-2 left-2 z-10 rank-badge bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                        {rank}
                    </div>
                    <Avatar
                        name={creator.name}
                        src={creator.avatar_url}
                        role={creator.role}
                        profile_status_lock={creator.profile_status_lock}
                        username={creator.username}
                        link={creator.username}
                        size="md"
                        onClick={() => trackSearchClick(creator.id, creator.username)}
                    />
                    {/* <div>
                        <h4 className="font-semibold text-gray-900">{creator.name}</h4>
                        <p className="text-sm text-gray-600">@{creator.username}</p>
                    </div> */}
                </div>
                <div className="text-right px-3">
                    {/* Show engagement metrics if available, otherwise show monetary */}
                    {creator.engagement_score ? (
                        <>
                            <p className="font-bold text-lg">👥 {creator.engagement_score}</p>
                            <p className="text-sm text-gray-600">Engagement score</p>
                        </>
                    ) : (
                        <>
                            <p className="font-bold text-lg">{formatMultiPrice(creator.total_amount, creator.currency || 'USD')}</p>
                            <p className="text-sm text-gray-600">Last 3 months</p>
                            <p className="text-xs text-gray-500">{creator.total_count || creator.supporters_count || 0} {creator.supporters_count ? 'supporters' : 'transactions'}</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    const EmptyState = ({ category }) => (
        <div className="animate-fading text-center py-12">
            <div className="mb-4">
                <RiGiftLine size={48} className="text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {category} Leaders Yet</h3>
            <p className="text-gray-600">Be the first to make it to the {category} leaderboard!</p>
        </div>
    );

    if (loading) {
        return (
            <div className="animate-fading bg-gray-100 rounded-[40px]  p-4 mb-6 flex justify-center items-center min-h-[400px]">
                <svg className="animate-spin h-8 w-8 text-pink-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="animate-fading bg-gray-100 rounded-[40px]  p-4 mb-6 text-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    {error}
                    <button 
                        className="px-2 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50 transition-colors ml-2" 
                        onClick={fetchCategoryData}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const currentCategory = categories.find(cat => cat.key === activeTab);
    const currentData = data[activeTab] || [];

    return (
        <div className="bg-gray-100 rounded-[40px]  p-4 mb-6 mt-6">
            <h2 className="animate-fading font-GillSans text-2xl uppercase text-gray-900 text-left mb-2">🏆 Category Leaders Creators</h2>
            <p className="animate-fading text-gray-500 mb-6 ">Top performers in each category</p>

            {/* Category Tabs */}
            <div className="category-tabs mb-6 mt-2">
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <button
                                key={category.key}
                                onClick={() => setActiveTab(category.key)}
                                className={`animate-fading category-tab flex items-center space-x-2 px-4 py-2 rounded-[40px]   font-medium transition-all ${
                                    activeTab === category.key
                                        ? 'bg-white shadow-md text-gray-900'
                                        : 'text-gray-600 hover:bg-white/50'
                                }`}
                            >
                                <Icon size={16} className={category.color} />
                                <span>{category.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Category Content */}
            <div className="category-content">
                {currentData.length > 0 ? (
                    <>
                        {currentCategory && (
                            <div className="animate-fading flex items-center mb-4">
                                <currentCategory.icon size={24} className={currentCategory.color} />
                                <h3 className=" text-lg font-semibold ml-2">
                                    Top {currentCategory.label} Creators
                                </h3>
                            </div>
                        )}
                        {currentData.map((creator, index) => (
                            <CategoryItem 
                                key={creator.id} 
                                creator={creator} 
                                rank={index + 1}
                            />
                        ))}
                    </>
                ) : (
                    <EmptyState category={currentCategory?.label || 'Category'} />
                )}
            </div>

            {/* Category Stats */}
            {currentData.length > 0 && (''
                // <div className="mt-6 pt-6 border-t border-gray-200">
                //     <div className="grid grid-cols-3 gap-4 text-center">
                //         <div>
                //             <p className="text-2xl font-bold text-gray-900">
                //                 {/* Show engagement total if available, otherwise monetary */}
                //                 {currentData.some(creator => creator.engagement_score) ? (
                //                     currentData.reduce((sum, creator) => sum + (creator.engagement_score || 0), 0)
                //                 ) : (
                //                     formatMultiPrice(
                //                         currentData.reduce((sum, creator) => sum + creator.total_amount, 0),
                //                         'USD'
                //                     )
                //                 )}
                //             </p>
                //             <p className="text-sm text-gray-600">{currentData.some(creator => creator.engagement_score) ? 'Total Engagement' : 'Total Volume'}</p>
                //         </div>
                //         <div>
                //             <p className="text-2xl font-bold text-gray-900">
                //                 {currentData.reduce((sum, creator) => sum + creator.total_count, 0)}
                //             </p>
                //             <p className="text-sm text-gray-600">Total Transactions</p>
                //         </div>
                //         <div>
                //             <p className="text-2xl font-bold text-gray-900">
                //                 {/* Show average engagement if available, otherwise monetary */}
                //                 {currentData.some(creator => creator.engagement_score) ? (
                //                     Math.round( currentData.length > 0  ? currentData.reduce((sum, creator) => sum + (creator.engagement_score || 0), 0) / currentData.length: 0)
                //                 ) : (
                //                     formatMultiPrice(currentData.length > 0  ? currentData.reduce((sum, creator) => sum + creator.total_amount, 0) / currentData.length : 0,'USD'))}
                //             </p>
                //             <p className="text-sm text-gray-600">Average per Creator</p>
                //         </div>
                //     </div>
                // </div>
            )}
        </div>
    );
}
