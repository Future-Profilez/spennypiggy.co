import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';

export default function FounderBonusSettings() {
    const [settings, setSettings] = useState({
        thresholds: {
            min_first_30d_earnings: 0,
            min_monthly_earnings: 0,
            max_monthly_earnings: 0,
        },
        calculation: {
            qualification_days: 30,
            monthly_calculation_days: 30,
            bonus_percentage: 0.1,
        },
        limits: {
            max_founder_seats: 150,
            max_bonus_per_month: 1000,
        },
        features: {
            enabled: true,
            auto_qualification: true,
            email_notifications: true,
        },
    });
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/admin/founder/bonus-settings');
            const data = await response.json();
            setSettings(data);
        } catch (err) {
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');

        try {
            const response = await fetch('/admin/founder/bonus-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                },
                body: JSON.stringify(settings),
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessage('Settings updated successfully!');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setError(data.error || 'Failed to update settings');
            }
        } catch (err) {
            setError('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Head title="Founder Bonus Settings" />
            
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h1 className="text-2xl font-bold text-gray-900">Founder Bonus Settings</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Configure the founder bonus program parameters
                            </p>
                        </div>

                        {message && (
                            <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-green-800">{message}</p>
                            </div>
                        )}

                        {error && (
                            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-800">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                            {/* Earnings Thresholds */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Earnings Thresholds</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Minimum First Period Earnings ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={settings.thresholds.min_first_30d_earnings}
                                            onChange={(e) => handleInputChange('thresholds', 'min_first_30d_earnings', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Minimum Monthly Earnings ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={settings.thresholds.min_monthly_earnings}
                                            onChange={(e) => handleInputChange('thresholds', 'min_monthly_earnings', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Maximum Monthly Earnings ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={settings.thresholds.max_monthly_earnings}
                                            onChange={(e) => handleInputChange('thresholds', 'max_monthly_earnings', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Calculation Settings */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Calculation Settings</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Qualification Period (Days)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={settings.calculation.qualification_days}
                                            onChange={(e) => handleInputChange('calculation', 'qualification_days', parseInt(e.target.value) || 30)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Monthly Calculation Period (Days)
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={settings.calculation.monthly_calculation_days}
                                            onChange={(e) => handleInputChange('calculation', 'monthly_calculation_days', parseInt(e.target.value) || 30)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bonus Percentage (0.0 - 1.0)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="1"
                                            value={settings.calculation.bonus_percentage}
                                            onChange={(e) => handleInputChange('calculation', 'bonus_percentage', parseFloat(e.target.value) || 0)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Program Limits */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Program Limits</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Maximum Founder Seats
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={settings.limits.max_founder_seats}
                                            onChange={(e) => handleInputChange('limits', 'max_founder_seats', parseInt(e.target.value) || 150)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Maximum Bonus Per Month ($)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={settings.limits.max_bonus_per_month}
                                            onChange={(e) => handleInputChange('limits', 'max_bonus_per_month', parseFloat(e.target.value) || 1000)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Feature Toggles */}
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-4">Feature Settings</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="enabled"
                                            checked={settings.features.enabled}
                                            onChange={(e) => handleInputChange('features', 'enabled', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900">
                                            Enable Founder Bonus Program
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="auto_qualification"
                                            checked={settings.features.auto_qualification}
                                            onChange={(e) => handleInputChange('features', 'auto_qualification', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="auto_qualification" className="ml-2 block text-sm text-gray-900">
                                            Automatic Qualification Processing
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="email_notifications"
                                            checked={settings.features.email_notifications}
                                            onChange={(e) => handleInputChange('features', 'email_notifications', e.target.checked)}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-900">
                                            Email Notifications
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? 'Saving...' : 'Save Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}