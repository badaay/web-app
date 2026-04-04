# Employee Payroll and Points Integration

This document outlines the process for calculating and processing employee payroll, incorporating the existing points system.

## 1. Payroll Concept Overview

### Pay Components
| Component | Description |
|-----------|-------------|
| Base Salary | Fixed monthly salary from `employees.salary` |
| Points Bonus | Monetary value earned from completed work orders |
| Deductions | Any manual deductions (advances, penalties) |
| Bonuses | Additional manual bonuses |
| **Net Pay** | Base + Points Bonus + Bonuses - Deductions |

### Points System Integration
- Technicians earn points from completing work orders
- Points are converted to monetary value using configurable rate
- Default: 1 point = Rp 10,000 (stored in `settings.point_to_currency_rate`)

## 2. Payroll Calculation Logic

### Step-by-Step Process

```javascript
async function calculatePayroll(periodStart, periodEnd, employeeIds = []) {
    const pointRate = await getSetting('point_to_currency_rate') || 10000;
    
    // Get employees (all active or specific list)
    let query = supabase
        .from('employees')
        .select('id, name, salary, role')
        .eq('is_active', true);
    
    if (employeeIds.length > 0) {
        query = query.in('id', employeeIds);
    }
    
    const { data: employees } = await query;
    
    const results = [];
    
    for (const emp of employees) {
        // Calculate points earned in this period
        const { data: workOrders } = await supabase
            .from('work_orders')
            .select('technician_points')
            .eq('assigned_technician_id', emp.id)
            .eq('status', 'closed')
            .gte('closed_at', periodStart)
            .lte('closed_at', periodEnd);
        
        const pointsEarned = workOrders.reduce((sum, wo) => sum + (wo.technician_points || 0), 0);
        const pointValue = pointsEarned * pointRate;
        
        // Get any manual adjustments (future: from separate adjustments table)
        const deductions = 0; // Placeholder
        const bonuses = 0; // Placeholder
        
        const netPay = emp.salary + pointValue + bonuses - deductions;
        
        results.push({
            employee_id: emp.id,
            name: emp.name,
            role: emp.role,
            base_salary: emp.salary,
            points_earned: pointsEarned,
            point_value: pointValue,
            deductions,
            bonuses,
            net_pay: netPay
        });
    }
    
    // Calculate totals
    const totals = {
        base_salary: results.reduce((s, r) => s + r.base_salary, 0),
        point_value: results.reduce((s, r) => s + r.point_value, 0),
        deductions: results.reduce((s, r) => s + r.deductions, 0),
        bonuses: results.reduce((s, r) => s + r.bonuses, 0),
        net_pay: results.reduce((s, r) => s + r.net_pay, 0)
    };
    
    return { employees: results, totals, period: { start: periodStart, end: periodEnd } };
}
```

## 3. Payroll UI Flow

### Step 1: Initiate Payroll Run
1. Admin navigates to Payment Center → Payroll tab
2. Clicks "Run Payroll" button
3. Modal opens with:
   - Period selection (default: current month)
   - Employee filter (default: all active)
   - Preview button

### Step 2: Preview Calculation
1. Admin clicks "Preview"
2. System calculates payroll without saving
3. Results displayed in table:

```
╔══════════════════════════════════════════════════════════════════╗
║ Payroll Preview: March 2026 (01 Mar - 31 Mar)                    ║
╠══════════════════════════════════════════════════════════════════╣
║ Employee     │ Base Salary │ Points │ Bonus  │ Deduct │ Net Pay  ║
╠══════════════════════════════════════════════════════════════════╣
║ Budi T.      │ 4,000,000   │ 12     │ 120,000│ 0      │ 4,120,000║
║ Andi S.      │ 4,000,000   │ 18     │ 180,000│ 0      │ 4,180,000║
║ Rini W.      │ 5,000,000   │ 0      │ 0      │ 0      │ 5,000,000║
╠══════════════════════════════════════════════════════════════════╣
║ TOTALS       │ 13,000,000  │ 30     │ 300,000│ 0      │13,300,000║
╚══════════════════════════════════════════════════════════════════╝

                    [ Cancel ]  [ Process Payroll ]
```

