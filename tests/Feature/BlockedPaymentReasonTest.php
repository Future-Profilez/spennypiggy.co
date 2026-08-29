<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\BlockedPaymentAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * A blocked purchase must say WHY it was blocked.
 *
 * All 2 rows this table had ever held carried `reason = NULL` and
 * `currency = NULL`, because not one of the eight checkout gates passed
 * either — so the admin feed rendered its own fallback ("a risk check") for a
 * refusal that was really "this creator has no platform subscription", and the
 * amount showed as a bare number with no currency. A creator read the line as
 * an accusation that he had bought something.
 */
class BlockedPaymentReasonTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_the_reason_and_currency_are_persisted(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        BlockedPaymentAlert::record($creator, 25, 'usd', 'no_subscription');

        $row = DB::table('blocked_payment_attempts')->where('creator_id', $creator->id)->first();

        $this->assertNotNull($row);
        $this->assertSame('no_subscription', $row->reason);
        $this->assertSame('USD', $row->currency);
        $this->assertEquals(25.00, (float) $row->amount);
    }

    /**
     * ⚠️ The column is varchar(60). A status code longer than that must be cut,
     * not rejected — losing the whole row would lose the lost sale as well.
     */
    public function test_an_over_long_reason_is_truncated_rather_than_dropped(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        BlockedPaymentAlert::record($creator, 10, 'GBP', str_repeat('x', 200));

        $row = DB::table('blocked_payment_attempts')->where('creator_id', $creator->id)->first();

        $this->assertNotNull($row);
        $this->assertSame(60, strlen($row->reason));
    }

    /**
     * 🚨 THE POINT OF THIS FILE.
     *
     * A new checkout gate is a copy-paste of an existing one, and the two-argument
     * form is what was copied eight times. Nothing errors when the reason is
     * omitted — the row is written, the creator is told, and only the admin feed
     * quietly invents a cause. So the guard has to be structural: every
     * `BlockedPaymentAlert::record(` in `app/` must pass four arguments.
     */
    public function test_no_call_site_omits_the_reason(): void
    {
        $bare = [];

        foreach ($this->phpFilesIn(app_path()) as $file) {
            $source = file_get_contents($file);

            foreach ($this->recordCalls($source) as [$line, $args]) {
                if (substr_count($args, ',') < 3) {
                    $bare[] = str_replace(base_path().'/', '', $file).':'.$line;
                }
            }
        }

        $this->assertSame(
            [],
            $bare,
            "BlockedPaymentAlert::record() must be given an amount, a currency AND a reason.\n".
            "These call sites pass fewer:\n  ".implode("\n  ", $bare)
        );
    }

    /** @return iterable<string> */
    private function phpFilesIn(string $dir): iterable
    {
        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir));

        foreach ($it as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                yield $file->getPathname();
            }
        }
    }

    /**
     * Every `record(...)` call in a file, with its line number and raw argument
     * text. Brace/paren counting rather than a regex, so a call broken over
     * several lines — which is what the fixed call sites now are — is read whole.
     *
     * @return list<array{0:int,1:string}>
     */
    private function recordCalls(string $source): array
    {
        $needle = 'BlockedPaymentAlert::record(';
        $calls = [];
        $offset = 0;

        while (($pos = strpos($source, $needle, $offset)) !== false) {
            $offset = $pos + strlen($needle);

            // The declaration in the class itself is not a call.
            if (str_contains(substr($source, max(0, $pos - 40), 40), 'function ')) {
                continue;
            }

            $depth = 1;
            $i = $offset;
            $len = strlen($source);

            while ($i < $len && $depth > 0) {
                $depth += match ($source[$i]) {
                    '(' => 1,
                    ')' => -1,
                    default => 0,
                };
                $i++;
            }

            $calls[] = [
                substr_count($source, "\n", 0, $pos) + 1,
                substr($source, $offset, $i - $offset - 1),
            ];
        }

        return $calls;
    }
}
