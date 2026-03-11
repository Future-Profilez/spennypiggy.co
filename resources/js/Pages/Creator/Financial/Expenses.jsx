import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { 
    Trash2, 
    Plus, 
    Search, 
    ArrowLeft, 
    Filter, 
    Calendar, 
    Tag, 
    FileText, 
    PoundSterling,
    X,
    Save
} from 'lucide-react';

export default function Expenses({ auth, expenses, filters }) {
    const [isAdding, setIsAdding] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        category: '',
        description: '',
        amount: '',
        currency: 'GBP',
        expense_date: new Date().toISOString().split('T')[0],
        receipt_url: ''
    });

    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e) => {
        e.preventDefault();
        router.get(route('financial.expenses.index'), { search }, { preserveState: true });
    };

    const submitExpense = (e) => {
        e.preventDefault();
        post(route('financial.expenses.store'), {
            onSuccess: () => {
                setIsAdding(false);
                reset();
            }
        });
    };

    const deleteExpense = (id) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            router.delete(route('financial.expenses.destroy', id));
        }
    };

    const categories = [
        { id: 'Equipment', label: 'Equipment', color: 'bg-blue-500/10 text-blue-400' },
        { id: 'Software', label: 'Software & Subscriptions', color: 'bg-purple-500/10 text-purple-400' },
        { id: 'Marketing', label: 'Marketing', color: 'bg-pink-500/10 text-pink-400' },
        { id: 'Travel', label: 'Travel', color: 'bg-orange-500/10 text-orange-400' },
        { id: 'Office', label: 'Home Office', color: 'bg-green-500/10 text-green-400' },
        { id: 'Professional Services', label: 'Legal/Accounting', color: 'bg-gray-500/10 text-gray-400' },
        { id: 'Other', label: 'Other', color: 'bg-yellow-500/10 text-yellow-400' },
    ];

    const getCategoryColor = (cat) => {
        return categories.find(c => c.id === cat)?.color || 'bg-gray-700 text-gray-300';
    };

    return (
        <AuthenticatedLayout auth={auth} user={auth.user}>
            <Head title="Manage Expenses" />

            <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link href={route('financial.dashboard')} className="text-gray-400 hover:text-white flex items-center gap-2 mb-2 transition-colors">
                            <ArrowLeft size={16} /> Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-white">Expense Tracker</h1>
                    </div>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className={`px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${isAdding ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-[#F94F96] text-white hover:bg-[#d83a7c] shadow-lg shadow-pink-500/20'}`}
                    >
                        {isAdding ? <X size={20} /> : <Plus size={20} />}
                        {isAdding ? 'Close Form' : 'Log New Expense'}
                    </button>
                </div>

                {/* Add Expense Form */}
                {isAdding && (
                    <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 animate-fading shadow-xl">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <div className="bg-[#F94F96]/10 p-2 rounded-lg text-[#F94F96]">
                                <FileText size={20} />
                            </div>
                            New Expense Details
                        </h3>
                        <form onSubmit={submitExpense} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs uppercase text-gray-500 font-bold">Date</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Calendar size={18} className="text-gray-500" />
                                        </div>
                                        <input 
                                            type="date" 
                                            value={data.expense_date}
                                            onChange={e => setData('expense_date', e.target.value)}
                                            className="w-full bg-[#2a2a2a] border-gray-700 rounded-xl text-white pl-10 focus:ring-[#F94F96] focus:border-[#F94F96] p-3"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs uppercase text-gray-500 font-bold">Category</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Tag size={18} className="text-gray-500" />
                                        </div>
                                        <select 
                                            value={data.category}
                                            onChange={e => setData('category', e.target.value)}
                                            className="w-full bg-[#2a2a2a] border-gray-700 rounded-xl text-white pl-10 focus:ring-[#F94F96] focus:border-[#F94F96] p-3 appearance-none"
                                            required
                                        >
                                            <option value="">Select Category</option>
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="md:col-span-2 space-y-2">
                                    <label className="block text-xs uppercase text-gray-500 font-bold">Description</label>
                                    <input 
                                        type="text" 
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        className="w-full bg-[#2a2a2a] border-gray-700 rounded-xl text-white focus:ring-[#F94F96] focus:border-[#F94F96] p-3"
                                        placeholder="E.g. Camera lens, Adobe subscription, Train tickets..."
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs uppercase text-gray-500 font-bold">Amount (£)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <PoundSterling size={18} className="text-gray-500" />
                                        </div>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={data.amount}
                                            onChange={e => setData('amount', e.target.value)}
                                            className="w-full bg-[#2a2a2a] border-gray-700 rounded-xl text-white pl-10 focus:ring-[#F94F96] focus:border-[#F94F96] p-3 font-mono text-lg"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAdding(false)}
                                    className="px-5 py-2.5 text-gray-400 hover:text-white font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-[#F94F96] text-white rounded-xl hover:bg-[#d83a7c] font-bold shadow-lg shadow-pink-500/20 transition-all flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Filters & Search */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                        <form onSubmit={handleSearch}>
                            <input 
                                type="text" 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full bg-[#1e1e1e] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:ring-[#F94F96] focus:border-[#F94F96] transition-all"
                                placeholder="Search by description or amount..."
                            />
                        </form>
                    </div>
                    {/* Add Filter Dropdown if needed later */}
                </div>

                {/* Expense List */}
                <div className="bg-[#1e1e1e] rounded-2xl border border-gray-800 overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-900/50">
                                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Category</th>
                                    <th className="px-6 py-4 font-medium">Description</th>
                                    <th className="px-6 py-4 font-medium text-right">Amount</th>
                                    <th className="px-6 py-4 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {expenses.data.map((expense) => (
                                    <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 text-gray-300 whitespace-nowrap text-sm">
                                            {new Date(expense.expense_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getCategoryColor(expense.category)}`}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300 text-sm font-medium">{expense.description}</td>
                                        <td className="px-6 py-4 text-right text-white font-mono font-bold">
                                            £{Number(expense.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => deleteExpense(expense.id)}
                                                className="text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-red-500/10"
                                                title="Delete Expense"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {expenses.data.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="bg-gray-800 rounded-full p-4">
                                                    <Tag size={32} className="opacity-50" />
                                                </div>
                                                <p className="text-lg font-medium text-gray-400">No expenses found</p>
                                                <p className="text-sm opacity-60">Start tracking your business costs to reduce your tax bill.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {expenses.next_page_url && (
                        <div className="p-4 border-t border-gray-800 flex justify-center bg-gray-900/30">
                            <Link 
                                href={expenses.next_page_url} 
                                className="text-sm font-bold text-[#F94F96] hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-[#F94F96]/10"
                            >
                                Load More Transactions
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
