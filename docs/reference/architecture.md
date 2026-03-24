# Project Architecture: Lightweight Multi-Role Web App

## 🎯 Overview
A high-performance, low-bandwidth web application designed for 1,000+ users.
Hosted on **GitHub Pages** (Static) with a **Supabase** (Postgres) backend.
Built as a **Multi-Page Application (MPA)** with separate entry points per role, keeping admin code completely separate from customer code to minimize bandwidth consumption.

---

## 🛠️ Tech Stack

| Component       | Technology               | Version     | Reasoning                                      |
| :-------------- | :----------------------- | :---------- | :--------------------------------------------- |
| **Build Tool**  | Vite                     | ^7.3.1      | Fast HMR, content-hashed assets, MPA support.  |
| **Frontend**    | Vanilla JavaScript (ES6+)| —           | Zero framework overhead; smallest bundle.      |
| **UI Framework**| Bootstrap 5              | CDN         | Rapid dark-mode UI; no build step required.    |
| **Hosting**     | GitHub Pages             | —           | $0 cost; globally distributed CDN.             |
| **Database**    | Supabase (PostgreSQL)    | ^2.98.0     | Handles complex relations + RLS security.      |
| **Auth**        | Supabase Auth            | —           | Built-in JWT and role management.              |
| **Maps**        | Leaflet.js               | ^1.9.4      | ~40 KB total; much lighter than Google Maps.   |
| **PWA**         | vite-plugin-pwa          | ^1.2.0      | Offline support + home-screen installability.  |
| **Edge Functions** | Vercel Edge Runtime (JS/ESM) | — | Serverless API for all mutations, auth, business logic. Service Role Key protected server-side. |
| **Payments**    | *(not yet implemented)*  | —           | Planned via Edge Functions.                    |

---

## 🏗️ System Diagram

*(To be added)*

---

## 📂 Folder Structure

```text
/web-app
├── /admin/                          # Admin HTML entry points
│   ├── index.html                   # Admin dashboard
│   ├── login.html                   # Admin auth
│   └── add-psb.html                 # Standalone PSB registration form
├── /enduser/                        # Customer / technician HTML entry points
│   ├── login.html                   # End-user auth
│   └── dashboard.html               # Customer portal
├── /public/                         # Static assets (icons, map markers, 404)
├── /api/                            # ⭐ Vercel Edge Functions (server-side API)
│   ├── _lib/
│   │   └── supabase.js              # Shared: clients, verifyAuth, isAdmin, hasRole, withCors, generateCustomerCode
│   ├── health.js                    # GET /api/health — env check
│   ├── admin/
│   │   ├── create-user.js           # POST /api/admin/create-user
│   │   └── reset-password.js        # POST /api/admin/reset-password
│   ├── customers/
│   │   ├── index.js                 # GET /api/customers
│   │   └── [id].js                  # PATCH | DELETE /api/customers/:id
│   ├── work-orders/
│   │   ├── index.js                 # GET | POST /api/work-orders
│   │   ├── [id].js                  # PATCH | DELETE /api/work-orders/:id
│   │   ├── confirm.js               # POST /api/work-orders/confirm
│   │   ├── claim.js                 # POST /api/work-orders/claim
│   │   └── close.js                 # POST /api/work-orders/close
│   ├── packages/
│   │   ├── index.js                 # GET | POST /api/packages
│   │   └── [id].js                  # PATCH | DELETE /api/packages/:id
│   ├── inventory/
│   │   ├── index.js                 # GET | POST /api/inventory
│   │   └── [id].js                  # PATCH | DELETE /api/inventory/:id
│   ├── roles/
│   │   └── index.js                 # GET | POST /api/roles
│   ├── settings/
│   │   └── index.js                 # GET | PATCH /api/settings
│   └── dashboard/
│       └── stats.js                 # GET /api/dashboard/stats (cached 30s)
├── /src/
│   ├── activity.js                  # Technician activity / work order execution
│   ├── main.js                      # Customer login & routing
│   ├── config.js                    # APP_BASE_URL constant (/web-app)
│   ├── styles.css                   # Global styles
│   ├── /admin/                      # Admin-specific code
│   │   ├── admin.js                 # ⭐ Central orchestrator (auth, routing, lazy module loader)
│   │   ├── admin.css                # Premium dark-mode theme
│   │   ├── auth.css                 # Login page styling
│   │   ├── themes.css               # CSS theme variables
│   │   ├── /modules/                # Feature modules (dynamically imported on-demand)
│   │   │   ├── dashboard.js         # Dashboard welcome screen
│   │   │   ├── employees.js         # Master Data: Employees CRUD
│   │   │   ├── customers.js         # Master Data: Customers CRUD
│   │   │   ├── add-customer-view.js # Add-customer modal workflow
│   │   │   ├── packages.js          # Master Data: Internet Packages CRUD
│   │   │   ├── inventory.js         # Master Data: Inventory Items CRUD
│   │   │   ├── roles.js             # Settings: Role management
│   │   │   ├── settings.js          # App configuration
│   │   │   ├── customer-map-view.js # Global interactive customer map (Leaflet)
│   │   │   ├── add-psb-page.js      # 3-step customer self-registration form
│   │   │   └── /work-orders/        # ⭐ Work order management (sub-module)
│   │   │       ├── index.js         # Orchestrator & state management
│   │   │       ├── list.js          # List view: search, filter, summary stats
│   │   │       ├── form.js          # Add / edit work order modal
│   │   │       ├── map.js           # Map view with location markers
│   │   │       ├── monitoring.js    # Installation monitoring UI
│   │   │       └── utils.js         # Status update & point calculation helpers
│   │   └── /utils/
│   │       ├── toast.js             # Queue-based toast notification system
│   │       ├── ui-common.js         # Shared UI helpers (dropdowns, spinners)
│   │       └── map-utils.js         # Leaflet utilities
│   ├── /api/                        # Data access layer
│   │   ├── supabase.js              # Supabase client initialization
│   │   ├── auth-service.js          # Auth wrapper (login, register, bypass)
│   │   ├── registration-service.js  # Customer / employee registration flows
│   │   ├── config.js                # Auth domain suffix
│   │   ├── schema.sql               # ⭐ Full DB DDL + RLS policies (source of truth)
│   │   └── /migrations/             # Incremental schema migrations
│   ├── /enduser/                    # End-user dashboard JS & CSS
│   ├── /customer/                   # Customer-specific CSS
│   └── /utils/
│       ├── map.js                   # Generates Google Maps deep-links
│       └── pwa-install.js           # PWA install-banner logic
├── index.html                       # Root entry (customer login)
├── activity.html                    # Technician activity page
├── 404.html                         # 404 fallback
├── vite.config.js                   # ⭐ MPA config, PWA plugin, URL rewrite middleware
└── package.json
```

