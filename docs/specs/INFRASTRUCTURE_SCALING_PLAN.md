# Infrastructure Scaling Plan

Developer Master Plan, 19 Aug 2026, §E. Written 21 Aug 2026 against the live
`vapor.yml` of both apps and the code as it stands — every number below was read
from the configuration or the source, not estimated.

---

## What is actually deployed

Both apps run on **Laravel Vapor** — AWS Lambda behind API Gateway, not servers.
That single fact drives everything else here: there is no long-running process,
no local disk that survives a request, and a hard ceiling on how long anything
in a web request may take.

| | spennypiggy.co (production) | admin.spennypiggy.co |
|---|---|---|
| Runtime | `php-8.2:al2` | `php-8.2:al2` |
| Web memory | **1024 MB** | 1024 MB |
| **Web timeout** | **60s** | 60s |
| Queue memory | 512 MB | 512 MB |
| CLI timeout | 600s | 600s |
| CLI concurrency | 10 | 10 |
| Warm instances | **1** | 1 |
| Database | `spennypiggy-db` **+ RDS proxy** | same database |
| Cache | `spenny-piggy-redis-caches` | **the same Redis** |
| Scheduler | on | on |
| Health checks | **off** | on (`/vapor-health`) |

**One database and one Redis, shared by both apps.** This is load-bearing, not
incidental: the admin app's new Discovery controls clear cache keys that
spennypiggy.co wrote, and that only works because the Redis instance is the same
one. Splitting them later is not a config change — it breaks those controls.

---

## 🚨 The constraint that has already bitten

**A web request has 60 seconds. Everything user-facing must fit inside it.**

This is not theoretical. Two examples from this codebase:

1. The HaveIBeenPwned password check ships with a **30-second** default timeout.
   Left alone it outlives the Lambda and turns a fail-open into a **504 on
   registration**. It is rebound to 3s for exactly this reason.
2. **Creator push, found 21 Aug 2026 while writing this document.** The fan-out
   is capped at 5,000 supporters and the first version called the dispatcher —
   which makes a *synchronous HTTP call per recipient* — in a loop inside the
   request. A creator with a few hundred supporters would have timed out
   mid-send, with the row already written as `sent`. It is queued now, and a test
   pins it.

**The rule this gives us:** anything that loops over users, calls a third party
per item, or touches more than a few hundred rows belongs in a **queued job**,
never in a request. The dispatcher already says so in its own docblock; the
lesson is that the docblock is not enough on its own.

---

## Where the current caps sit

These are the fan-out bounds already in the code. They are the numbers to raise
first when volume grows, and each is deliberately conservative.

| Cap | Value | Where |
|---|---|---|
| Notification fan-out per creator | **5,000** | `CreatorEventNotifier`, `CreatorPushService`, birthday reminders |
| Birthday weekly send per run | **5,000** | `config/discovery.php` (a run cap, not a quota — the next run continues) |
| Discovery creator pool | **750** | `CreatorRecommendationService::POOL_LIMIT` |
| Creator push | **1/day, 4/month** | `CreatorPushService` |
| Bio page items | **12** | `BioSellableItems::MAX_ITEMS` |
| Discovery collection cache | **900s** | `CollectionService::TTL` |
| Collection on/off cache | **60s** | so an admin switch takes effect in a minute |

⚠️ **The scheduler is the tightest of these and nobody is watching it.** There
are **65 scheduled command registrations** across the app, `cli-concurrency` is
**10**, and on Vapor *every command due in the same minute shares one CLI timeout
budget*. The existing 03:40 / 03:45 / 03:50 / 03:52 / 03:55 / 03:57 spacing of
the prune commands exists because of this. **Adding a command at an already-busy
minute is the most likely way to break a nightly job**, and it will fail quietly.

---

## What will break first, in order

Honest ranking. Not everything on it needs doing now.

### 1. The scheduler, at ~80 commands
Ten concurrent CLI invocations sharing one budget. **Cost of fixing: nothing** —
spread the times. **Cost of not: a prune or a payout run silently stops.**
*Do this before adding the next scheduled command.*

### 2. Cold starts, at any real traffic
`warm: 1` keeps **one** instance alive. The second concurrent visitor pays a cold
start, and this app boots Inertia, Ziggy and a large route file. Raise `warm`
before a campaign, not during one. **It is a `vapor.yml` value — but changing it
is a deploy**, so it cannot be done reactively.

### 3. The public profile page
`/{username}` is the heaviest page and it is also the Discovery destination, so
every ad click lands on it. It already carries the Discovery panel, the
Opportunity panel and the recommendation row. **This is why the bio card added
today deliberately carries no counts** — a view or item count there is another
query on the busiest page in the app.

### 4. The ledger, at ~1M rows
`financial_transactions` is read by the earnings dashboard, Support History,
the Purchase Hub, the payout run, `LedgerRules`, the Discovery report and the
new admin Discovery screen. It is currently **112 rows on development**, so
nothing here is urgent — but the index pass of 23 July 2026 exists because these
queries were already the slow ones. *Re-check the plan when it passes ~100k.*

### 5. Redis, shared
One cache for two apps. Fine now. The thing to know is that a **flush affects
both**, and that the security work deliberately keeps brute-force counters in
the DATABASE for that reason — a cache flush must not reset a brute-force count
at the moment it matters.

---

## What to change, and when

**Before the first ad campaign**
- Raise `warm` on spennypiggy.co (deploy required — do it in advance).
- Turn `health-checks` on for spennypiggy.co, or accept that Vapor cannot tell
  when it is down. The admin app's health routes were registered on 20 Aug after
  being 404 for their whole life, and *nothing reported it* — a 404 reads as an
  unhealthy app, not as a missing route.
- Confirm a queue worker is actually running. Push, deliverables, moderation
  scans, payouts and e-mail all no-op silently without one.

**Production is currently smaller than development**
Development runs **2048 MB / 120s**; production runs **1024 MB / 60s**. That is
the wrong way round: a page that is comfortable in testing has half the memory
and half the time in front of real users. Either raise production or lower
development so the two agree — a limit you cannot reproduce is a limit you
discover from a customer.

**When creator push is switched on for everyone**
The 1/day cap makes the *steady* load small, but the *peak* is one creator
enqueueing up to 5,000 jobs at once. The queue absorbs that; the thing to watch
is queue depth, not the web tier.

**Not needed yet, and worth saying so**
Read replicas, sharding, a separate search service, a CDN in front of the app
(assets already go to S3/CloudFront via `ASSET_URL`). At the current row counts
these would be cost with no benefit.

---

## What this plan cannot answer

- **There is no load test, and no staging environment to run one against.** Every
  number above is a reading of configuration and code, not of behaviour under
  load. Section F's sandbox app is the prerequisite for anything better.
- **Nobody has confirmed the development environment uses Stripe test keys.**
  Until that is checked, "test it on dev first" is not a safe instruction.
- Production traffic and current row counts were not available here; the figures
  quoted are from the development database and are noted as such.
