# 01 - Entity Definitions

> Normalized entities extracted from raw salary data for the Employee Salary System.

---

## 1. Employee (Karyawan)

**Source**: Existing `employees` table + `sample_data_gaji_employee.md`

**Purpose**: Core employee master data linked to salary configuration.

| Field | Type | Source Column | Description |
|-------|------|---------------|-------------|
| `id` | UUID | (existing) | Primary key |
| `employee_id` | TEXT | ID column prefix | Unique employee code (e.g., "EMP001") |
| `name` | TEXT | NAMA KARYAWAN | Full name |
| `position` | TEXT | (existing) | Job title/position |
| `status` | TEXT | (existing) | Aktif / Tidak Aktif |
| `join_date` | DATE | (existing) | Employment start date |
| `bpjs` | TEXT | (existing) | BPJS enrollment status |
| `role_id` | UUID | (existing) | FK to roles table |

**Identified Employees from Sample Data**:
- Fungki Gunawan (has Tunj. Jabatan 200k, Tunj. Tambahan 200k → likely supervisor)
- Holilur Abdul Rahman
- Slaman
- Feri
- Aulia Farida
- Ali Wafa

---

## 2. Employee Salary Config (Konfigurasi Gaji)

**Source**: `sample_data_gaji_employee.md` columns

**Purpose**: Per-employee salary components that remain constant month-to-month (unless updated).

| Field | Type | Source Column | Description |
|-------|------|---------------|-------------|
| `id` | UUID | — | Primary key |
| `employee_id` | UUID | FK | Links to employees table |
| `base_salary` | INTEGER | Gaji Pokok | Base monthly salary (IDR) |
| `position_allowance` | INTEGER | Tunj. Jabatan | Position/role allowance |
| `additional_allowance` | INTEGER | Tunj. Tambahan | Additional fixed allowance |
| `quota_allowance` | INTEGER | Tunj. Kuota | Internet quota allowance |
| `education_allowance` | INTEGER | Pendidikan | Education allowance |
| `transport_meal_allowance` | INTEGER | Transport & Makan | Transport + meal allowance |
| `bpjs_company_contribution` | INTEGER | BPJS Ketenagakerjaan | Company BPJS contribution |
| `effective_from` | DATE | — | Config effective start date |
| `effective_to` | DATE | — | Config effective end date (NULL = current) |

**Sample Values Extracted**:

| Employee | Gaji Pokok | Tunj. Jabatan | Tunj. Tambahan | Tunj. Kuota | Pendidikan | Transport & Makan |
|----------|------------|---------------|----------------|-------------|------------|-------------------|
| Fungki Gunawan | 1,200,000 | 200,000 | 200,000 | 100,000 | 100,000 | 600,000 |
| Holilur Abdul Rahman | 1,200,000 | 100,000 | 0 | 100,000 | 100,000 | 600,000 |
| Slaman | 1,200,000 | 100,000 | 0 | 100,000 | 100,000 | 600,000 |
| Feri | 1,200,000 | 100,000 | 0 | 100,000 | 100,000 | 600,000 |
| Aulia Farida | 1,200,000 | 100,000 | 0 | 100,000 | 100,000 | 600,000 |
| Ali Wafa | 1,200,000 | 100,000 | 0 | 100,000 | 100,000 | 600,000 |

---

## 3. Attendance Record (Catatan Kehadiran)

**Source**: `sample_data_perhitungan_terlambat.md`

**Purpose**: Individual late arrival events with deduction calculation.

| Field | Type | Source Column | Description |
|-------|------|---------------|-------------|
| `id` | UUID | ID prefix | Primary key |
| `employee_id` | UUID | Nama | FK to employees |
| `date` | DATE | Tanggal | Date of occurrence |
| `check_in_time` | TIME | Terlambat | Actual check-in time |
| `late_minutes` | INTEGER | Total Telat (calculated) | Minutes late (converted from HH:MM) |
| `deduction_amount` | INTEGER | Potongan | Calculated deduction (IDR) |
| `is_absent` | BOOLEAN | (derived) | TRUE if no check-in (max deduction) |
| `created_at` | TIMESTAMPTZ | — | Record creation timestamp |

**Business Rules**:
- Work start time: 08:00
- Late threshold: Any check-in after 08:00
- Max deduction per day: Rp 20,000
- Absent (no check-in) = automatic Rp 20,000

**Sample Records**:

