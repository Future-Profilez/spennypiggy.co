import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

/*
 * The old page printed 32 rows in a flat list with every label hardcoded in the markup, so a
 * critical failure ("no queue worker — nobody is being paid") rendered exactly like a warning
 * ("disk 76% full") and the reader had to know the system to tell them apart.
 *
 * This one answers three questions in order: what is broken, is it worse than last time, and what
 * do I do about it. Labels, grouping, severity and remediation all come from the server's
 * CheckCatalog — adding a check no longer means editing this file.
 */

const STATUS = {
    failed: { dot: 'bg-red-500', text: 'text-red-700', ring: 'ring-red-200', tint: 'bg-red-50', label: 'Failed' },
    warning: { dot: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-200', tint: 'bg-amber-50', label: 'Warning' },
    passed: { dot: 'bg-emerald-500', text: 'text-emerald-700', ring: 'ring-emerald-200', tint: 'bg-white', label: 'Passed' },
    // Skipped is deliberately grey, never green — a check that did not run tells you nothing,
    // and showing it as a pass is how a broken probe reads as a healthy system.
    skipped: { dot: 'bg-gray-400', text: 'text-gray-600', ring: 'ring-gray-200', tint: 'bg-gray-50', label: 'Skipped' },
};

const DELTA = {
    new: { label: 'New', className: 'bg-red-100 text-red-800' },
    worse: { label: 'Worse', className: 'bg-red-100 text-red-800' },
    resolved: { label: 'Resolved', className: 'bg-emerald-100 text-emerald-800' },
    improved: { label: 'Improved', className: 'bg-emerald-100 text-emerald-800' },
};

const statusOf = (s) => STATUS[s] ?? STATUS.skipped;

function Chip({ children, className = '' }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}>
            {children}
        </span>
    );
}

function CountTile({ label, value, tone }) {
    return (
        <div className={`rounded-box-sm px-4 py-3 ring-1 ring-inset ${tone}`}>
            <div className="text-2xl font-semibold tabular-nums leading-none">{value}</div>
            <div className="mt-1 text-[11px] font-medium uppercase tracking-wider opacity-70">{label}</div>
        </div>
    );
}

