import { measureFor, MEASURE_FLOOR, MIN_VISIBLE_WIDTH } from '@/Pages/leaderboard/measure';

describe('leaderboard measure', () => {
    it('draws nothing while the leader is below the floor', () => {
        // A leader on one supporter makes every bar full or empty — no
        // information, and a column of blank tracks reads as a loading state.
        expect(measureFor(1, 1)).toEqual({ show: false, width: 0 });
        expect(measureFor(0, MEASURE_FLOOR - 1)).toEqual({ show: false, width: 0 });
    });

    it('draws the scale once the leader clears the floor', () => {
        expect(measureFor(MEASURE_FLOOR, MEASURE_FLOOR)).toEqual({ show: true, width: 100 });
    });

    it('measures against the leader, not against the board size', () => {
        expect(measureFor(25, 100).width).toBe(25);
        expect(measureFor(50, 200).width).toBe(25);
    });

    it('never renders a real supporter as nothing', () => {
        // 1 in 4000 is 0.025% — invisible, and "invisible" must not look the
        // same as "zero".
        expect(measureFor(1, 4000).width).toBe(MIN_VISIBLE_WIDTH);
    });

    it('keeps zero at zero, and still shows the track', () => {
        // The track is the scale. A row with no supporters keeps its place on it
        // rather than losing 8px of height and making the list jagged.
        expect(measureFor(0, 100)).toEqual({ show: true, width: 0 });
    });

    it('cannot overflow its track', () => {
        // Defensive: the leader is row 0 by definition, but the board is sorted
        // on `combined_score`, not on supporters — so a later row CAN legally
        // carry more supporters than row 0 today.
        expect(measureFor(500, 100).width).toBe(100);
    });

    it('treats missing and non-numeric figures as zero rather than NaN', () => {
        expect(measureFor(undefined, 100)).toEqual({ show: true, width: 0 });
        expect(measureFor(null, 100)).toEqual({ show: true, width: 0 });
        expect(measureFor(10, undefined)).toEqual({ show: false, width: 0 });
    });
});
