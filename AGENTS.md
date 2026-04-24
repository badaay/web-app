# AGENTS.md - Project Instruction Guide

This document serves as a guide for AI agents working on this project. It outlines the project structure, recurring patterns, and development standards to ensure consistency across the codebase.

# SIFATIH Project Personas

## Role: Lead NestJS Developer

- **Context**: Expert in NestJS modules, Dependency Injection, and Supabase integration.
- **Rules**: Always use DTOs for request validation. Keep services stateless.

## Role: Supabase & DB Architect

- **Context**: Manages PostgreSQL schemas and RLS policies.
- **Rules**: Every table must have RLS enabled. Use `uuid` for primary keys.
- **Domain Knowledge**: Knowledge of SIFATIH technician_points and work_orders tables.

## Role: UI Specialist (Minimalist)

- **Context**: React + Vite + Tailwind/CSS.
- **Aesthetic**: Minimalist, High-Tech.
- **Palette**: Cobalt Blue (#0047AB), Teal Gradients.
- **Rules**: Use glassmorphism for dashboards. Keep the mobile view light for field technicians.

## Role: Payroll Logic Auditor

- **Context**: Expert in SIFATIH business rules for technician points.
- **Rules**: Verify all point calculations against the SIFATIH_PRD logic. Error on any floating-point math—always use integers (cents/units).

## 🏗️ Project Overview

- **Stack**: Vite (Build Tool), Vanilla JavaScript (ES6+), Bootstrap 5 (UI Framework), Supabase (Backend/Database).
- **Core Principle**: Modular Vanilla JS architecture using dynamic imports to keep the main bundle light and logic separated by feature.

## 📂 Project Structure

- `/admin/`: Entry point for the admin dashboard (HTML files).
- `/src/admin/`: Main admin logic and styles.
  - `admin.js`: central hub for routing, session management, and module initialization.
  - `modules/`: Feature-specific logic (e.g., `employees.js`, `customers.js`).
- `/src/api/`: Data layer.
  - `supabase.js`: Supabase client initialization.
  - `schema.sql`: Database schema definition.
- `/src/styles.css`: Global application styles.

## 🚩 Feature Checkpoint

### ✅ Implemented

- **Auth & Session**: Basic login/logout and session persistence with Supabase.
- **Admin UI Shell**: Sidebar navigation, breadcrumb system, and premium dark mode theme.
- **Dynamic Loading**: Modular JS architecture using `import()` for lazy loading.
- **Master Data Karyawan**: CRUD operations for employee data.
- **Master Data Pelanggan**: CRUD operations for customer data.
- **Master Data Inventaris**: CRUD operations for inventory items.
- **Master Data Paket**: CRUD operations for internet packages.
- **Settings & Roles**: Centralized configuration and role management.
- **Database Schema**: Comprehensive `schema.sql` with RLS.
- **Manajemen Antrian PSB (Work Orders)**: Full CRUD, searching, filtering, and installation monitoring in `work-orders.js`.
- **Map Integration**: Global interactive map view (`customer-map-view.js`) and location pickers in forms using Leaflet.js.
- **Fast Registration Page**: Standalone-capable 3-step registration form (`add-psb-page.js`).
- **Media Support**: Photo upload support for site surveys and KTP using Base64/DataURL.

### 🏗️ In Progress / Partial

- **Security Hardening**: Tightening RLS policies to prevent client-side manipulation beyond basic access.
- **Points System**: Automated point calculation for completed work orders.

### ⏳ Pending / Future

- **Extended Analytics**: More detailed reporting and trends on work order completion and customer growth.

## 🎫 Ticket & Queue Logic

- **Access Model**: Claim-based (First come, first served for confirmed tickets).
- **Identifier**: Phone Number (Unique) + 8-char Generated Password.
- **Role Routing**:
  - `/customer/dashboard` -> View status, history, profile.
  - `/technician/activity` -> Claim/Open/Close tickets.
  - `/admin/panel` -> Validate KTP, confirm queue, master data management.

## 💾 Database Constraints

- `customer_code`: Unique 11-digit (YYMMXXXXXXX).
- `phone_number`: Unique (Primary login key).
- `ktp_number`: Unique (OCR validated).

## 🔘 Technician UI State Machine

1. **State: Confirmed** -> Show [Green: Open Ticket].
2. **State: Open** -> Hide Green, Show [Blue: Finish/Update].
3. **State: Closed** -> Move to History, Calculate Points.

## 🛠️ Core Patterns

### 1. Module Pattern

Each feature is encapsulated in a module within `src/admin/modules/`.

- **Naming**: `lowercase-hyphenated-name.js`.
- **Structure**: Export a single `init<ModuleName>` function.

```javascript
import { supabase } from "../../api/supabase.js";

export async function initFeature() {
  // 1. Get DOM elements
  // 2. Define loading/rendering logic
  // 3. Define event handlers
  // 4. Initial load
}
```

### 2. Dynamic Initialization

Modules are lazily loaded in `admin.js` via the `initModule` function.

```javascript
async function initModule(targetId) {
  if (targetId === "feature-content") {
    const { initFeature } = await import("./modules/feature.js");
    initFeature();
  }
}
```

### 3. Shared UI Components

- **Modals**: A single shared modal structure (`#crudModal`) is defined in `admin/index.html`. Modules should populate `#crudModalTitle` and `#crudModalBody`, then handle the `#save-crud-btn` click event.
- **Tables**: Use `<table class="table table-dark table-hover align-middle">` for consistency.

### 4. Data Handling (Supabase + API)

- **READ operations** (SELECT): Use the `supabase` client from `../../api/supabase.js` directly — RLS-protected.
- **WRITE operations** (INSERT/UPDATE/DELETE): Use `apiCall(endpoint, options)` from `../../api/supabase.js` — routes through Vercel Edge Functions.
- The `apiCall()` helper automatically attaches the user's JWT in the `Authorization` header.
- Prefer `async/await` for all operations. Handle errors by displaying them in the UI.

```javascript
import { supabase, apiCall } from "../../api/supabase.js";

// Reads: direct Supabase (OK — RLS-protected)
const { data } = await supabase.from("customers").select("*");

// Writes: via API endpoint (required — server-side auth + validation)
await apiCall("/customers/uuid-here", {
  method: "PATCH",
  body: JSON.stringify({ name: "New Name" }),
});

// POST with body shorthand
await apiCall("/work-orders", {
  method: "POST",
  body: JSON.stringify({ type_id, title, customer_id }),
});
```

## 📚 Documentation Structure

```
/                           # Root
├── AGENTS.md               # THIS FILE - Primary agent instructions
├── CODEBASE_GUIDE.md       # Comprehensive architecture & patterns
├── SECURITY_RBAC_ANALYSIS.md # Role definitions & security audit
├── TASK_BACKLOG.md         # Active MVP task list
├── vercel.json             # Vercel deployment config
├── .env.example            # Environment variables template
│
├── /api/                   # Vercel Edge Functions (server-side)
│   ├── _lib/supabase.js    # Shared server lib: clients, auth helpers, withCors, generateCustomerCode
│   ├── health.js           # GET /api/health — env check
│   ├── admin/              # Admin-only operations (create-user, reset-password)
│   ├── customers/          # GET list, PATCH/:id, DELETE/:id
│   ├── work-orders/        # Full WO lifecycle (index, confirm, claim, close, [id])
│   ├── packages/           # Internet packages CRUD (index, [id])
│   ├── inventory/          # Inventory items CRUD (index, [id])
│   ├── roles/              # Roles list + create
│   ├── settings/           # App settings list + update
│   └── dashboard/          # Aggregated stats
│
└── /docs/
    ├── reference/          # Detailed reference materials
    │   ├── architecture.md
    │   └── implementation.md
    └── future-roadmap/
        └── VERCEL_MIGRATION_PLAN.md  # Full migration guide
```

## 🎯 Vercel Migration Status

**✅ COMPLETE** — Full serverless API coverage. All data mutations go through `/api/*` Edge Functions. Service Role Key is protected server-side only.

### Completed

- **Service Role Key Protection**: Moved to `/api/*` Edge Functions
- **API Proxy**: All mutations route through `/api/*` endpoints
- **Base URL**: Updated from `/web-app/` to `/` for Vercel
- **Full Serverless Coverage**: All CREATE/UPDATE/DELETE operations moved server-side
- **Shared Lib Hardened**: `api/_lib/supabase.js` has `isAdmin()`, `hasRole()`, `withCors()`, `generateCustomerCode()`

### Remaining

- **RLS Hardening**: Implement policies per `SECURITY_RBAC_ANALYSIS.md`
- **Extended Analytics**: Detailed trend reporting
- **Points System**: Automated technician rewards (points trigger in DB, UI pending)

## 🔌 API Endpoints

> All endpoints use Vercel Edge Runtime (`export const config = { runtime: 'edge' }`).  
> Shared helpers are in `api/_lib/supabase.js`: `verifyAuth`, `isAdmin`, `hasRole`, `withCors`, `jsonResponse`, `errorResponse`, `generateCustomerCode`.

### Auth (Admin)

| Endpoint                    | Method | Auth  | Description                                                          |
| --------------------------- | ------ | ----- | -------------------------------------------------------------------- |
| `/api/admin/create-user`    | POST   | Admin | Create Supabase Auth user + insert into customers or employees table |
| `/api/admin/reset-password` | POST   | Admin | Reset any user's password via Admin API                              |

### Customers

| Endpoint             | Method | Auth     | Description                                              |
| -------------------- | ------ | -------- | -------------------------------------------------------- |
| `/api/customers`     | GET    | Optional | Paginated list with search. `?limit=50&offset=0&search=` |
| `/api/customers/:id` | PATCH  | Admin    | Update customer fields (validates phone uniqueness)      |
| `/api/customers/:id` | DELETE | Admin    | Delete customer + auth user (guards active work orders)  |

### Work Orders

| Endpoint                   | Method | Auth             | Description                                                  |
| -------------------------- | ------ | ---------------- | ------------------------------------------------------------ |
| `/api/work-orders`         | GET    | Authenticated    | Paginated list. `?status=&search=&limit=50&offset=0`         |
| `/api/work-orders`         | POST   | Admin            | Create new work order (status defaults to `waiting`)         |
| `/api/work-orders/:id`     | PATCH  | Admin            | Update work order fields (whitelisted)                       |
| `/api/work-orders/:id`     | DELETE | Admin            | Delete work order                                            |
| `/api/work-orders/confirm` | POST   | Admin            | Confirm WO (waiting → confirmed) + creates monitoring record |
| `/api/work-orders/claim`   | POST   | Technician/Admin | Atomic claim (confirmed → open). Race-condition safe         |
| `/api/work-orders/close`   | POST   | Technician/Admin | Close WO + award technician points                           |

### Master Data

| Endpoint             | Method | Auth        | Description                             |
| -------------------- | ------ | ----------- | --------------------------------------- |
| `/api/packages`      | GET    | None        | List all internet packages (cached 60s) |
| `/api/packages`      | POST   | Admin       | Create package                          |
| `/api/packages/:id`  | PATCH  | Admin       | Update package                          |
| `/api/packages/:id`  | DELETE | Admin       | Delete package                          |
| `/api/inventory`     | GET    | None        | List all inventory items (cached 60s)   |
| `/api/inventory`     | POST   | Admin       | Create inventory item                   |
| `/api/inventory/:id` | PATCH  | Admin       | Update item                             |
| `/api/inventory/:id` | DELETE | Admin       | Delete item                             |
| `/api/roles`         | GET    | None        | List all roles (cached 120s)            |
| `/api/roles`         | POST   | S_ADM/OWNER | Create role                             |
| `/api/settings`      | GET    | None        | List all app settings (cached 120s)     |
| `/api/settings`      | PATCH  | Admin       | Update a setting by `setting_key`       |

### Dashboard

| Endpoint               | Method | Auth          | Description                                                       |
| ---------------------- | ------ | ------------- | ----------------------------------------------------------------- |
| `/api/dashboard/stats` | GET    | Authenticated | Aggregated counts + WO-by-status + top 5 technicians (cached 30s) |

### Health

| Endpoint      | Method | Auth | Description           |
| ------------- | ------ | ---- | --------------------- |
| `/api/health` | GET    | None | Env-vars health check |

## 🚨 CRITICAL SAFEGUARDS — Profiles Recovery

### ⚠️ Fatal Issue: Missing Profiles After Seed Reset

**Problem**: Running `seed_complete.sql` truncates the `profiles` table. If forgotten, admin endpoints return `"Forbidden: Admin access required"` even for valid superadmin users.

**Cause**: The `profiles` table links `auth.users` to `roles`. Without it:
- `getEmployeeRole(userId)` returns `null`
- `isAdmin(userId)` returns `false`
- All admin API calls fail with 403 error

### 🔧 Emergency Recovery SQL

**Run this immediately in Supabase SQL Editor after seed reset:**

```sql
-- Step 1: Verify auth.users exist (should have 7 seeded employees)
SELECT COUNT(*) as auth_user_count FROM auth.users;

-- Step 2: Rebuild profiles table with role associations
INSERT INTO public.profiles (id, email, role_id)
SELECT
  au.id,
  au.email,
  (SELECT id FROM public.roles WHERE code = emp.role_code)
FROM auth.users au
JOIN (
  SELECT email, 
    CASE position
      WHEN 'Owner'       THEN 'OWNER'
      WHEN 'Bendahara'   THEN 'TREASURER'
      WHEN 'SPV Teknisi' THEN 'SPV_TECH'
      WHEN 'Teknisi'     THEN 'TECH'
      WHEN 'Admin'       THEN 'ADM'
      WHEN 'IT Admin'    THEN 'S_ADM'
      ELSE 'CUST'
    END AS role_code
  FROM public.employees
) emp ON au.email = emp.email
ON CONFLICT (id) DO UPDATE SET
  role_id = EXCLUDED.role_id;

-- Step 3: Verify profiles are now created with roles
SELECT p.id, p.email, r.code, r.name, e.position
FROM public.profiles p
LEFT JOIN public.roles r ON p.role_id = r.id
LEFT JOIN public.employees e ON e.email = p.email
ORDER BY r.code;

-- Step 4: Test superadmin access
SELECT id, email, role_id FROM public.profiles 
WHERE email LIKE 'SA001%' OR email LIKE '%@sifatih.id' AND role_id IS NOT NULL;
```

### ✅ Verification Checklist

After running recovery:
- [ ] `SELECT COUNT(*) FROM public.profiles;` shows 7+ profiles
- [ ] `SELECT * FROM public.profiles WHERE email = 'SA001@sifatih.id';` has `role_id` set
- [ ] `GET /api/health` returns 200 OK
- [ ] `POST /api/work-orders/confirm` returns 403 _only_ if user is not admin (not "unauthorized")
- [ ] Superadmin can successfully confirm work orders

### 📋 Seeded Users (Role → Email Mapping)

| Role        | Email                  | Employee ID |
| ----------- | ---------------------- | ----------- |
| S_ADM       | SA001@sifatih.id       | SA001       |
| OWNER       | 202101001@sifatih.id   | 202101001   |
| TREASURER   | 202101002@sifatih.id   | 202101002   |
| SPV_TECH    | 202408003@sifatih.id   | 202408003   |
| ADM         | 202509007@sifatih.id   | 202509007   |
| TECH        | 202512008@sifatih.id   | 202512008   |
| TECH        | 202602009@sifatih.id   | 202602009   |

## 🤖 Agent Instructions

When adding a new feature:

1. **Create Module**: Add a new file in `src/admin/modules/`.
2. **Add Content Container**: Add a `div` with a unique ID in `admin/index.html` (inside the tab content area).
3. **Register in admin.js**:
   - Update the navigation logic if it's a new sidebar item.
   - Add the module to the `initModule` function.
4. **Consistent Design**: Use Bootstrap classes for all UI elements. Match the existing "Premium Dark Mode" aesthetic (glassmorphism/gradients).
5. **Verify Supabase**: Ensure the table exists in `schema.sql` or create a migration if necessary.

## 🔄 Flow and Execution

1. **Initialization**: `admin.js` runs on DOM content load.
2. **Auth Check**: Verifies session with `supabase.auth.getSession()`.
3. **Routing**: Analyzes URL path to decide between login or dashboard.
4. **Module Loading**: Clicking navigation items triggers `initModule`, which dynamically imports and runs the module's init function.
