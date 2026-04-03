# 04 - Normalized Attendance Data

> Transformed late attendance records from raw sample data.

---

## Data Source

**File**: `raw/sample_data_perhitungan_terlambat.md`

**Original Format**: Tab-separated values with columns:
- ID (composite: record_id + employee_name)
- Nama (employee name)
- Tanggal (date in "Day, DD/MM/YYYY" format)
- Terlambat (check-in time in HH:MM)
- Total Telat (cumulative late in MM:SS format)
- Potongan (deduction amount)

---

## Transformation Rules Applied

1. **Date Format**: `DD/MM/YYYY` → `YYYY-MM-DD`
2. **Employee Name**: Normalized to title case, matched to employee master
3. **Check-in Time**: Extracted from "Terlambat" column
4. **Is Absent**: TRUE if check-in is empty and deduction = Rp 20,000
5. **Late Minutes**: Calculated from check-in time - 08:00
6. **Deduction**: Kept as-is from raw data (validated against formula)

---

## Employee Name Mapping

| Raw Name | Normalized Name | Employee ID (proposed) |
|----------|-----------------|------------------------|
| Fungki Gunawan | Fungki Gunawan | EMP001 |
| Holilur Abdul Rahman | Holilur Abdul Rahman | EMP002 |
| Slaman | Slaman | EMP003 |
| Feri / feri | Feri | EMP004 |
| Aulia Farida | Aulia Farida | EMP005 |
| Ali Wafa | Ali Wafa | EMP006 |

---

## Normalized Records

### August 2025

| Date | Employee | Check-in | Late (min) | Is Absent | Deduction |
|------|----------|----------|------------|-----------|-----------|
| 2025-08-01 | Fungki Gunawan | 08:36 | 36 | false | 6,000 |
| 2025-08-01 | Slaman | 08:35 | 35 | false | 5,833 |
| 2025-08-04 | Fungki Gunawan | 09:36 | 96 | false | 16,000 |
| 2025-08-05 | Fungki Gunawan | 09:27 | 87 | false | 14,500 |
| 2025-08-05 | Slaman | 09:27 | 87 | false | 14,500 |
| 2025-08-05 | Holilur Abdul Rahman | 09:27 | 87 | false | 14,500 |
| 2025-08-06 | Holilur Abdul Rahman | 08:24 | 24 | false | 4,000 |
| 2025-08-08 | Slaman | 08:37 | 37 | false | 6,167 |
| 2025-08-08 | Holilur Abdul Rahman | 08:37 | 37 | false | 6,167 |
| 2025-08-11 | Slaman | 08:24 | 24 | false | 4,000 |
| 2025-08-12 | Slaman | 09:29 | 89 | false | 14,833 |
| 2025-08-12 | Holilur Abdul Rahman | 08:29 | 29 | false | 4,833 |
| 2025-08-13 | Holilur Abdul Rahman | 08:23 | 23 | false | 3,833 |
| 2025-08-20 | Fungki Gunawan | 08:43 | 43 | false | 7,167 |
| 2025-08-20 | Feri | 08:43 | 43 | false | 7,167 |
| 2025-08-21 | Fungki Gunawan | 08:34 | 34 | false | 5,667 |
| 2025-08-21 | Feri | 08:34 | 34 | false | 5,667 |
| 2025-08-22 | Fungki Gunawan | 08:25 | 25 | false | 4,167 |
| 2025-08-22 | Feri | 08:25 | 25 | false | 4,167 |
| 2025-08-25 | Holilur Abdul Rahman | 08:25 | 25 | false | 4,167 |
| 2025-08-26 | Fungki Gunawan | 08:43 | 43 | false | 7,167 |
| 2025-08-26 | Feri | 08:43 | 43 | false | 7,167 |
| 2025-08-27 | Fungki Gunawan | 08:43 | 43 | false | 7,167 |
| 2025-08-27 | Feri | 08:43 | 43 | false | 7,167 |
| 2025-08-28 | Fungki Gunawan | 08:57 | 57 | false | 9,500 |
| 2025-08-28 | Feri | 08:57 | 57 | false | 9,500 |
| 2025-08-29 | Fungki Gunawan | 08:56 | 56 | false | 9,333 |
| 2025-08-29 | Feri | 08:55 | 55 | false | 9,167 |

