<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Ramsey\Uuid\Uuid;
use Tests\TestCase;

/**
 * `GET /user/{uuid}` marked an address verified with no proof the person had read
 * the mail — and `uuid` is a public identifier. Anyone who learned one could verify
 * that account's email, including an address they had registered but do not own.
 */
class EmailVerificationLinkTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'uuid' => Uuid::uuid4()->toString(),
            'name' => 'Unverified',
            'email' => 'unverified@example.com',
            'username' => 'unverified_1',
            'password' => Hash::make('OriginalPassw0rd!'),
            'role' => 1,
        ]);
    }

    public function test_an_unsigned_link_does_not_verify(): void
    {
        $user = $this->makeUser();

        $this->get('/user/'.$user->uuid)->assertRedirect(route('login'));

        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_a_signed_link_verifies(): void
    {
        $user = $this->makeUser();

        $url = URL::temporarySignedRoute('email.verify.uuid', now()->addDays(7), ['uuid' => $user->uuid]);

        $this->get($url)->assertRedirect();

        $this->assertNotNull($user->fresh()->email_verified_at);
    }

    public function test_an_expired_signature_does_not_verify(): void
    {
        $user = $this->makeUser();

        $url = URL::temporarySignedRoute('email.verify.uuid', now()->addMinute(), ['uuid' => $user->uuid]);

        $this->travel(2)->minutes();

        $this->get($url)->assertRedirect(route('login'));

        $this->assertNull($user->fresh()->email_verified_at);
    }

    /**
     * 🚨 THE LINK SIGNS THEM IN (7 Sep 2026). It is opened on whatever device the
     * mailbox is on — usually not the one they registered from — and this endpoint
     * is unauthenticated, so it used to drop the person, logged out, on their own
     * PUBLIC profile: a blank page with no dashboard and no sign-in prompt. Measured
     * live, 155 of 272 verified creators then uploaded nothing.
     */
    public function test_a_signed_link_signs_the_person_in_and_lands_on_their_dashboard(): void
    {
        $user = User::factory()->create(['email_verified_at' => null]);
        $url = URL::temporarySignedRoute('email.verify.uuid', now()->addDay(), ['uuid' => $user->uuid]);

        $response = $this->get($url);

        $response->assertRedirect(route('user.show', [$user->username]).'?verified=1');
        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->email_verified_at);
    }
}
