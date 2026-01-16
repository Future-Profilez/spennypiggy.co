import Avatar from '@/includes/Avatar';
import { Link } from '@inertiajs/react';

export default function TrendingCreators({ creators }) {
  if (!creators || creators.length === 0) return null;

  return (
    <section className="bg-black py-16 md:py-24 relative ">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute top-1/4 left-0 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        </div>

        <div className="containerbox relative">
          <h2 className="fading text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-2 uppercase leading-tight">
            Trending <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">Creators</span>
          </h2>
          <p className="fading text-center text-gray-300 max-w-[500px] m-auto mb-8 md:!mb-12 text-lg">Top clicked search results from the past 24 hours.
Shows what users are actively exploring right now.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {creators.map((c) => (
              <Link key={c.id} href={`/${c.username}`} className="fading group relative bg-gray-900 rounded-3xl p-4 border-2 border-pink-500 hover:scale-[1.02] transition-all duration-300 shadow-[4px_4px_0_0_#ec4899] hover:shadow-[6px_6px_0_0_#ec4899] text-white">
                <Avatar 
                  name={c.name}
                  username={c.username}
                  src={c.avatar_url}
                  role={c.role}
                  profile_status_lock={c.profile_status_lock}
                  // link={c.username}
                />
                <div className="mt-4 flex items-center justify-between text-sm text-gray-400 group-hover:text-white transition-colors border-t border-gray-800 pt-3">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> 24h clicks: <span className="text-white font-bold">{c.clicks_24h}</span></span>
                  <span>7d: <span className="text-white font-bold">{c.clicks_7d}</span></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
    </section>
  );
}