**August 2025 Summary**:
| Employee | Days Late | Days Absent | Total Deduction |
|----------|-----------|-------------|-----------------|
| Fungki Gunawan | 10 | 0 | 86,835 |
| Slaman | 5 | 0 | 45,333 |
| Holilur Abdul Rahman | 6 | 0 | 37,500 |
| Feri | 8 | 0 | 50,002 |

---

### September 2025

| Date | Employee | Check-in | Late (min) | Is Absent | Deduction |
|------|----------|----------|------------|-----------|-----------|
| 2025-09-01 | Feri | 08:38 | 38 | false | 6,333 |
| 2025-09-02 | Fungki Gunawan | 08:25 | 25 | false | 4,167 |
| 2025-09-03 | Fungki Gunawan | 08:50 | 50 | false | 8,333 |
| 2025-09-03 | Slaman | 08:21 | 21 | false | 3,500 |
| 2025-09-03 | Feri | 08:23 | 23 | false | 3,833 |
| 2025-09-05 | Fungki Gunawan | 08:46 | 46 | false | 7,667 |
| 2025-09-08 | Fungki Gunawan | 08:22 | 22 | false | 3,667 |
| 2025-09-09 | Slaman | — | — | **true** | 20,000 |
| 2025-09-09 | Holilur Abdul Rahman | — | — | **true** | 20,000 |
| 2025-09-10 | Fungki Gunawan | 08:29 | 29 | false | 4,833 |
| 2025-09-17 | Fungki Gunawan | 08:25 | 25 | false | 4,167 |
| 2025-09-17 | Slaman | 08:25 | 25 | false | 4,167 |
| 2025-09-17 | Holilur Abdul Rahman | 08:25 | 25 | false | 4,167 |
| 2025-09-17 | Feri | 08:25 | 25 | false | 4,167 |
| 2025-09-24 | Holilur Abdul Rahman | 08:21 | 21 | false | 3,500 |

**September 2025 Summary**:
| Employee | Days Late | Days Absent | Total Deduction |
|----------|-----------|-------------|-----------------|
| Fungki Gunawan | 7 | 0 | 32,834 |
| Slaman | 2 | 1 | 27,667 |
| Holilur Abdul Rahman | 2 | 1 | 27,667 |
| Feri | 4 | 0 | 14,333 |

---

### October 2025

