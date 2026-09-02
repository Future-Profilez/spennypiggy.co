<?php

namespace Tests\Feature;

use App\Models\ShopPayment;
use Tests\TestCase;

/**
 * 🚨 ALIASING A SOFT-DELETING MODEL'S TABLE BREAKS ITS OWN GLOBAL SCOPE.
 *
 * `SoftDeletingScope` qualifies with the MODEL'S TABLE NAME, so
 * `ShopPayment::query()->from('shop_payments as sp')` emits
 * `where shop_payments.deleted_at is null` — and in MySQL an alias REPLACES the
 * table name, so that is not a valid reference. Every load of /shop/orders-list
 * answered 1054 "Unknown column 'shop_payments.deleted_at'" (JAVASCRIPT-REACT-90).
 *
 * ⚠️ SQLITE ACCEPTS THE UN-ALIASED REFERENCE, so a feature test hitting the route
 * passes against the bug — which is why this asserts the generated SQL instead.
 * The same reason the leaderboard cast is pinned on SQL shape.
 */
class ShopOrdersListAliasTest extends TestCase
{
    /**
     * ⚠️ Quote characters are stripped before comparing: the suite runs on SQLite,
     * which quotes with `"` where MySQL uses backticks. The QUALIFIER is what matters.
     */
    private function unquoted(string $sql): string
    {
        return str_replace(['`', '"'], '', $sql);
    }

    public function test_the_soft_delete_scope_is_qualified_with_the_alias(): void
    {
        $aliased = (new ShopPayment)->setTable('sp');

        $sql = $this->unquoted($aliased->newQuery()->from('shop_payments as sp')->toSql());

        $this->assertStringContainsString('sp.deleted_at', $sql);
        $this->assertStringNotContainsString(
            'shop_payments.deleted_at',
            $sql,
            'MySQL refuses the un-aliased table name once the table carries an alias.'
        );
    }

    public function test_the_unaliased_model_is_what_produces_the_broken_reference(): void
    {
        // The bug itself, pinned so nobody "tidies" the setTable() away.
        $sql = $this->unquoted(ShopPayment::query()->from('shop_payments as sp')->toSql());

        $this->assertStringContainsString(
            'shop_payments.deleted_at',
            $sql,
            'If this ever stops being true, Laravel changed the scope and the workaround can go.'
        );
    }
}
