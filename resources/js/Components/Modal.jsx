import { Fragment } from 'react';
import useHideBottomBar from "@/hooks/useHideBottomBar";
import { Dialog, Transition } from '@headlessui/react';

export default function Modal({ children, show = false, maxWidth = '2xl', closeable = true, onClose = () => {} }) {
    const close = () => {
        if (closeable) {
            onClose();
        }
    };

    /*
     * 🚨 The bottom bar is z 999999 and this Dialog is z-50, so on a phone the
     * bar painted over the foot of the panel — which on every form this hosts
     * (FeatureSuggestionModal, DeleteUserForm, ConfirmDestructive…) is the
     * submit row. Same mechanism Popup and Sheet use; see the hook.
     */
    useHideBottomBar(show);

    const maxWidthClass = {
        sm: 'sm:max-w-sm',
        md: 'sm:max-w-md',
        lg: 'sm:max-w-lg',
        xl: 'sm:max-w-xl',
        '2xl': 'sm:max-w-2xl',
    }[maxWidth];

    return (
        <Transition show={show} as={Fragment} leave="duration-200">
            <Dialog
                as="div"
                id="modal"
                // Safe-area padding: installed as a PWA this dialog reaches the
                // physical screen edges, so a plain py-6 puts the panel under the
                // status bar / home indicator.
                // bottom-bar-safe: useHideBottomBar(show) hides the bar while open
                className="popupmodal fixed inset-0 flex overflow-y-auto px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-0 items-center z-50 transform transition-all"
                onClose={close}
            >
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="absolute inset-0 bg-gray-500/75" />
                </Transition.Child>

                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                    <Dialog.Panel
                        // Capped so a tall child can never push its own close/submit
                        // row off the bottom of a phone; the panel takes the scroll.
                        // dvh, never vh — mobile viewports lie.
                        className={`mb-6 max-h-[85dvh] overflow-y-auto bg-white rounded-box transform transition-all sm:w-full sm:mx-auto ${maxWidthClass}`}
                    >
                        {children}
                    </Dialog.Panel>
                </Transition.Child>
            </Dialog>
        </Transition>
    );
}
