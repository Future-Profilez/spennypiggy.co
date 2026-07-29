<?php

namespace App\Support;

/**
 * Curated cover banners a creator can pick instead of uploading their own.
 *
 * All of them are Uploadcare files, exactly like a creator's own upload — so
 * `users.cover` keeps its single meaning (an Uploadcare uuid) and every URL,
 * transformation and admin screen that already worked keeps working.
 *
 * What this class adds is the part the old hardcoded uuid arrays could not: a
 * name and a category per cover, in ONE place. The list used to be copied into
 * ProfileController, RegisteredUserController and EditProfile.jsx, unlabelled,
 * and the picker rendered fifteen anonymous thumbnails.
 */
class PresetCovers
{
    /**
     * uuid => [label, category]. Designed in-house and uploaded to Uploadcare
     * as SVG.
     *
     * ⚠️ Uploadcare does NOT apply CDN operations to an SVG — `-/preview/`,
     * `-/scale_crop/` and `-/format/jpeg/` are silently ignored and the original
     * file comes back. That is fine here (vector, 4:1 already, ~2 KB against a
     * 44 KB transformed JPEG for the legacy raster covers, and nothing renders a
     * cover into an email or an og:image where SVG would fail) — but it means a
     * size or crop asked for in a URL is a request, not a guarantee. Anything
     * that MUST be raster has to be uploaded as raster.
     */
    public const COVERS = [
        '56c67c16-29da-47ec-a381-fa6423233f64' => ['Halftone Rise', 'bold'],
        'c068f904-2e4c-4947-b2b2-995d29f47d0d' => ['Grid Horizon', 'gaming'],
        'fe0c7a34-3d71-400e-ab3c-c219c131cea4' => ['Deep Drift', 'calm'],
        'f48e258b-b621-495e-bf50-2e48ba2cb900' => ['Contour Map', 'calm'],
        '8701e881-5b9e-4e3f-906a-9ddac3c048fb' => ['Paper Layers', 'soft'],
        'ffedf196-f084-4600-a765-957beee12786' => ['Sunbeam', 'soft'],
    ];

    public const CATEGORIES = [
        'bold' => 'Bold',
        'gaming' => 'Gaming',
        'calm' => 'Calm',
        'soft' => 'Soft',
    ];

    /**
     * The covers curated before the named set existed. Creators are using them
     * and signup still assigns one at random, so they stay selectable — they
     * just have no name of their own to show.
     */
    public const LEGACY_UPLOADED = [
        '0139dcd1-f9c5-47ac-b6f9-3baac6f48d06',
        '21de57a2-c786-4a5a-b7e4-2edcdb61fc42',
        '6aac4e1d-9af8-4ad2-9aee-a0d9d383dac2',
        'fcdb1692-d64d-4de8-b7af-5e0556cdf6e8',
        '40aaf556-fa59-4f8e-b482-e49726026499',
        'a2cad976-2480-4c77-baa3-cb5df3cdc0d6',
        'b81b3097-5c4c-4f48-aaf0-3687bc928a18',
        '32c130a9-37e6-4934-8d72-a83a5d8bdaa6',
        'e71ed424-f17a-47d9-b0e7-3e5eca4e51cb',
        'dc1021e2-41a4-4dfa-8379-b27fb7e3834e',
        '175e706f-ae6a-4920-a131-bf90502084f8',
        'c8011ca9-9b00-4f8f-b919-3cf837e3037c',
        '1ebf10dd-1891-4288-b461-5e3fcd3b43d3',
        'c3b7ff7a-719a-452a-ba8f-d074d916b395',
        '133b057f-f069-4ea4-82e4-ba9184d721cd',
    ];

    /**
     * A fan gets one fixed cover rather than a random designed banner: their
     * profile is not a shopfront. Kept here so the uuid has one home — it was
     * the last literal still sitting in a controller.
     */
    public const FAN_DEFAULT = 'dc1021e2-41a4-4dfa-8379-b27fb7e3834e';

    /**
     * Thumbnail used in the picker grid. 4:1 to match the shape the cover is
     * actually displayed in — a 2:1 thumbnail crops away half of what the
     * creator is choosing.
     */
    public const PREVIEW = '-/preview/-/scale_crop/800x200/-/format/jpeg/';

    /**
     * Was this cover curated by us? Such a cover is approved on selection and
     * skips the moderation scan — it has already been reviewed, and a false
     * positive would pull the same banner off every profile using it.
     */
    public static function isPreApproved(?string $cover): bool
    {
        return $cover !== null
            && (array_key_exists($cover, self::COVERS)
                || in_array($cover, self::LEGACY_UPLOADED, true));
    }

    /** Covers offered at signup when a creator has not picked one yet. */
    public static function signupPool(): array
    {
        return array_keys(self::COVERS);
    }

    /** The picker payload: named covers first, then the unnamed legacy ones. */
    public static function forPicker(): array
    {
        $named = [];

        foreach (self::COVERS as $uuid => [$label, $category]) {
            $named[] = [
                'value' => $uuid,
                'label' => $label,
                'category' => $category,
                'url' => self::previewUrl($uuid),
            ];
        }

        $legacy = [];
        foreach (self::LEGACY_UPLOADED as $i => $uuid) {
            $legacy[] = [
                'value' => $uuid,
                // Numbered, not fifteen buttons all reading "Photo": a screen
                // reader has to be able to tell them apart.
                'label' => 'Photo '.($i + 1),
                'category' => 'photo',
                'url' => self::previewUrl($uuid),
            ];
        }

        return [
            'covers' => array_merge($named, $legacy),
            'categories' => array_merge(self::CATEGORIES, ['photo' => 'Photos']),
        ];
    }

    private static function previewUrl(string $uuid): string
    {
        return 'https://ucarecdn.com/'.$uuid.'/'.self::PREVIEW;
    }
}