---

## 🔐 Security & Roles (RBAC)

Security is enforced at the **database level** using PostgreSQL Row Level Security (RLS). There is no traditional application server.

**Roles** (defined in `public.roles`, seeded at deployment):

| Code          | Name              | Access Level                                           |
| :------------ | :---------------- | :----------------------------------------------------- |
| `S_ADM`       | Super Admin       | Full access + create roles, manage all data.           |
| `OWNER`       | Owner             | Same as Super Admin; can create roles.                 |
| `ADM`         | Admin             | Confirm WOs, manage customers/employees/master data.   |
| `TREASURER`   | Treasurer         | Finance-related operations.                            |
| `SPV_TECH`    | Tech Supervisor   | Oversee technicians and WO assignments.                |
| `TECH`        | Technician        | Claim and execute work orders in the field.            |
| `CUST`        | Customer          | Read-only access to own data via customer portal.      |

**Current RLS Status:**
- `profiles`, `employees` — stricter policies (own-profile or admin-only access).
- `customers`, `work_orders`, `installation_monitorings`, `inventory_items`, `internet_packages`, `master_queue_types` — currently permissive ("Enable all for anyone"). **Security hardening is in progress.**
- Helper functions `get_my_role()` and `has_role()` are available for policy conditions.

---

## 🗺️ Map Implementation

- **Provider:** OpenStreetMap (free tile server via Leaflet.js).
- **Customer Locations:** `lat` / `lng` columns in the `customers` table; rendered as custom markers on the global customer map (`customer-map-view.js`).
- **Work Order Map:** Dedicated `work-orders/map.js` sub-module plots open/pending work orders.
- **Location Pickers:** Embedded Leaflet map pickers inside work order and customer registration forms (`ui-common.js` helpers + `map-utils.js`).
- **Performance:** Map tiles are loaded only when the map container is visible; tiles are cached for 30 days via Workbox (see Caching Strategy).

---

## 🏢 Admin Modules

All modules live in `src/admin/modules/` and follow a consistent init-function pattern. They are **lazily imported** by `admin.js` only when the user navigates to that section.

