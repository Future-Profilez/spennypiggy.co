import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';
import { Heart, Gift, ShoppingBag, CreditCard, Users, Star } from 'react-feather';

export default function CategoryLeaders() {
    const { formatMultiPrice } = PriceFormat();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('wishes');
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
        { key: 'wishes', label: 'Wishes', icon: Heart, color: 'text-pink-600' },
        { key: 'subscriptions', label: 'Subscriptions', icon: Users, color: 'text-purple-600' },
        { key: 'tips', label: 'Piggy Bank', icon: Star, color: 'text-yellow-600' },
        { key: 'memberships', label: 'Memberships', icon: CreditCard, color: 'text-blue-600' },
        { key: 'bills', label: 'Bills', icon: CreditCard, color: 'text-green-600' },
        { key: 'shop', label: 'Shop', icon: ShoppingBag, color: 'text-orange-600' }
    ];

    const CategoryItem = ({ creator, rank }) => (
        <div className="category-item bg-white rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="rank-badge bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
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
                    />
                    <div>
                        <h4 className="font-semibold text-gray-900">{creator.name}</h4>
                        <p className="text-sm text-gray-600">@{creator.username}</p>
                        <p className="text-xs text-gray-500">{creator.total_count} transactions</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="font-bold text-lg">{formatMultiPrice(creator.total_amount, creator.currency || 'USD')}</p>
                    <p className="text-sm text-gray-600">This month</p>
                </div>
            </div>
        </div>
    );

    const EmptyState = ({ category }) => (
        <div className="text-center py-12">
            <div className="mb-4">
                <Gift size={48} className="text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {category} Leaders Yet</h3>
            <p className="text-gray-600">Be the first to make it to the {category} leaderboard!</p>
        </div>
    );

    if (loading) {
        return (
            <div className="bg-gray-100 rounded-[25px] p-4 mb-6 d-flex justify-content-center align-items-center" style={{minHeight: '400px'}}>
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
        <div className="bg-gray-100 rounded-[25px] p-4 mb-6">
            <h2 className="font-GillSans text-2xl uppercase text-dark text-start mb-4">🏆 Category Leaders</h2>
            <p className="text-gray-500 mb-6">Top performers in each category</p>

            {/* Category Tabs */}
            <div className="category-tabs mb-6">
                <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        return (
                            <button
                                key={category.key}
                                onClick={() => setActiveTab(category.key)}
                                className={`category-tab flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
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
                        <div className="flex items-center mb-4">
                            <currentCategory.icon size={24} className={currentCategory.color} />
                            <h3 className="text-lg font-semibold ml-2">
                                Top {currentCategory.label} Creators
                            </h3>
                        </div>
                        {currentData.map((creator, index) => (
                            <CategoryItem 
                                key={creator.id} 
                                creator={creator} 
                                rank={index + 1}
                            />
                        ))}
                    </>
                ) : (
                    <EmptyState category={currentCategory.label} />
                )}
            </div>

            {/* Category Stats */}
            {currentData.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatMultiPrice(
                                    currentData.reduce((sum, creator) => sum + creator.total_amount, 0),
                                    'USD'
                                )}
                            </p>
                            <p className="text-sm text-gray-600">Total Volume</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {currentData.reduce((sum, creator) => sum + creator.total_count, 0)}
                            </p>
                            <p className="text-sm text-gray-600">Total Transactions</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatMultiPrice(
                                    currentData.length > 0 
                                        ? currentData.reduce((sum, creator) => sum + creator.total_amount, 0) / currentData.length
                                        : 0,
                                    'USD'
                                )}
                            </p>
                            <p className="text-sm text-gray-600">Average per Creator</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
