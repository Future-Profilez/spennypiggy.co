import axios from 'axios';
import { useEffect, useState } from 'react';
import { usePage, Link } from '@inertiajs/react';
import LoadingScreen from '@/includes/LoadingScreen';
import Nocontent from '@/includes/Nocontent';
import PriceFormat from '@/includes/PriceFormat';
import Avatar from '@/includes/Avatar';
import Popup from '@/Components/Popup';
import Authenticated from '../../Layouts/AuthenticatedLayout';
import ReactionsAndReply from '@/Components/ReactionsAndReply';
import { FaTwitter, FaShareAlt } from 'react-icons/fa';

export default function SupportStory({ creator, gifter }) {
  
  const pageProps = usePage().props || {};
  const { auth } = pageProps;
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ events: [], creator: {}, gifter: {} });
  const { formatMultiPrice } = PriceFormat();
  const [activeType, setActiveType] = useState('all');
  const [appendStart, setAppendStart] = useState(null);

  const fetchStory = (cursor = null, append = false) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('limit', '20');
    if (cursor) params.set('before', cursor);
    axios
      .get(`/support-story/${creator}/${gifter}?${params.toString()}`)
      .then((resp) => {
        if (!append) {
          setData(resp.data || { events: [] });
        } else {
          const prev = data?.events || [];
          setAppendStart(prev.length);
          const merged = [...prev, ...(resp.data?.events || [])];
          setData({ ...(resp.data || {}), events: merged });
        }
      })
      .catch((_e) => {
        if (!append) setData({ events: [] });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStory(null, false);
  }, []);

  const iconFor = (t) => {
    switch (t) {
      case 'gift_wish': return '🎁';
      case 'gift_membership': return '🎟️';
      case 'gift_bill': return '🧾';
      case 'gift_tip': return '💖';
      case 'gift_shop': return '🛍️';
      case 'gift_task': return '🧩';
      case 'thankyou': return '💌';
      default: return '✨';
    }
  };

  const titleFor = (ev) => {
    switch (ev.type) {
      case 'gift_wish':
        return ev.wish?.name ? `You contributed to “${ev.wish.name}”` : 'You sent a gift';
      case 'gift_membership':
        return ev.membership?.level ? `You supported level “${ev.membership.level}”` : 'You supported a membership';
      case 'gift_bill':
        return ev.bill?.name ? `You renewed “${ev.bill.name}”` : 'You supported a bill';
      case 'gift_tip':
        return ev.tip?.name ? `You sent support for “${ev.tip.name}”` : 'You sent support';
      case 'gift_shop':
        return ev.shop?.name ? `You purchased “${ev.shop.name}”` : 'You purchased from the shop';
      case 'gift_task':
        return ev.task?.title ? `You funded a task: “${ev.task.title}”` : 'You funded a task';
      case 'thankyou':
        return 'Creator sent a thank‑you';
      default:
        return 'Update';
    }
  };

  const subtitleFor = (ev) => {
    const when = ev.created_at;
    switch (ev.type) {
      case 'gift_wish': return `Gift received by @${ev.owner?.username} `;
      case 'gift_membership': return `Membership active with @${ev.owner?.username} `;
      case 'gift_bill': return `Bill support for @${ev.owner?.username} `;
      case 'gift_tip': return `Support to @${ev.owner?.username} `;
      case 'gift_shop': return `Shop order for @${ev.owner?.username} `;
      case 'gift_task': return `Task for @${ev.owner?.username} `;
      case 'thankyou': return `From @${ev.owner?.username} `;
      default: return when;
    }
  };

  const amountFor = (ev) => {
    const creatorAmount = Number(ev?.creator_amount ?? ev?.amount ?? 0);
    if (!creatorAmount) return null;
    return formatMultiPrice(creatorAmount, ev.currency || 'gbp');
  };

  const filteredEvents = data?.events?.filter((e) => activeType === 'all' ? true : e.type === activeType) || [];

  const giftEvents = data?.events?.filter(e => e.type !== 'thankyou') || [];
  const giftCount = giftEvents.length;

  const shareIndividualEvent = (ev) => {
    const isGifter = auth?.user?.username === (data?.gifter?.username || gifter);
    const creatorHandle = data?.creator?.username ? `@${data.creator.username}` : (data?.creator?.name || 'a creator');
    
    let text = '';
    const origin = window.location.origin;
    let url = `${origin}/support-story/${data?.creator?.username || creator}/${data?.gifter?.username || gifter}`;

    if (isGifter) {
      switch (ev.type) {
        case 'gift_wish': text = `I just contributed to ${creatorHandle}'s wish: "${ev.wish?.name || 'wish'}"! 🎁`; break;
        case 'gift_tip': text = `Just sent some support to ${creatorHandle}! 💖`; break;
        case 'gift_membership': text = `I just joined ${creatorHandle}'s membership! 🎟️`; break;
        case 'gift_task': text = `Just funded a task for ${creatorHandle}: "${ev.task?.title || 'task'}"! 🧩`; break;
        default: text = `I'm supporting ${creatorHandle} on @SpennyPiggy! ✨`;
      }
    } else {
      // Creator sharing their own story
      switch (ev.type) {
        case 'gift_wish': text = `Just received support for my wish "${ev.wish?.name || 'wish'}"! 🎁`; break;
        case 'gift_tip': text = `Received some love and support! 💖`; break;
        case 'gift_membership': text = `A new member just joined the family! 🎟️`; break;
        case 'gift_task': text = `New task funded: "${ev.task?.title || 'task'}"! 🧩`; break;
        default: text = `Check out my support story on @SpennyPiggy! ✨`;
      }
    }

    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
  };

  const EventCard = ({ ev, idx }) => {
    const title = titleFor(ev);
    const subtitle = subtitleFor(ev);
    const amount = amountFor(ev);
    const isThankyou = ev.type === 'thankyou';
    const icon = iconFor(ev.type);
    const viewer = auth?.user?.username;
    const canAct = !!viewer && (viewer === (data?.creator?.username || creator) || viewer === (data?.gifter?.username || gifter));
    const typeLabel = (() => {
      switch (ev.type) {
        case 'gift_wish': return 'Wish';
        case 'gift_membership': return 'Membership';
        case 'gift_bill': return 'Bill';
        case 'gift_tip': return 'Support';
        case 'gift_shop': return 'Shop';
        case 'gift_task': return 'Task';
        case 'thankyou': return 'Thank-you';
        default: return 'Update';
      }
    })();

    return (
      <div className="rounded-[25px] md:rounded-[30px]  bg-[#fdfbf7] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all p-5">
        <div className="md:flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-yellow-300 border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                {icon} {typeLabel}
              </span>
              <span className="inline-flex items-center justify-center min-w-[28px] h-[22px] px-2 rounded-full bg-white border-2 border-black text-[10px] tracking-widest text-black font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                #{idx}
              </span>
            </div>

            <p className="text-black font-black text-lg md:text-xl mt-3 mb-1">
              {title}
            </p>
            <p className="text-[10px] md:text-[11px] uppercase tracking-widest text-gray-700 font-black">
              {subtitle}
              <span className="ml-3 text-gray-500">{ev.created_at}</span>
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center md:justify-end gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {!isThankyou && (
                <button
                  onClick={() => shareIndividualEvent(ev)}
                  className="p-2 h-[30px] rounded-full bg-[#1DA1F2] text-white border-2 border-black hover:bg-[#1a91da] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all group"
                  title="Share on X"
                >
                  <FaTwitter size={16} className="group-hover:scale-110 transition-transform" />
                </button>
              )}
              {(() => {
                let openUrl = null;
                let label = 'Open';
                if (ev?.type === 'gift_wish' && ev?.wish?.id && ev?.owner?.username) {
                  openUrl = `/${ev.owner.username}/wish/${ev.wish.id}`;
                  label = 'View Wish';
                } else if (ev?.type === 'gift_membership' && ev?.membership?.uuid) {
                  openUrl = `/membership/checkout/${ev.membership.uuid}`;
                  label = 'View Membership';
                } else if (ev?.type === 'gift_bill' && ev?.bill?.uuid) {
                  openUrl = `/bill/checkout/${ev.bill.uuid}`;
                  label = 'View Subscription';
                } else if (ev?.type === 'gift_shop' && ev?.shop?.uuid) {
                  const slug = (ev?.shop?.name || '').toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
                  openUrl = `/shop/item/${slug}/${ev.shop.uuid}`;
                  label = 'View Product';
                } else if (ev?.type === 'gift_task' && ev?.task?.uuid) {
                  openUrl = `/task/${ev.task.uuid}`;
                  label = 'View Task';
                } else {
                  openUrl =
                    ev?.wish?.perma_link ||
                    ev?.membership?.perma_link ||
                    ev?.bill?.perma_link ||
                    ev?.shop?.perma_link ||
                    null;
                }
                if (!openUrl) return null;
                const isExternal = /^https?:\/\//i.test(openUrl) && !openUrl.startsWith(window.location.origin);
                const btnClass = "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-white border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all";
                if (isExternal) {
                  return (
                    <a href={openUrl} target="_blank" rel="noopener noreferrer" className={btnClass}>
                      {label}
                    </a>
                  );
                }
                return (
                  <Link href={openUrl} className={btnClass}>
                    {label}
                  </Link>
                );
              })()}
            </div>

            <div className="text-right">
              {amount ? (
                <div className="text-green-600 font-black text-xl md:text-2xl">
                  {amount}
                </div>
              ) : null}
            </div>
          </div>
        </div>
          
          {/* Status Badges */}
          {(ev.status === 'disputed' || ev.status === 'review_hold' || (ev.dispute_status && ev.dispute_status !== 'none')) && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-yellow-300 border-2 border-black text-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="w-2 h-2 rounded-full bg-black mr-2 animate-pulse"></span>
              Reserved / Disputed
            </div>
          )}
          
          {(ev.status === 'refunded' || ev.dispute_status === 'lost') && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-red-400 border-2 border-black text-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              Refunded
            </div>
          )}

          {ev.status &&
          ev.type !== 'thankyou' &&
          ev.status !== 'disputed' &&
          ev.status !== 'review_hold' &&
          ev.status !== 'refunded' &&
          (!ev.dispute_status || ev.dispute_status === 'none') ? (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-green-300 border-2 border-black text-black text-[10px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {String(ev.status).replaceAll('_', ' ')}
            </div>
          ) : null}

          {isThankyou ? (
            <div className="mt-4">
              {ev.message ? (
                <p className="text-black font-bold text-sm italic leading-relaxed bg-yellow-100 p-3 rounded-[25px] md:rounded-[30px]  border-2 border-black">
                  {ev.message}
                </p>
              ) : null}
              {ev.media_url ? (
                <div className="mt-3">
                  <Popup
                    modalclass="pinkmodal shadow-[4px_4px_0px_0px_#FF007F]ink"
                    space="0"
                    size="md"
                    action={false}
                    classes="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#FF007F] border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all"
                    text={<>View</>}
                  >
                    <div className="video-payer-pop">
                      {ev.media_type === 'image' ? (
                        <img crossOrigin="anonymous" src={ev.media_url} alt="media" />
                      ) : (
                        <video crossOrigin="anonymous" playsInline src={ev.media_url} controls controlsList="nodownload" />
                      )}
                    </div>
                  </Popup>
                </div>
              ) : null}
            </div>
          ) : null}

          {ev.type === 'gift_task' && ev.task?.reward_file ? (
            <div className="mt-4">
              <a href={ev.task.reward_file} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-300 border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">Download Reward</a>
              {ev.task.reward_note ? (
                <p className="mt-2 text-black font-bold text-xs italic leading-relaxed bg-yellow-100 p-3 rounded-[25px] md:rounded-[30px]  border-2 border-black">Note: {ev.task.reward_note}</p>
              ) : null}
            </div>
          ) : null}

          {ev.type === 'gift_wish' && ev.wish?.reward_file ? (
            <div className="mt-4">
              <a href={ev.wish.reward_file} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#FF007F] border-2 border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all">Download Reward</a>
            </div>
          ) : null}

          <ReactionsAndReply 
            ev={ev} 
            viewer={auth?.user}
            canAct={canAct} 
            creator={data?.creator?.username || creator} 
            gifter={data?.gifter?.username || gifter} 
          />
      </div>
    );
  };

  return (
    <Authenticated auth={auth?.user || ''} user={auth?.user || ''}>
      <div className="bg-[#A2E4B8] min-h-screen py-8 md:py-12 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-[25px] md:rounded-[30px]  bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 mb-6">
            <h2 className="text-black font-black text-2xl md:text-3xl uppercase tracking-widest mb-2">
              Support Story
            </h2>
            <p className="text-gray-600 font-bold">
              Shared journey of gifts, thank‑yous and progress with{' '}
              <span className="text-black">@{data?.creator?.username || creator}</span>
            </p>

            <div className="mt-6 md:flex items-center gap-4">
              <Avatar
                name={data?.creator?.name || creator}
                username={`@${data?.creator?.username || creator}`}
                src={data?.creator?.avatar}
                link={data?.creator?.username || null}
              />
              <div className="text-black w-fit text-center text-4xl px-[16px] py-[10px] font-black">
                ×
              </div>
              <Avatar
                name={data?.gifter?.name || gifter}
                username={`@${data?.gifter?.username || gifter}`}
                src={data?.gifter?.avatar}
                link={data?.gifter?.username || null}
              />
            </div>

            <div className="mt-6 p-4 rounded-[25px] md:rounded-[30px]  bg-[#fdfbf7] border-[3px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-black text-[11px] font-black uppercase tracking-widest mb-3">
                Shared History Summary
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-gray-700 text-[10px] uppercase tracking-widest font-black">
                    Total Moments
                  </p>
                  <p className="text-black font-black text-xl">
                    {data?.events?.length || 0}
                  </p>
                </div>
                <div className="w-px h-8 bg-black/20"></div>
                <div>
                  <p className="text-gray-700 text-[10px] uppercase tracking-widest font-black">
                    Gifts Exchanged
                  </p>
                  <p className="text-black font-black text-xl">{giftCount}</p>
                </div>
                <div className="w-px h-8 bg-black/20"></div>
                {(() => {
                  const sums = {};
                  (data?.events || []).forEach((ev) => {
                    const a = Number(ev?.creator_amount ?? ev?.amount ?? 0);
                    if (!ev?.currency || !a) return;
                    sums[ev.currency] = (sums[ev.currency] || 0) + a;
                  });
                  const entries = Object.entries(sums);
                  return entries.map(([cur, amt]) => (
                    <div key={cur}>
                      <p className="text-gray-700 text-[10px] uppercase tracking-widest font-black">
                        {cur} Earned
                      </p>
                      <p className="text-green-600 font-black text-xl">
                        {formatMultiPrice(amt, cur)}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Gifts' },
                { key: 'gift_wish', label: 'Wishes' },
                { key: 'gift_membership', label: 'Memberships' },
                { key: 'gift_bill', label: 'Bills' },
                { key: 'gift_tip', label: 'Support' },
                { key: 'gift_shop', label: 'Shop' },
                { key: 'gift_task', label: 'Paid Tasks' },
              ].map((f) => (
                <button 
                  key={f.key}
                  onClick={() => setActiveType(f.key)}
                  className={`px-4 py-2 rounded-full text-[13px] font-black uppercase tracking-widest border-[3px] border-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${ activeType === f.key ? 'bg-yellow-300' : 'bg-white' }`} > {f.label} </button>
              ))}
            </div>

            <div className="pt-6">
              <Link
                href={`/${data?.creator?.username || creator}`}
                className="inline-block px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest bg-[#FF007F] border-[3px] border-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
              > View Creator Profile </Link>
            </div>
          </div>

          {loading ? (
            <LoadingScreen />
          ) : filteredEvents.length ? (
            <div className="space-y-4">
              {filteredEvents.map((ev, i) => {
                const highlight = appendStart !== null && i >= appendStart;
                return (
                  <FadeIn key={`ev-${i}`} highlight={highlight}>
                    <EventCard ev={ev} idx={i + 1} />
                  </FadeIn>
                );
              })}
              {data?.has_more ? (
                <div className="text-center mt-8">
                  <button
                    onClick={() => fetchStory(data?.next_before || null, true)}
                    className="px-6 py-3 rounded-full text-sm font-black uppercase tracking-widest bg-yellow-300 border-[3px] border-black text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                  > Load More </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Nocontent text="No moments yet" />
          )}
        </div>
      </div>
    </Authenticated>
  );
}

function FadeIn({ children, highlight }) {
  const [show, setShow] = useState(!highlight);
  useEffect(() => {
    if (highlight) {
      const t = setTimeout(() => setShow(true), 10);
      return () => clearTimeout(t);
    } 
  }, [highlight]);
  
  return (
    <div className={`transition-all duration-300 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {children}
    </div>
  );
}
