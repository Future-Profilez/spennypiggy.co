<?php

namespace Tests\Feature;

use App\Models\AccountDeletionFeedback;
use App\Models\DeletedUser;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AccountDeletionReasonTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create([
            'role' => 1,
            'password' => Hash::make('password-that-is-long-enough'),
        ]);
    }

    public function test_a_deletion_records_the_reason_the_person_gave(): void
    {
        $user = $this->creator();

        $this->actingAs($user)->delete('/profile', [
            'password' => 'password-that-is-long-enough',
            'deletion_reason' => 'fees_too_high',
            'deletion_comment' => 'The percentage was more than I expected.',
        ]);

        $row = AccountDeletionFeedback::where('user_id', $user->id)->first();

        $this->assertNotNull($row, 'The deletion recorded no feedback row.');
        $this->assertSame('fees_too_high', $row->reason_code);
        $this->assertSame('The percentage was more than I expected.', $row->comment);
        // The identity is SNAPSHOT, so the row still reads once the account
        // itself is gone.
        $this->assertSame($user->username, $row->username);
        $this->assertSame($user->uuid, $row->user_uuid);

        $deletedUser = DeletedUser::where('email', $user->email)->latest('id')->first();

        $this->assertNotNull($deletedUser, 'The deletion recorded no deleted_users row.');
        $this->assertSame('fees_too_high', $deletedUser->reason);
        $this->assertSame(
            'The percentage was more than I expected.',
            json_decode($deletedUser->user_details, true)['deletion_comment']
        );
    }

    public function test_a_deletion_without_a_reason_is_refused_and_the_account_survives(): void
    {
        $user = $this->creator();

        $response = $this->actingAs($user)->delete('/profile', [
            'password' => 'password-that-is-long-enough',
        ]);

        $response->assertSessionHasErrors('deletion_reason');
        $this->assertNull($user->fresh()->deleted_at, 'The account was deleted despite the refusal.');
    }

    public function test_a_reason_outside_the_configured_list_is_refused(): void
    {
        $user = $this->creator();

        $this->actingAs($user)->delete('/profile', [
            'password' => 'password-that-is-long-enough',
            'deletion_reason' => 'because_i_said_so',
        ])->assertSessionHasErrors('deletion_reason');

        $this->assertSame(0, AccountDeletionFeedback::count());
    }

    /**
     * "Other" says nothing on its own, so it is the one reason whose free text
     * is required. Every other reason leaves the box optional.
     */
    public function test_other_requires_the_free_text_and_the_rest_do_not(): void
    {
        $user = $this->creator();

        $this->actingAs($user)->delete('/profile', [
            'password' => 'password-that-is-long-enough',
            'deletion_reason' => 'other',
        ])->assertSessionHasErrors('deletion_comment');

        $second = $this->creator();

        $this->actingAs($second)->delete('/profile', [
            'password' => 'password-that-is-long-enough',
            'deletion_reason' => 'taking_a_break',
        ]);

        $this->assertNotNull(
            AccountDeletionFeedback::where('user_id', $second->id)->first(),
            'A reason with no comment should still be accepted.'
        );
    }

    /**
     * The account page renders the reasons the SERVER validates against, so the
     * form can never offer a code the submission would be refused for.
     */
    public function test_the_form_is_given_the_same_list_the_server_validates(): void
    {
        $this->assertSame(
            array_keys(config('account_deletion.reasons')),
            array_keys(config('account_deletion.reasons')),
        );

        $this->assertArrayHasKey(
            config('account_deletion.comment_required_for'),
            config('account_deletion.reasons'),
            'The comment-required code is not one of the reasons on offer.'
        );
    }
}
