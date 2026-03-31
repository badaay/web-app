# Financial Reporting

This document outlines the plan for the reporting features within the Payment Center.

## 1. Report Types Overview

| Report | Period | Purpose |
|--------|--------|---------|
| **Summary Dashboard** | Real-time | Quick overview of financial health |
| **Weekly Report** | 7 days | Short-term revenue tracking |
| **Monthly Report** | Calendar month | Standard accounting period |
| **Custom Period** | User-defined | Flexible date range analysis |

## 2. Summary Dashboard (Real-time)

### Key Metrics Cards

```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   REVENUE MTD   │ │  OUTSTANDING    │ │    OVERDUE      │ │   PAYROLL MTD   │
│                 │ │                 │ │                 │ │                 │
│  Rp 45,500,000  │ │  Rp 12,300,000  │ │  Rp 3,200,000   │ │  Rp 28,000,000  │
│   ▲ 12% vs LM   │ │   8 invoices    │ │   3 invoices    │ │   7 employees   │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Metrics Definitions

| Metric | Calculation |
|--------|-------------|
| Revenue MTD | Sum of `payments.amount` WHERE `type='customer_payment'` AND current month |
| Outstanding | Sum of `invoices.total_amount - paid_amount` WHERE `status IN ('sent', 'partial')` |
| Overdue | Sum of outstanding WHERE `due_date < today` |
| Payroll MTD | Sum of `payments.amount` WHERE `type='payroll'` AND current month |

## 3. Weekly Report

### Report Period
- Default: Last 7 days (Monday to Sunday of previous week)
- Selectable: Any 7-day period

### Report Content

```
╔══════════════════════════════════════════════════════════════════╗
║ WEEKLY FINANCIAL REPORT                                          ║
║ Period: 18 Mar 2026 - 24 Mar 2026                                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ REVENUE SUMMARY                                                  ║
║ ────────────────────────────────────────────────────────────     ║
║ Payments Received:           Rp 12,500,000                       ║
║ Number of Payments:          15                                  ║
║ Average Payment:             Rp    833,333                       ║
║                                                                  ║
║ INVOICES                                                         ║
║ ────────────────────────────────────────────────────────────     ║
║ Invoices Issued:             8         (Rp 8,400,000)            ║
║ Invoices Paid (Full):        12        (Rp 10,800,000)           ║
║ Invoices Paid (Partial):     3         (Rp 1,700,000)            ║
║                                                                  ║
║ OUTSTANDING                                                      ║
║ ────────────────────────────────────────────────────────────     ║
║ Total Outstanding:           Rp 15,200,000 (12 invoices)         ║
║ Due This Week:               Rp  4,500,000 (5 invoices)          ║
║ Overdue:                     Rp  3,200,000 (3 invoices)          ║
║                                                                  ║
║ PAYROLL                                                          ║
║ ────────────────────────────────────────────────────────────     ║
║ (No payroll runs this week)                                      ║
║                                                                  ║
║ COMPARISON VS PREVIOUS WEEK                                      ║
║ ────────────────────────────────────────────────────────────     ║
║ Revenue:     Rp 12,500,000 vs Rp 10,200,000   ▲ +22.5%          ║
║ Invoices:    8 vs 6                           ▲ +33%            ║
║ Collections: 85% vs 78%                       ▲ +7pp            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

                    [ Export CSV ]  [ Export PDF ]  [ Print ]
```

## 4. Monthly Report

### Report Content (Extended)

In addition to weekly metrics, monthly report includes:

```
╔══════════════════════════════════════════════════════════════════╗
║ MONTHLY FINANCIAL REPORT                                         ║
║ Period: March 2026                                               ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ INCOME STATEMENT                                                 ║
║ ────────────────────────────────────────────────────────────     ║
║ Revenue (Customer Payments)      Rp 45,500,000                   ║
║                                                                  ║
║ Less: Operating Expenses                                         ║
║   Employee Salaries              Rp 25,000,000                   ║
║   Points/Bonuses                 Rp  3,000,000                   ║
║                                  ─────────────                   ║
║   Total Payroll                  Rp 28,000,000                   ║
║                                                                  ║
║ NET INCOME                       Rp 17,500,000                   ║
║                                                                  ║
║ ════════════════════════════════════════════════════════════     ║
║                                                                  ║
║ REVENUE BY WEEK                                                  ║
║ ────────────────────────────────────────────────────────────     ║
║ Week 1 (1-7):    ████████████████░░░░  Rp 10,200,000 (22%)       ║
║ Week 2 (8-14):   ██████████████████░░  Rp 12,800,000 (28%)       ║
║ Week 3 (15-21):  █████████████░░░░░░░  Rp  9,500,000 (21%)       ║
║ Week 4 (22-31):  ██████████████████░░  Rp 13,000,000 (29%)       ║
║                                                                  ║
║ COLLECTION RATE                                                  ║
║ ────────────────────────────────────────────────────────────     ║
║ Invoices Issued:        32                                       ║
║ Invoices Collected:     28        (87.5%)                        ║
║ Average Days to Pay:    8.5 days                                 ║
║                                                                  ║
║ TOP CUSTOMERS BY REVENUE                                         ║
║ ────────────────────────────────────────────────────────────     ║
║ 1. PT ABC Corp          Rp 4,200,000  (3 invoices)              ║
║ 2. CV XYZ               Rp 2,800,000  (2 invoices)              ║
║ 3. John Doe             Rp 1,400,000  (1 invoice)               ║
║                                                                  ║
║ EMPLOYEE EARNINGS                                                ║
║ ────────────────────────────────────────────────────────────     ║
║ 1. Budi Technician      Rp 4,500,000  (18 WOs, 18 pts)          ║
║ 2. Andi Sutrisno        Rp 4,300,000  (15 WOs, 15 pts)          ║
║ 3. Rini Admin           Rp 5,000,000  (Admin, 0 pts)            ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

