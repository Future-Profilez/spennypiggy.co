import { useForm } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { route } from 'ziggy-js';

/**
 * Re-runs the ledger sync for the signed-in user, then returns to the page it was
 * pressed on. Shared by the financial dashboard, the earnings page and support
 * history so the three cannot drift into three different refresh behaviours.
 *
 * `financial.refresh` redirects with back(), so this works from any page.
 */
export default function RefreshRecordsButton({ className = '', label = 'Refresh' }) {
    const { post, processing } = useForm({});

    return (
        <button
            type="button"
            onClick={() => post(route('financial.refresh'), { preserveScroll: true })}
            disabled={processing}
            aria-busy={processing}
            className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-box-sm px-4 py-2.5 font-poppins text-sm font-semibold transition-colors disabled:opacity-60 ${className}`}
        >
            <RefreshCw
                size={18}
                className={processing ? 'animate-spin motion-reduce:animate-none' : ''}
            />
            <span>{processing ? 'Refreshing…' : label}</span>
        </button>
    );
}
