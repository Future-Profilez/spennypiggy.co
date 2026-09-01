import { useForm } from '@inertiajs/react';
import Modal from './Modal';
import InputError from './InputError';
import { toast } from 'react-hot-toast';
import { route } from 'ziggy-js';
import GlobalUploader from '../uploadcare/Uploader';
import { useState, useRef } from 'react';
import { FaLightbulb, FaTimes, FaPaperPlane } from 'react-icons/fa';

const MAX_CHARS = 2000;

// Shared field chrome: a field is a black-framed slip on paper, never a glass panel.
const FIELD =
    'block w-full bg-white border-black rounded-box-sm text-black font-poppins placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-[#FF007F] transition-shadow duration-200';

const LABEL = 'block font-gulfs uppercase text-[11px] tracking-[0.18em] text-black/70 mb-2';

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

    const used = data.suggestion.length;
    const filled = Math.min(100, (used / MAX_CHARS) * 100);

    return (
        <Modal show={show} onClose={onClose} maxWidth="xl">
            <form onSubmit={submit} className="bg-white text-black">
                {/* Header band — the one loud element on the page. Black on pink, never white. */}
                <div className="relative bg-[#FF007F] border-b-2 border-b-black px-6 md:px-8 pt-7 pb-10">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute top-5 right-5 w-11 h-11 flex items-center justify-center rounded-full bg-black/[0.10] border border-black/25 text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                        <FaTimes className="text-base" />
                    </button>

                    <p className="font-gulfs uppercase text-[11px] tracking-[0.22em] text-black/65">
                        Feature request
                    </p>
                    <h2 className="mt-2 font-gulfs uppercase text-black text-[28px] md:text-4xl leading-[0.95] tracking-tight max-w-[16ch]">
                        Tell us what to build next
                    </h2>
                </div>

                {/* Bulb tile straddles the seam — the piece that makes this modal ours. */}
                <div className="px-6 md:px-8">
                    <div className="mt-8 mb-7 w-16 h-16 border-black bg-[#E6EA7B] rounded-box-sm flex items-center justify-center">
                        <FaLightbulb className="text-black text-2xl" />
                    </div>
                </div>

                <div className="px-6 md:px-8 pb-8 space-y-7">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label htmlFor="name" className={LABEL}>Your name</label>
                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={data.name}
                                className={`${FIELD} h-14 px-5`}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Your name"
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <label htmlFor="email" className={LABEL}>Your email</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className={`${FIELD} h-14 px-5`}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="you@email.com"
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="suggestion" className={LABEL}>The idea</label>
                        <textarea
                            id="suggestion"
                            name="suggestion"
                            value={data.suggestion}
                            maxLength={MAX_CHARS}
                            className={`${FIELD} h-36 resize-none p-5 leading-[1.55]`}
                            onChange={(e) => setData('suggestion', e.target.value)}
                            required
                            placeholder="I'd love to see a way to…"
                        />

                        {/* Counter reads as a rail, not a number floating in space. */}
                        <div className="mt-3 flex items-center gap-4">
                            <div className="h-2 flex-1 rounded-full bg-black/10 overflow-hidden">
                                <div
                                    className="h-full bg-[#FF007F] transition-[width] duration-200"
                                    style={{ width: `${filled}%` }}
                                />
                            </div>
                            <span className="font-gulfs uppercase text-[11px] tracking-[0.16em] text-black/55 tabular-nums shrink-0">
                                {used} / {MAX_CHARS}
                            </span>
                        </div>
                        <InputError message={errors.suggestion} className="mt-2" />
                    </div>

                    <div>
                        <label className={LABEL}>Reference image <span className="text-black/40">— optional</span></label>

                        {!data.image_url ? (
                            <div className="border-2 border-dashed border-black/25 rounded-box-sm p-2 transition-colors duration-200 hover:border-black/50">
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
                                <p className="px-4 pb-3 text-center font-poppins text-[11px] uppercase tracking-[0.14em] text-black/45">
                                    JPG, PNG or WEBP · 5MB max
                                </p>
                            </div>
                        ) : (
                            <div className="relative border-black rounded-box-sm overflow-hidden aspect-video max-h-[220px] group/img">
                                <img
                                    src={data.image_url}
                                    alt="Reference preview"
                                    className="w-full h-full object-cover transition-[filter] duration-500 group-hover/img:brightness-[1.08]"
                                />
                                {/* Remove control stays visible on touch — never hover-only. */}
                                <button
                                    type="button"
                                    onClick={() => setData({ ...data, image_url: '', image_uuid: '' })}
                                    aria-label="Remove image"
                                    className="absolute top-3 right-3 min-h-[44px] min-w-[44px] rounded-full bg-white border-black text-black flex items-center justify-center transition-colors duration-200 hover:bg-black hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                >
                                    <FaTimes className="text-base" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action bar sticks to the bottom of the scrolling panel.
                    bottom-bar-safe: rendered inside Modal, which hides the bar while open */}
                <div className="sticky bottom-0 bg-white border-t-2 border-t-black px-6 md:px-8 py-5 flex items-center justify-between gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="font-gulfs uppercase text-[13px] tracking-[0.16em] text-black/55 hover:text-black transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={processing || isUploading || used === 0}
                        className="min-h-[48px] px-8 rounded-full bg-[#FF007F] border-black text-black font-gulfs uppercase text-[13px] tracking-[0.16em] flex items-center gap-3 transition-[filter] duration-200 hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                    >
                        {processing ? 'Sending…' : isUploading ? 'Uploading…' : (
                            <>
                                Send idea
                                <FaPaperPlane className="text-sm" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
