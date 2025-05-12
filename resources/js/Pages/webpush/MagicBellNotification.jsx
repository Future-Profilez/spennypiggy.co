import React from 'react';
import MagicBell, { NotificationInbox } from '@magicbell/magicbell-react';
import { usePage } from '@inertiajs/react';
import messagereciev from '../../../assets/audio/bell.mp3'; // Correct import
import { useMagicBellEvent } from '@magicbell/magicbell-react';

const MagicBellNotification = () => {
  const { auth, errors } = usePage().props;

  const notificationRecieve = async () => {
    console.log("revice")
    playSound(messagereciev)
  };
  useMagicBellEvent('notifications.new', notificationRecieve);

  function playSound(url) {
    const audio = new Audio(url);
    audio.loop = false;
    audio.play();
  }


  return (
    <div className=''>
      <MagicBell onNewNotification={notificationRecieve} closeOnClickOutside={true}
        apiKey={'515ceed31a4ba4c745b165a12e3a523dc9e93db4'}
        userEmail={auth?.user?.email} >
        {(props) => <NotificationInbox className='notification-inbox' width={"100%"} height={500} {...props} />}
      </MagicBell>
    </div>
  );
};

export default MagicBellNotification;
