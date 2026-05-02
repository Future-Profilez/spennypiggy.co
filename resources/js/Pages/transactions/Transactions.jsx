import { useEffect, useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import LoadingScreen from '@/includes/LoadingScreen';
import Nocontent from '@/includes/Nocontent';
import axios from 'axios';
import Authenticated from '../../Layouts/AuthenticatedLayout';
import ReactionsAndReply from '@/Components/ReactionsAndReply';
import { FaTwitter } from 'react-icons/fa';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';
import { ChevronLeft, Calendar, FileText, ExternalLink, Filter } from 'lucide-react';

export default function Transactions(props) {
  const { auth, initial, display_currency, spend_summary } = props || {};
  const { currencies } = usePage().props;
  const [data, setData] = useState(() => initial || { events: [], has_more: false, next_before: null, stats: { received: {}, sent: {} } });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [direction, setDirection] = useState('all'); // all | received | sent
  const [query, setQuery] = useState('');
  const [twitterModal, setTwitterModal] = useState({ show: false, event: null });

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
        const all = [...(a.events || []), ...(b.events || [])].sort((x, y) => {
          const dateX = new Date(x.created_at);
          const dateY = new Date(y.created_at);
          if (dateY - dateX !== 0) return dateY - dateX;
          return (y.id || 0) - (x.id || 0);
        });
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
      case 'gift_shop': return '🛍️';
      case 'gift_task': return '🧩';
      default: return '✨';
    }
  };

  const titleFor = (e) => {
    switch (e.type) {
      case 'gift_wish': return e.category === 'received' ? 'Wish funded' : 'You funded a wish';
      case 'gift_membership': return e.category === 'received' ? 'Membership payment' : 'You supported a membership';
      case 'gift_bill': return e.category === 'received' ? 'Bill payment' : 'You supported a bill';
      case 'gift_tip': return e.category === 'received' ? 'Support payment' : 'You sent support';
      case 'gift_shop': return e.category === 'received' ? 'Shop order' : 'You purchased from the shop';
      case 'gift_task': return e.category === 'received' ? 'Task purchase' : 'You funded a task';
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
      e?.wish?.name || '',
      e?.shop?.name || '',
      e?.task?.title || '',
      e?.bill?.name || '',
      e?.membership?.level || ''
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
      ? (e?.creator?.username || e?.creator?.name) 
      : (e?.gifter?.username || e?.gifter?.name);
    const handle = cp ? (cp.startsWith('@') ? cp : `@${cp}`) : 'someone';
    
    let text = '';
    const origin = window.location.origin;
    let url = origin;

    if (e.category === 'received') {
      url = `${origin}/${auth?.user?.username || ''}`;
      switch (e.type) {
        case 'gift_wish': text = `Just received a gift for my "${e.wish?.name || 'wish'}"! Thank you ${handle}! 🎁`; break;
        case 'gift_tip': text = `Thank you ${handle} for the support! 💖`; break;
        case 'gift_membership': text = `New member alert! Welcome ${handle} to the family! 🎟️`; break;
        case 'gift_bill': text = `Bill renewed! Thanks for staying with me ${handle}! 🧾`; break;
        case 'gift_shop': text = `New shop order from ${handle}! 🛍️`; break;
        case 'gift_task': text = `Task funded! Getting to work on "${e.task?.title || 'task'}" for ${handle}! 🧩`; break;
        default: text = `Just received support from ${handle}! ✨`;
      }
    } else {
      const creatorHandle = e?.creator?.username ? `@${e.creator.username}` : (e?.creator?.name || 'a creator');
      url = e?.creator?.username ? `${origin}/${e.creator.username}` : origin;
      switch (e.type) {
        case 'gift_wish': text = `Just funded ${creatorHandle}'s wish: "${e.wish?.name || 'wish'}"! 🎁`; break;
        case 'gift_tip': text = `Just sent some support to ${creatorHandle}! 💖`; break;
        case 'gift_membership': text = `Just joined ${creatorHandle}'s membership! 🎟️`; break;
        case 'gift_bill': text = `Just renewed a bill for ${creatorHandle}! 🧾`; break;
        case 'gift_shop': text = `Just bought something from ${creatorHandle}'s shop! 🛍️`; break;
        case 'gift_task': text = `Just funded a task for ${creatorHandle}: "${e.task?.title || 'task'}"! 🧩`; break;
        default: text = `Just supported ${creatorHandle}! ✨`;
      }
    }

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
    setTwitterModal({ show: false, event: null });
  };

  const rewardChip = (e) => {
    if (e.access) return e.access;
    if (e?.wish?.reward_file) return 'Reward file';
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

  const toCSV = () => {
    const rows = [
      ['Type', 'Category', 'Title', 'Counterparty', 'Access', 'Amount', 'Currency', 'Status', 'Date']
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
      <div className="bg-[#A2E4B8] min-h-screen py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className=" mb-8 mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="font-bold text-2xl md:text-3xl font-black text-black uppercase">Support History</h1>
                <p className="text-gray-700 font-bold mt-2">Your complete history — received and sent — with rewards and access.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-100 rounded-[25px] md:rounded-[30px] p-5 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-black text-xs font-black uppercase tracking-[0.2em] mb-2">Lifetime Received</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.keys(lifetimeStats.received).length > 0 ? (
                    Object.entries(lifetimeStats.received).map(([cur, amt]) => (
                      <span key={cur} className="text-black font-black text-2xl md:text-3xl">
                        {formatMoney(amt)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 font-black text-2xl md:text-3xl">—</span>
                  )}
                </div>
              </div>
              <div className="bg-blue-100 rounded-[25px] md:rounded-[30px] p-5 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-black text-xs font-black uppercase tracking-[0.2em] mb-2">Lifetime Sent</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {Object.keys(lifetimeStats.sent).length > 0 ? (
                    Object.entries(lifetimeStats.sent).map(([cur, amt]) => (
                      <span key={cur} className="text-black font-black text-2xl md:text-3xl">
                        {formatMoney(amt)}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 font-black text-2xl md:text-3xl">—</span>
                  )}
                </div>
              </div>
            </div>

            {spend_summary && (
              <div className="mt-6 p-6 rounded-[25px] md:rounded-[30px] bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="text-black text-sm font-black uppercase tracking-widest mb-4">Your Spend (Security Limits)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-[20px] md:!rounded-[30px] bg-gray-50 border-2 border-black">
                    <p className="text-gray-600 font-bold text-xs mb-1 uppercase">Last 1 hour</p>
                    <p className="text-black font-black text-xl">{formatMoney(spend_summary.spend_1h)}</p>
                    <p className="text-gray-500 font-bold text-xs mt-1">Limit: {formatMoney(spend_summary.limit_1h)}</p>
                  </div>
                  <div className="p-4 rounded-[20px] md:!rounded-[30px] bg-gray-50 border-2 border-black">
                    <p className="text-gray-600 font-bold text-xs mb-1 uppercase">Last 24 hours</p>
                    <p className="text-black font-black text-xl">{formatMoney(spend_summary.spend_24h)}</p>
                    <p className="text-gray-500 font-bold text-xs mt-1">Limit: {formatMoney(spend_summary.limit_24h)}</p>
                  </div>
                  <div className="p-4 rounded-[20px] md:!rounded-[30px] bg-gray-50 border-2 border-black">
                    <p className="text-gray-600 font-bold text-xs mb-1 uppercase">Last 7 days</p>
                    <p className="text-black font-black text-xl">{formatMoney(spend_summary.spend_7d)}</p>
                    <p className="text-gray-500 font-bold text-xs mt-1">Limit: {formatMoney(spend_summary.limit_7d)}</p>
                  </div>
                </div>
              </div>
            )}
            
            {auth?.user?.role === 1 && (
              <div className="mt-6 p-5 rounded-[25px] md:rounded-[30px] bg-[#E1F5FE] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-2 text-[#1DA1F2] mb-2">
                  <FaTwitter size={20} className="text-black" />
                  <span className="font-black text-black text-sm uppercase tracking-widest">Creator Feature: Announce on X</span>
                </div>
                <p className="text-gray-800 font-bold text-sm leading-relaxed">
                  Easily share your received gifts and support on your X (Twitter) profile! Use the bird icon on any transaction to post a pre-formatted announcement. 
                  <span className="block mt-2 text-gray-600">Note: Requires <Link href="/account" className="text-pink-600 hover:text-pink-800 underline transition-colors">Auto Tweet</Link> to be enabled in your settings.</span>
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

            <div className="mt-6 p-6 rounded-[25px] md:rounded-[30px] bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by user, wish, shop, membership level, task…"
                  className="flex-1 w-full bg-white border-[3px] border-black rounded-full px-4 py-3 text-black font-bold placeholder-gray-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:ring-0 focus:outline-none"
                />
                <button onClick={toCSV} className="w-full sm:w-auto px-6 py-3 rounded-full text-sm font-black uppercase tracking-widest bg-white border-[3px] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">Export CSV</button>
              </div>

              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'gift_wish', label: 'Wishes' },
                  { key: 'gift_membership', label: 'Memberships' },
                  { key: 'gift_bill', label: 'Bills' },
                  { key: 'gift_tip', label: 'Support' },
                  { key: 'gift_shop', label: 'Shop' },
                  { key: 'gift_task', label: 'Tasks' },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)} className={`px-5 py-2 rounded-[15px] md:rounded-[20px] 
                    text-sm font-black uppercase tracking-widest border-[3px] border-black transition-all
                    ${filter === f.key ? 'bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]' 
                    : 'bg-white text-black shadow-none hover:bg-yellow-100 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]'}`}>{f.label}</button>
                ))}
              </div>
              {Object.keys(currencyTotals).length ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {Object.entries(currencyTotals).map(([cur, amt]) => (
                    <span key={cur} className="px-4 py-2 rounded-lg bg-gray-100 border-2 border-black text-black font-black text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      {cur.toUpperCase()}: {formatMoney(amt)}
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
          <div className="space-y-4 max-w-4xl mx-auto px-4 sm:px-6">
            {filtered.map((e, i) => {
              const icon = iconFor(e.type);
              const cp = e.category === 'sent'
                ? (e?.creator?.username ? `To @${e.creator.username}` : (e?.creator?.name ? `To ${e.creator.name}` : 'To creator'))
                : (e?.gifter?.username ? `From @${e.gifter.username}` : (e?.gifter?.name ? `From ${e.gifter.name}` : 'From supporter'));
              const avatar = e.category === 'sent' ? (e?.creator?.avatar || '') : (e?.gifter?.avatar || '');
              return (
                <FadeIn key={`tx-${i}`}>
                  <div className="rounded-[25px] md:rounded-[30px] bg-[#fdfbf7] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 md:px-6 md:py-4 hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full border-2 border-black text-[9px] font-black uppercase tracking-widest shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${e.category === 'sent' ? 'bg-pink-400 text-black' : 'bg-white text-black'}`}>
                              {e.category === 'sent' ? 'Support Payment' : 'Support Received'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full border-2 border-black text-[9px] font-black uppercase tracking-widest shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] bg-gray-200 text-black">
                                {e.category === 'sent' ? 'SENT' : 'RECEIVED'}
                            </span>
                            {e?.status ? (
                              <span className={`px-2 py-0.5 rounded-full border-2 border-black text-[9px] font-black uppercase tracking-widest shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                                e.status === 'completed'
                                  ? 'bg-green-300 text-black'
                                  : (e.status === 'initiated' || e.status === 'pending')
                                    ? 'bg-yellow-300 text-black'
                                    : 'bg-red-300 text-black'
                              }`}>
                                {String(e.status).replaceAll('_', ' ')}
                              </span>
                            ) : null}
                            {isNew(e.created_at) ? (
                              <span className="px-2 py-0.5 rounded-md bg-yellow-300 border-2 border-black text-[9px] font-black text-black uppercase tracking-widest animate-pulse shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">New</span>
                            ) : null}
                          </div>
                          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                            <div className="flex items-center gap-2">
                              <img src={avatar || defaultAvatar} alt="" className="h-8 w-8 rounded-full border-2 border-black object-cover shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" />
                              <p className="text-black font-black text-xs uppercase tracking-widest truncate max-w-[150px] sm:max-w-none">
                                {e.category === 'sent'
                                  ? (e?.creator?.username ? <Link href={`/${e.creator.username}`} className="text-pink-600 hover:text-pink-800 underline transition-colors">@{e.creator.username}</Link> : cp)
                                  : (e?.gifter?.username ? <Link href={`/${e.gifter.username}`} className="text-pink-600 hover:text-pink-800 underline transition-colors">@{e.gifter.username}</Link> : cp)
                                }
                              </p>
                            </div>
                            <span className="hidden sm:inline text-black font-black">•</span>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">
                              {e.created_at}
                            </p>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            {rewardChip(e) ? (
                              <span className="px-3 py-1.5 rounded-full bg-white border-2 border-black text-[10px] text-black uppercase tracking-widest font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {rewardChip(e)}
                              </span>
                            ) : null}
                            {e?.wish?.name && e.open_link ? (
                              <Link href={e.open_link} className="text-pink-600 hover:text-pink-800 font-bold underline text-sm truncate block max-w-full italic">“{e.wish.name}”</Link>
                            ) : null}
                            {e?.membership?.level && e.open_link ? (
                              <Link href={e.open_link} className="text-pink-600 hover:text-pink-800 font-bold underline text-sm truncate block max-w-full italic">Level “{e.membership.level}”</Link>
                            ) : null}
                            {e?.bill?.name && e.open_link ? (
                              <Link href={e.open_link} className="text-pink-600 hover:text-pink-800 font-bold underline text-sm truncate block max-w-full italic">“{e.bill.name}”</Link>
                            ) : null}
                            {e?.shop?.name && e.open_link ? (
                              <div className="text-sm truncate block max-w-full italic">
                                {e.open_link.startsWith('http') ? (
                                  <a href={e.open_link} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-800 font-bold underline">“{e.shop.name}”</a>
                                ) : (
                                  <Link href={e.open_link} className="text-pink-600 hover:text-pink-800 font-bold underline">“{e.shop.name}”</Link>
                                )}
                              </div>
                            ) : null}
                            {e?.task?.title && e.open_link ? (
                              <Link href={e.open_link} className="text-pink-600 hover:text-pink-800 font-bold underline text-sm truncate block max-w-full italic">“{e.task.title}”</Link>
                            ) : null}
                          </div>

                          {(e?.task?.reward_file || e?.wish?.reward_file || e.certificate_url || e?.task?.reward_note) && (
                            <div className="mt-4 flex flex-col gap-3">
                              <div className="flex flex-wrap gap-2">
                                {e?.task?.reward_file ? (
                                  <a href={e.task.reward_file} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">Download Reward</a>
                                ) : null}
                                {e?.wish?.reward_file ? (
                                  <a href={e.wish.reward_file} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">Download Reward</a>
                                ) : null}
                                {e.certificate_url ? (
                                  <a href={e.certificate_url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-300 border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">Certificate</a>
                                ) : null}
                              </div>
                              {e?.task?.reward_note ? (
                                <p className="text-black font-bold text-xs italic leading-relaxed bg-yellow-100 p-3 rounded-[25px] md:rounded-[30px] border-2 border-black">Note: {e.task.reward_note}</p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center md:justify-end gap-4   ">
                      
                        <div className="text-right">
                          <div className={`${e?.status === 'completed' ? 'text-green-600' : 'text-gray-500'} font-black text-xl md:text-2xl`}>
                            {amountFor(e)}
                          </div>
                          {e?.status && e.status !== 'completed' ? (
                            <div className="text-[10px] text-gray-600 font-black uppercase tracking-widest mt-1">
                              Not included in totals
                            </div>
                          ) : null}
                          {Number(e?.vat_amount || 0) > 0 ? (
                            <div className="text-xs text-gray-600 font-black uppercase mt-1">
                              VAT: {formatMoney(Number(e.vat_amount || 0))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="pt-0">
                      <ReactionsAndReply 
                        ev={e} 
                        viewer={auth?.user} 
                        creator={e.category === 'sent' ? e.creator?.username : auth?.user?.username}
                        gifter={e.category === 'received' ? e.gifter?.username : auth?.user?.username}
                        canAct={!!(auth?.user && (e.category === 'sent' ? e.creator?.username : e.gifter?.username))}
                      />
                    </div>
                      <div className="pt-4 flex items-center gap-3">
                          {auth?.user?.role === 1 && (
                            <button
                              onClick={() => handleTwitterClick(e)}
                              className="p-2 rounded-full bg-[#1DA1F2] text-white border-2 border-black hover:bg-[#1a91da] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all group"
                              title="Share on X" >
                              <FaTwitter size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                          {e.category === 'received' && e.uuid && !String(e.uuid).startsWith('exp-') && (
                            <a 
                                href={route('financial.evidence-pack', { uuid: e.uuid })} 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-pink-100 border-2 border-black text-pink-600 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-1"
                            >
                                <FileText size={12} />
                                Evidence Pack
                            </a>
                          )}
                          {e.open_link ? (
                            e.open_link.startsWith('http') ? (
                              <a href={e.open_link} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">Open</a>
                            ) : (
                              <Link href={e.open_link} className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">Open</Link>
                            )
                          ) : null}
                          {storyUrlFor(e) ? (
                            <Link href={storyUrlFor(e)} className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-pink-400 border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">View Story</Link>
                          ) : null}
                        </div>
                  </div>
                </FadeIn>
              );
            })}
            {data?.has_more ? (
              <div className="text-center mt-8">
                <button onClick={() => fetchFeed(data?.next_before || null, true)} className="px-6 py-3 rounded-full text-sm font-black uppercase tracking-widest bg-yellow-300 border-[3px] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all">Load More</button>
              </div>
            ) : null}


          </div>
        ) : (
          <Nocontent text="No transactions found" />
        )}
      </div>
    </Authenticated>
  );
}