| Employee | Date | Check-in | Late (mins) | Deduction |
|----------|------|----------|-------------|-----------|
| Fungki Gunawan | 2025-08-01 | 08:36 | 36 | Rp 6,000 |
| Fungki Gunawan | 2025-08-04 | 09:36 | 96 | Rp 16,000 |
| Slaman | 2025-09-09 | (absent) | — | Rp 20,000 |

---

## 4. Overtime Record (Catatan Lembur)

**Source**: `sample_data_perhitunngan_lembur.md`

**Purpose**: Overtime work events, supports multiple technicians per event.

| Field | Type | Source Column | Description |
|-------|------|---------------|-------------|
| `id` | UUID | No. | Primary key |
| `date` | DATE | Tanggal | Date of overtime |
| `description` | TEXT | Keterangan Lembur | Work description (PSB, Tarik Kabel, Perbaikan Backbone) |
| `start_time` | TIME | In Lembur | Overtime start time |
| `end_time` | TIME | Out Lembur | Overtime end time |
| `total_hours` | DECIMAL(4,2) | Total Lembur | Calculated hours |
| `hourly_rate` | INTEGER | — | Rate per hour (default: Rp 10,000) |
| `total_amount` | INTEGER | Honor Lembur | Total overtime pay (all technicians) |
| `work_order_id` | UUID | (optional) | FK to work_orders if linked |
| `created_at` | TIMESTAMPTZ | — | Record creation timestamp |

**Sample Records**:

| No | Date | Description | Duration | Amount | Technicians |
|----|------|-------------|----------|--------|-------------|
| 1 | 2025-11-05 | Tarik Kabel | 0.50 hrs | Rp 5,000 | Fungki, Feri |
| 3 | 2025-11-11 | Perbaikan Backbone | 7.17 hrs | Rp 71,667 | Fungki, Holilur, Slaman, Feri |
| 14 | 2026-01-04 | Backbone | 4.80 hrs | Rp 48,000 | Fungki, Ali Wafa, Feri, Slaman |

---

## 5. Overtime Assignment (Penugasan Lembur)

**Source**: `sample_data_perhitunngan_lembur.md` (Teknisi 1-4 columns)

**Purpose**: Junction table linking overtime records to individual technicians.

| Field | Type | Source Column | Description |
|-------|------|---------------|-------------|
| `id` | UUID | — | Primary key |
| `overtime_id` | UUID | FK | Links to overtime_records |
| `employee_id` | UUID | Teknisi N | FK to employees |
| `amount_earned` | INTEGER | (calculated) | Individual overtime pay |
| `created_at` | TIMESTAMPTZ | — | Record creation timestamp |

**Calculation**: `amount_earned = overtime_record.total_amount / technician_count`

---

## 6. Point Deduction Record (Catatan Potongan Poin)

**Source**: `sample_data_point_deduction.md`

**Purpose**: Monthly summary of point shortfall and resulting deductions.

| Field | Type | Source Column | Description |
|-------|------|---------------|-------------|
| `id` | UUID | No. | Primary key |
| `employee_id` | UUID | Nama | FK to employees |
| `year` | INTEGER | Tahun | Year |
| `month` | TEXT | Bulan | Month name |
| `target_points` | INTEGER | (calculated) | Expected monthly points |
| `actual_points` | INTEGER | (calculated) | Points earned from work orders |
| `point_shortage` | INTEGER | Kekurangan Poin | Negative = shortage |
| `deduction_rate` | INTEGER | — | Rate per point (default: Rp 11,600) |
| `deduction_amount` | INTEGER | Bonus & Potongan | Total deduction (IDR) |
| `created_at` | TIMESTAMPTZ | — | Record creation timestamp |

**Sample Records**:

| Employee | Period | Shortage | Deduction |
|----------|--------|----------|-----------|
| Fungki Gunawan | Jan 2025 | -9 | -Rp 106,333 |
| Feri | Nov 2025 | -16 | -Rp 183,667 |
| Slaman | Nov 2025 | -24 | -Rp 274,533 |
| Ali Wafa | Jan 2026 | -20 | -Rp 228,133 |
| Feri | Jan 2026 | -38 | -Rp 444,667 |

---

## 7. Payroll Period (Periode Penggajian)

**Source**: `sample_data_gaji_employee.md` (Tahun + Bulan columns)

**Purpose**: Monthly payroll calculation scope.

| Field | Type | Source Column | Description |
|-------|------|---------------|-------------|
| `id` | UUID | — | Primary key |
| `year` | INTEGER | Tahun | Year |
| `month` | INTEGER | Bulan | Month (1-12) |
| `period_start` | DATE | — | First day of month |
| `period_end` | DATE | — | Last day of month |
| `status` | TEXT | — | draft / calculated / approved / paid |
| `calculated_at` | TIMESTAMPTZ | — | When payroll was calculated |
| `approved_by` | UUID | — | FK to employees (approver) |
| `approved_at` | TIMESTAMPTZ | — | When approved |
| `created_at` | TIMESTAMPTZ | — | Record creation timestamp |

