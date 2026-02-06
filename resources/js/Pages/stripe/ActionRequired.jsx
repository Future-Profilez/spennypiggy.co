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
                    bg: 'bg-red-50',
                    text: 'text-red-800',
                    button: 'bg-red-600 hover:bg-red-700'
                };
            case 'high':
                return {
                    border: 'border-red-400',
                    bg: 'bg-red-50',
                    text: 'text-red-700',
                    button: 'bg-red-500 hover:bg-red-600'
                };
            case 'medium':
                return {
                    border: 'border-yellow-400',
                    bg: 'bg-yellow-50',
                    text: 'text-yellow-800',
                    button: 'bg-yellow-600 hover:bg-yellow-700'
                };
            case 'warning':
                return {
                    border: 'border-blue-400',
                    bg: 'bg-blue-50',
                    text: 'text-blue-800',
                    button: 'bg-blue-600 hover:bg-blue-700'
                };
            default:
                return {
                    border: 'border-gray-400',
                    bg: 'bg-gray-50',
                    text: 'text-gray-800',
                    button: 'bg-gray-600 hover:bg-gray-700'
                };
        }
    };

    const colors = getSeverityColors(prioritizedRequirement.severity);

    return (
        <>
            {requirements.map((requirement, index) => {
                const reqColors = getSeverityColors(requirement.severity);
                return (
                    <div 
                        key={index}
                        className={`w-full overflow-hidden mb-4 rounded-xl  bg-white border-2 ${reqColors.border} shadow-lg`}
                    >
                        <div className={`border-bottom ${reqColors.border} ${reqColors.bg}`}>
                            <div className="p-3 flex items-center">
                                {getSeverityIcon(requirement.severity)}
                                <h2 className={`text-large font-GillSans text-uppercase ${reqColors.text} ml-2 goaltitle`}>
                                    Action Required
                                </h2>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className={`text-xl md:text-xl mb-2 font-gulfs uppercase ${reqColors.text}`}>
                                {requirement.title}
                            </h3>
                            <p className={`mb-3 text-md ${reqColors.text.replace('800', '600')}`}>
                                {requirement.message}
                            </p>
                            <p className={`mb-4 text-sm ${reqColors.text.replace('800', '500')}`}>
                                <strong>Required Action:</strong> {requirement.action}
                            </p>
                            
                            {/* Show required fields if available */}
                            {requirement.fields_needed && requirement.fields_needed.length > 0 && (
                                <div className={`mb-4 p-3 ${reqColors.bg} border ${reqColors.border} rounded-xl `}>
                                    <p className={`text-sm font-medium ${reqColors.text} mb-2`}>
                                        Required Information:
                                    </p>
                                    <ul className={`text-sm ${reqColors.text.replace('800', '600')} space-y-1`}>
                                        {requirement.fields_needed.map((field, fieldIndex) => (
                                            <li key={fieldIndex} className="flex items-center">
                                                <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
                                                {field.replace(/[_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {requirement.action_url ? (
                                <Link
                                    onClick={() => setLoading(!loading)}
                                    href={requirement.action_url}
                                    className={`btn-pink text-sm btn-shadow w-full block text-center ${reqColors.button} text-white font-medium px-4 py-3 transition-all duration-200`}
                                >
                                    {loading ? "Loading..." : "Resolve Issue"}
                                </Link>
                            ) : (
                                <div className={`w-full block text-center bg-gray-400 text-white font-medium px-4 py-3 rounded-xl  cursor-not-allowed`}>
                                    Please Wait or Contact Support
                                </div>
                            )}

                            {/* Show severity indicator */}
                            <div className="mt-3 flex items-center justify-between">
                                <span className={`text-xs uppercase font-medium ${reqColors.text.replace('800', '500')}`}>
                                    Priority: {requirement.severity}
                                </span>
                                {requirements.length > 1 && (
                                    <span className={`text-xs ${reqColors.text.replace('800', '500')}`}>
                                        {index + 1} of {requirements.length} issues
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
}
