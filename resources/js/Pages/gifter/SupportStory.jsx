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
    if (!ev.amount) return null;
    const total = (Number(ev.amount || 0) + Number(ev.tax || 0) + Number(ev.vat_amount || 0) + Number(ev.vat_tax_amount || 0));
    return formatMultiPrice(total, ev.currency || 'gbp');
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

    return (
      <div className="relative pl-10">
        <div className="absolute flex justify-center items-center left-[-10px] top-0 w-10 h-10 rounded-full 
        bg-[#05EFB8]  
        border-2 border-white/10 flex items-center justify-center 
        text-[24px] text-white/90">
          <span className=' mt-[4px]'>
            {icon}
            </span>
        </div>
        <div className="rounded-[20px] md:rounded-[30px] bg-[#1A1B23]/40 border border-white/10 p-5 hover:bg-[#1A1B23]/60 transition-all">
          <div className="md:flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* <img className="h-10 w-10 rounded-[20px] object-cover border border-white/10" src={ev.owner?.avatar || ''} alt="avatar" /> */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center min-w-[28px] h-[22px] px-2 rounded-full bg-white/10 border border-white/10 text-[11px] tracking-widest text-white/70 font-black">#{idx}</span>
                  <p className="text-gray-100 font-bold text-normal mb-0">{title}</p>
                </div>
                <p className=" font-poppins !text-white text-[12px] mt-2 font-black  uppercase">{subtitle} <span className="ms-3 text-white/60 text-[12px] !text-white tracking-widest uppercase">{ev.created_at}</span> </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2">
              {!isThankyou && (
                <button
                  onClick={() => shareIndividualEvent(ev)}
                  className="p-2 rounded-full bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/20 hover:bg-[#1DA1F2]/20 transition-all group"
                  title="Share this moment on X"
                >
                  <FaTwitter size={14} className="group-hover:scale-110 transition-transform" />
                </button>
              )}
              {(() => {
                let openUrl = null;
                let label = 'Open';
                // Prefer internal context routes
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
                  // Fallback to media permalink when available (external)
                  openUrl =
                    ev?.wish?.perma_link ||
                    ev?.membership?.perma_link ||
                    ev?.bill?.perma_link ||
                    ev?.shop?.perma_link ||
                    null;
                }
                if (!openUrl) return null;
                const isExternal = /^https?:\/\//i.test(openUrl) && !openUrl.startsWith(window.location.origin);
                if (isExternal) {
                  return (
                    <a
                      href={openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-[30px] md:rounded-[40px] text-[11px] uppercase tracking-widest bg-white/10 text-white/70 hover:bg-white/20"
                    >
                      {label}
                    </a>
                  );
                }
                return (
                  <Link
                    href={openUrl}
                    className="px-3 py-1 rounded-[30px] md:rounded-[40px] text-[11px] uppercase tracking-widest bg-white/10 text-white/70 hover:bg-white/20"
                  >
                    {label}
                  </Link>
                );
              })()}
              {amount ? <div className="text-[#05EFB8] font-black text-sm">{amount}</div> : null}
            </div>
          </div>

          {isThankyou ? (
            <div className="mt-4">
              {ev.message ? <p className="text-white/80">{ev.message}</p> : null}
              {ev.media_url ? (
                <div className="mt-3">
                  <Popup
                    modalclass="pinkmodal shadow-pink"
                    space="0"
                    size="md"
                    action={false}
                    classes={`button sm`}
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
              <a href={ev.task.reward_file} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-[30px] text-[11px] uppercase tracking-widest bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600/30">Download Reward</a>
              {ev.task.reward_note ? (
                <p className="mt-2 text-white/50 text-[11px] italic">Note: {ev.task.reward_note}</p>
              ) : null}
            </div>
          ) : null}

          {ev.type === 'gift_wish' && ev.wish?.reward_file ? (
            <div className="mt-4">
              <a href={ev.wish.reward_file} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded-[30px] text-[11px] uppercase tracking-widest bg-pink-600/20 text-pink-500 border border-pink-500/30 hover:bg-pink-600/30">Download Reward</a>
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
      </div>
    );
  };

  return (
    <Authenticated >
      <div className={`relative z-1 min-h-screen pb-20`}>
        <div className="max-w-[900px] mx-auto px-4 md:px-8 pt-8">
          <div className="relative mb-6">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8C52FF]/40 to-[#05EFB8]/40 rounded-[30px] md:rounded-[40px] blur opacity-10"></div>
            <div className="relative rounded-[30px] md:rounded-[40px] bg-[#000]/40 backdrop-blur-3xl border border-white/10 p-6 md:p-8">
              
              <h2 className="text-white font-black text-2xl mb-2">Support Story with {data?.creator?.name || creator}</h2>
              <p className="text-white/60 text-normal mt-2 !mb-6">Your shared journey of gifts, thank‑yous and progress.</p>

              <div className="mt-6">
                <div className="md:flex items-center gap-4 !mb-6 ">
                  <Avatar namecolor='!text-white'
                    name={data?.creator?.name || creator}
                    username={`@${data?.creator?.username || creator}`}
                    src={data?.creator?.avatar}
                    link={data?.creator?.username || null}
                  />
                  <div className="text-white/60 w-fit text-center text-5xl px-[20px] py-[10px]">×</div>
                  <Avatar namecolor='!text-white'
                    name={data?.gifter?.name || gifter}
                    username={`@${data?.gifter?.username || gifter}`}
                    src={data?.gifter?.avatar}
                    link={data?.gifter?.username || null}
                  />
                </div>
               
              </div>
             
              <div className="mt-6 p-4 rounded-[20px] md:rounded-[30px] bg-white/5 border border-white/10">
                <p className="text-white/40 text-[15px] font-bold uppercase tracking-widest mb-3">Shared History Summary</p>
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-white/60 text-[11px] uppercase tracking-tighter">Total Moments</p>
                    <p className="text-white font-black text-xl">{data?.events?.length || 0}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  <div>
                    <p className="text-white/60 text-[11px] uppercase tracking-tighter">Gifts Exchanged</p>
                    <p className="text-white font-black text-xl">{giftCount}</p>
                  </div>
                  <div className="w-px h-8 bg-white/10"></div>
                  {(() => {
                    const sums = {};
                    (data?.events || []).forEach(ev => {
                      if (!ev?.currency || !ev?.amount) return;
                      const t = Number(ev.amount || 0) + Number(ev.tax || 0);
                      sums[ev.currency] = (sums[ev.currency] || 0) + t;
                    });
                    const entries = Object.entries(sums);
                    return entries.map(([cur, amt]) => (
                      <div key={cur}>
                        <p className="text-[#05EFB8] text-[11px] uppercase tracking-tighter">{cur} Total</p>
                        <p className="text-white font-black text-xl">{formatMultiPrice(amt, cur)}</p>
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
                  // { key: 'thankyou', label: 'Thank‑you' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveType(f.key)}
                    className={`px-4 py-2 rounded-[30px] md:rounded-[40px] text-[12px] uppercase tracking-widest ${
                      activeType === f.key ? 'bg-pink-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className='pt-6'>
                <Link
                    href={`/${data?.creator?.username || creator}`}
                    className="!w-full md:!w-auto button rounded-[30px] md:rounded-[40px] mx-1 px-4 text-[11px] uppercase" >
                      View Creator Profile
                </Link>
              </div>
            </div>
          </div>

          {loading ? (
            <LoadingScreen />
          ) : filteredEvents.length ? (
            <div className="relative">
              <div className="absolute left-[9px] top-0 bottom-0 w-[2px] bg-white/10"></div>
              <div className="space-y-4">
                {filteredEvents.map((ev, i) => {
                  const highlight = appendStart !== null && i >= appendStart;
                  return (
                    <FadeIn key={`ev-${i}`} highlight={highlight}>
                      <EventCard ev={ev} idx={i + 1} />
                    </FadeIn>
                  )
                })}
              </div>
              {data?.has_more ? (
                <div className="text-center mt-6">
                  <button
                    onClick={() => fetchStory(data?.next_before || null, true)}
                    className="px-5 py-2 rounded-[30px] md:rounded-[40px] text-[11px] uppercase tracking-widest bg-white/10 text-white/80 hover:bg-white/20"
                  >
                    Load More
                  </button>
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
