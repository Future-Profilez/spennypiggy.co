<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Article bodies are Markdown, rendered to HTML on the server.
 *
 * 🚨 `html_input => strip` and `allow_unsafe_links => false` are LOAD-BEARING
 * SECURITY, not tidiness. This HTML is injected with dangerouslySetInnerHTML on
 * a public page, and once the admin CMS ships the body becomes admin-authored
 * text. Stripping raw HTML means a compromised admin account cannot turn a help
 * article into stored XSS served to every visitor. Do not relax either option to
 * "let an article embed a video" — add a fenced directive and render it in JSX.
 *
 * Markdown rather than stored HTML also means the future CMS editor can be a
 * plain textarea, and the source stays diffable in git.
 */
class HelpMarkdown
{
    /** Headings this deep get an anchor and a table-of-contents entry. */
    private const TOC_LEVELS = [2, 3];

    /**
     * Render an article body.
     *
     * ⚠️ Tokens are resolved BEFORE Markdown, so a token that expands to text
     * containing Markdown characters is parsed rather than printed raw.
     *
     * @return array{html:string, toc:array<int, array{id:string,text:string,level:int}>}
     */
    public static function render(?string $body): array
    {
        $source = HelpTokens::render($body);

        if (trim($source) === '') {
            return ['html' => '', 'toc' => []];
        }

        $html = Str::markdown($source, [
            'html_input' => 'strip',
            'allow_unsafe_links' => false,
        ]);

        return self::anchorHeadings($html);
    }

    /**
     * Give every h2/h3 a stable id and collect them into a contents list.
     *
     * A long answer with no way to jump to the part you need is one a reader
     * abandons halfway and replaces with a support ticket.
     */
    private static function anchorHeadings(string $html): array
    {
        $toc = [];
        $seen = [];

        $pattern = '/<h([23])>(.*?)<\/h\1>/is';

        $html = preg_replace_callback($pattern, function (array $m) use (&$toc, &$seen) {
            $level = (int) $m[1];

            if (! in_array($level, self::TOC_LEVELS, true)) {
                return $m[0];
            }

            $text = trim(html_entity_decode(strip_tags($m[2]), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            $id = Str::slug($text) ?: 'section';

            // Two headings with the same words must not share an anchor, or one
            // of the contents links silently jumps to the wrong place.
            $seen[$id] = ($seen[$id] ?? 0) + 1;
            if ($seen[$id] > 1) {
                $id .= '-'.$seen[$id];
            }

            $toc[] = ['id' => $id, 'text' => $text, 'level' => $level];

            return '<h'.$level.' id="'.e($id).'">'.$m[2].'</h'.$level.'>';
        }, $html) ?? $html;

        return ['html' => $html, 'toc' => $toc];
    }

    /**
     * Plain text, for a meta description or a search snippet. Never let Markdown
     * syntax reach a search result or a social card.
     */
    public static function plain(?string $body, int $limit = 200): string
    {
        $text = trim(preg_replace('/\s+/', ' ', strip_tags(self::render($body)['html'])) ?? '');

        return $limit > 0 ? Str::limit($text, $limit) : $text;
    }
}
