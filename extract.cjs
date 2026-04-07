const fs = require('fs');
const execSync = require('child_process').execSync;
const oldAuth = execSync('git show 448d66d69d1de6faefa41b0f775e60c67ba6b14a^:routes/auth.php').toString();
const startIdx = oldAuth.indexOf("Route::get('discover/{type?}/{category?}'");
const endStr = '})->name("discover");';
const endIdx = oldAuth.indexOf(endStr, startIdx) + endStr.length;
const routeLogic = oldAuth.substring(startIdx, endIdx);
fs.writeFileSync('discover_route.php', routeLogic);
