import Avatar from '@/includes/Avatar';
import { Link } from '@inertiajs/react';

export default function TrendingCreators({ creators }) {
  if (!creators || creators.length === 0) return null;

  return (
    <section className="containerbox !my-30 !pb-[100px]">
      <h2 className="fading text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-2 uppercase">Trending Creators</h2>
      <p className="fading text-center text-gray-300 mb-6">Most search-result clicks in the last 24h</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3">
        {creators.map((c) => (
          <Link key={c.id} href={`/${c.username}`} className="fading bg-white rounded-2xl p-3  border  border-3 !border-pink-500 hover:scale-[1.01] transition-[all] sshadow-[6px_6px_0_0_#F94F96]">
            <Avatar 
              name={c.name}
              username={c.username}
              src={c.avatar_url}
              role={c.role}
              profile_status_lock={c.profile_status_lock}
              // link={c.username}
            />
            <div className="mt-3 flex items-center justify-between text-sm text-gray-300 group-hover:text-white transition-colors">
              <span>24h clicks: {c.clicks_24h}</span>
              <span>7d: {c.clicks_7d}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

