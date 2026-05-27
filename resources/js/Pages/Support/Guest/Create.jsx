import { Head } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function Create({ payment, creator, email, post_url }) {
  const [type, setType] = useState('contact');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketUuid, setTicketUuid] = useState(null);

  const submit = async () => {
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
      const res = await axios.post(post_url, { email, type, reason: type === 'refund' ? reason : null, message });
      if (res?.data?.redirect) {
        window.location.href = res.data.redirect;
        return;
      }
      if (res?.data?.ticket_uuid) {
        setTicketUuid(res.data.ticket_uuid);
      } else {
        alert('Request submitted.');
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-10 px-4">
      <Head title="Support Request" />
      <div className="max-w-xl mx-auto">
        <div className="rounded-[25px] bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="text-xs font-black uppercase tracking-widest text-gray-500">Support Request</div>
          <div className="text-2xl font-black mt-1">{ticketUuid ? 'Request Submitted' : 'Contact / Refund'}</div>
          {creator ? (
            <div className="text-sm font-bold text-gray-700 mt-2">
              Creator: <span className="text-black">@{creator.username}</span>
            </div>
          ) : null}

          {ticketUuid ? (
            <div className="mt-5">
              <div className="text-sm font-bold text-black">Ticket ID</div>
              <div className="mt-2 px-4 py-3 rounded-[30px] border-2 border-black bg-yellow-300 font-black text-black">
                {ticketUuid}
              </div>
              <div className="text-xs font-bold text-gray-600 mt-2">
                Please keep this email link for updates.
              </div>
            </div>
          ) : (
            <>
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
                    className="w-full min-h-[90px] bg-white border-2 border-black rounded-[30px] p-3 font-bold text-sm"
                    placeholder="Write the reason for refund request…"
                  />
                </div>
              ) : null}

              <div className="mt-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Message</div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full min-h-[110px] bg-white border-2 border-black rounded-[30px] p-3 font-bold text-sm"
                  placeholder="Write your message…"
                />
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={submit}
                  className="h-11 px-6 rounded-full border-2 border-black font-black uppercase tracking-widest text-[10px] bg-[#FF007F] text-black disabled:opacity-70"
                >
                  {submitting ? 'Sending…' : 'Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
