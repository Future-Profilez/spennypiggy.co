import discoveryLink, { DISCOVERY_SOURCE } from "@/lib/discoveryLink";
import { useState } from "react";
import CollectionRow from '@/Components/discovery/CollectionRow';
import ShowcaseCreatorCard from '@/Components/discovery/ShowcaseCreatorCard';

/* Chapter 03 — the proof. The creator's own cover carries the card; the badge says
   why they are in this list, and the name says who they are. Nothing else. */

function ShowcaseCard({ c, cat }) {
  return (
    <ShowcaseCreatorCard
      /* Discovery-tagged: this card is Spenny Piggy choosing to show this
         creator, so the visit it produces is SP-generated. An untagged link
         here is a placement that never appears in the creator's numbers. */
      href={discoveryLink(c.username, cat.source)}
      name={c.name}
      username={c.username}
      avatarUrl={c.avatar_url}
      coverUrl={c.cover_url}
      badge={cat.badge(c)}
      accent={cat.accent}
      role={c.role}
      profileStatusLock={c.profile_status_lock}
    />
  );
}

/* ⚠️ The card itself lives in `Components/discovery/ShowcaseCreatorCard.jsx` —
   `CollectionRow` renders the SAME component on dark grounds, so the collections
   below this section can no longer drift into a second creator-card design. */

function SectionHeader({ groups, activeTab, setActiveTab, compact = false }) {
  return (
    <div className={compact ? "mb-7 text-center" : "mb-10 text-center"}>
      {!compact && (
        <>
          <span className="font-poppins text-xs uppercase tracking-[0.3em] text-[#FF007F]">
            The proof
          </span>
          <h2 className="mt-4 font-gulfs text-3xl uppercase leading-[0.9] tracking-tight text-white md:text-5xl">
            Creators already winning
          </h2>
          <p className="mx-auto mt-4 max-w-xl font-poppins text-sm leading-relaxed text-white/70">
            Real people, real momentum. Pick a category to see who is moving right now.
          </p>
        </>
      )}

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

export default function CreatorShowcase({ trending, newVerified, topEarners, topEarnersLabel, collections = [], compact = false }) {
  // Every hook runs before any early return — `groups` can legitimately be empty on
  // one render and filled on the next, and bailing out above a hook throws
  // "Rendered more hooks than during the previous render" when that happens.
  const [activeTab, setActiveTab] = useState("trending");

  const groups = [
    {
      key: "trending",
      label: "Trending",
      source: DISCOVERY_SOURCE.TRENDING,
      accent: "#FF007F",
      data: trending || [],
      badge: () => "Trending",
    },
    {
      key: "new",
      label: "New",
      source: DISCOVERY_SOURCE.NEW_CREATORS,
      accent: "#E6EA7B",
      data: newVerified || [],
      badge: () => "Newly verified",
    },
    {
      key: "top",
      label: "Top earners",
      /* No reserved key for "top earners" — the brief's list has none, and an
         invented one is refused by the server. Recorded as trending, the
         closest reserved surface, rather than silently dropped. */
      source: DISCOVERY_SOURCE.TRENDING,
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
      className={`relative z-10 bg-transparent px-4 md:px-8 ${
        compact ? "pb-12 pt-0 md:pb-20 md:pt-0" : "py-12 md:py-20"
      }`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* ⚠️ Ambient orbs: 0.15–0.20 opacity and `mix-blend-screen` on a dark
            section (see the homepage seam rules). These were `opacity-[0.07]` with
            a 200px blur — a 384px element paying a full blur composite to be
            almost invisible, so this section's seams stepped against neighbours
            that do glow. `multiply` would render pure black here and is only ever
            correct on the coloured bands. */}
        <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-[#FF007F] opacity-[0.16] blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-1/3 right-1/4 h-96 w-96 rounded-full bg-[#05EFB8] opacity-[0.16] blur-[120px] mix-blend-screen" />
      </div>

      {/* max-width moved off the section so its seam gradient can run full-bleed. */}
      <div className="relative z-10 mx-auto max-w-7xl">
        <SectionHeader groups={groups} activeTab={activeGroup.key} setActiveTab={setActiveTab} compact={compact} />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activeGroup.data.slice(0, MAX_PER_CATEGORY).map((c) => (
            <ShowcaseCard key={`${activeGroup.key}-${c.id}`} c={c} cat={activeGroup} />
          ))}
        </div>

        {/* Discovery Phase 6 — homepage collections.

            ⚠️ BELOW the tabbed grid, not inside it. The tabs are three views of
            ONE question ("who is doing well right now"); these are different
            questions, and folding them in as a fourth and fifth tab would hide
            them behind a click on the surface with the most visitors.

            ⚠️ `tone="dark"`: this section sits on the homepage's dark field, so
            a black heading would simply not be there. The cards stay white on
            every surface — they are the product. */}
        {collections.map((collection) => (
          <CollectionRow
            key={collection.key}
            collection={collection}
            tone="dark"
            className="mt-12"
          />
        ))}
      </div>
    </section>
  );
}
