import { clearAllNotificationState } from "@/utils/appBadge";
import MagicBell, { NotificationInbox, useMagicBellContext } from '@magicbell/magicbell-react';
import { usePage } from '@inertiajs/react';
import messagereciev from '../../../assets/audio/bell.mp3';
import { useMagicBellEvent } from '@magicbell/magicbell-react';
import { useEffect, useState, Component } from 'react';
import { MdClose, MdCheckCircle, MdSettings, MdMoreHoriz, MdDeleteSweep } from 'react-icons/md';
import { WebPushClient, isSupported } from '@magicbell/webpush';
import {
 sendPushHeartbeat,
 readPushState,
 promptDismissedRecently,
 markPromptDismissed,
} from '@/utils/pushHeartbeat';

/*
 * 🚨 BLACK ON PINK. The bell sits in the solid #FF007F header band, and every
 * part of it was a pale pink or a white: the icon was `#ff4fc4` (a tint of the
 * ground it stands on, ~1.6:1), the trigger carried the library's own
 * `rgba(255,255,255,0.17)` wash which lifts the ground under it, and the panel
 * header printed white type. Next to the currency, search and basket controls —
 * all `bg-black/[0.10] border-black/25` — it read as a different system.
 *
 * ⚠️ `unseenBadge` is BLACK, not the library's red. A red dot on brand pink is
 * two saturated hues fighting on a 20px object, and red is this app's failure
 * colour: an unread notification is not a failure.
 */
const customTheme = {
  icon: {
 borderColor: '#000000',
 },
 unseenBadge: {
 backgroundColor: '#000000',
  },
  header: {
    backgroundColor: '#FF007F',
    borderColor: '#fba8e0',
 textColor: '#000000',
    fontFamily: 'poppins',
  },
  footer: {
    backgroundColor: '#FF007F',
    borderColor: '#fba8e0',
 textColor: '#000000',
    fontFamily: 'poppins',
  },
  notification: {
    default: {
      backgroundColor: '#ffffff',
      textColor: '#3f0a43',
      fontSize: '14px',
      borderColor: 'transparent',
      fontFamily: 'poppins',
      hover: {
        backgroundColor: '#f8f9fa',
      },
    },
    unseen: {
      backgroundColor: '#ffffff',
      textColor: '#3f0a43',
      borderColor: 'transparent',
      fontFamily: 'poppins',
    },
  },
  branding: {
    borderRadius: '24px',
    fontFamily: 'poppins',
    textColor: '#3f0a43',
  },
};

