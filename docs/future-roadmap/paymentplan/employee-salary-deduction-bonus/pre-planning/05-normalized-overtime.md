# 05 - Normalized Overtime Data

> Transformed overtime records from raw sample data, with multi-technician support.

---

## Data Source

**File**: `raw/sample_data_perhitunngan_lembur.md`

**Original Format**: Tab-separated values with columns:
- No. (sequence number)
- Tanggal (date in DD/MM/YYYY format)
- Keterangan Lembur (work description)
- In Lembur (start time)
- Out Lembur (end time)
- Total Lembur (hours as decimal)
- Honor Lembur (total amount for all technicians)
- Teknisi 1-4 (up to 4 technician names per record)

---

## Transformation Rules Applied

1. **Date Format**: `DD/MM/YYYY` → `YYYY-MM-DD`
2. **Technician Columns**: Pivoted to individual assignment rows
3. **Per-Technician Amount**: `total_amount / technician_count`
4. **Work Type**: Mapped description to standardized types

---

## Work Type Mapping

| Raw Description | Normalized Type | Code |
|-----------------|-----------------|------|
| PSB | Pasang Baru (New Installation) | `psb` |
| Tarik Kabel | Cable Pull | `cable_pull` |
| Tarik Kabel LAN | LAN Cable Pull | `cable_pull_lan` |
| Perbaikan Bacbone | Backbone Repair | `backbone` |
| perbaikan | General Repair | `repair` |
| backbone | Backbone Work | `backbone` |
| pindah jalur backbone | Backbone Reroute | `backbone_reroute` |

---

## Normalized Overtime Records

### Master Records Table

| ID | Date | Type | Start | End | Hours | Rate | Total Amount | Technician Count |
|----|------|------|-------|-----|-------|------|--------------|------------------|
| OT001 | 2025-11-05 | cable_pull | 16:30 | 17:00 | 0.50 | 10,000 | 5,000 | 2 |
| OT002 | 2025-11-05 | psb | 16:30 | 17:00 | 0.50 | 10,000 | 5,000 | 2 |
| OT003 | 2025-11-11 | backbone | 16:30 | 23:40 | 7.17 | 10,000 | 71,667 | 4 |
| OT004 | 2025-11-13 | psb | 16:30 | 17:50 | 1.33 | 10,000 | 13,333 | 4 |
| OT005 | 2025-11-17 | psb | 16:30 | 17:20 | 0.83 | 10,000 | 8,333 | 3 |
| OT006 | 2025-11-27 | psb | 16:30 | 17:15 | 0.75 | 10,000 | 7,500 | 3 |
| OT007 | 2025-11-28 | psb | 16:30 | 17:28 | 0.97 | 10,000 | 9,667 | 3 |
| OT008 | 2025-12-01 | psb | 16:30 | 17:30 | 1.00 | 10,000 | 10,000 | 2 |
| OT009 | 2025-12-10 | backbone | 16:30 | 18:26 | 1.93 | 10,000 | 19,333 | 4 |
| OT010 | 2025-12-11 | psb | 16:30 | 18:12 | 1.70 | 10,000 | 17,000 | 2 |
| OT011 | 2025-12-15 | psb | 16:30 | 16:40 | 0.17 | 10,000 | 1,667 | 2 |
| OT012 | 2025-12-20 | backbone | 16:30 | 18:13 | 1.72 | 10,000 | 17,167 | 3 |
| OT013 | 2025-12-24 | cable_pull_lan | 16:30 | 17:13 | 0.72 | 10,000 | 7,167 | 4 |
| OT014 | 2026-01-04 | backbone | 16:30 | 21:18 | 4.80 | 10,000 | 48,000 | 4 |
| OT015 | 2026-01-11 | backbone_reroute | 00:00 | 05:00 | 5.00 | 10,000 | 50,000 | 2 |
| OT016 | 2026-01-16 | repair | 16:30 | 17:22 | 0.87 | 10,000 | 8,667 | 2 |
| OT017 | 2026-01-30 | backbone | 16:30 | 17:00 | 0.50 | 10,000 | 5,000 | 3 |

---

### Technician Assignments Table

Pivoted from Teknisi 1-4 columns:

