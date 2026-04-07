Route::get('discover/{type?}/{category?}', function (Illuminate\Http\Request $request, DiscoveryService $discoveryService, $type = 'trending', $category = null) {
    $getData = function() use ($request, $discoveryService, $type, $category) {
        $filters = $request->only(['search', 'contentType']);
        // Normalize type and apply shortcut filters
        if ($type) {
            $normalizedType = strtolower($type);
            if ($normalizedType === 'trending') {
                $filters['sortBy'] = 'Trending';
                $filters['type'] = 'trending';
            } elseif ($normalizedType === 'new') {
                $filters['sortBy'] = 'New';
                $filters['type'] = 'new';
            } elseif (in_array($normalizedType, ['creators', 'wishes', 'bills', 'memberships'])) {
                $filters['contentType'] = ucfirst($normalizedType);
            }
        } else {
            // If searching by keyword and no explicit content type, search across all
            if (!$request->has('contentType') && $request->has('search')) {
                $filters['contentType'] = 'All';
            }
        }

        // Determine if we should show search results (Grid) or default sections (Carousels)
        $queryParams = $request->query();
        $hasSearchParam = $request->has('search') && strlen((string) $request->input('search')) > 0;
        $hasTypeParamQuery = $request->has('type') && in_array(strtolower($request->input('type')), ['new', 'trending']);
        $hasTypeParamRoute = $type && in_array(strtolower($type), ['new', 'trending']);
        $hasTypeParam = $hasTypeParamQuery || $hasTypeParamRoute;

        // Check contentType from filters (which includes route params) or query params
        $activeContentType = $filters['contentType'] ?? ($request->input('contentType') ?? null);
        $hasContentTypeParam = $activeContentType && in_array($activeContentType, ['Creators', 'Wishes', 'Bills', 'Memberships']);

        // Grid view when searching or selecting a specific content type
        $isSearch = $hasSearchParam || $hasTypeParam || $hasContentTypeParam;
        // Root discover shows sections
        if (!$type && empty($queryParams)) {
            $isSearch = false;
        }

        $searchResults = [];
        if ($isSearch) {
            // Fetch all types unless specific contentType is set
            $ctype = $filters['contentType'] ?? 'All';

            // If contentType is default "Creators" but user didn't explicitly select it (e.g. just /discover/trending),
            // we might want to show everything.
            // However, the logic above sets contentType to Creators if missing.
            // Let's adjust: if type is a shortcut (trending/new/verified), unset contentType to allow fetching all?
            if ($type && in_array(strtolower($type), ['trending', 'new']) && !$request->has('contentType')) {
                $ctype = 'All';
            }

            if ($ctype === 'Creators' || $ctype === 'All') {
                $searchResults['creators'] = $discoveryService->getSearchCreators($filters);
            }
            if ($ctype === 'Wishes' || $ctype === 'All') {
                $searchResults['wishes'] = $discoveryService->getSearchWishes($filters);
            }
            if ($ctype === 'Bills' || $ctype === 'All') {
                $searchResults['bills'] = $discoveryService->getSearchBills($filters);
            }
            if ($ctype === 'Memberships' || $ctype === 'All') {
                $searchResults['memberships'] = $discoveryService->getSearchMemberships($filters);
            }
        }

        // Section data (top 10)
        $limit = 10;
        $sortBy = $filters['sortBy'] ?? null;
        
        // Creators
        $featuredCreators = $sortBy === 'New' ? $discoveryService->getSearchCreators(['sortBy' => 'New'], $limit) : $discoveryService->getTrendingCreators($limit);
        
        $newVerifiedCreators = $discoveryService->getNewVerifiedCreators($limit);
        
        // Wishes
        $featuredWishes = $sortBy ? $discoveryService->getSearchWishes(['sortBy' => $sortBy], $limit) : $discoveryService->getFeaturedWishes($limit);
        
        // Top earners this week
        $topEarnersData = $discoveryService->getTopEarners('weekly', $limit)['data'];
        
        // Bills & Memberships
        $featuredBills = $sortBy ? $discoveryService->getSearchBills(['sortBy' => $sortBy], $limit) : $discoveryService->getFeaturedBills($limit);
        
        $featuredMemberships = $sortBy ? $discoveryService->getSearchMemberships(['sortBy' => $sortBy], $limit) : $discoveryService->getFeaturedMemberships($limit);

        return compact(
            'featuredCreators',
            'newVerifiedCreators',
            'featuredWishes',
            'topEarnersData', // Map to 'topEarners' in return
            'featuredBills',
            'featuredMemberships',
            'filters',
            'searchResults'
        );
    };

    if (Auth::check()) {
        $data = $getData();
    } else {
        $cacheKey = 'discover_' . ($type ?? 'root') . '_' . ($category ?? 'none') . '_' . md5(json_encode($request->all()));
        $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 1200, $getData);
    }

    return Inertia::render('discover/Discover', [
        'featuredCreators' => $data['featuredCreators'],
        'newVerifiedCreators' => $data['newVerifiedCreators'],
        'featuredWishes' => $data['featuredWishes'],
        'topEarners' => $data['topEarnersData'],
        'featuredBills' => $data['featuredBills'],
        'featuredMemberships' => $data['featuredMemberships'],
        'filters' => $data['filters'],
        'searchResults' => $data['searchResults'],
    ]);
})->name("discover");