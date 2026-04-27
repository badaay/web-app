# AGENTS.md - Project Instruction Guide

This document serves as a guide for AI agents working on this project. It outlines the project structure, recurring patterns, and development standards to ensure consistency across the codebase.

## 🏗️ Project Overview

- **Stack**: Vite (Build Tool), Vanilla JavaScript (ES6+), Bootstrap 5 (UI Framework), Supabase (Backend/Database).
- **Core Principle**: Modular Vanilla JS architecture using dynamic imports to keep the main bundle light and logic separated by feature.

## 📂 Project Structure

- `/admin/`: Entry point for the admin dashboard (HTML files).
- `/src/admin/`: Main admin logic and styles.
    - `admin.js`: central hub for routing, session management, and module initialization.
    - `modules/`: Feature-specific logic (e.g., `employees.js`, `customers.js`).
- `/src/core/`: Core Business Logic (3-Layer Architecture).
    - `services/`: Business logic orchestration.
    - `repositories/`: Isolated database access (Supabase).
    - `__tests__/`: Unit and integration tests.
- `/api/`: Entry point for Vercel Edge Functions (Handlers).
    - `_core/`: Barrel re-exports for services.
    - `_lib/`: Shared server-side utilities.
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
- **Extended Analytics**: Detailed reporting and trends on work order completion and customer growth.
- **TDD Coverage**: Expanding test coverage for Handlers and Repositories.

## 🎫 Ticket & Queue Logic
- **Access Model**: Claim-based (First come, first served for confirmed tickets).
- **Identifier**: Phone Number (Unique) + 8-char Generated Password.
- **Role Routing**:
    * `/customer/dashboard` -> View status, history, profile.
    * `/technician/activity` -> Claim/Open/Close tickets.
    * `/admin/panel` -> Validate KTP, confirm queue, master data management.

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
import { supabase } from '../../api/supabase.js';

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
    if (targetId === 'feature-content') {
        const { initFeature } = await import('./modules/feature.js');
        initFeature();
    }
}
```

### 3. Shared UI Components
- **Modals**: A single shared modal structure (`#crudModal`) is defined in `admin/index.html`. Modules should populate `#crudModalTitle` and `#crudModalBody`, then handle the `#save-crud-btn` click event.
- **Tables**: Use `<table class="table table-dark table-hover align-middle">` for consistency.

### 4. 3-Layer Architecture (Backend/API)

All API logic must follow the **Handler → Service → Repository** pattern:

1.  **Handler** (`api/*.js`):
    - Responsibilities: HTTP parsing, Auth validation, CORS, Response mapping.
    - Dependency: Injects `dbClient` and calls a **Service**.
2.  **Service** (`src/core/services/*.js`):
    - Responsibilities: Business logic, external API calls (e.g., WhatsApp), complex calculations.
    - Dependency: Calls one or more **Repositories**.
3.  **Repository** (`src/core/repositories/*.js`):
    - Responsibilities: Pure Supabase/DB queries. No business logic.
    - Dependency: Receives `dbClient` as a parameter.

```javascript
// Pattern: Service Function
export async function claimWorkOrder(dbClient, id, body, user, isAuthorizedParam = false) {
    // 1. Business logic / Auth checks
    // 2. Call Repository
    const { data, error } = await woRepo.claimAtomic(dbClient, id, ...);
    // 3. Return standardized response (ok, created, badRequest, etc.)
}
```

### 5. TDD Workflow & Testing Standards

We follow a **Test-Driven Development (TDD)** approach for all core logic.

- **Tools**: Vitest.
- **Location**: `src/core/__tests__/`.
- **Naming**: `{name}.service.test.js` or `{name}.repository.test.js`.
- **Mocking Rules**:
    - **Service Tests**: MUST mock all Repository functions using `vi.mock`.
    - **Handler Tests**: MUST mock all Service functions.
    - **Database**: Use `createMockDbClient()` from `test-helpers.js`.
- **Requirement**: All new features must include tests covering happy paths, validation failures, and database edge cases (e.g., race conditions).

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

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/create-user` | POST | Admin | Create Supabase Auth user + insert into customers or employees table |
| `/api/admin/reset-password` | POST | Admin | Reset any user's password via Admin API |

### Customers

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/customers` | GET | Optional | Paginated list with search. `?limit=50&offset=0&search=` |
| `/api/customers/:id` | PATCH | Admin | Update customer fields (validates phone uniqueness) |
| `/api/customers/:id` | DELETE | Admin | Delete customer + auth user (guards active work orders) |

### Work Orders

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/work-orders` | GET | Authenticated | Paginated list. `?status=&search=&limit=50&offset=0` |
| `/api/work-orders` | POST | Admin | Create new work order (status defaults to `waiting`) |
| `/api/work-orders/:id` | PATCH | Admin | Update work order fields (whitelisted) |
| `/api/work-orders/:id` | DELETE | Admin | Delete work order |
| `/api/work-orders/confirm` | POST | Admin | Confirm WO (waiting → confirmed) + creates monitoring record |
| `/api/work-orders/claim` | POST | Technician/Admin | Atomic claim (confirmed → open). Race-condition safe |
| `/api/work-orders/close` | POST | Technician/Admin | Close WO + award technician points |

### Master Data

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/packages` | GET | None | List all internet packages (cached 60s) |
| `/api/packages` | POST | Admin | Create package |
| `/api/packages/:id` | PATCH | Admin | Update package |
| `/api/packages/:id` | DELETE | Admin | Delete package |
| `/api/inventory` | GET | None | List all inventory items (cached 60s) |
| `/api/inventory` | POST | Admin | Create inventory item |
| `/api/inventory/:id` | PATCH | Admin | Update item |
| `/api/inventory/:id` | DELETE | Admin | Delete item |
| `/api/roles` | GET | None | List all roles (cached 120s) |
| `/api/roles` | POST | S_ADM/OWNER | Create role |
| `/api/settings` | GET | None | List all app settings (cached 120s) |
| `/api/settings` | PATCH | Admin | Update a setting by `setting_key` |

### Dashboard

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/dashboard/stats` | GET | Authenticated | Aggregated counts + WO-by-status + top 5 technicians (cached 30s) |

### Health

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | None | Env-vars health check |

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