| Module                   | File                    | Purpose                                                   |
| :----------------------- | :---------------------- | :-------------------------------------------------------- |
| **Dashboard**            | dashboard.js            | Welcome screen and quick-action links.                    |
| **Employees**            | employees.js            | HR: manage technicians and staff (CRUD).                  |
| **Customers**            | customers.js            | Client management (CRUD, search, map link).               |
| **Add Customer**         | add-customer-view.js    | Modal workflow for inline customer creation.              |
| **Internet Packages**    | packages.js             | Service package catalog (CRUD).                           |
| **Inventory**            | inventory.js            | Equipment and parts stock (CRUD).                         |
| **Roles**                | roles.js                | Define and manage RBAC roles.                             |
| **Settings**             | settings.js             | App-wide configuration keys.                              |
| **Work Orders**          | work-orders/            | Full work order lifecycle (see sub-modules below).        |
| **Customer Map View**    | customer-map-view.js    | Interactive global map of all customer locations.         |
| **PSB Registration**     | add-psb-page.js         | 3-step customer self-registration form (standalone-capable). |

**Work Orders Sub-modules** (`src/admin/modules/work-orders/`):

| File           | Responsibility                                          |
| :------------- | :------------------------------------------------------ |
| index.js       | Orchestrator: state, view switching, filter management. |
| list.js        | Rendered list with search, status filter, summary stats.|
| form.js        | Add / edit modal form.                                  |
| map.js         | Leaflet map view with work order markers.               |
| monitoring.js  | Installation monitoring detail UI.                      |
| utils.js       | Status update helpers and point calculation.            |

---

## 💾 Database Schema

10 tables managed in `src/api/schema.sql` (single source of truth).

**Core / Auth Tables:**

| Table                  | Description                                                     |
| :--------------------- | :-------------------------------------------------------------- |
| `roles`                | Seeded RBAC roles (`ADMIN`, `STAFF`, `TECHNICIAN`, `CUSTOMER`). |
| `profiles`             | Links `auth.users` to a role. Auto-created on sign-up via trigger. |
| `master_queue_types`   | Work order categories (`PSB`, `Repair`, `Relocation`, `Upgrade`, `Cancel`) with points and icons. |

**Master Data Tables:**

| Table               | Description                                                         |
| :------------------ | :------------------------------------------------------------------ |
| `employees`         | Technicians and staff (name, employee_id, position, role, status).  |
| `customers`         | Clients (name, ktp, phone, packet, address, lat/lng, KTP photo).    |
| `internet_packages` | Service packages (name, price, speed).                              |
| `inventory_items`   | Equipment stock (name, quantity, unit, category).                   |
| `app_settings`      | Key-value application configuration.                                |

**Transactional Tables:**

| Table                    | Description                                                                    |
| :----------------------- | :----------------------------------------------------------------------------- |
| `work_orders`            | Jobs / tickets. Status flow: `waiting → confirmed → open → closed`. Source: `admin`, `technician`, or `customer`. |
| `installation_monitorings` | One-to-one with `work_orders`. Tracks planned/actual/activation dates, modem SN, MAC address, photo proof. |

**DB Helper Functions:** `get_work_order_stats()`, `get_my_role()`, `has_role(role_code)`, `handle_new_user()` (trigger for auto-profile creation).

---

## 🔑 Auth Flow

1. **Login** — `AuthService.login()` auto-appends an email domain suffix if the user logs in with a short code (e.g., `EMP001` → `EMP001@company.local`). Supabase issues a JWT; the app redirects to the role-appropriate page.
2. **Customer Registration** — `AuthService.registerCustomer()` signs up a new Supabase Auth user, inserts a `customers` record, and creates an initial `work_orders` entry with `source = 'customer'`.
3. **Technician Activity Link** — Pretty URL `/web-app/:employeeId/activity` is rewritten by Vite dev-server middleware (and matched at runtime) to `/web-app/activity.html?eid=:employeeId`. The `eid` parameter name avoids collision with Supabase's reserved `code` PKCE query parameter.
4. **Bypass / Demo Mode** — `AuthService.handleBypassParams()` supports query-parameter-based authentication for testing.

---

## ⚡ Vite Build Configuration

**Multi-Page Application (MPA)** — 6 separate entry points compiled independently:

