import { useForm } from '@inertiajs/react';
import Modal from './Modal';
import PrimaryButton from './PrimaryButton';
import SecondaryButton from './SecondaryButton';
import TextInput from './TextInput';
import InputLabel from './InputLabel';
import InputError from './InputError';
import { toast } from 'react-hot-toast';
import { route } from 'ziggy-js';
import GlobalUploader from '../uploadcare/Uploader';
import { useState, useRef } from 'react';
import { FaLightbulb, FaTimes, FaImage, FaPaperPlane } from 'react-icons/fa';

export default function FeatureSuggestionModal({ show, onClose, auth }) {
    const uploaderRef = useRef();
    const [isUploading, setIsUploading] = useState(false);
    
    const { data, setData, post, processing, reset, errors } = useForm({
        suggestion: '',
        email: auth?.user?.email || '',
        name: auth?.user?.name || '',
        image_url: '',
        image_uuid: '',
    });

    const handleFileUpload = (file) => {
        if (file) {
            setData((prevData) => ({
                ...prevData,
                image_url: file.url,
                image_uuid: file.uuid,
            }));
        }
    };

    const submit = (e) => {
        e.preventDefault();

        post(route('feature-suggestion.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                if (uploaderRef.current) {
                    uploaderRef.current.reset();
                }
                onClose();
                toast.success('Thank you for your suggestion! We\'ll look into it.');
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="relative overflow-hidden bg-[#0d0d0d] border border-white/10 rounded-[40px] shadow-2xl">
                {/* Background Glows */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/10 rounded-full filter blur-[80px]"></div>
                    <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-500/5 rounded-full filter blur-[80px]"></div>
                </div>

                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#EFEA7B] via-[#F94F96] to-[#924DFF] z-10"></div>
                
                <form onSubmit={submit} className="p-8 md:p-10 relative z-10 max-h-[85vh] overflow-auto custom-scrollbar">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
                                <div className="relative w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <FaLightbulb className="text-[#EFEA7B] text-2xl drop-shadow-[0_0_8px_rgba(239,234,123,0.5)]" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-gulfs text-white uppercase tracking-tight">
                                    Share Your Idea
                                </h2>
                                <p className="text-gray-500 font-poppins text-xs md:text-sm">
                                    Shape the future of <span className="text-white font-medium">Spenny Piggy</span>
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-300"
                        >
                            <FaTimes className="text-lg" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <InputLabel htmlFor="name" value="Your Name" className="!text-gray-400 text-[10px] md:text-xs uppercase tracking-widest ml-1" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full bg-white/5 border-white/5 !rounded-2xl text-white focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-gray-600 h-14 px-6 transition-all"
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Naveen..."
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="space-y-2">
                                <InputLabel htmlFor="email" value="Your Email" className="!text-gray-400 text-[10px] md:text-xs uppercase tracking-widest ml-1" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full bg-white/5 border-white/5 !rounded-2xl text-white focus:border-purple-500/50 focus:ring-purple-500/20 placeholder:text-gray-600 h-14 px-6 transition-all"
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="your@email.com"
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <InputLabel htmlFor="suggestion" value="Describe your feature" className="!text-gray-400 text-[10px] md:text-xs uppercase tracking-widest ml-1" />
                            <textarea
                                id="suggestion"
                                name="suggestion"
                                value={data.suggestion}
                                className="mt-1 block w-full bg-white/5 border-white/5 rounded-[28px] text-white focus:border-purple-500/50 focus:ring-purple-500/20 h-32 resize-none p-6 font-poppins placeholder:text-gray-600 transition-all"
                                onChange={(e) => setData('suggestion', e.target.value)}
                                required
                                placeholder="I'd love to see a way to..."
                            />
                            <div className="flex justify-end pr-2">
                                <span className="text-[10px] text-gray-600 font-poppins uppercase tracking-tighter">
                                    {data.suggestion.length} characters
                                </span>
                            </div>
                            <InputError message={errors.suggestion} className="mt-2" />
                        </div>

                        <div className="pt-2 space-y-3">
                            <InputLabel value="Add a reference image" className="!text-gray-400 text-[10px] md:text-xs uppercase tracking-widest ml-1" />
                            <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-[28px] p-2 transition-all hover:border-white/20 group/upload overflow-hidden">
                                <div className="flex items-center justify-center w-full">
                                    {!data.image_url ? (
                                        <div className='w-full'>
                                            <GlobalUploader 
                                                ref={uploaderRef}
                                                type="minimal"
                                                ctxName="feature_suggestion"
                                                imgonly={true}
                                                accept="image/*"
                                                sendFile={handleFileUpload}
                                                isUploading={setIsUploading}
                                                view={true}
                                            />
                                            <p className="px-4 pb-4 text-[10px] text-gray-600 text-center font-poppins uppercase tracking-wide">
                                                JPG, PNG or WEBP (Max 5MB)
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden group/img max-h-[200px]">
                                            <img src={data.image_url} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" />
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => setData({ ...data, image_url: '', image_uuid: '' })}
                                                    className="bg-white text-black w-12 h-12 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all duration-300 shadow-xl"
                                                >
                                                    <FaTimes className="text-lg" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex items-center justify-end gap-6">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 font-gulfs uppercase text-sm text-gray-500 hover:text-white tracking-widest transition-colors"
                        >
                            Cancel
                        </button>

                        <button 
                            type="submit"
                            disabled={processing || isUploading}
                            className="relative group px-10 py-4 bg-white text-black rounded-full font-gulfs uppercase text-sm tracking-widest transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-4 overflow-hidden shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                {processing ? 'Sending...' : isUploading ? 'Uploading...' : (
                                    <>
                                        Send Idea
                                        <FaPaperPlane className="text-sm group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform duration-500" />
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 via-pink-200 to-purple-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
