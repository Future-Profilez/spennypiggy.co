import { Link } from "@inertiajs/react";
import { useState } from "react";
import { 
    FileText, 
    ShieldCheck, 
    Users, 
    Handshake, 
    CreditCard, 
    Wallet, 
    ClipboardList, 
    RotateCcw,
    ArrowLeft,
    ChevronRight,
    Menu,
    X
} from "lucide-react";

export default function LegalLayout({ children, activePage }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

    return (
        <div className="min-h-dvh bg-[#FDFCFD] flex flex-col md:flex-row font-poppins">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-100 p-4  z-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="border-2 border-black w-8 h-8 bg-pink-600 rounded-box-xs flex items-center justify-center">
                        <ShieldCheck className="text-white" size={16} />
                    </div>
                    <span className="font-bold text-gray-900 text-sm tracking-tight uppercase">Legal Center</span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-black/60 hover:text-[#FF007F] transition-colors"
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside
                data-lenis-prevent
                className={`w-full md:w-72 shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-100 md:sticky md:top-0 md:h-dvh md:overflow-y-auto transition-all duration-300
                ${isMobileMenuOpen ? 'block' : 'hidden md:block'} `}>
                <div className="p-6">
                    <Link 
                        href="/"  
                        className="inline-flex items-center gap-2 text-sm font-medium text-black/60 hover:text-[#FF007F] transition-colors mb-8 group min-h-[44px]" >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>

                    <div className="mb-8">
                        <div className="hidden md:flex items-center gap-3 mb-8">
                            <div className="border-2 border-black w-10 h-10 bg-pink-600 rounded-box-sm flex items-center justify-center">
                                <ShieldCheck className="text-white" size={20} />
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

                        <nav className="space-y-1.5">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = activePage === item.component;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`border-[3px] border-black flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-box transition-all duration-200 group ${ isActive ? 'bg-pink-600 text-white translate-x-1' : "text-black/60 hover:bg-pink-50 hover:text-[#FF007F]" }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} className={isActive ? "text-white" : "text-black/60 group-hover:text-[#FF007F]"} />
                                            {item.name}
                                        </div>
                                        {isActive && <ChevronRight size={14} className="text-white/70" />}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
                
                <div className="mt-auto p-6 border-t border-gray-50 bg-gray-50/50">
                    <div className="space-y-1">
                        <p className="text-[12px] font-bold text-black/60 uppercase tracking-wider">
                            Last Updated
                        </p>
                        <p className="text-xs text-black/80 font-medium">
                            April 2026
                        </p>
                    </div>
                    <p className="text-[12px] text-black/60 mt-4 font-medium">
                        © {new Date().getFullYear()} Spenny Piggy. <br />All rights reserved.
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 min-w-0 bg-white md:bg-[#FDFCFD]">
                <div className="">
                    <div className="min-h-[80dvh]">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

