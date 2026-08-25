<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Rank-movement notifications
    |--------------------------------------------------------------------------
    |
    | 🚨 SHIPS OFF. Same rule as every other fan-out in this app: the first real
    | send is a deliberate act by a human, not a side effect of a deploy. A
    | flag-off run reports what it WOULD have sent and claims nothing, so
    | switching it on later does not silently swallow the first week.
    |
    | The command only ever announces an UPWARD move. A creator who slipped two
    | places has not done anything wrong, and a push telling them so is a
    | telling-off from the platform they sell on — the same reasoning that keeps
    | the board's own "down" chip grey rather than red.
    |
    */

    'movement_notifications' => (bool) env('LEADERBOARD_MOVEMENT_NOTIFICATIONS', false),

    /*
    | How many places a creator must have climbed before it is worth a push.
    | One place is noise; the board re-ranks daily and most creators move one
    | most days.
    */
    'movement_min_places' => (int) env('LEADERBOARD_MOVEMENT_MIN_PLACES', 3),

    /*
    | Which board the notification talks about. Weekly is the one with a close
    | time a creator can still act on — an all-time move is not news this week.
    */
    'movement_period' => env('LEADERBOARD_MOVEMENT_PERIOD', 'weekly'),

    /*
    | A ceiling on one run, so a first run against a full history cannot fan out
    | to the whole platform in one go. Null means no cap.
    */
    'movement_max_per_run' => env('LEADERBOARD_MOVEMENT_MAX_PER_RUN', 500),

];
