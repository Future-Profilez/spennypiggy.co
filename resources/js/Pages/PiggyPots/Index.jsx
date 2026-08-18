import React, { useCallback, useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import GlobalUploader from '@/uploadcare/Uploader';
import st from '../../../css/uploader.module.css';
import ItemFormShell from '@/Components/ItemFormShell';
import RewardEditor, {
    emptyReward,
    rewardFromItem,
    rewardToPayload,
    validateReward,
} from '@/Components/Reward/RewardEditor';
import RewardPreview from '@/Components/Reward/RewardPreview';
import { IMAGE_ACCEPT } from '@/constants/rewards';
import PotVisibilityNotice from './PotVisibilityNotice';

const DEFAULT_COVER = 'https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/';

const FIELD =
    'w-full min-h-[48px] rounded-box-sm border-[3px] border-black bg-white px-4 py-3 text-base font-medium focus:outline-none focus:ring-0 ';
const FIELD_LABEL = 'mb-2 block text-left text-[12px] font-black uppercase tracking-[0.14em]';

export default function Index({ auth, piggyPots, allPotsList, filter_pot_id }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { successAlert, errorAlert } = useAlerts();

    const {
        data,
        setData,
        post,
        transform,
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
        content_description: '',
        cover_media: DEFAULT_COVER,
        reward: emptyReward(),
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
        content_description: '',
        cover_media: DEFAULT_COVER,
        reward: emptyReward(),
    };

    // The reward lives as one object in form state and is flattened to the
    // server's columns on submit, so the editor and the payload can never
    // disagree about what was entered.
    transform((payload) => {
        const { reward, ...rest } = payload;
        return {
            ...rest,
            ...rewardToPayload(reward),
            // Mirror the reward's own description verbatim — a `|| rest...`
            // fallback resent the old text whenever the creator cleared the
            // "Extra detail" field on an edit.
            content_description: reward.description || '',
        };
    });

    const setReward = useCallback((next) => setData('reward', next), [setData]);

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
            content_description: pot.content_description || '',
            cover_media: pot.cover_media || DEFAULT_COVER,
            reward: {
                ...rewardFromItem(pot),
                description: pot.reward_description || pot.content_description || '',
            },
        });
        clearErrors();
        setShowPotModal(true);
    };

    const closeAndResetModal = () => {
        setShowPotModal(false);
        setData(defaultValues);
        clearErrors();
    };

    const handleSubmit = () => {
        if (processing) return;

        const rewardProblem = validateReward(data.reward);
        if (rewardProblem) {
            setError('reward_title', rewardProblem);
            errorAlert(rewardProblem);
            return;
        }

        const options = {
            onSuccess: (page) => {
                if (page.props.errors && Object.keys(page.props.errors).length > 0) {
                    errorAlert('Please check the form for errors.');
                } else {
                    // successAlert(isEditing ? 'Piggy Pot updated successfully!' : 'Piggy Pot created successfully!',);
                    closeAndResetModal();
                }
            },
            onError: (formErrors) => {
                errorAlert(Object.values(formErrors || {}).flat()[0] || 'Please check the form for errors.');
            },
        };

        if (isEditing) {
            post(route('piggy-pots.update', editingId), options);
        } else {
            post(route('piggy-pots.store'), options);
        }
    };

    const steps = [
        {
            key: 'content',
            title: 'Your pot',
            hint: 'Name the content people are buying into, and give it a cover.',
            validate: () => {
                if (!data.title.trim()) return 'Give your pot a title.';
                return null;
            },
            render: () => (
                <div className="space-y-6">
                    <div>
                        <label htmlFor="pot-title" className={FIELD_LABEL}>
                            Content title <span className="text-[#FF007F]">*</span>
                        </label>
                        <input
                            id="pot-title"
                            type="text"
                            className={FIELD}
                            placeholder="e.g. Exclusive photo set"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                        />
                        {errors.title && (
                            <p className="mt-2 text-left text-xs font-bold text-[#FF007F]">{errors.title}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="pot-description" className={FIELD_LABEL}>
                            Description
                        </label>
                        <textarea
                            id="pot-description"
                            rows="3"
                            className={`${FIELD} resize-y`}
                            placeholder="Describe the content supporters will unlock…"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                        />
                        {errors.description && (
                            <p className="mt-2 text-left text-xs font-bold text-[#FF007F]">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div>
                        <span className={FIELD_LABEL}>Cover image</span>
                        <div className="rounded-box-sm border-[3px] border-dashed border-black bg-[#F7F7F7] p-2">
                            {data.cover_media && (
                                <div className="relative mb-3 overflow-hidden rounded-box-sm border-[3px] border-black bg-white">
                                    <img
                                        src={data.cover_media}
                                        className="h-[150px] w-full object-cover"
                                        alt="Cover preview"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setData('cover_media', '')}
                                        aria-label="Remove cover image"
                                        className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-full border-2 border-black bg-white text-xl font-black text-red-600 "
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                            <div className="uploader overflow-hidden">
                                <GlobalUploader
                                    ctxName="piggy-pot-cover"
                                    type="minimal"
                                    accept={IMAGE_ACCEPT}
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
                            <p className="mt-2 text-left text-xs font-bold text-[#FF007F]">
                                {errors.cover_media}
                            </p>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: 'reward',
            title: 'What they get',
            hint: 'Supporters unlock this the moment their payment clears.',
            validate: () => validateReward(data.reward),
            render: () => (
                <RewardEditor
                    value={data.reward}
                    onChange={setReward}
                    ctxName="piggy-pot-reward"
                    errors={errors}
                />
            ),
        },
        {
            key: 'goal',
            title: 'Goal & settings',
            hint: 'The goal is progress context only — supporters buy the content, not the target.',
            validate: () => {
                if (!String(data.target_amount).trim()) return 'Set a progress goal.';
                return null;
            },
            render: () => (
                <div className="space-y-6">
                    <div className="grid gap-5 md:grid-cols-2">
                        <div>
                            <label htmlFor="pot-target" className={FIELD_LABEL}>
                                Progress goal ({data.currency}) <span className="text-[#FF007F]">*</span>
                            </label>
                            <input
                                id="pot-target"
                                type="number"
                                step="0.01"
                                min="1"
                                inputMode="decimal"
                                className={FIELD}
                                placeholder="e.g. 500"
                                value={data.target_amount}
                                onChange={(e) => setData('target_amount', e.target.value)}
                            />
                            {errors.target_amount && (
                                <p className="mt-2 text-left text-xs font-bold text-[#FF007F]">
                                    {errors.target_amount}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="pot-deadline" className={FIELD_LABEL}>
                                Deadline <span className="text-neutral-400">(optional)</span>
                            </label>
                            <input
                                id="pot-deadline"
                                type="datetime-local"
                                className={FIELD}
                                value={data.deadline}
                                onChange={(e) => setData('deadline', e.target.value)}
                            />
                            {errors.deadline && (
                                <p className="mt-2 text-left text-xs font-bold text-[#FF007F]">
                                    {errors.deadline}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Toggle
                            checked={data.is_pinned}
                            onChange={(next) => setData('is_pinned', next)}
                            label="Pin to profile (featured goal)"
                        />
                        <Toggle
                            checked={data.enable_leaderboard}
                            onChange={(next) => setData('enable_leaderboard', next)}
                            label="Show most-active supporters"
                        />
                    </div>

                    {isEditing && (
                        <div>
                            <label htmlFor="pot-status" className={FIELD_LABEL}>
                                Status
                            </label>
                            <select
                                id="pot-status"
                                className={`${FIELD} appearance-none`}
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
                </div>
            ),
        },
    ];

    const handleDelete = (pot) => {
        const label = pot?.title ? `"${pot.title}"` : 'this Piggy Pot';
        if (confirm(`Delete ${label}? Supporters who already purchased keep their content, but the pot will no longer be visible.`)) {
            destroy(route('piggy-pots.destroy', pot.id), {
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

            <div className="bg-gray-200 min-h-dvh pb-12">
                <div className="containerbox m-auto">
                    <div className="py-8 md:py-16 max-w-[900px] m-auto">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-6">
                            <h2 className="font-GillSans uppercase text-3xl">
                                Piggy Pots
                            </h2>
                            <button
                                type="button"
                                onClick={openCreateModal}
                                className="text-lg w-full md:w-auto min-h-[48px] inline-flex items-center justify-center px-4 border border-black rounded-box-sm !text-black bg-yellow-300 "
                            >
                                + Create New Pot
                            </button>
                        </div>

                        <ItemFormShell
                            open={showPotModal}
                            onClose={closeAndResetModal}
                            title={isEditing ? 'Edit Piggy Pot' : 'Create Piggy Pot'}
                            steps={steps}
                            onSubmit={handleSubmit}
                            processing={processing}
                            submitLabel={isEditing ? 'Save changes' : 'Create pot'}
                            preview={() => <RewardPreview value={data.reward} />}
                        />

                        {piggyPots.length === 0 ? (
                            <div className="text-center py-10 px-6 bg-white border border-black rounded-box mt-4">
                                <div className="text-4xl mb-3">🐷</div>
                                <p className="text-gray-500 text-lg mb-6">
                                    You haven't created any Piggy Pots yet.
                                </p>
                                <button
                                    type="button"
                                    onClick={openCreateModal}
                                    className="inline-flex items-center justify-center min-h-[48px] px-8 border-2 border-black rounded-box-sm bg-yellow-300 text-black font-black uppercase tracking-widest transition-colors duration-200 hover:brightness-110"
                                >
                                    + Create your first Pot
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 mt-4">
                                {piggyPots.map((pot) => {
                                    const potTarget = Number(pot.target_amount) || 0;
                                    const potRaised = Number(pot.total_raised) || 0;
                                    const progressPercent = potTarget > 0
                                        ? Math.min(100, (potRaised / potTarget) * 100)
                                        : 0;

                                    return (
                                        <div
                                            key={pot.id}
                                            className="bg-[#fdfbf7] border-[3px] border-black rounded-box relative transition-colors duration-200 hover:bg-black/[0.03] flex flex-col h-full group overflow-hidden"
                                        >
                                            {/* ⚠️ A pinned pot that has closed is still pinned — the flag is
                                                the creator's intent and is kept, so extending the deadline
                                                restores the slot. But a plain "⭐ Pinned" on a pot the profile
                                                stopped showing is the badge telling them the opposite of the
                                                truth, which is how a lapsed pot went unnoticed for months. */}
                                            {pot.is_pinned && (
                                                <div className="absolute top-4 right-4 z-20">
                                                    {pot.visibility && !pot.visibility.visible ? (
                                                        <span className="bg-gray-200 text-gray-700 text-xs font-black px-4 py-1.5 rounded-full border-2 border-black uppercase tracking-widest flex items-center gap-1">
                                                            <span aria-hidden="true">⭐</span> Pinned · not showing
                                                        </span>
                                                    ) : (
                                                        <span className="bg-pink-500 text-white text-xs font-black px-4 py-1.5 rounded-full border-2 border-black uppercase tracking-widest flex items-center gap-1">
                                                            <span aria-hidden="true">⭐</span> Pinned
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="relative h-[240px] flex-shrink-0 border-b-[3px] border-black overflow-hidden bg-pink-100">
                                                <img
                                                    src={
                                                        pot.cover_media ||
                                                        'https://ucarecdn.com/6d5506b2-7361-4c58-8f1b-dfe1e196885a/'
                                                    }
                                                    className="w-full h-full object-cover transition-[filter,opacity] duration-500 group-hover:brightness-[1.08]"
                                                    alt={pot.title}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                                                <div className="absolute bottom-4 left-4 z-10">
                                                    <span
                                                        className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-black uppercase tracking-widest border-2 border-black ${
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
                                                <div className="absolute -top-10 right-6 w-16 h-16 bg-white border-[3px] border-black rounded-full flex items-center justify-center text-3xl z-20">
                                                    🐷
                                                </div>

                                                <h4
                                                    className="font-black font-GillSans uppercase text-2xl mb-2 pr-12 text-black tracking-wide leading-tight line-clamp-2 min-h-[60px]"
                                                    title={pot.title}
                                                >
                                                    {pot.title}
                                                </h4>
                                                {/* Covers every reason a pot is off the profile — under review,
                                                    deadline lapsed, goal reached, archived, or simply not the
                                                    featured one — because each needs a different action and a
                                                    status chip tells the creator none of them. Silent when live. */}
                                                <PotVisibilityNotice
                                                    visibility={pot.visibility}
                                                    moderationReason={pot.moderation_reason}
                                                    onFix={() => openEditModal(pot)}
                                                />
                                                <p className="text-black/80 font-medium text-sm mb-6 line-clamp-2 flex-grow">
                                                    {pot.description || 'No description'}
                                                </p>

                                                <div className="bg-white rounded-box-sm p-4 mb-5 border-2 border-black relative overflow-hidden">
                                                    <div className="flex justify-between items-end mb-3 relative z-10">
                                                        <div>
                                                            <p className="text-[12px] text-gray-500 uppercase font-black tracking-widest mb-1">
                                                                Progress Goal
                                                            </p>
                                                            <p className="font-black text-xl text-black">
                                                                {pot.currency} {potTarget.toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[12px] text-gray-500 uppercase font-black tracking-widest mb-1">
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
                                                        className="px-5 py-2.5 border-[3px] border-black rounded-full text-sm font-black uppercase tracking-wider bg-white hover:bg-gray-100 text-black hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(pot)}
                                                        className="px-5 py-2.5 border-[3px] border-black rounded-full text-sm font-black uppercase tracking-wider bg-red-100 hover:bg-red-200 text-red-600 hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
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

/** House switch — 44px tall so it is reliably tappable on a phone. */
function Toggle({ checked, onChange, label }) {
    return (
        <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
            <span className="relative inline-flex shrink-0">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(event) => onChange(event.target.checked)}
                />
                <span
                    className={`block h-8 w-14 rounded-full border-2 border-black transition-colors ${
                        checked ? 'bg-[#A2E4B8]' : 'bg-neutral-300'
                    }`}
                />
                <span
                    className={`absolute left-1 top-1 h-6 w-6 rounded-full border-2 border-black bg-white transition-transform ${
                        checked ? 'translate-x-6' : ''
                    }`}
                />
            </span>
            <span className="text-left text-sm font-bold">{label}</span>
        </label>
    );
}
