<?php

namespace Tests\Feature;

use App\Http\Controllers\GifterHubController;
use Illuminate\Http\Request;
use ReflectionMethod;
use Tests\TestCase;

/**
 * The media library paginates, so search / type / creator / sort MUST run over the
 * whole set server-side. Filtering on the client only ever saw the loaded page and
 * reported "no matches" for anything further in.
 */
class GifterHubMediaQueryTest extends TestCase
{
    private function apply(array $items, array $params): array
    {
        $method = new ReflectionMethod(GifterHubController::class, 'applyMediaQuery');
        $method->setAccessible(true);

        return $method->invoke(new GifterHubController, $items, new Request($params));
    }

    private function item(string $id, string $title, string $username, string $type, string $date): array
    {
        return [
            'id' => $id,
            'title' => $title,
            'source_type' => $type,
            'owner' => ['username' => $username],
            'purchased_at' => $date,
        ];
    }

    private function library(): array
    {
        return [
            $this->item('a', 'Sunset photo set', 'ada', 'wish', '2026-07-20 10:00:00'),
            $this->item('b', 'Behind the scenes', 'bo', 'shop', '2026-07-10 10:00:00'),
            $this->item('c', 'Acoustic session', 'ada', 'task', '2026-06-01 10:00:00'),
        ];
    }

    public function test_search_matches_title_and_creator_case_insensitively(): void
    {
        $byTitle = $this->apply($this->library(), ['q' => 'SUNSET']);
        $this->assertCount(1, $byTitle);
        $this->assertSame('a', $byTitle[0]['id']);

        $byCreator = $this->apply($this->library(), ['q' => 'ada']);
        $this->assertEqualsCanonicalizing(['a', 'c'], array_column($byCreator, 'id'));
    }

    public function test_search_returns_an_empty_list_when_nothing_matches(): void
    {
        $this->assertSame([], $this->apply($this->library(), ['q' => 'nothing here']));
    }

    public function test_type_and_creator_filters_combine(): void
    {
        $this->assertSame(['b'], array_column($this->apply($this->library(), ['type' => 'shop']), 'id'));

        $combined = $this->apply($this->library(), ['creator' => 'ada', 'type' => 'task']);
        $this->assertSame(['c'], array_column($combined, 'id'));
    }

    public function test_sorting_by_name_and_oldest(): void
    {
        $byName = $this->apply($this->library(), ['sort' => 'name']);
        $this->assertSame(['c', 'b', 'a'], array_column($byName, 'id'));

        $oldest = $this->apply($this->library(), ['sort' => 'oldest']);
        $this->assertSame(['c', 'b', 'a'], array_column($oldest, 'id'));
    }

    public function test_no_params_leaves_the_library_untouched(): void
    {
        $this->assertSame(['a', 'b', 'c'], array_column($this->apply($this->library(), []), 'id'));
    }

    public function test_filtered_results_are_reindexed_so_json_stays_an_array(): void
    {
        // array_filter preserves keys; a gap would serialise as a JSON object and the
        // frontend's .map() would blow up on it.
        $filtered = $this->apply($this->library(), ['type' => 'task']);
        $this->assertSame([0], array_keys($filtered));
    }
}
