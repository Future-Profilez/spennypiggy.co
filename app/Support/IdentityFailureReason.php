<?php

namespace App\Support;

/**
 * Turns a Stripe Identity failure code into copy a creator can act on.
 *
 * Stripe answers with codes like `selfie_face_mismatch` or `document_expired`.
 * Printed raw they read as a system error the creator can do nothing about, so
 * every failure path resolves them here and stores the RESOLVED payload on
 * `users.identity_verification_error`. Email and the profile page then render
 * the same words from the same row — there is no second copy of this map in
 * React, and no way for the two surfaces to disagree about why an ID was
 * rejected.
 */
class IdentityFailureReason
{
    /**
     * code => [title, what_happened, what_to_do[]]
     *
     * Wording rule: name what went wrong in the creator's terms, then give the
     * next action. Never blame the creator for something Stripe could not read.
     */
    public const REASONS = [
        'consent_declined' => [
            'title' => 'You didn’t accept Stripe’s consent step',
            'what_happened' => 'Stripe needs your permission before it can check your ID. The check was stopped at that screen.',
            'what_to_do' => [
                'Start the check again',
                'Accept the consent screen when Stripe asks',
            ],
        ],
        'device_unsupported' => [
            'title' => 'Your device couldn’t complete the check',
            'what_happened' => 'The camera on the device you used isn’t supported by Stripe’s ID check.',
            'what_to_do' => [
                'Try again on a recent phone',
                'Use the phone’s own browser rather than an in-app browser',
            ],
        ],
        'device_not_supported' => [
            'title' => 'Your device couldn’t complete the check',
            'what_happened' => 'The camera on the device you used isn’t supported by Stripe’s ID check.',
            'what_to_do' => [
                'Try again on a recent phone',
                'Use the phone’s own browser rather than an in-app browser',
            ],
        ],
        'abandoned' => [
            'title' => 'The check was left unfinished',
            'what_happened' => 'The ID check was closed before Stripe had everything it needed.',
            'what_to_do' => [
                'Have your passport with you before you start',
                'Run the check in one go — it takes about 3 minutes',
            ],
        ],
        'document_expired' => [
            'title' => 'Your passport has expired',
            'what_happened' => 'The expiry date on the passport you uploaded has already passed.',
            'what_to_do' => [
                'Use a passport that is still in date',
            ],
        ],
        'document_unverified_other' => [
            'title' => 'Your passport couldn’t be read',
            'what_happened' => 'Stripe couldn’t confirm the document from the photos it received.',
            'what_to_do' => [
                'Photograph the full page — no cropped edges',
                'Use bright, even light and avoid glare from the plastic',
                'Keep the passport flat and the phone steady',
            ],
        ],
        'document_type_not_supported' => [
            'title' => 'That document type isn’t accepted',
            'what_happened' => 'We accept passports only. The document you uploaded was something else.',
            'what_to_do' => [
                'Upload the photo page of your passport',
            ],
        ],
        'under_supported_type' => [
            'title' => 'That document type isn’t accepted',
            'what_happened' => 'We accept passports only. The document you uploaded was something else.',
            'what_to_do' => [
                'Upload the photo page of your passport',
            ],
        ],
        // Our own passport-only policy check, applied after Stripe verifies.
        'document_type_not_allowed' => [
            'title' => 'We only accept passports',
            'what_happened' => 'Your document passed Stripe’s check, but it wasn’t a passport — that’s the only ID we can accept.',
            'what_to_do' => [
                'Run the check again with your passport',
            ],
        ],
        'selfie_document_missing_photo' => [
            'title' => 'No photo found on your document',
            'what_happened' => 'Stripe couldn’t find a usable photo on the document to match your selfie against.',
            'what_to_do' => [
                'Upload the passport page that carries your photo',
                'Make sure the whole page is in frame',
            ],
        ],
        'selfie_face_mismatch' => [
            'title' => 'Your selfie didn’t match your passport photo',
            'what_happened' => 'Stripe couldn’t match the selfie to the photo on the document.',
            'what_to_do' => [
                'Take the selfie in good light, facing the camera',
                'Remove hats, sunglasses and face coverings',
                'Check you uploaded your own passport',
            ],
        ],
        'selfie_manipulated' => [
            'title' => 'The selfie couldn’t be trusted',
            'what_happened' => 'Stripe flagged the selfie as edited or not taken live.',
            'what_to_do' => [
                'Take a fresh selfie inside the Stripe check',
                'Don’t upload a saved or filtered photo',
            ],
        ],
        'selfie_unverified_other' => [
            'title' => 'Your selfie couldn’t be checked',
            'what_happened' => 'Stripe couldn’t complete the selfie check from the images it received.',
            'what_to_do' => [
                'Try again in good light, facing the camera',
                'Hold still until the capture finishes',
            ],
        ],
        'id_number_mismatch' => [
            'title' => 'The details didn’t match',
            'what_happened' => 'The information you entered didn’t match the document you uploaded.',
            'what_to_do' => [
                'Enter your name and date of birth exactly as printed on your passport',
            ],
        ],
        'id_number_insufficient_document_data' => [
            'title' => 'The details didn’t match',
            'what_happened' => 'The information you entered didn’t match the document you uploaded.',
            'what_to_do' => [
                'Enter your name and date of birth exactly as printed on your passport',
            ],
        ],
        'id_number_unverified_other' => [
            'title' => 'The details couldn’t be checked',
            'what_happened' => 'Stripe couldn’t confirm the details you entered.',
            'what_to_do' => [
                'Check every field against your passport and try again',
            ],
        ],
        // Written by us, not Stripe.
        'requires_input' => [
            'title' => 'Your ID check needs another go',
            'what_happened' => 'Stripe couldn’t finish the check with what it received.',
            'what_to_do' => [
                'Start the check again with your passport to hand',
                'Use a recent phone in good light',
            ],
        ],
        'session_canceled' => [
            'title' => 'Your ID check was cancelled',
            'what_happened' => 'The check was cancelled before it finished, so nothing was verified.',
            'what_to_do' => [
                'Start a new check when you’re ready',
            ],
        ],
        'admin_rejected' => [
            'title' => 'Our team couldn’t approve your ID',
            'what_happened' => 'A member of our team reviewed your check and couldn’t approve it.',
            'what_to_do' => [
                'Read the note below and fix what it asks for',
                'Then run the check again',
            ],
        ],
        'fraud_suspected' => [
            'title' => 'Your ID check didn’t pass our security review',
            'what_happened' => 'The check didn’t pass the security review we run on every verification.',
            'what_to_do' => [
                'Contact support — this one can’t be fixed by trying again',
            ],
        ],
    ];

