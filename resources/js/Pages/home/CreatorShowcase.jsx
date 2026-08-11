import Avatar from "@/includes/Avatar";
import { Link } from "@inertiajs/react";
import { useState } from "react";

/* Chapter 03 — the proof. The creator's own cover carries the card; the badge says
   why they are in this list, and the name says who they are. Nothing else. */

function ShowcaseCard({ c, cat }) {
  return (
    <Link
      href={`/${c.username}`}
      className="group relative flex flex-col overflow-hidden rounded-box border-2 bg-[#0d0a16] transition-transform duration-300 hover:-translate-y-1.5 motion-reduce:transform-none motion-reduce:transition-none"
      style={{ borderColor: cat.accent }}
    >
      {/* Cover — the creator's own banner, and now the whole card's image. */}
      <div className="relative h-[132px] w-full overflow-hidden">
        {c.cover_url ? (
          <img
            src={c.cover_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{ background: `linear-gradient(135deg, ${cat.accent}2e 0%, #0d0a16 100%)` }}
          />
        )}
        {/* A short fade at the foot only, so the cover meets the card body without
            a hard cut. The artwork itself is left alone. */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[#0d0a16]" />

        <span
          className="absolute left-3 top-3 rounded-full border-2 border-black px-3 py-1 font-poppins text-[11px] font-semibold uppercase tracking-[0.14em] text-black"
          style={{ background: cat.accent }}
        >
          {cat.badge(c)}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col px-5 pb-5 pt-4">
        {/* Who it belongs to. */}
        <div className="flex items-center gap-3">
          {/* Avatar pins itself to 60px via an injected stylesheet and nests two
              height-less wrappers inside this box, so a percentage height resolves
              against `auto` and collapses the image to nothing. Size it in px. */}
          <div className="shrink-0 overflow-hidden rounded-box-sm bg-[#1a162b]">
            <Avatar
              src={c.avatar_url}
              role={c.role}
              profile_status_lock={c.profile_status_lock}
              nolink={true}
              imgclass="!w-[46px] !h-[46px] !min-w-[46px] !min-h-[46px] !max-w-[46px] !max-h-[46px] !border-0 !rounded-none"
            />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-gulfs text-[17px] uppercase leading-tight tracking-wide text-white">
              {c.name}
            </h3>
            <p className="truncate font-poppins text-xs text-white/50">@{c.username}</p>
          </div>
          <span
            aria-hidden
            className="ml-auto shrink-0 font-gulfs text-lg transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none motion-reduce:transition-none"
            style={{ color: cat.accent }}
          >
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ groups, activeTab, setActiveTab }) {
  return (
    <div className="mb-10 text-center">
      <span className="font-poppins text-xs uppercase tracking-[0.3em] text-[#FF007F]">
        The proof
      </span>
      <h2 className="mt-4 font-gulfs text-3xl uppercase leading-[0.9] tracking-tight text-white md:text-5xl">
        Creators already winning
      </h2>
      <p className="mx-auto mt-4 max-w-xl font-poppins text-sm leading-relaxed text-white/70">
        Real people, real momentum. Pick a category to see who is moving right now.
      </p>

      {groups.length > 1 && (
        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          {groups.map((g) => {
            const isActive = g.key === activeTab;
            return (
              <button
                key={g.key}
                type="button"
                onClick={() => setActiveTab(g.key)}
                aria-pressed={isActive}
                className="min-h-[44px] rounded-box-sm border-2 px-5 font-poppins text-xs uppercase tracking-[0.16em] transition-colors duration-200 motion-reduce:transition-none"
                style={{
                  borderColor: g.accent,
                  backgroundColor: isActive ? g.accent : "transparent",
                  color: isActive ? "#000" : "#fff",
                }}
              >
                {g.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Two rows of three. The homepage route already caps every category at 6, so this
   is a guard rather than a filter — it keeps the grid from growing into a wall if
   that server-side limit is ever raised for another surface. */
const MAX_PER_CATEGORY = 6;

/* The server sends the earnings window as a bare noun — "Week", "Month", "All Time" —
   which reads as a stray word on its own inside a badge. Turned into a phrase here. */
const EARNER_SCOPE = {
  Week: "this week",
  Month: "this month",
  "All Time": "all time",
};

export default function CreatorShowcase({ trending, newVerified, topEarners, topEarnersLabel }) {
  // Every hook runs before any early return — `groups` can legitimately be empty on
  // one render and filled on the next, and bailing out above a hook throws
  // "Rendered more hooks than during the previous render" when that happens.
  const [activeTab, setActiveTab] = useState("trending");

  const groups = [
    {
      key: "trending",
      label: "Trending",
      accent: "#FF007F",
      data: trending || [],
      badge: () => "Trending",
    },
    {
      key: "new",
      label: "New",
      accent: "#E6EA7B",
      data: newVerified || [],
      badge: () => "Newly verified",
    },
    {
      key: "top",
      label: "Top earners",
      accent: "#05EFB8",
      data: topEarners || [],
      badge: (c) => {
        const scope = EARNER_SCOPE[topEarnersLabel];
        const rank = c.is_number_one ? "#1 earner" : "Top earner";
        return scope ? `${rank} ${scope}` : rank;
      },
    },
  ].filter((g) => g.data.length > 0);

  if (groups.length === 0) return null;

  // The stored tab may name a category that has since emptied out.
  const activeGroup = groups.find((g) => g.key === activeTab) || groups[0];

  return (
    <section
      id="act-proof"
      className="relative z-10 bg-transparent px-4 py-12 md:px-8 md:py-20"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-[#FF007F] opacity-[0.07] blur-[200px]" />
        <div className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-[#05EFB8] opacity-[0.07] blur-[200px]" />
      </div>

      {/* max-width moved off the section so its seam gradient can run full-bleed. */}
      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionHeader groups={groups} activeTab={activeGroup.key} setActiveTab={setActiveTab} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeGroup.data.slice(0, MAX_PER_CATEGORY).map((c) => (
            <ShowcaseCard key={`${activeGroup.key}-${c.id}`} c={c} cat={activeGroup} />
          ))}
        </div>
      </div>
    </section>
  );
}
