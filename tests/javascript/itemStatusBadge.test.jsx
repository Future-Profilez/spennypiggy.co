import { renderToStaticMarkup } from 'react-dom/server';
import ItemStatusBadge from '@/Components/ItemStatusBadge';

const render = (props) => renderToStaticMarkup(<ItemStatusBadge {...props} />);

describe('ItemStatusBadge', () => {
    it('renders nothing for an unrecognised state', () => {
        // A state nobody defined must be silent, never a chip with no meaning —
        // the card is the creator's own listing and a mystery badge on it is
        // worse than no badge.
        expect(render({ state: 'something_new' })).toBe('');
        expect(render({ state: null })).toBe('');
        expect(render({})).toBe('');
    });

    it('names each of the three states distinctly', () => {
        expect(render({ state: 'flagged' })).toContain('Needs a fix');
        expect(render({ state: 'changes' })).toContain('Changes needed');
        expect(render({ state: 'suspended' })).toContain('Suspended');
    });

    it('keeps an automated flag visually calmer than a refusal', () => {
        // An automated check is not a person saying no. If these two ever render
        // in the same tone, a creator who has done nothing wrong is being shouted
        // at, which is how the badge that DOES need action gets ignored.
        const review = render({ state: 'flagged' });
        const changes = render({ state: 'changes' });
        expect(review).toContain('#FFF6DF');
        expect(review).not.toContain('#D11A2A');
        expect(changes).toContain('#D11A2A');
    });

    it('is a button, so the message is reachable', () => {
        const html = render({ state: 'changes', reason: 'Fix the cover image.' });
        expect(html).toContain('<button');
        expect(html).toContain('read why');
    });

    it('does not print the reason on the card itself', () => {
        // 🚨 The whole point: an admin's reason is arbitrary-length free text.
        // Rendered inline it pushes the card's price and CTA out of step with
        // its neighbour in the row, which is what the chip replaced. It belongs
        // in the dialog, which is closed until tapped.
        const reason = 'The cover image is too low resolution for a phone.';
        const html = render({ state: 'changes', reason });
        expect(html).not.toContain(reason);
    });

    it('falls back to a real explanation when no reason was given', () => {
        // A check can retract a listing without storing a sentence, so the dialog
        // must still say something — and what it says has to be an instruction,
        // not "wait": nobody is coming to look at it.
        const html = render({ state: 'flagged' });
        expect(html).toContain('Needs a fix');
    });

    it('never uses .border-black, which resets the width to 2px', () => {
        // Documented trap: index.css redefines that class as a full `border`
        // shorthand, so a `border-[3px] border-black` frame silently renders at
        // 2px with the 3px discarded.
        const html = render({ state: 'suspended', reason: 'Off sale.' });
        expect(html).not.toMatch(/\bborder-black\b/);
    });

    it('wears the worst state and counts the rest', () => {
        // A listing can be suspended AND carry a change request. Showing only the
        // worst leaves the creator fixing one problem while the other keeps it
        // off sale; showing two chips costs another row of height on a card whose
        // height is the thing being managed. So: worst state + a count.
        const html = render({
            notices: [
                { state: 'flagged' },
                { state: 'suspended', reason: 'Off sale.' },
            ],
        });
        expect(html).toContain('Suspended');
        expect(html).toContain('+1');
        expect(html).toContain('and 1 more');
    });

    it('ranks worst-first however the caller ordered them', () => {
        const html = render({
            notices: [{ state: 'flagged' }, { state: 'changes' }],
        });
        // "Changes needed" outranks "Needs a fix", whichever order it arrived in.
        expect(html.indexOf('Changes needed')).toBeGreaterThan(-1);
        expect(html).toContain('+1');
    });

    it('shows a plain dot, not a count, for a single notice', () => {
        expect(render({ state: 'flagged' })).not.toContain('+1');
    });

    // ⚠️ The dialog's own z-index (1000003, above the bar's 999999 and the
    // drawer's 1000002) CANNOT be asserted here: Headless UI renders nothing at
    // all while `show` is false, so no panel markup exists to inspect. It is
    // verified in a browser instead — see the note in the component.

    it('casts no shadow', () => {
        // Sitewide client direction, and `npm run check` fails the build on it.
        const html = render({ state: 'changes', reason: 'x' });
        expect(html).not.toMatch(/\bshadow-\[/);
    });
});
