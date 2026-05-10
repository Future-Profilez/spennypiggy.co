import { useState, useRef, useCallback } from 'react';
import Popup from '@/Components/Popup';
import { Flag, AlertTriangle, Link as LinkIcon, Edit3 } from 'lucide-react';
import { useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { useAlerts } from '@/Components/Alerts';
import Turnstile from './Turnstile';

export default function ReportContentModal({ reportedUser }) {
    const { turnstileSiteKey } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const [verified, setVerified] = useState(false);
    const turnstileRef = useRef(null);
    const { successAlert, errorAlert } = useAlerts();
    
    const { data, setData, reset, processing } = useForm({
        reporter_name: '',
        reporter_email: '',
        reported_url: window.location.href,
        reported_username: reportedUser?.username || '',
        reason: '',
        good_faith_confirmed: false,
        cf_turnstile_response: '',
    });

    const onVerify = useCallback((token) => {
        setData('cf_turnstile_response', token || '');
        setVerified(!!token);
    }, [setData, setVerified]);

    const submitReport = async (e) => {
        e.preventDefault();
        
        if (turnstileSiteKey && !verified && !data.cf_turnstile_response) {
            errorAlert("Please complete the CAPTCHA verification.");
            return false;
        }

        try {
            const response = await axios.post(route('api.report.store'), data);
            if (response.data.success) {
                successAlert(response.data.message);
                
                reset();
                setVerified(false);
                turnstileRef.current?.reset();
                
                setTimeout(() => {
                    const closeBtn = document.querySelector('.pinkmodal button.absolute');
                    if (closeBtn) closeBtn.click();
                }, 100);
            }
        } catch (error) {
            errorAlert(error?.response?.data?.message || 'Error submitting report. Please check your inputs.');
            console.error(error);
            setVerified(false);
            setData("cf_turnstile_response", "");
            if (turnstileRef.current) {
                turnstileRef.current.reset();
            }
        }
    };

    return (
        <Popup
            modalclass="pinkmodal max-w-2xl"
            size="xl"
            space="6"
            classes="bg-yellow-500 border-[3px] me-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all p-3 rounded-[18px] text-black group"
            text={<Flag size={20} strokeWidth={2.5} />}
            action={isOpen}
            onHide={() => setIsOpen(false)}
            onShow={() => setIsOpen(true)}
            title="Report Content"
        >
            <div className="text-left">
                <div className="flex items-center gap-3 mb-6  pb-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center border-2 border-black">
                        <Flag size={24} className="text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-gulfs uppercase text-black">Report Content</h2>
                        <p className="text-sm font-bold text-gray-600">Submit a DMCA or Copyright complaint</p>
                    </div>
                </div>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    submitReport(e).then(() => {
                        if (!processing && data.cf_turnstile_response) {
                            setIsOpen(false);
                        }
                    });
                }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-black uppercase mb-1">Your Full Name</label>
                            <input
                                type="text"
                                required
                                value={data.reporter_name}
                                onChange={(e) => setData('reporter_name', e.target.value)}
                                className="w-full rounded-[15px] border-2 border-black focus:ring-pink-500 focus:border-pink-500 p-3"
                                placeholder="Jane Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-black uppercase mb-1">Your Email</label>
                            <input
                                type="email"
                                required
                                value={data.reporter_email}
                                onChange={(e) => setData('reporter_email', e.target.value)}
                                className="w-full rounded-[15px] border-2 border-black focus:ring-pink-500 focus:border-pink-500 p-3"
                                placeholder="jane@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-black uppercase mb-1">Reported URL / Content Location</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <LinkIcon size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="url"
                                required
                                value={data.reported_url}
                                onChange={(e) => setData('reported_url', e.target.value)}
                                className="w-full rounded-[15px] border-2 border-black focus:ring-pink-500 focus:border-pink-500 p-3 pl-10"
                                placeholder="https://spennypiggy.co/..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-black uppercase mb-1">Reason for Report</label>
                        <p className="text-xs text-gray-500 mb-2">Please identify the copyrighted work and describe the allegedly infringing content.</p>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none">
                                <Edit3 size={18} className="text-gray-400" />
                            </div>
                            <textarea
                                required
                                minLength={10}
                                value={data.reason}
                                onChange={(e) => setData('reason', e.target.value)}
                                className="w-full rounded-[15px] border-2 border-black focus:ring-pink-500 focus:border-pink-500 p-3 pl-10 min-h-[120px]"
                                placeholder="I am the copyright owner of this artwork. This creator is selling my digital art without permission..."
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 border-2 border-black rounded-[15px] p-4 mt-6">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                required
                                checked={data.good_faith_confirmed}
                                onChange={(e) => setData('good_faith_confirmed', e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-2 border-black text-pink-600 focus:ring-pink-500"
                            />
                            <span className="text-sm font-bold text-gray-700">
                                I confirm that I believe in good faith that the use of the material is not authorised by the copyright owner, its agent, or the law, and that the information provided is accurate.
                            </span>
                        </label>
                    </div>

                    {turnstileSiteKey ? (
                        <div className="mt-4 w-full flex justify-center">
                            <Turnstile
                                ref={turnstileRef}
                                size="normal"
                                theme="light"
                                onVerify={onVerify}
                            />
                        </div>
                    ) : null}

                    <div className="pt-4 flex justify-center gap-3">
                        <button
                            type="submit"
                            disabled={processing || !data.good_faith_confirmed || !!(turnstileSiteKey && !data.cf_turnstile_response)}
                            className="bg-red-600 text-white border-2 border-black px-8 py-3 rounded-xl font-black uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </Popup>
    );
}