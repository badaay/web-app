# 07 - Integration Points

> Mapping between the new salary system and existing database/API infrastructure.

---

## Overview

This document describes how the employee salary system integrates with existing tables, APIs, and workflows in the application.

---

## 1. Existing Tables & Connections

### 1.1 Employees Table

**Location**: `src/api/schema.sql`

**Current Columns Used**:
| Column | Usage in Salary System |
|--------|----------------------|
| `id` | FK for all salary-related tables |
| `name` | Display in payroll reports |
| `employee_id` | External reference (e.g., EMP001) |
| `position` | May affect allowance tiers |
| `status` | Filter active employees only |
| `bpjs` | Determine BPJS enrollment status |
| `role_id` | Identify technicians vs office staff |

**Proposed Additions**:
```sql
ALTER TABLE employees ADD COLUMN base_salary INTEGER DEFAULT 0;
ALTER TABLE employees ADD COLUMN target_monthly_points INTEGER DEFAULT 0;
ALTER TABLE employees ADD COLUMN is_bpjs_enrolled BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN bank_name TEXT;
ALTER TABLE employees ADD COLUMN bank_account_number TEXT;
ALTER TABLE employees ADD COLUMN bank_account_name TEXT;
```

### 1.2 Roles Table

**Usage**: Determine which employees are technicians (subject to point tracking).

**Relevant Roles**:
| Code | Name | Point Tracking |
|------|------|----------------|
| `TECH` | Technician | ✅ Yes |
| `SPV_TECH` | Supervisor Technician | ✅ Yes |
| `ADMIN` | Admin | ❌ No |
| `HR` | Human Resources | ❌ No |
| `OWNER` | Owner | ❌ No |

**Query for Technicians**:
```sql
SELECT e.* 
FROM employees e
JOIN roles r ON e.role_id = r.id
WHERE r.code IN ('TECH', 'SPV_TECH')
AND e.status = 'Aktif';
```

### 1.3 Work Orders & Assignments

**Tables**:
- `work_orders` - Main work order records
- `work_order_assignments` - Technician assignments with points

**Points Integration**:

```sql
-- Get monthly points for technician
SELECT 
    woa.employee_id,
    SUM(woa.points_earned) AS total_points
FROM work_order_assignments woa
JOIN work_orders wo ON wo.id = woa.work_order_id
WHERE wo.status = 'closed'
AND wo.completed_at >= '2025-11-01'
AND wo.completed_at < '2025-12-01'
GROUP BY woa.employee_id;
```

**Key Fields Used**:
| Table | Column | Usage |
|-------|--------|-------|
| `work_orders` | `status` | Filter closed WOs only |
| `work_orders` | `completed_at` | Monthly period filtering |
| `work_orders` | `type_id` | Reference to queue types for base points |
| `work_order_assignments` | `employee_id` | Link to employee |
| `work_order_assignments` | `points_earned` | Individual points per assignment |

### 1.4 Master Queue Types

**Table**: `master_queue_types`

**Usage**: Point values per work order type.

| Type | Code | Base Points |
|------|------|-------------|
| PSB (Pasang Baru) | `PSB` | 100 |
| Perbaikan (Repair) | `REPAIR` | 50 |
| Pindah Alamat (Relocation) | `RELOC` | 75 |
| Upgrade | `UPGRADE` | 50 |
| Cancel | `CANCEL` | 0 |

### 1.5 App Settings

**Table**: `app_settings`

**New Salary Settings**:
| Key | Value | Description |
|-----|-------|-------------|
| `work_start_time` | `08:00` | For late calculation |
| `late_rate_per_hour` | `20000` | IDR per hour late |
| `late_max_daily` | `20000` | Max daily deduction |
| `overtime_start_time` | `16:30` | OT starts after this |
| `overtime_rate_per_hour` | `10000` | IDR per OT hour |
| `point_deduction_rate` | `11600` | IDR per point shortage |
| `bpjs_fixed_amount` | `194040` | BPJS contribution |