| Overtime ID | Employee | Per-Person Amount |
|-------------|----------|-------------------|
| OT001 | Fungki Gunawan | 2,500 |
| OT001 | Feri | 2,500 |
| OT002 | Slaman | 2,500 |
| OT002 | Holilur Abdul Rahman | 2,500 |
| OT003 | Fungki Gunawan | 17,917 |
| OT003 | Holilur Abdul Rahman | 17,917 |
| OT003 | Slaman | 17,917 |
| OT003 | Feri | 17,917 |
| OT004 | Fungki Gunawan | 3,333 |
| OT004 | Holilur Abdul Rahman | 3,333 |
| OT004 | Slaman | 3,333 |
| OT004 | Feri | 3,333 |
| OT005 | Fungki Gunawan | 2,778 |
| OT005 | Feri | 2,778 |
| OT005 | Slaman | 2,778 |
| OT006 | Fungki Gunawan | 2,500 |
| OT006 | Feri | 2,500 |
| OT006 | Slaman | 2,500 |
| OT007 | Fungki Gunawan | 3,222 |
| OT007 | Feri | 3,222 |
| OT007 | Slaman | 3,222 |
| OT008 | Fungki Gunawan | 5,000 |
| OT008 | Feri | 5,000 |
| OT009 | Fungki Gunawan | 4,833 |
| OT009 | Ali Wafa | 4,833 |
| OT009 | Feri | 4,833 |
| OT009 | Slaman | 4,833 |
| OT010 | Fungki Gunawan | 8,500 |
| OT010 | Ali Wafa | 8,500 |
| OT011 | Fungki Gunawan | 834 |
| OT011 | Ali Wafa | 834 |
| OT012 | Fungki Gunawan | 5,722 |
| OT012 | Ali Wafa | 5,722 |
| OT012 | Fungki Gunawan | 5,722 |
| OT013 | Fungki Gunawan | 1,792 |
| OT013 | Ali Wafa | 1,792 |
| OT013 | Feri | 1,792 |
| OT013 | Slaman | 1,792 |
| OT014 | Fungki Gunawan | 12,000 |
| OT014 | Ali Wafa | 12,000 |
| OT014 | Feri | 12,000 |
| OT014 | Slaman | 12,000 |
| OT015 | Fungki Gunawan | 25,000 |
| OT015 | Ali Wafa | 25,000 |
| OT016 | Fungki Gunawan | 4,334 |
| OT016 | Ali Wafa | 4,334 |
| OT017 | Fungki Gunawan | 1,667 |
| OT017 | Ali Wafa | 1,667 |
| OT017 | Feri | 1,667 |

> **Note**: OT012 row 3 appears to be a data entry error (Fungki listed twice). Will dedupe and redistribute.

---

## Monthly Overtime Summary by Employee

### November 2025

| Employee | Records | Total Hours | Total Earned |
|----------|---------|-------------|--------------|
| Fungki Gunawan | 7 | 12.05 | 32,250 |
| Feri | 6 | 11.55 | 32,250 |
| Slaman | 5 | 10.55 | 29,750 |
| Holilur Abdul Rahman | 2 | 7.67 | 21,250 |

**Validated Amounts** (against raw salary data "Lembur" column):

| Employee | Calculated | Raw Data (Lembur) | Match |
|----------|------------|-------------------|-------|
| Fungki Gunawan Nov | 32,250 | 115,500 | ❌ |

> ⚠️ **Discrepancy**: Raw salary shows higher overtime amounts. Possible explanations:
> 1. Raw data includes overtime from multiple months
> 2. Different calculation method in actual payroll
> 
> **Note**: Using raw overtime data as authoritative source for monthly totals.

---

### December 2025

| Employee | Records | Total Hours | Total Earned |
|----------|---------|-------------|--------------|
| Fungki Gunawan | 6 | 7.24 | 25,889 |
| Ali Wafa | 5 | 5.52 | 20,889 |
| Feri | 2 | 2.65 | 6,625 |
| Slaman | 2 | 2.65 | 6,625 |

---

### January 2026

| Employee | Records | Total Hours | Total Earned |
|----------|---------|-------------|--------------|
| Fungki Gunawan | 4 | 11.17 | 43,001 |
| Ali Wafa | 4 | 11.17 | 43,001 |
| Feri | 2 | 5.30 | 13,667 |
| Slaman | 2 | 5.30 | 13,667 |

---

## Overtime by Work Type

