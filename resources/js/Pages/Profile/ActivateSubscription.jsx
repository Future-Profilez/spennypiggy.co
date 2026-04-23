import LoaderButton from '@/Components/LoaderButton';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

export default function ActivateSubscription(props) {

    const { auth, user } = props;

    const [loading, setLoading] = useState(false);
    const checkTerms = () => {
      setLoading(true);
      window.location.href = route("mandatory.checkout");
    }

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title={"Activate Subscription"} />
            <div className="bg-[#A2E4B8] min-h-screen py-12 ">
              <div className="containerbox mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-gulfs text-black uppercase tracking-wider mb-2">
                        Activate <span className="text-pink-600">Subscription</span>
                    </h2>
                    <p className="text-gray-800 text-lg font-medium">
                        Unlock creator tools and start receiving support.
                    </p>
                </div>

                <div className="relative bg-white rounded-[30px] border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                    {/* Mac-style Header */}
                    <div className="px-6 py-4 border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black flex items-center justify-between bg-white">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-black"></span>
                        <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-black"></span>
                        <span className="w-3.5 h-3.5 rounded-full bg-[#05EFB8] border-2 border-black"></span>
                      </div>
                      <span className="text-black font-bold text-xs uppercase tracking-widest">Secure Payment via Stripe</span>
                    </div>

                    <div className="p-6 md:p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                            <div className="lg:col-span-3 space-y-8">
                                <div>
                                    <h3 className="text-black font-anton uppercase text-2xl tracking-wider mb-4">
                                        The Creator Plan
                                    </h3>
                                    <p className="text-gray-700 text-lg leading-relaxed font-medium">
                                        Start your journey with a <span className="text-pink-600 font-bold">3-day free trial</span>. 
                                        After the trial, your plan renews at <span className="text-black font-bold">£8.99/month</span>.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-[20px] bg-[#f3f4f6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Trial Period</p>
                                        <p className="text-black font-black text-xl">3 DAYS FREE</p>
                                        <p className="text-gray-600 text-xs mt-1 font-medium italic">Cancel anytime</p>
                                    </div>
                                    <div className="p-5 rounded-[20px] bg-[#f3f4f6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Renewal Price</p>
                                        <p className="text-black font-black text-xl">£8.99 / MONTH</p>
                                        <p className="text-gray-600 text-xs mt-1 font-medium italic">Secure Billing</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        'Unlock all creator tools and features',
                                        'Start receiving payments immediately',
                                        '3-day trial period — no charge today',
                                        'Full control — cancel anytime'
                                    ].map((t) => (
                                        <div key={t} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-[#05EFB8] border-2 border-black flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <span className="text-gray-800 font-bold text-md">{t}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="lg:col-span-2">
                                <div className="p-8 rounded-[30px] bg-[#A2E4B8]/30 border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="mb-8">
                                        <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-2">Order Summary</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-black">£8.99</span>
                                            <span className="text-gray-600 font-bold">/ month</span>
                                        </div>
                                        <div className="mt-2 inline-block px-3 py-1 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-tighter">
                                            Includes 3-day free trial
                                        </div>
                                    </div>

                                    <div className="space-y-4 ">
                                        <div className="flex justify-between font-bold text-gray-700">
                                            <span>Due Today</span>
                                            <span className="text-pink-600">£0.00</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-gray-700">
                                            <span>Monthly Total</span>
                                            <span className="text-black">£8.99</span>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <LoaderButton 
                                            onClick={checkTerms} 
                                            disabled={loading} 
                                            className="w-full !rounded-[20px] bg-pink-500 hover:bg-pink-600 text-white font-black py-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-widest text-lg"
                                        >
                                            {loading ? "Redirecting..." : "Activate Now"}
                                        </LoaderButton>
                                    </div>

                                    <p className="mt-6 text-[11px] text-gray-600 font-medium leading-relaxed text-center">
                                        By clicking "Activate Now", you agree to SpennyPiggy's Terms of Service and recurring billing after your 3-day free trial ends.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
        </Authenticated>
    )
}
