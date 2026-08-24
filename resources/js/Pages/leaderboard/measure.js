/**
 * How far along the board a creator is, as one definition.
 *
 * 🚨 THE MEASURE IS WHAT MAKES THIS A LEADERBOARD AND NOT A LIST. Ranks alone
 * give the ORDER and say nothing about the DISTANCE — #4 and #47 rendered
 * identically, so nothing on screen showed that one was within reach of the
 * podium and the other was not.
 *
 * ⚠️ Reach, never revenue. It measures SUPPORTERS, the figure the row already
 * prints, so it publishes no new fact — the board sets `'amount' => 0` and this
 * must not be the thing that walks around it.
 */

/**
 * The smallest leader figure worth drawing a scale against.
 *
 * ⚠️ Not `> 0`. With a leader on one supporter every bar is either full or
 * empty, which carries no information and renders the list as a column of blank
 * tracks that read like a loading skeleton — verified on the dev board, where
 * the whole top ten sits at 0 or 1.
 */
export const MEASURE_FLOOR = 4;

/**
 * A non-zero value never renders as nothing: a 1-in-4000 bar is invisible, and
 * "invisible" and "zero" must not look the same.
 */
export const MIN_VISIBLE_WIDTH = 3;

/**
 * @param  {number} supporters        this creator's supporters
 * @param  {number} leaderSupporters  the supporters of whoever is #1 on this board
 * @return {{show: boolean, width: number}}
 */
export function measureFor(supporters, leaderSupporters) {
    const mine = Number(supporters) || 0;
    const leader = Number(leaderSupporters) || 0;

    if (leader < MEASURE_FLOOR) {
        return { show: false, width: 0 };
    }

    if (mine <= 0) {
        return { show: true, width: 0 };
    }

    const share = Math.min(100, (mine / leader) * 100);

    return { show: true, width: Math.max(share, MIN_VISIBLE_WIDTH) };
}
