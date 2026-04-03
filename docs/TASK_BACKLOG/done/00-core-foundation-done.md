# Done Tasks - Core MVP Foundation

This file contains the tasks that have been successfully implemented and verified.

---

## EPIC 0: DB Reset & Foundation 🗄️

### [RESET-001]: Execute Clean DB Reset
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** `SELECT code FROM public.roles` returns: `S_ADM, OWNER, ADM, TREASURER, SPV_TECH, TECH, CUST`

### [RESET-002]: Create Test Auth Users
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** 7 users linked in `profiles` and `auth.users`.

### [RESET-003]: Verify registerCustomer
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** PSB submit creates auth user + customers + profiles (CUST role).

---

## EPIC 1: RLS Hardening for MVP 🔒

### [SEC-001]: RLS Migration — work_orders Table
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** TECH sees confirmed + own claimed; cannot see others.

### [SEC-002]: RLS Migration — customers Table
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** Admin can CRUD all; CUST sees own record only.

### [SEC-003]: RLS Migration — inventory, packages, queue_types, monitoring
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** Admin-class write; internet_packages public read.

---

## EPIC 2: Registration Flow (PSB → WO Created) 📝

### [REG-001]: Verify & Fix PSB Form End-to-End
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** Rows in `auth.users`, `customers`, `work_orders` (waiting), `profiles` (CUST).

### [REG-002]: Fix work_orders.type_id to Dynamic PSB Lookup
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** `await supabase.from('master_queue_types').select('id').eq('name','PSB').single()` implemented.

---

## EPIC 3: Admin Confirms & Assigns Technician ✅

### [ADMIN-001]: Add "Konfirmasi & Assign" Quick Action
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** Green button in list triggers status → `confirmed` and assigns technician.

---

## EPIC 4: Technician Claims & Closes Ticket 🔧

### [TECH-001]: Implement "Ambil Tiket" (Claim)
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** Confirmed → open, sets `claimed_by` and `claimed_at`.

### [TECH-002]: Implement "Selesai" (Close Ticket)
**Status:** ✅ DONE | **Status Changed:** 2026-04-03
**Validation:** Open → closed, writes `installation_monitorings` and awards points.
