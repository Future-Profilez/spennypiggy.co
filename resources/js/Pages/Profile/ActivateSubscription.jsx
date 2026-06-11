import LoaderButton from '@/Components/LoaderButton';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function ActivateSubscription(props) {

    const { auth, user } = props;
    const page = usePage();

    const subscriptionStatus = auth?.user?.subscription_status ?? user?.subscription_status;
    const username = auth?.user?.username ?? user?.username;
    const finalMonthlyCharges = props.monthly_charges || page.props?.monthly_charges || null;
    const hasMonthlyChargeRecord = !!finalMonthlyCharges;
    const isFirstTime = !hasMonthlyChargeRecord;

    const isActive = subscriptionStatus === 1;
    const isTrial = subscriptionStatus === 2;
    const isExpired = subscriptionStatus === 0;
    const isInactive = subscriptionStatus === 3;
    const isResumeFlow = hasMonthlyChargeRecord && !isActive && !isTrial;

    const [loading, setLoading] = useState(false);

    const buttonAction = () => {
        if (isActive || isTrial) {
            window.location.href = route('user.show', { username });
            return;
        }

        setLoading(true);
        window.location.href = route('mandatory.checkout');
    };

    const heroTitle = isActive
        ? 'Your subscription is active'
        : isTrial
            ? 'Your free trial is active'
            : isFirstTime
                ? 'Start your 3-day free trial'
                : 'Resume your creator subscription';

    const heroDescription = isActive
        ? 'Your creator tools are already active. Manage your plan and payments from your dashboard.'
        : isTrial
            ? 'Your 3-day free trial is running. Enjoy creator tools today and check payment details anytime.'
            : isFirstTime
                ? 'Start now with a free trial, then pay £8.99 + VAT / month after the trial ends.'
                : 'Your creator plan has ended. Resume now to keep accepting support and keep creator features active.';

    const buttonLabel = isActive
        ? 'Go to Dashboard'
        : isTrial
            ? 'Continue Trial'
            : isFirstTime
                ? 'Start free trial'
                : 'Resume Subscription';

    const features = isActive
        ? [
            'Your subscription is active and accepting support',
            'Manage your creator tools and billing in one place',
            'Cancel anytime after activation',
        ]
        : isTrial
            ? [
                'Your free trial is active right now',
                'No charge until trial ends',
                'Subscription renews at £8.99 + VAT / month after trial',
            ]
            : [
                'Resume creator tools and keep accepting support',
                'Your plan renews at £8.99 + VAT / month',
                'No free trial is available if you already used it',
                'Cancel anytime after activation',
            ];

    const orderTag = isResumeFlow
        ? 'Resume your plan to continue creator earnings'
        : 'Includes 3-day free trial';
    const dueTodayText = '£0.00';
    const dueTodayLabel = 'Due Today';
    const billingCopy = isResumeFlow
        ? 'Your subscription will resume at £8.99 + VAT per month.'
        : 'No charge today. Trial ends before your first payment.';

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title={heroTitle} />
            <div className="bg-[#A2E4B8] min-h-screen py-12 ">
              <div className="containerbox mx-auto">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-gulfs text-black uppercase tracking-wider mb-2">
                        {heroTitle}
                    </h2>
                    <p className="text-gray-800 text-lg font-medium">
                        {heroDescription}
                    </p>
                </div>

                <div className="relative bg-white rounded-[30px]  border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
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
                                        {isActive && 'Your creator plan is active. Use the dashboard to manage payments, content, and billing settings.'}
                                        {isTrial && (
                                            <>Start your journey with a <span className="text-[#FF007F] font-bold">3-day free trial</span>. After the trial, your plan renews at <span className="text-black font-bold">£8.99 + VAT / month</span>.</>
                                        )}
                                        {isFirstTime && (
                                            <>Start your journey with a <span className="text-[#FF007F] font-bold">3-day free trial</span>. After the trial, your plan renews at <span className="text-black font-bold">£8.99 + VAT / month</span>.</>
                                        )}
                                        {isResumeFlow && (
                                            <>Resume your creator subscription at <span className="text-black font-bold">£8.99 + VAT / month</span>. Free trial is not available again if you have already used it.</>
                                        )}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-[20px] bg-[#f3f4f6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Plan Price</p>
                                        <p className="text-black font-black text-xl">£8.99 + VAT</p>
                                        <p className="text-gray-600 text-xs mt-1 font-medium italic">Monthly recurring rate</p>
                                    </div>
                                    <div className="p-5 rounded-[20px] bg-[#f3f4f6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-black font-black text-xl">{isActive ? 'Active' : isTrial ? 'Trial' : isFirstTime ? 'New' : 'Expired'}</p>
                                        <p className="text-gray-600 text-xs mt-1 font-medium italic">{isFirstTime ? 'Free trial available' : isResumeFlow ? 'Resume your subscription' : '3-day free trial'}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {features.map((t) => (
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
                                <div className="p-8 rounded-[30px]  bg-[#A2E4B8]/30 border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                                    <div className="mb-8">
                                        <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-2">Order Summary</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-black">£8.99</span>
                                            <span className="text-gray-600 font-bold">+ VAT / month</span>
                                        </div>
                                        <div className="mt-2 inline-block px-3 py-1 rounded-full bg-black text-white text-[10px] font-black uppercase tracking-tighter">
                                            {orderTag}
                                        </div>
                                    </div>

                                    <div className="space-y-4 ">
                                        <div className="flex justify-between font-bold text-gray-700">
                                            <span>{dueTodayLabel}</span>
                                            <span className="text-[#FF007F]">{dueTodayText}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-gray-700">
                                            <span>Monthly Total</span>
                                            <span className="text-black">£10.79</span>
                                        </div>
                                    </div>
                                    <p className="mt-4 text-sm text-gray-700 font-medium">
                                        {billingCopy}
                                    </p>

                                    <div className="mt-8">
                                        <LoaderButton 
                                            onClick={buttonAction} 
                                            disabled={loading} 
                                            className={`w-full !rounded-[20px] bg-[#FF007F] hover:bg-pink-600 text-white font-black py-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-widest text-lg ${loading ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                        >
                                            {loading ? 'Redirecting...' : buttonLabel}
                                        </LoaderButton>
                                    </div>

                                    <p className="mt-6 text-[11px] text-gray-600 font-medium leading-relaxed text-center">
                                        {isResumeFlow
                                            ? 'By clicking "Resume Subscription", you agree to SpennyPiggy recurring billing at £8.99 + VAT per month.'
                                            : 'By clicking "Continue Trial", you agree to SpennyPiggy Terms of Service. No charge until your 3-day free trial ends.'}
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