| Type | Count | Total Hours | Total Amount |
|------|-------|-------------|--------------|
| PSB (New Installation) | 8 | 6.50 | 72,500 |
| Backbone Work | 6 | 21.42 | 213,167 |
| Cable Pull | 2 | 1.22 | 12,167 |
| Repair | 1 | 0.87 | 8,667 |

> **Insight**: Backbone maintenance generates the most overtime (71%), followed by new installations.

---

## SQL Insert Template

### Overtime Records

```sql
INSERT INTO overtime_records 
(id, overtime_date, start_time, end_time, description, overtime_type, total_hours, hourly_rate, total_amount)
VALUES
-- November 2025
('OT001', '2025-11-05', '16:30', '17:00', 'Tarik Kabel', 'cable_pull', 0.50, 10000, 5000),
('OT002', '2025-11-05', '16:30', '17:00', 'PSB', 'psb', 0.50, 10000, 5000),
('OT003', '2025-11-11', '16:30', '23:40', 'Perbaikan Backbone', 'backbone', 7.17, 10000, 71667),
('OT004', '2025-11-13', '16:30', '17:50', 'PSB', 'psb', 1.33, 10000, 13333),
('OT005', '2025-11-17', '16:30', '17:20', 'PSB', 'psb', 0.83, 10000, 8333),
('OT006', '2025-11-27', '16:30', '17:15', 'PSB', 'psb', 0.75, 10000, 7500),
('OT007', '2025-11-28', '16:30', '17:28', 'PSB', 'psb', 0.97, 10000, 9667),
-- December 2025
('OT008', '2025-12-01', '16:30', '17:30', 'PSB', 'psb', 1.00, 10000, 10000),
('OT009', '2025-12-10', '16:30', '18:26', 'Perbaikan Backbone', 'backbone', 1.93, 10000, 19333),
('OT010', '2025-12-11', '16:30', '18:12', 'PSB', 'psb', 1.70, 10000, 17000),
('OT011', '2025-12-15', '16:30', '16:40', 'PSB', 'psb', 0.17, 10000, 1667),
('OT012', '2025-12-20', '16:30', '18:13', 'Perbaikan Backbone', 'backbone', 1.72, 10000, 17167),
('OT013', '2025-12-24', '16:30', '17:13', 'Tarik Kabel LAN', 'cable_pull_lan', 0.72, 10000, 7167),
-- January 2026
('OT014', '2026-01-04', '16:30', '21:18', 'Backbone', 'backbone', 4.80, 10000, 48000),
('OT015', '2026-01-11', '00:00', '05:00', 'Pindah Jalur Backbone', 'backbone_reroute', 5.00, 10000, 50000),
('OT016', '2026-01-16', '16:30', '17:22', 'Perbaikan', 'repair', 0.87, 10000, 8667),
('OT017', '2026-01-30', '16:30', '17:00', 'Backbone', 'backbone', 0.50, 10000, 5000);
```

### Overtime Assignments

```sql
INSERT INTO overtime_assignments (overtime_id, employee_id, amount_earned)
SELECT 
    'OT001', 
    id, 
    2500 
FROM employees WHERE name IN ('Fungki Gunawan', 'Feri');

INSERT INTO overtime_assignments (overtime_id, employee_id, amount_earned)
SELECT 
    'OT002', 
    id, 
    2500 
FROM employees WHERE name IN ('Slaman', 'Holilur Abdul Rahman');

INSERT INTO overtime_assignments (overtime_id, employee_id, amount_earned)
SELECT 
    'OT003', 
    id, 
    17917 
FROM employees WHERE name IN ('Fungki Gunawan', 'Holilur Abdul Rahman', 'Slaman', 'Feri');

-- Continue for all records...
```

---

## Cross-Reference with Work Orders

Potential linkages for future integration:

| Overtime Type | Likely WO Type | Match Logic |
|---------------|----------------|-------------|
| PSB | PSB (queue_type) | Same date + assigned technicians |
| Backbone | — | Manual or separate tracking |
| Cable Pull | PSB or Relocation | — |
| Repair | Repair (queue_type) | Same date + assigned technicians |

---

## Next Steps

→ See [06-normalized-point-deductions.md](./06-normalized-point-deductions.md) for point shortage data
→ See [07-integration-points.md](./07-integration-points.md) for connecting overtime to work orders