---

## 2. API Endpoint Mapping

### 2.1 Existing Endpoints Used

| Endpoint | Method | Usage in Salary System |
|----------|--------|----------------------|
| `/api/dashboard/stats` | GET | Employee counts, top technicians |
| `/api/work-orders` | GET | Work order lists for point calculation |
| `/api/settings` | GET/PATCH | Salary configuration |

### 2.2 New Endpoints Required

#### Employee Salary Config

```
GET    /api/employees/:id/salary-config
POST   /api/employees/:id/salary-config
PATCH  /api/employees/:id/salary-config/:configId
```

#### Attendance Records

```
GET    /api/attendance                    # List with filters
POST   /api/attendance                    # Create record
PATCH  /api/attendance/:id                # Update record
DELETE /api/attendance/:id                # Delete record
POST   /api/attendance/import             # Bulk import from fingerprint
```

#### Overtime Records

```
GET    /api/overtime                      # List with filters
POST   /api/overtime                      # Create with technician assignments
PATCH  /api/overtime/:id                  # Update record
DELETE /api/overtime/:id                  # Delete record
```

#### Payroll

```
GET    /api/payroll/periods               # List periods
POST   /api/payroll/periods               # Create new period
GET    /api/payroll/periods/:id           # Period details
POST   /api/payroll/periods/:id/calculate # Trigger calculation
POST   /api/payroll/periods/:id/approve   # Approve payroll
POST   /api/payroll/periods/:id/pay       # Mark as paid

GET    /api/payroll/periods/:id/employees          # List employee payroll
GET    /api/payroll/periods/:id/employees/:empId   # Single employee detail
PATCH  /api/payroll/periods/:id/employees/:empId   # Manual adjustment

GET    /api/payroll/slip/:periodId/:employeeId     # Payslip PDF/data
```

---

## 3. UI Module Integration

### 3.1 Existing Admin Modules

**Location**: `src/admin/modules/`

**Modules to Extend**:

| Module | Integration Point |
|--------|------------------|
| `employees.js` | Add salary config tab |
| `dashboard.js` | Add payroll summary widget |
| `settings.js` | Add salary settings section |

### 3.2 New Modules Required

| Module | Description |
|--------|-------------|
| `attendance.js` | Manage daily attendance/late records |
| `overtime.js` | Manage overtime events |
| `payroll.js` | Monthly payroll calculation & approval |
| `payslip.js` | View/print individual payslips |

### 3.3 Navigation Structure

```html
<!-- Add to sidebar in admin/index.html -->
<li class="nav-item">
    <a class="nav-link" data-target="hr-menu" data-bs-toggle="collapse">
        <i class="bi bi-people"></i> HR & Payroll
    </a>
    <div class="collapse" id="hr-menu">
        <ul class="nav flex-column ms-3">
            <li><a data-target="attendance-content">Kehadiran</a></li>
            <li><a data-target="overtime-content">Lembur</a></li>
            <li><a data-target="payroll-content">Penggajian</a></li>
        </ul>
    </div>
</li>
```

---

## 4. Data Flow Diagrams

### 4.1 Attendance → Payroll

```
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│  Fingerprint     │────>│ attendance_records │────>│ payroll_line_    │
│  System / Manual │     │ (daily entries)    │     │ items (DED_ABSEN)│
└──────────────────┘     └────────────────────┘     └──────────────────┘
                                  │
                                  │ Monthly Aggregation
                                  ▼
                         ┌────────────────────┐
                         │ SUM(deduction_amt) │
                         │ for period         │
                         └────────────────────┘
```

### 4.2 Work Orders → Points → Payroll