const formatTimeShort = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const diff = Math.floor((new Date() - date) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const CustomHeader = ({ unreadCount, onMarkAllAsRead }) => {
  const magicbell = useMagicBellContext();

  /*
   * 🚨 MAGICBELL'S READ STATE IS NOT OURS. Pressing this used to clear only
   * MagicBell, while the app-icon badge counts unread rows in our own
   * `notifications` table — so the number came straight back on the next
   * foreground and no action available to the user could ever clear it
   * ("all have been cleared, the icon still says 3").
   *
   * `clearAllNotificationState()` writes all three stores that "read" has to
   * mean: our table, the OS notification tray, and the icon.
   * ⚠️ In `finally`, so a MagicBell failure still clears our side — the two are
   * independent services and one being down must not strand the badge.
   */
  const handleMarkAllAsRead = async () => {
    try {
      await onMarkAllAsRead?.();
    } finally {
      await clearAllNotificationState();
    }
  };

  const onDeleteAll = async () => {
    if (confirm("Are you sure you want to delete all notifications?")) {
      try {
        await magicbell.notifications.archiveAll();
      } catch (error) {
        console.error('Failed to delete all notifications:', error);
      } finally {
        // Deleting is a stronger "I have dealt with these" than marking read,
        // so it must clear at least as much.
        await clearAllNotificationState();
      }
    }
  };

  return (
 <div className="flex justify-between items-center px-5 py-4 bg-[#FF007F] text-black rounded-t-box">
      <h3 className="text-[17px] font-bold tracking-wide font-poppins">Notifications</h3>
      <div className="flex items-center gap-3">
        <button
          onClick={handleMarkAllAsRead}
 className="hover:bg-black/20 p-1.5 rounded-full transition-colors"
          title="Mark all as read"
        >
          <MdCheckCircle size={22} />
        </button>
        <button
          onClick={onDeleteAll}
 className="hover:bg-black/20 p-1.5 rounded-full transition-colors"
          title="Delete all"
        >
          <MdDeleteSweep size={22} />
        </button>
        <button
 className="hover:bg-black/20 p-1.5 rounded-full transition-colors"
          title="Settings"
        >
          <MdSettings size={22} />
        </button>
      </div>
    </div>
  );
};

const CustomNotificationItem = ({ notification }) => {
  const isUnread = !notification.readAt;
  
  return (
 <div className={`p-4 mb-3 rounded-box-sm relative border transition-all mx-3 mt-2 group ${
 isUnread ? 'bg-white border-pink-100 ' : 'bg-[#F8F9FA] border-gray-100'
 } hover:border-pink-200 `}>
      <div className="flex items-start gap-3">
 {/* Unread Indicator.
 ⚠️ A stray `ajhf` sat here as a bare JSX text node, so every row of the
 notification dropdown rendered that literal beside the unread dot. JSX
 text is valid markup, so nothing errored and no build caught it. */}
        {isUnread && (
 <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#FF007F] rounded-full border-2 border-white z-10" />
        )}
        
        <div className="flex-1 pl-1">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg filter grayscale-[0.2] group-hover:grayscale-0 transition-all">
                {notification.title?.toLowerCase().includes('payment') ? '🚨' :
                 notification.title?.toLowerCase().includes('account') ? '⚠️' :
                 notification.title?.toLowerCase().includes('approve') ? '✅' : '🔔'}
              </span>
              <h4 className={`font-bold text-[#3f0a43] text-[15px] leading-tight font-poppins ${isUnread ? 'text-[#FF007F]' : ''}`}>
                {notification.title}
              </h4>
            </div>
 <span className="text-[12px] text-gray-400 font-bold whitespace-nowrap ml-2 mt-0.5">
              {formatTimeShort(notification.sentAt)}
            </span>
          </div>
          
          <p className="text-[13px] text-gray-600 leading-relaxed pr-4 font-poppins line-clamp-2 group-hover:line-clamp-none transition-all">
            {notification.content}
          </p>
          
          <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-gray-400 hover:text-[#FF007F] transition-colors p-1">
              <MdMoreHoriz size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BrowserNotificationBanner = ({ onEnable, onHide }) => (
 <div className="mx-4 mb-4 p-4 bg-white border border-pink-100 rounded-box flex items-center justify-between gap-3 ">
    <div className="flex-1">
      <p className="text-[12px] text-[#FF007F] leading-tight font-bold font-poppins">
        By enabling browser notifications, you'll stay up to date even better.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button
        onClick={onEnable}
 className="bg-[#FF007F] text-black text-[12px] font-black uppercase tracking-wider px-4 py-2 min-h-[44px] rounded-box-sm hover:brightness-110 transition-colors whitespace-nowrap active:brightness-95"
      >
        Enable Now
      </button>
      <button onClick={onHide} className="text-gray-400 hover:text-gray-600 p-1">
        <MdClose size={20} />
      </button>
    </div>
  </div>
);

// The bell is non-critical UI. If the MagicBell provider throws during render
// (e.g. realtime token/config missing), render nothing instead of crashing the page.
class BellBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    /* swallow — notification bell failure must not break the page */
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const MagicBellNotification = () => {
  const { auth } = usePage().props;
  const [showBanner, setShowBanner] = useState(false);
  const serverURL = typeof window !== 'undefined' ? `${window.location.origin}/magicbell` : undefined;
  if (!auth?.user?.email) return null;

  useEffect(() => {
    let isMounted = true;

    const setupNotificationBanner = async () => {
      let supported = false;
      try {
        supported = isSupported();
      } catch (e) {
        supported = false;
      }
      if (!isMounted) return;

      // 🚨 Neither of these persists ANYTHING. Both are re-derived for free on
      // every mount, and a browser can move out of either state — someone who
      // once blocked notifications can allow them in site settings, and an iOS
      // visitor becomes supported the moment they install the PWA. The old code
      // wrote a permanent flag here, which is what made those recoveries
      // invisible forever on that device.
      if (!supported) {
        setShowBanner(false);
        return;
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
 setShowBanner(false);
 return;
 }

      // 🚨 THE ONLY THING THAT COUNTS AS SUBSCRIBED IS AN ACTUAL SUBSCRIPTION.
      // This is the bug that caused the whole silent-failure class: one
      // `isSubscribed` flag was set to 'true' on SUCCESS, on an unsupported
      // browser, on a denial, and on a MagicBell load failure — so a single
      // dismissal or one transient error suppressed the prompt permanently and
      // the person could never re-enable push on that device. Ask the browser
      // instead of trusting a flag we wrote.
 const { subscribed } = await readPushState();
 if (!isMounted) return;

 if (subscribed) {
 setShowBanner(false);
 return;
 }

      // ⚠️ A dismissal EXPIRES. "Not now" is not "never" — a permanent hide is
      // one tap away from a creator silently opting out of every sale alert they
      // will ever get, with no way back short of clearing site data.
 if (promptDismissedRecently()) {
        setShowBanner(false);
        return;
      }

      setShowBanner(true);
    };

    setupNotificationBanner();

    // ⚠️ Reported on EVERY mount, not only when the banner shows. The banner is
    // suppressed for anyone who has already dismissed it (`isSubscribed` in
    // localStorage), and those are precisely the accounts whose subscription may
    // have lapsed since — reporting only alongside the banner would leave the
    // silent-failure cohort permanently unmeasured. Self-throttled to once every
    // PushReachability::HEARTBEAT_THROTTLE_HOURS unless the answer changed.
 sendPushHeartbeat();

    return () => {
      isMounted = false;
    };
  }, []);

  // Suppress uncaught promise rejections thrown deep inside MagicBell's realtime
  // SDK (Ably) when the self-hosted proxy returns no realtime token — e.g.
  // "reading 'in_app/inbox'" / "reading 'toString'". These fire inside the
  // library's own promises (un-catchable here); the bell still works without
  // realtime. We match narrowly so unrelated rejections are never swallowed.
  useEffect(() => {
    const isBellNoise = (err) => {
      const msg = (err && (err.message || String(err))) || '';
      const stack = (err && err.stack) || '';
      return /in_app\/inbox/.test(msg)
        || /magicbell|ably/i.test(stack)
        || (/reading 'toString'/.test(msg) && /listen|url\.ts|router\.ts/.test(stack));
    };
    const onRejection = (e) => {
      if (isBellNoise(e.reason)) e.preventDefault();
    };
    window.addEventListener('unhandledrejection', onRejection);
    return () => window.removeEventListener('unhandledrejection', onRejection);
  }, []);

  const notificationRecieve = async () => {
    playSound(messagereciev)
  };

  useMagicBellEvent('notifications.new', notificationRecieve);

  function playSound(url) {
    if (typeof navigator !== 'undefined' && navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    const audio = new Audio(url);
    audio.loop = false;
    try {
      const p = audio.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {
    }
  }

  const handleEnableNotifications = async () => {
    try {
      let supported = false;
      try {
        supported = isSupported();
      } catch (e) {
        supported = false;
      }
      // Nothing is persisted for either state — see setupNotificationBanner.
      if (!supported) {
        setShowBanner(false);
        return;
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        setShowBanner(false);
        return;
      }

      const pushClient = new WebPushClient({
        apiKey: '515ceed31a4ba4c745b165a12e3a523dc9e93db4',
        userEmail: auth?.user?.email,
        serviceWorkerPath: '/service-worker.js',
      });
      await pushClient.subscribe();
      // force: the answer just changed, and this is the moment worth recording —
      // it is what takes the creator out of the reminder cohort. Deliberately the
      // ONLY success signal now; nothing writes a local "subscribed" flag, so the
      // browser's own registration stays the single source of truth.
 sendPushHeartbeat({ force: true });
    } catch (error) {
      console.error('Push subscription failed:', error);
      // ⚠️ A FAILURE IS A DISMISSAL, NOT A SUBSCRIPTION. This branch used to write
      // the same permanent `isSubscribed` flag as success, so one MagicBell load
      // blip retired the prompt for good on that device. It now backs off for
      // DISMISS_DAYS and the person is asked again.
 markPromptDismissed();
      }
    setShowBanner(false);
  };
   
  return (
    <div className='sm:relative'>
       <style>{`
         .magicbell-wrapper .notification-inbox { border: none !important; }
         .magicbell-wrapper .magicbell--branding { display: none !important; }
         .magicbell-wrapper .magicbell--footer { display: none !important; }
         .magicbell-wrapper .magicbell--header { border-radius: 24px 24px 0 0 !important; }

         /* The trigger, matched on the library's own data attribute — its class
 is an emotion hash (\`css-1j56y57\`) that changes between builds, so a
 class selector here would silently stop applying. It ships a
 \`rgba(255,255,255,0.17)\` wash; the other three header controls are
 solid white with NO border (client direction, 14 Aug 2026), and this is
 what makes it match. \`border: none\` is explicit because the library
 ships its own 1px rule — omitting it leaves this one control framed. */
 [data-magicbell-bell] {
 background-color: #FFFFFF !important;
 border: none !important;
 transition: background-color 200ms;
 }
 [data-magicbell-bell]:hover { background-color: rgba(255, 255, 255, 0.85) !important; }
       `}</style>
       <BellBoundary>
       <MagicBell
        theme={customTheme}
        className='magicbell'
        onNewNotification={notificationRecieve}
        closeOnClickOutside={true}
        serverURL={serverURL}
        network={{ maxRetries: 0 }}
        apiKey={'515ceed31a4ba4c745b165a12e3a523dc9e93db4'}
        userEmail={auth?.user?.email}
      >
        {(props) => (
          <>
            {props.isOpen && (
              <div
                className="fixed inset-0 bg-black/5 z-[9998] cursor-default backdrop-blur-[1px]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  props.toggle();
                }}
              />
            )}
 <div className="magicbell-wrapper fixed md:absolute right-0 md:right-[20px] top-[80px] md:top-[30px] md:mt-[-20px] z-[9999] w-[calc(100%-30px)] md:w-[450px] mx-[15px] md:mx-0 overflow-hidden rounded-box bg-white border border-gray-100">
              <NotificationInbox
                className='notification-inbox'
                width={"100%"}
                height={550}
                ItemComponent={CustomNotificationItem}
                header={CustomHeader}
                footer={null}
                {...props}
              >
                <div className="flex flex-col h-full bg-[#fdfbf7]/30">
                  <div className="flex-1 overflow-y-auto customScrollbar py-2">
                    {/* The list will be rendered here by NotificationInbox */}
                  </div>
                  {showBanner && (
                    <div className="pt-2 pb-1 bg-white border-t border-gray-50">
                      <BrowserNotificationBanner
                        onEnable={handleEnableNotifications}
 onHide={() => {
                          // ⚠️ Records a DATED dismissal, not a permanent one. Hiding
                          // this used to be indistinguishable from subscribing, which
                          // is how a tap on the close button silently cost a creator
                          // every future sale alert on that device.
 markPromptDismissed();
 setShowBanner(false);
 }}
                      />
                    </div>
                  )}
                </div>
              </NotificationInbox>
            </div>
          </>
        )}
      </MagicBell>
       </BellBoundary>
    </div>
  );
};

export default MagicBellNotification;
