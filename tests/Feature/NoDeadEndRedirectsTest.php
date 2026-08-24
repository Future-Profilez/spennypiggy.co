<?php

namespace Tests\Feature;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * 🚨 `redirect()->back()` READS THE REFERER, AND HALF THIS APP'S LINKS CARRY
 * NONE.
 *
 * A supporter arriving from a bio card, a shared link, an e-mail or a return
 * from Stripe-hosted checkout sends no same-site Referer, so `back()` dropped
 * them on the HOMEPAGE — and until 22 Aug 2026 no layout rendered a flash, so
 * the explanation was written and thrown away. From their side: they tapped a
 * real link and nothing happened. That is exactly how the bio page's "Unlock
 * does nothing" was reported from production.
 *
 * A sweep of every GET route found seven handlers doing this. These are the
 * ones a supporter reaches.
 */
class NoDeadEndRedirectsTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create([
            'role' => 1,
            'username' => 'creator'.Str::random(6),
            'suspended_account' => 0,
        ]);
    }

    private function buyer(): User
    {
        return User::factory()->create(['role' => 0, 'suspended_account' => 0]);
    }

    /**
     * 🚨 THE WORST ONE: the buyer is returning from Stripe, having just paid.
     * There is no same-site Referer from a hosted checkout, so this sent
     * somebody who had spent money to the homepage with an invisible message —
     * the dead end most likely to end at their bank.
     */
    public function test_an_unknown_payment_reference_lands_on_the_buyers_purchases(): void
    {
        $this->get('/shop/success-payment/'.Str::uuid())
            ->assertRedirect(route('gifter.hub'));
    }

    /**
     * ⚠️ This link arrives in an e-mail, so there is no Referer at all. A buyer
     * following "download your file" landed on the homepage.
     */
    public function test_a_task_download_with_no_file_lands_somewhere_real(): void
    {
        /*
         * ⚠️ The task must EXIST and carry no file. A missing uuid is a 404
         * long before the branch this covers — the first version of this test
         * asserted against that 404 and proved nothing.
         */
        $task = Task::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $this->creator()->id,
            'title' => 'A reel',
            'price' => 20,
            'deliverable_content' => null,
        ]);

        $this->actingAs($this->buyer())
            ->get('/task/'.$task->uuid.'/download')
            ->assertRedirect(route('gifter.hub'));
    }

    /**
     * ⚠️ Back to the CREATOR, not to the homepage — the supporter came to buy
     * from this person, and one unavailable item says nothing about the rest.
     */
    public function test_a_suspended_bill_sends_the_supporter_to_its_creator(): void
    {
        $creator = $this->creator();

        $bill = Bills::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'name' => 'Monthly set',
            'price' => 10,
            'currency' => 'GBP',
            'approved' => 1,
            'status' => 1,
            'is_suspended' => 1,
        ]);

        $this->actingAs($this->buyer())
            ->get('/bill/checkout/'.$bill->uuid)
            ->assertRedirect(route('user.show', ['username' => $creator->username]));
    }

    public function test_a_suspended_membership_sends_the_supporter_to_its_creator(): void
    {
        $creator = $this->creator();

        /*
         * ⚠️ `forceFill`, not `create()`. `name` is NOT NULL in the migration,
         * nullable on the live table, and NOT in `Membership::$fillable` — so
         * `create()` silently drops it and the insert fails on a database built
         * from migrations. Three different views of one column.
         */
        $membership = (new Membership)->forceFill([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'name' => 'Gold tier',
            'level' => 'Gold',
            'rewards' => json_encode(['monthly_content_bundle']),
            'approved' => 1,
            'is_suspended' => 1,
        ]);
        $membership->save();

        $this->actingAs($this->buyer())
            ->get('/membership/checkout/'.$membership->uuid)
            ->assertRedirect(route('user.show', ['username' => $creator->username]));
    }

    /**
     * 🚨 NONE OF THESE MAY GO BACK TO USING `back()`. The sweep that found them
     * is not repeatable by hand every time somebody edits a checkout.
     */
    public function test_the_supporter_facing_get_handlers_no_longer_use_back(): void
    {
        $files = [
            'app/Http/Controllers/Auth/ShopsController.php' => 'successPayment',
            'app/Http/Controllers/TaskController.php' => 'download',
            'app/Http/Controllers/Auth/BillsController.php' => 'buyBill',
            'app/Http/Controllers/Auth/MembershipController.php' => 'buyLevel',
        ];

        foreach ($files as $file => $method) {
            $source = (string) file_get_contents(base_path($file));
            $start = strpos($source, "function {$method}(");

            $this->assertNotFalse($start, "{$file} no longer has {$method}().");

            /*
             * ⚠️ SLICE TO THE END OF THE METHOD, not a fixed number of
             * characters. A 6,000-character window ran past `successPayment`
             * into later methods and reported their `back()` calls as this
             * one's — a test that fails for the wrong reason is worse than no
             * test. `\n    }` is this codebase's method terminator at class
             * indent.
             */
            $end = strpos($source, "\n    }", $start);
            $body = $end === false
                ? substr($source, $start)
                : substr($source, $start, $end - $start);

            /*
             * 🚨 BLANK THE COMMENTS FIRST. Each of these methods now carries a
             * note explaining why `redirect()->back()` was wrong here — and the
             * note contains the very string being searched for, so the scan
             * matched the explanation and reported the bug it documents as
             * still live. The same trap the A3 banned-word scan and the refund
             * audit test both hit.
             */
            $body = preg_replace('~/\\*.*?\\*/~s', '', $body);
            $body = preg_replace('~//[^\n]*~', '', $body);

            /*
             * ⚠️ ONLY THE GET PATH. `buyBill`/`buyLevel` answer BOTH verbs from
             * one method: everything above `isMethod('POST')` runs when the
             * supporter ARRIVES (no Referer, so `back()` is the homepage), and
             * everything below runs when they submit the checkout form on our
             * own page — where `back()` is exactly right, because it returns
             * them to the form with what they typed still in it. Scanning the
             * whole method would demand a "fix" that makes the form worse.
             */
            if (($post = strpos($body, "isMethod('POST')")) !== false) {
                $body = substr($body, 0, $post);
            }

            $this->assertStringNotContainsString(
                'redirect()->back()',
                $body,
                "{$method}() is reachable by GET from a link, an e-mail or a Stripe return — "
                .'`back()` there sends the supporter to the homepage.'
            );
        }
    }
}
