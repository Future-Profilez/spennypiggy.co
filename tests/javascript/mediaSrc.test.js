import { mediaSrc } from "@/Components/PostMediaCarousel";

const UUID = "11111111-2222-3333-4444-555555555555";
const OPS = "-/overlay/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/34p/4p,92p/45p/";
const BASE = `https://ucarecdn.com/${UUID}/`;
const IMAGE_OPS = "-/preview/1200x1200/-/format/jpeg/-/quality/smart/";

describe("mediaSrc", () => {
    it("is byte-identical to the pre-watermark output when no ops are passed", () => {
        expect(mediaSrc({ uuid: UUID })).toBe(BASE + IMAGE_OPS);
    });

    it("appends the overlay last so it draws on top", () => {
        expect(mediaSrc({ uuid: UUID }, { watermarkOps: OPS })).toBe(
            BASE + IMAGE_OPS + OPS,
        );
    });

    // `-/overlay/` is an image operation. On a video the CDN ignores it, which
    // reads as a broken feature rather than an unsupported file.
    it("never watermarks a video", () => {
        expect(mediaSrc({ uuid: UUID, isVideo: true }, { watermarkOps: OPS })).toBe(
            BASE,
        );
        expect(
            mediaSrc({ uuid: UUID, mimeType: "video/mp4" }, { watermarkOps: OPS }),
        ).not.toContain("overlay");
    });

    it("never watermarks a reference that already carries operations", () => {
        const already = `${UUID}/-/text/80px8p/8p,100p/hi/`;
        expect(mediaSrc({ uuid: already }, { watermarkOps: OPS })).toBe(
            `https://ucarecdn.com/${already}/`,
        );
    });

    it("leaves a full external url alone", () => {
        const url = "https://example.com/a.jpg";
        expect(mediaSrc({ url }, { watermarkOps: OPS })).toBe(url);
    });

    // A malformed value must cost the watermark, never the image.
    it("rejects a malformed ops string instead of emitting a broken path", () => {
        for (const bad of [
            "-/overlay/not-a-uuid/34p/4p,92p/45p/",
            "-/overlay/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/34p/4p,92p/45p",
            "-/resize/9000x/",
            "",
            null,
            undefined,
        ]) {
            expect(mediaSrc({ uuid: UUID }, { watermarkOps: bad })).toBe(
                BASE + IMAGE_OPS,
            );
        }
    });

    it("skips the watermark when transformation is off", () => {
        expect(mediaSrc({ uuid: UUID }, { transform: false, watermarkOps: OPS })).toBe(
            BASE,
        );
    });

    it("returns an empty string for nothing", () => {
        expect(mediaSrc(null, { watermarkOps: OPS })).toBe("");
        expect(mediaSrc({}, { watermarkOps: OPS })).toBe("");
    });
});
