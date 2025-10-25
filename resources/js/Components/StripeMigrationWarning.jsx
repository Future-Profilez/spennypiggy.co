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
        <div className="w-full finishs mb-4 rounded-3xl bg-white !border-voilet shadow-voilet">
            <div className='border-bottom border-voilet'>
                <h2 className='text-large font-GillSans text-uppercase lightpink p-3 goaltitle'>Action Required</h2>
            </div>
            <div className='p-4'>
                <h2 className='text-red-600 text-xl md:text-xl mb-2 font-gulfs uppercase'>Your Stripe Account Needs an Upgrade</h2>
                <p className={`mb-2 text-md text-red-600`}>
                    To receive card payments and unlock full payment features like global subscriptions and payouts, please complete your Stripe account setup.
                </p>
                <p className={`mb-4 text-md text-red-600`}>
                    This is a quick one-time step required by Stripe to meet international compliance and allow you to earn on our platform.
                </p>
                <Link 
                    onClick={() => setLoading(!loading)}
                    href="/stripe/upgrade-express-account"
                    className="btn-pink text-sm btn-shadow w-full block text-center bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 3 transition-all duration-200"
                >
                    {loading ? "Loading..." : "Upgrade Account"}
                </Link>
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