    private const FALLBACK = [
        'title' => 'Your ID check didn’t go through',
        'what_happened' => 'Stripe couldn’t complete the check this time.',
        'what_to_do' => [
            'Start the check again with your passport to hand',
            'Contact support if it fails a second time',
        ],
    ];

    /**
     * Build the payload stored on `users.identity_verification_error`.
     *
     * The friendly copy is resolved at WRITE time and stored alongside the raw
     * code, so an old failure keeps the wording the creator was originally
     * shown, and the React page needs no copy of this map.
     *
     * @param  string|null  $rawReason  Stripe's own sentence, kept for support/debugging.
     * @param  string|null  $note  Extra context shown to the creator (e.g. an admin's rejection note).
     */
    public static function payload(string $code, ?string $rawReason = null, ?string $note = null): string
    {
        $copy = self::REASONS[$code] ?? self::FALLBACK;

        return json_encode([
            'code' => $code,
            'title' => $copy['title'],
            'what_happened' => $copy['what_happened'],
            'what_to_do' => $copy['what_to_do'],
            'note' => $note,
            // Stripe's own wording. Never the headline — it is written for
            // developers — but support needs it when a creator asks why.
            'reason' => $rawReason,
            'failed_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * Read a stored payload back, filling in the copy for rows written before
     * this map existed (they hold only `code` + `reason`).
     */
    public static function explain(?string $json): ?array
    {
        if (! $json) {
            return null;
        }

        $data = json_decode($json, true);

        if (! is_array($data)) {
            return null;
        }

        $code = $data['code'] ?? 'requires_input';
        $copy = self::REASONS[$code] ?? self::FALLBACK;

        return [
            'code' => $code,
            'title' => $data['title'] ?? $copy['title'],
            'what_happened' => $data['what_happened'] ?? $copy['what_happened'],
            'what_to_do' => $data['what_to_do'] ?? $copy['what_to_do'],
            'note' => $data['note'] ?? null,
            'reason' => $data['reason'] ?? null,
            'failed_at' => $data['failed_at'] ?? null,
        ];
    }
}
