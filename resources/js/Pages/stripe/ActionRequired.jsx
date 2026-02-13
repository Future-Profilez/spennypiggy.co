import { Link } from "@inertiajs/react";
import { useState } from "react";
import { FaExclamationTriangle, FaClock, FaBan, FaInfoCircle } from "react-icons/fa";

export default function ActionRequired({ requirements = [] }) {
    const [loading, setLoading] = useState(false);

    if (!requirements || requirements.length === 0) {
        return null;
    }

    // Get the highest priority requirement
    const prioritizedRequirement = requirements.sort((a, b) => {
        const severityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'warning': 1 };
        return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
    })[0];

    const getSeverityIcon = (severity) => {
        switch (severity) {
            case 'critical':
                return <FaBan className="text-red-600 text-lg" />;
            case 'high':
                return <FaExclamationTriangle className="text-red-500 text-lg" />;
            case 'medium':
                return <FaInfoCircle className="text-yellow-500 text-lg" />;
            case 'warning':
                return <FaClock className="text-blue-500 text-lg" />;
            default:
                return <FaInfoCircle className="text-gray-500 text-lg" />;
        }
    };

    const getSeverityColors = (severity) => {
        switch (severity) {
            case 'critical':
                return {
                    border: 'border-red-500',
                    borderLeft: 'border-l-red-600',
                    bgLight: 'bg-red-50',
                    bgSolid: 'bg-red-600',
                    text: 'text-red-600',
                    textDark: 'text-red-800',
                    icon: 'text-red-600',
                    button: 'bg-red-600 hover:bg-red-700'
                };
            case 'high':
                return {
                    border: 'border-orange-500',
                    borderLeft: 'border-l-orange-500',
                    bgLight: 'bg-orange-50',
                    bgSolid: 'bg-orange-500',
                    text: 'text-orange-600',
                    textDark: 'text-orange-800',
                    icon: 'text-orange-500',
                    button: 'bg-orange-600 hover:bg-orange-700'
                };
            case 'medium':
                return {
                    border: 'border-yellow-500',
                    borderLeft: 'border-l-yellow-500',
                    bgLight: 'bg-yellow-50',
                    bgSolid: 'bg-yellow-500',
                    text: 'text-yellow-600',
                    textDark: 'text-yellow-800',
                    icon: 'text-yellow-600',
                    button: 'bg-yellow-600 hover:bg-yellow-700'
                };
            case 'warning':
                return {
                    border: 'border-blue-500',
                    borderLeft: 'border-l-blue-500',
                    bgLight: 'bg-blue-50',
                    bgSolid: 'bg-blue-500',
                    text: 'text-blue-600',
                    textDark: 'text-blue-800',
                    icon: 'text-blue-600',
                    button: 'bg-blue-600 hover:bg-blue-700'
                };
            default:
                return {
                    border: 'border-gray-500',
                    borderLeft: 'border-l-gray-500',
                    bgLight: 'bg-gray-50',
                    bgSolid: 'bg-gray-500',
                    text: 'text-gray-600',
                    textDark: 'text-gray-800',
                    icon: 'text-gray-600',
                    button: 'bg-gray-800 hover:bg-gray-900'
                };
        }
    };

    return (
        <div className=" ">
            {requirements.map((requirement, index) => {
                const reqColors = getSeverityColors(requirement.severity);
                return (
                    <div 
                        key={index}
                        className={`mb-6 w-full bg-white rounded-[30px] md:rounded-[40px]  shadow-sm border-2 ${reqColors.border} overflow-hidden`}
                    >
                        <div className="flex">
                            {/* Accent Bar */}
                            <div className={`w-[3px] md:w-1.5 ${reqColors.bgSolid}`}></div>
                            
                            <div className="flex-1 p-4 md:p-6 lg:p-8">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${reqColors.bgLight} ${reqColors.icon}`}>
                                            {getSeverityIcon(requirement.severity)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-xl leading-tight">
                                                {requirement.title}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs font-bold uppercase tracking-wider ${reqColors.text}`}>
                                                    Action Required
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Priority Badge */}
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${reqColors.bgLight} ${reqColors.textDark}`}>
                                        {requirement.severity}
                                    </span>
                                </div>

                                {/* Message */}
                                <p className="text-gray-600 mb-6 text-base leading-relaxed">
                                    {requirement.message}
                                </p>

                                {/* Action Box */}
                                <div className="bg-gray-50 rounded-[30px] md:rounded-[40px] p-4 md:p-6 mb-6 border border-gray-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Required Action</span>
                                            <p className="text-sm font-semibold text-gray-800">{requirement.action}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Fields */}
                                    {requirement.fields_needed && requirement.fields_needed.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Missing Information</span>
                                            <div className="flex flex-wrap gap-2">
                                                {requirement.fields_needed.map((field, fieldIndex) => (
                                                    <span key={fieldIndex} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200 shadow-sm">
                                                        {field.replace(/[_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Button */}
                                {requirement.action_url ? (
                                    <a
                                        onClick={() => setLoading(!loading)}
                                        href={requirement.action_url}
                                        className={`block w-full text-center bg-[#F94F96] hover:bg-pink-600 text-white font-gulfs uppercase text-sm sm:text-normal md:text-[17px] py-3 px-6 rounded-full transition-all duration-200 btn-shadow active:transform active:scale-[0.99]`}
                                    >
                                        {loading ? "Processing..." : "Resolve Issue Now"}
                                    </a>
                                ) : (
                                    <div className="w-full text-center bg-gray-100 text-gray-400 font-gulfs uppercase text-sm sm:text-normal md:text-[17px] py-3 px-6 rounded-full cursor-not-allowed">
                                        Please Wait or Contact Support
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
