import { renderToStaticMarkup } from 'react-dom/server';
import OnboardingOverlay from '@/Components/Onboarding/OnboardingOverlay';
import { ONBOARDING_SLIDES } from '@/Components/Onboarding/slides';

function asInstalledApp(standalone = true) {
    window.matchMedia = jest.fn().mockImplementation((query) => ({
        matches: standalone && query === '(display-mode: standalone)',
        media: query,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
    }));
}

function render() {
    return renderToStaticMarkup(<OnboardingOverlay />);
}

beforeEach(() => {
    localStorage.clear();
    asInstalledApp();
});

describe('onboarding gate', () => {
    it('renders nothing in a browser tab', () => {
        asInstalledApp(false);

        expect(render()).toBe('');
    });

    it('renders nothing once it has been seen', () => {
        localStorage.setItem('spenny_onboarding_seen_v1', '1');

        expect(render()).toBe('');
    });

    it('renders in the installed app on first launch', () => {
        expect(render()).toContain('Buy what');
    });
});

describe('it continues the launch screen', () => {
    // 🚨 The handoff IS the design. A different ground colour here is a visible
    // cut between the launch art and the first screen of the app, which is what
    // the black overlay this replaced looked like.
    it('opens on the launch screen’s pink ground and violet field', () => {
        const html = render();

        expect(html).toContain('bg-[#FF007F]');
        expect(html).toContain('bg-[#8C52FF]');
    });

    it('spends mint on the single action and nothing else', () => {
        const html = render();
        const mint = html.split('#05EFB8').length - 1;

        // The button, and the one carried-over launch circle. Any more means an
        // accent that no longer signals "this is the thing to press".
        expect(mint).toBe(2);
    });

    /**
     * ⚠️ The field's height IS the progress indicator — there are no dots. It has
     * to start where the launch screen leaves it and only ever rise.
     */
    it('climbs the field on every slide and never drops back', () => {
        const fields = ONBOARDING_SLIDES.map((s) => s.field);

        expect(fields[0]).toBeLessThanOrEqual(80);
        expect(fields[fields.length - 1]).toBeLessThan(10);

        fields.forEach((value, i) => {
            if (i > 0) expect(value).toBeLessThan(fields[i - 1]);
        });
    });
});

describe('house rules', () => {
    it('casts no shadow', () => {
        const html = render();

        expect(html).not.toMatch(/box-shadow|shadow-\[/);
    });

    /**
     * 🚨 Black on brand pink is 5.56:1 and on the violet field 4.76:1 — both clear
     * AA and both fail the moment an opacity is put on them. White on pink is
     * 3.78:1 and fails outright, which is what the previous overlay used.
     */
    it('sets every piece of type in full black', () => {
        const html = render();

        expect(html).not.toContain('text-white');
        expect(html).not.toMatch(/text-black\/\d/);
    });

    it('uses no colour outside the brand palette', () => {
        const html = render();
        const hexes = html.match(/#[0-9A-Fa-f]{6}/g) ?? [];
        const allowed = ['#FF007F', '#8C52FF', '#05EFB8', '#E6EA7B', '#000000'];

        hexes.forEach((hex) => expect(allowed).toContain(hex.toUpperCase()));
    });

    /**
     * ⚠️ `border-black` is redefined in this project as a full `border` shorthand
     * that resets the width to 2px, so a `border-[3px] border-black` frame renders
     * at 2px with the 3px discarded silently.
     */
    it('never pairs a width class with the border-black shorthand', () => {
        const html = render();

        expect(html).not.toMatch(/border-\[3px\][^"]*\bborder-black\b/);
    });

    it('draws its marks rather than relying on the operating system', () => {
        const html = render();

        // An emoji is drawn by the OS, so the same slide looks like a different
        // product on every platform.
        expect(html).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
        expect(html).toContain('<svg');
    });
});

describe('slide content', () => {
    it('gives every slide a mark that resolves', () => {
        const known = ['piece', 'pot', 'order', 'purchases'];

        ONBOARDING_SLIDES.forEach((slide) => {
            expect(known).toContain(slide.mark);
        });
    });

    /**
     * 🚨 This is a Stripe-facing surface: it describes what money buys. Gift, tip,
     * donation and fundraising wording is banned across every user-facing surface,
     * and copy written for an onboarding flow is exactly where it creeps back in.
     */
    it('keeps the content-first vocabulary', () => {
        const banned = /\b(gift|gifts|gifting|tip|tips|donate|donation|donations|fundrais\w*|charity|coffee)\b/i;

        ONBOARDING_SLIDES.forEach((slide) => {
            const copy = [slide.step, ...slide.title, slide.body].join(' ');

            expect(copy).not.toMatch(banned);
        });
    });

    it('sets each title as two lines so the display face can break where it should', () => {
        ONBOARDING_SLIDES.forEach((slide) => {
            expect(Array.isArray(slide.title)).toBe(true);
            expect(slide.title).toHaveLength(2);
        });
    });
});
