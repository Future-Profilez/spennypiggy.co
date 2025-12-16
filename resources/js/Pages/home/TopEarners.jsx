import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';
import { Link } from '@inertiajs/react';

export default function TopEarners({ creators, periodLabel }) {
  if (!creators || creators.length === 0) return null;
  const { formatMultiPrice } = PriceFormat();

  return (
    <section className="containerbox my-10 !pt-[10px] !pb-[100px]">
      <h2 className="fading headingSm font-gulfs text-center mb-2">Top Earners{periodLabel ? ` — ${periodLabel}` : ''}</h2>
      {periodLabel === 'Week' ? (
        <p className="fading text-center text-gray-300 mb-6">Mon 00:00 → Sun 23:59 (UK time)</p>
      ) : periodLabel === 'Today' ? (
        <p className="fading text-center text-gray-300 mb-6">Today (UK time)</p>
      ) : periodLabel === 'Month' ? (
        <p className="fading text-center text-gray-300 mb-6">This month (UK time)</p>
      ) : (
        <p className="fading text-center text-gray-300 mb-6">All-time totals</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
        {creators.map((c, idx) => (
          <Link key={c.id} href={`/${c.username}`}  className="fading bg-white rounded-2xl p-3 border border-3 !border-pink-500 hover:scale-[1.01] transition-[all] relative">
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
                <div className="font-bold">{formatMultiPrice(c.total_amount, c.currency || 'USD')}</div>
                {periodLabel ? <div className="text-xs text-gray-500">{periodLabel} total</div> : ''}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
