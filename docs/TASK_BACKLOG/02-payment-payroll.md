# Payment Center & Payroll Backlog

This document outlines the tasks for the Payment Center, unified from `docs/future-roadmap/paymentplan/`.

---

## EPIC 7: Payment Center Foundation 💰

### [PAY-1.1]: Employee Table Extensions
**Status:** ⬜ DONE (Migration 020 exists) | **Priority:** 🟠 P1 | **Effort:** 15 min
**Objective:** Add `base_salary`, `target_monthly_points`, `is_bpjs_enrolled`.

### [PAY-1.2]: Salary App Settings
**Status:** ⬜ DONE (Migration 021 exists) | **Priority:** 🟠 P1 | **Effort:** 15 min
**Objective:** `work_start_time`, `late_rate_per_hour`, `overtime_rate_per_hour`, `point_deduction_rate`.

### [PAY-1.3 - 1.6]: Payment & Payroll Schema
**Status:** ⬜ DONE (Migrations 022-025 exist) | **Priority:** 🟠 P1 | **Effort:** 2 hrs
**Objective:** Tables for `employee_salary_configs`, `attendance_records`, `overtime_records`, `payroll_periods`, `payroll_line_items`.

---

## EPIC 8: Employee & Attendance Implementation 📊

### [PAY-2.1 - 2.2]: Salary Config API & UI
**Status:** ⬜ TODO | **Priority:** 🟠 P1 | **Effort:** 2 hrs
**Objective:** `api/employees/[id]/salary-config.js` logic and HR tab in `employees.js`.

### [PAY-3.1 - 3.4]: Attendance Module
**Status:** ⬜ TODO | **Priority:** 🟠 P1 | **Effort:** 3.5 hrs
**Objective:** `api/attendance/` API logic and `src/admin/modules/attendance.js` UI.

---

## EPIC 9: Overtime & Payroll Logic 💸

### [PAY-4.1 - 4.4]: Overtime Module
**Status:** ⬜ TODO | **Priority:** 🟠 P1 | **Effort:** 4 hrs
**Objective:** `api/overtime/` API logic and `src/admin/modules/overtime.js` UI.

### [PAY-5.1 - 5.5]: Payroll Calculation Engine
**Status:** ⬜ TODO | **Priority:** 🔴 P0 | **Effort:** 8 hrs
**Objective:** `api/payroll/calculate.js` 10-step pipeline and `src/admin/modules/payroll.js` UI.
