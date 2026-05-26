import { Head, Link } from '@inertiajs/react';
import { useMemo, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Avatar from '@/Components/Avatar';
import Popup from '@/Components/Popup';
import { ChevronLeft, MessageSquare, AlertCircle, Clock, CheckCircle, Send, Info } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function Show({ auth, ticket, transaction, messages, viewer }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [acting, setActing] = useState(false);
  const [showActionBox, setShowActionBox] = useState(false);
  const messagesEndRef = useRef(null);

  const canActOnRefund = ticket?.type === 'refund' && !['refund_initiated', 'refunded', 'rejected', 'escalated'].includes(ticket?.status);

  const statusLabel = useMemo(() => {
    const s = String(ticket?.status || '');
    return s.replaceAll('_', ' ').toUpperCase();
  }, [ticket?.status]);

  const ticketNumber = useMemo(() => {
    return ticket?.uuid ? ticket.uuid.split('-')[0].toUpperCase() : 'UNKNOWN';
  }, [ticket?.uuid]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await axios.post(route('support.tickets.message', ticket.uuid), { message: text });
      window.location.reload();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to send message');
      setSending(false);
    }
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

  const myRole = viewer?.role;
  
  let consecutiveCount = 0;
  for (let i = (messages || []).length - 1; i >= 0; i--) {
    if (messages[i].sender_role === myRole) {
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
    <AuthenticatedLayout auth={auth} user={auth.user}>
      <Head title={`Support Ticket #${ticketNumber}`} />
      <style>{`
        footer {
          display: none;
        }
      `}</style>
      <div className="h-[calc(100vh-80px)] bg-[#fdfbf7] font-cera-medium flex flex-col overflow-hidden px-4 sm:px-6 py-4 lg:py-6">
        <div className="max-w-3xl mx-auto w-full flex flex-col h-full gap-4">
          
          {/* Header Section */}
          <div className="flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <Link
                href={viewer?.role === 'creator' ? '/creator/disputes' : '/history'}
                className="w-10 h-10 flex items-center justify-center rounded-full border-[3px] border-black bg-white text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <ChevronLeft size={20} strokeWidth={3} />
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-wide flex items-center gap-2">
                  Ticket <span className="text-[#FF007F]">#{ticketNumber}</span>
                </h1>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">
                  {ticket.event_type?.replaceAll('_', ' ')} • {ticket.source_id ? `ID: ${ticket.source_id}` : ''}
                </div>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full border-[3px] border-black text-black text-xs font-black uppercase tracking-widest shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${getStatusColor()}`}>
              {statusLabel}
            </div>
          </div>

          {/* Main Chat Container */}
          <div className="flex-1 flex flex-col bg-white border-[3px] border-black rounded-[30px] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden min-h-0">
            
            {/* Chat Header */}
            <div className="bg-black text-white p-4 flex items-center gap-3 shrink-0">
              <MessageSquare size={20} strokeWidth={3} className="text-yellow-300" />
              <h2 className="text-sm font-black uppercase tracking-widest">Conversation</h2>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#fdfbf7] customScrollbar">
              
              {/* Ticket Details (System Message Card) */}
              <div className="bg-white border-[3px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden mb-8 max-w-2xl mx-auto w-full">
                <div className="bg-yellow-100 p-3 md:p-4 border-b-[3px] border-black flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[#FF007F] font-black uppercase tracking-wide">
                    <AlertCircle size={20} strokeWidth={3} />
                    {ticket.type === 'refund' ? 'Refund Request' : 'Support Query'}
                  </div>
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
                </div>
                <div className="p-4 md:p-5 space-y-4">
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
                          <span className="text-sm font-bold text-black">{transaction.currency} {Number(transaction.amount || 0).toFixed(2)}</span>
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
                </div>
              </div>

              {/* Messages */}
              {(!messages || !messages.length) ? (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <MessageSquare size={48} strokeWidth={2} className="mb-3 opacity-50" />
                  <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMe = m.sender_role === viewer?.role;
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
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                            {m.sender_role === 'admin' ? 'Admin / Support' : m?.sender?.username ? `@${m.sender.username}` : (m.sender_role === 'supporter' ? 'Guest Supporter' : m.sender_role)}
                          </span>
                          <span className="text-[9px] font-bold text-gray-400">
                            {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div className={`p-4 rounded-[20px] border-2 border-black text-sm font-bold whitespace-pre-wrap ${
                          isMe 
                            ? 'bg-yellow-300 text-black rounded-tr-none shadow-[[-3px_3px_0px_0px_rgba(0,0,0,0.1)]]' 
                            : m.sender_role === 'admin'
                              ? 'bg-purple-500 text-white rounded-tl-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                              : 'bg-white text-black rounded-tl-none shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
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

            {/* Creator Actions Area (Sticky above input) */}
              {canActOnRefund && viewer?.role === 'creator' && (
                <div className="p-4 bg-gray-100 border-t-[3px] border-black shrink-0 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setShowActionBox(true)}
                    className="w-full h-12 rounded-[20px] border-[3px] border-black font-black uppercase tracking-widest text-xs bg-yellow-300 text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                  >
                    Take Action
                  </button>
                  
                  <Popup action={showActionBox} onHide={() => setShowActionBox(false)} size="lg" hidecontrols={true}>
                    <div className="bg-[#FF007F] p-5">
                      <div className="flex items-center justify-between gap-2 text-xs font-black uppercase tracking-widest text-white mb-4">
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
                          <button
                            type="button"
                            disabled={acting}
                            onClick={rejectRefund}
                            className="h-11 px-6 rounded-[15px] border-2 border-black font-black uppercase tracking-widest text-[10px] bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={approveRefund}
                            className="h-11 px-6 rounded-[15px] border-2 border-black font-black uppercase tracking-widest text-[10px] bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Approve
                          </button>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </div>
              )}

            {/* Supporter Notice Area */}
            {canActOnRefund && viewer?.role === 'supporter' && (
              <div className="p-3 bg-yellow-100 border-t-[3px] border-black text-center shrink-0">
                <p className="text-xs font-black uppercase tracking-widest text-yellow-800">
                  Refund Request Pending: The creator must respond before the SLA deadline.
                </p>
              </div>
            )}

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
                        sendMessage();
                      }
                    }}
                    className="flex-1 min-h-[50px] max-h-[120px] bg-[#fdfbf7] border-2 border-black rounded-[20px] p-3 font-bold text-sm resize-y focus:ring-0 customScrollbar"
                    placeholder="Write your message... (Press Enter to send)"
                  />
                  <button
                    type="button"
                    disabled={sending || !text.trim()}
                    onClick={sendMessage}
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
    </AuthenticatedLayout>
  );
}
