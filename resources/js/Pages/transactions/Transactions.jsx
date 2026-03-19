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

export default function Transactions(props) {
  const { auth, initial, display_currency } = props || {};
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
        const all = [...(a.events || []), ...(b.events || [])].sort((x, y) => new Date(y.created_at) - new Date(x.created_at));
        const mergedResp = { events: all, has_more: (a.has_more || b.has_more), next_before: a.next_before || b.next_before };
        if (!append) setData(mergedResp); else setData({ ...(mergedResp || {}), events: [...(data.events || []), ...all] });
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
      ['Type', 'Category', 'Title', 'Counterparty', 'Access', 'Amount', 'Currency', 'Date']
    ];
    filtered.forEach(e => {
      const title = titleFor(e);
      const cp = e.category === 'sent'
        ? (e?.creator?.username ? '@' + e.creator.username : (e?.creator?.name || ''))
        : (e?.gifter?.username ? '@' + e.gifter.username : (e?.gifter?.name || 'Supporter'));
      const amt = Number(e.display_amount ?? 0);
      rows.push([
        e.type, e.category, title, cp, rewardChip(e) || '', amt.toFixed(displayDigits), displayCurrency, e.created_at
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
    <Authenticated>
      <div className="max-w-[980px] mx-auto px-4 md:px-8 py-8">
        <div className="relative mb-6">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8C52FF]/40 to-[#05EFB8]/40 rounded-[30px] md:rounded-[40px] blur opacity-10"></div>
          <div className="relative rounded-[30px] md:rounded-[40px] bg-[#000]/40 backdrop-blur-3xl border border-white/10 p-6 md:p-8">
            <h2 className="text-white font-black text-2xl">Support History</h2>
            <p className="text-white/60">Your complete history — received and sent — with rewards and access.</p>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-[20px] md:rounded-[30px] bg-gradient-to-br from-[#05EFB8]/10 to-transparent border border-[#05EFB8]/20">
                <p className="text-[#05EFB8] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Lifetime Received</p>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  {Object.keys(lifetimeStats.received).length > 0 ? (
                    Object.entries(lifetimeStats.received).map(([cur, amt]) => (
                      <span key={cur} className="text-white font-black text-2xl">
                        {formatMoney(amt)}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/20 font-black text-2xl">—</span>
                  )}
                </div>
              </div>
              <div className="p-5 rounded-[20px] md:rounded-[30px] bg-gradient-to-br from-[#8C52FF]/10 to-transparent border border-[#8C52FF]/20">
                <p className="text-[#8C52FF] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">Lifetime Sent</p>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  {Object.keys(lifetimeStats.sent).length > 0 ? (
                    Object.entries(lifetimeStats.sent).map(([cur, amt]) => (
                      <span key={cur} className="text-white font-black text-2xl">
                        {formatMoney(amt)}
                      </span>
                    ))
                  ) : (
                    <span className="text-white/20 font-black text-2xl">—</span>
                  )}
                </div>
              </div>
            </div>
            
            {auth?.user?.role === 1 && (
              <div className="mt-4 p-4 rounded-[20px] md:rounded-[30px] bg-[#1DA1F2]/5 border border-[#1DA1F2]/20">
                <div className="flex items-center gap-2 text-[#1DA1F2] mb-1">
                  <FaTwitter size={16} />
                  <span className="font-bold text-xs uppercase tracking-widest">Creator Feature: Announce on X</span>
                </div>
                <p className="text-white/60 text-[13px] leading-relaxed">
                  Easily share your received gifts and support on your X (Twitter) profile! Use the bird icon on any transaction to post a pre-formatted announcement. 
                  <span className="block mt-1 text-white/40">Note: Requires <Link href="/account" className="text-[#1DA1F2]/80 hover:text-[#1DA1F2] underline transition-colors">Auto Tweet</Link> to be enabled in your settings.</span>
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

            <div className="mt-6 flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by user, wish, shop, membership level, task…"
                className="flex-1 bg-white/5 border border-white/10 rounded-[20px] px-3 py-2 text-white/80 placeholder-white/30"
              />
              <button onClick={toCSV} className="px-4 py-2 rounded-[20px] text-[11px] uppercase tracking-widest bg-white/10 text-white/80 hover:bg-white/20">Export CSV</button>
            </div>
            {/* <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'received', label: 'Received' },
                { key: 'sent', label: 'Sent' },
              ].map(t => (
                <button key={t.key} onClick={() => setDirection(t.key)} className={`px-3 py-1 rounded-[30px] md:rounded-[40px] text-[11px] uppercase tracking-widest ${direction === t.key ? 'bg-pink-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>{t.label}</button>
              ))}
            </div> */}
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'gift_wish', label: 'Wishes' },
                { key: 'gift_membership', label: 'Memberships' },
                { key: 'gift_bill', label: 'Bills' },
                { key: 'gift_tip', label: 'Support' },
                { key: 'gift_shop', label: 'Shop' },
                { key: 'gift_task', label: 'Tasks' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-[30px] md:rounded-[40px] 
                  text-[14px] uppercase tracking-widest 
                  ${filter === f.key ? 'bg-white text-black' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'}`}>{f.label}</button>
              ))}
            </div>
            {Object.keys(currencyTotals).length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(currencyTotals).map(([cur, amt]) => (
                  <span key={cur} className="px-4 py-2 rounded-full bg-white/5 text-white/80 text-[12px] capitalize font-poppins">
                    {cur.toUpperCase()}: {formatMoney(amt)}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {loading && !data.events?.length ? (
          <LoadingScreen />
        ) : filtered.length ? (
          <div className="space-y-4">
            {filtered.map((e, i) => {
              const icon = iconFor(e.type);
              const cp = e.category === 'sent'
                ? (e?.creator?.username ? `To @${e.creator.username}` : (e?.creator?.name ? `To ${e.creator.name}` : 'To creator'))
                : (e?.gifter?.username ? `From @${e.gifter.username}` : (e?.gifter?.name ? `From ${e.gifter.name}` : 'From supporter'));
              const avatar = e.category === 'sent' ? (e?.creator?.avatar || '') : (e?.gifter?.avatar || '');
              return (
                <FadeIn key={`tx-${i}`}>
                  <div className="rounded-[20px] md:rounded-[30px] bg-[#1A1B23]/40 border border-white/10 p-4 md:p-6 hover:bg-[#1A1B23]/60 transition-all">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {/* <div className="flex-shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-r from-[#05EFB8] to-[#8C52FF] border border-white/10 flex items-center justify-center text-[16px] md:text-[20px] text-white/90">
                          {icon}
                        </div> */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-white font-bold text-base md:text-lg truncate">{titleFor(e)}</p>
                            {isNew(e.created_at) ? (
                              <span className="px-1.5 py-0.5 rounded bg-pink-600 text-[9px] font-bold text-white uppercase tracking-tighter animate-pulse">New</span>
                            ) : null}
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${e.category === 'sent' ? 'bg-pink-600 text-white' : 'bg-white/10 text-white/70'}`}>
                              {e.category}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <div className="flex items-center gap-1.5">
                              <img src={avatar || defaultAvatar} alt="" className="h-8 w-8 rounded-full border border-white/10 object-cover" />
                              <p className="text-white/40 text-[14px] uppercase tracking-widest truncate max-w-[120px] sm:max-w-none">
                                {e.category === 'sent'
                                  ? (e?.creator?.username ? <Link href={`/${e.creator.username}`} className="text-white/70 hover:text-white">@{e.creator.username}</Link> : cp)
                                  : (e?.gifter?.username ? <Link href={`/${e.gifter.username}`} className="text-white/70 hover:text-white">@{e.gifter.username}</Link> : cp)
                                }
                              </p>
                            </div>
                            <span className="hidden sm:inline text-white/20">•</span>
                            <p className="text-white/30 text-[14px] uppercase">
                              {e.created_at}
                            </p>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {rewardChip(e) ? (
                              <span className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 uppercase tracking-widest font-medium">
                                {rewardChip(e)}
                              </span>
                            ) : null}
                            {e?.wish?.name && e.open_link ? (
                              <Link href={e.open_link} className="text-white/80 underline text-sm truncate block max-w-full italic">“{e.wish.name}”</Link>
                            ) : null}
                            {e?.membership?.level && e.open_link ? (
                              <Link href={e.open_link} className="text-white/80 underline text-sm truncate block max-w-full italic">Level “{e.membership.level}”</Link>
                            ) : null}
                            {e?.bill?.name && e.open_link ? (
                              <Link href={e.open_link} className="text-white/80 underline text-sm truncate block max-w-full italic">“{e.bill.name}”</Link>
                            ) : null}
                            {e?.shop?.name && e.open_link ? (
                              <div className="text-sm truncate block max-w-full italic">
                                {e.open_link.startsWith('http') ? (
                                  <a href={e.open_link} target="_blank" rel="noopener noreferrer" className="text-white/80 underline">“{e.shop.name}”</a>
                                ) : (
                                  <Link href={e.open_link} className="text-white/80 underline">“{e.shop.name}”</Link>
                                )}
                              </div>
                            ) : null}
                            {e?.task?.title && e.open_link ? (
                              <Link href={e.open_link} className="text-white/80 underline text-sm truncate block max-w-full italic">“{e.task.title}”</Link>
                            ) : null}
                          </div>

                          {(e?.task?.reward_file || e?.wish?.reward_file || e.certificate_url || e?.task?.reward_note) && (
                            <div className="mt-4 flex flex-col gap-2">
                              <div className="flex flex-wrap gap-2">
                                {e?.task?.reward_file ? (
                                  <a href={e.task.reward_file} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30 transition-colors">Download Reward</a>
                                ) : null}
                                {e?.wish?.reward_file ? (
                                  <a href={e.wish.reward_file} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-pink-600/20 text-pink-500 border border-pink-500/30 hover:bg-pink-600/30 transition-colors">Download Reward</a>
                                ) : null}
                                {e.certificate_url ? (
                                  <a href={e.certificate_url} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 transition-colors">Certificate</a>
                                ) : null}
                              </div>
                              {e?.task?.reward_note ? (
                                <p className="text-white/50 text-[11px] italic leading-relaxed bg-white/5 p-2 rounded-lg border-l-2 border-purple-500/50">Note: {e.task.reward_note}</p>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center md:flex-col md:items-end justify-between md:justify-start gap-3 mt-2 md:mt-0 pt-3 md:pt-0 border-t border-white/5 md:border-t-0">
                        <div className="flex items-center gap-2">
                          {auth?.user?.role === 1 && (
                            <button
                              onClick={() => handleTwitterClick(e)}
                              className="p-2 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/20 hover:bg-[#1DA1F2]/20 transition-all group"
                              title="Share on X" >
                              <FaTwitter size={14} className="group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                          {e.open_link ? (
                            e.open_link.startsWith('http') ? (
                              <a href={e.open_link} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 transition-all">Open</a>
                            ) : (
                              <Link href={e.open_link} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/10 text-white/70 border border-white/10 hover:bg-white/20 transition-all">Open</Link>
                            )
                          ) : null}
                          {storyUrlFor(e) ? (
                            <Link href={storyUrlFor(e)} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-pink-600/10 text-pink-500 border border-pink-500/20 hover:bg-pink-600/20 transition-all">View Story</Link>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <div className="text-[#05EFB8] font-black text-lg md:text-xl">{amountFor(e)}</div>
                          {Number(e?.vat_amount || 0) > 0 ? (
                            <div className="text-[11px] text-white/50 font-bold mt-1">
                              VAT: {formatMoney(Number(e.vat_amount || 0))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <ReactionsAndReply ev={e} viewer={auth?.user} />
                    </div>
                  </div>
                </FadeIn>
              );
            })}
            {data?.has_more ? (
              <div className="text-center">
                <button onClick={() => fetchFeed(data?.next_before || null, true)} className="px-5 py-2 rounded-[30px] md:rounded-[40px] text-[11px] uppercase tracking-widest bg-white/10 text-white/80 hover:bg-white/20">Load More</button>
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
