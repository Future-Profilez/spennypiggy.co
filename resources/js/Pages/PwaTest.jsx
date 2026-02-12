import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { resetPromptTiming, shouldShowPrompt, getDaysUntilNextPrompt } from '@/utils/pwaInstall';

export default function PwaTest({ auth }) {
    const [installPrompt, setInstallPrompt] = useState(null);
    const [canInstall, setCanInstall] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [browserInfo, setBrowserInfo] = useState({});
    const [debugInfo, setDebugInfo] = useState({});

    useEffect(() => {
        // Detect browser and PWA capabilities
        const userAgent = navigator.userAgent.toLowerCase();
        const isChrome = userAgent.includes('chrome') && !userAgent.includes('edge');
        const isEdge = userAgent.includes('edge');
        const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome');
        const isFirefox = userAgent.includes('firefox');
        const isIOS = /iphone|ipad|ipod/.test(userAgent);
        
        setBrowserInfo({
            isChrome,
            isEdge,
            isSafari,
            isFirefox,
            isIOS,
            userAgent: navigator.userAgent,
            supportsBeforeInstallPrompt: 'onbeforeinstallprompt' in window
        });

        // Check if already installed
        const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        setIsInstalled(standalone);

        // Debug info
        setDebugInfo({
            shouldShow: shouldShowPrompt(),
            daysUntilNext: getDaysUntilNextPrompt(),
            lastShown: localStorage.getItem('spenny_pwa_install_prompt_last_shown'),
            standalone
        });

        // Listen for beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setInstallPrompt(e);
            setCanInstall(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Listen for app installed
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setCanInstall(false);
            setInstallPrompt(null);
        };

        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!installPrompt) return;

        try {
            await installPrompt.prompt();
            const { outcome } = await installPrompt.userChoice;
            
            if (outcome === 'accepted') {
                console.log('✅ User accepted PWA installation');
            } else {
                console.log('❌ User dismissed PWA installation');
            }
        } catch (error) {
            console.error('Error installing PWA:', error);
        } finally {
            setInstallPrompt(null);
            setCanInstall(false);
        }
    };

    const resetTimer = () => {
        resetPromptTiming();
        setDebugInfo(prev => ({
            ...prev,
            shouldShow: shouldShowPrompt(),
            daysUntilNext: getDaysUntilNextPrompt(),
            lastShown: null
        }));
    };

    return (
        <AuthenticatedLayout auth={auth}>
            <Head title="PWA Installation Test" />
            
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">PWA Installation Test 🐷💖</h1>
                
                {/* Installation Status */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white dark:bg-neutral-800 rounded-[40px]   p-6 border">
                        <h2 className="text-xl font-semibold mb-4">Installation Status</h2>
                        <div className="space-y-2">
                            <div className={`flex items-center gap-2 ${isInstalled ? 'text-green-600' : 'text-gray-600'}`}>
                                <span>{isInstalled ? '✅' : '❌'}</span>
                                <span>PWA Installed: {isInstalled ? 'Yes' : 'No'}</span>
                            </div>
                            <div className={`flex items-center gap-2 ${canInstall ? 'text-green-600' : 'text-gray-600'}`}>
                                <span>{canInstall ? '✅' : '❌'}</span>
                                <span>Can Install: {canInstall ? 'Yes' : 'No'}</span>
                            </div>
                        </div>
                        
                        {canInstall && (
                            <button
                                onClick={handleInstall}
                                className="mt-4 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-[40px]  font-medium"
                            >
                                Install PWA Now 🚀
                            </button>
                        )}
                    </div>

                    <div className="bg-white dark:bg-neutral-800 rounded-[40px]   p-6 border">
                        <h2 className="text-xl font-semibold mb-4">Browser Compatibility</h2>
                        <div className="space-y-2 text-sm">
                            <div className={`flex items-center gap-2 ${browserInfo.isChrome ? 'text-green-600' : 'text-gray-500'}`}>
                                <span>{browserInfo.isChrome ? '✅' : '⚪'}</span>
                                <span>Chrome</span>
                            </div>
                            <div className={`flex items-center gap-2 ${browserInfo.isEdge ? 'text-green-600' : 'text-gray-500'}`}>
                                <span>{browserInfo.isEdge ? '✅' : '⚪'}</span>
                                <span>Edge</span>
                            </div>
                            <div className={`flex items-center gap-2 ${browserInfo.isSafari ? 'text-yellow-600' : 'text-gray-500'}`}>
                                <span>{browserInfo.isSafari ? '⚠️' : '⚪'}</span>
                                <span>Safari (Manual Install)</span>
                            </div>
                            <div className={`flex items-center gap-2 ${browserInfo.isFirefox ? 'text-yellow-600' : 'text-gray-500'}`}>
                                <span>{browserInfo.isFirefox ? '⚠️' : '⚪'}</span>
                                <span>Firefox (Limited Support)</span>
                            </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t text-xs">
                            <div className={`flex items-center gap-2 ${browserInfo.supportsBeforeInstallPrompt ? 'text-green-600' : 'text-red-600'}`}>
                                <span>{browserInfo.supportsBeforeInstallPrompt ? '✅' : '❌'}</span>
                                <span>beforeinstallprompt Support</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Debug Information */}
                <div className="bg-white dark:bg-neutral-800 rounded-[40px]   p-6 border mb-6">
                    <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <strong>Monthly Timer:</strong>
                            <ul className="ml-4 mt-2 space-y-1">
                                <li>Should Show Prompt: {debugInfo.shouldShow ? 'Yes' : 'No'}</li>
                                <li>Days Until Next: {debugInfo.daysUntilNext}</li>
                                <li>Last Shown: {debugInfo.lastShown ? new Date(parseInt(debugInfo.lastShown)).toLocaleString() : 'Never'}</li>
                            </ul>
                            <button
                                onClick={resetTimer}
                                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                            >
                                Reset Timer
                            </button>
                        </div>
                        
                        <div>
                            <strong>Browser Details:</strong>
                            <ul className="ml-4 mt-2 space-y-1">
                                <li>iOS Device: {browserInfo.isIOS ? 'Yes' : 'No'}</li>
                                <li>Standalone Mode: {debugInfo.standalone ? 'Yes' : 'No'}</li>
                                <li>Install Event Ready: {canInstall ? 'Yes' : 'No'}</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-[40px]   p-6 border">
                    <h2 className="text-xl font-semibold mb-4">How to Test PWA Installation</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium text-green-600">✅ Chrome/Edge (Full Support)</h3>
                            <p className="text-sm mt-1">Click "Install PWA Now" button above, or look for install icon in address bar</p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-yellow-600">⚠️ Safari (Manual Only)</h3>
                            <p className="text-sm mt-1">
                                1. Tap Share button (□↑) → 2. "Add to Home Screen" → 3. "Add"
                            </p>
                        </div>
                        
                        <div>
                            <h3 className="font-medium text-red-600">❌ Not Working?</h3>
                            <ul className="text-sm mt-1 ml-4 space-y-1">
                                <li>• Make sure you're on HTTPS (production)</li>
                                <li>• Service worker must be registered</li>
                                <li>• Manifest.json must be accessible</li>
                                <li>• Try incognito/private mode</li>
                                <li>• Clear browser cache</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* User Agent Info */}
                <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-[40px]   p-4">
                    <details>
                        <summary className="cursor-pointer font-medium">Show User Agent</summary>
                        <pre className="mt-2 text-xs bg-black text-green-400 p-3 rounded overflow-x-auto">
                            {browserInfo.userAgent}
                        </pre>
                    </details>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
