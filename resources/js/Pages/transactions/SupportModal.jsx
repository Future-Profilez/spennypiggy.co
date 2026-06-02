import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import Popup from '@/Components/Popup';
import { router } from '@inertiajs/react';
import GlobalUploader from '@/uploadcare/Uploader';
import { route } from 'ziggy-js';

export default function SupportModal({ show, event, initialType = 'contact', onClose }) {
  const [type, setType] = useState(initialType);
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [txEvent, setTxEvent] = useState(null);
  const uploaderRef = useRef(null);

  const mergedEvent = txEvent ? { ...event, ...txEvent, creator: event?.creator || txEvent?.creator } : event;
  const displayCurrency = (mergedEvent?.display_currency || mergedEvent?.currency || '').toUpperCase();
  const displayAmount = mergedEvent?.display_amount ?? mergedEvent?.amount ?? null;
  const txTitle = mergedEvent?.title || mergedEvent?.wish?.name || mergedEvent?.shop?.name || mergedEvent?.task?.title || mergedEvent?.membership?.level || mergedEvent?.bill?.name || mergedEvent?.piggy_pot?.title || null;
  const uploaderCtxName = useMemo(() => `support-ticket-${mergedEvent?.source || 'src'}-${mergedEvent?.source_id || '0'}`, [mergedEvent?.source, mergedEvent?.source_id]);

  useEffect(() => {
    if (show) {
      setType(initialType);
      setMessage('');
      setReason('');
      setAttachments([]);
      setSubmitting(false);
      setTxEvent(null);
      setTxLoading(false);
    }
  }, [show, initialType, event]);

  useEffect(() => {
    if (!show) return;
    if (!event?.source || !event?.source_id) return;

    setTxLoading(true);
    axios
      .get('/support/transaction-details', {
        params: { source: event.source, source_id: String(event.source_id) },
      })
      .then((res) => {
        if (res?.data?.status && res?.data?.event) {
          setTxEvent(res.data.event);
        }
      })
      .catch(() => {})
      .finally(() => setTxLoading(false));
  }, [show, event?.source, event?.source_id]);

  const submitSupportTicket = async () => {
    if (!mergedEvent?.creator?.username) return;
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
        creator_username: mergedEvent.creator.username,
        event_type: mergedEvent.type,
        source: mergedEvent.source,
        source_id: String(mergedEvent.source_id ?? ''),
        message: message,
        reason: type === 'refund' ? reason : null,
        attachments: attachments.length ? attachments : null,
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

  const addAttachment = (file) => {
    if (!file) return;
    if (attachments.length >= 5) {
      alert('Max 5 attachments allowed.');
      if (uploaderRef.current) uploaderRef.current.reset();
      return;
    }
    if ((file.size || 0) > 5 * 1024 * 1024) {
      alert('Max file size is 5MB.');
      if (uploaderRef.current) uploaderRef.current.reset();
      return;
    }
    setAttachments((prev) => [...prev, file]);
    if (uploaderRef.current) uploaderRef.current.reset();
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Popup action={show} onHide={onClose} size="xl" hidecontrols={true}>
      <div className="bg-white text-black md:p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-gray-500">Support Request</div>
            <div className="text-xl font-black mt-1">
              {type === 'refund' ? 'Request Refund' : 'Contact Creator'}
            </div>
            <div className="text-xs font-bold text-gray-600 mt-1">
              {mergedEvent?.creator?.username ? `@${mergedEvent.creator.username}` : ''}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-[18px] border-2 border-black bg-gray-50 p-3">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Transaction Details</div>
          <div className="mt-1 text-sm font-black text-black">
            {txLoading ? 'Loading…' : (txTitle ? txTitle : (mergedEvent?.type ? String(mergedEvent.type).replaceAll('_', ' ') : 'Transaction'))}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-bold text-gray-700">
            <div>Amount</div>
            <div className="text-right">{displayAmount !== null ? `${displayAmount}${displayCurrency ? ` ${displayCurrency}` : ''}` : 'N/A'}</div>
            <div>Date</div>
            <div className="text-right">{mergedEvent?.created_at || 'N/A'}</div>
            <div>Transaction ID</div>
            <div className="text-right">{mergedEvent?.uuid || 'N/A'}</div>
            <div>Source</div>
            <div className="text-right">{mergedEvent?.source && mergedEvent?.source_id ? `${mergedEvent.source} #${mergedEvent.source_id}` : 'N/A'}</div>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => setType('contact')}
            className={`px-4 py-2 rounded-[15px] border-2 border-black text-xs font-black uppercase tracking-widest ${
              type === 'contact' ? 'bg-yellow-300' : 'bg-white'
            }`}
          >
            Contact
          </button>
          <button
            type="button"
            onClick={() => setType('refund')}
            className={`px-4 py-2 rounded-[15px] border-2 border-black text-xs font-black uppercase tracking-widest ${
              type === 'refund' ? 'bg-yellow-300' : 'bg-white'
            }`}
          >
            Refund
          </button>
        </div>

        {type === 'refund' ? (
          <div className="mt-4">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Refund Reason*</div>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full min-h-[90px] bg-white border-2 border-black rounded-[20px] p-3 font-bold text-sm"
              placeholder="Write the reason for refund request…"
            />
          </div>
        ) : null}

        <div className="mt-4">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Message*</div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full min-h-[110px] bg-white border-2 border-black rounded-[20px] p-3 font-bold text-sm"
            placeholder="Write your message…"
          />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Attachments</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{attachments.length}/5</div>
          </div>
          {attachments.length ? (
            <div className="mb-3 rounded-[18px] border-2 border-black bg-white p-3">
              <div className="space-y-2">
                {attachments.map((a, idx) => (
                  <div key={`${a.uuid || a.url || 'file'}-${idx}`} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{a.name || 'Attachment'}</div>
                      <div className="text-[10px] font-bold text-gray-600">{a.size ? `${Math.ceil(a.size / 1024)} KB` : ''}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="h-9 px-3 rounded-[12px] border-2 border-black font-black uppercase tracking-widest text-[10px] bg-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="rounded-[18px] border-2 border-black bg-gray-50 p-3">
            <div className="w-full">
              <GlobalUploader
                ref={uploaderRef}
                ctxName={uploaderCtxName}
                type="minimal"
                view={false}
                imgonly={false}
                accept="image/*,video/*,application/pdf"
                sendFile={addAttachment}
              />
            </div>
            <div className="mt-2 text-center text-[10px] font-bold text-gray-600">Up to 5 files. Max 5MB each.</div>
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-[15px] border-2 border-black font-black uppercase tracking-widest text-xs bg-white"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={submitSupportTicket}
            className="h-11 px-6 rounded-[15px] border-2 border-black font-black uppercase tracking-widest text-xs bg-[#FF007F] text-black disabled:opacity-70"
          >
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    </Popup>
  );
}
