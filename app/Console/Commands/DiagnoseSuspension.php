<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\SuspendedAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

/**
 * "Is the suspension feature actually working, and if not, which half?"
 *
 * 🚨 THIS EXISTS BECAUSE EVERY FAULT IN THIS FEATURE WAS SILENT. Not one of
 * them threw, logged, or failed a build:
 *
 *   · four login paths refused a suspended account, so the banner sat behind a
 *     door nobody could open;
 *   · the banner read `auth.suspension` while the server sent
 *     `auth.user.suspension`, so it rendered NOTHING, for anybody, ever;
 *   · the profile route served the withdrawn page to the OWNER, so the one
 *     person who needed their dashboard could not reach it;
 *   · the billing reason told a creator to renew while the middleware refused
 *     `mandatory.checkout`;
 *   · the columns were missing on an environment, so the sweep crashed every
 *     five minutes into a log nobody reads.
 *
 * Each was found by a person reporting it days later. **A feature made of six
 * gates that must agree needs one command that asks all six.** Run this after
 * any deploy that touches suspension, and on any environment where "it does not
 * seem to work".
 *
 * ⚠️ READ-ONLY. It never writes, never calls Stripe, and never changes an
 * account — it must be safe to run on production while something is wrong.
 */
class DiagnoseSuspension extends Command
{
    protected $signature = 'suspension:doctor {--user= : Also report one account by username or id}';

    protected $description = 'Check every moving part of account suspension and report what is broken';

    /** @var list<array{0:string,1:bool,2:string}> */
    private array $results = [];