## 5. API Endpoint

### GET `/api/payments/report`

**Query Parameters:**
- `type`: 'weekly' | 'monthly' | 'custom'
- `date`: Reference date (for weekly/monthly) or start date (for custom)
- `end_date`: End date (for custom only)

**Response:**
```json
{
    "period": {
        "start": "2026-03-01",
        "end": "2026-03-31",
        "type": "monthly"
    },
    "revenue": {
        "total": 45500000,
        "count": 28,
        "average": 1625000
    },
    "invoices": {
        "issued": { "count": 32, "amount": 38400000 },
        "paid_full": { "count": 25, "amount": 32000000 },
        "paid_partial": { "count": 3, "amount": 2500000 },
        "outstanding": { "count": 12, "amount": 15200000 },
        "overdue": { "count": 3, "amount": 3200000 }
    },
    "payroll": {
        "total": 28000000,
        "base_salary": 25000000,
        "bonuses": 3000000,
        "employee_count": 7
    },
    "net_income": 17500000,
    "comparison": {
        "revenue_change_pct": 12.5,
        "invoices_change_pct": 8.3,
        "collection_rate": 87.5,
        "prev_collection_rate": 82.0
    },
    "breakdowns": {
        "revenue_by_week": [...],
        "top_customers": [...],
        "employee_earnings": [...]
    }
}
```

## 6. UI Implementation

### Report Tab in Payment Center

```html
<div class="tab-pane fade" id="reports-tab">
    <!-- Report Controls -->
    <div class="card bg-dark mb-4">
        <div class="card-body">
            <div class="row g-3 align-items-end">
                <div class="col-md-3">
                    <label class="form-label">Report Type</label>
                    <select class="form-select" id="report-type">
                        <option value="weekly">Weekly Report</option>
                        <option value="monthly" selected>Monthly Report</option>
                        <option value="custom">Custom Period</option>
                    </select>
                </div>
                <div class="col-md-3" id="report-month-picker">
                    <label class="form-label">Month</label>
                    <input type="month" class="form-control" id="report-month" value="2026-03">
                </div>
                <div class="col-md-3 d-none" id="report-date-range">
                    <label class="form-label">Date Range</label>
                    <div class="input-group">
                        <input type="date" class="form-control" id="report-start">
                        <span class="input-group-text">to</span>
                        <input type="date" class="form-control" id="report-end">
                    </div>
                </div>
                <div class="col-md-3">
                    <button class="btn btn-primary" id="btn-generate-report">
                        <i class="bi bi-bar-chart"></i> Generate Report
                    </button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Report Display Area -->
    <div id="report-content">
        <!-- Dynamically populated -->
    </div>
</div>
```

### Chart Integration (Future)

Using Chart.js for visualizations:

```javascript
// Revenue trend chart
new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
            label: 'Revenue',
            data: [10200000, 12800000, 9500000, 13000000],
            borderColor: '#0d6efd',
            fill: true
        }]
    }
});

// Invoice status pie chart
new Chart(ctx2, {
    type: 'doughnut',
    data: {
        labels: ['Paid', 'Outstanding', 'Overdue'],
        datasets: [{
            data: [28, 9, 3],
            backgroundColor: ['#198754', '#ffc107', '#dc3545']
        }]
    }
});
```

## 7. Export Options

### CSV Export
- Generate downloadable CSV file
- Include all raw data for the period
- Columns: Date, Type, Customer, Invoice#, Amount, Status

### PDF Export (Future)
- Formatted report with company branding
- Include charts and summary
- Use server-side PDF generation

### Print
- Browser print with optimized CSS
- Hide navigation, show only report content

## Future Enhancements

- **Dashboard Charts**: Interactive charts with hover details
- **Drill-down**: Click on metrics to see detailed transactions
- **Scheduled Reports**: Auto-generate and email reports weekly/monthly
- **Custom KPIs**: Let admin define their own metrics
- **Budget vs Actual**: Set budget targets and track performance
- **Forecasting**: AI-powered revenue predictions
- **Multi-currency**: Support for USD/IDR reporting
- **Audit Trail**: Track who generated which reports when
