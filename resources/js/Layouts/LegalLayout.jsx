import { Link } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import {
    FileText,
    ShieldCheck,
    Users,
    Handshake,
    CreditCard,
    Wallet,
    ClipboardList,
    RotateCcw,
    ArrowLeft
} from "lucide-react";

export default function LegalLayout({ children, activePage }) {
    const navRef = useRef(null);
    const activeRef = useRef(null);

    const navItems = [
        { name: 'How Spenny Piggy Works', href: '/how-spenny-piggy-works', component: 'HowSpennyPiggyWorks', icon: Wallet },
        { name: 'Terms of Service', href: '/terms-and-conditions', component: 'TermsOfService', icon: FileText },
        { name: 'Copyright & IP Policy', href: '/copyright-policy', component: 'CopyrightPolicy', icon: FileText },
        { name: 'Creator Agreement', href: '/creator-agreement', component: 'CreatorAgreement', icon: ShieldCheck },
        { name: 'Supporter Terms', href: '/supporter-terms', component: 'SupporterTerms', icon: Users },
        { name: 'Creator-Supporter Contract', href: '/creator-supporter-contract', component: 'CreatorSupporterContract', icon: Handshake },
        { name: 'MoR Agreement', href: '/mor-agreement', component: 'MorAgreement', icon: CreditCard },
        { name: 'Payments Policy', href: '/reserves-and-payments-policy', component: 'PaymentsPolicy', icon: Wallet },
        { name: 'Paid Tasks Terms', href: '/paid-tasks-terms', component: 'PaidTasksTerms', icon: ClipboardList },
        { name: 'Return Policy', href: '/return-policy', component: 'ReturnPolicy', icon: RotateCcw },
        { name: 'US Addendum', href: '/us-addendum', component: 'UsAddendum', icon: ShieldCheck },
        { name: 'Fast Payout Terms', href: '/fast-start-bonus-terms', component: 'FastStartBonusTerms', icon: FileText },
        { name: 'Content & Payment Policy', href: '/content-payment-policy', component: 'ContentPaymentFramework', icon: ShieldCheck },
    ];

    // keep the current document visible in the scrolling tab strip
    useEffect(() => {
        const nav = navRef.current;
        const active = activeRef.current;
        if (!nav || !active) return;
        nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.clientWidth) / 2;
    }, [activePage]);

    return (
        <div className="min-h-dvh bg-[#FDFCFD] font-poppins">
            <div className="border-b-2 border-black bg-white">
                <div className="mx-auto w-full max-w-6xl px-5 pt-5 sm:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="border-2 border-black w-10 h-10 bg-pink-600 rounded-box-sm flex items-center justify-center">
                                <ShieldCheck className="text-black" size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                                    Legal Center
                                </h2>
                                <p className="text-[12px] text-black/60 font-medium uppercase tracking-widest">
                                    Official Documents
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm font-medium text-black/60 hover:text-[#FF007F] transition-colors group min-h-[44px]">
                            <ArrowLeft size={16} className="transition-transform" />
                            Back to Home
                        </Link>
                    </div>

                    <nav
                        ref={navRef}
                        data-lenis-prevent
                        className="mt-4 -mx-5 flex gap-2 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activePage === item.component;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    ref={isActive ? activeRef : null}
                                    className={`border-2 border-black shrink-0 inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-box-sm transition-colors duration-200 group ${isActive ? 'bg-pink-600 text-black' : "text-black/60 hover:bg-pink-50 hover:text-[#FF007F]"}`}
                                >
                                    <Icon size={16} className={isActive ? "text-black" : "text-black/60 group-hover:text-[#FF007F]"} />
                                    <span className="whitespace-nowrap">{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="bg-white md:bg-[#FDFCFD]">
                <div className="min-h-[80dvh]">
                    {children}
                </div>
            </main>

            <div className="border-t-2 border-black bg-gray-50/50">
                <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-1">
                        <p className="text-[12px] font-bold text-black/60 uppercase tracking-wider">
                            Last Updated
                        </p>
                        <p className="text-xs text-black/80 font-medium">
                            April 2026
                        </p>
                    </div>
                    <p className="text-[12px] text-black/60 font-medium">
                        © {new Date().getFullYear()} Spenny Piggy. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