### Step 3: Process Payroll
1. Admin reviews and clicks "Process Payroll"
2. Confirmation dialog: "Are you sure you want to process payroll for 3 employees totaling Rp 13,300,000?"
3. On confirm:
   - Create `payroll_runs` record
   - Create `payroll_items` for each employee
   - Create `payments` records (type: 'payroll')
4. Success notification with summary

### Step 4: View History
- Payroll tab shows list of past payroll runs
- Click on run to view details and individual payslips

## 4. Payroll Run Detail View

```
╔══════════════════════════════════════════════════════════════════╗
║ Payroll Run: March 2026                                          ║
║ Status: PAID  │  Run Date: 2026-03-29  │  Processed by: Admin    ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║ Summary:                                                         ║
║ • Period: 01 Mar 2026 - 31 Mar 2026                             ║
║ • Employees: 3                                                   ║
║ • Total Base: Rp 13,000,000                                      ║
║ • Total Points Bonus: Rp 300,000                                 ║
║ • Total Net Pay: Rp 13,300,000                                   ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║ Employee Details:                                                ║
║                                                                  ║
║ ┌──────────────────────────────────────────────────────────────┐ ║
║ │ Budi Technician                                              │ ║
║ │ Base: Rp 4,000,000                                           │ ║
║ │ Points: 12 × Rp 10,000 = Rp 120,000                         │ ║
║ │ Net Pay: Rp 4,120,000                          [ View Slip ] │ ║
║ └──────────────────────────────────────────────────────────────┘ ║
║ ... more employees ...                                           ║
╚══════════════════════════════════════════════════════════════════╝
```

## 5. API Endpoints

### POST `/api/payroll/calculate`
Preview payroll without saving.

**Request:**
```json
{
    "period_start": "2026-03-01",
    "period_end": "2026-03-31",
    "employee_ids": [] 
}
```

### POST `/api/payroll/process`
Execute and save payroll.

**Request:**
```json
{
    "period_start": "2026-03-01",
    "period_end": "2026-03-31",
    "employee_ids": [],
    "items": [
        {
            "employee_id": "uuid",
            "base_salary": 4000000,
            "points_earned": 12,
            "point_value": 120000,
            "deductions": 0,
            "bonuses": 0,
            "net_pay": 4120000,
            "notes": ""
        }
    ],
    "notes": "March 2026 Payroll"
}
```

**Response:**
```json
{
    "payroll_run_id": "uuid",
    "status": "created",
    "total_net_pay": 13300000,
    "employee_count": 3
}
```

## 6. Points Configuration

### Settings Table Entries
| Key | Default | Description |
|-----|---------|-------------|
| `point_to_currency_rate` | 10000 | IDR per point |
| `points_calculation_mode` | bonus | "bonus" (adds to salary) or "deduction" (subtracts) |

### Admin Settings UI
Add to Settings module:
- Point conversion rate input
- Points mode toggle (Bonus/Deduction)

## 7. Payroll Status Workflow

```
 ┌─────────┐
 │  DRAFT  │ ← Calculated but not finalized (future feature)
 └────┬────┘
      │ Approve
      ▼
 ┌──────────┐
 │ APPROVED │ ← Ready for payment
 └────┬─────┘
      │ Mark as Paid
      ▼
 ┌─────────┐
 │  PAID   │ ← Salaries disbursed
 └─────────┘
```

Note: Initial MVP may skip DRAFT state and go directly to PAID.

## Future Enhancements

- **Payslip PDF Generation**: Generate individual payslips for employees
- **Email/WhatsApp Payslips**: Send payslips to employees automatically
- **Manual Adjustments**: Add/edit deductions and bonuses per employee before processing
- **Advance Salary Tracking**: Track salary advances and auto-deduct from payroll
- **Tax Calculations**: Add PPh 21 tax calculation support
- **Bank Integration**: Export payroll data in bank transfer format
- **Approval Workflow**: Multi-level approval before payroll is finalized
- **Historical Comparison**: Compare payroll across periods
