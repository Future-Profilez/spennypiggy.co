import fs from "fs";
import path from "path";

/*
 * ⚠️ RewardEditor pulls in the Uploadcare web-component bundle, which ships as
 * untransformed ESM and cannot be required under Jest. The three helpers under
 * test are pure functions in the same file, so the uploader is stubbed rather
 * than the helpers being moved out of the module their callers import them from.
 */
jest.mock("@/uploadcare/Uploader", () => ({
    __esModule: true,
    default: () => null,
}));

import {
    emptyReward,
    rewardToPayload,
    validateReward,
} from "@/Components/Reward/RewardEditor";

/**
 * Sentry JAVASCRIPT-REACT-CG (16 Sep 2026):
 *   TypeError: null is not an object (evaluating 'e.type')
 *   RewardEditor.jsx rewardToPayload ← AddItem.jsx getSubmitData ← Publish tap
 *
 * `resetFormFields()` set the reward state to `null` after a successful publish,
 * so the SECOND listing a creator added in one session crashed the whole form on
 * the Publish button — on the last step, with everything typed.
 */
describe("the reward a reset form starts from", () => {
    const source = fs.readFileSync(
        path.resolve(__dirname, "../../resources/js/Pages/shop/AddItem.jsx"),
        "utf8",
    );

    test("the shop form resets to an empty reward, never to null", () => {
        expect(source).not.toMatch(/setReward\(null\)/);
        expect(source).toMatch(/setReward\(emptyReward\(\)\)/);
    });

    test("emptyReward carries the shape every consumer reads", () => {
        const value = emptyReward();

        expect(value.type).toBe("file");
        expect(value.title).toBe("");
        expect(value.file).toBeNull();
        expect(Array.isArray(value.perks)).toBe(true);
    });
});

/**
 * ⚠️ The floor under the fix, not a substitute for it: six forms share these two
 * helpers, and the same slip in any of them should cost a field error rather than
 * the page.
 */
describe("the shared reward helpers survive a missing value", () => {
    test("rewardToPayload does not throw on a missing reward", () => {
        expect(() => rewardToPayload(null, { file: "reward_file" })).not.toThrow();

        const payload = rewardToPayload(null, { file: "reward_file" });

        expect(payload.reward_title).toBe("");
        expect(payload.reward_type).toBe("file");
        expect(payload.reward_file).toBe("");
    });

    test("validateReward refuses a missing reward instead of throwing", () => {
        let message;

        expect(() => {
            message = validateReward(null);
        }).not.toThrow();

        expect(typeof message).toBe("string");
        expect(message.length).toBeGreaterThan(0);
    });

    /** CONTROL: a real reward still produces its real payload. */
    test("a filled file reward is unaffected", () => {
        const payload = rewardToPayload(
            emptyReward({
                title: "Poster pack",
                type: "file",
                file: { uuid: "abc", mime: "image/png", name: "p.png", size: 12 },
            }),
            {
                file: "reward_file",
                mime: "reward_file_type",
                name: "reward_file_name",
                size: "reward_file_size",
            },
        );

        expect(payload.reward_title).toBe("Poster pack");
        expect(payload.reward_file).toBe("abc");
        expect(payload.reward_file_type).toBe("image/png");
        expect(payload.reward_file_size).toBe(12);
    });

    /** CONTROL: a genuinely invalid reward still reports its own reason. */
    test("a file reward with no file still fails validation for that reason", () => {
        const message = validateReward(emptyReward({ title: "Poster pack", type: "file" }));

        expect(message).toMatch(/upload the file/i);
    });
});