| Date | Employee | Check-in | Late (min) | Is Absent | Deduction |
|------|----------|----------|------------|-----------|-----------|
| 2025-10-03 | Fungki Gunawan | 08:56 | 56 | false | 9,333 |
| 2025-10-03 | Holilur Abdul Rahman | 08:57 | 57 | false | 9,500 |
| 2025-10-03 | Slaman | 08:56 | 56 | false | 9,333 |
| 2025-10-07 | Fungki Gunawan | 10:19 | 139 | false | 20,000 |
| 2025-10-07 | Holilur Abdul Rahman | 08:43 | 43 | false | 7,167 |
| 2025-10-07 | Slaman | 10:19 | 139 | false | 20,000 |
| 2025-10-08 | Fungki Gunawan | 08:30 | 30 | false | 5,000 |
| 2025-10-08 | Slaman | 08:37 | 37 | false | 6,167 |
| 2025-10-13 | Fungki Gunawan | — | — | **true** | 20,000 |
| 2025-10-13 | Slaman | 09:15 | 75 | false | 12,500 |
| 2025-10-14 | Fungki Gunawan | 08:33 | 33 | false | 5,500 |
| 2025-10-14 | Holilur Abdul Rahman | 08:22 | 22 | false | 3,667 |
| 2025-10-15 | Fungki Gunawan | 08:34 | 34 | false | 5,667 |
| 2025-10-16 | Fungki Gunawan | 08:45 | 45 | false | 7,500 |
| 2025-10-17 | Fungki Gunawan | 08:32 | 32 | false | 5,333 |
| 2025-10-17 | Holilur Abdul Rahman | 08:29 | 29 | false | 4,833 |
| 2025-10-17 | Slaman | 08:22 | 22 | false | 3,667 |
| 2025-10-21 | Fungki Gunawan | — | — | **true** | 20,000 |
| 2025-10-22 | Fungki Gunawan | 08:47 | 47 | false | 7,833 |
| 2025-10-23 | Fungki Gunawan | 08:55 | 55 | false | 9,167 |
| 2025-10-23 | Holilur Abdul Rahman | 08:25 | 25 | false | 4,167 |
| 2025-10-24 | Fungki Gunawan | 08:49 | 49 | false | 8,167 |
| 2025-10-24 | Slaman | 08:25 | 25 | false | 4,167 |
| 2025-10-27 | Fungki Gunawan | 08:50 | 50 | false | 8,333 |
| 2025-10-28 | Fungki Gunawan | 08:27 | 27 | false | 4,500 |
| 2025-10-29 | Fungki Gunawan | 09:12 | 72 | false | 12,000 |
| 2025-10-29 | Holilur Abdul Rahman | 08:28 | 28 | false | 4,667 |
| 2025-10-29 | Feri | 08:27 | 27 | false | 4,500 |
| 2025-10-29 | Slaman | 08:28 | 28 | false | 4,667 |
| 2025-10-30 | Fungki Gunawan | — | — | **true** | 20,000 |
| 2025-10-30 | Holilur Abdul Rahman | 09:01 | 61 | false | 10,167 |
| 2025-10-30 | Feri | 09:01 | 61 | false | 10,167 |
| 2025-10-30 | Slaman | 09:01 | 61 | false | 10,167 |
| 2025-10-31 | Fungki Gunawan | 09:13 | 73 | false | 12,167 |
| 2025-10-31 | Holilur Abdul Rahman | 08:23 | 23 | false | 3,833 |
| 2025-10-31 | Feri | 08:21 | 21 | false | 3,500 |
| 2025-10-31 | Slaman | 08:21 | 21 | false | 3,500 |

**October 2025 Summary**:
| Employee | Days Late | Days Absent | Total Deduction |
|----------|-----------|-------------|-----------------|
| Fungki Gunawan | 17 | 3 | 180,500 |
| Holilur Abdul Rahman | 8 | 0 | 48,001 |
| Feri | 3 | 0 | 18,167 |
| Slaman | 9 | 0 | 74,168 |

---

### November 2025

