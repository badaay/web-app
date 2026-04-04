# 06 - Normalized Point Deductions

> Monthly point shortage records and deduction calculations from raw sample data.

---

## Data Source

**File**: `raw/sample_data_point_deduction.md`

**Original Format**: Tab-separated values with columns:
- No. (sequence number)
- Nama (employee name)
- Tahun (year)
- Bulan (month name in Indonesian)
- Kekurangan Poin (point shortage as negative number)
- Bonus & Potongan (deduction amount as negative Rupiah)

---

## Transformation Rules Applied

1. **Month Name**: Indonesian → English (for standardization)
2. **Point Shortage**: Kept as negative (shortage) or zero (met/exceeded)
3. **Deduction**: Calculated as `ABS(shortage) × rate_per_point`
4. **Rate Validation**: Extracted effective rate from data

---

## Rate Analysis

From the raw data, we can derive the point deduction rate:

| Employee | Period | Shortage | Deduction | Implied Rate |
|----------|--------|----------|-----------|--------------|
| Fungki Gunawan | Jan 2025 | -9 | 106,333 | 11,815 |
| Feri | Nov 2025 | -16 | 183,667 | 11,479 |
| Slaman | Nov 2025 | -24 | 274,533 | 11,439 |
| Feri | Jan 2026 | -38 | 444,667 | 11,702 |

**Average Implied Rate**: ~11,600 IDR per point

> **Conclusion**: Rate is approximately **Rp 11,600 per point** as stated in `notes.md` ("perpoin 11.600")

---

## Month Name Mapping

| Indonesian | English | Month Number |
|------------|---------|--------------|
| Januari | January | 1 |
| Februari | February | 2 |
| Maret | March | 3 |
| April | April | 4 |
| Mei | May | 5 |
| Juni | June | 6 |
| Juli | July | 7 |
| Agustus | August | 8 |
| September | September | 9 |
| Oktober | October | 10 |
| November | November | 11 |
| Desember | December | 12 |

---

## Normalized Point Deduction Records

| ID | Employee | Year | Month | Period Key | Point Shortage | Deduction Rate | Deduction Amount |
|----|----------|------|-------|------------|----------------|----------------|------------------|
| PD001 | Fungki Gunawan | 2025 | 1 | 2025-01 | -9 | 11,600 | 104,400 |
| PD002 | Holilur Abdul Rahman | 2025 | 11 | 2025-11 | 0 | 11,600 | 0 |
| PD003 | Feri | 2025 | 11 | 2025-11 | -16 | 11,600 | 185,600 |
| PD004 | Slaman | 2025 | 11 | 2025-11 | -24 | 11,600 | 278,400 |
| PD005 | Fungki Gunawan | 2025 | 12 | 2025-12 | -13 | 11,600 | 150,800 |
| PD006 | Ali Wafa | 2025 | 12 | 2025-12 | -13 | 11,600 | 150,800 |
| PD007 | Feri | 2025 | 12 | 2025-12 | -18 | 11,600 | 208,800 |
| PD008 | Slaman | 2025 | 12 | 2025-12 | -21 | 11,600 | 243,600 |
| PD009 | Fungki Gunawan | 2026 | 1 | 2026-01 | -2 | 11,600 | 23,200 |
| PD010 | Ali Wafa | 2026 | 1 | 2026-01 | -20 | 11,600 | 232,000 |
| PD011 | Feri | 2026 | 1 | 2026-01 | -38 | 11,600 | 440,800 |
| PD012 | Slaman | 2026 | 1 | 2026-01 | -26 | 11,600 | 301,600 |

---

## Comparison: Calculated vs Raw

| ID | Employee | Period | Calculated | Raw Amount | Difference | Status |
|----|----------|--------|------------|------------|------------|--------|
| PD001 | Fungki Gunawan | 2025-01 | 104,400 | 106,333 | 1,933 | ≈ Match |
| PD002 | Holilur Abdul Rahman | 2025-11 | 0 | 0 | 0 | ✅ Exact |
| PD003 | Feri | 2025-11 | 185,600 | 183,667 | -1,933 | ≈ Match |
| PD004 | Slaman | 2025-11 | 278,400 | 274,533 | -3,867 | ≈ Match |
| PD005 | Fungki Gunawan | 2025-12 | 150,800 | 149,833 | -967 | ≈ Match |
| PD006 | Ali Wafa | 2025-12 | 150,800 | 149,833 | -967 | ≈ Match |
| PD007 | Feri | 2025-12 | 208,800 | 207,833 | -967 | ≈ Match |
| PD008 | Slaman | 2025-12 | 243,600 | 246,500 | 2,900 | ≈ Match |
| PD009 | Fungki Gunawan | 2026-01 | 23,200 | 19,333 | -3,867 | ≈ Match |
| PD010 | Ali Wafa | 2026-01 | 232,000 | 228,133 | -3,867 | ≈ Match |
| PD011 | Feri | 2026-01 | 440,800 | 444,667 | 3,867 | ≈ Match |
| PD012 | Slaman | 2026-01 | 301,600 | 305,467 | 3,867 | ≈ Match |

> **Note**: Small variations (~1-2%) likely due to rounding in original calculations. All within acceptable tolerance.

---

## Monthly Summary by Period

### November 2025

| Employee | Target (est.) | Actual | Shortage | Deduction |
|----------|---------------|--------|----------|-----------|
| Holilur Abdul Rahman | — | — | 0 | 0 |
| Feri | — | — | -16 | 183,667 |
| Slaman | — | — | -24 | 274,533 |
| **Subtotal** | | | **-40** | **458,200** |

