<?php

/*
|--------------------------------------------------------------------------
| Competitor comparison sheets
|--------------------------------------------------------------------------
|
| Client spec "Comparison Build FINAL v4.3", 24 Aug 2026, Section 5.
|
| One file per competitor in config/comparisons/, keyed by its slug — and the
| slug IS the file name, which is what makes an unknown /creators/vs/{slug}
| a 404 with nothing to look up.
|
| ⚠️ Adding a competitor is adding ONE file. Nothing here is edited, and no
| code changes: the template, the matrix rows and the fee maths are shared.
|
| ⚠️ This glob runs at config-cache time on deploy, so a new file needs a
| deploy to appear — the same as every other config value in this app.
*/

$sheets = [];

foreach (glob(__DIR__.'/comparisons/*.php') ?: [] as $file) {
    $sheets[basename($file, '.php')] = require $file;
}

return $sheets;
