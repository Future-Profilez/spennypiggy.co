import Avatar from '@/includes/Avatar';
import { Link } from '@inertiajs/react';

export default function NewVerified({ creators }) {
  if (!creators || creators.length === 0) return null;

  return (
    <section className="bg-black relative overflow-hidden py-24">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute top-1/4 right-0 w-96 h-96 bg-green-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      </div>

      <div className="containerbox relative z-10">
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-6 uppercase leading-tight">
          New & <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-blue-500">Verified</span>
        </h2>
        <p className="text-center text-gray-300 mb-12 text-lg">Joined within the last 30 days</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-6">
          {creators.map((c) => (
            <Link key={c.id} href={`/${c.username}`} className="group relative bg-gray-900 rounded-3xl p-4 border-2 border-green-500 hover:scale-[1.02] transition-all duration-300 shadow-[4px_4px_0_0_#22c55e] hover:shadow-[6px_6px_0_0_#22c55e]">
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

