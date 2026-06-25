import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import GlobalUploader from '@/uploadcare/Uploader';
import st from '../../../css/uploader.module.css';
import Popup from '@/Components/Popup';

export default function Index({ auth, piggyPots, allPotsList, filter_pot_id }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { successAlert, errorAlert } = useAlerts();

    const {
        data,
        setData,
        post,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
        setError,
    } = useForm({
        title: '',
        description: '',
        target_amount: '',
        currency: auth.user.default_currency || 'GBP',
        deadline: '',
        is_pinned: false,
        enable_leaderboard: true,
        allow_anonymous: true,
        status: 'active',
        content_file: '',
        content_description: '',
        cover_media:
            'https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/',
    });

    const [showPotModal, setShowPotModal] = useState(false);

    const defaultValues = {
        title: '',
        description: '',
        target_amount: '',
        currency: auth.user.default_currency || 'GBP',
        deadline: '',
        is_pinned: false,
        enable_leaderboard: true,
        allow_anonymous: true,
        status: 'active',
        content_file: '',
        content_description: '',
        cover_media:
            'https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/',
    };

    const openCreateModal = () => {
        setIsEditing(false);
        setEditingId(null);
        setData(defaultValues);
        clearErrors();
        setShowPotModal(true);
    };

    const openEditModal = (pot) => {
        setIsEditing(true);
        setEditingId(pot.id);
        setData({
            title: pot.title || '',
            description: pot.description || '',
            target_amount: pot.target_amount || '',
            currency: pot.currency || auth.user.default_currency || 'GBP',
            deadline: pot.deadline
                ? new Date(pot.deadline).toISOString().slice(0, 16)
                : '',
            is_pinned: pot.is_pinned == 1 || pot.is_pinned === true,
            enable_leaderboard:
                pot.enable_leaderboard == 1 || pot.enable_leaderboard === true,
            allow_anonymous:
                pot.allow_anonymous == 1 || pot.allow_anonymous === true,
            status: pot.status || 'active',
            content_file: pot.content_file || '',
            content_description: pot.content_description || '',
            cover_media:
                pot.cover_media ||
                'https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/',
        });
        clearErrors();
        setShowPotModal(true);
    };

    const closeAndResetModal = () => {
        setShowPotModal(false);
        setData(defaultValues);
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!data.content_file) {
            setError('content_file', 'Content file is required.');
            errorAlert('Please upload the content file the supporter receives.');
            return;
        }

        const options = {
            onSuccess: (page) => {
                if (page.props.errors && Object.keys(page.props.errors).length > 0) {
                    errorAlert('Please check the form for errors.');
                } else {
                    successAlert(
                        isEditing
                            ? 'Piggy Pot updated successfully!'
                            : 'Piggy Pot created successfully!',
                    );
                    closeAndResetModal();
                }
            },
            onError: () => {
                errorAlert('Please check the form for errors.');
            },
        };

        if (isEditing) {
            post(route('piggy-pots.update', editingId), options);
        } else {
            post(route('piggy-pots.store'), options);
        }
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this Piggy Pot?')) {
            destroy(route('piggy-pots.destroy', id), {
                onSuccess: () => successAlert('Piggy Pot deleted successfully!'),
                onError: () => errorAlert('Failed to delete Piggy Pot.'),
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={
                <h2 className="font-semibold text-xl text-gray-800 leading-tight">
                    Piggy Pots
                </h2>
            }
        >
            <Head title="Piggy Pots" />

            <div className="bg-gray-200 min-vh-100 pb-12">
                <div className="containerbox m-auto">
                    <div className="py-8 md:py-16 max-w-[900px] m-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="font-GillSans uppercase text-3xl">
                                Piggy Pots
                            </h2>
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="text-lg w-full md:w-auto mb-2 md:mb-0 md:text-lg inline-block p-2 !px-4 border border-black rounded-[14px] md:rounded-[16px] !text-black bg-yellow-300 shadow-[3px_3px_0px_#000]"
                            >
                                + Create New Pot
                            </button>
                        </div>

                        <Popup
                            size="xl"
                            classes="hidden"
                            action={showPotModal}
                            onHide={closeAndResetModal}
                        >
                            <div className="p-6">
                                <h3 className="font-GillSans uppercase text-3xl mb-6">
                                    {isEditing ? 'Edit Piggy Pot' : 'Create Piggy Pot'}
                                </h3>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1">
                                            Content Title*
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                            placeholder="e.g. Exclusive photo set"
                                            value={data.title}
                                            onChange={(e) => setData('title', e.target.value)}
                                            required
                                        />
                                        {errors.title && (
                                            <div className="text-red-500 text-xs mt-1 font-bold">
                                                {errors.title}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-900 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                            rows="3"
                                            placeholder="Describe the content supporters will unlock..."
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                        />
                                        {errors.description && (
                                            <div className="text-red-500 text-xs mt-1 font-bold">
                                                {errors.description}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                                Progress Goal* ({data.currency}) — Required
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="1"
                                                className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                placeholder="e.g. 500"
                                                value={data.target_amount}
                                                onChange={(e) => setData('target_amount', e.target.value)}
                                                required
                                            />
                                            {errors.target_amount && (
                                                <div className="text-red-500 text-xs mt-1 font-bold">
                                                    {errors.target_amount}
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                                Deadline (Optional)
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                value={data.deadline}
                                                onChange={(e) => setData('deadline', e.target.value)}
                                            />
                                            {errors.deadline && (
                                                <div className="text-red-500 text-xs mt-1 font-bold">
                                                    {errors.deadline}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Cover Image (Optional)
                                        </label>
                                        <p className="text-xs text-gray-500 mb-3">
                                            Upload a cover image to make your pot stand out.
                                        </p>

                                        <div className="border-2 border-black rounded-[20px] p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-50 border-dashed hover:border-pink-500 transition-colors">
                                            {data.cover_media && (
                                                <div className="mb-3 bg-white border-2 border-black rounded-xl overflow-hidden relative group">
                                                    <img
                                                        src={data.cover_media}
                                                        className="w-full h-[150px] object-cover"
                                                        alt="Cover Preview"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            type="button"
                                                            onClick={() => setData('cover_media', '')}
                                                            className="bg-white text-red-600 font-bold px-4 py-2 border-2 border-black rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                                                        >
                                                            Remove Cover
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="uploader overflow-hidden">
                                                <GlobalUploader
                                                    ctxName="piggy-pot-cover"
                                                    type="minimal"
                                                    accept="image/*"
                                                    imgonly={true}
                                                    sendFile={(file) =>
                                                        setData(
                                                            'cover_media',
                                                            file?.url || file?.cdnUrl || file?.originalUrl,
                                                        )
                                                    }
                                                    options={st.avatar}
                                                />
                                            </div>
                                        </div>
                                        {errors.cover_media && (
                                            <div className="text-red-500 text-xs mt-2 font-bold">
                                                {errors.cover_media}
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 border-t-2 border-gray-200 mt-6">
                                        <label className="block text-sm font-bold text-gray-900 mb-2">
                                            Content the supporter receives*
                                        </label>
                                        <p className="text-xs text-gray-500 mb-3">
                                            Supporters automatically unlock this content after they purchase.
                                        </p>

                                        <div className="mb-4">
                                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                                Content Description
                                            </label>
                                            <textarea
                                                className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                                rows="2"
                                                placeholder="Describe the exclusive content they will get..."
                                                value={data.content_description}
                                                onChange={(e) => setData('content_description', e.target.value)}
                                            />
                                        </div>
                                        <label htmlFor="content_file" className="block text-sm font-bold text-gray-900 mb-1">
                                            Content File*
                                        </label>

                                        <div className="border-2 border-black rounded-[20px] p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-50 border-dashed hover:border-pink-500 transition-colors">
                                            {data.content_file && (
                                                <div className="mb-3 p-3 bg-white border-2 border-black rounded-xl text-sm font-bold flex justify-between items-center">
                                                    <span className="truncate">File Uploaded!</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setData('content_file', '')}
                                                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded-lg"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                            <div className="uploader overflow-hidden">
                                                <GlobalUploader
                                                    ctxName="piggy-pot-context"
                                                    type="minimal"
                                                    accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/rtf,application/zip,application/x-zip-compressed"
                                                    imgonly={false}
                                                    sendFile={(file) =>
                                                        setData(
                                                            'content_file',
                                                            file?.uuid || file?.url || file?.cdnUrl || '',
                                                        )
                                                    }
                                                    options={st.wishlistcontent}
                                                />
                                            </div>
                                        </div>
                                        {errors.content_file && (
                                            <div className="text-red-500 text-xs mt-2 font-bold">
                                                {errors.content_file}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t-2 border-gray-200 mt-6">
                                        <label className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={data.is_pinned}
                                                    onChange={(e) => setData('is_pinned', e.target.checked)}
                                                />
                                                <div
                                                    className={`block w-14 h-8 rounded-full border-2 border-black transition-colors ${
                                                        data.is_pinned ? 'bg-[#A2E4B8]' : 'bg-gray-300'
                                                    }`}
                                                ></div>
                                                <div
                                                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full border-2 border-black transition-transform ${
                                                        data.is_pinned ? 'transform translate-x-6' : ''
                                                    }`}
                                                ></div>
                                            </div>
                                            <span className="ml-3 font-bold text-gray-900">
                                                Pin to profile (Featured Goal)
                                            </span>
                                        </label>

                                        <label className="flex items-center cursor-pointer">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only"
                                                    checked={data.enable_leaderboard}
                                                    onChange={(e) => setData('enable_leaderboard', e.target.checked)}
                                                />
                                                <div
                                                    className={`block w-14 h-8 rounded-full border-2 border-black transition-colors ${
                                                        data.enable_leaderboard ? 'bg-[#A2E4B8]' : 'bg-gray-300'
                                                    }`}
                                                ></div>
                                                <div
                                                    className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full border-2 border-black transition-transform ${
                                                        data.enable_leaderboard ? 'transform translate-x-6' : ''
                                                    }`}
                                                ></div>
                                            </div>
                                            <span className="ml-3 font-bold text-gray-900">
                                                Show most-active supporters
                                            </span>
                                        </label>
                                    </div>

                                    {isEditing && (
                                        <div className="pt-4">
                                            <label className="block text-sm font-bold text-gray-900 mb-1">
                                                Status
                                            </label>
                                            <select
                                                className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white appearance-none"
                                                value={data.status}
                                                onChange={(e) => setData('status', e.target.value)}
                                            >
                                                <option value="active">Active</option>
                                                <option value="completed">Completed</option>
                                                <option value="expired">Expired</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="modal-action flex justify-center space-x-4 mt-8">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full mt-2 px-8 py-3 border-2 border-black rounded-full font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                                        >
                                            {processing ? 'Saving...' : 'Save Piggy Pot'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </Popup>

                        {piggyPots.length === 0 ? (
                            <div className="text-center py-10 bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-3xl mt-4">
                                <p className="text-gray-500 text-lg">
                                    You haven't created any Piggy Pots yet.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mt-4">
                                {piggyPots.map((pot) => {
                                    const progressPercent = Math.min(
                                        100,
                                        ((pot.total_raised || 0) / pot.target_amount) * 100,
                                    );

                                    return (
                                        <div
                                            key={pot.id}
                                            className="bg-[#fdfbf7] border-[3px] border-black rounded-[40px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col group overflow-hidden"
                                        >
                                            {pot.is_pinned && (
                                                <div className="absolute top-4 right-4 z-20">
                                                    <span className="bg-pink-500 text-white text-xs font-black px-4 py-1.5 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black uppercase tracking-widest flex items-center gap-1">
                                                        <span>⭐</span> Pinned
                                                    </span>
                                                </div>
                                            )}

                                            <div className="relative h-[240px] flex-shrink-0 border-b-[3px] border-black overflow-hidden bg-pink-100">
                                                <img
                                                    src={
                                                        pot.cover_media ||
                                                        'https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/'
                                                    }
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    alt={pot.title}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                                <div className="absolute bottom-4 left-4 z-10">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
                                                            pot.status === 'completed'
                                                                ? 'bg-[#FFD700] text-black'
                                                                : pot.status === 'active'
                                                                ? 'bg-[#A2E4B8] text-black'
                                                                : pot.status === 'moderation_hold'
                                                                ? 'bg-red-200 text-black'
                                                                : 'bg-gray-200 text-gray-800'
                                                        }`}
                                                    >
                                                        {pot.status === 'completed' ? '✓ completed' : pot.status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-6 flex flex-col flex-grow relative">
                                                <div className="absolute -top-10 right-6 w-16 h-16 bg-white border-[3px] border-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center text-3xl z-20">
                                                    🐷
                                                </div>

                                                <h4 className="font-black font-GillSans uppercase text-2xl mb-2 pr-12 text-black tracking-wide leading-tight">
                                                    {pot.title}
                                                </h4>
                                                {pot.status === 'moderation_hold' && (
                                                    <div className="mb-3 rounded-xl border-2 border-red-300 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                                                        ⚠️ Under review — not visible to buyers.
                                                        {pot.moderation_reason ? (
                                                            <span className="block font-medium text-red-600 mt-0.5">
                                                                {pot.moderation_reason}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                )}
                                                <p className="text-gray-600 font-medium text-sm mb-6 line-clamp-2 flex-grow">
                                                    {pot.description || 'No description'}
                                                </p>

                                                <div className="bg-white rounded-[24px] p-4 mb-5 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                                                    <div className="flex justify-between items-end mb-3 relative z-10">
                                                        <div>
                                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">
                                                                Progress Goal
                                                            </p>
                                                            <p className="font-black text-xl text-black">
                                                                {pot.currency} {pot.target_amount}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">
                                                                Progress So Far
                                                            </p>
                                                            <p className="font-black text-xl text-pink-500">
                                                                {pot.currency} {parseFloat(pot.total_raised || 0).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="w-full bg-gray-100 rounded-full h-4 border-2 border-black overflow-hidden relative z-10">
                                                        <div
                                                            className="bg-pink-500 h-full rounded-full relative"
                                                            style={{ width: `${progressPercent}%` }}
                                                        >
                                                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/30 rounded-t-full"></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end space-x-3 pt-2 mt-auto">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(pot)}
                                                        className="px-5 py-2.5 border-[3px] border-black rounded-full text-sm font-black uppercase tracking-wider bg-white hover:bg-gray-100 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(pot.id)}
                                                        className="px-5 py-2.5 border-[3px] border-black rounded-full text-sm font-black uppercase tracking-wider bg-red-100 hover:bg-red-200 text-red-600 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
