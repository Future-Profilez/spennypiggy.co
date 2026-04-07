import Avatar from '@/includes/Avatar';
import { Link } from '@inertiajs/react';

export default function NewVerified({ creators }) {
  if (!creators || creators.length === 0) return null;

  return (
    <section className="bg-black relative  py-24">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating-shape"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating-shape" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="containerbox relative ">
        <h2 className="fading text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-2 uppercase leading-tight">
          New & <span className="text-gradient-wishlist">Verified</span>
        </h2>
        <p className="fading max-w-[500px] m-auto !mb-8 md:!mb-12 text-center text-gray-300 mb-12 text-lg">
          Recently joined users from the past 30 days.
Stay updated with our newest community members.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-6">
          {creators.map((c) => (
            <Link key={c.id} href={`/${c.username}`} className="fading group relative bg-gray-900 rounded-[30px]   p-4 border-2 border-green-500 hover:scale-[1.02] transition-all duration-300 shadow-[4px_4px_0_0_#22c55e] hover:shadow-[6px_6px_0_0_#22c55e] text-white">
              <div className="absolute top-[-13px] right-[-13px] bg-red-500 text-white text-xs  px-2 py-1 rounded-full">New</div>
            <Avatar 
              name={c.name}
              username={c.username}
              src={c.avatar_url}
              role={c.role}
              profile_status_lock={c.profile_status_lock}
              // link={c.username}
            />
          </Link>
        ))}
      </div>
    </div>
    </section>
  );
}
