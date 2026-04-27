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
            <div className="relative overflow-hidden bg-white border border-black/10 rounded-[20px]">
                {/* Header Decoration */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#EFEA7B] via-[#F94F96] to-[#924DFF]"></div>
                
                <form onSubmit={submit} className="p-8 max-h-[70vh] lg:max-h-[80vh] overflow-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/5 border border-black/10 rounded-[10px] flex items-center justify-center">
                                <FaLightbulb className="text-[#EFEA7B] text-2xl" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-gulfs text-black uppercase tracking-tight">
                                    Share Your Idea
                                </h2>
                                <p className="text-gray-700 font-poppins text-xs">
                                    Shape the future of Spenny Piggy
                                </p>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 !text-gray-700 hover:text-black transition-colors"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="name" value="Your Name" className="!text-gray-700 text-xs uppercase mb-1 ml-2" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={data.name}
                                    className="mt-1 block w-full bg-white/5 border-black/10 !rounded-[14px] text-black focus:border-[#924DFF] focus:ring-[#924DFF] placeholder:text-gray-600 h-12 px-4"
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Naveen..."
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="email" value="Your Email" className="!text-gray-700 text-xs uppercase mb-1 ml-2" />
                                <TextInput
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    className="mt-1 block w-full bg-white/5 border-black/10 !rounded-[14px] text-black focus:border-[#924DFF] focus:ring-[#924DFF] placeholder:text-gray-600 h-12 px-4"
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="your@email.com"
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                        </div>

                        <div>
                            <InputLabel htmlFor="suggestion" value="Describe your feature" className="!text-gray-700 text-xs uppercase mb-1 ml-2" />
                            <textarea
                                id="suggestion"
                                name="suggestion"
                                value={data.suggestion}
                                className="mt-1 block w-full bg-white/5 border-black/10 rounded-[20px] text-black focus:border-[#924DFF] focus:ring-[#924DFF] h-20 resize-none p-4 font-poppins placeholder:text-gray-600"
                                onChange={(e) => setData('suggestion', e.target.value)}
                                required
                                placeholder="I'd love to see a way to..."
                            />
                            <div className="flex justify-end mt-1">
                                <span className="text-[10px] text-gray-500 font-poppins">
                                    {data.suggestion.length} characters
                                </span>
                            </div>
                            <InputError message={errors.suggestion} className="mt-2" />
                        </div>

                        <div className="pt-2">
                            <InputLabel value="Add a reference image" className="!text-gray-700 text-xs uppercase mb-2 ml-1" />
                            <div className="bg-white/5 border border-dashed border-black/10 rounded-[13px] p-0 transition-all hover:border-white/20 group">
                                <div className="flex  items-center justify-center w-full">
                                    {!data.image_url ? (
                                        <>
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
                                            <p className="p-2 text-[10px] text-gray-500 mt-2 font-poppins">
                                                JPG, PNG or WEBP (Max 5MB)
                                            </p>
                                        </div>
                                        </>
                                    ) : (
                                        <div className="relative w-full aspect-video  rounded-[10px] overflow-hidden group/img max-h-[150px]">
                                            <img src={data.image_url} alt="Preview" className="w-full h-full object-cover " />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                                <button 
                                                    type="button"
                                                    onClick={() => setData({ ...data, image_url: '', image_uuid: '' })}
                                                    className="bg-red-500 text-black p-2 rounded-full hover:bg-red-600 transition-colors"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 flex items-center justify-end gap-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 font-poppins text-sm !text-gray-700 hover:text-black transition-colors"
                        >
                            Cancel
                        </button>

                        <button 
                            type="submit"
                            disabled={processing || isUploading}
                            className="relative group px-8 py-3 bg-[#924DFF] hover:bg-[#7B3FE0] text-white rounded-xl  text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 overflow-hidden shadow-[0_10px_30px_rgba(146,77,255,0.3)]"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {processing ? 'Sending...' : isUploading ? 'Uploading...' : (
                                    <>
                                        Send Idea
                                        <FaPaperPlane className="text-xs group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </>
                                )}
                            </span>
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
