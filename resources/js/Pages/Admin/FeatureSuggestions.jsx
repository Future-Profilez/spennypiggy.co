import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { route } from 'ziggy-js';

const STATUS_LABELS = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
    under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800' },
    planned: { label: 'Planned', color: 'bg-indigo-100 text-indigo-800' },
    rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
};

function StatusBadge({ status }) {
    const s = STATUS_LABELS[status] ?? STATUS_LABELS.pending;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.color}`}>
            {s.label}
        </span>
    );
}

function StatusModal({ suggestion, onClose }) {
    const { data, setData, patch, processing } = useForm({
        status: suggestion.status ?? 'pending',
        admin_notes: suggestion.admin_notes ?? '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('admin.feature-suggestions.update-status', suggestion.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Status updated.');
                onClose();
            },
            onError: () => toast.error('Failed to update status.'),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-box w-full max-w-md mx-4 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-500" />
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-1">Update Status</h3>
                    <p className="text-sm text-black/60 mb-4 line-clamp-2">{suggestion.suggestion}</p>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 uppercase mb-1">Status</label>
                            <select
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="w-full border border-gray-200 rounded-box-sm px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-700 uppercase mb-1">
                                Admin Notes <span className="text-black/60 normal-case">(sent to user if status is "planned" or "under review")</span>
                            </label>
                            <textarea
                                value={data.admin_notes}
                                onChange={(e) => setData('admin_notes', e.target.value)}
                                rows={3}
                                className="w-full border border-gray-200 rounded-box-sm px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Internal note or message to the user..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-box-sm transition-colors disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default function FeatureSuggestions({ auth, suggestions, filters }) {
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState(filters?.search ?? '');
    const [statusFilter, setStatusFilter] = useState(filters?.status ?? '');

    const applyFilters = (overrides = {}) => {
        const params = {
            search: overrides.search ?? search,
            status: overrides.status ?? statusFilter,
        };
        // strip empty values
        Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
        router.get(route('admin.feature-suggestions.index'), params, { preserveState: true, replace: true });
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') applyFilters();
    };

    const handleStatusFilter = (val) => {
        setStatusFilter(val);
        applyFilters({ status: val });
    };

    const items = suggestions.data ?? [];

    return (
        <AuthenticatedLayout auth={auth}>
            <Head title="Feature Suggestions" />

            {editing && (
                <StatusModal suggestion={editing} onClose={() => setEditing(null)} />
            )}

            <div className="py-10 bg-gray-50 min-h-dvh">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Feature Suggestions</h1>
                            <p className="text-sm text-black/60 mt-0.5">
                                {suggestions.total} total suggestion{suggestions.total !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-box border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleSearchKeyDown}
                            placeholder="Search by keyword, name or email… (press Enter)"
                            className="flex-1 border border-gray-200 rounded-box-sm px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => handleStatusFilter(e.target.value)}
                            className="border border-gray-200 rounded-box-sm px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">All Statuses</option>
                            {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                                <option key={val} value={val}>{label}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => applyFilters()}
                            className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-box-sm transition-colors"
                        >
                            Search
                        </button>
                        {(filters?.search || filters?.status) && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('');
                                    router.get(route('admin.feature-suggestions.index'), {}, { replace: true });
                                }}
                                className="px-5 py-2 text-sm text-black/60 hover:text-gray-800 rounded-box-sm border border-gray-200 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="bg-white overflow-hidden rounded-box border border-gray-100">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-black/60 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-black/60 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-black/60 uppercase tracking-wider">Suggestion</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-black/60 uppercase tracking-wider">Image</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-black/60 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-black/60 uppercase tracking-wider">Notes</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-black/60 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {items.map((suggestion) => (
                                        <tr key={suggestion.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black/60">
                                                {new Date(suggestion.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {suggestion.name || suggestion.user?.name || 'Guest'}
                                                </div>
                                                <div className="text-xs text-black/60">
                                                    {suggestion.email || suggestion.user?.email || 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-sm">
                                                <p className="whitespace-pre-wrap line-clamp-3">{suggestion.suggestion}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {suggestion.image_url ? (
                                                    <a href={suggestion.image_url} target="_blank" rel="noopener noreferrer">
                                                        <img
                                                            src={suggestion.image_url}
                                                            alt="Suggestion"
                                                            className="h-12 w-12 object-cover rounded-box-sm border transition-opacity duration-200 hover:opacity-80"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                    </a>
                                                ) : (
                                                    <span className="text-black/60 text-xs">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={suggestion.status} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-black/60 max-w-xs">
                                                {suggestion.admin_notes
                                                    ? <p className="line-clamp-2 text-xs">{suggestion.admin_notes}</p>
                                                    : <span className="text-black/60 text-xs">—</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <button
                                                    onClick={() => setEditing(suggestion)}
                                                    className="text-xs px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-box-sm transition-colors font-medium"
                                                >
                                                    Update
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {items.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-14 text-center text-black/60">
                                                No suggestions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {suggestions.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-sm text-black/60">
                                    Showing {suggestions.from}–{suggestions.to} of {suggestions.total}
                                </p>
                                <div className="flex gap-2">
                                    {suggestions.links.map((link, i) => (
                                        <button
                                            key={i}
                                            disabled={!link.url}
                                            onClick={() => link.url && router.get(link.url)}
                                            className={`px-3 py-1.5 text-xs rounded-box-sm transition-colors ${
                                                link.active
                                                    ? 'bg-purple-600 text-white'
                                                    : link.url
                                                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    : 'bg-gray-50 text-black/60 cursor-not-allowed'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