**Periods Identified**:
- Oktober 2025
- November 2025
- Desember 2025
- Januari 2026

---

## 8. Payroll Line Item (Item Gaji)

**Source**: `sample_data_gaji_employee.md` (all component columns)

**Purpose**: Individual salary components for each employee per payroll period.

| Field | Type | Source Column | Description |
|-------|------|---------------|-------------|
| `id` | UUID | — | Primary key |
| `payroll_period_id` | UUID | FK | Links to payroll_periods |
| `employee_id` | UUID | FK | Links to employees |
| `component_type` | TEXT | — | earning / deduction |
| `component_code` | TEXT | — | Unique code (see below) |
| `component_name` | TEXT | — | Display name |
| `amount` | INTEGER | — | Amount (positive for earnings, negative for deductions) |
| `created_at` | TIMESTAMPTZ | — | Record creation timestamp |

**Component Codes**:

| Code | Name | Type | Source Column |
|------|------|------|---------------|
| `BASE_SALARY` | Gaji Pokok | earning | Gaji Pokok |
| `POS_ALLOWANCE` | Tunjangan Jabatan | earning | Tunj. Jabatan |
| `ADD_ALLOWANCE` | Tunjangan Tambahan | earning | Tunj. Tambahan |
| `QUOTA_ALLOWANCE` | Tunjangan Kuota | earning | Tunj. Kuota |
| `OVERTIME` | Lembur | earning | Lembur |
| `UNUSED_LEAVE` | Libur Tidak Terpakai | earning | Libur Tidak Terpakai |
| `EDUCATION` | Tunjangan Pendidikan | earning | Pendidikan |
| `BONUS_INCENTIVE` | Bonus Insentif/Kinerja | earning | Bonus Insentif / Kinerja |
| `REFERRAL_BONUS` | Ajak Pelanggan | earning | Ajak Pelanggan |
| `THR` | Tunjangan Hari Raya | earning | THR |
| `TRANSPORT_MEAL` | Transport & Makan | earning | Transport & Makan |
| `BPJS_COMPANY` | BPJS Ketenagakerjaan (Company) | earning | BPJS Ketenagakerjaan |
| `DED_BPJS` | Potongan BPJS | deduction | Pot. BPJS Ketenagakerjaan |
| `DED_ATTENDANCE` | Potongan Absen | deduction | Pot. Absen |
| `DED_POINTS` | Potongan Poin | deduction | Pot. Poin |
| `DED_OTHER` | Potongan Lain-lain | deduction | Pot. Lain - Lain |

---

## 9. Manual Adjustment (Penyesuaian Manual)

**Source**: `sample_data_gaji_employee.md` (Pot. Lain-lain column)

**Purpose**: Ad-hoc deductions or bonuses not covered by standard components.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `payroll_period_id` | UUID | FK to payroll_periods |
| `employee_id` | UUID | FK to employees |
| `adjustment_type` | TEXT | bonus / deduction |
| `amount` | INTEGER | Adjustment amount |
| `reason` | TEXT | Explanation |
| `approved_by` | UUID | FK to employees (approver) |
| `created_at` | TIMESTAMPTZ | Record creation timestamp |

**Example**: Aulia Farida November 2025 has Pot. Lain-lain = Rp 500,000

---

## Entity Relationship Summary

```
┌─────────────────┐     ┌──────────────────────┐
│   employees     │────<│ employee_salary_config│
└────────┬────────┘     └──────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐     ┌──────────────────────┐
│attendance_records│    │   overtime_records   │
└─────────────────┘     └──────────┬───────────┘
                                   │ 1:N
                                   ▼
                        ┌──────────────────────┐
                        │ overtime_assignments │
                        └──────────────────────┘

┌─────────────────┐     ┌──────────────────────┐
│ payroll_periods │────<│  payroll_line_items  │
└─────────────────┘     └──────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│manual_adjustments│
└─────────────────┘

┌─────────────────┐
│point_deductions │ (monthly summary, derived from work_order_assignments)
└─────────────────┘
```

---

## Next Steps

→ See [02-calculation-rules.md](./02-calculation-rules.md) for business logic formulas
→ See [03-data-model-proposal.md](./03-data-model-proposal.md) for SQL schema definitions
