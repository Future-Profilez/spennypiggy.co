import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, CheckCircle, Info } from 'lucide-react';

export default function StripeMigrationWarning({ migrationStatus, className = '' }) {
    const [loading, setLoading] = useState(false);
    
    // Don't show anything if migration isn't needed
    if (!migrationStatus?.show_warning || !migrationStatus?.needs_migration) {
        return null;
    }

    const { current_agreement, required_agreement, country, reason } = migrationStatus;

    return (
        <div className="w-full mb-6 bg-white rounded-[30px] md:rounded-[40px]  shadow-sm border border-red-100 overflow-hidden">
            <div className="flex">
                <div className="w-1.5 bg-red-600"></div>
                <div className="flex-1 p-8">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-red-50 text-red-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-xl leading-tight">Account Upgrade Needed</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-red-600">
                                        Action Required
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-600 mb-6 text-base leading-relaxed">
                        To receive card payments and access full payment features like global subscriptions and payouts, please complete your Stripe account setup.
                        <br className="mb-2" />
                        This is a quick one-time step required by Stripe to meet international compliance and allow you to earn on our platform.
                    </p>

                    <Link 
                        onClick={() => setLoading(!loading)}
                        href="/stripe/upgrade-express-account"
                        className="block w-full text-center bg-[#F94F96] hover:bg-pink-600 text-white font-gulfs uppercase text-lg py-3 px-6 rounded-full transition-all duration-200 btn-shadow active:transform active:scale-[0.99]"
                    >
                        {loading ? "Loading..." : "Upgrade Account"}
                    </Link>
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
        <div className={`bg-orange-500 text-white rounded-[30px] md:rounded-[40px]  p-3 mb-3 ${className}`}>
            <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Account Upgrade Needed</p>
                    <p className="text-xs text-orange-100">Enable international payments</p>
                </div>
                <Link
                    href="/stripe/upgrade-express-account"
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
        <div className="mb-4">
                <StripeMigrationWarning 
                    migrationStatus={migrationStatus}
                />
        </div>
     );
}
