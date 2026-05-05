
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BiError, BiAlarmExclamation, BiInfoCircle, BiShieldQuarter, BiChevronRight } from "react-icons/bi";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { Link } from '@inertiajs/react';
import Modal from '../Modal';

export default function CreatorRiskBanner() {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);

    useEffect(() => {
        // Fetch Risk Status from API
        axios.get('/api/creator/risk-status')
            .then(response => {
                setBanners(response.data.banners || []);
                setLoading(false);
            })
            .catch(error => {
                console.error("CreatorRiskBanner: Failed to fetch risk status", error);
                setLoading(false);
            });
    }, []);

    const handleOpenModal = (banner) => {
        setSelectedBanner(banner);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedBanner(null);
    };

    if (loading || banners.length === 0) return null;

    const activeBanners = banners.filter(b => !dismissed.includes(b.key));
    if (activeBanners.length === 0) return null;

    return (
        <>
            <div className="space-y-4 mb-8  animate-fade-in-up">
                {activeBanners.map((banner, index) => (
                    <div 
                        key={index} 
                        className={`relative overflow-hidden rounded-[30px] border backdrop-blur-md transition-all duration-300 shadow-sm hover:shadow-md ${getBannerStyle(banner.type)}`} >
                        <div className="flex flex-col md:flex-row items-start md:items-center p-4 relative z-10 gap-4">
                            <div className={`flex-shrink-0 p-6 !rounded-[25px] ${getIconBg(banner.type)}`}>
                                {getIcon(banner.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-normal md:text-xl tracking-tight mb-1 ${getTitleColor(banner.type)}`}>
                                    {banner.title}
                                </h3>
                                <p className="text-sm md:text-base opacity-90 font-medium leading-relaxed">
                                    {banner.body}
                                </p>
                            </div>
                            <div className="flex flex-shrink-0 w-full md:w-auto gap-3 mt-2 md:mt-0">
                                <button 
                                    onClick={() => handleOpenModal(banner)}
                                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-lg transition-all whitespace-nowrap ${getButtonStyles(banner.type)}`}
                                >
                                    {banner.action_label || 'View Details'} <BiChevronRight size={16} />
                                </button>
                                {banner.type === 'action_required' && !banner.action_url && (
                                    <button className="flex-1 md:flex-none text-xs font-bold uppercase tracking-wider py-2.5 px-5 rounded-lg bg-white/60 hover:bg-white/90 transition-all text-gray-900 border border-white/20">
                                        Support
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className={`absolute inset-0 opacity-30 pointer-events-none bg-gradient-to-r ${getGradientOverlay(banner.type)}`}></div>
                    </div>
                ))}
            </div>

            <Modal show={showModal} onClose={handleCloseModal} maxWidth="lg">
                {selectedBanner && (
                    <div className="p-6 md:p-8">
                        <div className="flex items-center gap-4 mb-6">
                             <div className={`p-4 rounded-full ${getIconBg(selectedBanner.type)}`}>
                                {getIcon(selectedBanner.type)}
                             </div>
                             <h3 className={`text-xl md:text-2xl font-bold ${getTitleColor(selectedBanner.type)}`}>
                                {selectedBanner.title}
                             </h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-5 rounded-[30px] border border-gray-100">
                                <h4 className="text-sm uppercase tracking-wide text-gray-500 font-bold mb-2 flex items-center gap-2">
                                    <BiInfoCircle /> What Happened
                                </h4>
                                <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                                    {selectedBanner.what_happened || selectedBanner.body}
                                </p>
                            </div>
                            
                            <div className="bg-blue-50/50 p-5 rounded-[30px] border border-blue-100">
                                <h4 className="text-sm uppercase tracking-wide text-blue-600 font-bold mb-2 flex items-center gap-2">
                                    <BiShieldQuarter /> What To Do
                                </h4>
                                <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                                    {selectedBanner.what_to_do || "Please check your dashboard for more details."}
                                </p>
                            </div>
                        </div>

                        <div className="mt-8 flex flex-col-reverse md:flex-row justify-end gap-3">
                            <button 
                                onClick={handleCloseModal}
                                className="px-6 py-3 rounded-[20px] border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold transition-colors w-full md:w-auto"
                            >
                                Close
                            </button>
                            {selectedBanner.action_url && (
                                <Link  
                                href={selectedBanner.action_url} 
                                method={selectedBanner.action_method || 'get'} 
                                as={selectedBanner.action_method === 'post' ? 'button' : 'a'} 
                                type={selectedBanner.action_method === 'post' ? 'button' : undefined} 
                                className={`px-6 py-3 rounded-[20px] text-white font-bold shadow-lg transition-transform 
                                transform active:scale-95 w-full md:w-auto text-center flex items-center justify-center 
                                gap-2 ${getButtonStyles(selectedBanner.type).split(' ').filter(c => c.startsWith('bg-') 
                                || c.startsWith('hover:')).join(' ')}`} > 
                                    {selectedBanner.action_label || 'Proceed'} 
                                    <BiChevronRight size={18} />
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
}

function getBannerStyle(type) {
    switch (type) {
        case 'critical':
            return 'bg-red-50/90 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-100';
        case 'warning':
            return 'bg-amber-50/90 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100';
        case 'action_required':
            return 'bg-orange-50/90 border-orange-200 text-orange-900 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-100';
        case 'info':
        default:
            return 'bg-blue-50/90 border-blue-200 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-100';
    }
}

function getTitleColor(type) {
    switch (type) {
        case 'critical': return 'text-red-800 dark:text-red-200';
        case 'warning': return 'text-amber-800 dark:text-amber-200';
        case 'action_required': return 'text-orange-800 dark:text-orange-200';
        case 'info': default: return 'text-blue-800 dark:text-blue-200';
    }
}

function getIconBg(type) {
    switch (type) {
        case 'critical': return 'bg-white text-red-600 dark:bg-red-900 dark:text-red-200 shadow-sm';
        case 'warning': return 'bg-white text-amber-600 dark:bg-amber-900 dark:text-amber-200 shadow-sm';
        case 'action_required': return 'bg-white text-orange-600 dark:bg-orange-900 dark:text-orange-200 shadow-sm';
        case 'info': default: return 'bg-white text-blue-600 dark:bg-blue-900 dark:text-blue-200 shadow-sm';
    }
}

function getGradientOverlay(type) {
    switch (type) {
        case 'critical': return 'from-red-100/50 to-transparent dark:from-red-900/20';
        case 'warning': return 'from-amber-100/50 to-transparent dark:from-amber-900/20';
        case 'action_required': return 'from-orange-100/50 to-transparent dark:from-orange-900/20';
        case 'info': default: return 'from-blue-100/50 to-transparent dark:from-blue-900/20';
    }
}

function getButtonStyles(type) {
    switch (type) {
        case 'critical': return 'bg-red-600 text-white hover:bg-red-700 shadow-red-200/50 shadow-lg dark:shadow-none';
        case 'warning': return 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200/50 shadow-lg dark:shadow-none';
        case 'action_required': return 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-200/50 shadow-lg dark:shadow-none';
        case 'info': default: return 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200/50 shadow-lg dark:shadow-none';
    }
}

function getIcon(type) {
    const size = 35;
    switch (type) {
        case 'critical':
            return <BiError size={size} />;
        case 'warning':
            return <BiAlarmExclamation size={size} />;
        case 'action_required':
            return <HiOutlineExclamationCircle size={size} />;
        case 'info':
        default:
            return <BiShieldQuarter size={size} />;
    }
}
