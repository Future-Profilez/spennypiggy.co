import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect, useRef } from 'react';
import axios from 'axios';
import Avatar from '@/Components/Avatar';
import { MessageSquare, AlertCircle, Clock, CheckCircle, Send } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function Ticket({ ticket, creator, transaction, messages, email, post_url }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const [localMessages, setLocalMessages] = useState(messages || []);

  const ticketNumber = useMemo(() => {
    return ticket?.uuid ? ticket.uuid.split('-')[0].toUpperCase() : 'UNKNOWN';
  }, [ticket?.uuid]);

  const statusLabel = useMemo(() => {
    const s = String(ticket?.status || '');
    return s.replaceAll('_', ' ').toUpperCase();
  }, [ticket?.status]);

  useEffect(() => {
    setLocalMessages(messages || []);
  }, [messages]);

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
      created_at: new Date().toISOString()
    };
    setLocalMessages(prev => [...prev, tempMsg]);

    try {
      await axios.post(post_url, { email, message: msgText });
      router.reload({ only: ['messages'], preserveScroll: true });
      setSending(false);
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to send message');
      router.reload({ only: ['messages'], preserveScroll: true });
      setSending(false);
    }
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
    <div className="h-[100dvh] bg-[#fdfbf7] font-cera-medium flex flex-col overflow-hidden">
      <Head title={`Support Ticket #${ticketNumber}`} />
      
      {/* Header Section */}
      <div className="flex items-center justify-between gap-4 p-4 border-b-[3px] border-black bg-white shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide flex items-center gap-2">
            Ticket <span className="text-[#FF007F]">#{ticketNumber}</span>
          </h1>
          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
            {ticket.event_type?.replaceAll('_', ' ')} • {ticket.source_id ? `ID: ${ticket.source_id}` : ''}
          </div>
        </div>
        <div className={`self-start sm:self-auto px-4 py-2 rounded-full border-[3px] border-black text-black text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${getStatusColor()}`}>
          {statusLabel}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1400px] w-full mx-auto">
        {/* Left Column: Details */}
        <div className="w-full lg:w-1/3 p-4 overflow-y-auto customScrollbar space-y-6">
          <div className="rounded-[30px]  bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
            <div className="flex items-center gap-2 mb-4 text-[#FF007F]">
              <AlertCircle size={24} strokeWidth={3} />
              <h2 className="text-lg font-black uppercase tracking-wide text-black">
                {ticket.type === 'refund' ? 'Refund Request' : 'Support Query'}
              </h2>
            </div>
            
            {creator ? (
              <div className="mb-4 bg-gray-50 p-3 rounded-[20px] border-2 border-black flex items-center gap-3">
                {creator.avatar ? (
                  <img src={creator.avatar} alt="Avatar" className="w-10 h-10 object-cover rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-black bg-blue-200 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <span className="font-black text-xs uppercase">{creator.username?.charAt(0)}</span>
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">Creator</div>
                  <div className="text-sm font-bold text-black">@{creator.username}</div>
                </div>
              </div>
            ) : null}

            {ticket.reason ? (
              <div className="mb-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Reason</div>
                <div className="text-sm font-bold text-black bg-gray-100 p-3 rounded-[20px] border-2 border-black">
                  {ticket.reason}
                </div>
              </div>
            ) : null}

            {ticket.sla_deadline && !['resolved', 'refunded', 'rejected'].includes(ticket.status) ? (
              <div className="mt-4 flex items-start gap-2 bg-yellow-100 p-3 rounded-[20px] border-2 border-black">
                <Clock size={16} strokeWidth={3} className="text-yellow-600 mt-0.5" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-yellow-800">SLA Deadline</div>
                  <div className="text-xs font-bold text-black">
                    {format(new Date(ticket.sla_deadline), 'MMM do yyyy, h:mm a')}
                  </div>
                </div>
              </div>
            ) : null}

            {['resolved', 'refunded'].includes(ticket.status) && ticket.resolved_at ? (
              <div className="mt-4 flex items-start gap-2 bg-green-100 p-3 rounded-[20px] border-2 border-black">
                <CheckCircle size={16} strokeWidth={3} className="text-green-600 mt-0.5" />
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-green-800">Resolved At</div>
                  <div className="text-xs font-bold text-black">
                    {format(new Date(ticket.resolved_at), 'MMM do yyyy, h:mm a')}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Transaction Details Box */}
          {transaction && (
            <div className="rounded-[30px]  bg-white border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
              <h2 className="text-lg font-black uppercase tracking-wide text-black mb-4">Transaction Details</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Date</span>
                  <span className="text-sm font-bold text-black">{transaction.date}</span>
                </div>
                <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Amount</span>
                  <span className="text-sm font-bold text-black">{transaction.currency} {Number(transaction.amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center border-b-2 border-dashed border-gray-300 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Item</span>
                  <span className="text-sm font-bold text-black text-right">{transaction.description}</span>
                </div>
                {transaction.message && (
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Your Message</div>
                    <div className="text-sm font-bold text-black bg-gray-100 p-3 rounded-[20px] border-2 border-black">
                      {transaction.message}
                    </div>
                  </div>
                )}
                
                {/* Mark as Resolved Button in Details Box */}
                {ticket.type === 'contact' && !['resolved', 'refunded', 'rejected'].includes(ticket.status) && (
                  <div className="pt-4 mt-4 border-t-2 border-dashed border-gray-200">
                    <button
                      type="button"
                      onClick={resolveTicket}
                      disabled={sending}
                      className="w-full px-6 py-3 rounded-[15px] border-[3px] border-black font-black uppercase tracking-widest text-xs bg-green-400 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70 text-center"
                    >
                      Mark as Resolved
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Chat Box */}
        <div className="w-full lg:w-2/3 flex flex-col border-t-[3px] lg:border-t-0 lg:border-l-[3px] border-black bg-white">
          {/* Chat Header */}
          <div className="bg-black text-white p-4 flex items-center gap-3 shrink-0">
            <MessageSquare size={20} strokeWidth={3} className="text-yellow-300" />
            <h2 className="text-sm font-black uppercase tracking-widest">Conversation</h2>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fdfbf7] customScrollbar relative">
            
            {(!localMessages || !localMessages.length) ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageSquare size={48} strokeWidth={2} className="mb-3 opacity-50" />
                <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
              </div>
            ) : (
              localMessages.map((m) => {
                const isMe = m.sender_role === 'supporter';
                return (
                  <div key={m.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    {m.sender_role !== 'admin' && m.sender?.avatar ? (
                      <div className="flex-shrink-0">
                        <img src={m.sender.avatar} alt="Avatar" className="w-10 h-10 object-cover rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-10 h-10 rounded-full border-2 border-black bg-purple-200 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        <span className="font-black text-black text-xs uppercase">
                          {m.sender_role.charAt(0)}
                        </span>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`flex items-baseline gap-2 mb-1 mx-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-800">
                          {m.sender_role === 'admin' ? 'Admin / Support' : m?.sender?.username ? `@${m.sender.username}` : (m.sender_role === 'supporter' ? 'Guest Supporter' : m.sender_role)}
                        </span>
                        <span className="text-[9px] font-bold text-gray-500">
                          {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div className={`p-3 md:p-4 rounded-[30px] border-2 border-black text-sm font-bold whitespace-pre-wrap ${
                        isMe 
                          ? 'bg-yellow-300 text-black rounded-tr-sm shadow-[-3px_3px_0px_0px_rgba(0,0,0,1)]' 
                          : m.sender_role === 'admin'
                            ? 'bg-purple-500 text-white rounded-tl-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                            : 'bg-white text-black rounded-tl-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                      }`}>
                        {m.message}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            {['resolved', 'refunded', 'rejected'].includes(ticket.status) ? (
              <div className="bg-gray-100 p-4 border-t-[3px] border-black text-center shrink-0">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                  This ticket is closed and cannot receive new messages.
                </p>
              </div>
            ) : limitReached ? (
              <div className="bg-yellow-100 p-4 border-t-[3px] border-black text-center shrink-0">
                <p className="text-xs font-black uppercase tracking-widest text-yellow-800">
                  You have sent 3 consecutive messages. Please wait for a reply.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-white border-t-[3px] border-black shrink-0">
                <div className="flex gap-3">
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    className="flex-1 min-h-[50px] max-h-[120px] bg-[#fdfbf7] border-2 border-black rounded-[20px] p-3 font-bold text-sm resize-y focus:ring-0 customScrollbar"
                    placeholder="Write your message... (Press Enter to send)"
                  />
                  <button
                    type="button"
                    disabled={sending || !text.trim()}
                    onClick={send}
                    className="flex-shrink-0 w-12 h-12 rounded-full border-[3px] border-black bg-[#FF007F] text-white flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} strokeWidth={3} className="ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
    );
  }
