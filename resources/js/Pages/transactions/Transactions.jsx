import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import LoadingScreen from '@/includes/LoadingScreen';
import LazyVideo from '@/Components/LazyVideo';
import Nocontent from '@/includes/Nocontent';
import axios from 'axios';
import Authenticated from '../../Layouts/AuthenticatedLayout';
import ReactionsAndReply from '@/Components/ReactionsAndReply';
import LedgerBreakdown, { StateChip } from '@/Components/Transactions/LedgerBreakdown';
import DeliveryStatus from '@/Components/Transactions/DeliveryStatus';
import RefreshRecordsButton from '@/Components/RefreshRecordsButton';
import { FaTwitter } from 'react-icons/fa';
import Modal from '@/Components/Modal';
import Popup from '@/Components/Popup';
import SupportModal from './SupportModal';
import { router } from '@inertiajs/react';
import { ChevronLeft, Calendar, FileText, ExternalLink, Filter, Unlock } from 'lucide-react';

export default function Transactions(props) {
  const { auth, initial, display_currency, spend_summary } = props || {};
  const { currencies } = usePage().props;
  const [data, setData] = useState(() => initial || { events: [], has_more: false, next_before: null, stats: { received: {}, sent: {} } });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [direction, setDirection] = useState('all'); // all | received | sent
  const [query, setQuery] = useState('');
  const [twitterModal, setTwitterModal] = useState({ show: false, event: null });
  const [supportModalState, setSupportModalState] = useState({ show: false, event: null, type: 'contact' });
  const [shopAnswerDrafts, setShopAnswerDrafts] = useState({});
  const [submittingShopAnswers, setSubmittingShopAnswers] = useState(new Set());
  const [submittedShopAnswers, setSubmittedShopAnswers] = useState(new Set());

  const displayCurrency = (display_currency || auth?.user?.default_currency || 'GBP').toUpperCase();
  const displayDigits = currencies?.[displayCurrency]?.ISOdigits ?? 2;

  const formatMoney = (value) => {
    const amount = Number(value || 0);
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: displayCurrency,
      minimumFractionDigits: displayDigits,
      maximumFractionDigits: displayDigits,
    }).format(amount);
  };

  // The breakdown is stated in the transaction's OWN currency, not the viewer's
  // display currency — a fee split converted at today's rate would not add up to the
  // charge the supporter actually saw.
  const formatInCurrency = (value, currency) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: (currency || displayCurrency || 'GBP').toUpperCase(),
    }).format(Number(value || 0));

  const lifetimeStats = data?.stats || { received: {}, sent: {} };

  const storyUrlFor = (e) => {
    const creator = e.category === 'sent' ? e.creator?.username : auth?.user?.username;
    const gifter = e.category === 'received' ? e.gifter?.username : auth?.user?.username;
    if (!creator || !gifter) return null;
    return `/support/${creator}/${gifter}`;
  };

  const fetchFeed = (cursor = null, append = false) => {
    const p1 = new URLSearchParams(); p1.set('tab', 'received'); p1.set('limit', '20'); if (cursor) p1.set('before', cursor);
    const p2 = new URLSearchParams(); p2.set('tab', 'sent'); p2.set('limit', '20'); if (cursor) p2.set('before', cursor);
    Promise.all([fetch(`/history-feed?${p1.toString()}`), fetch(`/history-feed?${p2.toString()}`)])
      .then(async ([r1, r2]) => {
        const a = await r1.json(); const b = await r2.json();
        const all = [...(a.events || []), ...(b.events || [])].sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
        const mergedResp = { events: all, has_more: (a.has_more || b.has_more), next_before: a.next_before || b.next_before };
        setData(prev => {
          const stats = prev?.stats || initial?.stats || { received: {}, sent: {} };
          if (!append) return { ...mergedResp, stats };
          return { ...(mergedResp || {}), stats, events: [...(prev?.events || []), ...all] };
        });
      })
      .catch(() => { setData({ events: [] }); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (initial && Array.isArray(initial.events) && initial.events.length) {
      return;
    }
    fetchFeed(null, false);
  }, [initial]);

  const iconFor = (t) => {
    switch (t) {
      case 'gift_wish': return '🎁';
      case 'gift_membership': return '🎟️';
      case 'gift_bill': return '🧾';
      case 'gift_tip': return '💖';
      case 'piggy_pot': return '🐷';
      case 'gift_shop': return '🛍️';
      case 'gift_task': return '🧩';
      default: return '✨';
    }
  };

  // Per-type accent — gives each monetisation type its own colour identity
  // (gradient strip, soft chip bg, status dot) without leaving the brand.
  const typeStyle = (t) => {
    switch (t) {
      case 'gift_wish':       return { grad: 'from-pink-400 to-pink-600',     soft: 'bg-pink-50' };
      case 'gift_membership': return { grad: 'from-violet-400 to-violet-600', soft: 'bg-violet-50' };
      case 'gift_bill':       return { grad: 'from-sky-400 to-sky-600',       soft: 'bg-sky-50' };
      case 'gift_tip':        return { grad: 'from-rose-400 to-rose-600',     soft: 'bg-rose-50' };
      case 'piggy_pot':       return { grad: 'from-amber-400 to-amber-600',   soft: 'bg-amber-50' };
      case 'gift_shop':       return { grad: 'from-teal-400 to-teal-600',     soft: 'bg-teal-50' };
      case 'gift_task':       return { grad: 'from-indigo-400 to-indigo-600', soft: 'bg-indigo-50' };
      default:                return { grad: 'from-gray-400 to-gray-600',     soft: 'bg-gray-50' };
    }
  };

  const titleFor = (e) => {
    switch (e.type) {
      case 'gift_wish': return e.category === 'received' ? 'Content purchased' : 'You purchased content';
      case 'gift_membership': return e.category === 'received' ? 'Membership payment' : 'You subscribed to a membership';
      case 'gift_bill': return e.category === 'received' ? 'Subscription payment' : 'You subscribed to content';
      case 'gift_tip': return e.category === 'received' ? 'Support payment' : 'You sent support';
      case 'piggy_pot': return e.category === 'received' ? 'Content purchase' : 'You unlocked content';
      case 'gift_shop': return e.category === 'received' ? 'Shop order' : 'You purchased from the shop';
      case 'gift_task': return e.category === 'received' ? 'Task purchase' : 'You purchased a task';
      default: return 'Transaction';
    }
  };

  const filtered = (data.events || []).filter(e => {
    if (direction !== 'all' && e.category !== direction) return false;
    if (filter !== 'all' && e.type !== filter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    const hay = [
      e?.creator?.username || '',
      e?.creator?.name || '',
      e?.gifter?.username || '',
      e?.gifter?.name || '',
      e?.item_title || ''
    ].join(' ').toLowerCase();
    return hay.includes(q);
  });

  const amountFor = (e) => {
    return formatMoney(e.display_amount ?? 0);
  };

  const defaultAvatar = 'https://ucarecdn.com/2c6afc02-8ae1-4e8b-8f53-d71f6066dd77/-/preview/600x600/';

  const isNew = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    return (now - d) < 24 * 60 * 60 * 1000;
  };

  const handleTwitterClick = (e) => {
    setTwitterModal({ show: true, event: e });
  };

  const shareOnTwitter = (e) => {
    if (!e) return;
    const cp = e.category === 'sent' 
      ? (e?.creator?.username ? `@${e.creator.username}` : (e?.creator?.name || 'a creator'))
      : (e?.gifter?.username ? `@${e.gifter.username}` : (e?.gifter?.name || 'a supporter'));

    const title = titleFor(e);
    let tweetText = e.category === 'sent' 
      ? `I just supported ${cp} with a ${title} on SpennyPiggy! 🎉`
      : `Thank you ${cp} for the ${title} on SpennyPiggy! 🎉`;
    
    if (e.open_link) {
      tweetText += `\nCheck it out here: ${e.open_link}`;
    }

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    setTwitterModal({ show: false, event: null });
  };

  const openSupportModal = (event, type = 'contact') => {
    setSupportModalState({ show: true, event, type });
  };

  const supportAutoOpenedRef = useRef(false);

  useEffect(() => {
    try {
      if (supportAutoOpenedRef.current) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get('support_open') !== '1') return;

      const source = params.get('source');
      const sourceId = params.get('source_id');
      const eventType = params.get('event_type');
      let matched = null;
      if (source && sourceId && Array.isArray(data?.events)) {
        matched = data.events.find((e) => e?.source === source && String(e?.source_id) === String(sourceId)) || null;
      }

      const creatorUsername = params.get('creator_username') || matched?.creator?.username;
      const supportType = params.get('support_type') === 'refund' ? 'refund' : 'contact';
      if (!creatorUsername) return;

      if (!matched && Array.isArray(data?.events)) {
        const candidates = data.events
          .filter((e) => e?.creator?.username === creatorUsername)
          .filter((e) => (eventType ? String(e?.type) === String(eventType) : true));

        if (candidates.length > 0) {
          matched = candidates.sort((a, b) => String(b?.created_at || '').localeCompare(String(a?.created_at || '')))[0] || null;
        }
      }

      const event = matched || {
        creator: { username: creatorUsername },
        type: eventType || null,
        source: source || null,
        source_id: sourceId || null,
      };

      supportAutoOpenedRef.current = true;
      openSupportModal(event, supportType);

      const next = new URL(window.location.href);
      ['support_open', 'support_type', 'creator_username', 'event_type', 'source', 'source_id'].forEach((k) => next.searchParams.delete(k));
      window.history.replaceState({}, '', next.toString());
    } catch {
    }
  }, [data?.events]);

  const submitShopAnswer = async (paymentId) => {
    const answer = shopAnswerDrafts[paymentId];
    if (!answer?.trim()) return;

    setSubmittingShopAnswers(prev => new Set([...prev, paymentId]));
    
    try {
        const res = await axios.post(`/shop/answer-to-payment/${paymentId}`, { answer });
        if (res.data.status) {
            setSubmittedShopAnswers(prev => new Set([...prev, paymentId]));
            setShopAnswerDrafts(prev => {
                const newDrafts = { ...prev };
                delete newDrafts[paymentId];
                return newDrafts;
            });
            // Update local event data
            setData(prev => ({
              ...prev,
              events: prev.events.map(ev => 
                ev.payment_id && ev.payment_id === paymentId ? { ...ev, answer: answer } : ev
              )
            }));
            alert(res.data.msg || res.data.message || 'Answer submitted successfully.');
        } else {
            alert(res.data.msg || res.data.message || 'Failed to submit answer.');
        }
    } catch (err) {
        alert(err.response?.data?.message || 'Something went wrong!');
    } finally {
        setSubmittingShopAnswers(prev => {
            const newSet = new Set(prev);
            newSet.delete(paymentId);
            return newSet;
        });
    }
  };

  const rewardChip = (e) => {
    const r = e.reward || {};
    if (r.access) return r.access.label;
    if (r.media) return 'Content unlocked';
    if (r.file_url) return 'Reward file';
    if (r.perks?.length) return `${r.perks.length} benefit${r.perks.length > 1 ? 's' : ''}`;
    if (r.description) return 'Reward unlocked';
    return null;
  };

  const currencyTotals = useMemo(() => {
    const sums = {};
    filtered.forEach(e => {
      if (e?.status !== 'completed') return;
      const total = Number(e.display_amount ?? 0);
      const cur = displayCurrency.toLowerCase();
      sums[cur] = (sums[cur] || 0) + total;
    });
    return sums;
  }, [filtered]);

  const FadeIn = ({ children }) => {
    const [show, setShow] = useState(false);
    useEffect(() => {
      const t = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(t);
    }, []);
    return (
      <div className={`transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {children}
      </div>
    );
  };

  const linkify = (text) => {
    if (text == null) return null;
    const s = String(text);
    return s.startsWith('http')
      ? <a href={s} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline break-all">{s}</a>
      : s;
  };

  // The visual anchor of every card: a framed window showing exactly what the
  // supporter received (or, for the creator view, what they delivered) — media,
  // membership perks, a downloadable file, a certificate, or a pending stamp.
  const DeliveryPanel = ({ e, icon }) => {
    const r = e.reward || {};
    const hasMedia = !!r.media;
    const hasPerks = !!(r.perks && r.perks.length);
    const hasFile = !!r.file_url;
    const hasCert = !!e.certificate_url;
    const hasDesc = !!r.description;
    const hasAccess = !!r.access;
    const hasPrimary = hasMedia || hasPerks || hasDesc || hasAccess;
    const pending = r.is_instant === false && !hasMedia && !hasFile;
    const mediaType = String(r.media?.type || '');
    const ts = typeStyle(e.type);
    const softBtn = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md';

    return (
      <div className="relative flex flex-col rounded-[20px] border border-black/5 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${pending ? 'text-amber-600' : 'text-emerald-600'}`}>
            <span className={`h-2 w-2 rounded-full ${pending ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
            {pending ? 'Awaiting delivery' : (e.category === 'received' ? 'You delivered' : 'You received')}
          </span>
          <span className={`h-7 w-7 rounded-xl bg-gradient-to-br ${ts.grad} text-white text-sm flex items-center justify-center shadow-sm`}>{icon}</span>
        </div>

        <div className="flex-1 px-4 pb-4 flex flex-col gap-3 min-h-[150px] justify-center">
          {hasMedia ? (
            <div className="group/media">
              {mediaType.includes('video') ? (
                <LazyVideo controls controlsList="nodownload" posterSrc={r.media.url} fallback={e.category === 'sent' ? e?.creator?.avatar : e?.gifter?.avatar} className="w-full max-h-[230px] object-contain rounded-[20px] bg-black shadow-sm">
                  <source src={r.media.url} type={r.media.type} />
                </LazyVideo>
              ) : mediaType.includes('audio') ? (
                <audio controls controlsList="nodownload" className="w-full">
                  <source src={r.media.url} type={r.media.type} />
                </audio>
              ) : (mediaType.includes('pdf') || mediaType.includes('zip')) ? (
                <a href={r.media.url} target="_blank" rel="noopener noreferrer" className={`${softBtn} bg-gray-900 text-white`}><FileText size={14} /> Open content</a>
              ) : (
                <a href={r.media.url} target="_blank" rel="noopener noreferrer" className="block w-full overflow-hidden rounded-[20px] border border-black/5 bg-white shadow-sm">
                  <img src={r.media.url} alt={r.media.name || 'Content'} className="w-full max-h-[230px] object-contain transition-transform duration-500 group-hover/media:scale-[1.04]" onError={(ev) => { ev.target.style.display = 'none'; ev.target.parentElement.innerHTML = '<span class="p-6 block text-center text-sm font-semibold text-gray-400">View content</span>'; }} />
                </a>
              )}
              {r.media.name ? (
                <p className="mt-2 text-center text-[11px] text-gray-400 font-medium truncate px-2">{r.media.name}</p>
              ) : null}
            </div>
          ) : null}

          {hasPerks ? (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {r.perks.map((p, idx) => (
                <span key={`perk-${idx}`} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${ts.soft} text-gray-700 ring-1 ring-black/5`}>{p}</span>
              ))}
            </div>
          ) : null}

          {hasAccess ? (
            <Link href={r.access.url} className={`group/acc flex items-center gap-3 px-3.5 py-3 rounded-[16px] ${ts.soft} ring-1 ring-black/5 hover:ring-black/20 transition-all`}>
              <span className={`h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br ${ts.grad} text-white flex items-center justify-center shadow-sm`}><Unlock size={16} /></span>
              <span className="min-w-0 text-left">
                <span className="block text-sm font-bold text-gray-800 truncate">{r.access.label}</span>
                <span className="block text-[11px] font-medium text-gray-500">{r.access.count > 0 ? `${r.access.count} post${r.access.count > 1 ? 's' : ''} unlocked` : 'Access unlocked'}</span>
              </span>
              <span className="ml-auto text-gray-400 group-hover/acc:text-gray-700 transition-colors"><ExternalLink size={15} /></span>
            </Link>
          ) : null}

          {hasDesc ? (
            <p className="text-sm text-gray-600 leading-relaxed break-words text-center">{linkify(r.description)}</p>
          ) : null}

          {!hasPrimary ? (
            <div className="flex flex-col items-center gap-2.5 text-center py-2">
              <span className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${ts.grad} text-white text-2xl flex items-center justify-center shadow-md`}>{icon}</span>
              <span className="text-xs font-semibold text-gray-400">
                {pending ? 'Delivered after fulfilment' : ((hasFile || hasCert) ? 'Reward ready' : 'Support recorded')}
              </span>
            </div>
          ) : null}

          {(hasFile || hasCert) ? (
            <div className="flex flex-wrap gap-2 justify-center">
              {hasFile ? (
                <a href={r.file_url} target="_blank" rel="noopener noreferrer" className={`${softBtn} bg-gray-900 text-white`}><FileText size={14} /> Download</a>
              ) : null}
              {hasCert ? (
                <a href={e.certificate_url} target="_blank" rel="noopener noreferrer" className={`${softBtn} bg-gradient-to-r from-[#FF2D8B] to-[#FF6FB0] text-white`}>Certificate</a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const toCSV = () => {
    const rows = [
      ['Type', 'Category', 'Title', 'Item', 'Counterparty', 'Reward', 'Amount', 'Currency', 'Status', 'Date']
    ];
    filtered.forEach(e => {
      const title = titleFor(e);
      const cp = e.category === 'sent'
        ? (e?.creator?.username ? '@' + e.creator.username : (e?.creator?.name || ''))
        : (e?.gifter?.username ? '@' + e.gifter.username : (e?.gifter?.name || 'Supporter'));
      const amt = Number(e.display_amount ?? 0);
      rows.push([
        e.type,
        e.category,
        title,
        e.item_title || '',
        cp,
        rewardChip(e) || '',
        amt.toFixed(displayDigits),
        displayCurrency,
        e.status || '',
        e.created_at
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Authenticated auth={auth.user} user={auth.user}>
      <div className="bg-gradient-to-b from-[#E4F8EC] via-[#BCEDCB] to-[#A2E4B8] min-h-dvh py-8 md:py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className=" mb-8 mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="font-black text-3xl md:text-4xl text-gray-900 tracking-tight">Support History</h1>
                <p className="text-gray-700 font-medium mt-2">Every purchase — and exactly what was delivered with it.</p>
              </div>
              <RefreshRecordsButton className="w-full md:w-auto shrink-0 bg-white text-gray-800 border border-gray-200 hover:bg-gray-100 shadow-sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-[30px] p-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_36px_-16px_rgba(0,0,0,0.3)] transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.15em]">Lifetime Received</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.keys(lifetimeStats.received).length > 0 ? (
                    Object.entries(lifetimeStats.received).map(([cur, amt]) => (
                      <span key={cur} className="text-gray-900 font-black text-2xl md:text-3xl tracking-tight">
                        {formatMoney(amt)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-300 font-black text-2xl md:text-3xl">—</span>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-[30px] p-5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_36px_-16px_rgba(0,0,0,0.3)] transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#FF2D8B]" />
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.15em]">Lifetime Sent</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.keys(lifetimeStats.sent).length > 0 ? (
                    Object.entries(lifetimeStats.sent).map(([cur, amt]) => (
                      <span key={cur} className="text-gray-900 font-black text-2xl md:text-3xl tracking-tight">
                        {formatMoney(amt)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-300 font-black text-2xl md:text-3xl">—</span>
                  )}
                </div>
              </div>
            </div>

            {/*
              This is the panel the spend-cap message sends people to, so it
              carries the `limits` anchor and `scroll-mt` — /history is several
              screens tall and the answer sits well down it. Landing at the top
              of the page is the dead end that produces a support ticket.

              ⚠️ It renders for the signed-in owner only. `spend_summary` is
              never built for a guest: guest limits are keyed to card
              fingerprint, device and IP, so a running total on an
              unauthenticated screen would be a live readout of exactly how much
              headroom is left — which is what the guest variant of the message
              exists to avoid.
            */}
            {spend_summary && (
              <div id="limits" className="scroll-mt-24 mt-6 p-6 rounded-box bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.15em] mb-2">Your spend and limits</p>
                <p className="text-gray-600 text-[15px] leading-[1.55] mb-5">
                  There's a cap on how much can be spent in a short window. It's there to protect
                  people whose card details get stolen — and once in a while it catches someone
                  genuinely generous instead. <span className="font-semibold text-gray-900">Each one lifts on its own, so there's nothing to do.</span>
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Last hour', spend: spend_summary.spend_1h, limit: spend_summary.limit_1h },
                    { label: 'Last 24 hours', spend: spend_summary.spend_24h, limit: spend_summary.limit_24h },
                    { label: 'Last 7 days', spend: spend_summary.spend_7d, limit: spend_summary.limit_7d },
                  ].map((s) => {
                    // A bare pair of figures makes the reader do the division.
                    // Guarded against a zero/absent limit so a misconfigured
                    // window renders as "no data" rather than a full red bar.
                    const limit = Number(s.limit) || 0;
                    const spent = Number(s.spend) || 0;
                    const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : null;
                    return (
                      <div key={s.label} className="p-4 rounded-box-sm bg-gray-50 ring-1 ring-black/5">
                        <p className="text-gray-500 font-semibold text-xs mb-1">{s.label}</p>
                        <p className="text-gray-900 font-black text-xl tracking-tight">{formatMoney(s.spend)}</p>
                        <p className="text-gray-400 font-medium text-xs mt-1">of {formatMoney(s.limit)}</p>
                        {pct !== null && (
                          <div className="mt-3 h-2 w-full rounded-full bg-black/10" aria-hidden="true">
                            <div
                              className={`h-2 rounded-full ${pct >= 100 ? 'bg-[#FF007F]' : 'bg-gray-900'}`}
                              style={{ width: `${Math.max(pct, 2)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {auth?.user?.role === 1 && (
              <div className="mt-6 p-5 rounded-[30px] bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] ring-1 ring-[#1DA1F2]/10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="h-7 w-7 rounded-lg bg-[#1DA1F2] text-white flex items-center justify-center"><FaTwitter size={15} /></span>
                  <span className="font-bold text-gray-900 text-sm">Announce on X</span>
                </div>
                <p className="text-gray-600 font-medium text-sm leading-relaxed">
                  Share received support on your X profile — tap the bird icon on any card for a pre-written post.
                  <span className="block mt-1 text-gray-400">Requires <Link href="/account" className="text-[#FF2D8B] hover:underline font-semibold">Auto Tweet</Link> enabled in settings.</span>
                </p>
              </div>
            )}

            <Modal show={twitterModal.show} onClose={() => setTwitterModal({ show: false, event: null })} maxWidth="md">
              <div className="p-6 md:p-8 bg-[#1A1B23] text-white">
                {auth?.user?.auto_tweet === 1 ? (
                  <>
                    <h2 className="text-xl font-black mb-4">Announce on Twitter</h2>
                    <p className="text-white/60 mb-6 leading-relaxed">
                      You are about to share this transaction on X (Twitter). We've prepared a beautiful announcement for your followers to see your support!
                    </p>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => shareOnTwitter(twitterModal.event)}
                        className="w-full py-3 rounded-full bg-[#1DA1F2] hover:bg-[#1a91da] text-white font-bold transition-colors uppercase tracking-widest text-xs"
                      >
                        Announce Now
                      </button>
                      <button 
                        onClick={() => setTwitterModal({ show: false, event: null })}
                        className="w-full py-3 rounded-full bg-white/5 hover:bg-white/10 text-white/60 font-bold transition-colors uppercase tracking-widest text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-black mb-4 text-red-500">Twitter Not Enabled</h2>
                    <p className="text-white/60 mb-6 leading-relaxed">
                      To announce your gifts on X, you must first enable "Auto Tweet" in your account settings. This allows us to safely post on your behalf.
                    </p>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => router.visit('/account')}
                        className="w-full py-3 rounded-full bg-pink-600 hover:bg-pink-700 text-white font-bold transition-colors uppercase tracking-widest text-xs"
                      >
                        Go to Settings
                      </button>
                      <button 
                        onClick={() => setTwitterModal({ show: false, event: null })}
                        className="w-full py-3 rounded-full bg-white/5 hover:bg-white/10 text-white/60 font-bold transition-colors uppercase tracking-widest text-xs"
                      >
                        Maybe Later
                      </button>
                    </div>
                  </>
                )}
              </div>
            </Modal>

            <SupportModal 
              show={supportModalState.show}
              event={supportModalState.event}
              initialType={supportModalState.type}
              onClose={() => setSupportModalState({ show: false, event: null, type: 'contact' })}
            />

            <div className="mt-6 p-6 rounded-[30px] bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)]">
              <div className="flex flex-col sm:flex-row items-center gap-3 mb-5">
                <div className="relative flex-1 w-full">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><Filter size={16} /></span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by user, wish, shop, membership, task…"
                    className="w-full bg-gray-50 ring-1 ring-black/5 rounded-[20px] pl-11 pr-4 py-3 text-gray-900 font-medium placeholder-gray-400 focus:ring-2 focus:ring-[#FF2D8B]/40 focus:bg-white outline-none transition-all"
                  />
                </div>
                <button onClick={toCSV} className="w-full sm:w-auto px-6 py-3 rounded-[20px] text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">Export CSV</button>
              </div>

              <div className="inline-flex p-1 mb-4 rounded-[20px] bg-gray-100">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'received', label: 'Received' },
                  { key: 'sent', label: 'Sent' },
                ].map(d => (
                  <button key={d.key} onClick={() => setDirection(d.key)} className={`px-5 py-2 rounded-[16px] text-xs font-bold transition-all ${direction === d.key ? 'bg-white text-[#FF2D8B] shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>{d.label}</button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'gift_wish', label: 'Wishes' },
                  { key: 'gift_membership', label: 'Memberships' },
                  { key: 'gift_bill', label: 'Bills' },
                  { key: 'gift_tip', label: 'Support' },
                  { key: 'piggy_pot', label: 'Piggy Pots' },
                  { key: 'gift_shop', label: 'Shop' },
                  { key: 'gift_task', label: 'Tasks' },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-[20px] text-sm font-semibold transition-all
                    ${filter === f.key ? 'bg-gradient-to-r from-[#FF2D8B] to-[#FF6FB0] text-white shadow-md' : 'bg-gray-50 text-gray-600 ring-1 ring-black/5 hover:bg-gray-100'}`}>{f.label}</button>
                ))}
              </div>
              {Object.keys(currencyTotals).length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(currencyTotals).map(([cur, amt]) => (
                    <span key={cur} className="px-4 py-2 rounded-[20px] bg-gray-50 ring-1 ring-black/5 text-gray-700 font-bold text-xs">
                      {cur.toUpperCase()} · {formatMoney(amt)}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {loading && !data.events?.length ? (
          <LoadingScreen />
        ) : filtered.length ? (
          <div className="space-y-5 max-w-5xl mx-auto px-4 sm:px-6">
            {filtered.map((e, i) => {
              const icon = iconFor(e.type);
              const ts = typeStyle(e.type);
              const cp = e.category === 'sent'
                ? (e?.creator?.username ? `To @${e.creator.username}` : (e?.creator?.name ? `To ${e.creator.name}` : 'To creator'))
                : (e?.gifter?.username ? `From @${e.gifter.username}` : (e?.gifter?.name ? `From ${e.gifter.name}` : 'From supporter'));
              const avatar = e.category === 'sent' ? (e?.creator?.avatar || '') : (e?.gifter?.avatar || '');
              return (
                <FadeIn key={e.uuid || `tx-${i}`}>
                  <div className="group relative bg-white rounded-[30px] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.25)] hover:shadow-[0_24px_48px_-18px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    <div className={`h-1.5 w-full bg-gradient-to-r ${ts.grad}`} />
                    <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] gap-4 md:gap-5">

                      {/* The hero: what was delivered */}
                      <DeliveryPanel e={e} icon={icon} />

                      <div className="flex flex-col gap-3 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${ts.soft} text-gray-700 ring-1 ring-black/5`}>
                              {titleFor(e)}
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ring-1 ring-black/5 ${e.category === 'sent' ? 'bg-pink-50 text-[#FF2D8B]' : 'bg-emerald-50 text-emerald-600'}`}>
                              {e.category === 'sent' ? 'Sent' : 'Received'}
                            </span>
                            {/* One state, named the same way on every surface. The raw DB
                                status used to be printed here, so "review_hold" and
                                "awaiting delivery" both reached the reader as jargon. */}
                            {e?.state ? (
                              <StateChip state={e.state} label={e.state_label} />
                            ) : e?.status ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                                {String(e.status).replaceAll('_', ' ')}
                              </span>
                            ) : null}
                            {isNew(e.created_at) ? (
                              <span className="px-2.5 py-1 rounded-full bg-yellow-300 text-gray-900 text-[10px] font-bold animate-pulse">New</span>
                            ) : null}
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`${e?.status === 'completed' ? 'text-gray-900' : 'text-gray-400'} font-black text-xl md:text-2xl leading-none tracking-tight`}>
                              {amountFor(e)}
                            </div>
                            {Number(e?.vat_amount || 0) > 0 ? (
                              <div className="text-[10px] text-gray-400 font-semibold mt-1">VAT {formatMoney(Number(e.vat_amount || 0))}</div>
                            ) : null}
                            {e?.payment_method ? (
                              <div className="inline-flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-wide text-gray-500">
                                {e.payment_method === 'bank' ? '🏦 Bank' : '💳 Card'}
                              </div>
                            ) : null}
                            {e?.is_included_in_totals === false ? (
                              <div className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide mt-1">Not in totals</div>
                            ) : null}
                          </div>
                        </div>

                        {e.item_title ? (
                          <div className="min-w-0">
                            {e.open_link ? (
                              e.open_link.startsWith('http') ? (
                                <a href={e.open_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-gray-900 hover:text-[#FF2D8B] font-bold text-lg truncate max-w-full transition-colors">“{e.item_title}” <ExternalLink size={14} className="shrink-0 opacity-50" /></a>
                              ) : (
                                <Link href={e.open_link} className="inline-flex items-center gap-1 text-gray-900 hover:text-[#FF2D8B] font-bold text-lg truncate max-w-full transition-colors">“{e.item_title}” <ExternalLink size={14} className="shrink-0 opacity-50" /></Link>
                              )
                            ) : (
                              <span className="text-gray-900 font-bold text-lg truncate block">“{e.item_title}”</span>
                            )}
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img src={avatar || defaultAvatar} alt="" className="h-8 w-8 rounded-full ring-2 ring-white object-cover shadow-sm shrink-0" />
                            <p className="text-gray-700 font-semibold text-sm truncate">
                              {e.category === 'sent'
                                ? (e?.creator?.username ? <Link href={`/${e.creator.username}`} className="hover:text-[#FF2D8B] transition-colors">To @{e.creator.username}</Link> : cp)
                                : (e?.gifter?.username ? <Link href={`/${e.gifter.username}`} className="hover:text-[#FF2D8B] transition-colors">From @{e.gifter.username}</Link> : cp)}
                            </p>
                          </div>
                          <span className="text-gray-300">·</span>
                          <p className="text-gray-400 font-medium text-xs">{e.created_at}</p>
                        </div>

                        {/* What WE sent YOU about this purchase. Your own messages
                            only — the server never returns the other party's. */}
                        <DeliveryStatus notifications={e.notifications} />

                        {/* The full arithmetic behind the figure above, from the same
                            server payload the creator's ledger and the Purchase Hub read. */}
                        <LedgerBreakdown
                          breakdown={e.breakdown}
                          variant={e.category === 'sent' ? 'supporter' : 'creator'}
                          money={(v) => formatInCurrency(v, e?.breakdown?.currency)}
                        />

                        {e.ask_question && e.payment_id ? (
                          <div className="p-4 bg-pink-50/60 ring-1 ring-[#FF2D8B]/10 rounded-[20px]">
                            <p className="text-[#FF2D8B] font-bold text-[11px] uppercase tracking-wide mb-2">Question from creator</p>
                            <p className="text-sm font-medium mb-3 text-gray-800">{e.ask_question}</p>
                            {e.answer || submittedShopAnswers.has(e.payment_id) ? (
                              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-2 rounded-[16px] text-sm font-semibold"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Answer submitted.</div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <textarea
                                  value={shopAnswerDrafts[e.payment_id] || ''}
                                  onChange={(ev) => setShopAnswerDrafts(prev => ({ ...prev, [e.payment_id]: ev.target.value }))}
                                  placeholder="Type your answer here..."
                                  className="w-full bg-white ring-1 ring-black/10 rounded-[16px] p-3 text-sm focus:ring-2 focus:ring-[#FF2D8B]/40 outline-none font-medium transition-all"
                                  rows="3"
                                ></textarea>
                                <button
                                  onClick={() => submitShopAnswer(e.payment_id)}
                                  disabled={submittingShopAnswers.has(e.payment_id) || !(shopAnswerDrafts[e.payment_id]?.trim())}
                                  className="bg-gradient-to-r from-[#FF2D8B] to-[#FF6FB0] text-white font-bold py-2 px-4 rounded-[16px] hover:-translate-y-0.5 shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:translate-y-0 text-xs w-fit transition-all"
                                >
                                  {submittingShopAnswers.has(e.payment_id) ? 'Submitting...' : 'Submit answer'}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}

                        <ReactionsAndReply
                          ev={e}
                          viewer={auth?.user}
                          creator={e.category === 'sent' ? e.creator?.username : auth?.user?.username}
                          gifter={e.category === 'received' ? e.gifter?.username : auth?.user?.username}
                          canAct={!!(auth?.user && (e.category === 'sent' ? e.creator?.username : e.gifter?.username))}
                        />

                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/5 mt-auto">
                          {auth?.user?.role === 1 && (
                            <button onClick={() => handleTwitterClick(e)} className="p-2 rounded-full bg-[#1DA1F2] text-white hover:bg-[#1a91da] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group" title="Share on X">
                              <FaTwitter size={15} className="group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                          {storyUrlFor(e) ? (
                            <Link href={storyUrlFor(e)} className="px-4 py-2 rounded-[16px] text-xs font-semibold bg-gradient-to-r from-[#FF2D8B] to-[#FF6FB0] text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">View Story</Link>
                          ) : null}
                          {e.category === 'received' && e.uuid && !String(e.uuid).startsWith('exp-') && (
                            <a href={route('financial.evidence-pack', { uuid: e.uuid })} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-[16px] text-xs font-semibold bg-pink-50 text-[#FF2D8B] hover:bg-pink-100 hover:-translate-y-0.5 transition-all inline-flex items-center gap-1.5">
                              <FileText size={13} /> Evidence Pack
                            </a>
                          )}
                          {e.category === 'sent' && e?.creator?.username ? (
                            <>
                              <button type="button" onClick={() => openSupportModal(e, 'contact')} className="px-4 py-2 rounded-[16px] text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 hover:-translate-y-0.5 transition-all">Contact Creator</button>
                              <button type="button" onClick={() => openSupportModal(e, 'refund')} className="px-4 py-2 rounded-[16px] text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 hover:-translate-y-0.5 transition-all">Request Refund</button>
                            </>
                          ) : null}
                        </div>

                        {e.category === 'sent' && e.support_tickets && e.support_tickets.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            {e.support_tickets.map(ticket => (
                              <Link key={ticket.uuid} href={route('support.tickets.show', ticket.uuid)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[16px] text-xs font-semibold bg-gray-50 text-gray-700 ring-1 ring-black/5 hover:bg-gray-100 hover:-translate-y-0.5 transition-all w-max">
                                <span>View {ticket.type} ticket</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${ticket.status === 'resolved' || ticket.status === 'refunded' ? 'bg-emerald-50 text-emerald-600' : ticket.status === 'rejected' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-600'}`}>
                                  {ticket.status.replaceAll('_', ' ')}
                                </span>
                              </Link>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              );
            })}
            {data?.has_more ? (
              <div className="text-center mt-8">
                <button onClick={() => fetchFeed(data?.next_before || null, true)} className="px-7 py-3 rounded-[20px] text-sm font-bold bg-white text-gray-800 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)] hover:shadow-[0_16px_36px_-16px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all">Load more</button>
              </div>
            ) : null}


          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <Nocontent text="No transactions found" />
          </div>
        )}
      </div>
    </Authenticated>
  );
}