function CheckCard({ result }) {
    const [open, setOpen] = useState(false);
    const s = statusOf(result.status);
    const delta = DELTA[result.delta];
    const hasDetail = (result.details?.length ?? 0) > 0 || result.remediation;

    return (
        <div className={`rounded-box-sm ring-1 ring-inset ${s.ring} ${s.tint} overflow-hidden`}>
            <div className="flex flex-wrap items-start gap-3 p-4">
                <span className={`mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${s.dot}`} aria-hidden="true" />

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-gray-900">{result.label}</h4>

                        {result.status !== 'passed' && result.severity === 'critical' && (
                            <Chip className="bg-red-600 text-white">Critical</Chip>
                        )}
                        {delta && <Chip className={delta.className}>{delta.label}</Chip>}
                    </div>

                    <p className="mt-1 break-words text-sm text-gray-600">{result.message}</p>

                    {result.ids?.length > 0 && (
                        <p className="mt-1.5 font-mono text-[11px] text-gray-500">
                            ids: {result.ids.join(', ')}
                        </p>
                    )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="font-mono text-[11px] tabular-nums text-gray-400">
                        {Math.round(result.time_ms)}ms
                    </span>
                    {hasDetail && (
                        <button
                            type="button"
                            onClick={() => setOpen((v) => !v)}
                            aria-expanded={open}
                            className="min-h-[36px] rounded-box-sm px-2.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-white"
                        >
                            {open ? 'Hide' : 'Details'}
                        </button>
                    )}
                </div>
            </div>

            {open && hasDetail && (
                <div className="border-t border-black/5 bg-white/70 px-4 py-3">
                    {result.details?.length > 0 && (
                        <ul className="space-y-1.5">
                            {result.details.map((d, i) => (
                                <li key={i} className="break-words font-mono text-[11px] leading-relaxed text-gray-700">
                                    {d}
                                </li>
                            ))}
                        </ul>
                    )}

                    {result.remediation && (
                        <div className="mt-3 rounded-box-sm bg-gray-900 px-3 py-2.5">
                            <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                What to do
                            </div>
                            <p className="mt-1 break-words text-xs leading-relaxed text-gray-100">
                                {result.remediation}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SystemDiagnostics({ auth, app_version, php_version, laravel_version }) {
    const [running, setRunning] = useState(false);
    const [report, setReport] = useState(null);
    const [deep, setDeep] = useState(false);
    const [problemsOnly, setProblemsOnly] = useState(true);

    const runDiagnostics = useCallback(async () => {
        if (running) return; // re-entrancy guard: a double tap fired two full sweeps

        setRunning(true);
        const toastId = toast.loading(deep ? 'Running deep diagnostics…' : 'Running diagnostics…');

        try {
            const { data } = await axios.post('/admin/system-diagnostics/run', { deep });
            setReport(data);

            const { failed = 0, warning = 0, critical = 0 } = data.counts ?? {};

            if (data.status === 'passed') {
                toast.success('All checks healthy.', { id: toastId });
            } else if (critical > 0) {
                toast.error(`${critical} critical issue${critical === 1 ? '' : 's'}.`, { id: toastId });
            } else {
                toast(`${failed} failed, ${warning} warning.`, { id: toastId, icon: '⚠️' });
            }
        } catch (error) {
            const message =
                error?.response?.status === 429
                    ? 'Rate limited — wait a moment before running again.'
                    : error?.response?.data?.message || 'Could not run diagnostics. Check the server logs.';
            toast.error(message, { id: toastId });
        } finally {
            setRunning(false);
        }
    }, [running, deep]);

    const copySummary = useCallback(async () => {
        if (!report?.summary_text) return;

        try {
            await navigator.clipboard.writeText(report.summary_text);
            toast.success('Summary copied.');
        } catch {
            toast.error('Could not copy — select the text instead.');
        }
    }, [report]);

    // Group for display, preserving the server's severity ordering within each group.
    const grouped = useMemo(() => {
        if (!report?.results) return [];

        const visible = problemsOnly
            ? report.results.filter((r) => r.status === 'failed' || r.status === 'warning')
            : report.results;

        const order = report.group_order ?? [];
        const buckets = new Map(order.map((g) => [g, []]));

        visible.forEach((r) => {
            if (!buckets.has(r.group)) buckets.set(r.group, []);
            buckets.get(r.group).push(r);
        });

        return [...buckets.entries()].filter(([, rows]) => rows.length > 0);
    }, [report, problemsOnly]);

    const counts = report?.counts ?? {};

    return (
        <AuthenticatedLayout
            user={auth.user}
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">System Diagnostics</h2>}
        >
            <Head title="System Diagnostics" />

            <div className="min-h-dvh bg-gray-50 py-8 pb-28">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    {/* Controls */}
                    <div className="rounded-box bg-white p-5 ring-1 ring-inset ring-black/[0.08]">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                                <h3 className="text-base font-semibold text-gray-900">Health check</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {app_version} · PHP {php_version} · Laravel {laravel_version}
                                </p>
                            </div>

                            <button
                                onClick={runDiagnostics}
                                disabled={running}
                                className="inline-flex min-h-[44px] items-center gap-2 rounded-box-sm bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                            >
                                {running && (
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                )}
                                {running ? 'Running…' : 'Run diagnostics'}
                            </button>
                        </div>

                        <label className="mt-4 flex cursor-pointer items-start gap-3">
                            <input
                                type="checkbox"
                                checked={deep}
                                onChange={(e) => setDeep(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300"
                            />
                            <span className="text-xs leading-relaxed text-gray-600">
                                <span className="font-semibold text-gray-800">Deep run</span> — also test Stripe
                                Connect onboarding and payments. These create a{' '}
                                <strong>real Connect account and a real PaymentIntent</strong>, so they are skipped
                                on a normal run.
                            </span>
                        </label>
                    </div>

                    {report && (
                        <>
                            {/* Summary */}
                            <div className="mt-6 rounded-box bg-white p-5 ring-1 ring-inset ring-black/[0.08]">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`h-3 w-3 rounded-full ${statusOf(report.status).dot}`} />
                                        <span className="text-sm font-semibold text-gray-900">
                                            {report.status === 'passed'
                                                ? 'All checks healthy'
                                                : counts.critical > 0
                                                  ? `${counts.critical} critical issue${counts.critical === 1 ? '' : 's'}`
                                                  : 'Issues detected'}
                                        </span>
                                        <Chip className="bg-gray-900 text-white uppercase">{report.environment}</Chip>
                                        {report.deep && <Chip className="bg-indigo-100 text-indigo-800">Deep</Chip>}
                                    </div>

                                    <button
                                        onClick={copySummary}
                                        className="min-h-[36px] rounded-box-sm px-3 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    >
                                        Copy summary
                                    </button>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                    <CountTile label="Failed" value={counts.failed ?? 0} tone="ring-red-200 text-red-700" />
                                    <CountTile label="Warning" value={counts.warning ?? 0} tone="ring-amber-200 text-amber-700" />
                                    <CountTile label="Passed" value={counts.passed ?? 0} tone="ring-emerald-200 text-emerald-700" />
                                    <CountTile label="Skipped" value={counts.skipped ?? 0} tone="ring-gray-200 text-gray-600" />
                                </div>

                                <p className="mt-3 text-xs text-gray-500">
                                    {report.timestamp} · {(report.duration_ms / 1000).toFixed(1)}s
                                    {report.previous_run_at
                                        ? ` · compared against ${report.previous_run_at}`
                                        : ' · no previous run to compare against yet'}
                                </p>
                            </div>

                            {/* Filter */}
                            <div className="mt-6 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-900">Results</h3>
                                <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-600">
                                    <input
                                        type="checkbox"
                                        checked={problemsOnly}
                                        onChange={(e) => setProblemsOnly(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300"
                                    />
                                    Problems only
                                </label>
                            </div>

                            {grouped.length === 0 ? (
                                <div className="mt-3 rounded-box bg-white p-8 text-center ring-1 ring-inset ring-black/[0.08]">
                                    <p className="text-sm font-medium text-gray-900">Nothing needs attention.</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Untick “Problems only” to see every check.
                                    </p>
                                </div>
                            ) : (
                                grouped.map(([group, rows]) => (
                                    <section key={group} className="mt-5">
                                        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                                            {group}
                                        </h4>
                                        <div className="space-y-2">
                                            {rows.map((r) => (
                                                <CheckCard key={r.key} result={r} />
                                            ))}
                                        </div>
                                    </section>
                                ))
                            )}
                        </>
                    )}

                    {!report && !running && (
                        <div className="mt-6 rounded-box bg-white p-10 text-center ring-1 ring-inset ring-black/[0.08]">
                            <p className="text-sm font-medium text-gray-900">No run yet</p>
                            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-gray-500">
                                Each run is recorded, so the next one can tell you what changed rather than just what
                                is currently true.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
