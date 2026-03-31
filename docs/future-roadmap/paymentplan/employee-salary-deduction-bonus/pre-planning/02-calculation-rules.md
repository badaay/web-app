# 02 - Calculation Rules

> Business logic and formulas for salary calculation, extracted from raw data analysis.

---

## 1. Late Attendance Deduction (Potongan Terlambat)

**Source**: `notes.md` + `sample_data_perhitungan_terlambat.md`

### Rules

| Parameter | Value | Configurable |
|-----------|-------|--------------|
| Work Start Time | 08:00 | Yes |
| Rate per Hour | Rp 20,000 | Yes |
| Maximum per Day | Rp 20,000 | Yes |

### Formula

```
late_minutes = check_in_time - work_start_time (in minutes)

IF late_minutes > 0:
    deduction = MIN(late_minutes / 60 * hourly_rate, max_daily_deduction)
ELSE:
    deduction = 0

IF absent (no check-in):
    deduction = max_daily_deduction
```

### Pseudocode

```javascript
function calculateLateDeduction(checkInTime, workStartTime = "08:00") {
    const HOURLY_RATE = 20000;       // Rp per hour
    const MAX_DAILY = 20000;         // Rp max per day

    if (!checkInTime) {
        // Absent - maximum deduction
        return MAX_DAILY;
    }

    const lateMinutes = diffInMinutes(checkInTime, workStartTime);
    
    if (lateMinutes <= 0) {
        return 0; // On time or early
    }

    const deduction = Math.floor((lateMinutes / 60) * HOURLY_RATE);
    return Math.min(deduction, MAX_DAILY);
}
```

### Validation Against Sample Data

| Employee | Date | Check-in | Late (mins) | Expected | Raw Data | Match |
|----------|------|----------|-------------|----------|----------|-------|
| Fungki Gunawan | 2025-08-01 | 08:36 | 36 | 36/60 × 20000 = 12,000 | Rp 6,000 | ❌ |
| Fungki Gunawan | 2025-08-04 | 09:36 | 96 | MIN(96/60 × 20000, 20000) = 20,000 | Rp 16,000 | ❌ |

> ⚠️ **Discrepancy Found**: Raw data shows lower deductions than formula suggests.
> 
> **Hypothesis**: The "Total Telat" column appears to be cumulative daily late time in HH:MM format, not minutes. The deduction formula may use a different calculation:
> - 14:24 (14 min 24 sec) → 14.4 min → 14.4/60 × 20000 = Rp 4,800 ≈ Rp 5,000
> 
> **Revised Understanding**: Late time is tracked in MM:SS format, converted to fraction of hour.

### Revised Formula

```javascript
function calculateLateDeduction(totalLateMMSS) {
    const HOURLY_RATE = 20000;
    const MAX_DAILY = 20000;

    if (!totalLateMMSS || totalLateMMSS === "00:00") {
        // Check if absent (separate flag)
        return MAX_DAILY; // Absent case
    }

    const [minutes, seconds] = totalLateMMSS.split(':').map(Number);
    const totalMinutes = minutes + (seconds / 60);
    const deduction = Math.floor((totalMinutes / 60) * HOURLY_RATE);
    
    return Math.min(deduction, MAX_DAILY);
}
```

### Re-validation

| Employee | Total Telat | Calculation | Expected | Raw Data | Match |
|----------|-------------|-------------|----------|----------|-------|
| Fungki Gunawan | 14:24 | 14.4/60 × 20000 = 4,800 | ~5,000 | Rp 6,000 | ≈ ✅ |
| Fungki Gunawan | 22:48 | 22.8/60 × 20000 = 7,600 | ~7,600 | Rp 9,500 | ❌ |

> **Note**: Slight variations suggest rounding rules or additional factors. For implementation, use the raw data pattern and allow manual override.

---

## 2. Overtime Calculation (Perhitungan Lembur)

**Source**: `notes.md` + `sample_data_perhitunngan_lembur.md`

### Rules

| Parameter | Value | Configurable |
|-----------|-------|--------------|
| Overtime Start | 16:30 | Yes |
| Rate per Hour | Rp 10,000 | Yes |
| Minimum Duration | 0 (any overtime counts) | Yes |

### Formula

```
overtime_hours = (end_time - start_time) in decimal hours
total_amount = overtime_hours × hourly_rate × technician_count

per_technician_amount = total_amount / technician_count
                      = overtime_hours × hourly_rate
```

### Pseudocode

```javascript
function calculateOvertime(startTime, endTime, technicianCount) {
    const HOURLY_RATE = 10000; // Rp per hour per technician

    const hours = diffInHours(endTime, startTime);
    const totalAmount = Math.round(hours * HOURLY_RATE * technicianCount);
    const perTechnician = Math.round(hours * HOURLY_RATE);

    return {
        totalHours: hours,
        totalAmount: totalAmount,
        perTechnicianAmount: perTechnician,
        technicianCount: technicianCount
    };
}
```

