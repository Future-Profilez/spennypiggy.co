<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * One row per human decision on an ID check.
 *
 * The website READS these (to show a creator what they were last asked for);
 * the admin app WRITES them. Mirrored there — shared database, separate code.
 */
class IdentityReview extends Model
{
    use HasFactory;

    public const DECISION_APPROVED = 'approved';

    public const DECISION_REJECTED = 'rejected';

    /**
     * 🚨 THE TWO REFUSALS NEED DIFFERENT INSTRUCTIONS, WHICH IS THE WHOLE POINT.
     *
     * `document_problem` — the picture was unreadable, expired, the wrong kind.
     * Running the check again genuinely fixes it.
     *
     * `identity_mismatch` — the document is fine and the person is not the one
     * on the profile. **Running the check again fixes NOTHING**: Stripe verifies
     * the document, so the same passport passes again, and the creator is sent
     * round a loop they cannot exit. That one has to ask for the profile photo
     * or the social accounts to be put right instead.
     */
    public const REASON_DOCUMENT = 'document_problem';

    public const REASON_MISMATCH = 'identity_mismatch';

    protected $fillable = [
        'user_id',
        'username',
        'decision',
        'reason_type',
        'notes',
        'admin_id',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'admin_id' => 'integer',
    ];

    public function isRejection(): bool
    {
        return $this->decision === self::DECISION_REJECTED;
    }

    /**
     * What the creator should be told to do about this refusal.
     *
     * ⚠️ An unknown or missing type falls back to the document wording — it is
     * the harmless one. Telling somebody to re-send a document they can re-send
     * costs them two minutes; telling somebody their ID is not their own when
     * it is accuses them of something.
     */
    public function instruction(): string
    {
        return $this->reason_type === self::REASON_MISMATCH
            ? 'Your ID did not match your profile photo or your social accounts. Update your profile photo, or add the social account that shows you, then run the check again.'
            : 'There was a problem with the document itself. Run the check again with a clear, in-date passport.';
    }
}
