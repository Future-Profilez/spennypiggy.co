import { useEffect } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, router } from '@inertiajs/react';

export default function Invite({ token }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (token) {
      localStorage.setItem('sp_invite_token', token);
    }
    router.visit(route('register', { type: 'creator' }), { replace: true });
  }, [token]);

  return (
    <GuestLayout>
      <Head title="Invite" />
      <div className="max-w-xl mx-auto py-16 px-6 text-center">
        <div className="text-xl font-black tracking-wider">Redirecting…</div>
        <div className="text-sm opacity-70 mt-2">Preparing your signup.</div>
      </div>
    </GuestLayout>
  );
}

