import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Popup from '@/Components/Popup';
import { ChevronLeft, MessageSquare, AlertCircle, Clock, CheckCircle, Send, Info, Paperclip } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import GlobalUploader from '@/uploadcare/Uploader';
import { route } from 'ziggy-js';

export default function Show({ auth, ticket, transaction, messages, viewer }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [acting, setActing] = useState(false);
  const [showActionBox, setShowActionBox] = useState(false);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const uploaderRef = useRef(null);
  
  const [localMessages, setLocalMessages] = useState(messages || []);
  const [attachments, setAttachments] = useState([]);

  const canActOnRefund = ticket?.type === 'refund' && !['refund_initiated', 'refunded', 'rejected', 'escalated'].includes(ticket?.status);

  const statusLabel = useMemo(() => {
    const s = String(ticket?.status || '');
    return s.replaceAll('_', ' ').toUpperCase();
  }, [ticket?.status]);

  const ticketNumber = useMemo(() => {
    return ticket?.uuid ? ticket.uuid.split('-')[0].toUpperCase() : 'UNKNOWN';
  }, [ticket?.uuid]);

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
  const actionMessageRef = useRef(actionMessage);

  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    actionMessageRef.current = actionMessage;
  }, [actionMessage]);

  useEffect(() => {
    // Auto-refresh chat and ticket data every 10 seconds without full page reload
    const interval = setInterval(() => {
      // Pause polling if the user is currently typing a message or action note
      if (!textRef.current?.trim() && !actionMessageRef.current?.trim()) {
        router.reload({
          only: ['ticket', 'messages', 'transaction'],
          preserveScroll: true,
          preserveState: true,
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const msgText = text;
    setText('');
    setSending(true);
    
    // Optimistic UI Update
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_role: viewer?.role,
      sender: {
        username: auth?.user?.username,
        avatar: auth?.user?.avatar_url
      },
      message: msgText,
      attachments: attachments.length ? attachments : null,
      created_at: new Date().toISOString()
    };
    setLocalMessages(prev => [...prev, tempMsg]);

    try {
      await axios.post(route('support.tickets.message', ticket.uuid), { message: msgText, attachments: attachments.length ? attachments : null });
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
    // Note: Not calling reset() here because it clears the Uploadcare widget UI
    // which gives visual feedback to the user that the file is uploaded.
  };

  const removeAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const approveRefund = async () => {
    setActing(true);
    try {
      await axios.post(route('support.tickets.creator.approve-refund', ticket.uuid), { message: actionMessage || null });
      window.location.reload();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to approve refund');
      setActing(false);
    }
  };

  const rejectRefund = async () => {
    if (!actionMessage.trim()) {
      alert('Please write a rejection message.');
      return;
    }
    setActing(true);
    try {
      await axios.post(route('support.tickets.creator.reject-refund', ticket.uuid), { message: actionMessage });
      window.location.reload();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to reject refund');
      setActing(false);
    }
  };

  const resolveTicket = async () => {
    if (!window.confirm('Mark this ticket as resolved?')) return;
    setActing(true);
    try {
      await axios.post(route('support.tickets.resolve', ticket.uuid));
      window.location.reload();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to resolve ticket');
      setActing(false);
    }
  };

  const myRole = viewer?.role;
  
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
        return 'bg-orange-300';
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
    <AuthenticatedLayout auth={auth} user={auth.user}>
      <Head title={`Support Ticket #${ticketNumber}`} />
      <style>{`
        footer, .intercom-lightweight-app-launcher  {
          display: none;
        }
      `}</style>
      <div className=" h-[calc(100dvh-133px)] md:h-[calc(100dvh-80px)] bg-[#fdfbf7] font-cera-medium flex flex-col overflow-hidden  md:px-6  md:py-6">
        <div className="max-w-[1400px] mx-auto w-full flex flex-col h-full gap-4 relative min-h-0">
          <div className="flex-1 flex flex-col bg-white md:border-[1px] md:border-black md:rounded-[30px]  overflow-hidden min-h-0 relative lg:h-full">
            <div className="bg-yellow-300 text-white border-b-[1px] border-black !border-t-0 !border-l-0 !border-r-0 p-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <Link
                  href={viewer?.role === 'creator' ? '/creator/disputes' : '/history'}
                  className="w-10 h-10 flex items-center justify-center rounded-full border-[3px] border-black bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                >
                  <ChevronLeft size={20} strokeWidth={3} />
                </Link>
                <div>
                  <h1 className="text-lg text-black md:text-2xl font-black uppercase tracking-wide flex items-center gap-2">
                    Ticket <span className="text-[#FF007F]">#{ticketNumber}</span>
                  </h1>
                </div>
              </div>
              <div className={`text-center px-2 md:px-4 py-2 rounded-full border-[3px] border-black text-black text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${getStatusColor()}`}>
                {statusLabel}
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row  overflow-auto lg:overflow-hidden min-h-0">
              <div className="w-full lg:w-1/3 p-4 overflow-y-auto customScrollbar space-y-6 shrink-0  bg-[#fdfbf7]">
                <div className="bg-white border-[3px] border-black rounded-[20px] overflow-hidden w-full">
                  <div className="bg-yellow-100 p-3 md:p-4 border-b-[3px] border-black !border-t-0 !border-l-0 !border-r-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[#FF007F] font-black uppercase tracking-wide">
                      <AlertCircle size={20} strokeWidth={3} />
                      {ticket.type === 'refund' ? 'Refund Request' : 'Support Query'}
                    </div>
                  </div>
                  <div className="p-4 md:p-5 space-y-4">
                    {ticket.sla_deadline && !['resolved', 'refunded', 'rejected'].includes(ticket.status) && (
                      <div className="flex items-center gap-1 text-[10px] md:text-xs font-black text-yellow-800 uppercase tracking-widest bg-yellow-300 px-3 py-1.5 rounded-full border-2 border-black">
                        <Clock size={14} strokeWidth={3} /> SLA: {format(new Date(ticket.sla_deadline), 'MMM do, h:mm a')}
                      </div>
                    )}
                    {['resolved', 'refunded'].includes(ticket.status) && ticket.resolved_at && (
                      <div className="flex items-center gap-1 text-[10px] md:text-xs font-black text-green-800 uppercase tracking-widest bg-green-300 px-3 py-1.5 rounded-full border-2 border-black">
                        <CheckCircle size={14} strokeWidth={3} /> Resolved: {format(new Date(ticket.resolved_at), 'MMM do, h:mm a')}
                      </div>
                    )}
                    {ticket.reason && (
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Reason</div>
                        <div className="text-sm font-bold text-black bg-gray-100 p-3 rounded-[15px] border-2 border-black">
                          {ticket.reason}
                        </div>
                      </div>
                    )}

                    {transaction && (
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Transaction Details</div>
                        <div className="bg-gray-50 rounded-[15px] border-2 border-black p-4 space-y-2">
                          <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Date</span>
                            <span className="text-sm font-bold text-black">{transaction.date}</span>
                          </div>
                          <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Amount</span>
                            <span className="text-sm font-bold text-black">{transaction.currency} {Number(viewer?.role === 'creator' ? (transaction.net_amount || transaction.amount || 0) : (transaction.amount || 0)).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Item</span>
                            <span className="text-sm font-bold text-black text-right">{transaction.description}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {transaction?.message && (
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Gifter's Note</div>
                        <div className="text-sm font-bold text-black bg-purple-100 p-3 rounded-[15px] border-2 border-black">
                          {transaction.message}
                        </div>
                      </div>
                    )}

                    {canActOnRefund && viewer?.role === 'supporter' && (
                      <div className="mt-4 bg-yellow-100 p-3 rounded-[15px] border-2 border-black text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-yellow-800">
                          Refund Request Pending: The creator must respond before the SLA deadline.
                        </p>
                      </div>
                    )}

                    {ticket.type === 'contact' && !['resolved', 'refunded', 'rejected'].includes(ticket.status) && (viewer?.role !== 'creator' || (localMessages || []).some(m => m.sender_role === 'creator')) && (
                      <div className="pt-4 mt-4 border-t-2 border-dashed border-gray-200">
                        <button
                          type="button"
                          onClick={resolveTicket}
                          disabled={acting}
                          className="w-full px-6 py-3 rounded-[15px] border-[3px] border-black font-black uppercase tracking-widest text-xs bg-green-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70 text-center"
                        >
                          Mark as Resolved
                        </button>
                      </div>
                    )}

                    {canActOnRefund && viewer?.role === 'creator' && (
                      <div className="pt-4 mt-4 border-t-2 border-dashed border-gray-200">
                        <button
                          type="button"
                          onClick={() => setShowActionBox(true)}
                          className="w-full px-6 py-3 rounded-[15px] border-[3px] border-black font-black uppercase tracking-widest text-xs bg-yellow-300 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all text-center"
                        >
                          Take Action
                        </button>
                        <Popup action={showActionBox} onHide={() => setShowActionBox(false)} size="lg" hidecontrols={true}>
                          <div className="bg-white md:p-2">
                            <div className="flex items-center justify-between gap-2 text-normal font-black uppercase tracking-widest text-black mb-4">
                              <div className="flex items-center gap-2"><Info size={16} strokeWidth={3} /> Creator Actions</div>
                            </div>
                            <div className="flex flex-col gap-4">
                              <textarea
                                value={actionMessage}
                                onChange={(e) => setActionMessage(e.target.value)}
                                className="w-full min-h-[100px] bg-white border-2 border-black rounded-[15px] p-3 font-bold text-sm resize-y focus:ring-0 customScrollbar"
                                placeholder="Add a note (required for rejection)…"
                              />
                              <div className="flex justify-end gap-3 shrink-0">
                                <button type="button" disabled={acting} onClick={rejectRefund}
                                  className="h-11 px-6 rounded-full border-2 border-black font-black uppercase tracking-widest text-xs bg-white text-black hover:bg-gray-100 transition-all disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed"> {acting ? 'Rejecting...' : 'Reject Request'} </button>
                                <button type="button" disabled={acting} onClick={approveRefund}
                                  className="h-11 px-6 rounded-full border-2 border-black font-black uppercase tracking-widest text-xs bg-yellow-300 text-black hover:bg-yellow-400 transition-all disabled:opacity-70 cursor-pointer disabled:cursor-not-allowed" > {acting ? 'Refunding...' : 'Refund'}   </button>
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-2/3 flex flex-col bg-white flex-1 min-h-0">
                <div className="bg-black text-white p-4 hidden lg:flex items-center gap-3 shrink-0 border-b-[3px] border-black">
                  <MessageSquare size={20} strokeWidth={3} className="text-yellow-300" />
                  <h2 className="text-sm font-black uppercase tracking-widest">Conversation</h2>
                </div>

                <div className="flex-1 h-full lg:overflow-y-auto p-4 md:p-6 space-y-6 bg-[#fdfbf7] customScrollbar relative">
                  {(!localMessages || !localMessages.length) ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <MessageSquare size={48} strokeWidth={2} className="mb-3 opacity-50" />
                      <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
                    </div>
                  ) : (
                    localMessages.map((m) => {
                      const isMe = m.sender_role === viewer?.role;
                      return (
                        <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                          {m.sender_role !== 'admin' && m.sender?.avatar ? (
                            <div className="mt-[5px] flex-shrink-0">
                              <img src={m.sender.avatar} alt="Avatar" className="w-10 h-10 object-cover rounded-[10px] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] " />
                            </div>
                          ) : (
                            <div className="mt-[5px] flex-shrink-0 w-10 h-10 rounded-[10px] border-2 border-black bg-purple-200 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <span className="font-black text-black text-xs uppercase">
                                {m.sender_role.charAt(0)}
                              </span> 
                            </div>
                          )}

                          <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">
                                {m.sender_role === 'admin' ? 'Admin / Support' : m?.sender?.username ? `@${m.sender.username}` : (m.sender_role === 'supporter' ? 'Guest Supporter' : m.sender_role)}
                              </span>
                              <span className="text-[9px] font-bold text-gray-500">
                                {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className={`min-w-[100px] p-3 md:p-4 rounded-[20px] border-2 border-black text-sm font-bold whitespace-pre-wrap ${
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
                                            className={`block rounded-[14px] border-2 border-black overflow-hidden ${isMe ? 'bg-white/60' : 'bg-yellow-50'}`}
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
                                          className={`rounded-[14px] border-2 border-black px-3 py-2 text-xs font-black flex items-center justify-between gap-3 ${isMe ? 'bg-white/60 text-black' : 'bg-yellow-50 text-black'}`}
                                        >
                                          <span className="truncate">{typeof a === 'string' ? url.split('/').pop() : (a?.name || 'Attachment')}</span>
                                          <span className="text-[10px] font-black uppercase tracking-widest">File</span>
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

                <div className="bg-white z-20 absolute lg:sticky bottom-0 w-full">
                  {['resolved', 'refunded', 'rejected'].includes(ticket.status) ? (
                    <div className="bg-gray-100 p-4 text-center shrink-0">
                      <p className="text-xs font-black uppercase tracking-widest text-gray-500">
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
                    <div className="w-full max-h-[250px] overflow-y-auto customScrollbar">
                      {attachments.length ? (
                        <div className="p-3 bg-[#fdfbf7]">
                          <div className="p-3 border-2 border-black rounded-[15px] bg-white">
                            <div className="flex items-center justify-between gap-4 mb-2">
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Attachments</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{attachments.length}/5</div>
                            </div>
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
                        </div>
                      ) : null}
                      <div className=" w-full relative flex gap-3">
                        <textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          className="flex-1 min-h-[50px] max-h-[120px] bg-white border-1 border-black !border-r-0 !border-b-0 !border-l-0 p-3  pr-[110px] font-bold text-sm resize-y focus:ring-0 customScrollbar"
                          placeholder="Write & Press Enter to send"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAttachmentPicker(true)}
                          className="absolute right-[85px] top-[13px] w-[40px] h-[40px] rounded-[15px] border-[2px] border-black bg-white text-black flex items-center justify-center transition-all hover:bg-gray-100"
                          title="Attach file"
                        >
                          <Paperclip size={18} strokeWidth={3} />
                        </button>
                        <button
                          type="button"
                          disabled={sending || !text.trim()}
                          onClick={sendMessage}
                          className="px-3 py-2 absolute right-5 top-[13px] flex-shrink-0 h-[40px] rounded-[15px] border-[2px] border-black bg-[#FF007F] text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600"
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
                        <div className="text-xs font-black uppercase tracking-widest text-gray-500">Attachments</div>
                        <div className="text-lg font-black mt-1">Choose file</div>
                        <div className="text-[10px] font-bold text-gray-600 mt-1">Up to 5 files. Max 5MB each.</div>
                      </div>
                    </div>
                    <div className="mt-4 rounded-[18px] border-2 border-black bg-gray-50 p-3">
                      <div className="w-full">
                        <GlobalUploader
                          ref={uploaderRef}
                          ctxName={`support-ticket-chat-${ticket?.uuid || 'unknown'}`}
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
    </AuthenticatedLayout>
  );
}
