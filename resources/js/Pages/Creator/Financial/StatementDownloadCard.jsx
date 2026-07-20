import { useMemo, useState } from "react";
import { FileText, Download } from "lucide-react";

/**
 * One-Click Earnings Statement download.
 * Builds a GET to financial.statement.download with the chosen period + format —
 * the browser downloads the PDF/CSV directly (no Inertia visit).
 */
export default function StatementDownloadCard({ taxYear }) {
    const [period, setPeriod] = useState("this_month");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [error, setError] = useState("");

    const options = useMemo(() => {
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonth = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
        return { thisMonth, lastMonth };
    }, []);

    const buildUrl = (format) => {
        const base = route("financial.statement.download");
        const params = new URLSearchParams({ format });

        if (period === "this_month") {
            params.set("period", "month");
            params.set("month", options.thisMonth);
        } else if (period === "last_month") {
            params.set("period", "month");
            params.set("month", options.lastMonth);
        } else if (period === "tax_year") {
            params.set("period", "tax_year");
            params.set("year", String(taxYear));
        } else {
            if (!from || !to) {
                setError("Select both dates for a custom range.");
                return null;
            }
            if (to < from) {
                setError("End date must be after the start date.");
                return null;
            }
            // Mirror the backend's 366-day cap so the user gets an inline message
            // instead of a server validation error.
            const days = (new Date(to) - new Date(from)) / 86400000;
            if (days > 366) {
                setError("Date range cannot exceed 12 months.");
                return null;
            }
            params.set("period", "custom");
            params.set("from", from);
            params.set("to", to);
        }
        setError("");
        return `${base}?${params.toString()}`;
    };

    const [downloading, setDownloading] = useState(false);

    // Fetch as a blob so backend errors surface as the inline banner
    // instead of a new tab full of raw JSON.
    const download = async (format) => {
        const url = buildUrl(format);
        if (!url || downloading) return;
        setDownloading(true);
        try {
            const resp = await fetch(url, { headers: { Accept: "application/octet-stream" } });
            if (!resp.ok) {
                let msg = "Could not generate the statement. Please try again.";
                try {
                    const body = await resp.json();
                    if (body?.message) msg = body.message;
                } catch (_) { /* non-JSON error body */ }
                setError(msg);
                return;
            }
            const blob = await resp.blob();
            const dispo = resp.headers.get("Content-Disposition") || "";
            const match = dispo.match(/filename=([^;]+)/);
            const filename = match ? match[1].replace(/"/g, "").trim() : `earnings-statement.${format}`;
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(link.href);
        } catch (_) {
            setError("Download failed. Check your connection and try again.");
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="group bg-gray-50 rounded-[30px] p-4 border border-gray-200 transition-all">
            <div className="flex items-center gap-1.5 mb-1">
                <FileText size={12} className="text-[#FF007F]" />
                <span className="text-[14px] text-gray-400 uppercase font-bold">One-Click Statement</span>
            </div>
            <h4 className="text-normal font-bold text-gray-900 mb-3">Earnings Statement</h4>

            <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full mb-2 rounded-lg border-gray-200 text-normal font-bold text-gray-900 focus:border-[#FF007F] focus:ring-[#FF007F]"
            >
                <option value="this_month">This month</option>
                <option value="last_month">Last month</option>
                <option value="tax_year">This tax year</option>
                <option value="custom">Custom range</option>
            </select>

            {period === "custom" && (
                <div className="flex gap-2 mb-2">
                    <input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        className="w-1/2 rounded-lg border-gray-200 text-sm focus:border-[#FF007F] focus:ring-[#FF007F]"
                        aria-label="From date"
                    />
                    <input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        className="w-1/2 rounded-lg border-gray-200 text-sm focus:border-[#FF007F] focus:ring-[#FF007F]"
                        aria-label="To date"
                    />
                </div>
            )}

            {error && <p className="text-sm text-red-600 font-bold mb-2">{error}</p>}

            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => download("pdf")}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 w-1/2 bg-gray-900 hover:bg-[#FF007F] disabled:opacity-60 text-white py-2 rounded-lg text-normal font-bold transition-all"
                >
                    <Download size={14} /> {downloading ? "..." : "PDF"}
                </button>
                <button
                    type="button"
                    onClick={() => download("csv")}
                    disabled={downloading}
                    className="flex items-center justify-center gap-2 w-1/2 bg-gray-900 hover:bg-[#FF007F] disabled:opacity-60 text-white py-2 rounded-lg text-normal font-bold transition-all"
                >
                    <Download size={14} /> {downloading ? "..." : "CSV"}
                </button>
            </div>
        </div>
    );
}
