<?php

namespace Tests\Unit;

use App\Models\UserIntro;
use Tests\TestCase;

/**
 * 🚨 A CONVERTED POSTER MUST SURVIVE THE REQUEST THAT CONVERTED IT.
 *
 * `getPosterUrlAttribute` polls Uploadcare while `poster_token` is set, and on
 * success stores the poster and CLEARS the token on purpose — its own comment
 * says this "prevents future network calls for this video". The state that
 * leaves behind (poster set, token null) then fell through to a bare
 * `$url = false`, so every intro whose thumbnail had finished converting showed
 * no poster from the next read onwards. Nothing errored; the thumbnail simply
 * stopped existing.
 */
class UserIntroPosterTest extends TestCase
{
    public function test_a_stored_poster_with_no_token_still_renders(): void
    {
        $intro = new UserIntro([
            'uuid' => 'e0b1a1e6-0000-4000-8000-000000000001',
            'poster' => 'aa11bb22-0000-4000-8000-000000000002',
        ]);
        $intro->poster_token = null;

        $this->assertSame(
            'https://ucarecdn.com/aa11bb22-0000-4000-8000-000000000002/nth/0/',
            $intro->poster_url
        );
    }

    /*
     * ⚠️ THE OTHER TWO STATES ARE NOT COVERED HERE ON PURPOSE — BOTH CALL OUT.
     * An empty poster reaches `Uploadcare::generateThumb()` and a live token
     * polls the conversion status API, so asserting on either would put a real
     * network request in the suite: the same fault that made this suite
     * non-deterministic through Stripe and HaveIBeenPwned. Cover them with a
     * faked client, not with a live call.
     */
}
