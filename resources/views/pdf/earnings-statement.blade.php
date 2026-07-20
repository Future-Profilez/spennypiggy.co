<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Earnings Statement</title>
    <style>
        /* dompdf-safe styles: tables + basic CSS only (no flex/grid) */
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; margin: 24px; }
        h1 { font-size: 18px; letter-spacing: 1px; margin: 0 0 2px 0; }
        .muted { color: #666; }
        .header-table { width: 100%; margin-bottom: 18px; border-bottom: 3px solid #111; padding-bottom: 10px; }
        .header-table td { vertical-align: top; }
        .brand { font-size: 13px; font-weight: bold; color: #FF007F; letter-spacing: 2px; }
        .meta-table { width: 100%; margin-bottom: 16px; }
        .meta-table td { padding: 2px 0; }
        .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin: 18px 0 6px 0; border-bottom: 1px solid #111; padding-bottom: 3px; }
        table.data { width: 100%; border-collapse: collapse; }
        table.data th { text-align: left; font-size: 10px; text-transform: uppercase; color: #555; border-bottom: 1px solid #999; padding: 4px 6px; }
        table.data td { padding: 4px 6px; border-bottom: 1px solid #eee; }
        table.data td.num, table.data th.num { text-align: right; }
        .summary-table { width: 60%; }
        .summary-table td { padding: 4px 6px; border-bottom: 1px solid #eee; }
        .summary-table td.num { text-align: right; font-weight: bold; }
        .total-row td { border-top: 2px solid #111; border-bottom: none; font-weight: bold; font-size: 12px; }
        .footer { margin-top: 24px; font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 8px; }
        .badge { font-size: 9px; text-transform: uppercase; }
    </style>
</head>
<body>

    <table class="header-table">
        <tr>
            <td>
                <div class="brand">SPENNY PIGGY</div>
                <h1>Earnings Statement</h1>
                <div class="muted">{{ $period_label }}</div>
            </td>
            <td style="text-align: right;">
                <strong>{{ $entity_name }}</strong><br>
                <span class="muted">{{ '@' . $user->username }}</span><br>
                <span class="muted">Generated: {{ $generated_at }}</span>
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td><span class="muted">Period:</span> {{ $range['start'] }} — {{ $range['end'] }}</td>
            <td style="text-align:right;"><span class="muted">Currency:</span> {{ $currency }}</td>
        </tr>
    </table>

    <div class="section-title">Summary</div>
    <table class="summary-table">
        <tr>
            <td>Gross earnings</td>
            <td class="num">{{ number_format($summary['gross'], 2) }}</td>
        </tr>
        <tr>
            <td>Fees (platform + processing)</td>
            <td class="num">{{ number_format($summary['fees'], 2) }}</td>
        </tr>
        <tr>
            <td>VAT collected</td>
            <td class="num">{{ number_format($summary['vat'], 2) }}</td>
        </tr>
        <tr>
            <td>Net earnings</td>
            <td class="num">{{ number_format($summary['net'], 2) }}</td>
        </tr>
        <tr>
            <td>Refunds</td>
            <td class="num">{{ number_format($summary['refunds'], 2) }}</td>
        </tr>
        <tr>
            <td>Expenses / adjustments</td>
            <td class="num">{{ number_format($summary['expenses'], 2) }}</td>
        </tr>
        <tr class="total-row">
            <td>Profit</td>
            <td class="num">{{ $currency }} {{ number_format($summary['profit'], 2) }}</td>
        </tr>
    </table>

    <div class="section-title">Payouts in this period</div>
    @if (count($payouts))
        <table class="data">
            <tr>
                <th>Date</th>
                <th class="num">Amount</th>
                <th>Currency</th>
                <th>Status</th>
                <th>Arrival date</th>
            </tr>
            @foreach ($payouts as $p)
                <tr>
                    <td>{{ $p['date'] }}</td>
                    <td class="num">{{ number_format($p['amount'], 2) }}</td>
                    <td>{{ $p['currency'] }}</td>
                    <td class="badge">{{ $p['status'] }}</td>
                    <td>{{ $p['arrival_date'] ?? '—' }}</td>
                </tr>
            @endforeach
        </table>
    @else
        <p class="muted">No payouts were issued in this period.</p>
    @endif

    <div class="section-title">
        Transactions
        @if ($transactions_truncated)
            <span class="muted" style="font-weight: normal; text-transform: none;">(first 500 shown — download the CSV for the full list)</span>
        @endif
    </div>
    @if (count($transactions))
        <table class="data">
            <tr>
                <th>Date</th>
                <th>Type</th>
                <th class="num">Gross</th>
                <th class="num">Net</th>
                <th>Currency</th>
                <th>Status</th>
            </tr>
            @foreach ($transactions as $row)
                <tr>
                    <td>{{ $row['date'] }}</td>
                    <td>{{ $row['type'] }}</td>
                    <td class="num">{{ number_format($row['gross'], 2) }}</td>
                    <td class="num">{{ number_format($row['net'], 2) }}</td>
                    <td>{{ $row['currency'] }}</td>
                    <td class="badge">{{ $row['status'] }}</td>
                </tr>
            @endforeach
        </table>
    @else
        <p class="muted">No transactions in this period.</p>
    @endif

    <div class="footer">
        This statement summarises creator earnings on Spenny Piggy for the stated period. Amounts are shown in {{ $currency }};
        transactions in other currencies are converted at the platform's stored rates. This document is provided for
        record-keeping and is not a substitute for professional tax advice.
    </div>

</body>
</html>
