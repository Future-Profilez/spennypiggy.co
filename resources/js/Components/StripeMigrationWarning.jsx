import React from 'react';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, CheckCircle, Info } from 'lucide-react';

export default function StripeMigrationWarning({ migrationStatus, className = '' }) {
    // Don't show anything if migration isn't needed
    if (!migrationStatus?.show_warning || !migrationStatus?.needs_migration) {
        return null;
    }

    const { current_agreement, required_agreement, country, reason } = migrationStatus;

    return (
        <div className={`relative w-full ${className}`}>
            {/* Critical Warning Banner */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 border border-orange-600 rounded-lg p-4 mb-4 shadow-lg">
                <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        {/* Main Warning Message */}
                        <div className="mb-3">
                            <h3 className="text-lg font-bold text-white mb-1">
                                🚀 Payment Account Upgrade Required
                            </h3>
                            <p className="text-orange-100 text-sm leading-relaxed">
                                Your payment account needs to be upgraded to support international payments. 
                                This quick update will ensure fans worldwide can support you without issues.
                            </p>
                        </div>

                        {/* Technical Details (Collapsible) */}
                        <details className="mb-3 group">
                            <summary className="text-orange-200 text-xs cursor-pointer hover:text-white transition-colors">
                                <span className="inline-flex items-center">
                                    <Info className="w-3 h-3 mr-1" />
                                    Technical Details
                                </span>
                            </summary>
                            <div className="mt-2 pl-4 border-l-2 border-orange-300">
                                <p className="text-orange-100 text-xs">
                                    <strong>Location:</strong> {country}<br />
                                    <strong>Current:</strong> {current_agreement} agreement<br />
                                    <strong>Required:</strong> {required_agreement} agreement<br />
                                    <strong>Reason:</strong> {reason}
                                </p>
                            </div>
                        </details>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link
                                href="/stripe"
                                className="inline-flex items-center justify-center px-4 py-2 bg-white text-orange-600 font-semibold rounded-md hover:bg-orange-50 transition-colors shadow-sm"
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Upgrade Now
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                            
                            <button
                                onClick={() => window.open('mailto:support@spennypiggy.co?subject=Stripe Account Upgrade Help', '_blank')}
                                className="inline-flex items-center justify-center px-4 py-2 bg-transparent text-white font-medium rounded-md border border-orange-300 hover:bg-orange-600 transition-colors"
                            >
                                Need Help?
                            </button>
                        </div>
                    </div>
                    
                    {/* Dismiss Button (Optional) */}
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => {
                                // Store dismissal in localStorage temporarily
                                localStorage.setItem(`migration_dismissed_${Date.now()}`, 'true');
                                document.querySelector('[data-migration-warning]')?.style.setProperty('display', 'none');
                            }}
                            className="text-orange-200 hover:text-white transition-colors"
                            title="Temporarily hide (will show again on page refresh)"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Progress Indicator */}
                <div className="mt-4 pt-3 border-t border-orange-400">
                    <div className="flex items-center justify-between text-orange-100 text-xs">
                        <span>Upgrade Process: 2-5 minutes</span>
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-orange-300 rounded-full"></div>
                            <div className="w-2 h-2 bg-orange-300 rounded-full opacity-50"></div>
                            <div className="w-2 h-2 bg-orange-300 rounded-full opacity-25"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Compact version for sidebars or smaller spaces
 */
export function CompactStripeMigrationWarning({ migrationStatus, className = '' }) {
    if (!migrationStatus?.show_warning || !migrationStatus?.needs_migration) {
        return null;
    }

    return (
        <div className={`bg-orange-500 text-white rounded-md p-3 mb-3 ${className}`}>
            <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Account Upgrade Needed</p>
                    <p className="text-xs text-orange-100">Enable international payments</p>
                </div>
                <Link
                    href="/stripe"
                    className="bg-white text-orange-600 px-3 py-1 rounded text-xs font-medium hover:bg-orange-50 transition-colors flex-shrink-0"
                >
                    Upgrade
                </Link>
            </div>
        </div>
    );
}

/**
 * Banner for Dashboard/Profile Pages
 */
export function DashboardStripeMigrationWarning({ migrationStatus }) {
    if (!migrationStatus?.show_warning || !migrationStatus?.needs_migration) {
        return null;
    }

    return (
        <div data-migration-warning className="fixed top-16 left-0 right-0 z-50 mx-4">
            <StripeMigrationWarning 
                migrationStatus={migrationStatus} 
                className="max-w-4xl mx-auto"
            />
        </div>
    );
}
