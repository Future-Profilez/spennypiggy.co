<?php

/**
 * Unified reward contract (24 July 2026).
 *
 * Every sellable item answers the same question — "what does the supporter get
 * for this money?" — with the same four fields, and this file is the single
 * definition of what a valid answer looks like. The matching client-side copy
 * lives in resources/js/constants/rewards.js; keep the two in step.
 *
 * Stripe compliance: the reward headline is bound to every transactional
 * surface (checkout, receipt, thank-you page), so it must read as creator
 * content — App\Rules\NoExpenseOrBrandName is applied to it everywhere.
 */
return [

    'default_title' => 'Exclusive reward',

    'title_max' => 60,

    'description_max' => 300,

    'message_max' => 2000,

    /**
     * What the supporter receives immediately:
     *
     *   file    — an uploaded deliverable (image/video/audio/document/archive)
     *   message — written content delivered on the thank-you page
     *   link    — an off-platform destination the creator controls
     *
     * Recurring items (bills, memberships) use the same three for their
     * welcome reward and add an ongoing perks list plus members-only post
     * access on top — there is no separate "bundle" type.
     */
    'types' => ['file', 'message', 'link'],

    /**
     * Accepted upload MIME types. Previously copy-pasted as a hardcoded string
     * into each add-item form, which is why the modules disagreed about what a
     * creator could upload — Tasks accepted rar but not office documents,
     * Bills had no upload field at all.
     */
    'accept' => [
        'image/*',
        'video/*',
        'audio/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'application/rtf',
        'application/epub+zip',
        'application/zip',
        'application/x-zip-compressed',
        'application/x-rar-compressed',
        'application/vnd.rar',
    ],

    /** 2 GB — Uploadcare's per-file ceiling on the current plan. */
    'max_file_bytes' => 2 * 1024 * 1024 * 1024,

    /**
     * How a stored file is rendered. Resolved from the MIME type first, then
     * the file extension — a bare Uploadcare UUID carries neither, so the
     * renderer falls back to 'file' and shows a download tile.
     */
    'kind_extensions' => [
        'image' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'heic', 'bmp', 'svg'],
        'video' => ['mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv'],
        'audio' => ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
        'pdf' => ['pdf'],
        'document' => ['doc', 'docx', 'rtf', 'txt', 'odt', 'xls', 'xlsx', 'ppt', 'pptx', 'epub'],
        'archive' => ['zip', 'rar', '7z', 'tar', 'gz'],
    ],

    'link' => [
        /** Plain http would hand the deliverable over an unencrypted hop. */
        'require_https' => true,

        /**
         * Shorteners hide the real destination, so neither moderation nor the
         * supporter can see what they are about to open. The creator can paste
         * the destination directly instead.
         */
        'blocked_hosts' => [
            'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
            'rebrand.ly', 'cutt.ly', 'shorturl.at', 'rb.gy', 'lnkd.in', 's.id',
            'tiny.cc', 'bl.ink', 'short.io', 'trib.al', 'db.tt', 'qr.ae',
        ],
    ],

    /**
     * Ongoing perks for recurring items (bills + memberships). Previously this
     * list existed only inside AddMembership.jsx, so Bills — which sells the
     * same recurring content subscription — had no perks concept at all.
     */
    'perks' => [
        'monthly_content_bundle' => 'Monthly content bundle',
        'weekly_content_bundle' => 'Weekly content bundle',
        'monthly_DM_chat' => 'Monthly DM chat',
        'weekly_DM_chat' => 'Weekly DM chat',
        'monthly_video_call' => 'Monthly video call',
        'weekly_video_call' => 'Weekly video call',
        'green_circle_insta' => 'Green circle on Instagram',
        'insta_broadcast' => 'Instagram broadcast channel',
        'telegram_group' => 'Telegram group',
        'x_community' => 'X community',
    ],

    /**
     * Stripe compliance: a recurring content subscription must deliver content
     * on this platform, so at least one of these must be selected. Mirrors
     * MembershipController::ON_PLATFORM_CONTENT_REWARDS.
     */
    'on_platform_perks' => [
        'monthly_content_bundle',
        'weekly_content_bundle',
    ],
];
