/**
 * Client-side CSV export. Builds the file from data already loaded in the page,
 * so there is no new endpoint and no personal data leaves the browser beyond what
 * the user is already looking at.
 *
 * @param {string} filename            e.g. "bills-2026-07.csv"
 * @param {string[]} headers           column titles
 * @param {Array<Array>} rows          array of row arrays, same order as headers
 */
export function exportCsv(filename, headers, rows) {
    const escape = (v) => {
        const s = v === null || v === undefined ? "" : String(v);
        // Quote if it contains comma, quote or newline; double any inner quotes.
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const lines = [
        headers.map(escape).join(","),
        ...rows.map((r) => r.map(escape).join(",")),
    ];
    // BOM so Excel reads UTF-8 (£, emoji, accents) correctly.
    const blob = new Blob(["﻿" + lines.join("\r\n")], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** YYYY-MM-DD for filenames, from the browser's local date. */
export function csvDateStamp() {
    return new Date().toISOString().slice(0, 10);
}
