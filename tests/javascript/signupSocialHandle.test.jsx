import { renderToStaticMarkup } from 'react-dom/server';
import {
    ROLE_CREATOR,
    canSubmitRegistration,
    SOCIAL_PLATFORMS,
    creatorProfileStepAction,
    creatorProfileStepComplete,
} from '@/Pages/Auth/register/constants';
import CreatorProfileStep from '@/Pages/Auth/register/CreatorProfileStep';

/**
 * The creator's social handle at signup.
 *
 * The PHP suite proves the server stores and refuses handles correctly. It cannot
 * prove the two things that live entirely in the browser: that the step's own button
 * gates on the handle (or the server refuses a form that looked complete), and that
 * the gate stays OUT of `canSubmitRegistration`, which is the CONSENT check — a
 * product requirement bundled into it is how an optional consent quietly becomes
 * conditional.
 */

const stepProps = (overrides = {}) => ({
    categories: ['music'],
    onToggleCategory: () => {},
    onClearCategories: () => {},
    prideBadges: [],
    onTogglePride: () => {},
    onClearPride: () => {},
    referral: '',
    referralLocked: false,
    onReferralChange: () => {},
    onReferralCheck: () => {},
    referralMessage: '',
    referralType: '',
    socialPlatform: 'instagram',
    socialHandle: '',
    onSocialPlatformChange: () => {},
    onSocialHandleChange: () => {},
    socialError: undefined,
    onSubmit: () => {},
    ...overrides,
});

describe('signup social handle', () => {
    /** 🚨 REQUIRED — badges alone are not enough to leave the step. */
    it('gates the step until a handle is given', () => {
        expect(
            creatorProfileStepComplete({
                categories: ['music'],
                socialHandle: '',
            }),
        ).toBe(false);

        expect(
            creatorProfileStepComplete({
                categories: ['music'],
                socialHandle: 'janedoe',
            }),
        ).toBe(true);
    });

    /** ⚠️ Whitespace is not a handle. */
    it('does not accept whitespace as a handle', () => {
        expect(
            creatorProfileStepComplete({
                categories: ['music'],
                socialHandle: '   ',
            }),
        ).toBe(false);
    });

    /**
     * ⚠️ A disabled button must say what is missing — and in the order the screen
     * asks for it, or it tells the creator to fix the second thing first.
     */
    it('names the missing thing on the button', () => {
        expect(
            creatorProfileStepAction({ categories: [], socialHandle: '' }),
        ).toBe('Pick at least one badge');

        expect(
            creatorProfileStepAction({
                categories: ['music'],
                socialHandle: '',
            }),
        ).toBe('Add a social account');

        expect(
            creatorProfileStepAction({
                categories: ['music'],
                socialHandle: 'janedoe',
            }),
        ).toBe('Continue');
    });

    /**
     * 🚨 THE ONE THAT MATTERS. The handle gates the STEP; it must never reach the
     * CONSENT gate. Adding it there is a three-word change that passes every backend
     * test and turns an optional consent into a conditional one.
     */
    it('is not part of the consent gate', () => {
        const consents = { terms: true, creatorEmail: true, marketing: false };

        expect(
            canSubmitRegistration({ consents, role: ROLE_CREATOR }),
        ).toBe(true);
    });

    it('offers exactly the three accepted platforms', () => {
        expect(SOCIAL_PLATFORMS.map((p) => p.key).sort()).toEqual(
            ['instagram', 'tiktok', 'twitter'],
        );
    });

    /**
     * ⚠️ X's DATABASE COLUMN IS STILL `twitter`. Renaming the key to match the brand
     * writes the handle nowhere and raises nothing.
     */
    it('sends the database column, not the brand name', () => {
        const x = SOCIAL_PLATFORMS.find((p) => p.label === 'X');

        expect(x.key).toBe('twitter');
    });

    it('renders the field', () => {
        const html = renderToStaticMarkup(
            <CreatorProfileStep {...stepProps()} />,
        );

        expect(html).toContain('Add a social account');
    });

    /**
     * 🚨 THE COPY MUST NOT PROMISE PRIVACY. The handle goes for review and then onto
     * the creator's profile like any other — an earlier draft said it was never shown
     * there, which was true of the contact-only design this replaced.
     */
    it('does not claim the handle stays off the profile', () => {
        const html = renderToStaticMarkup(
            <CreatorProfileStep {...stepProps()} />,
        );

        expect(html).not.toMatch(/not shown on your profile/i);
        expect(html).toMatch(/shows on your profile/i);
    });

    /**
     * ⚠️ A server refusal has to be visible on the screen that owns the field, or the
     * person is left with a toast and nothing to correct.
     */
    it('shows a server error against the field', () => {
        const html = renderToStaticMarkup(
            <CreatorProfileStep
                {...stepProps({ socialError: 'That does not look right.' })}
            />,
        );

        expect(html).toContain('That does not look right.');
    });

    /**
     * ⚠️ Rendered end to end: a badge picked and no handle must leave the button
     * asking for the handle, not offering to continue.
     */
    it('asks for the handle before it offers to continue', () => {
        const blank = renderToStaticMarkup(
            <CreatorProfileStep {...stepProps({ socialHandle: '' })} />,
        );
        const filled = renderToStaticMarkup(
            <CreatorProfileStep {...stepProps({ socialHandle: 'janedoe' })} />,
        );

        expect(blank).toContain('Add a social account');
        expect(blank).not.toContain('Continue');
        expect(filled).toContain('Continue');
    });
});
