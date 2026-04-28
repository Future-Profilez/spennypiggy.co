import MagicBell, { NotificationInbox, useMagicBellContext } from '@magicbell/magicbell-react';
import { usePage } from '@inertiajs/react';
import messagereciev from '../../../assets/audio/bell.mp3';
import { useMagicBellEvent } from '@magicbell/magicbell-react';
import { useEffect, useState } from 'react';
import { MdClose, MdCheckCircle, MdSettings, MdMoreHoriz, MdDeleteSweep } from 'react-icons/md';
import { WebPushClient } from '@magicbell/webpush';

const customTheme = {
  icon: {
    borderColor: '#ff4fc4',
  },
  header: {
    backgroundColor: '#F94F96',
    borderColor: '#fba8e0',
    textColor: '#ffffff',
    fontFamily: 'poppins',
  },
  footer: {
    backgroundColor: '#F94F96',
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
    <div className="flex justify-between items-center px-5 py-4 bg-[#F94F96] text-white rounded-t-[24px]">
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
          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-[#F94F96] rounded-full border-2 border-white shadow-[0_0_8px_rgba(249,79,150,0.6)] z-10" />
        )}
        
        <div className="flex-1 pl-1">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <span className="text-lg filter grayscale-[0.2] group-hover:grayscale-0 transition-all">
                {notification.title?.toLowerCase().includes('payment') ? '🚨' : 
                 notification.title?.toLowerCase().includes('account') ? '⚠️' : 
                 notification.title?.toLowerCase().includes('approve') ? '✅' : '🔔'}
              </span>
              <h4 className={`font-bold text-[#3f0a43] text-[15px] leading-tight font-poppins ${isUnread ? 'text-[#F94F96]' : ''}`}>
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
            <button className="text-gray-400 hover:text-[#F94F96] transition-colors p-1">
              <MdMoreHoriz size={22} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BrowserNotificationBanner = ({ onEnable, onHide }) => (
  <div className="mx-4 mb-4 p-4 bg-white border border-pink-100 rounded-2xl flex items-center justify-between gap-3 shadow-[0_4px_12px_rgba(249,79,150,0.08)]">
    <div className="flex-1">
      <p className="text-[12px] text-pink-600 leading-tight font-bold font-poppins">
        By enabling browser notifications, you'll stay up to date even better.
      </p>
    </div>
    <div className="flex items-center gap-2">
      <button 
        onClick={onEnable}
        className="bg-[#F94F96] text-white text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-lg hover:bg-[#e83e85] transition-colors whitespace-nowrap shadow-sm active:scale-95 transform"
      >
        Enable Now
      </button>
      <button onClick={onHide} className="text-gray-400 hover:text-gray-600 p-1">
        <MdClose size={20} />
      </button>
    </div>
  </div>
);

const MagicBellNotification = () => {
  const { auth } = usePage().props;
  const [showBanner, setShowBanner] = useState(false);
  const serverURL = typeof window !== 'undefined' ? `${window.location.origin}/magicbell` : undefined;

  useEffect(() => {
    const isSubscribed = localStorage.getItem('isSubscribed');
    if (isSubscribed !== 'true') {
      setShowBanner(true);
    }
  }, []);

  const notificationRecieve = async () => {
    playSound(messagereciev)
  };

  useMagicBellEvent('notifications.new', notificationRecieve);

  function playSound(url) {
    const audio = new Audio(url);
    audio.loop = false;
    audio.play();
  }

  const handleEnableNotifications = async () => {
    try {
      const pushClient = new WebPushClient({
        apiKey: '515ceed31a4ba4c745b165a12e3a523dc9e93db4',
        userEmail: auth?.user?.email,
        serviceWorkerPath: '/service-worker.js',
      });
      await pushClient.subscribe();
      localStorage.setItem('isSubscribed', 'true');
    } catch (error) {
      console.error('Push subscription failed:', error);
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
            <div className="magicbell-wrapper fixed md:absolute right-0 md:right-[20px] top-[0px] md:top-[30px] md:mt-[-15px] z-[9999] w-[calc(100%-20px)] md:w-[450px] mx-[10px] md:mx-0 overflow-hidden rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-white border border-gray-100">
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
    </div>
  );
};

export default MagicBellNotification;
