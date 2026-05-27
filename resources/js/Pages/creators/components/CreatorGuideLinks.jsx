import { Link, usePage } from '@inertiajs/react';

export default function CreatorGuideLinks() {
  const { url } = usePage();
  const pages = [
    { href: '/creators', label: 'Overview' },
    { href: '/creators/stripe-safe', label: 'Stripe Safe' },
    { href: '/creators/disputes', label: 'Disputes' },
    { href: '/creators/features', label: 'Features' },
    { href: '/creators/founder-bonus', label: 'Founder Bonus' },
    { href: '/creators/keep-100', label: 'Keep 100%' },
  ];

  return (
    <div className="mt-8">
      <div className="bg-[#fdfbf7] rounded-[25px] md:rounded-[30px]  border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6">
        <h3 className="text-lg md:text-xl font-black uppercase tracking-wide mb-4 text-black">
          Related Creator Guides
        </h3>
        <div className="flex flex-wrap gap-3">
          {pages.map((p) => {
            const active = url?.startsWith(p.href);
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={active ? 'page' : undefined}
                className={`px-4 py-2 rounded-full border-[3px] border-black transition-all
                 ${active ? 'bg-yellow-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]' : 'bg-white hover:bg-yellow-200 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'}`}
              >
                <span className="font-bold text-sm md:text-base text-black">{p.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