```
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│   work_orders    │────>│ work_order_        │────>│ payroll_line_    │
│   (completed)    │     │ assignments        │     │ items (DED_POIN) │
└──────────────────┘     │ (points_earned)    │     └──────────────────┘
                         └────────────────────┘
                                  │
                                  │ Monthly SUM vs Target
                                  ▼
                         ┌────────────────────┐
                         │ shortage ×         │
                         │ point_deduction_   │
                         │ rate               │
                         └────────────────────┘
```

### 4.3 Overtime → Payroll

```
┌──────────────────┐     ┌────────────────────┐     ┌──────────────────┐
│ overtime_records │────>│ overtime_          │────>│ payroll_line_    │
│ (events)         │     │ assignments        │     │ items (OVERTIME) │
└──────────────────┘     │ (per-person amt)   │     └──────────────────┘
                         └────────────────────┘
                                  │
                                  │ Monthly SUM
                                  ▼
                         ┌────────────────────┐
                         │ SUM(amount_earned) │
                         │ for period         │
                         └────────────────────┘
```

### 4.4 Complete Payroll Calculation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PAYROLL CALCULATION                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUTS                         CALCULATION              OUTPUT              │
│  ──────                         ───────────              ──────              │
│                                                                              │
│  ┌───────────────────┐                                                       │
│  │employee_salary_   │──┐                                                    │
│  │configs            │  │                                                    │
│  └───────────────────┘  │    ┌────────────────────┐   ┌──────────────────┐  │
│                         ├───>│ Calculate Gross    │──>│ payroll_line_    │  │
│  ┌───────────────────┐  │    │ (fixed allowances) │   │ items (EARNINGS) │  │
│  │employees          │──┤    └────────────────────┘   └──────────────────┘  │
│  │(base_salary)      │  │                                                    │
│  └───────────────────┘  │                                                    │
│                         │                                                    │
│  ┌───────────────────┐  │    ┌────────────────────┐   ┌──────────────────┐  │
│  │overtime_          │──┼───>│ Aggregate Overtime │──>│ payroll_line_    │  │
│  │assignments        │  │    └────────────────────┘   │ items (OVERTIME) │  │
│  └───────────────────┘  │                             └──────────────────┘  │
│                         │                                                    │
│  ┌───────────────────┐  │    ┌────────────────────┐   ┌──────────────────┐  │
│  │attendance_records │──┼───>│ Aggregate Late     │──>│ payroll_line_    │  │
│  └───────────────────┘  │    │ Deductions         │   │ items (DED_ABSEN)│  │
│                         │    └────────────────────┘   └──────────────────┘  │
│                         │                                                    │
│  ┌───────────────────┐  │    ┌────────────────────┐   ┌──────────────────┐  │
│  │work_order_        │──┼───>│ Calculate Point    │──>│ payroll_line_    │  │
│  │assignments        │  │    │ Shortage           │   │ items (DED_POIN) │  │
│  └───────────────────┘  │    └────────────────────┘   └──────────────────┘  │
│                         │                                                    │
│  ┌───────────────────┐  │    ┌────────────────────┐   ┌──────────────────┐  │
│  │payroll_           │──┘───>│ Apply Manual       │──>│ payroll_line_    │  │
│  │adjustments        │       │ Adjustments        │   │ items (DED_OTHER)│  │
│  └───────────────────┘       └────────────────────┘   └──────────────────┘  │
│                                                                              │
│                              ┌────────────────────┐   ┌──────────────────┐  │
│                              │ Sum All Line Items │──>│ payroll_summaries│  │
│                              │ → Take Home Pay    │   └──────────────────┘  │
│                              └────────────────────┘                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. RLS Policies

### 5.1 Access Matrix

| Table | Employee (Self) | HR | Admin | Owner |
|-------|-----------------|-----|-------|-------|
| `employee_salary_configs` | SELECT | ALL | ALL | ALL |
| `attendance_records` | SELECT | ALL | ALL | ALL |
| `overtime_records` | SELECT | ALL | ALL | ALL |
| `overtime_assignments` | SELECT | ALL | ALL | ALL |
| `payroll_periods` | SELECT | ALL | ALL | ALL |
| `payroll_line_items` | SELECT (own) | ALL | ALL | ALL |
| `payroll_summaries` | SELECT (own) | ALL | ALL | ALL |
| `payroll_adjustments` | SELECT (own) | ALL | ALL | ALL |

