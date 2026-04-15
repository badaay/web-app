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
### 1. Manual Payroll Adjustments & Points Detail
- [x] **API**: `api/payroll/adjustments` (vault/project_b) for adding bonuses/deductions.
- [x] **UI**: Modal/Form in Payroll Detail to add specific adjustments before calculation.
- [x] **Points Detail**: Transparent point breakdown modal in UI (cross-project lookup).

### 2. Approval & Lockdown
- [ ] **API**: `api/payroll/approve.js` to change status from 'calculated' to 'approved'.
- [ ] **Logic**: Ensure calculation cannot run on 'approved' periods.

### 3. Digital Payslips
- [ ] **API/Page**: `api/payroll/slip.js` to generate a lightweight HTML/PDF-ready payslip.
- [ ] **Access**: Technician can view their own payslip (optional for this phase).

### 4. Salary Config Management
- [ ] **UI**: Add a sub-tab in Employee details to manage their salary components (currently seeded manually).

## 📝 Notes
- **Project Structure**: Financial tables have been moved to **Project B (Vault)** via 8 separate migration files. API endpoints have been updated to handle cross-project lookups (fetch names from A, data from B).
- Points deduction logic for technicians now uses the Vault-resident `calculate_point_deduction`.
