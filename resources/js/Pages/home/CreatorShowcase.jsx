import Avatar from "@/includes/Avatar";
import { Link } from "@inertiajs/react";
import { HorizontalPan } from "@/Components/cinematic/Cinematic";

/* One creator tile inside the horizontal showcase pan. */
function ShowcaseCard({ c, cat }) {
  return (
    <div className="snap-center shrink-0 w-[260px] md:w-[316px]">
      <Link
        href={`/${c.username}`}
        className="block group relative rounded-[28px] p-5 bg-gradient-to-b from-gray-900 to-[#0b0b0f] border-2 transition-transform duration-300 hover:-translate-y-1.5 text-white"
        style={{ borderColor: cat.accent, boxShadow: `0 24px 50px -18px ${cat.glow}` }}
      >
        <span
          className="absolute -top-3 left-5 z-10 px-3 py-1 rounded-full text-[11px] font-gulfs uppercase tracking-widest text-white border-2 border-black"
          style={{ background: cat.accent }}
        >
          {cat.label}
        </span>
        <Avatar
          name={c.name}
          username={c.username}
          src={c.avatar_url}
          role={c.role}
          profile_status_lock={c.profile_status_lock}
          nolink={true}
          imgclass="!rounded-[18px]"
        />
        <div className="mt-4 flex items-center justify-between text-xs text-gray-400 border-t border-white/10 pt-3 group-hover:text-white transition-colors">
          {cat.stat(c)}
        </div>
      </Link>
    </div>
  );
}

/* Slim vertical chapter label between category groups. */
function GroupLabel({ title, accent }) {
  return (
    <div className="shrink-0 flex flex-col justify-center pr-2 md:pr-4">
      <span className="font-gulfs uppercase leading-[0.95] text-3xl md:text-4xl text-white max-w-[7ch]">
        {title}
      </span>
      <span className="mt-3 h-1 w-16 rounded-full" style={{ background: accent }} />
    </div>
  );
}

/**
 * CreatorShowcase — the cinematic centerpiece. Merges Trending, New & Verified
 * and Top Earners into a single pinned, horizontally-panning gallery.
 */
export default function CreatorShowcase({ trending, newVerified, topEarners, topEarnersLabel }) {
  const groups = [
    {
      key: "trending",
      title: "On fire",
      label: "🔥 Trending",
      accent: "#FF007F",
      glow: "rgba(255,0,127,0.45)",
      data: trending || [],
      stat: (c) => (
        <>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            24h <span className="text-white font-bold">{c.clicks_24h}</span>
          </span>
          <span>7d <span className="text-white font-bold">{c.clicks_7d}</span></span>
        </>
      ),
    },
    {
      key: "new",
      title: "Just joined",
      label: "✦ New & Verified",
      accent: "#22c55e",
      glow: "rgba(34,197,94,0.4)",
      data: newVerified || [],
      stat: () => (
        <>
          <span className="font-gulfs uppercase tracking-widest text-[11px] text-white">Verified</span>
          <span className="text-green-400">New this month</span>
        </>
      ),
    },
    {
      key: "top",
      title: topEarnersLabel ? `Top ${topEarnersLabel}` : "Top earners",
      label: "★ Top Earners",
      accent: "#8C52FF",
      glow: "rgba(140,82,255,0.45)",
      data: topEarners || [],
      stat: (c) => (
        <>
          <span className="font-gulfs uppercase tracking-widest text-[11px] text-white">
            {c.is_number_one ? "#1 Star" : "Top earner"}
          </span>
          {topEarnersLabel ? <span className="text-[#c9a6ff]">{topEarnersLabel}</span> : <span>Verified</span>}
        </>
      ),
    },
  ].filter((g) => g.data.length > 0);

  if (groups.length === 0) return null;

  return (
    <section id="act-proof" className="relative bg-transparent py-16 md:py-0">
      {/* ambient depth */}
      <div aria-hidden className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-[8%] w-96 h-96 bg-[#FF007F] rounded-full blur-[150px] opacity-15"></div>
        <div className="absolute bottom-1/4 right-[10%] w-96 h-96 bg-[#8C52FF] rounded-full blur-[150px] opacity-15"></div>
      </div>

      <HorizontalPan className="relative z-10">
        {/* Intro panel */}
        <div className="shrink-0 w-[82vw] md:w-[42vw] pr-6">
          <span className="font-gulfs uppercase tracking-[0.3em] text-sm text-[#FF007F]">The proof</span>
          <h2 className="font-gulfs uppercase text-white text-4xl md:text-6xl leading-[0.9] tracking-tight mt-4">
            Creators already winning
          </h2>
          <p className="font-poppins text-gray-300 text-base md:text-xl mt-5 max-w-md leading-relaxed">
            Real people, real momentum. Trending right now, freshly verified, and this period's top earners.
          </p>
        </div>

        {groups.map((g) => (
          <div key={g.key} className="flex items-stretch gap-6 md:gap-8">
            <GroupLabel title={g.title} accent={g.accent} />
            {g.data.map((c) => (
              <ShowcaseCard key={`${g.key}-${c.id}`} c={c} cat={g} />
            ))}
          </div>
        ))}
      </HorizontalPan>
    </section>
  );
}
