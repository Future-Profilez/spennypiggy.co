import Avatar from '@/includes/Avatar';
import PriceFormat from '@/includes/PriceFormat';

export default function TopEarners({ creators }) {
  if (!creators || creators.length === 0) return null;
  const { formatMultiPrice } = PriceFormat();

  return (
    <section className="containerbox my-10 !pt-[10px] !pb-[100px]">
      <h2 className="fading headingSm font-gulfs text-center mb-2">Top Earners of the Week</h2>
      <p className="fading text-center text-gray-300 mb-6">Mon 00:00 → Sun 23:59 (UK time)</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
        {creators.map((c, idx) => (
          <div key={c.id} className="fading bg-white rounded-2xl p-3 border border-3 !border-pink-500 sshadow-[6px_6px_0_0_#F94F96] relative">
            {c.is_number_one ? (
              <div className="absolute top-[-13px] left-[-13px] bg-[#F94F96] text-white text-xs font-bold px-2 py-1 rounded-full">#1 this week</div>
            ) : null}
            <div className="flex items-center justify-between">
              <Avatar 
                name={c.name}
                username={c.username}
                src={c.avatar_url}
                role={c.role}
                profile_status_lock={c.profile_status_lock}
                link={c.username}
              />
              <div className="text-right">
                <div className="font-bold">{formatMultiPrice(c.total_amount, c.currency || 'USD')}</div>
                <div className="text-xs text-gray-500">Week total</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