| Entry Key      | File                      | Audience                |
| :------------- | :------------------------ | :---------------------- |
| main           | index.html                | Customer login          |
| admin          | admin/index.html          | Admin dashboard         |
| login          | admin/login.html          | Admin login             |
| add-psb        | admin/add-psb.html        | Standalone PSB form     |
| enduser-login  | enduser/login.html        | End-user / technician   |
| activity       | activity.html             | Technician field activity |

- **Base URL:** `/web-app/`
- **URL Rewriting:** Custom Vite middleware rewrites `/web-app/:employeeId/activity` → `/web-app/activity.html?eid=:employeeId`.
- **Dead Code Elimination:** Admin JS is never downloaded by customers; each chunk is code-split per entry point.

---

## ☁️ Vercel Edge Functions (`/api/`)

All server-side logic runs as Vercel Edge Functions. Shared helpers in `api/_lib/supabase.js`.

### Shared Library (`api/_lib/supabase.js`)

| Export | Type | Description |
| :----- | :--- | :---------- |
| `supabase` | Client | Anon key — respects RLS |
| `supabaseAdmin` | Client | Service role key — bypasses RLS. **Never sent to browser.** |
| `verifyAuth(req)` | Helper | Validates JWT from `Authorization: Bearer` header |
| `isAdmin(userId)` | Helper | Checks `S_ADM`, `OWNER`, `ADM` roles |
| `hasRole(userId, codes[])` | Helper | Generic role membership check |
| `getEmployeeRole(userId)` | Helper | Returns role code string for a user |
| `withCors(handler)` | Wrapper | CORS preflight + headers on all responses |
| `jsonResponse(data, status)` | Helper | Standard JSON response with CORS headers |
| `errorResponse(message, status)` | Helper | Error JSON response |
| `generateCustomerCode()` | Helper | Unique YYMMXXXXXXX code with DB collision check |

### Endpoint Summary

| Route | Methods | Auth | Description |
| :---- | :------ | :--- | :---------- |
| `/api/health` | GET | None | Env health check |
| `/api/admin/create-user` | POST | Admin | Create auth user + DB record |
| `/api/admin/reset-password` | POST | Admin | Reset any user's password |
| `/api/customers` | GET | Optional | Paginated + searchable list |
| `/api/customers/:id` | PATCH, DELETE | Admin | Update (phone validated) / delete (guards active WOs) |
| `/api/work-orders` | GET, POST | Auth / Admin | List + create |
| `/api/work-orders/:id` | PATCH, DELETE | Admin | Update (whitelisted fields) / delete |
| `/api/work-orders/confirm` | POST | Admin | `waiting → confirmed` + monitoring record |
| `/api/work-orders/claim` | POST | Tech/Admin | Atomic `confirmed → open` (race-safe) |
| `/api/work-orders/close` | POST | Tech/Admin | `open → closed` + award points |
| `/api/packages` | GET, POST | None / Admin | List (cached 60s) + create |
| `/api/packages/:id` | PATCH, DELETE | Admin | Update / delete |
| `/api/inventory` | GET, POST | None / Admin | List (cached 60s) + create |
| `/api/inventory/:id` | PATCH, DELETE | Admin | Update / delete |
| `/api/roles` | GET, POST | None / S_ADM,OWNER | List (cached 120s) + create |
| `/api/settings` | GET, PATCH | None / Admin | List (cached 120s) + update by key |
| `/api/dashboard/stats` | GET | Auth | Aggregated counts (cached 30s) |

---

## 📱 PWA Implementation

The app uses `vite-plugin-pwa` (Workbox) to deliver an installable, offline-capable experience.

- **Offline Access:** Core pages (auth screens, dashboards) cache-precached with content hashes.
- **Installability:** Users can add the app to their home screen on Android, iOS, and desktop.
- **MPA-Safe Service Worker:** `navigateFallback` is disabled to prevent the default SPA fallback from hijacking multi-page navigation. `ignoreURLParametersMatching` is configured so `activity.html?eid=X` correctly resolves to the precached `activity.html`.

---

## 💾 Caching Strategy (Workbox)

| Data Type         | Strategy                | TTL / Notes                                          |
| :---------------- | :---------------------- | :--------------------------------------------------- |
| **JS / CSS / HTML** | **Cache First**       | Content-hashed filenames; safe to cache indefinitely.|
| **Images / Icons**  | **Cache First**       | Static assets; rarely change.                        |
| **Map Tiles**       | **Cache First**       | 30-day expiry; 500-entry LRU cap.                    |
| **Supabase API**    | **Stale-While-Revalidate** | 24-hour expiry; immediate UI with background refresh.|