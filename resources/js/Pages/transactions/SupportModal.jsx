import { useState, useEffect } from 'react';
import axios from 'axios';
import Popup from '@/Components/Popup';
import { router } from '@inertiajs/react';

export default function SupportModal({ show, event, initialType = 'contact', onClose }) {
  const [type, setType] = useState(initialType);
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (show) {
      setType(initialType);
      setMessage('');
      setReason('');
      setSubmitting(false);
    }
  }, [show, initialType, event]);

  const submitSupportTicket = async () => {
    if (!event?.creator?.username) return;
    if (!message.trim()) {
      alert('Please write a message.');
      return;
    }
    if (type === 'refund' && !reason.trim()) {
      alert('Please add a refund reason.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await axios.post(route('support.tickets.store'), {
        type: type,
        creator_username: event.creator.username,
        event_type: event.type,
        source: event.source,
        source_id: String(event.source_id ?? ''),
        message: message,
        reason: type === 'refund' ? reason : null,
      });
      if (res?.data?.redirect) {
        router.visit(res.data.redirect);
      } else {
        alert('Request submitted.');
        onClose();
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to submit request');
      setSubmitting(false);
    }
  };

  return (
    <Popup action={show} onHide={onClose} size="xl" hidecontrols={true}>
      <div className="bg-white text-black md:p-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-500">Support Request</div>
            <div className="text-xl font-black mt-1">
              {type === 'refund' ? 'Request Refund' : 'Contact Creator'}
            </div>
            <div className="text-xs font-bold text-gray-600 mt-1">
              {event?.creator?.username ? `@${event.creator.username}` : ''}
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setType('contact')}
            className={`px-4 py-2 rounded-full border-2 border-black text-xs font-black uppercase tracking-widest ${
              type === 'contact' ? 'bg-yellow-300' : 'bg-white'
            }`}
          >
            Contact
          </button>
          <button
            type="button"
            onClick={() => setType('refund')}
            className={`px-4 py-2 rounded-full border-2 border-black text-xs font-black uppercase tracking-widest ${
              type === 'refund' ? 'bg-yellow-300' : 'bg-white'
            }`}
          >
            Refund
          </button>
        </div>

        {type === 'refund' ? (
          <div className="mt-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Refund Reason</div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full min-h-[90px] bg-white border-2 border-black rounded-2xl p-3 font-bold text-sm"
              placeholder="Write the reason for refund request…"
            />
          </div>
        ) : null}

        <div className="mt-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Message</div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full min-h-[110px] bg-white border-2 border-black rounded-2xl p-3 font-bold text-sm"
            placeholder="Write your message…"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-full border-2 border-black font-black uppercase tracking-widest text-xs bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submitSupportTicket}
            className="h-11 px-6 rounded-full border-2 border-black font-black uppercase tracking-widest text-xs bg-[#FF007F] text-black disabled:opacity-70"
          >
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </Popup>
  );
}
