import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    Wallet, 
    TrendingUp, 
    TrendingDown, 
    Calculator, 
    FileText, 
    Download, 
    Plus, 
    AlertTriangle, 
    CheckCircle,
    Building2,
    Pencil,
    
    BarChart3,
    Users,
    ChevronRight,
    PieChart,
    ShieldCheck,
    ScrollText,
    HelpCircle,
    RefreshCw
} from 'lucide-react';
import { 
    
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export default function Dashboard({ auth, summary, tax_estimate, tax_year, date_range, tax_band_label, display_currency, profile, recent_transactions, analytics, top_supporters, status_breakdown = [], reserve_breakdown = [], reserve_reason, payout_history = [] }) {
    const [isEditingProfile, setIsEditingProfile] = useState(false);

    const { post: refreshPost, processing: refreshProcessing } = useForm({});

    const displayCurrency = display_currency || summary?.currency || auth?.user?.default_currency || 'GBP';

    const { data, setData, post, processing } = useForm({
        business_name: profile?.business_name || '',
        business_address_line1: profile?.business_address_line1 || '',
        business_city: profile?.business_city || '',
        business_postal_code: profile?.business_postal_code || '',
        vat_registered: profile?.vat_registered || false,
        vat_registration_number: profile?.vat_registration_number || '',
        tax_percentage: profile?.tax_percentage || 20,
    });

    const submitProfile = (e) => {
        e.preventDefault();
        post(route('financial.profile.update'), {
            onSuccess: () => setIsEditingProfile(false),
        });
    };

    const formatCurrency = (amount, currency = 'GBP') => {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: currency || 'GBP',
        }).format(Number(amount || 0));
    };

    const chartData = analytics?.monthly?.map(item => ({
        name: new Date(item.month + '-01').toLocaleDateString('en-GB', { month: 'short' }),
        total: parseFloat(item.total)
    })) || [];

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Financial Dashboard" />

            <div className='container mx-auto '>
                <div className="py-8 px-4 sm:px-6 lg:px-8  space-y-8">
                    {/* Header Section */}
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col lg:flex-row lg:justify-between items-start md:items-center gap-4">
                            <div className='w-full lg:w-full'>
                                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Financial Hub</h1>
                                <p className="text-sm md:text-base text-gray-400 mt-1">Real-time tax tracking and business insights.</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="bg-[#F94F96]/10 text-[#F94F96] text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-[#F94F96]/20">
                                        Tax Year {tax_year}
                                    </span>
                                    <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                                        {date_range?.start} — {date_range?.end}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 font-bold">You keep 100% of what you earn. Supporters cover all fees.</p>
                                <p className="text-xs text-gray-500 mt-1 font-bold">Payouts are sent every Friday.</p>
                            </div>
                            <div className="md:flex w-full  justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        console.log('Refreshing records...');
                                        refreshPost(route('financial.refresh'), { 
                                            preserveScroll: true,
                                            onSuccess: () => console.log('Refresh successful'),
                                            onError: (err) => console.error('Refresh failed', err)
                                        });
                                    }}
                                    disabled={refreshProcessing}
                                    className="mb-3 w-full md:w-fit flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl md:rounded-[30px] font-medium transition-all border border-gray-700 !text-[14px]  " >
                                    <RefreshCw size={18} className={refreshProcessing ? 'animate-spin' : ''} />
                                    <span>{refreshProcessing ? 'Refreshing…' : 'Refresh Records'}</span>
                                </button>
                                <Link 
                                    href={route('financial.expenses.index')} 
                                    className="mb-3 flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#F94F96] hover:bg-[#d83a7c] text-white px-4 py-2.5 rounded-xl md:rounded-[30px] font-medium transition-all shadow-lg shadow-pink-500/20 !text-[14px]  "
                                >
                                    <Plus size={18} />
                                    <span>Log Expense</span>
                                </Link>
                                <a 
                                    href={route('financial.export.csv')} 
                                    target="_blank"
                                    className="mb-3 flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2.5 rounded-xl md:rounded-[30px] font-medium transition-all border border-gray-700 !text-[14px]  "
                                >
                                    <Download size={18} />
                                    <span>Export CSV</span>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 md:p-6 rounded-[25px] md:rounded-[30px] border border-gray-700/50 relative overflow-hidden group hover:border-gray-600 transition-colors shadow-xl">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Wallet size={80} />
                            </div>
                            <div className="relative z-10">
                                <div className="text-gray-400 text-normal font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-green-400" />
                                    Gross Earnings ({tax_year})
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-white mt-2">{formatCurrency(summary.gross_income, displayCurrency)}</div>
                                <div className="text-[12px] text-gray-500 mt-2 font-bold">Total sent to you by supporters.</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 md:p-6 rounded-[25px] md:rounded-[30px] border border-gray-700/50 relative overflow-hidden group hover:border-[#05EFB8]/30 transition-colors shadow-xl">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <CheckCircle size={80} className="text-[#05EFB8]" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-gray-400 text-normal font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#05EFB8]"></div>
                                    Net Earnings
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-[#05EFB8] mt-2">{formatCurrency(summary.profit, displayCurrency)}</div>
                                <div className="text-[12px] text-gray-500 mt-2 font-bold">What you keep after expenses.</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 md:p-6 rounded-[25px] md:rounded-[30px] border border-gray-700/50 relative overflow-hidden group hover:border-red-500/30 transition-colors shadow-xl">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <TrendingDown size={80} className="text-red-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-gray-400 text-normal font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                    Expenses
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-red-400 mt-2">{formatCurrency(summary.expenses, displayCurrency)}</div>
                                <div className="text-[12px] text-gray-500 mt-2 font-bold">Optional costs you track for your own records.</div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-5 md:p-6 rounded-[25px] md:rounded-[30px] border border-gray-700/50 relative overflow-hidden group hover:border-yellow-500/30 transition-colors shadow-xl">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Calculator size={80} className="text-yellow-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="text-gray-400 text-normal font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                    Est. Tax
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-yellow-400 mt-2">{formatCurrency(tax_estimate, displayCurrency)}</div>
                                <div className="mt-2 flex flex-col gap-1">
                                    <div className="text-[14px] text-gray-500 bg-yellow-500/10 text-yellow-500 font-bold inline-block px-2 py-1 rounded uppercase w-fit">
                                        Set aside {formatCurrency(tax_estimate/12, displayCurrency)}/mo
                                    </div>
                                <div className="text-[12px] text-gray-400 italic">
                                    Based on UK Tax Bands {tax_band_label || '2024/25'}
                                </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Payment Status Breakdown */}
                    {(() => {
                        const STATUS_CONFIG = [
                            { key: 'completed', label: 'Paid',        color: '#22c55e', bg: 'bg-green-500/10',  border: 'border-green-500/20',  text: 'text-green-400',  inPayout: true,  note: 'Included in payout' },
                            { key: 'pending',   label: 'Pending',     color: '#facc15', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', inPayout: false, note: 'Awaiting confirmation' },
                            { key: 'review_hold', label: 'Review Hold', color: '#a78bfa', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400', inPayout: false, note: 'Not in payout or reserve' },
                            { key: 'disputed',  label: 'Disputed',    color: '#f97316', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', inPayout: false, note: 'Not in payout or reserve' },
                            { key: 'refunded',  label: 'Refunded',    color: '#ef4444', bg: 'bg-red-500/10',    border: 'border-red-500/20',    text: 'text-red-400',    inPayout: false, note: 'Deducted from future payout' },
                        ];

                        const statusMap = {};
                        status_breakdown.forEach(s => { statusMap[s.status] = s; });

                        return (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {STATUS_CONFIG.map(({ key, label, bg, border, text, inPayout, note }) => {
                                        const s = statusMap[key];
                                        return (
                                            <div className={`bg-gray-900/40  border-2 ${border} !rounded-[25px]  overflow-hidden  `}>
                                            <div key={key} className={`p-4 ${bg}  flex flex-col gap-1`}>
                                                <div className={`text-[16px] font-bold uppercase tracking-widest ${text}`}>{label}</div>
                                                <div className="text-2xl font-bold text-white">{formatCurrency(s?.total ?? 0, displayCurrency)}</div>
                                                <div className="text-[15px] text-gray-500">{s?.count ?? 0} payment{(s?.count ?? 0) !== 1 ? 's' : ''}</div>
                                                <div className={`text-[10px] font-semibold mt-1 ${inPayout ? 'text-green-500' : 'text-gray-500'}`}>
                                                    {inPayout ? '✓ In payout' : `✗ ${note}`}
                                                </div>
                                            </div>
                                            </div>
                                        );
                                    })}
                                </div>
                        );
                    })()}

                    <div className="bg-gradient-to-br flex gap-6 from-gray-900 to-gray-800 p-5 md:p-6 rounded-[25px] md:rounded-[30px] border border-gray-700/50 relative overflow-hidden group hover:border-blue-500/30 transition-colors shadow-xl">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShieldCheck size={80} className="text-blue-500" />
                        </div>
                        <div className="relative z-10 gap-6">
                            <div className='pb-6'>
                                <div className="text-gray-400 text-normal font-bold uppercase tracking-wider mb-1 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    Held Reserves
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-blue-400 mt-2">{formatCurrency(summary.held_reserves, displayCurrency)}</div>
                                <div className="text-[12px] text-gray-500 mt-2">
                                    {reserve_reason || 'Standard rolling reserve for platform safety.'}
                                </div>
                                {reserve_breakdown.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                        {reserve_breakdown.slice(0, 3).map((r, i) => (
                                            <div key={i} className="bg-gray-800/60 rounded-lg px-2 py-1.5 text-[10px]">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-300 font-bold truncate max-w-[120px]" title={r.source_name}>
                                                        {r.source_name}
                                                    </span>
                                                    <span className="text-blue-300 font-bold ml-2 whitespace-nowrap">
                                                        {formatCurrency(r.amount / 100, displayCurrency)}
                                                    </span>
                                                </div>
                                                <div className="text-gray-500 mt-0.5">
                                                    Releases: {r.release_date}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* <Link href={route('creator.finance.review_holds')} className="block group/holds">
                                <div className="text-gray-400 text-normal font-bold uppercase tracking-wider mb-1 flex items-center gap-2 group-hover/holds:text-gray-300 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    Review Holds
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-purple-400 mt-2 group-hover/holds:text-purple-300 transition-colors">{formatCurrency(summary.review_holds, displayCurrency)}</div>
                                <div className="text-[12px] text-gray-500 mt-2 font-bold group-hover/holds:text-gray-400 transition-colors">Verified by our team.</div>
                            </Link>
                            <Link href={route('creator.disputes.index')} className="block group/disputes">
                                <div className="text-gray-400 text-normal font-bold uppercase tracking-wider mb-1 flex items-center gap-2 group-hover/disputes:text-gray-300 transition-colors">
                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                    Disputes
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-orange-400 mt-2 group-hover/disputes:text-orange-300 transition-colors">{formatCurrency(summary.disputes, displayCurrency)}</div>
                                <div className="text-[12px] text-gray-500 mt-2 font-bold group-hover/disputes:text-gray-400 transition-colors">Flagged by banks.</div>
                            </Link> */}
                        </div>
                        <div className=" flex justify-between  ">
                            <div>
                                <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Expected Next Payout</div>
                                <div className="text-xl font-bold text-white">{formatCurrency(summary.payoutable_balance, displayCurrency)}</div>
                                <div className="text-[10px] text-gray-600 mt-1">
                                    Paid out every Friday. {summary.carry_over_amount > 0 ? `Includes ${formatCurrency(summary.carry_over_amount, displayCurrency)} from previous tax year.` : ''} {summary.has_adjustment ? 'Includes recovery for previous payouts.' : 'Excludes reserves, holds & disputes.'}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] uppercase text-gray-500 font-bold mb-1">Status</div>
                                <div className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-1 rounded-md uppercase">Healthy</div>
                            </div>
                        </div>
                    </div>

                    {/* Tax Year Progress & Savings Tip */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-[#1e1e1e] p-6 rounded-[20px] md:rounded-[30px] border border-gray-800 shadow-xl">
                            <h3 className="text-white font-bold text-normal mb-4 flex items-center gap-2">
                                <TrendingUp size={16} className="text-[#F94F96]" />
                                Tax Year Progress ({tax_year})
                            </h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-normal text-gray-400 mb-1">
                                    <span>April 6</span>
                                    <span>April 5</span>
                                </div>
                                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                    {(() => {
                                        const now = new Date();
                                        const year = now.getMonth() < 3 || (now.getMonth() === 3 && now.getDate() < 6) ? now.getFullYear() - 1 : now.getFullYear();
                                        const start = new Date(year, 3, 6);
                                        const end = new Date(year + 1, 3, 5);
                                        const progress = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
                                        return (
                                            <div className="bg-gradient-to-r from-[#F94F96] to-[#ff7eb3] h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                        );
                                    })()}
                                </div>
                                <p className="text-[14px] text-gray-500 mt-2 italic text-center">
                                    Tip: High income months? Increase your tax set-aside to avoid surprises in January.
                                </p>
                            </div>
                        </div>

                        <div className="bg-[#1e1e1e] p-6 rounded-[20px] md:rounded-[30px] border border-gray-800 shadow-xl">
                            <h3 className="text-white font-bold text-normal mb-4 flex items-center gap-2">
                                <AlertTriangle size={16} className="text-yellow-500" />
                                Financial Health Tip
                            </h3>
                            <div className="flex items-start gap-4">
                                <div className="bg-yellow-500/10 p-3 rounded-2xl">
                                    <Calculator size={24} className="text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-gray-300 text-normal leading-relaxed">
                                        {summary.expenses > (summary.gross_income * 0.3) 
                                            ? "Your expenses are quite high (over 30% of gross). Review your categorized expenses to ensure all are legitimate business deductions for HMRC."
                                            : "Your profit margins look healthy. Consider reinvesting a portion into equipment or software to offset your future tax liability."}
                                    </p>
                                    <Link href={route('financial.expenses.index')} className="text-[#F94F96] text-[10px] font-bold uppercase mt-2 inline-block hover:underline">
                                        Review Expenses
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Analytics Chart */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 p-6 shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <BarChart3 className="text-[#F94F96]" size={20} />
                                        Earnings Trend
                                    </h2>
                                    <span className="text-xs text-gray-500 font-medium bg-gray-800 px-3 py-1 rounded-full">{tax_year}</span>
                                </div>
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#F94F96" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="#F94F96" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                            <XAxis dataKey="name" stroke="#d1d5db" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#d1d5db" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}`} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fff' }}
                                                formatter={(value) => [formatCurrency(value), 'Earnings']}
                                            />
                                            <Area type="monotone" dataKey="total" stroke="#F94F96" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Top Supporters Breakdown */}
                            <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800  shadow-xl">
                                <div className="flex justify-between p-6 items-center ">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Users className="text-[#05EFB8]" size={20} />
                                        Top Supporters
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-500/10">
                                            <tr className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">
                                                <th className="px-6 py-4">Supporter</th>
                                                <th className="px-6 py-4 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {top_supporters?.map((supporter) => (
                                                <tr key={supporter.supporter_id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 text-sm flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                                                            {supporter.supporter.avatar_url ? (
                                                                <img src={supporter.supporter.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-bold text-gray-400">{supporter.supporter.name[0]}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="text-gray-200 font-medium">{supporter.supporter.name}</div>
                                                                {supporter.has_hold && (
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shrink-0" title="Contains held/disputed funds"></div>
                                                                )}
                                                            </div>
                                                            <div className="text-[14px] text-gray-500">@{supporter.supporter.username}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-right font-bold text-white">
                                                        {formatCurrency(supporter.total_spent)}
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!top_supporters || top_supporters.length === 0) && (
                                                <tr>
                                                    <td colSpan="2" className="px-6 py-8 text-center text-gray-500 text-sm">
                                                        No supporter data available yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payout History */}
                            <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 overflow-hidden shadow-xl mb-8">
                                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Wallet className="text-green-400" size={20} />
                                        Payout History
                                    </h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-500/10">
                                            <tr className="text-gray-500 text-[13px] uppercase font-bold tracking-widest">
                                                <th className="px-6 py-4">Requested On</th>
                                                <th className="px-6 py-4">Amount</th>
                                                <th className="px-6 py-4">Expected Arrival</th>
                                                <th className="px-6 py-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {payout_history.length > 0 ? (
                                                payout_history.map((p) => (
                                                    <tr key={p.uuid} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4 text-[14px] text-gray-200 font-medium">
                                                            {p.date}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-white">
                                                            {formatCurrency(p.amount, p.currency)}
                                                        </td>
                                                        <td className="px-6 py-4 text-[14px] text-gray-400">
                                                            {p.arrival_date || 'Processing…'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-right">
                                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                                p.status === 'paid' ? 'bg-green-500/10 text-green-400' : 
                                                                p.status === 'in_transit' ? 'bg-blue-500/10 text-blue-400' : 
                                                                p.status === 'failed' ? 'bg-red-500/10 text-red-400' : 
                                                                'bg-yellow-500/10 text-yellow-400'
                                                            }`}>
                                                                {p.status === 'in_transit' ? 'In Bank Soon' : p.status?.replace('_', ' ')}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 text-sm">
                                                        No payouts have been processed yet.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 overflow-hidden shadow-xl">
                                <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <FileText className="text-gray-400" size={20} />
                                        Ledger History ({tax_year})
                                    </h2>
                                    <Link href={route('financial.history', { year: tax_year?.split('-')[0] })} className="text-xs text-[#F94F96] hover:text-[#d83a7c] font-bold uppercase tracking-wider flex items-center gap-1 group">
                                        Full History <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-500/10">
                                            <tr className="text-gray-500 text-[13px] uppercase font-bold tracking-widest">
                                                <th className="px-6 py-4">Date</th>
                                                <th className="px-6 py-4">Supporter</th>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4 text-right">Amount</th>
                                                <th className="px-6 py-4 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {recent_transactions.map((tx) => (
                                                <tr key={tx.uuid} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-6 py-4 text-[14px] text-gray-400 whitespace-nowrap">
                                                        {new Date(tx.transaction_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        {tx.supporter ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-gray-200 font-medium capitalize">{tx.supporter.name}</span>
                                                                <span className="text-[15px] text-gray-500">@{tx.supporter.username}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-500 italic text-[14px] capitalize">Guest / System</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <div className="font-medium text-gray-200">{tx.description}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="text-[14px] text-gray-500 font-bold uppercase">
                                                                {tx.label || tx.source_type?.split('\\').pop().replace('Payment', '').replace('Purchase', '') || 'Manual'}
                                                            </div>
                                                            {tx.reserve_amount > 0 && (
                                                                <div className={`flex flex-col gap-0.5 px-1.5 py-1 rounded border ${
                                                                    tx.reserve_status === 'released'
                                                                        ? 'bg-green-500/5 border-green-500/20 text-green-500'
                                                                        : 'bg-blue-500/5 border-blue-500/20 text-blue-400'
                                                                }`}>
                                                                    <span className="text-[10px] font-bold uppercase">
                                                                        {tx.reserve_status === 'released' ? '✓ Reserve Settled' : `🔒 ${tx.reserve_percent}% Reserved`}
                                                                    </span>
                                                                    <span className="text-[10px] font-semibold">
                                                                        {formatCurrency(tx.reserve_amount, tx.currency)} of your earnings
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                <td className={`px-4 md:px-6 py-4 text-sm text-right font-mono font-bold whitespace-nowrap ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.type === 'income' ? tx.net_amount : tx.gross_amount, tx.currency)}
                                                </td>
                                                    <td className="px-6 py-4 text-sm text-right">
                                                        <div className="flex flex-col items-end gap-1">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                                                tx.status === 'completed' ? 'bg-green-500/10 text-green-400' : 
                                                                tx.status === 'review_hold' ? 'bg-purple-500/10 text-purple-400' : 
                                                                tx.status === 'disputed' ? 'bg-orange-500/10 text-orange-400' : 
                                                                tx.status === 'refunded' ? 'bg-red-500/10 text-red-400' : 
                                                                tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' : 
                                                                'bg-gray-500/10 text-gray-400'
                                                            }`}>{tx.status?.replace('_', ' ')}
                                                            </span>
                                                            {tx.type === 'income' && tx.uuid && !String(tx.uuid).startsWith('exp-') && (
                                                                <a 
                                                                    href={route('financial.evidence-pack', { uuid: tx.uuid })} 
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[10px] font-bold uppercase tracking-widest text-[#F94F96] hover:text-[#d83a7c] flex items-center gap-1 mt-1"
                                                                >
                                                                    <FileText size={10} />
                                                                    Evidence Pack
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Profile & Top Supporters */}
                        <div className="space-y-8">
                            {/* Business Settings */}
                            <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 p-6 shadow-xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Building2 className="text-gray-400" size={20} />
                                        Business Profile
                                    </h2>
                                    {!isEditingProfile && (
                                        <button onClick={() => setIsEditingProfile(true)} className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg">
                                            <Pencil size={18} />
                                        </button>
                                    )}
                                </div>

                                {isEditingProfile ? (
                                    <form onSubmit={submitProfile} className="space-y-4 animate-fading">
                                        <div>
                                            <label className="block text-[10px] uppercase text-gray-500 font-bold mb-1.5">Business Name</label>
                                            <input 
                                                type="text" 
                                                value={data.business_name}
                                                onChange={e => setData('business_name', e.target.value)}
                                                className="w-full bg-[#2a2a2a] border-gray-700 rounded-lg text-white text-sm focus:ring-[#F94F96] focus:border-[#F94F96] p-2.5"
                                                placeholder="Legal Name or Trading As"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-2">
                                            <button type="button" onClick={() => setIsEditingProfile(false)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-white transition-colors">
                                                Cancel
                                            </button>
                                            <button type="submit" disabled={processing} className="px-4 py-1.5 bg-[#F94F96] text-white text-xs font-bold rounded-lg hover:bg-[#d83a7c] transition-colors">
                                                Save Changes
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-4">
                                            <div>
                                                <span className="block text-[13px] text-gray-500 uppercase font-bold mb-1">Entity Name</span>
                                                <span className="text-gray-100 font-bold block">{profile?.business_name || auth.user.name}</span>
                                            </div>
                                            <div className="pt-2">
                                                <Link 
                                                    href={route('financial.statement')} 
                                                    className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-[20px] md:rounded-[30px] font-bold hover:bg-gray-200 transition-all group"
                                                >
                                                    <FileText size={16} />
                                                    Download Tax Statement
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Income Sources */}
                            <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 p-6 shadow-xl">
                                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <PieChart className="text-[#F94F96]" size={20} />
                                    Income by Type
                                </h2>

                                {/* All 6 tracked types — zero if no data yet */}
                                {(() => {
                                    const ALL_TYPES = [
                                        { key: 'Support/Tip',    emoji: '💝', color: '#F94F96' },
                                        { key: 'Wish Gift',      emoji: '🛒', color: '#05EFB8' },
                                        { key: 'Bill',           emoji: '📄', color: '#60a5fa' },
                                        { key: 'Membership',     emoji: '⭐', color: '#a78bfa' },
                                        { key: 'Task',           emoji: '✅', color: '#fbbf24' },
                                        { key: 'Shop Purchase',  emoji: '🛍️', color: '#fb923c' },
                                    ];

                                    const typeMap = {};
                                    analytics?.tribute_types?.forEach(t => {
                                        typeMap[t.label] = t;
                                    });

                                    return (
                                        <div className="space-y-3">
                                            {ALL_TYPES.map(({ key, emoji, color }) => {
                                                const t = typeMap[key];
                                                const total = t?.total ?? 0;
                                                const count = t?.count ?? 0;
                                                const percentage = summary.gross_income > 0 ? (total / summary.gross_income) * 100 : 0;

                                                return (
                                                    <div key={key} className="bg-gray-800/40 rounded-[20px] p-3 border border-gray-700/50">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <div className="flex items-center gap-2"> 
                                                                <span className="text-base leading-none">{emoji}</span>
                                                                <span className="text-sm font-semibold text-gray-200">{key}</span>
                                                            </div>
                                                            <span className="text-sm font-bold text-white">{formatCurrency(total, displayCurrency)}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-700 rounded-full h-1 mb-1.5">
                                                            <div
                                                                className="h-1 rounded-full transition-all duration-700"
                                                                style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[11px] text-gray-500">{count} payment{count !== 1 ? 's' : ''}</span>
                                                            <span className="text-[11px] font-bold" style={{ color }}>{percentage.toFixed(1)}%</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </div>
                            
                            {/* Tax & Financial Records */}
                            <div className="bg-[#1e1e1e] rounded-[20px] md:rounded-[30px] border border-gray-800 p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                    <ScrollText size={100} className="text-[#F94F96]" />
                                </div>
                                
                                <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2 relative z-10">
                                    <ShieldCheck className="text-[#05EFB8]" size={20} />
                                    Tax & Financial Records
                                </h2>
                                
                                <p className="text-normal text-gray-400 mb-6 leading-relaxed relative z-10">
                                    Spenny Piggy helps organise your earnings with downloadable statements, payout history, and tax-ready records for your accountant or filing process.
                                </p>

                                <div className="flex items-start gap-2 bg-gray-900/40 border border-gray-800 rounded-[20px] p-3 mb-5 relative z-10">
                                    <HelpCircle size={22} className="!w-6 !h-6 min-w-6 min-h-6 text-gray-500 mt-0.5" />
                                    <p className="text-[15px] text-gray-400 leading-relaxed">
                                        If any record is missing, tap <span className="font-bold text-gray-200">Refresh Records</span> to sync latest payments (this sync also runs automatically every 30 minutes).
                                    </p>
                                </div>

                                <div className="space-y-4 relative z-10">
                                    {/* Income Statement */}
                                    <div className="group bg-gray-800/40 hover:bg-gray-800 rounded-[20px] md:rounded-[30px] p-4 border border-gray-700/50 hover:border-gray-600 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <FileText size={12} className="text-[#F94F96]" />
                                                    <span className="text-[14px] text-gray-500 uppercase font-bold tracking-wider">For Your Accountant</span>
                                                </div>
                                                <h4 className="text-normal font-bold text-white group-hover:text-[#F94F96] transition-colors">Income Statement</h4>
                                            </div>
                                        </div>
                                        <p className="text-[15px] text-gray-300 mb-3 italic">
                                            “How much did I earn? What do I give my accountant?”
                                        </p>
                                        <Link 
                                            href={route('financial.statement')} 
                                            className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-[#F94F96] text-white py-2 rounded-lg text-xs font-bold transition-all"
                                        >
                                            <Download size={14} /> Download Statement
                                        </Link>
                                    </div>

                                    {/* Verified Certificate */}
                                    <div className="group bg-gray-800/40 hover:bg-gray-800 rounded-[20px] md:rounded-[30px] p-4 border border-gray-700/50 hover:border-gray-600 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <CheckCircle size={12} className="text-[#05EFB8]" />
                                                    <span className="text-[14px] text-gray-500 uppercase font-bold tracking-wider">Proof of Income</span>
                                                </div>
                                                <h4 className="text-normal font-bold text-white group-hover:text-[#05EFB8] transition-colors">Verified Certificate</h4>
                                            </div>
                                        </div>
                                        <p className="text-[15px] text-gray-300 mb-3 italic">
                                            “What can I use as official proof of income?”
                                        </p>
                                        <Link 
                                            href={route('financial.certificate')} 
                                            className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-[#05EFB8] text-white py-2 rounded-lg text-xs font-bold transition-all"
                                        >
                                            <Download size={14} /> Download Certificate
                                        </Link>
                                    </div>

                                    {/* Transaction History */}
                                    <div className="group bg-gray-800/40 hover:bg-gray-800 rounded-[20px] md:rounded-[30px] p-4 border border-gray-700/50 hover:border-gray-600 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <TrendingUp size={12} className="text-yellow-500" />
                                                    <span className="text-[14px] text-gray-500 uppercase font-bold tracking-wider">Payout Status</span>
                                                </div>
                                                <h4 className="text-normal font-bold text-white group-hover:text-yellow-400 transition-colors">Transaction History</h4>
                                            </div>
                                        </div>
                                        <p className="text-[15px] text-gray-300 mb-3 italic">
                                            “What was paid out vs still pending?”
                                        </p>
                                        <Link 
                                            href={route('financial.history')} 
                                            className="flex items-center justify-center gap-2 w-full bg-gray-700 hover:bg-yellow-500 text-white py-2 rounded-lg text-xs font-bold transition-all"
                                        >
                                            <ChevronRight size={14} /> View Full History
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
