# Core Operations - Remaining Tasks

This file contains the core work order and verification tasks required to complete the MVP flow.

---

## EPIC 4.1: Technician Points Logic (In Progress) 🔧

### [TECH-003]: Auto-Calculate Points on Close (SQL Trigger)

**Status:** ⬜ DONE | **Priority:** 🟠 P1 | **Effort:** 🟢 Low (1 hr) | **Depends on:** RESET-001
**Objective:** SQL trigger sets `NEW.points = base_point` from `master_queue_types` when `status` transitions to `closed`.

---

## EPIC 5: End-to-End Verification ✔️

### [VER-001]: Role Login Smoke Test (All 7 Roles)

**Status:** ⬜ DONE | **Priority:** 🟠 P1 | **Effort:** 🟢 Low (30 min) | **Depends on:** RESET-001, RESET-002
**Objective:** All 7 test users authenticate and receive appropriate routing.

### [VER-002]: Full MVP Flow Smoke Test

**Status:** ⬜ DONE | **Priority:** 🟠 P1 | **Effort:** 🟡 Medium (1 hr) | **Depends on:** All EPIC 0–4
**Objective:** Complete journey from PSB registration through work order completion. Points auto-assigned. Monitoring record created.
