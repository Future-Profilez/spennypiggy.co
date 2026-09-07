<?php

namespace Tests\Feature;

use App\Models\HelpArticle;
use App\Services\Help\HelpAnswer;
use App\Services\Help\HelpSearch;
use Database\Seeders\HelpCentreSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * 🚨 THE ASSISTANT'S ACCEPTANCE TEST — a real question must reach its answer.
 *
 * Client direction, 7 Sep 2026: *"har ek ke sawal ke cases banao … ye feature
 * kabhi fail nahi hona chahiye."*
 *
 * The AI answers ONLY from articles. With `HELP_AI_RETRIEVER=keyword`,
 * `HelpSearch::rankArticles()` picks them and the model writes from those and
 * nothing else — so **retrieval is the whole product**. A question that reaches
 * the wrong articles produces a confident answer about the wrong thing, and a
 * question that reaches none produces "we do not have an answer for that".
 * Neither errors. Neither is visible in any log. Nothing but a test like this
 * can see it.
 *
 * 🚨 THE CONTRACT IS **TOP `context_articles`**, NOT TOP ONE. The model is
 * handed that many articles (3) and writes from all of them, so an answer whose
 * article is third is a correct answer. Asserting rank 1 would fail on cases
 * that work perfectly and teach people to delete the test.
 *
 * ⚠️ IT CALLS NO API. Retrieval is a database query, so the whole suite is
 * deterministic, free and fast — which is what lets it run on every change
 * rather than being something somebody remembers to do.
 *
 * ⚠️ THESE ARE THE WORDS PEOPLE TYPE, not the article titles. Lower case, no
 * punctuation, the wrong nouns, the panicked phrasing. A case reworded to match
 * a title is a case that tests nothing — it would pass against an empty
 * `keywords` field, which is exactly the failure this guards.
 *
 * **When you add an article, add its cases here.** A feature with an article
 * nobody can retrieve is the same as a feature with no article.
 */
class HelpAnswerCasesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->seed(HelpCentreSeeder::class);
    }

    /**
     * question => the slug that must be among the retrieved articles, or a list
     * of slugs any one of which is an acceptable answer.
     *
     * ⚠️ A LIST IS FOR A GENUINELY AMBIGUOUS QUESTION, NEVER FOR MAKING A RED
     * CASE GREEN. If two articles both answer what the reader asked, pinning
     * one asserts a preference this test has no basis for. If only one answers
     * it, the case stays pinned and the article gets fixed.
     *
     * @return array<string, array{0: string, 1: array<int, string>}>
     */
    public static function questions(): array
    {
        $cases = [
            // ── Getting started, creators ────────────────────────────────
            'how do i start selling on here' => 'how-do-i-start-selling',
            'can i sell from my existing account' => 'i-already-have-a-supporter-account',
            'do i need a new account to start selling' => 'i-already-have-a-supporter-account',
            'turn my account into a creator account' => 'i-already-have-a-supporter-account',
            'my profile has been in review for days' => 'why-is-my-profile-still-in-review',
            'how much does it cost me to be a creator' => 'what-does-the-subscription-cost',
            'how do i get my bank account connected' => 'connect-your-payouts',
            'stripe keeps asking me for documents' => 'stripe-is-asking-for-something',
            'i need to verify my id' => 'verify-your-identity',
            'what should i do next' => 'what-do-i-do-next',
            'my account has been suspended why' => 'my-account-was-suspended',
            'can i change my username' => 'change-my-username-or-display-name',
            'how does the leaderboard work' => 'the-creator-leaderboard',
            'can i message the people who bought from me' => 'tell-your-supporters',
            'my profile is approved what do i do now' => 'what-happens-after-approval',
            'they rejected my profile how do i submit again' => 'my-profile-was-rejected',
            'how do i change my cover photo' => 'choose-a-cover-image',
            'can people find me on my birthday' => 'get-found-on-your-birthday',

            // ── Getting started, supporters ──────────────────────────────
            'do i need to sign up to buy something' => 'do-i-need-an-account-to-buy',
            'what am i actually paying for' => 'what-am-i-actually-buying',
            'how do i find creators to support' => 'how-do-i-find-creators',
            'is it safe to put my card in' => 'is-my-payment-information-safe',
            'my card got declined' => 'why-was-my-payment-declined',
            'what is a wishlist' => 'what-is-a-wishlist',
            'what does following someone do' => 'following-a-creator',

            // ── Selling ─────────────────────────────────────────────────
            'what things can i sell here' => 'what-can-i-sell',
            'what is a reward' => 'what-is-a-reward',
            'what should i name my listing' => 'what-should-i-call-my-listing',
            'why is my listing being reviewed' => 'why-is-my-listing-under-review',
            'can i set a listing to go live later' => 'schedule-a-listing',
            'what is the cheapest i can charge' => 'price-limits',
            'my listing is not showing up' => 'why-is-my-listing-not-showing',
            'how do i delete something i listed' => 'edit-or-delete-a-listing',
            'can i copy an existing listing' => 'duplicate-a-listing',
            'my piggy pot has gone' => 'my-piggy-pot-disappeared',
            'how do scheduled posts work' => 'how-do-scheduled-posts-work',
            'how do paid requests work' => 'how-do-paid-requests-work',
            'how do i post something to a buyer' => 'shipping-physical-products',
            'should i use a membership or bills' => 'memberships-vs-bills',
            'i keep typing the same postage rates' => 'reusable-shipping-rates',
            'what is my link in bio page' => 'your-link-in-bio-page',
            'what is a piggy pot' => 'what-is-a-piggy-pot',
            'what is the piggy bank on my page' => 'what-is-the-piggy-bank',
            'can my new listings post to twitter' => 'share-your-listings-automatically',
            'does anything change for american buyers' => 'selling-to-buyers-in-the-us',

            // ── Money and payouts ───────────────────────────────────────
            'when do i actually get paid' => 'when-do-i-get-paid',
            'why is some of my money being held back' => 'why-is-some-of-my-money-held',
            'will the reserve ever stop' => 'is-the-reserve-permanent',
            'what gets taken off my sale' => 'what-fees-are-deducted',
            'do i need to worry about vat' => 'vat-and-your-earnings',
            'what is the founder bonus' => 'founder-bonus',
            'i got paid less than i expected' => 'my-payout-was-smaller-than-expected',
            'my payout failed' => 'my-payout-failed',
            'do i have to charge vat' => 'do-i-charge-vat',
            'what bonuses are there' => 'bonuses-explained',
            'where do i see how much i earned' => 'where-can-i-see-my-earnings',
            'can i get my money sooner' => 'can-i-be-paid-faster',
            'what is the growth bonus' => 'growth-bonus',
            'what is the fast start bonus' => 'fast-start-bonus',
            'how do i refer another creator' => 'refer-a-creator',
            'why is one of my payments being reviewed' => 'why-is-a-payment-held-for-review',
            'i need a statement for my accountant' => 'download-an-earnings-statement',

            // ── Payments and checkout ───────────────────────────────────
            'should i pay by card or bank' => 'card-or-bank',
            'why is the total higher than the price' => 'why-is-the-total-more-than-the-price',
            'my payment says processing' => 'my-payment-says-processing',
            'what currency will i be charged in' => 'what-currency-am-i-charged-in',
            'i think i was charged twice' => 'i-was-charged-twice',
            'why do i have to make an account to buy this' => 'why-do-i-need-an-account-for-this-purchase',
            'this creator cannot take payments' => 'the-creator-cannot-take-payments',
            'who am i actually buying from' => 'who-is-the-seller',
            'can i buy several wishes at once' => 'using-the-basket',

            // ── Content rules ───────────────────────────────────────────
            // ⚠️ GENUINELY AMBIGUOUS, AND BOTH ANSWER IT. "Allowed" points at the
            // content rules; "sell" points at the product list. A reader is well
            // served by either, so pinning one would be asserting a preference
            // this test has no basis for.
            'what am i allowed to sell here' => ['what-content-is-allowed', 'what-can-i-sell'],
            'which words are not allowed' => 'words-you-cannot-use',
            'why were my subscriptions paused' => 'why-were-my-subscriptions-paused',
            'they rejected my profile photo' => 'why-was-my-photo-rejected',
            'can i link to my other accounts' => 'can-i-link-to-my-other-platforms',
            'who checks my content' => 'who-reviews-my-content',

            // ── Account and security ────────────────────────────────────
            'how do i turn on two factor' => 'two-factor-and-passkeys',
            'how do i stop these emails' => 'email-preferences',
            'i cannot log in' => 'i-cannot-sign-in',
            'i signed up with google and now cannot get in' => 'i-signed-up-with-google',
            'how do i delete my account' => 'delete-my-account',
            'i am not getting any notifications' => 'why-am-i-not-getting-notifications',
            'which terms did i agree to' => 'the-agreements-you-accept',
            'can i install this on my phone' => 'install-the-app',
            'what is the code box on signup' => 'codes-at-signup',
            'how do i block someone' => 'block-someone-or-end-a-session',

            // ── My purchases ────────────────────────────────────────────
            'i cannot find what i bought' => 'i-cannot-find-my-purchase',
            'can i get a refund' => 'refunds-and-cancellations',
            'the item was sold out' => 'item-sold-out',
            'my content never arrived' => 'my-content-has-not-arrived',
            'what i got was not what was described' => 'the-content-was-not-what-was-described',
            'how do i cancel a membership' => 'how-do-i-cancel-a-membership',
            'can i buy this as a present for a friend' => 'can-i-buy-for-someone-else',
            'how do i save something for later' => 'saving-items-for-later',
            'do i have a legal right to cancel' => 'your-right-to-cancel-or-return',

            // ── Trust and safety ────────────────────────────────────────
            'someone opened a chargeback' => 'disputes-and-chargebacks',
            'how do i report someone' => 'report-a-problem',
            'somebody is pretending to be me' => 'someone-is-impersonating-me',
            'my content is being resold' => 'my-content-is-being-sold-by-someone-else',
            'is this email really from you' => 'is-this-message-really-from-you',
            'someone stole my artwork' => 'copyright-and-takedowns',
            'how do i contact support' => 'getting-help-from-us',
            'a paid request was never delivered' => 'paid-request-disputes',
        ];

        $out = [];
        foreach ($cases as $question => $slug) {
            $out[$question] = [$question, (array) $slug];
        }

        return $out;
    }

    /**
     * @dataProvider questions
     */
    public function test_a_real_question_reaches_its_answer(string $question, array $accepted): void
    {
        $width = max(1, (int) config('help.ai.context_articles', 3));

        $slugs = HelpSearch::rankArticles($question, null, $width)
            ->pluck('slug')
            ->all();

        $this->assertNotEmpty(
            array_intersect($accepted, $slugs),
            sprintf(
                'A reader asking "%s" is handed [%s]. The assistant only ever sees those %d '.
                'articles, so it can never answer from [%s]. Fix the article\'s `keywords`, '.
                'retitle it for the question people actually type, or write the article this '.
                'question needs.',
                $question,
                $slugs ? implode(', ', $slugs) : 'nothing at all',
                $width,
                implode(' or ', $accepted)
            )
        );
    }

    /**
     * 🚨 EVERY ARTICLE MUST BE REACHABLE BY SOMETHING. An article no query can
     * retrieve is invisible to the assistant however well it is written — the
     * same class of fault as a feature that ships with no article at all.
     */
    public function test_every_case_names_an_article_that_exists(): void
    {
        $live = HelpArticle::pluck('slug')->all();

        foreach (self::questions() as [$question, $accepted]) {
            foreach ($accepted as $slug) {
                $this->assertContains(
                    $slug,
                    $live,
                    "The case \"{$question}\" expects [{$slug}], which is not in the corpus. ".
                    'A renamed or removed article leaves this case asserting nothing.'
                );
            }
        }
    }

    /**
     * 🚨 AN OFF-TOPIC QUESTION MUST COST NOTHING. The retriever refuses before
     * the model is called, so a stranger typing nonsense spends no quota and no
     * money. This is the property that makes a free tier survivable — and it is
     * one line of ranking away from being lost.
     */
    public function test_an_off_topic_question_never_reaches_the_model(): void
    {
        Http::fake();

        foreach (['what is the capital of France', 'asdkjh askjdh askjd', 'write me a poem'] as $q) {
            $result = HelpAnswer::ask($q);

            $this->assertFalse($result['answered'], "[{$q}] should not have been answered.");
        }

        Http::assertNothingSent();
    }
}
