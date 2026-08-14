import { Head } from '@inertiajs/react';
import { useState, useRef, useMemo } from 'react';
import axios from 'axios';
import Popup from '@/Components/Popup';
import GlobalUploader from '@/uploadcare/Uploader';
import HelpSuggestions from '@/Components/Help/HelpSuggestions';
import { ChevronLeft, AlertCircle, Paperclip } from 'lucide-react';
import GuestLayout from '../../../Layouts/GuestLayout';

export default function Create({ payment, creator, email, post_url, initial_type }) {
  const [type, setType] = useState(initial_type === 'refund' ? 'refund' : 'contact');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ticketUuid, setTicketUuid] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);

  /**
   * Deflection query, built from what this page already knows about the
   * purchase. Asking a guest to describe their problem twice — once in a search
   * box and once in the form — is a step nobody takes.
   */
  const helpQuery = useMemo(() => {
    const module = String(payment?.type || payment?.source || payment?.product_type || '')
      .replaceAll('_', ' ')
      .trim();
    const intent = type === 'refund' ? 'refund money back' : 'my purchase has not arrived';
    return `${intent} ${module}`.trim();
  }, [type, payment?.type, payment?.source, payment?.product_type]);
  const uploaderRef = useRef(null);

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
      const res = await axios.post(post_url, {
        email,
        type,
        reason: type === 'refund' ? reason : null,
        message,
        attachments: attachments.length ? attachments : null,
      });
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
    setShowAttachmentPicker(false);
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <>
      <Head title="Support Request" />
      <style>{`
        footer, .intercom-lightweight-app-launcher  {
          display: none;
        }
      `}</style>

      <GuestLayout>
        <div className="h-full md:h-[calc(100dvh-88px)] bg-[#fdfbf7] font-cera-medium flex flex-col overflow-hidden  md:px-6  md:py-6">
          <div className="max-w-[1200px] mx-auto w-full flex flex-col h-full gap-4 relative min-h-0">
            <div className="flex-1 flex flex-col bg-white md:border-[1px] md:border-black md:rounded-box overflow-hidden min-h-0 relative lg:h-full">
              <div className="bg-yellow-300 text-white  border-b-[1px] border-black !border-t-0 !border-l-0 !border-r-0 p-4 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="w-10 h-10 min-w-10 flex items-center justify-center rounded-box border-[3px] border-black bg-white text-black hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all" >
                    <ChevronLeft size={20} strokeWidth={3} />
                  </button>
                  <div>
                    <h1 className="text-lg text-black md:text-2xl font-black uppercase tracking-wide flex items-center gap-2">
                      Support Request
                    </h1>
                    <div className="text-[12px] font-black uppercase tracking-widest text-black/70">
                      Use this form to contact the creator or request a refund. No email is shared with the creator.
                    </div>
                  </div>
                </div>
                <div className="text-center px-3 md:px-4 py-2 rounded-full border-[3px] border-black text-black text-[12px] md:text-[12px] font-black uppercase tracking-widest bg-white">
                  Guest
                </div>
              </div>

              <div className="lg:flex-1 lg:flex lg:flex-row  lg:overflow-hidden lg:min-h-0">
                <div className="w-full lg:w-1/3 p-4 overflow-y-auto customScrollbar space-y-6 shrink-0 lg:border-b-[0px] lg:border-b-0 lg:border-r-[3px] lg:border-black bg-[#fdfbf7]">
                  <div className="bg-white lg:border-[3px] border-black rounded-box-sm overflow-hidden w-full">
                    <div className="bg-yellow-100 p-3 md:p-4 border-b-[3px] border-black !border-t-0 !border-l-0 !border-r-0 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[#FF007F] font-black uppercase tracking-wide">
                        <AlertCircle size={20} strokeWidth={3} />
                        {ticketUuid ? 'Request Submitted' : (type === 'refund' ? 'Refund Request' : 'Contact Creator')}
                      </div>
                    </div>
                    <div className="p-4 md:p-5 space-y-4">
                      {creator ? (
                        <div>
                          <div className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-1">Creator</div>
                          <div className="text-sm font-bold text-black">@{creator.username}</div>
                        </div>
                      ) : null}

                      <div>
                        <div className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-2">Transaction</div>
                        <div className="bg-gray-50 rounded-box-sm border-2 border-black p-4 space-y-2">
                          <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-2">
                            <span className="text-[12px] font-black uppercase tracking-widest text-black/60">Amount</span>
                            <span className="text-sm font-bold text-black">{String(payment?.currency || '').toUpperCase()} {Number(payment?.amount_total || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[12px] font-black uppercase tracking-widest text-black/60">Order</span>
                            <span className="text-xs font-black text-black text-right break-all">{payment?.session_id || payment?.id || '-'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-[12px] font-bold text-gray-700 leading-relaxed">
                        Keep this page open. After you submit, you will be redirected to the ticket chat link for updates.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-2/3 flex flex-col bg-white flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#fdfbf7] customScrollbar relative">
                    {ticketUuid ? (
                      <div className="bg-white border-[3px] border-black rounded-box-sm overflow-hidden w-full">
                        <div className="p-4 md:p-5 space-y-3">
                          <div className="text-sm font-black uppercase tracking-widest text-black/60">Ticket ID</div>
                          <div className="px-4 py-3 rounded-box-sm border-2 border-black bg-yellow-300 font-black text-black break-all">
                            {ticketUuid}
                          </div>
                          <div className="text-xs font-bold text-gray-700">
                            Please keep this link for updates.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white border-[3px] border-black rounded-box-sm overflow-hidden w-full">
                        <div className="p-4 md:p-5 space-y-4">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setType('contact')}
                              className={`px-4 py-2 rounded-full border-2 border-black text-xs font-black uppercase tracking-widest ${type === 'contact' ? 'bg-yellow-300' : 'bg-white'}`}
                            >
                              Contact
                            </button>
                            <button
                              type="button"
                              onClick={() => setType('refund')}
                              className={`px-4 py-2 rounded-full border-2 border-black text-xs font-black uppercase tracking-widest ${type === 'refund' ? 'bg-yellow-300' : 'bg-white'}`}
                            >
                              Refund
                            </button>
                          </div>

                          {/*
                            Deflection, above the message box. A guest has no
                            account, no Intercom (its provider returns early when
                            logged out) and no ticket history — this form is the
                            only place they can be handed an answer before they
                            wait on a reply. Renders nothing when no article
                            matches.
                          */}
                          <HelpSuggestions query={helpQuery} heading="This might answer it right now" />

                          {type === 'refund' ? (
                            <div>
                              <div className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-2">Refund Reason</div>
                              <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full min-h-[90px] bg-white border-2 border-black rounded-box-sm p-3 font-bold text-sm resize-y focus:ring-0 customScrollbar"
                                placeholder="Write the reason for refund request…"
                              />
                            </div>
                          ) : null}

                          <div>
                            <div className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-2">Message</div>
                            <textarea
                              value={message}
                              onChange={(e) => setMessage(e.target.value)}
                              className="w-full min-h-[120px] bg-white border-2 border-black rounded-box-sm p-3 font-bold text-sm resize-y focus:ring-0 customScrollbar"
                              placeholder="Write your message…"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <div className="text-[12px] font-black uppercase tracking-widest text-black/60">Attachments</div>
                              <div className="text-[12px] font-black uppercase tracking-widest text-black/60">{attachments.length}/5</div>
                            </div>
                            {attachments.length ? (
                              <div className="mb-3 rounded-box-sm border-2 border-black bg-white p-3">
                                <div className="space-y-2">
                                  {attachments.map((a, idx) => (
                                    <div key={`${a.uuid || a.url || 'file'}-${idx}`} className="flex items-center justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="text-xs font-black truncate">{a.name || 'Attachment'}</div>
                                        <div className="text-[12px] font-bold text-gray-600">{a.size ? `${Math.ceil(a.size / 1024)} KB` : ''}</div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeAttachment(idx)}
                                        className="h-9 px-3 rounded-box-sm border-2 border-black font-black uppercase tracking-widest text-[12px] bg-white"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setShowAttachmentPicker(true)}
                              className="w-full h-11 rounded-box-sm border-2 border-black bg-gray-50 font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-2"
                            >
                              <Paperclip size={16} strokeWidth={3} /> Choose file
                            </button>
                            <div className="text-[12px] font-bold text-gray-600 mt-2">Up to 5 files. Max 5MB each.</div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={submit}
                              className="h-11 px-6 rounded-full border-2 border-black font-black uppercase tracking-widest text-[12px] bg-[#FF007F] text-black disabled:opacity-70"
                            >
                              {submitting ? 'Sending…' : 'Send'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Popup action={showAttachmentPicker} onHide={() => setShowAttachmentPicker(false)} size="lg" hidecontrols={true}>
                    <div className="bg-white p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="text-xs font-black uppercase tracking-widest text-black/60">Attachments</div>
                          <div className="text-lg font-black mt-1">Choose file</div>
                          <div className="text-[12px] font-bold text-gray-600 mt-1">Up to 5 files. Max 5MB each.</div>
                        </div>
                      </div>
                      <div className="mt-4 rounded-box-sm border-2 border-black bg-gray-50 p-3">
                        <GlobalUploader
                          ref={uploaderRef}
                          ctxName={`guest-support-create-${payment?.id || 'payment'}`}
                          type="minimal"
                          view={false}
                          imgonly={false}
                          accept="image/*,video/*,application/pdf"
                          sendFile={addAttachment}
                        />
                      </div>
                    </div>
                  </Popup>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GuestLayout>
    </>

  );
}
