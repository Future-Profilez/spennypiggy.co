import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useAlerts } from '@/Components/Alerts';
import GlobalUploader from "@/uploadcare/Uploader";
import st from "../../../css/uploader.module.css";
import Popup from '../../Components/Popup';

export default function Index({ auth, piggyPots }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const { successAlert, errorAlert } = useAlerts();

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
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
        cover_media: ''
    });

    const openCreateModal = () => {
        setIsEditing(false);
        setEditingId(null);
        reset();
        document.getElementById('piggy_pot_modal').showModal();
    };

    const openEditModal = (pot) => {
        setIsEditing(true);
        setEditingId(pot.id);
        setData({
            title: pot.title,
            description: pot.description || '',
            target_amount: pot.target_amount,
            currency: pot.currency,
            deadline: pot.deadline ? new Date(pot.deadline).toISOString().slice(0, 16) : '',
            is_pinned: pot.is_pinned,
            enable_leaderboard: pot.enable_leaderboard,
            allow_anonymous: pot.allow_anonymous,
            status: pot.status,
            content_file: pot.content_file || '',
            content_description: pot.content_description || '',
            cover_media: pot.cover_media || ''
        });
        document.getElementById('piggy_pot_modal').showModal();
    };

    const closeAndResetModal = () => {
        document.getElementById('piggy_pot_modal').close();
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const options = {
            onSuccess: (page) => {
                // Double check if there are actual validation errors returned from backend
                if (page.props.errors && Object.keys(page.props.errors).length > 0) {
                    errorAlert('Please check the form for errors.');
                } else {
                    successAlert(isEditing ? 'Piggy Pot updated successfully!' : 'Piggy Pot created successfully!');
                    closeAndResetModal();
                }
            },
            onError: (err) => {
                errorAlert('Please check the form for errors.');
            }
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
                onError: () => errorAlert('Failed to delete Piggy Pot.')
            });
        }
    };

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">Piggy Pots</h2>}
        >
            <Head title="Piggy Pots" />

            <div className='bg-gray-200 min-vh-100 pb-12'>
                <div className='containerbox m-auto'>
                    <div className='py-8 md:py-16 max-w-[900px] m-auto'>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className='font-GillSans uppercase text-3xl'>Piggy Pots</h2>
                           
                           <Popup  size='xl'
                           classes="text-lg w-full md:w-auto mb-2 
                           md:mb-0 md:text-lg inline-block p-2 !px-4 
                           border border-black rounded-[14px] 
                           md:rounded-[16px] !text-black bg-yellow-300 
                           shadow-[3px_3px_0px_#000]" 
                           text={'+ Create New Pot'}
                            >
                                    <div className=" p-6">
                                        <h3 className="font-GillSans uppercase text-3xl mb-6">{isEditing ? 'Edit Piggy Pot' : 'Create Piggy Pot'}</h3>
                                        
                                        <form onSubmit={handleSubmit} className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-900 mb-1">Goal Title</label>
                                                <input type="text" className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                                    placeholder="e.g. New Streaming Setup"
                                                    value={data.title} onChange={e => setData('title', e.target.value)} required />
                                                {errors.title && <div className="text-red-500 text-xs mt-1 font-bold">{errors.title}</div>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold text-gray-900 mb-1">Description</label>
                                                <textarea className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                                    rows="3" placeholder="Tell your supporters why you are raising this goal..." value={data.description} onChange={e => setData('description', e.target.value)}></textarea>
                                                {errors.description && <div className="text-red-500 text-xs mt-1 font-bold">{errors.description}</div>}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-900 mb-1">Target Amount ({data.currency})</label>
                                                    <input type="number" step="0.01" min="1" className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                                        placeholder="e.g. 500"
                                                        value={data.target_amount} onChange={e => setData('target_amount', e.target.value)} required />
                                                    {errors.target_amount && <div className="text-red-500 text-xs mt-1 font-bold">{errors.target_amount}</div>}
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-900 mb-1">Deadline (Optional)</label>
                                                    <input type="datetime-local" className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                                        value={data.deadline} onChange={e => setData('deadline', e.target.value)} />
                                                    {errors.deadline && <div className="text-red-500 text-xs mt-1 font-bold">{errors.deadline}</div>}
                                                </div>
                                            </div>

                                            <div className="pt-2">
                                                <label className="block text-sm font-bold text-gray-900 mb-2">Digital Reward / Exclusive Item (Optional)</label>
                                                <p className="text-xs text-gray-500 mb-3">Supporters will automatically receive this file after they contribute to your pot.</p>
                                                
                                                <div className="mb-4">
                                                    <label className="block text-sm font-bold text-gray-900 mb-1">Content Description</label>
                                                    <textarea className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" 
                                                        rows="2" placeholder="Describe the exclusive content they will get..." value={data.content_description} onChange={e => setData('content_description', e.target.value)}></textarea>
                                                </div>
                                                
                                                <div className="border-2 border-black rounded-[20px] p-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-gray-50 border-dashed hover:border-pink-500 transition-colors">
                                                    {data.content_file && (
                                                        <div className="mb-3 p-3 bg-white border-2 border-black rounded-xl text-sm font-bold flex justify-between items-center">
                                                            <span className="truncate">File Uploaded!</span>
                                                            <button type="button" onClick={() => setData('content_file', '')} className="text-red-500 hover:text-red-700 text-xs px-2 py-1 border border-red-200 rounded-lg">Remove</button>
                                                        </div>
                                                    )}
                                                    <div className="uploader overflow-hidden">
                                                        <GlobalUploader
                                                            ctxName="piggy-pot-context"
                                                            type="minimal"
                                                            sendFile={(file) => setData('content_file', file?.cdnUrl || file?.originalUrl)}
                                                            options={st.wishlistcontent}
                                                        />
                                                    </div>
                                                </div>
                                                {errors.content_file && <div className="text-red-500 text-xs mt-2 font-bold">{errors.content_file}</div>}
                                            </div>

                                            <div className="space-y-4 pt-4 border-t-2 border-gray-200 mt-6">
                                                <label className="flex items-center cursor-pointer">
                                                    <div className="relative">
                                                        <input type="checkbox" className="sr-only" 
                                                            checked={data.is_pinned} onChange={e => setData('is_pinned', e.target.checked)} />
                                                        <div className={`block w-14 h-8 rounded-full border-2 border-black transition-colors ${data.is_pinned ? 'bg-[#A2E4B8]' : 'bg-gray-300'}`}></div>
                                                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full border-2 border-black transition-transform ${data.is_pinned ? 'transform translate-x-6' : ''}`}></div>
                                                    </div>
                                                    <span className="ml-3 font-bold text-gray-900">Pin to profile (Featured Goal)</span>
                                                </label>

                                                <label className="flex items-center cursor-pointer">
                                                    <div className="relative">
                                                        <input type="checkbox" className="sr-only" 
                                                            checked={data.enable_leaderboard} onChange={e => setData('enable_leaderboard', e.target.checked)} />
                                                        <div className={`block w-14 h-8 rounded-full border-2 border-black transition-colors ${data.enable_leaderboard ? 'bg-[#A2E4B8]' : 'bg-gray-300'}`}></div>
                                                        <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full border-2 border-black transition-transform ${data.enable_leaderboard ? 'transform translate-x-6' : ''}`}></div>
                                                    </div>
                                                    <span className="ml-3 font-bold text-gray-900">Enable Top Piggies Leaderboard</span>
                                                </label>
                                            </div>

                                            {isEditing && (
                                                <div className="pt-4">
                                                    <label className="block text-sm font-bold text-gray-900 mb-1">Status</label>
                                                    <select className="w-full border-2 border-black rounded-[20px] p-3 focus:outline-none focus:ring-0 focus:border-pink-500 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white appearance-none"
                                                        value={data.status} onChange={e => setData('status', e.target.value)}>
                                                        <option value="active">Active</option>
                                                        <option value="completed">Completed</option>
                                                        <option value="expired">Expired</option>
                                                        <option value="archived">Archived</option>
                                                    </select>
                                                </div>
                                            )}

                                            <div className="modal-action flex justify-center space-x-4 mt-8">
                                                <button type="submit" disabled={processing} className="w-full mt-2 px-8 py-3 border-2 border-black rounded-full font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50">
                                                    {processing ? 'Saving...' : 'Save Piggy Pot'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                            </Popup>
             
                        </div>

                        {piggyPots.length === 0 ? (
                            <div className="text-center py-10 bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-3xl mt-4">
                                <p className="text-gray-500 text-lg">You haven't created any Piggy Pots yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-4">
                                {piggyPots.map((pot) => (
                                    <div key={pot.id} className="bg-white border-2 border-black rounded-[30px] p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative transition-transform hover:-translate-y-1">
                                        {pot.is_pinned && (
                                            <span className="absolute top-4 right-4 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border border-black">
                                                Pinned
                                            </span>
                                        )}
                                        <h4 className="font-bold text-xl mb-2 pr-16">{pot.title}</h4>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[40px]">{pot.description || 'No description'}</p>
                                        
                                        <div className="bg-gray-100 rounded-[20px] p-3 mb-4 flex justify-between items-center border border-gray-200">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold">Target</p>
                                                <p className="font-bold text-lg text-pink-500">{pot.currency} {pot.target_amount}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border border-black ${pot.status === 'active' ? 'bg-[#A2E4B8] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'bg-gray-200 text-gray-800'}`}>
                                                    {pot.status.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-2">
                                            <button onClick={() => openEditModal(pot)} className="px-4 py-2 border-2 border-black rounded-full text-sm font-bold bg-white hover:bg-gray-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">Edit</button>
                                            <button onClick={() => handleDelete(pot.id)} className="px-4 py-2 border-2 border-black rounded-full text-sm font-bold bg-red-100 hover:bg-red-200 text-red-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all">Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>


            
        </AuthenticatedLayout>
    );
}
