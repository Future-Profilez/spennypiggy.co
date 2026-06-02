
import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import Guest from "@/Layouts/GuestLayout";

export default function RiskTestPanel({ auth }) {
    const [pin, setPin] = useState('');
    const [unlocked, setUnlocked] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [reservePercent, setReservePercent] = useState(10);
    const [payoutDelayDays, setPayoutDelayDays] = useState(0);
    const [joinedDaysAgo, setJoinedDaysAgo] = useState(0);

    const checkPin = () => {
        if (pin === '1212') {
            setUnlocked(true);
            setMessage('');
        } else {
            setMessage('Incorrect PIN');
        }
    };

    const handleAction = async (url) => {
        setLoading(true);
        setMessage('Processing...');
        try {
            const res = await axios.post(url);
            setMessage(`Success: ${res.data.message || 'Done'}`);
        } catch (error) {
            setMessage(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleActionWithBody = async (url, body) => {
        setLoading(true);
        setMessage('Processing...');
        try {
            const res = await axios.post(url, body);
            setMessage(`Success: ${res.data.message || 'Done'}`);
        } catch (error) {
            setMessage(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Guest auth={auth.user}>
            <Head title="Risk Test Panel" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                        <h1 className="text-2xl font-bold mb-6 text-gray-800">Risk Engine Test Panel</h1>

                        {!unlocked ? (
                            <div className="max-w-xs">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Enter PIN to Access
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="password"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        placeholder="PIN"
                                    />
                                    <button
                                        onClick={checkPin}
                                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                    >
                                        Unlock
                                    </button>
                                </div>
                                {message && <p className="text-red-500 text-xs italic mt-2">{message}</p>}
                            </div>
                        ) : (
                            <div>
                                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 text-yellow-700">
                                    <p className="font-bold">Warning</p>
                                    <p>These actions affect your current account status immediately. Use for testing UI banners only.</p>
                                </div>

                                {message && (
                                    <div className={`mb-6 p-4 rounded ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                        {message}
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Creator Risk Actions */}
                                    <div className="border p-4 rounded-lg">
                                        <h2 className="text-lg font-semibold mb-4">Creator Risk Flags</h2>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleAction('/api/test/risk/on')}
                                                disabled={loading}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                            >
                                                🔴 Trigger Risk (Reserve + Delay)
                                            </button>
                                            <button
                                                onClick={() => handleAction('/api/test/risk/off')}
                                                disabled={loading}
                                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                            >
                                                🟢 Clear All Flags
                                            </button>
                                        </div>
                                    </div>

                                    <div className="border p-4 rounded-lg">
                                        <h2 className="text-lg font-semibold mb-4">Reserve & Onboarding (Local)</h2>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Reserve percent</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    className="border rounded w-full py-2 px-3"
                                                    value={reservePercent}
                                                    onChange={(e) => setReservePercent(Math.max(0, Math.min(100, Number(e.target.value))))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Payout delay days</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="90"
                                                    className="border rounded w-full py-2 px-3"
                                                    value={payoutDelayDays}
                                                    onChange={(e) => setPayoutDelayDays(Math.max(0, Math.min(90, Number(e.target.value))))}
                                                />
                                            </div>
                                            <button
                                                onClick={() => handleActionWithBody('/api/test/creator/reserve', { reserve_percent: reservePercent, payout_delay_days: payoutDelayDays })}
                                                disabled={loading}
                                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                            >
                                                🟣 Apply Reserve Settings
                                            </button>
                                            <div className="pt-2 border-t">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1">Creator joined days ago</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="3650"
                                                    className="border rounded w-full py-2 px-3"
                                                    value={joinedDaysAgo}
                                                    onChange={(e) => setJoinedDaysAgo(Math.max(0, Math.min(3650, Number(e.target.value))))}
                                                />
                                                <button
                                                    onClick={() => handleActionWithBody('/api/test/creator/joined-days-ago', { days_ago: joinedDaysAgo })}
                                                    disabled={loading}
                                                    className="mt-3 w-full bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                                >
                                                    ⚙️ Set Joined Date
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Platform Risk Actions */}
                                    <div className="border p-4 rounded-lg">
                                        <h2 className="text-lg font-semibold mb-4">Platform State (Global)</h2>
                                        <div className="space-y-3">
                                            <button
                                                onClick={() => handleAction('/api/test/platform/freeze')}
                                                disabled={loading}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                            >
                                                ❄️ Set FREEZE (Pause Onboarding)
                                            </button>
                                            <button
                                                onClick={() => handleAction('/api/test/platform/normal')}
                                                disabled={loading}
                                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                            >
                                                ✅ Set NORMAL
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Guest>
    );
}
