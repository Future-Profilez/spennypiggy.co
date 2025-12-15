import Avatar from '@/includes/Avatar';

export default function NewVerified({ creators }) {
  if (!creators || creators.length === 0) return null;

  return (
    <section className="containerbox my-10 !pt-[10px] !pb-[100px]">
      <h2 className="fading headingSm font-gulfs text-center mb-2">New & Verified</h2>
      <p className="fading text-center text-gray-300 mb-6">Joined within the last 7 days</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3 gap-3">
        {creators.map((c) => (
          <div key={c.id} className="fading bg-white rounded-2xl p-3 border  border-3 !border-green-500 sshadow-[6px_6px_0_0_#1AD1A6]">
              <div className="absolute top-[-13px] right-[-13px] bg-[#F94F96] text-white text-xs font-bold px-2 py-1 rounded-full">New</div>
            <Avatar 
              name={c.name}
              username={c.username}
              src={c.avatar_url}
              role={c.role}
              profile_status_lock={c.profile_status_lock}
              link={c.username}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

