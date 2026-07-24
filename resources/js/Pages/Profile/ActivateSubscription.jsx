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
                ? 'Try every creator tool free for 3 days. Cancel anytime before the trial ends and you pay nothing.'
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
            : isFirstTime
                ? [
                    'Sell content, memberships and services',
                    'Accept payments from supporters worldwide',
                    'No charge today — cancel anytime during the trial',
                ]
                : [
                    'Resume creator tools and keep accepting support',
                    'Your plan renews at £8.99 + VAT / month',
                    'No free trial is available if you already used it',
                    'Cancel anytime after activation',
                ];

    const billingCopy = isResumeFlow
        ? 'Your subscription will resume at £8.99 + VAT per month.'
        : 'No charge today. Trial ends before your first payment.';

    const legalCopy = isResumeFlow
        ? 'By clicking "Resume Subscription", you agree to SpennyPiggy recurring billing at £8.99 + VAT per month.'
        : 'By clicking "Start free trial", you agree to SpennyPiggy Terms of Service. No charge until your 3-day free trial ends.';

    // The signature element: a 3-step billing timeline that answers "when am I
    // actually charged?" at a glance. Only meaningful for trial-based flows.
    const showTimeline = isFirstTime || isTrial;
    const timelineSteps = [
        { label: 'Today', detail: isTrial ? 'Trial running' : 'Trial starts', amount: '£0.00', accent: true },
        { label: 'Day 3', detail: 'Trial ends', amount: null, accent: false },
        { label: 'After', detail: 'Plan renews monthly', amount: '£8.99 + VAT', accent: false },
    ];

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title={heroTitle} />
            <div className="bg-[#A2E4B8] min-h-dvh py-8 md:py-12 pb-36 lg:pb-12">
              <div className="containerbox mx-auto px-4">

                {/* Hero */}
                <div className="text-center mb-8 md:mb-10 max-w-2xl mx-auto">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-gulfs text-black uppercase tracking-wider mb-3">
                        {heroTitle}
                    </h2>
                    <p className="text-gray-800 text-base md:text-lg font-medium">
                        {heroDescription}
                    </p>
                </div>

                <div className="relative bg-white rounded-box border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden max-w-5xl mx-auto">
                    {/* Mac-style header — desktop garnish only; mobile gets the space back */}
                    <div className="hidden md:flex px-6 py-4 border-b-[3px] !border-t-0 !border-l-0 !border-r-0 border-black items-center justify-between bg-white">
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-black"></span>
                        <span className="w-3.5 h-3.5 rounded-full bg-yellow-400 border-2 border-black"></span>
                        <span className="w-3.5 h-3.5 rounded-full bg-[#05EFB8] border-2 border-black"></span>
                      </div>
                      <span className="text-black font-bold text-xs uppercase tracking-widest">Secure Payment via Stripe</span>
                    </div>

                    <div className="p-5 md:p-10">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">

                            {/* Order summary — first on mobile (the decision info), right rail on desktop */}
                            <div className="order-1 lg:order-2 lg:col-span-2">
                                <div className="p-6 md:p-8 rounded-box bg-[#A2E4B8]/30 border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] lg:sticky lg:top-6">
                                    <div className="mb-6">
                                        <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-2">Order Summary</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black text-black">£8.99</span>
                                            <span className="text-gray-600 font-bold">+ VAT / month</span>
                                        </div>
                                    </div>

                                    {/* Billing timeline — when money actually moves */}
                                    {showTimeline ? (
                                        <div className="mb-6 rounded-box-sm border-[3px] border-black bg-white p-4">
                                            <ol className="relative">
                                                {timelineSteps.map((step, i) => (
                                                    <li key={step.label} className="flex gap-3 pb-4 last:pb-0 relative">
                                                        {i < timelineSteps.length - 1 && (
                                                            <span aria-hidden="true" className="absolute left-[7px] top-5 bottom-0 w-[2px] bg-black/20"></span>
                                                        )}
                                                        <span className={`mt-1 w-4 h-4 rounded-full border-2 border-black flex-shrink-0 ${step.accent ? 'bg-[#FF007F]' : 'bg-[#05EFB8]'}`}></span>
                                                        <span className="flex-1 flex items-baseline justify-between gap-2 min-w-0">
                                                            <span>
                                                                <span className="block text-xs font-black uppercase tracking-wider text-black">{step.label}</span>
                                                                <span className="block text-xs text-gray-600 font-medium">{step.detail}</span>
                                                            </span>
                                                            {step.amount && (
                                                                <span className={`text-sm font-black whitespace-nowrap ${step.accent ? 'text-[#FF007F]' : 'text-black'}`}>{step.amount}</span>
                                                            )}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ol>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 mb-6">
                                            <div className="flex justify-between font-bold text-gray-700 text-sm">
                                                <span>Due Today</span>
                                                <span className="text-[#FF007F]">{isResumeFlow ? '£10.79' : '£0.00'}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-gray-700 text-sm">
                                                <span>Monthly Total</span>
                                                <span className="text-black">£10.79</span>
                                            </div>
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-700 font-medium">
                                        {billingCopy}
                                    </p>

                                    {/* Desktop CTA — mobile uses the sticky bar below */}
                                    <div className="mt-6 hidden lg:block">
                                        <LoaderButton
                                            onClick={buttonAction}
                                            disabled={loading}
                                            className={`w-full !rounded-box-sm bg-[#FF007F] hover:bg-pink-600 text-white font-black py-4 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-widest text-lg ${loading ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                                        >
                                            {loading ? 'Processing…' : buttonLabel}
                                        </LoaderButton>
                                    </div>

                                    <p className="mt-5 text-[11px] text-gray-600 font-medium leading-relaxed text-center">
                                        {legalCopy}
                                    </p>

                                    {/* Trust line (replaces the mac header on mobile) */}
                                    <p className="mt-4 md:hidden flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-700">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                        Secure payment via Stripe
                                    </p>
                                </div>
                            </div>

                            {/* Plan story */}
                            <div className="order-2 lg:order-1 lg:col-span-3 space-y-8">
                                <div>
                                    <h3 className="text-black font-anton uppercase text-2xl tracking-wider mb-4">
                                        The Creator Plan
                                    </h3>
                                    <p className="text-gray-700 text-base md:text-lg leading-relaxed font-medium">
                                        {isActive && 'Your creator plan is active. Use the dashboard to manage payments, content, and billing settings.'}
                                        {(isTrial || isFirstTime) && (
                                            <>Start your journey with a <span className="text-[#FF007F] font-bold">3-day free trial</span>. After the trial, your plan renews at <span className="text-black font-bold">£8.99 + VAT / month</span>.</>
                                        )}
                                        {isResumeFlow && (
                                            <>Resume your creator subscription at <span className="text-black font-bold">£8.99 + VAT / month</span>. Free trial is not available again if you have already used it.</>
                                        )}
                                    </p>
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 md:p-5 rounded-box-sm bg-[#f3f4f6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Plan Price</p>
                                        <p className="text-black font-black text-lg md:text-xl">£8.99 + VAT</p>
                                        <p className="text-gray-600 text-xs mt-1 font-medium italic">Monthly recurring rate</p>
                                    </div>
                                    <div className="p-4 md:p-5 rounded-box-sm bg-[#f3f4f6] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-black font-black text-lg md:text-xl">{isActive ? 'Active' : isTrial ? 'Trial' : isFirstTime ? 'New' : 'Expired'}</p>
                                        <p className="text-gray-600 text-xs mt-1 font-medium italic">{isFirstTime ? 'Free trial available' : isResumeFlow ? 'Resume your subscription' : '3-day free trial'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>

            {/* Mobile sticky CTA — thumb-reachable, clear of iOS safe area */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-[3px] border-black px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-3 max-w-xl mx-auto">
                    <div className="flex-shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-none mb-1">{isResumeFlow ? 'Due today' : 'Today'}</p>
                        <p className="text-xl font-black text-black leading-none">{isResumeFlow ? '£10.79' : '£0.00'}</p>
                    </div>
                    <LoaderButton
                        onClick={buttonAction}
                        disabled={loading}
                        className={`flex-1 min-h-[52px] !rounded-box-sm bg-[#FF007F] text-white font-black py-3 border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all uppercase tracking-widest text-base ${loading ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Processing…' : buttonLabel}
                    </LoaderButton>
                </div>
            </div>
        </Authenticated>
    )
}