| Date | Employee | Check-in | Late (min) | Is Absent | Deduction |
|------|----------|----------|------------|-----------|-----------|
| 2025-11-03 | Holilur Abdul Rahman | 08:23 | 23 | false | 3,833 |
| 2025-11-04 | Fungki Gunawan | 08:05 | 5 | false | 833 |
| 2025-11-04 | Slaman | 08:10 | 10 | false | 1,667 |
| 2025-11-04 | Aulia Farida | — | — | **true** | 20,000 |
| 2025-11-05 | Fungki Gunawan | 08:09 | 9 | false | 1,500 |
| 2025-11-05 | Slaman | 08:24 | 24 | false | 4,000 |
| 2025-11-05 | Holilur Abdul Rahman | 08:24 | 24 | false | 4,000 |
| 2025-11-05 | Feri | 08:09 | 9 | false | 1,500 |
| 2025-11-11 | Fungki Gunawan | 08:24 | 24 | false | 4,000 |
| 2025-11-11 | Slaman | 08:24 | 24 | false | 4,000 |
| 2025-11-11 | Holilur Abdul Rahman | 08:25 | 25 | false | 4,167 |
| 2025-11-11 | Feri | 08:24 | 24 | false | 4,000 |
| 2025-11-12 | Holilur Abdul Rahman | 08:23 | 23 | false | 3,833 |
| 2025-11-12 | Aulia Farida | 08:25 | 25 | false | 4,167 |
| 2025-11-13 | Fungki Gunawan | 08:05 | 5 | false | 833 |
| 2025-11-13 | Slaman | 08:11 | 11 | false | 1,833 |
| 2025-11-13 | Holilur Abdul Rahman | 08:16 | 16 | false | 2,667 |
| 2025-11-13 | Feri | 08:23 | 23 | false | 3,833 |
| 2025-11-14 | Fungki Gunawan | 09:13 | 73 | false | 12,167 |
| 2025-11-14 | Slaman | 09:13 | 73 | false | 12,167 |
| 2025-11-14 | Holilur Abdul Rahman | 09:13 | 73 | false | 12,167 |
| 2025-11-14 | Feri | 08:29 | 29 | false | 4,833 |
| 2025-11-17 | Fungki Gunawan | 08:22 | 22 | false | 3,667 |
| 2025-11-17 | Slaman | 08:07 | 7 | false | 1,167 |
| 2025-11-17 | Feri | 08:07 | 7 | false | 1,167 |
| 2025-11-18 | Slaman | 08:30 | 30 | false | 5,000 |
| 2025-11-19 | Fungki Gunawan | 08:40 | 40 | false | 6,667 |
| 2025-11-19 | Feri | 08:41 | 41 | false | 6,833 |
| 2025-11-20 | Fungki Gunawan | 08:40 | 40 | false | 6,667 |
| 2025-11-25 | Aulia Farida | — | — | **true** | 20,000 |
| 2025-11-26 | Fungki Gunawan | 08:22 | 22 | false | 3,667 |
| 2025-11-27 | Fungki Gunawan | 08:10 | 10 | false | 1,667 |
| 2025-11-27 | Slaman | 08:10 | 10 | false | 1,667 |
| 2025-11-27 | Feri | 08:10 | 10 | false | 1,667 |
| 2025-11-28 | Fungki Gunawan | 08:14 | 14 | false | 2,333 |
| 2025-11-28 | Slaman | 08:21 | 21 | false | 3,500 |
| 2025-11-28 | Feri | 08:21 | 21 | false | 3,500 |

**November 2025 Summary**:
| Employee | Days Late | Days Absent | Total Deduction |
|----------|-----------|-------------|-----------------|
| Fungki Gunawan | 12 | 0 | 44,001 |
| Slaman | 9 | 0 | 35,001 |
| Holilur Abdul Rahman | 6 | 0 | 30,667 |
| Feri | 8 | 0 | 27,333 |
| Aulia Farida | 1 | 2 | 44,167 |

---

### December 2025

