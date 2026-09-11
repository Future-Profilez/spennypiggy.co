/**
 * "This programme is closed" — the dated notice on a retired scheme's published
 * terms page.
 *
 * 🚨 A PUBLISHED TERMS PAGE IS A LEGAL DOCUMENT AND CANNOT SIMPLY VANISH
 * (simplification programme §6, the terms-page exception). Anybody who agreed
 * to it is entitled to read what they agreed to, and a dead link in somebody's
 * e-mail is not acceptable. So the page stays at its existing address, the
 * wording below it is NEVER rewritten — it states what was agreed on the day —
 * and this notice is added above it.
 *
 * 🚨 THE DATE IS NOT OPTIONAL. "Closed" without "closed when" is not a legal
 * statement: a creator reading these terms has to be able to tell whether they
 * were inside the programme at the time. It comes from the scheme's own
 * `closed_on` config through `App\Support\Incentives::closedOn()`, and the
 * component renders NOTHING when that is null — so a scheme switched back on
 * loses the notice with no edit here.
 *
 * ⚠️ AMBER, NEVER RED. Nothing was taken away from anybody and nobody was
 * refused; red on this platform means a person said no. Same rule as the
 * Growth Bonus hold banner.
 *
 * ⚠️ It says entitlements already earned are unaffected, because that is true
 * and it is the first question a reader has. Both retired schemes keep paying
 * what was already owed — see each scheme's `payouts_enabled`.
 */
export default function ClosedProgrammeNotice({ closedOn, programme }) {
    if (!closedOn) {
        return null;
    }

    // ⚠️ Parsed as a date, printed in words. A raw `2026-09-11` on a legal page
    // is ambiguous to a US reader and this platform has creators in both.
    let readable = closedOn;
    try {
        const d = new Date(`${closedOn}T00:00:00Z`);
        if (!Number.isNaN(d.getTime())) {
            readable = d.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
            });
        }
    } catch {
        // Keep the raw string. A notice with an unformatted date still says
        // everything it has to; a notice that threw says nothing at all.
    }

    return (
        <div
            className="mb-10 rounded-box bg-[#FDF6D8] p-5 md:p-6"
            style={{ borderLeft: '4px solid #E6EA7B', border: '2px solid #000' }}
            role="note"
        >
            <p className="mb-2 font-gulfs text-[13px] uppercase tracking-[0.16em] text-black">
                This programme is closed
            </p>
            <p className="text-[15px] leading-relaxed text-black/80">
                {programme} closed to new participation on{' '}
                <strong className="text-black">{readable}</strong>. No new
                qualifications are being accepted.
            </p>
            <p className="mt-3 text-[15px] leading-relaxed text-black/80">
                These terms are kept here unchanged so that anyone who took part
                can read what they agreed to. Anything already earned under them
                is unaffected and will still be paid.
            </p>
        </div>
    );
}
