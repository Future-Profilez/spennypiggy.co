const fs = require('fs');

let authFile = fs.readFileSync('routes/auth.php', 'utf8');
const newRoute = fs.readFileSync('discover_route.php', 'utf8');

const startStr = "Route::get('discover/{type?}/{category?}', function (Request $request, DiscoveryService $discoveryService, $type = 'trending', $category = null) {";
const endStr = '})->name("discover");';

const startIdx = authFile.indexOf(startStr);
const endIdx = authFile.indexOf(endStr, startIdx) + endStr.length;

if (startIdx !== -1) {
    const updated = authFile.substring(0, startIdx) + newRoute + authFile.substring(endIdx);
    fs.writeFileSync('routes/auth.php', updated);
    console.log('Replaced successfully');
} else {
    console.log('Could not find start string in routes/auth.php');
}
