import MagicBell, { NotificationInbox, useMagicBellContext } from '@magicbell/magicbell-react';
import { usePage } from '@inertiajs/react';
import messagereciev from '../../../assets/audio/bell.mp3';
import { useMagicBellEvent } from '@magicbell/magicbell-react';
import { useEffect, useState, Component } from 'react';
import { MdClose, MdCheckCircle, MdSettings, MdMoreHoriz, MdDeleteSweep } from 'react-icons/md';
import { WebPushClient, isSupported } from '@magicbell/webpush';

const customTheme = {
  icon: {
    borderColor: '#ff4fc4',
  },
  header: {
    backgroundColor: '#FF007F',
    borderColor: '#fba8e0',
    textColor: '#ffffff',
    fontFamily: 'poppins',
  },
  footer: {
    backgroundColor: '#FF007F',
    borderColor: '#fba8e0',
    textColor: '#ffffff',
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

  const onDeleteAll = async () => {
    if (confirm("Are you sure you want to delete all notifications?")) {
      try {
        await magicbell.notifications.archiveAll();
      } catch (error) {
        console.error('Failed to delete all notifications:', error);
      }
    }
  };

  return (
    <div className="flex justify-between items-center px-5 py-4 bg-[#FF007F] text-white rounded-t-[24px]">
      <h3 className="text-[17px] font-bold tracking-wide font-poppins">Notifications</h3>
      <div className="flex items-center gap-3">
        <button 
          onClick={onMarkAllAsRead}
          className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
          title="Mark all as read"
        >
          <MdCheckCircle size={22} />
        </button>
        <button 
          onClick={onDeleteAll}
          className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
          title="Delete all"
        >
          <MdDeleteSweep size={22} />
        </button>
        <button 
          className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
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
    <div className={`p-4 mb-3 rounded-[20px] relative border transition-all mx-3 mt-2 group ${
      isUnread ? 'bg-white border-pink-100 shadow-sm' : 'bg-[#F8F9FA] border-gray-100'
    } hover:shadow-md hover:border-pink-200`}>
      <div className="flex items-start gap-3">
        {/* Unread Indicator */}
        {isUnread && (
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#FF007F] rounded-full border-2 border-white shadow-[0_0_8px_rgba(249,79,150,0.6)] z-10" />
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
            <span className="text-[11px] text-gray-400 font-bold whitespace-nowrap ml-2 mt-0.5">
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
  <div className="mx-4 mb-4 p-4 bg-white border border-pink-100 rounded-[30px]  flex items-center justify-between gap-3 shadow-[0_4px_12px_rgba(249,79,150,0.08)]">
    <div className="flex-1">
      <p className="text-[12px] text-[#FF007F] leading-tight font-bold font-poppins">
        By enabling browser notifications, you'll stay up to date even better.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button 
        onClick={onEnable}
        className="bg-[#FF007F] text-white text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-[#e83e85] transition-colors whitespace-nowrap shadow-sm active:scale-95 transform"
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
      const isSubscribed = localStorage.getItem('isSubscribed');
      if (isSubscribed === 'true') return;

      let supported = false;
      try {
        supported = isSupported();
      } catch (e) {
        supported = false;
      }
      if (!isMounted) return;

      // Permanently hide banner on unsupported browsers to avoid repeated noise.
      if (!supported) {
        localStorage.setItem('isSubscribed', 'true');
        setShowBanner(false);
        return;
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        localStorage.setItem('isSubscribed', 'true');
        setShowBanner(false);
        return;
      }

      setShowBanner(true);
    };

    setupNotificationBanner();

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
      if (!supported) {
        localStorage.setItem('isSubscribed', 'true');
        setShowBanner(false);
        return;
      }

      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        localStorage.setItem('isSubscribed', 'true');
        setShowBanner(false);
        return;
      }

      const pushClient = new WebPushClient({
        apiKey: '515ceed31a4ba4c745b165a12e3a523dc9e93db4',
        userEmail: auth?.user?.email,
        serviceWorkerPath: '/service-worker.js',
      });
      await pushClient.subscribe();
      localStorage.setItem('isSubscribed', 'true');
    } catch (error) {
      console.error('Push subscription failed:', error);
      const errMessage = error?.message || '';
      const deniedByBrowser = error?.name === 'NotAllowedError' || /not allowed|permission denied/i.test(errMessage);
      const magicbellLoadFailure = error?.name === 'MagicBellError' || /load failed/i.test(errMessage);
      if (deniedByBrowser || magicbellLoadFailure) {
        localStorage.setItem('isSubscribed', 'true');
      }
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
            <div className="magicbell-wrapper fixed md:absolute right-0 md:right-[20px] top-[80px] md:top-[30px] md:mt-[-20px] z-[9999] w-[calc(100%-30px)] md:w-[450px] mx-[15px] md:mx-0 overflow-hidden rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white border border-gray-100">
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
                        onHide={() => setShowBanner(false)}
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