| Date | Employee | Check-in | Late (min) | Is Absent | Deduction |
|------|----------|----------|------------|-----------|-----------|
| 2025-12-01 | Fungki Gunawan | 08:04 | 4 | false | 667 |
| 2025-12-01 | Slaman | 08:31 | 31 | false | 5,167 |
| 2025-12-02 | Fungki Gunawan | — | — | **true** | 20,000 |
| 2025-12-03 | Fungki Gunawan | 08:06 | 6 | false | 1,000 |
| 2025-12-04 | Fungki Gunawan | 09:01 | 61 | false | 10,167 |
| 2025-12-05 | Fungki Gunawan | 08:08 | 8 | false | 1,333 |
| 2025-12-06 | Fungki Gunawan | 08:31 | 31 | false | 5,167 |
| 2025-12-07 | Fungki Gunawan | — | — | **true** | 20,000 |
| 2025-12-08 | Fungki Gunawan | 08:15 | 15 | false | 2,500 |
| 2025-12-09 | Fungki Gunawan | — | — | **true** | 20,000 |
| 2025-12-10 | Fungki Gunawan | 08:14 | 14 | false | 2,333 |
| 2025-12-11 | Fungki Gunawan | 08:39 | 39 | false | 6,500 |
| 2025-12-12 | Fungki Gunawan | 09:33 | 93 | false | 15,500 |
| 2025-12-13 | Fungki Gunawan | — | — | **true** | 20,000 |
| 2025-12-14 | Fungki Gunawan | 09:43 | 103 | false | 17,167 |
| 2025-12-15 | Fungki Gunawan | 08:48 | 48 | false | 8,000 |
| 2025-12-16 | Fungki Gunawan | 08:49 | 49 | false | 8,167 |
| 2025-12-17 | Fungki Gunawan | 08:01 | 1 | false | 167 |
| 2025-12-18 | Fungki Gunawan | 08:22 | 22 | false | 3,667 |
| 2025-12-19 | Fungki Gunawan | 08:18 | 18 | false | 3,000 |
| 2025-12-20 | Fungki Gunawan | 08:11 | 11 | false | 1,833 |
| 2025-12-21 | Fungki Gunawan | — | — | **true** | 20,000 |
| 2025-12-22 | Fungki Gunawan | 08:19 | 19 | false | 3,167 |
| 2025-12-23 | Fungki Gunawan | 08:21 | 21 | false | 3,500 |
| 2025-12-24 | Fungki Gunawan | 08:54 | 54 | false | 9,000 |
| 2025-12-25 | Fungki Gunawan | 08:18 | 18 | false | 3,000 |
| 2025-12-26 | Fungki Gunawan | 08:47 | 47 | false | 7,833 |
| 2025-12-27 | Fungki Gunawan | — | — | **true** | 20,000 |
| 2025-12-28 | Fungki Gunawan | 10:22 | 142 | false | 20,000 |
| 2025-12-29 | Fungki Gunawan | 08:32 | 32 | false | 5,333 |
| 2025-12-30 | Fungki Gunawan | — | — | **true** | 20,000 |
| 2025-12-31 | Fungki Gunawan | 08:56 | 56 | false | 9,333 |

**December 2025 Summary** (Partial - Fungki Gunawan focus):
| Employee | Days Late | Days Absent | Total Deduction |
|----------|-----------|-------------|-----------------|
| Fungki Gunawan | 24 | 7 | 208,333 |
| Slaman | 1 | 0 | 5,167 |

> Note: December raw data appears incomplete for other employees.

---

## Monthly Aggregation Summary

Ready for payroll calculation:

| Period | Fungki Gunawan | Holilur A.R. | Slaman | Feri | Aulia Farida |
|--------|----------------|--------------|--------|------|--------------|
| Aug 2025 | 86,835 | 37,500 | 45,333 | 50,002 | — |
| Sep 2025 | 32,834 | 27,667 | 27,667 | 14,333 | — |
| **Oct 2025** | **180,500** | 48,001 | 74,168 | 18,167 | — |
| **Nov 2025** | **44,000** | 30,667 | 35,001 | 27,333 | 44,167 |
| **Dec 2025** | **208,333** | — | — | — | — |

> **Validation**: October 2025 totals match raw salary data `Pot. Absen` column ✅

---

## SQL Insert Template

```sql
INSERT INTO attendance_records 
(employee_id, attendance_date, check_in_time, late_minutes, is_absent, deduction_amount, source)
VALUES
-- October 2025 - Fungki Gunawan
((SELECT id FROM employees WHERE name = 'Fungki Gunawan'), '2025-10-03', '08:56', 56, false, 9333, 'imported'),
((SELECT id FROM employees WHERE name = 'Fungki Gunawan'), '2025-10-07', '10:19', 139, false, 20000, 'imported'),
((SELECT id FROM employees WHERE name = 'Fungki Gunawan'), '2025-10-08', '08:30', 30, false, 5000, 'imported'),
((SELECT id FROM employees WHERE name = 'Fungki Gunawan'), '2025-10-13', NULL, NULL, true, 20000, 'imported'),
-- ... continue for all records
;
```

---

## Next Steps

→ See [05-normalized-overtime.md](./05-normalized-overtime.md) for overtime data
→ See [08-salary-calculation-flow.md](./08-salary-calculation-flow.md) for final payroll calculation
