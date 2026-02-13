import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FiDownload, FiExternalLink, FiPackage, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function DeliveriesDashboard({ auth, deliverables, stats }) {
    const getStatusIcon = (status) => {
        switch (status.toLowerCase()) {
            case 'delivered':
                return <FiCheckCircle className="w-4 h-4" />;
            case 'pending':
                return <FiClock className="w-4 h-4" />;
            case 'failed':
                return <FiXCircle className="w-4 h-4" />;
            default:
                return <FiPackage className="w-4 h-4" />;
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                        Deliveries Dashboard
                    </h2>
                    <Link
                        href="/dashboard"
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            }
        >
            <Head title="Deliveries Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-[40px]   p-6">
                            <div className="flex items-center">
                                <FiPackage className="w-8 h-8 text-blue-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-[40px]   p-6">
                            <div className="flex items-center">
                                <FiCheckCircle className="w-8 h-8 text-green-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-[40px]   p-6">
                            <div className="flex items-center">
                                <FiClock className="w-8 h-8 text-yellow-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Pending</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-[40px]   p-6">
                            <div className="flex items-center">
                                <FiXCircle className="w-8 h-8 text-red-500 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Failed</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deliveries Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-[40px]  ">
                        <div className="p-6 bg-white border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Deliveries</h3>
                            
                            {deliverables.data.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Payment ID
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Type
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Amount
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Participants
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {deliverables.data.map((delivery) => (
                                                <tr key={delivery.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {delivery.payment_id ? (
                                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                                                {delivery.payment_id.substring(0, 20)}...
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {delivery.deliverable_type}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {delivery.formatted_amount}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${delivery.status_class}`}>
                                                            {getStatusIcon(delivery.status)}
                                                            <span className="ml-1">{delivery.status}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div>
                                                            <div>Created: {delivery.created_at}</div>
                                                            {delivery.delivered_at && (
                                                                <div className="text-xs text-green-600">
                                                                    Delivered: {delivery.delivered_at}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div>
                                                            {delivery.is_creator ? (
                                                                <>
                                                                    <div className="font-medium">You (Creator)</div>
                                                                    <div className="text-xs">Buyer: {delivery.gifter_name || delivery.customer_email}</div>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <div className="font-medium">You (Buyer)</div>
                                                                    <div className="text-xs">Creator: {delivery.creator_name}</div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex flex-col gap-2">
                                                            {delivery.deliverable_url && delivery.status.toLowerCase() === 'delivered' && (
                                                                <a
                                                                    href={delivery.deliverable_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-indigo-600 hover:text-indigo-900 inline-flex items-center"
                                                                >
                                                                    <FiDownload className="w-4 h-4 mr-1" />
                                                                    Download
                                                                </a>
                                                            )}
                                                            {delivery.certificate_url && (
                                                                <a
                                                                    href={delivery.certificate_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-green-600 hover:text-green-900 inline-flex items-center"
                                                                >
                                                                    <FiCheckCircle className="w-4 h-4 mr-1" />
                                                                    Certificate
                                                                </a>
                                                            )}
                                                            {(!delivery.deliverable_url && !delivery.certificate_url) && (
                                                                <span className="text-gray-400">
                                                                    {delivery.status.toLowerCase() === 'pending' ? 'Processing...' : 'N/A'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No deliveries</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        You haven't made or received any deliveries yet.
                                    </p>
                                </div>
                            )}

                            {/* Pagination */}
                            {deliverables.data.length > 0 && (
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex-1 flex justify-between sm:hidden">
                                        {deliverables.prev_page_url && (
                                            <Link
                                                href={deliverables.prev_page_url}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-[40px]  text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Previous
                                            </Link>
                                        )}
                                        {deliverables.next_page_url && (
                                            <Link
                                                href={deliverables.next_page_url}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-[40px]  text-gray-700 bg-white hover:bg-gray-50"
                                            >
                                                Next
                                            </Link>
                                        )}
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700">
                                                Showing{' '}
                                                <span className="font-medium">{deliverables.from}</span>
                                                {' '}to{' '}
                                                <span className="font-medium">{deliverables.to}</span>
                                                {' '}of{' '}
                                                <span className="font-medium">{deliverables.total}</span>
                                                {' '}results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-[40px]  shadow-sm -space-x-px" aria-label="Pagination">
                                                {deliverables.prev_page_url && (
                                                    <Link
                                                        href={deliverables.prev_page_url}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                                    >
                                                        Previous
                                                    </Link>
                                                )}
                                                {deliverables.next_page_url && (
                                                    <Link
                                                        href={deliverables.next_page_url}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-xl border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                                    >
                                                        Next
                                                    </Link>
                                                )}
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}