import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import Popup from '@/Components/Popup';
import GlobalUploader from '@/uploadcare/Uploader';
import { ChevronLeft, MessageSquare, AlertCircle, Clock, CheckCircle, Send, Paperclip } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import Guest from '../../../Layouts/GuestLayout';
import { route } from 'ziggy-js';

export default function Ticket({ ticket, transaction, messages, email, post_url }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const uploaderRef = useRef(null);

  const [localMessages, setLocalMessages] = useState(messages || []);
  const [attachments, setAttachments] = useState([]);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);

  const ticketNumber = useMemo(() => {
    return ticket?.uuid ? ticket.uuid.split('-')[0].toUpperCase() : 'UNKNOWN';
  }, [ticket?.uuid]);

  const evidence = ticket?.evidence || null;

  const statusLabel = useMemo(() => {
    const s = String(ticket?.status || '');
    return s.replaceAll('_', ' ').toUpperCase();
  }, [ticket?.status]);

  useEffect(() => {
    setLocalMessages(messages || []);
  }, [messages]);

  useEffect(() => {
    setAttachments([]);
    if (uploaderRef.current) uploaderRef.current.reset();
  }, [ticket?.uuid]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages]);

  const textRef = useRef(text);
  
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    // Auto-refresh chat and ticket data every 10 seconds without full page reload
    const interval = setInterval(() => {
      // Pause polling if the user is currently typing
      if (!textRef.current?.trim()) {
        router.reload({
          only: ['ticket', 'messages', 'transaction'],
          preserveScroll: true,
          preserveState: true,
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    const msgText = text;
    setText('');
    setSending(true);

    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_role: 'supporter',
      sender: null,
      message: msgText,
      attachments: attachments.length ? attachments : null,
      created_at: new Date().toISOString()
    };
    setLocalMessages(prev => [...prev, tempMsg]);

    try {
      await axios.post(post_url, { email, message: msgText, attachments: attachments.length ? attachments : null });
      router.reload({ only: ['messages'], preserveScroll: true });
      setSending(false);
      setAttachments([]);
      if (uploaderRef.current) uploaderRef.current.reset();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to send message');
      router.reload({ only: ['messages'], preserveScroll: true });
      setSending(false);
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

  const resolveTicket = async () => {
    if (!window.confirm('Mark this ticket as resolved?')) return;
    setSending(true); // Reuse sending state for disable
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('access_token');
      await axios.post(route('support.guest.tickets.resolve', { uuid: ticket.uuid, access_token: token }));
      window.location.reload();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to resolve ticket');
      setSending(false);
    }
  };

  const myRole = 'supporter';
  
  let consecutiveCount = 0;
  for (let i = (localMessages || []).length - 1; i >= 0; i--) {
    if (localMessages[i].sender_role === myRole) {
      consecutiveCount++;
    } else {
      break;
    }
  }
  const limitReached = consecutiveCount >= 3;

  const getStatusColor = () => {
    switch (ticket?.status) {
      case 'awaiting_creator':
      case 'awaiting_supporter':
        return 'bg-yellow-300';
      case 'escalated':
        return 'bg-red-400';
      case 'refunded':
      case 'resolved':
        return 'bg-green-400';
      case 'rejected':
        return 'bg-gray-300';
      default:
        return 'bg-blue-300';
    }
  };

  return (
    <>
      <Head title={`Support Ticket #${ticketNumber}`} />
      <style>{`
        footer, .intercom-lightweight-app-launcher  {
          display: none;
        }
      `}</style>

      <Guest>
        <div className="bg-yellow-100 h-[calc(100dvh-77px)] md:h-[calc(100dvh-88px)]  font-cera-medium flex flex-col overflow-hidden  md:px-6  md:py-6">
          <div className="max-w-[1400px] mx-auto w-full flex flex-col h-full gap-4 relative min-h-0">
            <div className="flex-1 flex flex-col bg-white md:border-[1px] md:border-black md:rounded-box  overflow-hidden min-h-0 relative lg:h-full">
              <div className="bg-yellow-300 text-white  border-b-[1px] border-black !border-t-0 !border-l-0 !border-r-0 p-4 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="w-10 h-10 flex items-center justify-center rounded-full border-[3px] border-black bg-white text-black hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                  >
                    <ChevronLeft size={20} strokeWidth={3} />
                  </button>
                  <div>
                    <h1 className="text-lg text-black md:text-2xl font-black uppercase tracking-wide flex items-center gap-2">
                      Ticket <span className="text-[#FF007F]">#{ticketNumber}</span>
                    </h1>
                  </div>
                </div>
                <div className={`text-center px-2 md:px-4 py-2 rounded-full border-[3px] border-black text-black text-[12px] md:text-[12px] font-black uppercase tracking-widest ${getStatusColor()}`}>
                  {statusLabel}
                </div>
              </div>

              <div className="flex-1 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden min-h-0">
                <div className=" w-full lg:w-1/3 p-4 overflow-y-auto customScrollbar space-y-6 shrink-0  bg-[#fdfbf7] lg:border-r-2 !border-b-0 !border-l-2 !border-t-0 border-black">
                  <div className="bg-white border-[3px] border-black rounded-box-sm  overflow-hidden w-full">
                    <div className="bg-yellow-100 p-3 md:p-4 border-b-[3px] border-black !border-t-0 !border-l-0 !border-r-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[#FF007F] font-black uppercase tracking-wide">
                        <AlertCircle size={20} strokeWidth={3} />
                        {ticket.type === 'refund' ? 'Refund Request' : 'Support Query'}
                      </div>
                    </div>
                    <div className="p-4 md:p-5 space-y-4">
                      {ticket.sla_deadline && !['resolved', 'refunded', 'rejected'].includes(ticket.status) && (
                        <div className="flex items-center gap-1 text-[12px] md:text-xs font-black text-yellow-800 uppercase tracking-widest bg-yellow-300 px-3 py-1.5 rounded-full border-2 border-black">
                          <Clock size={14} strokeWidth={3} /> SLA: {format(new Date(ticket.sla_deadline), 'MMM do, h:mm a')}
                        </div>
                      )}
                      {['resolved', 'refunded'].includes(ticket.status) && ticket.resolved_at && (
                        <div className="flex items-center gap-1 text-[12px] md:text-xs font-black text-green-800 uppercase tracking-widest bg-green-300 px-3 py-1.5 rounded-full border-2 border-black">
                          <CheckCircle size={14} strokeWidth={3} /> Resolved: {format(new Date(ticket.resolved_at), 'MMM do, h:mm a')}
                        </div>
                      )}
                      {ticket.reason && (
                        <div>
                          <div className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-1">Reason</div>
                          <div className="text-sm font-bold text-black bg-gray-100 p-3 rounded-box-sm border-2 border-black">
                            {ticket.reason}
                          </div>
                        </div>
                      )}

                      {transaction && (
                        <div>
                          <div className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-2">Transaction Details</div>
                          <div className="bg-gray-50 rounded-box-sm border-2 border-black p-4 space-y-2">
                            <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-2">
                              <span className="text-[12px] font-black uppercase tracking-widest text-black/60">Date</span>
                              <span className="text-sm font-bold text-black">{transaction.date}</span>
                            </div>
                            <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-2">
                              <span className="text-[12px] font-black uppercase tracking-widest text-black/60">Amount</span>
                              <span className="text-sm font-bold text-black">{transaction.currency} {Number(transaction.amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[12px] font-black uppercase tracking-widest text-black/60">Item</span>
                              <span className="text-sm font-bold text-black text-right">{transaction.description}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {transaction?.message && (
                        <div>
                          <div className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-1">Supporter's Note</div>
                          <div className="text-sm font-bold text-black bg-purple-100 p-3 rounded-box-sm border-2 border-black">
                            {transaction.message}
                          </div>
                        </div>
                      )}

                      {evidence ? (
                        <div>
                          <div className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-2">Evidence</div>
                          <div className="bg-gray-50 rounded-box-sm border-2 border-black p-4">
                            <details>
                              <summary className="cursor-pointer text-xs font-black uppercase tracking-widest text-black select-none">View Evidence</summary>
                              <div className="mt-3 space-y-3">
                                <div className="grid grid-cols-1 gap-2 text-xs font-bold text-gray-800">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="text-[12px] font-black uppercase tracking-widest text-black/60">IP</div>
                                    <div className="text-right break-all">{evidence?.last?.ip || evidence?.created?.ip || 'N/A'}</div>
                                  </div>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="text-[12px] font-black uppercase tracking-widest text-black/60">User-Agent</div>
                                    <div className="text-right break-all">{evidence?.last?.user_agent || evidence?.created?.user_agent || 'N/A'}</div>
                                  </div>
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="text-[12px] font-black uppercase tracking-widest text-black/60">Session</div>
                                    <div className="text-right break-all">{evidence?.last?.session_id || evidence?.created?.session_id || 'N/A'}</div>
                                  </div>
                                </div>

                                {evidence?.stripe ? (
                                  <div className="pt-3 border-t-2 border-dashed border-gray-300">
                                    <div className="text-[12px] font-black uppercase tracking-widest text-black/60 mb-2">Stripe</div>
                                    <div className="grid grid-cols-1 gap-2 text-xs font-bold text-gray-800">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="text-[12px] font-black uppercase tracking-widest text-black/60">PI Status</div>
                                        <div className="text-right break-all">{evidence?.stripe?.payment_intent?.status || 'N/A'}</div>
                                      </div>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="text-[12px] font-black uppercase tracking-widest text-black/60">Risk</div>
                                        <div className="text-right break-all">{evidence?.stripe?.charge?.outcome?.risk_level || 'N/A'}</div>
                                      </div>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="text-[12px] font-black uppercase tracking-widest text-black/60">3DS</div>
                                        <div className="text-right break-all">{evidence?.stripe?.charge?.card?.three_d_secure?.result || 'N/A'}</div>
                                      </div>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </details>
                          </div>
                        </div>
                      ) : null}

                      {ticket.type === 'contact' && !['resolved', 'refunded', 'rejected'].includes(ticket.status) && (
                        <div className="pt-4 mt-4 border-t-2 border-dashed border-gray-200">
                          <button
                            type="button"
                            onClick={resolveTicket}
                            disabled={sending}
                            className="w-full px-6 py-3 rounded-box-sm border-[3px] border-black font-black uppercase tracking-widest text-xs bg-green-400 text-black hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-70 text-center"
                          >
                            Mark as Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-2/3 flex flex-col bg-white flex-1 min-h-0 ">
                  <div className="bg-black text-white p-4 hidden lg:flex items-center gap-3 shrink-0 border-b-[3px] border-black">
                    <MessageSquare size={20} strokeWidth={3} className="text-yellow-300" />
                    <h2 className="text-sm font-black uppercase tracking-widest">Conversation</h2>
                  </div>

                  <div className="flex-1 lg:overflow-y-auto p-4 md:p-6 space-y-6 bg-[#fdfbf7] customScrollbar relative">
                    {(!localMessages || !localMessages.length) ? (
                      <div className="flex flex-col items-center justify-center h-full text-black/60">
                        <MessageSquare size={48} strokeWidth={2} className="mb-3 opacity-50" />
                        <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
                      </div>
                    ) : (
                      localMessages.map((m) => {
                        const isMe = m.sender_role === 'supporter';
                        return (
                          <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                            {m.sender_role !== 'admin' && m.sender?.avatar ? (
                              <div className="mt-[5px] flex-shrink-0">
                                <img src={m.sender.avatar} alt="Avatar" className="w-10 h-10 object-cover rounded-box-sm border-2 border-black " />
                              </div>
                            ) : (
                              <div className="mt-[5px] flex-shrink-0 w-10 h-10 rounded-box-sm border-2 border-black bg-purple-200 flex items-center justify-center ">
                                <span className="font-black text-black text-xs uppercase">
                                  {m.sender_role.charAt(0)}
                                </span>
                              </div>
                            )}

                            <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className={`flex items-baseline gap-2 mb-1  ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className="text-[12px] font-black uppercase tracking-widest text-gray-800">
                                  {m.sender_role === 'admin' ? 'Admin / Support' : m?.sender?.username ? `@${m.sender.username}` : (m.sender_role === 'supporter' ? 'Guest Supporter' : m.sender_role)}
                                </span>
                                <span className="text-[12px] font-bold text-black/60">
                                  {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <div className={`min-w-[100px] p-3 md:p-4 rounded-box-sm border-2 border-black text-sm font-bold whitespace-pre-wrap ${
                                isMe 
                                  ? 'bg-yellow-300 text-black rounded-tr-sm ' 
                                  : m.sender_role === 'admin'
                                    ? 'bg-purple-500 text-white rounded-tl-sm '
                                    : 'bg-white text-black rounded-tl-sm '
                              }`}>
                                {m.message}
                                {Array.isArray(m.attachments) && m.attachments.length ? (
                                  <div className={`mt-3 pt-3 border-t-2 border-dashed ${isMe ? 'border-black/30' : 'border-black/20'}`}>
                                    <div className="grid grid-cols-1 gap-2">
                                      {m.attachments.map((a, idx) => {
                                        const url = typeof a === 'string' ? a : (a?.url || (a?.uuid ? `https://ucarecdn.com/${a.uuid}/` : null));
                                        if (!url) return null;
                                        const isImage = typeof a === 'string' ? /\.(jpg|jpeg|png|gif|webp)$/i.test(url) : (Boolean(a?.isImage) || String(a?.mimeType || '').startsWith('image/'));
                                        
                                        if (isImage) {
                                          return (
                                            <a
                                              key={`${a?.uuid || url}-${idx}`}
                                              href={url}
                                              target="_blank"
                                              rel="noreferrer"
                                              className={`block rounded-box-sm border-2 border-black overflow-hidden ${isMe ? 'bg-white/60' : 'bg-yellow-50'}`}
                                            >
                                              <img src={url} alt={typeof a === 'string' ? 'Attachment' : (a?.name || 'Attachment')} className="w-full h-auto object-cover max-h-[250px]" />
                                            </a>
                                          );
                                        }

                                        return (
                                          <a
                                            key={`${a?.uuid || url}-${idx}`}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className={`rounded-box-sm border-2 border-black px-3 py-2 text-xs font-black flex items-center justify-between gap-3 ${isMe ? 'bg-white/60 text-black' : 'bg-yellow-50 text-black'}`}
                                          >
                                            <span className="truncate">{typeof a === 'string' ? url.split('/').pop() : (a?.name || 'Attachment')}</span>
                                            <span className="text-[12px] font-black uppercase tracking-widest">File</span>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} className="pb-[180px] md:pb-[140px]" />
                  </div>

                  <div className="w-full absolute lg:sticky bottom-0 shrink-0 bg-white border-t-[1px] !border-l-0 !border-r-0 !border-b-0 border-black z-20">
                    {['resolved', 'refunded', 'rejected'].includes(ticket.status) ? (
                      <div className="bg-gray-100 p-4 text-center shrink-0">
                        <p className="text-xs font-black uppercase tracking-widest text-black/60">
                          This ticket is closed and cannot receive new messages.
                        </p>
                      </div>
                    ) : limitReached ? (
                      <div className="bg-yellow-100 p-4 text-center shrink-0">
                        <p className="text-xs font-black uppercase tracking-widest text-yellow-800">
                          You have sent 3 consecutive messages. Please wait for a reply.
                        </p>
                      </div>
                    ) : (
                      <div className="shrink-0 max-h-[250px] overflow-y-auto customScrollbar">
                        {attachments.length ? (
                          <div className="p-3 lg:p-4 bg-[#fdfbf7]">
                            <div className="p-3 border-2 border-black rounded-box-sm bg-white">
                              <div className="flex items-center justify-between gap-4 mb-2">
                                <div className="text-[12px] font-black uppercase tracking-widest text-black/60">Attachments</div>
                                <div className="text-[12px] font-black uppercase tracking-widest text-black/60">{attachments.length}/5</div>
                              </div>
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
                          </div>
                        ) : null}
                        <div className="relative flex ">
                          <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                send();
                              }
                            }}
                            className="flex-1 min-h-[50px] max-h-[120px] bg-white  p-3 lg:p-4 pr-[110px] font-bold text-sm resize-y  customScrollbar"
                            placeholder="Write & Press Enter to send"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAttachmentPicker(true)}
                            className="absolute right-[85px] top-[14px] lg:top-[17px] w-[40px] h-[40px] rounded-box-sm border-[2px] border-black bg-white text-black flex items-center justify-center transition-all hover:bg-gray-100"
                            title="Attach file"
                          >
                            <Paperclip size={18} strokeWidth={3} />
                          </button>
                          <button
                            type="button"
                            disabled={sending || !text.trim()}
                            onClick={send}
                            className="px-3 py-2 absolute right-5 top-[14px] lg:top-[17px] flex-shrink-0 h-[40px] rounded-box-sm border-[2px] border-black bg-[#FF007F] text-black flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110"
                          >
                            <Send size={18} strokeWidth={3} className="mr-1" />
                          </button>
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
                        <div className=" w-full">
                          <GlobalUploader
                            ref={uploaderRef}
                            ctxName={`guest-support-chat-${ticket?.uuid || 'unknown'}`}
                            type="minimal"
                            view={false}
                            imgonly={false}
                            accept="image/*,video/*,application/pdf"
                            sendFile={addAttachment}
                          />
                        </div>
                      </div>
                    </div>
                  </Popup>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Guest>
    </>
  );
}