    public function handle(): int
    {
        $this->info('Suspension doctor — '.config('app.env').' @ '.config('app.url'));
        $this->newLine();

        $this->checkColumns();
        $this->checkConfig();
        $this->checkAllowlist();
        $this->checkLoginPaths();
        $this->checkBannerContract();
        $this->checkSchedule();

        $this->renderResults();
        $this->reportState();

        if ($this->option('user')) {
            $this->reportUser((string) $this->option('user'));
        }

        $failed = collect($this->results)->reject(fn ($r) => $r[1])->count();

        if ($failed > 0) {
            $this->newLine();
            $this->error("{$failed} check(s) failed — the feature is not fully working on this environment.");

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('All checks passed.');

        return self::SUCCESS;
    }

    private function pass(string $name, string $detail = ''): void
    {
        $this->results[] = [$name, true, $detail];
    }

    private function fail(string $name, string $detail): void
    {
        $this->results[] = [$name, false, $detail];
    }

    /**
     * 🚨 The columns are the reason the sweep can crash on one environment and
     * work on another — the migration is guarded, so nothing shouts when it has
     * not been run here.
     */
    private function checkColumns(): void
    {
        $missing = collect([
            'suspended_account', 'suspension_reason_code', 'suspension_note',
            'suspended_at', 'suspended_by_admin_id', 'suspension_enforced_at',
            'payout_paused_at', 'payout_pause_reason',
        ])->reject(fn ($c) => Schema::hasColumn('users', $c));

        $missing->isEmpty()
            ? $this->pass('Database columns')
            : $this->fail('Database columns', 'missing: '.$missing->implode(', ').' — run php artisan migrate');
    }

    /**
     * Every reason must be renderable AND, if it names a fix, that fix must be
     * something the account can actually reach.
     */
    private function checkConfig(): void
    {
        $reasons = (array) config('suspension.reasons', []);

        if (empty($reasons)) {
            $this->fail('Reason catalogue', 'config/suspension.php has no reasons — every account gets the default copy');

            return;
        }

        $problems = [];

        foreach ($reasons as $code => $copy) {
            foreach (['title', 'body'] as $key) {
                if (empty($copy[$key])) {
                    $problems[] = "{$code}: no {$key}";
                }
            }

            if (! in_array($copy['tone'] ?? null, ['limited', 'suspended'], true)) {
                // Not fatal — it falls back to "suspended" — but it means the
                // account holder is told they were judged when nobody judged them.
                $problems[] = "{$code}: tone is not limited|suspended, so it reads as a suspension";
            }

            $problems = array_merge(
                $problems,
                $this->actionProblems((string) $code, $copy),
                $this->requiredRouteProblems((string) $code, $copy),
            );
        }

        empty($problems)
            ? $this->pass('Reason catalogue', count($reasons).' reasons')
            : $this->fail('Reason catalogue', implode(' · ', $problems));
    }

    /**
     * 🚨 THE CHECK THAT WOULD HAVE CAUGHT THE BILLING TRAP. A reason naming a
     * fix is a promise; if the route does not resolve, or a suspended account
     * cannot reach it, the platform is asking for something it then refuses.
     *
     * @return list<string>
     */
    private function actionProblems(string $code, array $copy): array
    {
        $action = $copy['action'] ?? null;

        if (! is_array($action)) {
            return [];
        }

        $name = $action['route'] ?? null;

        if (! $name || ! Route::has($name)) {
            return ["{$code}: action route '".($name ?: '(none)')."' does not exist"];
        }

        $route = Route::getRoutes()->getByName($name);
        $methods = array_diff($route->methods(), ['HEAD']);
        $isRead = $methods === ['GET'] || $methods === [];

        if ($isRead) {
            return [];
        }

        // A state-changing action must be on the allowlist or the middleware
        // refuses the very thing the message asks the creator to do.
        return in_array($name, (array) config('suspension.allowed_write_routes', []), true)
            ? []
            : ["{$code}: action route '{$name}' is a write and is NOT on allowed_write_routes — the button will be refused"];
    }

    /**
     * 🚨 THE CHECK THE `action` TEST CANNOT MAKE.
     *
     * A reason's `action` points at a PAGE, and the page being a GET proves
     * nothing about the POST behind its button — `activate-subscription` is
     * readable by anyone while `mandatory.checkout` is the route that actually
     * takes the money. A reason therefore DECLARES the write routes its fix
     * needs, and they must all be on the allowlist.
     *
     * @return list<string>
     */
    private function requiredRouteProblems(string $code, array $copy): array
    {
        $allowed = (array) config('suspension.allowed_write_routes', []);
        $problems = [];

        foreach ((array) ($copy['requires'] ?? []) as $name) {
            if (! Route::has($name)) {
                $problems[] = "{$code}: requires '{$name}', which is not a route";

                continue;
            }

            if (! in_array($name, $allowed, true)) {
                $problems[] = "{$code}: requires '{$name}' but it is NOT on allowed_write_routes — the fix it offers will be refused";
            }
        }

        return $problems;
    }

    /** A name that does not resolve can never match, so the allowlist entry is dead. */
    private function checkAllowlist(): void
    {
        $names = (array) config('suspension.allowed_write_routes', []);
        $dead = array_values(array_filter($names, fn ($n) => ! Route::has($n)));

        empty($dead)
            ? $this->pass('Write allowlist', count($names).' routes')
            : $this->fail('Write allowlist', 'these names resolve to no route: '.implode(', ', $dead));
    }

    /**
     * 🚨 THE FAULT THAT KILLED THE WHOLE FEATURE ONCE. Four separate auth paths
     * refused a suspended account, so nothing behind the login mattered. A
     * source scan, because reaching all four in a test needs Google, WebAuthn
     * and a 2FA secret — and what has to be pinned is that the refusals stay
     * gone.
     */
    private function checkLoginPaths(): void
    {
        /*
         * ⚠️ SCOPED TO THE SIGN-IN METHODS, NEVER THE WHOLE FILE. The first
         * version scanned each file whole and reported
         * `AuthenticatedSessionController` as broken — it was reading
         * `getUserProfile`'s `suspended_account == 1 && ! $isOwner` branch, which
         * is the CORRECT withdrawn-profile check. A doctor that cries wolf on a
         * legitimate line is one nobody runs twice.
         */
        $methods = [
            'app/Http/Controllers/Auth/AuthenticatedSessionController.php' => ['store', 'verify2FA'],
            'app/Http/Controllers/Auth/GoogleController.php' => ['signIn'],
            'app/Http/Controllers/WebAuthn/WebAuthnLoginController.php' => ['login'],
        ];

        $offenders = [];

        foreach ($methods as $path => $names) {
            $source = @file_get_contents(base_path($path));

            if ($source === false) {
                $offenders[] = basename($path).' (unreadable)';

                continue;
            }

            foreach ($names as $name) {
                $body = self::methodBody($source, $name);

                if ($body === null) {
                    $offenders[] = basename($path)."::{$name}() not found";

                    continue;
                }

                if (str_contains($body, 'suspended_account')) {
                    $offenders[] = basename($path)."::{$name}()";
                }
            }
        }

        empty($offenders)
            ? $this->pass('Login paths open')
            : $this->fail('Login paths open', 'a suspended-account branch is back in: '.implode(', ', $offenders));
    }

    /**
     * The body of one method, comments stripped, by brace matching.
     *
     * ⚠️ Comments are removed FIRST — the notes left where each guard was
     * removed name `suspended_account` in order to explain why it must not come
     * back, so a raw scan finds the very string it is checking has gone.
     */
    private static function methodBody(string $source, string $method): ?string
    {
        $code = preg_replace('#/\*.*?\*/|//[^\n]*#s', '', $source);

        if (! preg_match('/function\s+'.preg_quote($method, '/').'\s*\(/', (string) $code, $m, PREG_OFFSET_CAPTURE)) {
            return null;
        }

        $open = strpos((string) $code, '{', $m[0][1]);

        if ($open === false) {
            return null;
        }

        $depth = 0;
        $length = strlen((string) $code);

        for ($i = $open; $i < $length; $i++) {
            $char = $code[$i];

            if ($char === '{') {
                $depth++;
            } elseif ($char === '}') {
                $depth--;

                if ($depth === 0) {
                    return substr((string) $code, $open, $i - $open + 1);
                }
            }
        }

        return null;
    }

    /**
     * The server key and the component read are in different languages, so
     * nothing but a check like this can see that they agree.
     */
    private function checkBannerContract(): void
    {
        $middleware = (string) @file_get_contents(base_path('app/Http/Middleware/HandleInertiaRequests.php'));
        $component = (string) @file_get_contents(base_path('resources/js/Components/SuspendedBanner.jsx'));

        $sends = str_contains($middleware, "'suspension' => SuspendedAccount::payload(");
        $reads = str_contains($component, 'auth?.user?.suspension');

        $sends && $reads
            ? $this->pass('Banner contract')
            : $this->fail(
                'Banner contract',
                (! $sends ? 'the shared payload no longer sends `suspension`. ' : '').
                (! $reads ? 'the banner does not read `auth.user.suspension` — it will render nothing.' : '')
            );
    }

    private function checkSchedule(): void
    {
        $kernel = (string) @file_get_contents(base_path('app/Console/Kernel.php'));

        str_contains($kernel, 'suspension:enforce')
            ? $this->pass('Sweep scheduled', 'needs schedule:work + queue:work running')
            : $this->fail('Sweep scheduled', 'suspension:enforce is not in the scheduler — consequences will never be applied');
    }

    private function renderResults(): void
    {
        $this->table(
            ['Check', 'Result', 'Detail'],
            collect($this->results)->map(fn ($r) => [$r[0], $r[1] ? 'PASS' : 'FAIL', $r[2]])->all()
        );
    }

    /** What is actually true of the accounts on this environment right now. */
    private function reportState(): void
    {
        if (! Schema::hasColumn('users', 'suspension_enforced_at')) {
            return;
        }

        $suspended = User::where('suspended_account', 1)->count();
        $pending = User::where('suspended_account', 1)->whereNull('suspension_enforced_at')->count();
        $stale = User::where('suspended_account', 0)->whereNotNull('suspension_enforced_at')->count();
        $noReason = User::where('suspended_account', 1)->whereNull('suspension_reason_code')->count();

        $this->newLine();
        $this->line('Accounts');
        $this->line("  suspended                 {$suspended}");
        $this->line("  awaiting enforcement      {$pending}".($pending ? '  (the sweep has not reached them)' : ''));
        $this->line("  awaiting lift             {$stale}".($stale ? '  (unsuspended, consequences not yet undone)' : ''));

        // 🚨 Not a fault, but the single most likely reason a creator reads the
        // wrong sentence: no code means the default, which says "suspended".
        $this->line("  no reason recorded        {$noReason}".($noReason ? '  (these read the default "suspended" copy)' : ''));
    }

    private function reportUser(string $needle): void
    {
        $user = User::where('username', $needle)->orWhere('id', (int) $needle)->first();

        $this->newLine();

        if (! $user) {
            $this->warn("No user matched '{$needle}'.");

            return;
        }

        $this->line("Account @{$user->username} (#{$user->id})");
        $this->line('  suspended                 '.((int) $user->suspended_account === 1 ? 'yes' : 'no'));

        if ((int) $user->suspended_account !== 1) {
            return;
        }

        $copy = SuspendedAccount::copyFor($user);

        $this->line('  reason code               '.($copy['code'] ?: '(none — default copy)'));
        $this->line('  tone                      '.$copy['tone']);
        $this->line('  they read                 "'.$copy['title'].'"');
        $this->line('  way out                   '.($copy['action'] ? $copy['action']['label'].' → '.$copy['action']['url'] : 'support only'));
        $this->line('  consequences applied      '.($user->suspension_enforced_at ? $user->suspension_enforced_at->toDateTimeString() : 'NOT YET'));
        $this->line('  payouts frozen            '.($user->payout_paused_at ? 'yes ('.$user->payout_pause_reason.')' : 'no'));
    }
}
