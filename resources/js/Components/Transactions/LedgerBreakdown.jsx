import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * The shared money breakdown for one transaction.
 *
 * Every transactional surface — Support History, the creator's ledger and the
 * Purchase Hub — renders this from the SAME server payload (LedgerRules::breakdown),
 * so a creator and their supporter can never be shown different arithmetic for the
 * same payment.
 */

export const STATE_TONE = {
  settled: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  awaiting_delivery: { chip: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  awaiting_settlement: { chip: 'bg-sky-50 text-sky-700 ring-sky-600/20', dot: 'bg-sky-500' },
  on_hold: { chip: 'bg-amber-50 text-amber-700 ring-amber-600/20', dot: 'bg-amber-500' },
  refunded: { chip: 'bg-gray-100 text-gray-600 ring-gray-500/20', dot: 'bg-gray-400' },
  disputed: { chip: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
  failed: { chip: 'bg-red-50 text-red-700 ring-red-600/20', dot: 'bg-red-500' },
};

/**
 * Why this row is or is not in the totals, in the reader's terms.
 *
 * A bare "Not in totals" was the whole explanation before, on the one screen where
 * a creator goes to work out why a number is lower than they expected.
 */
export const STATE_HELP = {
  settled: null,
  awaiting_delivery: 'Counts once delivery is confirmed.',
  awaiting_settlement: 'Your supporter’s bank is still confirming this payment.',
  on_hold: 'Held for a routine check. Nothing for you to do.',
  refunded: 'This money was returned, so it is not in your totals.',
  disputed: 'The supporter’s bank is disputing this payment.',
  failed: 'This payment never completed.',
};

export function StateChip({ state, label, className = '' }) {
  if (!state) return null;
  const tone = STATE_TONE[state] || STATE_TONE.settled;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ring-inset ${tone.chip} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {label || state.replaceAll('_', ' ')}
    </span>
  );
}

const Row = ({ label, value, strong = false, muted = false }) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5">
    <span className={`text-[11px] ${muted ? 'text-gray-400' : 'text-gray-500'} font-semibold`}>{label}</span>
    <span
      className={`tabular-nums text-right ${
        strong ? 'text-sm font-black text-gray-900' : 'text-xs font-bold text-gray-700'
      }`}
    >
      {value}
    </span>
  </div>
);

/**
 * @param {object}   breakdown  LedgerRules::breakdown() payload
 * @param {function} money      formats a number in the row's own currency
 * @param {'creator'|'supporter'} variant
 */
export default function LedgerBreakdown({ breakdown, money, variant = 'creator', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  if (!breakdown) return null;

  const fmt = money || ((n) => Number(n || 0).toFixed(2));
  const isSupporter = variant === 'supporter';

  // A supporter is never shown the creator's fee split — the payload already omits it,
  // and this is the second guard so a future payload change cannot leak it.
  const hasFees = !isSupporter && Number(breakdown.total_fees || 0) > 0;

  return (
    <div className="mt-3 rounded-box-sm bg-gray-50 ring-1 ring-inset ring-black/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full min-h-[44px] px-3.5 flex items-center justify-between gap-3 text-left"
      >
        <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
          {isSupporter ? 'Payment details' : 'Where this money went'}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open ? (
        <div className="px-3.5 pb-3 divide-y divide-black/5">
          <div className="pt-0.5">
            <Row label="Supporter paid" value={fmt(breakdown.buyer_paid)} strong />
          </div>

          {hasFees ? (
            <div>
              {Number(breakdown.platform_fee || 0) > 0 && (
                <Row label="Platform fee" value={`− ${fmt(breakdown.platform_fee)}`} />
              )}
              {Number(breakdown.compliance_fee || 0) > 0 && (
                <Row label="Compliance fee" value={`− ${fmt(breakdown.compliance_fee)}`} />
              )}
              {Number(breakdown.stripe_fee || 0) > 0 && (
                <Row label="Card / bank processing" value={`− ${fmt(breakdown.stripe_fee)}`} />
              )}
            </div>
          ) : null}

          {Number(breakdown.vat || 0) > 0 ? (
            <div>
              <Row label="VAT collected" value={fmt(breakdown.vat)} />
            </div>
          ) : null}

          {!isSupporter ? (
            <div>
              <Row label="You earned" value={fmt(breakdown.creator_net)} strong />
              {Number(breakdown.reserve_amount || 0) > 0 ? (
                <Row
                  label={
                    breakdown.reserve_status === 'released'
                      ? 'Reserve released'
                      : 'Reserve held (30 days)'
                  }
                  value={fmt(breakdown.reserve_amount)}
                  muted={breakdown.reserve_status === 'released'}
                />
              ) : null}
            </div>
          ) : null}

          <div className="pt-2 flex items-center justify-between gap-3">
            <StateChip state={breakdown.state} label={breakdown.state_label} />
            {breakdown.fee_profile ? (
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                {breakdown.fee_profile === 'bank' ? '🏦 Bank' : '💳 Card'}
              </span>
            ) : null}
          </div>

          {STATE_HELP[breakdown.state] ? (
            <p className="pt-2 text-[11px] leading-relaxed text-gray-500">{STATE_HELP[breakdown.state]}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