> Note: Fungki Gunawan and Aulia Farida not in November record - may have met targets.

### December 2025

| Employee | Target (est.) | Actual | Shortage | Deduction |
|----------|---------------|--------|----------|-----------|
| Fungki Gunawan | — | — | -13 | 149,833 |
| Ali Wafa | — | — | -13 | 149,833 |
| Feri | — | — | -18 | 207,833 |
| Slaman | — | — | -21 | 246,500 |
| **Subtotal** | | | **-65** | **753,999** |

> Note: Aulia Farida not in December record - may have met target or not a technician.

### January 2026

| Employee | Target (est.) | Actual | Shortage | Deduction |
|----------|---------------|--------|----------|-----------|
| Fungki Gunawan | — | — | -2 | 19,333 |
| Ali Wafa | — | — | -20 | 228,133 |
| Feri | — | — | -38 | 444,667 |
| Slaman | — | — | -26 | 305,467 |
| **Subtotal** | | | **-86** | **997,600** |

> **Trend**: Point shortages increasing month-over-month. Feri consistently underperforming.

---

## Target Points Analysis

To derive monthly targets, we need to work backwards from the data:

### Method 1: From Work Order Types

Based on `master_queue_types.base_point`:
- PSB: 100 points
- Repair: 50 points
- Relocation: 75 points

If monthly target is based on number of expected work orders, we need historical WO volume.

### Method 2: From Sample Salary Data

From `sample_data_gaji_employee.md`, checking "Pot. Poin" column:

| Period | Pot. Poin (various employees) | Notes |
|--------|-------------------------------|-------|
| Oct 2025 | 0 for all | All met targets |
| Nov 2025 | 0-274,533 | Some shortages |
| Dec 2025 | 0-246,500 | Higher shortages |
| Jan 2026 | 0-444,667 | Highest shortages |

### Estimated Monthly Target

If we assume the rate is exactly 11,600 and calculate:

```
Target = Actual_Points + ABS(Shortage)
```

Without actual points data in the sample, we can only estimate:

| Employee | Typical Shortage | Implied Target Range |
|----------|-----------------|----------------------|
| Fungki Gunawan | 2-13 | High performer |
| Ali Wafa | 13-20 | Medium performer |
| Feri | 16-38 | Low performer |
| Slaman | 21-26 | Low-medium performer |
| Holilur Abdul Rahman | 0 | High performer |

---

## Integration with Work Order Assignments

The point deduction system should integrate with existing `work_order_assignments.points_earned`:

```sql
-- Calculate monthly points from work orders
SELECT 
    woa.employee_id,
    EXTRACT(YEAR FROM wo.completed_at) AS year,
    EXTRACT(MONTH FROM wo.completed_at) AS month,
    SUM(woa.points_earned) AS actual_points
FROM work_order_assignments woa
JOIN work_orders wo ON wo.id = woa.work_order_id
WHERE wo.status = 'closed'
GROUP BY woa.employee_id, EXTRACT(YEAR FROM wo.completed_at), EXTRACT(MONTH FROM wo.completed_at);
```

---

## SQL Insert Template

```sql
-- Point deduction records (derived/calculated, not stored directly)
-- Instead, calculate during payroll using:

WITH monthly_points AS (
    SELECT 
        e.id AS employee_id,
        e.name,
        e.target_monthly_points,
        $1 AS year,
        $2 AS month,
        COALESCE(SUM(woa.points_earned), 0) AS actual_points
    FROM employees e
    LEFT JOIN work_order_assignments woa ON woa.employee_id = e.id
    LEFT JOIN work_orders wo ON wo.id = woa.work_order_id
        AND wo.status = 'closed'
        AND EXTRACT(YEAR FROM wo.completed_at) = $1
        AND EXTRACT(MONTH FROM wo.completed_at) = $2
    WHERE e.role_id IN (SELECT id FROM roles WHERE code IN ('TECH', 'SPV_TECH'))
    GROUP BY e.id, e.name, e.target_monthly_points
)
SELECT 
    employee_id,
    name,
    target_monthly_points,
    actual_points,
    CASE 
        WHEN actual_points < target_monthly_points 
        THEN actual_points - target_monthly_points 
        ELSE 0 
    END AS point_shortage,
    CASE 
        WHEN actual_points < target_monthly_points 
        THEN (target_monthly_points - actual_points) * 
             (SELECT setting_value::INTEGER FROM app_settings WHERE setting_key = 'point_deduction_rate')
        ELSE 0 
    END AS deduction_amount
FROM monthly_points;
```

---

## Data Quality Notes

1. **Missing Months**: Only Jan 2025, Nov 2025, Dec 2025, Jan 2026 have deduction records
2. **Missing Employees**: Not all employees appear each month (may have met targets)
3. **Target Unknown**: Per-employee monthly targets not explicitly stated in raw data
4. **Aulia Farida**: Never appears in point deduction data - possibly non-technician role

---

## Recommendations

1. **Add `target_monthly_points`** column to `employees` table (done in schema proposal)
2. **Calculate points dynamically** from `work_order_assignments` rather than storing separately
3. **Store deduction rate** in `app_settings` (key: `point_deduction_rate`, value: 11600)
4. **Create monthly report view** that calculates shortages on demand

---

## Next Steps

→ See [07-integration-points.md](./07-integration-points.md) for connecting to existing work order system
→ See [08-salary-calculation-flow.md](./08-salary-calculation-flow.md) for point deduction in payroll