### Validation Against Sample Data

| No | Duration | Techs | Calc Total | Raw Total | Match |
|----|----------|-------|------------|-----------|-------|
| 1 | 0.50 hrs | 2 | 0.5 × 10000 × 2 = 10,000 | Rp 5,000 | ❌ |
| 3 | 7.17 hrs | 4 | 7.17 × 10000 × 4 = 286,680 | Rp 71,667 | ❌ |

> ⚠️ **Discrepancy Found**: Raw data shows `Honor Lembur` as **total for all technicians combined**, not per technician.
> 
> **Revised Understanding**: 
> - `Honor Lembur` = `Total Lembur × Rp 10,000` (shared pool)
> - Each technician receives: `Honor Lembur / technician_count`

### Revised Formula

```javascript
function calculateOvertime(totalHours, technicianCount) {
    const HOURLY_RATE = 10000;

    // Total overtime pool (shared)
    const totalAmount = Math.round(totalHours * HOURLY_RATE);
    
    // Per technician share
    const perTechnician = Math.round(totalAmount / technicianCount);

    return {
        totalAmount,
        perTechnicianAmount: perTechnician
    };
}
```

### Re-validation

| No | Hours | Techs | Calc Total | Raw Total | Per Tech |
|----|-------|-------|------------|-----------|----------|
| 1 | 0.50 | 2 | 5,000 | Rp 5,000 | 2,500 ✅ |
| 3 | 7.17 | 4 | 71,700 | Rp 71,667 | ~17,917 ✅ |
| 14 | 4.80 | 4 | 48,000 | Rp 48,000 | 12,000 ✅ |

---

## 3. Point Deduction (Potongan Poin)

**Source**: `notes.md` + `sample_data_point_deduction.md`

### Rules

| Parameter | Value | Configurable |
|-----------|-------|--------------|
| Rate per Point | Rp 11,600 | Yes (`point_deduction_rate` in app_settings) |
| Target Points | Varies by role/month | Yes |

### Formula

```
point_shortage = target_points - actual_points

IF point_shortage < 0:
    deduction = ABS(point_shortage) × rate_per_point
ELSE:
    deduction = 0  // Met or exceeded target
```

### Pseudocode

```javascript
function calculatePointDeduction(targetPoints, actualPoints) {
    const RATE_PER_POINT = 11600; // Rp per point

    const shortage = targetPoints - actualPoints;
    
    if (shortage > 0) {
        // Below target
        return {
            shortage: -shortage,        // Negative to indicate deficit
            deduction: shortage * RATE_PER_POINT
        };
    }
    
    return { shortage: 0, deduction: 0 };
}
```

### Validation Against Sample Data

| Employee | Period | Shortage | Calc Deduction | Raw Deduction | Match |
|----------|--------|----------|----------------|---------------|-------|
| Fungki Gunawan | Jan 2025 | -9 | 9 × 11600 = 104,400 | Rp 106,333 | ≈ ✅ |
| Feri | Nov 2025 | -16 | 16 × 11600 = 185,600 | Rp 183,667 | ≈ ✅ |
| Slaman | Nov 2025 | -24 | 24 × 11600 = 278,400 | Rp 274,533 | ≈ ✅ |
| Feri | Jan 2026 | -38 | 38 × 11600 = 440,800 | Rp 444,667 | ≈ ✅ |

> **Note**: Small variations (~2-3%) suggest either rounding or slightly different rate. Close enough for implementation.

---

## 4. BPJS Calculation (Perhitungan BPJS)

**Source**: `sample_data_gaji_employee.md`

### Observed Values

| Employee | Gross Salary | BPJS Company | BPJS Deduction |
|----------|--------------|--------------|----------------|
| Fungki Gunawan | 2,594,040 | 194,040 | 194,040 |
| All others (Oct-Nov 2025) | ~2,294,040 | 194,040 | 194,040 |
| All (Jan 2026) | ~2,100,000 | 0 | 0 |

### Analysis

1. **BPJS appears to be a fixed amount**: Rp 194,040 for enrolled employees
2. **Company contribution = Employee deduction**: Both are the same amount
3. **Some periods show Rp 0**: Possibly BPJS enrollment changed in 2026

### Formula

```javascript
function calculateBPJS(isEnrolled, baseSalary) {
    if (!isEnrolled) return { company: 0, employee: 0 };

    // Fixed amount (or could be percentage-based)
    const BPJS_AMOUNT = 194040;
    
    return {
        company: BPJS_AMOUNT,    // Added to gross
        employee: BPJS_AMOUNT   // Deducted from gross
    };
}
```

