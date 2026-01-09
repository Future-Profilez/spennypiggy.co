import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';
import { Link } from '@inertiajs/react';

export default function TopEarners({ creators, periodLabel }) {
  if (!creators || creators.length === 0) return null;
  const { formatMultiPrice } = PriceFormat();

  return (
    <section className="bg-black relative overflow-hidden py-24">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="containerbox relative z-10">
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-6 uppercase leading-tight">
          Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-500">Earners</span>{periodLabel ? ` — ${periodLabel}` : ''}
        </h2>
        {periodLabel === 'Week' ? (
          <p className="text-center text-gray-300 mb-12 text-lg">Mon 00:00 → Sun 23:59 (UK time)</p>
        ) : periodLabel === 'Today' ? (
          <p className="text-center text-gray-300 mb-12 text-lg">Today (UK time)</p>
        ) : periodLabel === 'Month' ? (
          <p className="text-center text-gray-300 mb-12 text-lg">This month (UK time)</p>
        ) : (
          <p className="text-center text-gray-300 mb-12 text-lg">All-time totals</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {creators.map((c, idx) => (
            <Link key={c.id} href={`/${c.username}`} className="group relative bg-gray-900 rounded-3xl p-4 border-2 border-pink-500 hover:scale-[1.02] transition-all duration-300 shadow-[4px_4px_0_0_#ec4899] hover:shadow-[6px_6px_0_0_#ec4899]">
            {c.is_number_one ? (
              <div className="absolute top-[-13px] left-[-13px] bg-[#F94F96] text-white text-xs font-bold px-2 py-1 rounded-full">#1 {periodLabel ? ` — ${periodLabel}` : ''}</div>
            ) : null}
            <div className="flex items-center justify-between">
              <Avatar 
                name={c.name}
                username={c.username}
                src={c.avatar_url}
                role={c.role}
                profile_status_lock={c.profile_status_lock}
                // link={c.username}
              />
              <div className="text-right">
                <div className="font-bold text-white group-hover:text-pink-400 transition-colors">{formatMultiPrice(c.total_amount, c.currency || 'USD')}</div>
                {periodLabel ? <div className="text-xs text-gray-400">{periodLabel} total</div> : ''}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
    </section>
  );
}
