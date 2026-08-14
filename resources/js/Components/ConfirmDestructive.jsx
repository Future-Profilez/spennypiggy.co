import Modal from "@/Components/Modal";

/**
 * Confirmation gate for anything that permanently removes a live earning product.
 * Deleting a bill or membership tier cancels every supporter's subscription, so it
 * must never be a single un-confirmed tap.
 */
export default function ConfirmDestructive({
    show,
    title = "Are you sure?",
    body,
    confirmLabel = "Delete",
    cancelLabel = "Keep it",
    processing = false,
    onConfirm,
    onClose,
}) {
    return (
        <Modal show={show} maxWidth="md" closeable={!processing} onClose={onClose}>
            <div className="bg-white rounded-box border-[3px] border-black p-6 text-left">
                <h2 className="font-GillSans uppercase text-lg font-black tracking-wide text-black">
                    {title}
                </h2>

                {body && (
                    <p className="mt-3 text-sm text-gray-700 font-poppins">{body}</p>
                )}

                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={processing}
                        className="min-h-[44px] px-5 rounded-box-sm border-2 border-black bg-white font-bold uppercase text-sm disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                        className="min-h-[44px] px-5 rounded-box-sm border-2 border-black bg-red-500 text-white font-bold uppercase text-sm disabled:opacity-50"
                    >
                        {processing ? "Removing…" : confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
