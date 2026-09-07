<?php

/*
|--------------------------------------------------------------------------
| Blocked review submissions — the reminder ladder
|--------------------------------------------------------------------------
|
| A creator who pressed "Submit for review" while something was still missing
| is in NO admin queue (App\Support\ReviewSubmission explains why). They have
| done the hard part and are one field away, so they are worth chasing — and
| for exactly that reason they are also worth chasing QUIETLY.
|
| 🚨 THE CADENCE SLOWS DOWN AND NEVER STOPS. Three reminders a fortnight apart
| while it is still fresh, three more monthly, then once a year. Somebody who
| ignored the sixth reminder will ignore the seventh, and a platform that keeps
| asking teaches them to filter the receipt and the payout notice too — but the
| account is still one field from selling, so going silent for ever throws the
| creator away rather than the reminder.
|
| The step is decided by how many reminders have already been SENT (counted in
| `notification_logs`, which is durable — a cache flush must not hand somebody a
| fresh allowance).
|
*/

return [
    /*
    | Master switch. Off = the command reports what it would do and sends
    | nothing; no row is claimed, so switching it on later cannot swallow the
    | first run.
    */
    'enabled' => (bool) env('REVIEW_NUDGE_ENABLED', true),

    /*
    | How long to wait before the NEXT reminder, given how many have already
    | gone. Read as: "after this many sends, wait this many days."
    |
    | ⚠️ Ordered ascending by `after_sends` and evaluated first-match, so the
    | last entry is the one that runs for ever. A ladder whose final step is not
    | the largest silently reverts to a tighter cadence at the far end.
    */
    'ladder' => [
        ['after_sends' => 3, 'wait_days' => 14],   // sends 1-3, a fortnight apart
        ['after_sends' => 6, 'wait_days' => 30],   // sends 4-6, monthly
        ['after_sends' => null, 'wait_days' => 365], // once a year, indefinitely
    ],

    /*
    | Per-run dispatch cap. The audience is a review queue's worth of creators
    | (22 when this was written), so this is a guard against a first run against
    | a large backlog rather than a routine limit.
    */
    'max_per_run' => (int) env('REVIEW_NUDGE_MAX_PER_RUN', 100),

    /*
    | Seconds between consecutive queue pushes. The fan-out is small, but a
    | burst of identical mail to a sending domain is what earns a reputation
    | problem, and the mail that matters (receipts, payout notices) rides the
    | same domain.
    */
    'dispatch_stagger_seconds' => (int) env('REVIEW_NUDGE_STAGGER', 2),
];
