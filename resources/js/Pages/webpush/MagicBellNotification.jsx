import MagicBell, { NotificationInbox } from '@magicbell/magicbell-react';
import { usePage } from '@inertiajs/react';
import messagereciev from '../../../assets/audio/bell.mp3'; // Correct import
import { useMagicBellEvent } from '@magicbell/magicbell-react';
import { useEffect } from 'react';
import { useState } from 'react';
const customTheme = {
  icon: {
    borderColor: '#ff4fc4',
  },
  header: {
    backgroundColor: 'var(--pink)',
    borderColor: '#fba8e0',
    textColor: '#ffffff',
    fontFamily: 'poppins',
  },
  footer: {
    backgroundColor: 'var(--pink)',
    borderColor: '#fba8e0',
    textColor: '#ffffff',
    fontFamily: 'poppins',
  },
  notification: {
    default: {
      backgroundColor: '#f5f5f5',
      // backgroundColor: '#fff4fc',
      textColor: '#3f0a43',
      fontSize: '13px',
      borderColor: '#fcd7f6',
      fontFamily: 'poppins',
      hover: {
        backgroundColor: '#ffeafd',
      },
    },
    unseen: {
      backgroundColor: '#ffe5fc',
      textColor: '#bf168d',
      borderColor: '#fba8e0',
      fontFamily: 'poppins',
    },
  },
  branding: {
    borderRadius: '18px',
    fontFamily: 'poppins',
    textColor: '#3f0a43',
  },
  dark: {
    header: {
      backgroundColor: '#2c002e',
      textColor: '#ffc9f3',
      fontFamily: 'poppins',
    },
    notification: {
      default: {
        backgroundColor: '#3a003a',
        textColor: '#ffc9f3',
        fontFamily: 'poppins',
      },
    },
  },
};



const MagicBellNotification = () => {
  const { auth, errors } = usePage().props;

  const notificationRecieve = async () => { 
    playSound(messagereciev)
  };
  useMagicBellEvent('notifications.new', notificationRecieve);
  function playSound(url) {
    const audio = new Audio(url);
    audio.loop = false;
    audio.play();
  }
   
  return (
    <div className='sm:relative'>
       <MagicBell 
        theme={customTheme} className='magicbell' onNewNotification={notificationRecieve} closeOnClickOutside={true}
        apiKey={'515ceed31a4ba4c745b165a12e3a523dc9e93db4'}
        userEmail={auth?.user?.email} >
        {(props) => <NotificationInbox className='notification-inbox' width={"100%"} height={500} {...props} />}
      </MagicBell>
    </div>
  );
};

export default MagicBellNotification;
