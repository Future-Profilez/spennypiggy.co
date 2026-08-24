import { renderToStaticMarkup } from 'react-dom/server';
import {
    ROLE_CREATOR,
    ROLE_SUPPORTER,
    canSubmitRegistration,
} from '@/Pages/Auth/register/constants';
import ReviewStep from '@/Pages/Auth/register/ReviewStep';

/**
 * UK direct-marketing consent at signup (client brief, 23 Aug 2026).
 *
 * The PHP suite proves the server records consent correctly. It cannot prove
 * the two things that live entirely in the browser, and those are the two that
 * quietly destroy the compliance position:
 *
 *  1. requiring the marketing box to submit — which turns an opt-in into forced
 *     consent, worth nothing, and passes every backend test;
 *  2. the box not rendering at all — which collects no consent from anybody and
 *     raises no error anywhere.
 */

/** ReviewStep links to the terms page, so Ziggy's helper has to exist. */
global.route = (name) => `/${name}`;

const CONSENTS = {
    terms: true,
    creatorEmail: true,
    ownDetails: true,
    marketing: false,
};

describe('canSubmitRegistration', () => {
    it('lets a supporter submit with the marketing box unticked', () => {
        // 🚨 THE ONE THAT MATTERS. Marketing consent may never be a condition of
        // creating an account.
        expect(
            canSubmitRegistration({
                consents: { ...CONSENTS, marketing: false },
                role: ROLE_SUPPORTER,
            })
        ).toBe(true);
    });

    it('lets a creator submit with the marketing box unticked', () => {
        expect(
            canSubmitRegistration({
                consents: { ...CONSENTS, marketing: false },
                role: ROLE_CREATOR,
            })
        ).toBe(true);
    });

    it('does not change its answer when the marketing box is ticked', () => {
        // If these two ever differ, the box is gating submission.
        const off = canSubmitRegistration({
            consents: { ...CONSENTS, marketing: false },
            role: ROLE_CREATOR,
        });
        const on = canSubmitRegistration({
            consents: { ...CONSENTS, marketing: true },
            role: ROLE_CREATOR,
        });

        expect(off).toBe(on);
    });

    it('still requires the two consents that ARE required', () => {
        expect(
            canSubmitRegistration({
                consents: { ...CONSENTS, terms: false },
                role: ROLE_SUPPORTER,
            })
        ).toBe(false);

        // A creator's required second consent is the receipts notice; a
        // supporter's is the own-details one. Each must be checked against its
        // own role, or one of the two roles is being gated on a box it never saw.
        expect(
            canSubmitRegistration({
                consents: { ...CONSENTS, creatorEmail: false },
                role: ROLE_CREATOR,
            })
        ).toBe(false);

        expect(
            canSubmitRegistration({
                consents: { ...CONSENTS, ownDetails: false },
                role: ROLE_SUPPORTER,
            })
        ).toBe(false);
    });

    it('holds submission until an active captcha is solved', () => {
        expect(
            canSubmitRegistration({
                consents: CONSENTS,
                role: ROLE_SUPPORTER,
                captchaRequired: true,
                captchaVerified: false,
            })
        ).toBe(false);

        expect(
            canSubmitRegistration({
                consents: CONSENTS,
                role: ROLE_SUPPORTER,
                captchaRequired: true,
                captchaVerified: true,
            })
        ).toBe(true);
    });
});

describe('ReviewStep marketing checkbox', () => {
    const render = (props) =>
        renderToStaticMarkup(
            <ReviewStep
                role={ROLE_SUPPORTER}
                data={{}}
                consents={{ ...CONSENTS, marketing: false }}
                setConsent={() => {}}
                turnstileSiteKey={null}
                bindTurnstile={() => {}}
                processing={false}
                canSubmit
                onSubmit={() => {}}
                plan={null}
                marketingConsentLabel="Send me offers and promotions"
                {...props}
            />
        );

    it('renders the marketing box, unticked', () => {
        const html = render();

        expect(html).toContain('marketing_opt_in');
        // Plain ASCII on purpose — renderToStaticMarkup escapes an apostrophe
        // to &#x27;, so a fixture containing one asserts against the escaping
        // rather than against the label being rendered.
        expect(html).toContain('Send me offers and promotions');

        // renderToStaticMarkup emits `checked` only when the input is checked,
        // so its absence on this input is the assertion.
        const input = html.slice(html.indexOf('id="marketing_opt_in"'));
        expect(input.slice(0, input.indexOf('/>'))).not.toContain('checked');
    });

    it('keeps it separate from the required consents', () => {
        // Bundling marketing consent into the terms checkbox is the specific
        // thing §1 of the brief rules out, so they must be distinct controls.
        const html = render();

        expect(html).toContain('id="termaccept"');
        expect(html).toContain('id="marketing_opt_in"');
        expect(html).toContain('Optional.');
    });

    it('says it is optional wherever it is shown', () => {
        expect(render()).toContain('Optional.');
    });
});
