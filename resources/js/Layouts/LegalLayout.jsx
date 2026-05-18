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
    ];

    return (
        <div className="min-h-screend bg-[#FDFCFD] flex flex-col md:flex-row font-poppins">
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-100 p-4  z-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center shadow-md shadow-[4px_4px_0px_0px_#FF007F]ink-100">
                        <ShieldCheck className="text-white" size={16} />
                    </div>
                    <span className="font-bold text-gray-900 text-sm tracking-tight uppercase">Legal Center</span>
                </div>
                <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-500 hover:text-[#FF007F] transition-colors"
                >
                    {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Sidebar */}
            <aside className={`w-full md:w-72 bg-white border-b md:border-b-0 md:border-r border-gray-100    md:h-screen overflow-y-auto  transition-all duration-300
                ${isMobileMenuOpen ? 'block' : 'hidden md:block'} `}>
                <div className="p-6">
                    <Link 
                        href="/"  
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#FF007F] transition-colors mb-8 group" >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>

                    <div className="mb-8">
                        <div className="hidden md:flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-[4px_4px_0px_0px_#FF007F]ink-200">
                                <ShieldCheck className="text-white" size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-tight">
                                    Legal Center
                                </h2>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
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
                                        className={`flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-200 group ${
                                            isActive
                                                ? 'bg-pink-600 text-white shadow-md shadow-[4px_4px_0px_0px_#FF007F]ink-100 translate-x-1'
                                                : 'text-gray-500 hover:bg-pink-50 hover:text-[#FF007F]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Icon size={18} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-[#FF007F]'} />
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
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                            Last Updated
                        </p>
                        <p className="text-xs text-gray-600 font-medium">
                            April 2026
                        </p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-4 font-medium">
                        © {new Date().getFullYear()} Spenny Piggy. <br />All rights reserved.
                    </p>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-white md:bg-[#FDFCFD] min-h-screen">
                <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-8 md:py-12">
                    <div className="bg-white md:shadow-sm md:border md:border-gray-100 md:rounded-[40px] min-h-[80vh]">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}

