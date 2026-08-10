import React from 'react';

/**
 * "Were you told about this?" — the viewer's own notification status for one
 * purchase.
 *
 * 🚨 This only ever describes the SIGNED-IN PERSON'S messages. The server scopes
 * it (NotificationDeliveryService), and nothing here should ever be handed the
 * other party's row: a creator seeing whether their supporter's receipt landed
 * would be the platform leaking a supporter's relationship with it, and a buyer
 * has no business knowing what the creator was sent.
 */

const CHANNELS = [
  { key: 'email', label: 'Email', icon: '✉' },
  { key: 'push', label: 'Push', icon: '↗' },
  { key: 'bell', label: 'Notification', icon: '◉' },
];

const TONE = {
  sent: 'bg-[#E9F7EF] text-[#1B7A46] border-[#1B7A46]/20',
  queued: 'bg-[#FFF7E6] text-[#8A5A00] border-[#8A5A00]/20',
  failed: 'bg-[#FDECEC] text-[#B3261E] border-[#B3261E]/20',
  skipped: 'bg-black/[0.04] text-black/55 border-black/10',
};

const WORD = {
  sent: 'sent',
  // Not "pending": nothing further is going to happen on its own, and a person
  // told to wait for a message that is not coming waits instead of asking.
  queued: 'not confirmed',
  failed: 'failed',
  skipped: 'off',
};

export default function DeliveryStatus({ notifications, className = '' }) {
  // Null means we cannot honestly speak to it — nothing recorded, or the
  // purchase predates delivery logging. Saying nothing is right; saying
  // "not sent" would be inventing a fact about someone's own money.
  if (!notifications) return null;

  const present = CHANNELS.filter(({ key }) => notifications[key]);

  if (present.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {present.map(({ key, label, icon }) => {
        const status = notifications[key];
        return (
          <span
            key={key}
            title={`${label} ${WORD[status] ?? status}`}
            className={`inline-flex items-center gap-1 rounded-box-sm border px-2 py-0.5 text-[11px] font-semibold ${
              TONE[status] ?? TONE.skipped
            }`}
          >
            <span aria-hidden="true">{icon}</span>
            {label} {WORD[status] ?? status}
          </span>
        );
      })}
    </div>
  );
}