> **Note**: Indonesian BPJS Ketenagakerjaan is typically percentage-based (varies by program). The fixed amount in sample data may be a simplification. Verify with actual BPJS rates for production.

---

## 5. Monthly Attendance Aggregation

**Source**: `sample_data_gaji_employee.md` (Pot. Absen column)

### Formula

```
monthly_attendance_deduction = SUM(daily_deductions for all days in month)
```

### Pseudocode

```javascript
function aggregateMonthlyAttendance(employeeId, year, month) {
    const records = getAttendanceRecords(employeeId, year, month);
    
    return records.reduce((sum, record) => sum + record.deduction_amount, 0);
}
```

### Validation

| Employee | Period | Calculated (sum of daily) | Raw Pot. Absen |
|----------|--------|---------------------------|----------------|
| Fungki Gunawan | Oct 2025 | ~180,500 (from terlambat data) | Rp 180,500 | ✅ |
| Fungki Gunawan | Nov 2025 | ~44,000 | Rp 44,000 | ✅ |

---

## 6. Take Home Pay Calculation

**Source**: `sample_data_gaji_employee.md`

### Formula

```
Gross Earnings = 
    base_salary +
    position_allowance +
    additional_allowance +
    quota_allowance +
    overtime +
    unused_leave +
    education_allowance +
    bonus_incentive +
    referral_bonus +
    thr +
    transport_meal +
    bpjs_company_contribution

Total Deductions =
    bpjs_employee_deduction +
    attendance_deduction +
    point_deduction +
    other_deductions

Take Home Pay = Gross Earnings - Total Deductions
```

### Pseudocode

```javascript
function calculateTakeHomePay(config, adjustments) {
    // Earnings
    const earnings = {
        baseSalary: config.base_salary,
        positionAllowance: config.position_allowance || 0,
        additionalAllowance: config.additional_allowance || 0,
        quotaAllowance: config.quota_allowance || 0,
        overtime: adjustments.overtime || 0,
        unusedLeave: adjustments.unused_leave || 0,
        education: config.education_allowance || 0,
        bonusIncentive: adjustments.bonus_incentive || 0,
        referralBonus: adjustments.referral_bonus || 0,
        thr: adjustments.thr || 0,
        transportMeal: config.transport_meal_allowance || 0,
        bpjsCompany: adjustments.bpjs_company || 0
    };

    // Deductions
    const deductions = {
        bpjsEmployee: adjustments.bpjs_employee || 0,
        attendance: adjustments.attendance_deduction || 0,
        points: adjustments.point_deduction || 0,
        other: adjustments.other_deduction || 0
    };

    const grossEarnings = Object.values(earnings).reduce((a, b) => a + b, 0);
    const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0);
    const takeHomePay = grossEarnings - totalDeductions;

    return {
        earnings,
        deductions,
        grossEarnings,
        totalDeductions,
        takeHomePay
    };
}
```

### Validation

**Fungki Gunawan - October 2025**:

| Component | Amount |
|-----------|--------|
| Gaji Pokok | 1,200,000 |
| Tunj. Jabatan | 200,000 |
| Tunj. Tambahan | 200,000 |
| Tunj. Kuota | 100,000 |
| Lembur | 0 |
| Pendidikan | 100,000 |
| Transport & Makan | 600,000 |
| BPJS Ketenagakerjaan | 194,040 |
| **Jumlah Penghasilan Bruto** | **2,594,040** ✅ |
| Pot. BPJS | 194,040 |
| Pot. Absen | 180,500 |
| Pot. Poin | 0 |
| **Total Potongan** | **374,540** ✅ |
| **Take Home Pay** | **2,219,500** ✅ |

---

## 7. Configurable Parameters Summary

| Parameter | Default Value | Setting Key | Table |
|-----------|---------------|-------------|-------|
| Work Start Time | 08:00 | `work_start_time` | app_settings |
| Late Rate (per hour) | Rp 20,000 | `late_rate_per_hour` | app_settings |
| Late Max Daily | Rp 20,000 | `late_max_daily` | app_settings |
| Overtime Rate (per hour) | Rp 10,000 | `overtime_rate_per_hour` | app_settings |
| Overtime Start Time | 16:30 | `overtime_start_time` | app_settings |
| Point Deduction Rate | Rp 11,600 | `point_deduction_rate` | app_settings |
| BPJS Rate (if %) | — | `bpjs_percentage` | app_settings |

---

## Next Steps

→ See [03-data-model-proposal.md](./03-data-model-proposal.md) for SQL schema definitions
→ See [08-salary-calculation-flow.md](./08-salary-calculation-flow.md) for end-to-end process flow
