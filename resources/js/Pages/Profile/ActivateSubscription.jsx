import LoaderButton from '@/Components/LoaderButton';
import { subscriptionPlan } from '@/constants/creatorSubscription';
import Authenticated from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

export default function ActivateSubscription(props) {

    const { auth, user } = props;

    const subscriptionStatus = auth?.user?.subscription_status ?? user?.subscription_status;
    const username = auth?.user?.username ?? user?.username;

    const isActive = subscriptionStatus === 1;
    const isTrial = subscriptionStatus === 2;

    const [loading, setLoading] = useState(false);
    const [waiverAccepted, setWaiverAccepted] = useState(false);
    const [waiverError, setWaiverError] = useState('');

    const plan = subscriptionPlan(props.subscriptionPlan);

    const buttonAction = () => {
        if (isActive || isTrial) {
            window.location.href = route('user.show', { username });
            return;
        }

        // Re-entrancy guard: the disabled re-render alone loses the double-tap
        // race, and this creates a Stripe Checkout session.
        if (loading) return;

        if (!waiverAccepted) {
            setWaiverError('Please confirm you understand the terms before continuing.');
            return;
        }

        setLoading(true);
        setWaiverError('');

        // POST, not a link: this records the creator's consent, so it must carry
        // a CSRF token and it must not be something a URL alone can trigger.
        router.post(route('mandatory.checkout'), { digital_waiver: true }, {
            onError: (errors) => {
                setLoading(false);
                setWaiverError(
                    Object.values(errors ?? {}).flat()[0] ||
                        'We could not start your subscription. Please try again.',
                );
            },
            onFinish: () => setLoading(false),
        });
    };

    // A creator who has already sold starts billing the moment they subscribe —
    // the free period is tied to "have you earned", not to "have you subscribed
    // before". Promising them a free run here would be a lie the checkout then
    // contradicts, so every branch below reads this rather than the record's presence.
    const freeRun = plan.free_until_first_sale && !props.hasMadeSale;

    const heroTitle = isActive
        ? 'Your subscription is active'
        : isTrial
            ? (freeRun ? "You won't be charged until your first sale" : 'Your free period is active')
            : freeRun
                ? 'Start selling — no charge until your first sale'
                : 'Resume your creator subscription';

    const heroDescription = isActive
        ? 'Your creator tools are already active. Manage your plan and payments from your dashboard.'
        : isTrial
            ? `Your creator tools are live. Nothing is charged until you make your first sale — then it's ${plan.price_formatted} + VAT a month.`
            : freeRun
                ? `${plan.promise_long} ${plan.reassurance}`
                : `Your creator plan has ended. Resume now to keep accepting support and keep creator features active. Billing restarts at ${plan.price_formatted} + VAT per month.`;

    const buttonLabel = isActive
        ? 'Go to Dashboard'
        : isTrial
            ? 'Go to Dashboard'
            : freeRun
                ? 'Add card and start selling'
                : 'Resume Subscription';

    const features = isActive
        ? [
            'Your subscription is active and accepting support',
            'Manage your creator tools and billing in one place',
            'Cancel anytime after activation',
        ]
        : isTrial
            ? [
                'Your creator tools are active right now',
                'Nothing is charged until your first sale',
                `${plan.price_formatted} + VAT / month once you have sold`,
            ]
            : freeRun
                ? [
                    'Sell content, memberships and services',
                    'Accept payments from supporters worldwide',
                    plan.reassurance,
                ]
                : [
                    'Resume creator tools and keep accepting support',
                    `Your plan renews at ${plan.price_formatted} + VAT / month`,
                    'Billing starts immediately — you have sold on SpennyPiggy before',
                    'Cancel anytime',
                ];

    const billingCopy = freeRun
        ? `Nothing is charged today. Your first payment of ${plan.price_formatted} + VAT is taken after your first sale.`
        : `Your subscription will be charged at ${plan.price_formatted} + VAT per month.`;

    const legalCopy = freeRun
        ? `By continuing you agree to SpennyPiggy Terms of Service. No charge until you make your first sale, then ${plan.price_formatted} + VAT per month.`
        : `By continuing you agree to SpennyPiggy recurring billing at ${plan.price_formatted} + VAT per month.`;

    // The signature element: a 3-step billing timeline that answers "when am I
    // actually charged?" at a glance. It is the clearest statement of the whole
    // policy, so it renders for anyone who has a free period ahead of them.

    // ⚠️ The zero is only true while the creator has never sold. A returning
    // creator who HAS sold is billed the moment they subscribe — printing £0.00
    // at 80px to them would be the most prominent lie on the platform.
    const dueToday = freeRun ? '£0.00' : plan.total_formatted;

    return (
        <Authenticated auth={auth?.user} user={user}>
            <Head title={heroTitle} />

            {/* One column, one decision. The page previously nested four bordered
                panels inside each other and repeated the price in four places —
                when every element is emphasised, none of them is. */}
            <div className="bg-[#A2E4B8] min-h-dvh py-10 md:py-16 pb-40 lg:pb-16">
                <div className="mx-auto w-full max-w-3xl px-4">

                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-black/50">
                        The creator plan
                    </p>

                    <h2 className="mt-3 font-gulfs text-[28px] leading-[1.05] uppercase tracking-wide text-black md:text-[36px]">
                        {heroTitle}
                    </h2>

                    <p className="mt-4 text-[15px] font-medium leading-relaxed text-black/75 md:text-base">
                        {heroDescription}
                    </p>

                    {/* The only bordered surface on the page. */}
                    <div className="mt-8 rounded-box border-[3px] border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">

                        {isActive ? (
                            <div className="p-6 md:p-8">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/50">
                                    Status
                                </p>
                                <p className="mt-2 font-gulfs text-[34px] leading-none uppercase text-black">
                                    Active
                                </p>
                                <p className="mt-4 text-[14px] font-medium leading-relaxed text-black/70">
                                    {plan.active_price_line}. Manage payments and billing from your dashboard.
                                </p>
                            </div>
                        ) : (
                            <div className="p-6 md:p-8">
                                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/50">
                                    You pay today
                                </p>

                                {/* The signature, and the whole argument: on a page
                                    that asks for a card, the largest thing is nothing. */}
                                <p className="mt-1 font-gulfs text-[64px] leading-[0.82] tabular-nums text-black md:text-[80px]">
                                    {dueToday}
                                </p>

                                <div className="mt-6 border-t-[3px] border-black/10 pt-4">
                                    <p className="text-[14px] font-semibold leading-relaxed text-black">
                                        {billingCopy}
                                    </p>
                                    {freeRun && (
                                        <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-black/60">
                                            {plan.reassurance}
                                        </p>
                                    )}
                                </div>

                                {/* The consent record. It used to be stamped
                                    server-side with the comment "not required to be
                                    clicked" — a consent nobody gave. The exact
                                    wording shown here is what gets stored. */}
                                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-box-sm border-[3px] border-black bg-[#A2E4B8]/25 p-3.5">
                                    <input
                                        type="checkbox"
                                        checked={waiverAccepted}
                                        onChange={(e) => {
                                            setWaiverAccepted(e.target.checked);
                                            if (e.target.checked) setWaiverError('');
                                        }}
                                        className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-2 border-black text-[#FF007F] focus:ring-[#FF007F]"
                                    />
                                    <span className="text-[12.5px] font-medium leading-relaxed text-black/80">
                                        {plan.waiver}
                                    </span>
                                </label>

                                {waiverError && (
                                    <p role="alert" className="mt-2 text-[12px] font-bold text-[#B3261E]">
                                        {waiverError}
                                    </p>
                                )}

                                {/* Desktop CTA — mobile has the thumb-reachable bar. */}
                                <div className="mt-5 hidden lg:block">
                                    <LoaderButton
                                        onClick={buttonAction}
                                        disabled={loading}
                                        className={`w-full !rounded-box-sm border-[3px] border-black bg-[#FF007F] py-4 text-lg font-black uppercase tracking-widest text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-pink-600 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] motion-reduce:transition-none ${loading ? 'cursor-not-allowed opacity-50 grayscale' : ''}`}
                                    >
                                        {loading ? 'Processing…' : buttonLabel}
                                    </LoaderButton>
                                </div>

                                <p className="mt-4 text-[11px] font-medium leading-relaxed text-black/50">
                                    {legalCopy}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* What the plan includes. Deliberately unframed — a list of
                        facts does not need the same weight as the decision. */}
                    <ul className="mt-8 space-y-3">
                        {features.map((t) => (
                            <li key={t} className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-black bg-[#05EFB8]">
                                    <svg aria-hidden="true" className="h-3 w-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                                    </svg>
                                </span>
                                <span className="text-[14px] font-semibold leading-snug text-black/80">{t}</span>
                            </li>
                        ))}
                    </ul>

                    <p className="mt-8 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-black/45">
                        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Secure payment via Stripe
                    </p>
                </div>
            </div>

            {/* Mobile sticky CTA — thumb-reachable, clear of iOS safe area */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t-[3px] border-black px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-3 max-w-xl mx-auto">
                    <div className="flex-shrink-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 leading-none mb-1">{freeRun ? 'Today' : 'Due today'}</p>
                        <p className="text-xl font-black text-black leading-none tabular-nums">{dueToday}</p>
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