### 5.2 Policy Implementation

```sql
-- Example: Employees can view their own payroll items
CREATE POLICY "Employee view own payroll" ON payroll_line_items
    FOR SELECT
    USING (employee_id = auth.uid());

-- HR and Admin can manage all
CREATE POLICY "HR manages payroll" ON payroll_line_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE e.id = auth.uid()
            AND r.code IN ('HR', 'S_ADM', 'OWNER')
        )
    );
```

---

## 6. Cron Jobs / Scheduled Tasks

### 6.1 Auto-Create Payroll Period

```javascript
// Vercel Cron: First day of each month at 00:00
// api/cron/create-payroll-period.js

export async function GET(request) {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;  // 1-indexed
    
    // Create new payroll period
    await supabaseAdmin.from('payroll_periods').insert({
        year,
        month,
        period_start: `${year}-${month.toString().padStart(2, '0')}-01`,
        period_end: new Date(year, month, 0).toISOString().split('T')[0],
        status: 'draft'
    });
}
```

### 6.2 Reminder for Pending Payroll

```javascript
// Vercel Cron: 25th of each month at 09:00
// api/cron/payroll-reminder.js

export async function GET(request) {
    const { data: pendingPeriods } = await supabaseAdmin
        .from('payroll_periods')
        .select('*')
        .eq('status', 'draft');
    
    if (pendingPeriods.length > 0) {
        // Send notification to HR/Admin
        await sendNotification('hr@company.com', 'Payroll pending for approval');
    }
}
```

---

## 7. Notification Integration

### 7.1 Existing Fonnte Integration

**Location**: `api/_lib/fonnte.js`

**New Notifications**:

| Event | Recipient | Message |
|-------|-----------|---------|
| Payroll Calculated | HR Admin | "Payroll {period} ready for review" |
| Payroll Approved | All Employees | "Your salary for {period} has been approved" |
| Payroll Paid | Employee | "Your salary Rp {amount} has been transferred" |

### 7.2 Implementation

```javascript
// In api/payroll/periods/[id]/approve.js
import { sendWhatsApp } from '../../_lib/fonnte.js';

// After approval
const employees = await getEmployeesForPeriod(periodId);
for (const emp of employees) {
    await sendWhatsApp(emp.phone, 
        `Gaji Anda untuk periode ${period.month}/${period.year} telah disetujui. ` +
        `Take Home Pay: Rp ${emp.takeHomePay.toLocaleString('id-ID')}`
    );
}
```

---

## 8. Migration Strategy

### 8.1 Phase 1: Schema Setup

1. Run migrations to create new tables
2. Add settings to `app_settings`
3. Update employees table with new columns

### 8.2 Phase 2: Data Import

1. Import historical salary configs from raw data
2. Import attendance records (if available)
3. Import overtime records

### 8.3 Phase 3: API Development

1. Implement salary config endpoints
2. Implement attendance endpoints
3. Implement overtime endpoints
4. Implement payroll endpoints

### 8.4 Phase 4: UI Development

1. Build attendance module
2. Build overtime module
3. Build payroll module
4. Add payroll widgets to dashboard

### 8.5 Phase 5: Testing & Go-Live

1. Test full payroll cycle with sample data
2. Validate calculations against raw sample data
3. Train HR staff on new system
4. Go live for next payroll period

---

## Next Steps

→ See [08-salary-calculation-flow.md](./08-salary-calculation-flow.md) for detailed calculation process
→ Refer to [03-data-model-proposal.md](./03-data-model-proposal.md) for SQL migrations
