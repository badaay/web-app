# [TICKET-027] Phase 2: Refinements & Secondary HR Features

## 📅 Status
- **Status:** 🟡 IN PROGRESS | **Priority:** 🟠 P1 | **Effort:** 3 hrs
- **Objective:** Finalize the HR/Payroll system with secondary features like Payslips, Manual Adjustments, and Approval logic.

## ✅ Completed in Last Phase
- [x] Full Database Migration for HR/Payroll (Tables, RLS, Functions).
- [x] Attendance API & UI (Filters, Stats, CRUD).
- [x] Overtime API & UI (Multi-technician assignments, auto-calc).
- [x] Payroll Calculation Engine (10-step pipeline in `api/payroll/calculate.js`).
- [x] Payroll Management UI (Period creation, calculation trigger, summary view).
- [x] HR Sidebar Navigation & Routing.
- [x] Dummy Data Seeding for demonstration.

## 🏗️ Remaining Work (This Ticket)
### 1. Manual Payroll Adjustments
- [ ] **API**: `api/payroll/adjustments` for adding bonuses/deductions.
- [ ] **UI**: Modal/Form in Payroll Detail to add specific adjustments before calculation.

### 2. Approval & Lockdown
- [ ] **API**: `api/payroll/approve.js` to change status from 'calculated' to 'approved'.
- [ ] **Logic**: Ensure calculation cannot run on 'approved' periods.

### 3. Digital Payslips
- [ ] **API/Page**: `api/payroll/slip.js` to generate a lightweight HTML/PDF-ready payslip.
- [ ] **Access**: Technician can view their own payslip (optional for this phase).

### 4. Salary Config Management
- [ ] **UI**: Add a sub-tab in Employee details to manage their salary components (currently seeded manually).

## 📝 Notes
- Points deduction logic for technicians currently relies on the standard RPC `calculate_point_deduction`. Ensure this is tested with actual work order data.
