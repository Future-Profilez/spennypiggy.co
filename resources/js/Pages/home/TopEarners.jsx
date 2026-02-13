import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';
import { Link } from '@inertiajs/react';

export default function TopEarners({ creators, periodLabel }) {
  if (!creators || creators.length === 0) return null;
  const { formatMultiPrice } = PriceFormat();

  return (
    <section className="bg-black relative py-24">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating-shape"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating-shape" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="containerbox relative">
        <h2 className="fading text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-2 uppercase leading-tight">
          Top <span className="text-gradient-wishlist">Earners</span>{periodLabel ? ` — ${periodLabel}` : ''}
        </h2>
        {periodLabel === 'Week' ? (
          <p className="text-center text-gray-300 mb-12 text-lgfading ">From Monday 00:00 to Sunday 23:59 (UK time). Covers the full current week.</p>
        ) : periodLabel === 'Today' ? (
          <p className="text-center text-gray-300 mb-12 text-lgfading ">Data from today only (UK time). Updates in real time.</p>
        ) : periodLabel === 'Month' ? (
          <p className="text-center text-gray-300 mb-12 text-lgfading ">Stats for the current month (UK time).Includes all activity so far this month.</p>
        ) : (
          <p className="text-center text-gray-300 mb-12 text-lgfading ">Total activity since launch. Includes all historical data.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {creators.map((c, idx) => (
            <Link key={c.id} href={`/${c.username}`} className="fading group relative bg-gray-900 rounded-[30px] md:rounded-[40px]   p-4 border-2 border-pink-500 hover:scale-[1.02] transition-all duration-300 shadow-[4px_4px_0_0_#ec4899] hover:shadow-[6px_6px_0_0_#ec4899] text-white">
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
