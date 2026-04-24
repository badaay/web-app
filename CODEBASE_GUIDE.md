# CODEBASE_GUIDE.md - AI Agent Learning & Maintenance Reference

> **Purpose**: Comprehensive guide for AI agents to understand, analyze, review, and maintain the SiFatih Web Application codebase.
> 
> **Last Updated**: 2026-03-16  
> **Complements**: [AGENTS.md](AGENTS.md) (development workflow patterns)

---

## Table of Contents

1. [Quick Start (Read First)](#1-quick-start-read-first)
2. [Architecture Deep Dive](#2-architecture-deep-dive)
3. [Business Workflows](#3-business-workflows)
4. [Data Model Analysis](#4-data-model-analysis)
5. [Code Pattern Reference](#5-code-pattern-reference)
6. [Feature Checkpoint Matrix](#6-feature-checkpoint-matrix)
7. [Code Review Checklist](#7-code-review-checklist)
8. [Best Practices Guide](#8-best-practices-guide)
9. [Maintenance Complexity Analysis](#9-maintenance-complexity-analysis)
10. [Storage Optimization Strategy](#10-storage-optimization-strategy)
11. [Security Audit Findings](#11-security-audit-findings-critical)
12. [Future Improvement Roadmap](#12-future-improvement-roadmap)
13. [Appendix: Command Reference](#13-appendix-command-reference)

---

## 1. Quick Start (Read First)

### 5-Minute Codebase Orientation

```
┌─────────────────────────────────────────────────────────────────┐
│                    SiFatih Web Application                       │
│         Vite + Vanilla JS + Bootstrap 5 + Supabase + Leaflet    │
└─────────────────────────────────────────────────────────────────┘

Entry Points:
├── /index.html           → Main landing page (redirects to admin/ or enduser/)
├── /admin/index.html     → Admin Dashboard (primary)
├── /admin/login.html     → Admin Authentication
├── /admin/add-psb.html   → Standalone Registration Form
├── /enduser/dashboard.html → Customer Portal
├── /enduser/login.html   → Customer Login
└── /activity.html        → Public Technician Activity View

Core Files to Understand First:
1. src/admin/admin.js          ← Central orchestrator (routing, auth, module loading)
2. src/api/supabase.js         ← Client-side Supabase client + apiCall helper
3. api/_lib/supabase.js        ← Server-side Supabase helpers (node & admin clients)
4. src/api/schema.sql          ← Database structure & RLS policies (Source of Truth)
5. src/admin/modules/          ← Directory for all feature modules
6. api/                          ← Directory for all Vercel Edge Functions (server-side logic)
```

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Dynamic Imports** | Modules load on-demand via `import()` to reduce initial bundle |
| **Module Pattern** | Each feature exports `initFeatureName()` function |
| **Shared Modal** | Single `#crudModal` reused across all CRUD operations |
| **Role-Based UI** | Admin/Technician/Customer see different interfaces |
| **Supabase RLS** | Row-Level Security controls data access (⚠️ currently weak) |

### First Steps for Any Task

```javascript
// 1. Always start by understanding the data model
// Check: src/api/schema.sql

// 2. Find the relevant module
// Check: src/admin/modules/{feature-name}.js

// 3. Understand the initialization flow
// Check: src/admin/admin.js → initModule() function

// 4. Verify database access patterns
// Check: supabase.from('table').select() patterns in module
```

---

## 2. Architecture Deep Dive

### 2.1 Application Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION FLOW                                 │
└──────────────────────────────────────────────────────────────────────────┘

Browser Load
    │
    ▼
DOMContentLoaded (admin.js)
    │
    ├─► Check bypass params (AuthService.handleBypassParams)
    │
    ▼
Check Session (supabase.auth.getSession)
    │
    ├─► No Session ──► Redirect to /admin/login
    │
    ▼
initDashboardLogic(user)
    │
    ├─► Fetch user role from employees table
    ├─► Setup sidebar navigation listeners
    ├─► Register logout handlers
    │
    ▼
initNavigation()
    │
    ├─► Expose window.switchAdminModule(target)
    │
    ▼
User clicks nav item
    │
    ▼
switchAdminModule('target-id')
    │
    ├─► Update nav highlight (active class)
    ├─► Show/hide section containers
    │
    ▼
initModule('target-id')
    │
    ├─► Dynamic import: import('./modules/{module}.js')
    ├─► Call exported init function
    │
    ▼
Module initializes
    ├─► Get DOM references
    ├─► Load data from Supabase
    ├─► Attach event listeners
    └─► Render UI
```

### 2.2 Module Loading Map

```javascript
// src/admin/admin.js → initModule()

async function initModule(targetId) {
    switch(targetId) {
        case 'dashboard':
            const { initDashboard } = await import('./modules/dashboard.js');
            initDashboard();
            break;
        case 'employees-content':
            const { initEmployees } = await import('./modules/employees.js');
            initEmployees();
            break;
        case 'customers-content':
            const { initCustomers } = await import('./modules/customers.js');
            initCustomers();
            break;
        case 'packages-content':
            const { initPackages } = await import('./modules/packages.js');
            initPackages();
            break;
        case 'inventory-content':
            const { initInventory } = await import('./modules/inventory.js');
            initInventory();
            break;
        case 'work-orders-content':
            const { initWorkOrders } = await import('./modules/work-orders.js');
            initWorkOrders();
            break;
        case 'roles-content':
            const { initRoles } = await import('./modules/roles.js');
            initRoles();
            break;
        case 'settings-content':
            const { initSettings } = await import('./modules/settings.js');
            initSettings();
            break;
        // ... more modules
    }
}
```

### 2.3 Data Layer Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                  │
└───────────────────────────────────────────────────────────────────┘

BROWSER (client-side) — src/
├── src/api/supabase.js          ← Client + apiCall() helper
└── src/admin/modules/           ← All UI-facing logic for admin panel features

VERCEL EDGE FUNCTIONS (server-side) — api/
├── _lib/supabase.js             ← Shared helpers: verifyAuth, isAdmin, hasRole,
│                                 withCors, generateCustomerCode, fonnte(sms)
├── admin/create-user.js         ← supabaseAdmin (service role) - creates auth users
├── admin/reset-password.js      ← supabaseAdmin - password reset
├── customers/index.js           ← GET list (anon client)
├── customers/[id].js            ← PATCH/DELETE (admin, validates phone uniqueness)
├── customers/login.js           ← Handles customer login
├── customers/register.js        ← Handles new customer registration from add-psb.html
├── work-orders/index.js         ← GET list + POST create
├── work-orders/[id].js          ← PATCH update + DELETE
├── work-orders/confirm.js       ← waiting→confirmed + monitoring record
├── work-orders/claim.js         ← atomic confirmed→open (race-safe)
├── work-orders/close.js         ← open→closed + award points
├── packages/index.js + [id].js  ← CRUD internet packages
├── inventory/index.js + [id].js ← CRUD inventory items
├── roles/index.js               ← GET list + POST (S_ADM/OWNER only)
├── settings/index.js            ← GET list + PATCH by key
├── bills/                       ← Endpoints for bill generation and payment
├── notifications/               ← Endpoints for sending notifications (e.g., WhatsApp)
└── dashboard/stats.js           ← aggregated counts (cached 30s)

SUPABASE (database)
├── PostgreSQL with RLS policies
└── Auth (JWT issued on login)

src/api/
├── supabase.js          ← Client-side Supabase init + apiCall() helper
├── auth-service.js      ← Authentication wrapper
├── registration-service.js ← Customer registration logic
├── schema.sql           ← Database DDL (source of truth)
└── seed_*.sql/.js       ← Seeding scripts for initial data

Database Tables (12+):
┌─────────────────────┬─────────────────────┬─────────────────────┐
│   CORE/AUTH         │   MASTER DATA       │   TRANSACTIONAL     │
├─────────────────────┼─────────────────────┼─────────────────────┤
│ roles               │ employees           │ work_orders         │
│ profiles            │ customers           │ installation_monitorings │
│                     │ internet_packages   │ bills               │
│                     │ inventory_items     │ payments            │
│                     │ master_queue_types  │ notifications       │
│                     │ app_settings        │                     │
└─────────────────────┴─────────────────────┴─────────────────────┘

Key Relationships:
- employees.role_id → roles.id
- customers.role_id → roles.id
- work_orders.customer_id → customers.id
- work_orders.employee_id → employees.id
- work_orders.type_id → master_queue_types.id
- installation_monitorings.work_order_id → work_orders.id (UNIQUE)
```

### 2.3a Shared API Library (`api/_lib/supabase.js`)

All Vercel Edge Functions import from this shared module:

```javascript
// Two Supabase clients (server-side only)
export const supabase;       // anon key — respects RLS
export const supabaseAdmin;  // service role key — bypasses RLS

// Auth helpers
export async function verifyAuth(req)           // verify JWT from Authorization header
export async function getEmployeeRole(userId)   // returns role code string
export async function hasRole(userId, [codes])  // generic role check
export async function isAdmin(userId)           // checks S_ADM, OWNER, ADM

// Response helpers
export function jsonResponse(data, status, headers)
export function errorResponse(message, status)
export function withCors(handler)              // CORS preflight wrapper

// Business logic
export async function generateCustomerCode()   // YYMMXXXXXXX, DB uniqueness-checked
```

**Role codes** (from schema.sql):
| Code | Name | Admin? |
|------|------|--------|
| `S_ADM` | Super Admin | ✅ |
| `OWNER` | Owner | ✅ |
| `ADM` | Admin | ✅ |
| `TREASURER` | Treasurer | ❌ |
| `SPV_TECH` | Tech Supervisor | ❌ |
| `TECH` | Technician | ❌ |
| `CUST` | Customer | ❌ |

### 2.4 Inter-Module Communication

```javascript
// Pattern 1: Global Function (current - not ideal)
window.switchAdminModule('work-orders-content');

// Pattern 2: Custom DOM Events (preferred)
document.dispatchEvent(new CustomEvent('quick-wo', {
    detail: { customer: customerData }
}));

// Pattern 3: Data Attributes
<button data-id="${emp.id}" data-action="edit">Edit</button>
```

---

## 3. Business Workflows

### 3.1 Customer Registration Flows

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW MATRIX                                  │
├──────────────────┬─────────────────────┬─────────────────────────────────────┤
│ Actor            │ Entry Point         │ Effect                              │
├──────────────────┼─────────────────────┼─────────────────────────────────────┤
│ Customer (Self)  │ /admin/add-psb.html │ Creates WO with source='customer'   │
│ Teknisi          │ customers.js modal  │ +Points, source='technician'        │
│ Admin            │ customers.js modal  │ Standard, source='admin'            │
└──────────────────┴─────────────────────┴─────────────────────────────────────┘
```

#### Flow A: Customer Self-Registration (`add-psb.html`)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    3-STEP REGISTRATION WIZARD                                │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: Data Diri                    STEP 2: Lokasi                    STEP 3: Konfirmasi
┌─────────────────────┐              ┌─────────────────────┐          ┌─────────────────────┐
│ • Nama Lengkap*     │              │ • Alamat Detail*    │          │ • Review semua data │
│ • No KTP*           │      →       │ • Pilih Lokasi Peta*│    →     │ • Upload Foto Rumah │
│ • No HP*            │              │ • HP Alternatif     │          │ • Submit            │
│ • Email             │              │ • Nama Referal      │          │                     │
│ • Pilih Paket*      │              │                     │          │                     │
└─────────────────────┘              └─────────────────────┘          └─────────────────────┘
       (* = wajib)

Database Impact:
├── INSERT customers (name, ktp, phone, packet, address, lat, lng, ...)
└── INSERT work_orders (customer_id, type='PSB', status='waiting', source='customer')
```

#### Flow B: Teknisi Registration (via `customers.js`)

```javascript
// Teknisi creates customer → gets referral points
const payload = {
    ...customerData,
    referral_name: currentTechnician.name,  // Auto-filled
};

// Work order created with technician reference
const workOrderPayload = {
    customer_id: newCustomer.id,
    source: 'technician',
    employee_id: currentTechnician.id,  // For point calculation
    type_id: 'PSB_TYPE_ID',
    status: 'waiting'
};
```

**Points Logic** (to be implemented):
- PSB registration by technician: +2 points (base)
- With referral: +1 bonus point
- Points credited after installation complete (`status = 'closed'`)

#### Flow C: Admin Registration (via `customers.js`)

```
Same modal as Teknisi, but:
├── source = 'admin'
├── No referral points
└── Full field access (can set customer_code manually)
```

---

### 3.2 Ticketing/Work Order Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    TICKET LIFECYCLE STATE MACHINE                            │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────────────────────────────┐
                    │                                                          ▼
┌─────────┐    ┌─────────────┐    ┌──────────┐    ┌────────┐    ┌────────────────┐
│ WAITING │───▶│  CONFIRMED  │───▶│   OPEN   │───▶│ CLOSED │───▶│ POINTS CREDITED│
└─────────┘    └─────────────┘    └──────────┘    └────────┘    └────────────────┘
     │              │                   │              │
     │              │                   │              └─► Moves to History
     │              │                   │
     │              │                   └─► claimed_by = teknisi.id
     │              │                       claimed_at = NOW()
     │              │                       team_members = [...]
     │              │
     │              └─► Admin picks for today's target
     │
     └─► New ticket created (PSB, Repair, Maintenance, etc.)
```

#### Ticket Types & Points

| Type | Code | Base Points | Description |
|------|------|-------------|-------------|
| Pemasangan Baru (PSB) | `PSB` | 2 | New installation |
| Perbaikan | `REPAIR` | 1 | Troubleshooting |
| Maintenance | `MAINTENANCE` | 1 | Scheduled maintenance |
| Upgrade Paket | `UPGRADE` | 1 | Package upgrade |
| Putus Kontrak | `DISCONNECT` | 0 | Service termination |

#### Status Workflow Details

```javascript
// Step 1: Ticket Created (by Customer/Teknisi/Admin)
const newTicket = {
    customer_id: customerId,
    type_id: queueTypeId,
    status: 'waiting',           // ← Initial status
    source: 'customer|technician|admin',
    registration_date: new Date(),
    points: 0                    // Points assigned on close
};

// Step 2: Admin Confirms (picks for execution)
await supabase.from('work_orders')
    .update({ status: 'confirmed' })
    .eq('id', ticketId);

// Step 3: Teknisi Claims & Opens
await supabase.from('work_orders')
    .update({ 
        status: 'open',
        claimed_by: teknisiId,
        claimed_at: new Date()
    })
    .eq('id', ticketId);

// Step 4: Teknisi Closes (with installation data)
await supabase.from('work_orders')
    .update({ 
        status: 'closed',
        completed_at: new Date(),
        points: calculatePoints(ticketType, bonuses)
    })
    .eq('id', ticketId);

// Insert installation monitoring record
await supabase.from('installation_monitorings')
    .insert({
        work_order_id: ticketId,
        customer_id: customerId,
        employee_id: teknisiId,
        actual_date: new Date(),
        mac_address: modemMac,
        sn_modem: serialNumber,
        photo_proof: photoUrl,
        notes: completionNotes
    });
```

#### Map Status Colors

```javascript
// Marker colors on map view
const STATUS_COLORS = {
    'waiting': '#22c55e',    // 🟢 Green (Antrian)
    'confirmed': '#3b82f6',  // 🔵 Blue (Konfirmasi) 
    'pending': '#f97316',    // 🟠 Orange (Pending)
    'odp_full': '#92400e',   // 🟤 Brown (ODP Penuh)
    'cancelled': '#1f2937',  // ⚫ Black (Cancel)
    'closed': null           // Not shown on map
};
```

---

### 3.3 Quick Actions

| Action | Trigger | Module | Result |
|--------|---------|--------|--------|
| Quick Repair | 🔧 button in customers list | `customers.js` | Creates repair ticket linked to customer |
| Reset Password | 🔐 button in customers list | `customers.js` | Generates new password, updates profile |
| View on Map | 📍 button in customers list | `customers.js` | Opens map popup with customer location |
| Claim Ticket | ✅ button in work orders | `work-orders.js` | Assigns ticket to current technician |

---

## 4. Data Model Analysis

### 4.1 Source Data Mapping

Based on original Excel data requirements:

#### Employees (`data_karyawan.md` → `employees` table)

| Excel Column | DB Column | Type | Required | Notes |
|--------------|-----------|------|----------|-------|
| No. | - | - | - | Auto-increment, not stored |
| Nama | `name` | TEXT | ✅ | Full name |
| ID | `employee_id` | TEXT | ✅ | Format: YYYYMMXXX (e.g., 202101001) |
| Keterangan | `status` | TEXT | ✅ | 'Aktif' / 'Non-Aktif' |
| Tempat Lahir | `birth_place` | TEXT | | |
| Tanggal Lahir | `birth_date` | DATE | | |
| Alamat | `address` | TEXT | | |
| Jabatan | `position` | TEXT | ✅ | Structural role |
| Tanggal Masuk | `join_date` | DATE | | For tenure calculation |
| Pendidikan Terakhir | `education` | TEXT | | |
| Lama Bekerja | - | - | - | ⚠️ CALCULATED from join_date |
| Training | `training` | TEXT | | 'Ya' / 'Tidak' |
| BPJS | `bpjs` | TEXT | | 'Ya' / 'Tidak' |

**Normalization Notes**:
- `Lama Bekerja` should be calculated, not stored
- Add `email` column for app login linking
- Add `role_id` FK for application permissions

#### Customers (`data_pelanggan.md` → `customers` table)

| Excel Column | DB Column | Type | Required | Notes |
|--------------|-----------|------|----------|-------|
| Kode Pelanggan | `customer_code` | TEXT | ✅ | Format: YYXXXXXXXXXX (11 digits) |
| Tanggal Pasang | `install_date` | DATE | | |
| Nama | `name` | TEXT | ✅ | |
| KTP | `ktp` | TEXT | | 16-digit NIK |
| No HP | `phone` | TEXT | ✅ | Primary contact |
| Paket | `packet` | TEXT | | FK to internet_packages.name |
| Alamat Pemasangan | `address` | TEXT | ✅ | |
| Google Maps | `lat`, `lng` | DOUBLE | | ⚠️ Parse from URL or store coords |
| Username | `username` | TEXT | | Generated email format |
| MAC ADDRESS | `mac_address` | TEXT | | Device identifier |
| Redaman | `damping` | TEXT | | Signal strength (dBm) |

**Normalization Notes**:
- Store `lat`/`lng` as separate numeric columns (not Google Maps URL)
- `packet` should FK to `internet_packages.id`
- Add `role_id` for customer portal access

#### Work Orders (`antrian_psb.md` → `work_orders` table)

| Excel Column | DB Column | Type | Required | Notes |
|--------------|-----------|------|----------|-------|
| Ket | - | - | - | Validation status (computed) |
| Pembayaran | `payment_status` | TEXT | | |
| Status | `status` | TEXT | ✅ | waiting/confirmed/open/closed |
| Lama Antrian | - | - | - | ⚠️ CALCULATED from registration_date |
| Tanggal Daftar | `registration_date` | DATE | ✅ | |
| Nama | → customers.name | - | - | Via FK |
| KTP | → customers.ktp | - | - | Via FK |
| Alamat | → customers.address | - | - | Via FK |
| Email | → customers.email | - | - | Via FK |
| No HP | → customers.phone | - | - | Via FK |
| HP Alternatif | `alt_phone` | TEXT | | |
| Paket | → customers.packet | - | - | Via FK |
| Lokasi | → customers.lat/lng | - | - | Via FK |
| Nama Referal | `referral_name` | TEXT | | Referring person |
| Keterangan | `ket` | TEXT | | Short notes |
| Foto Rumah | `photo_url` | TEXT | | Site photo |

**Normalization Notes**:
- Customer data should be FK reference, not duplicated
- `Lama Antrian` calculated as: `TODAY() - registration_date`
- Add `type_id` FK to `master_queue_types`

#### Internet Packages (`data_paket.md` → `internet_packages` table)

| Excel Value | DB Fields |
|-------------|----------|
| `350K 50Mbps` | name: '350K 50Mbps', price: 350000, speed: '50Mbps' |
| `250K 35MBPS` | name: '250K 35MBPS', price: 250000, speed: '35Mbps' |
| `200K 25MBPS` | name: '200K 25MBPS', price: 200000, speed: '25Mbps' |
| `175K 20Mbps` | name: '175K 20Mbps', price: 175000, speed: '20Mbps' |
| `166K 15MBPS` | name: '166K 15MBPS', price: 166000, speed: '15Mbps' |

---

### 4.2 Customer Code Generation

```javascript
// Format: YYXXXXXXXXXX (11 digits)
// YY = Year (2 digits)
// XX = Month (2 digits - optional)  
// XXXXXXX = Sequential number

function generateCustomerCode() {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);  // '26'
    const month = String(now.getMonth() + 1).padStart(2, '0');  // '03'
    
    // Get last sequence from settings or calculate
    const sequence = await getNextSequence();  // e.g., '031501'
    
    return `${year}${month}${sequence}`;  // '2503031501'
}
```

---

### 4.3 Data Validation Rules

```javascript
// Required fields per entity
const VALIDATION_RULES = {
    customers: {
        required: ['name', 'phone', 'address', 'packet'],
        unique: ['customer_code', 'phone', 'ktp'],
        formats: {
            ktp: /^\d{16}$/,           // 16 digits
            phone: /^0\d{9,12}$/,      // 0 + 9-12 digits
            customer_code: /^\d{11}$/  // 11 digits
        }
    },
    employees: {
        required: ['name', 'employee_id', 'position', 'status'],
        unique: ['employee_id', 'email'],
        formats: {
            employee_id: /^\d{9}$/     // 9 digits
        }
    },
    work_orders: {
        required: ['customer_id', 'type_id', 'status'],
        statusFlow: {
            'waiting': ['confirmed', 'cancelled'],
            'confirmed': ['open', 'waiting'],
            'open': ['closed', 'confirmed'],
            'closed': []  // Terminal state
        }
    }
};
```

---

## 5. Code Pattern Reference

### 3.1 Enhanced Toast Notification System

The toast system provides non-blocking, user-friendly notifications with queue management and customization options.

#### Basic Usage (Backward Compatible)

```javascript
import { showToast } from '../../utils/toast.js';

// All basic usage still works
showToast('success', 'Data berhasil disimpan');
showToast('error', 'Gagal menyimpan: ' + error.message, 7000);
showToast('warning', 'Silakan isi semua field wajib');
showToast('info', 'Mohon menunggu proses...');
```

#### Advanced Options

```javascript
// Available placement positions
showToast('success', 'Message', {
    placement: 'top-right'     // Default
    placement: 'top-left'
    placement: 'bottom-right'
    placement: 'bottom-left'
    placement: 'center'        // Modal-like center
});

// Custom styling
showToast('info', 'Customer registered', {
    customIcon: 'bi-person-plus-fill',  // Override icon
    customTitle: 'Pelanggan Baru',       // Override title
    customClass: 'shadow-xl'             // Additional CSS classes
});

// Advanced features
showToast('success', 'Saved!', {
    duration: 3000,                      // Auto-dismiss ms (default 5000)
    dismissible: true,                   // Show close button (default true)
    queue: true,                         // Use queue system (default true)
    ariaLive: 'assertive',              // ARIA live region: 'assertive', 'polite', 'off'
    callback: () => {                    // Called when dismissed
        refreshDataTable();
    }
});
```

#### Common Use Cases

```javascript
// Form validation
if (!name || !phone) {
    showToast('warning', 'Nama dan No. HP wajib diisi', {
        placement: 'top-left',
        customIcon: 'bi-exclamation-circle'
    });
    return;
}

// Async operation with progress
async function saveData() {
    showToast('info', 'Menyimpan data...', {
        dismissible: false,
        duration: 30000
    });
    
    try {
        const result = await api.save();
        clearAllToasts();
        showToast('success', 'Data berhasil disimpan');
    } catch (err) {
        clearAllToasts();
        showToast('error', err.message, {
            placement: 'bottom-left'
        });
    }
}

// Work order notification
showToast('success', 'WO-2603001 assigned to Ahmad', {
    customIcon: 'bi-clipboard-check',
    customTitle: 'Pekerjaan Ditugaskan',
    placement: 'bottom-right'
});
```

#### Queue Management

Toasts are automatically queued and displayed sequentially by default:

```javascript
// These appear one after another
showToast('success', 'First');
showToast('info', 'Second');
showToast('warning', 'Third');

// Check queue size
const pending = getQueueSize();

// Bypass queue for same-time display (use different placements)
showToast('info', 'Top right', { placement: 'top-right', queue: false });
showToast('success', 'Bottom left', { placement: 'bottom-left', queue: false });

// Clear all toasts
clearAllToasts();
```

#### Full API Reference

```javascript
// showToast(type, message, [options])
showToast('success', 'Message', {
    duration: 5000,           // number (ms)
    placement: 'top-right',   // 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center'
    dismissible: true,        // boolean
    customClass: '',          // string (CSS classes)
    customIcon: null,         // string (Bootstrap Icon class, e.g., 'bi-check')
    customTitle: null,        // string
    ariaLive: 'assertive',   // 'assertive' | 'polite' | 'off'
    callback: null,           // function
    queue: true               // boolean
});

// Utility functions
clearAllToasts();             // Remove all toasts
getQueueSize();               // Returns number of pending toasts
```

#### File Location
- **Implementation**: [src/admin/utils/toast.js](src/admin/utils/toast.js)
- **Examples**: [src/admin/utils/toast-examples.js](src/admin/utils/toast-examples.js)
- **HTML Container**: Present in `admin/index.html` and `admin/login.html`

---

### 3.2 Standard Module Template

```javascript
// src/admin/modules/{feature}.js

import { supabase } from '../../api/supabase.js';
import { showToast } from '../utils/toast.js';

export async function initFeature() {
    // ═══════════════════════════════════════════════════════════
    // 1. DOM REFERENCES
    // ═══════════════════════════════════════════════════════════
    const listContainer = document.getElementById('feature-list');
    const addBtn = document.getElementById('add-feature-btn');

    // ═══════════════════════════════════════════════════════════
    // 2. EVENT LISTENERS
    // ═══════════════════════════════════════════════════════════
    if (addBtn) addBtn.onclick = () => showModal();

    // ═══════════════════════════════════════════════════════════
    // 3. DATA LOADING FUNCTION
    // ═══════════════════════════════════════════════════════════
    async function loadData() {
        listContainer.innerHTML = 'Memuat data...';
        
        const { data, error } = await supabase
            .from('table_name')
            .select('*, relation(field)')
            .order('created_at', { ascending: false });

        if (error) {
            showToast('error', 'Gagal memuat data: ' + error.message);
            listContainer.innerHTML = `<div class="text-danger">Error: ${error.message}</div>`;
            return;
        }

        renderTable(data);
    }

    // ═══════════════════════════════════════════════════════════
    // 4. RENDERING FUNCTION
    // ═══════════════════════════════════════════════════════════
    function renderTable(data) {
        if (data.length === 0) {
            listContainer.innerHTML = `
                <div class="text-white-50 text-center py-5">
                    <i class="bi bi-inbox fs-1 d-block mb-3"></i>
                    Tidak ada data ditemukan.
                </div>`;
            return;
        }

        listContainer.innerHTML = `
            <div class="table-container shadow-sm">
                <table class="table table-dark table-hover align-middle">
                    <thead class="table-light">
                        <tr>
                            <th>Column 1</th>
                            <th>Column 2</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.field1}</td>
                                <td>${item.field2}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${item.id}">
                                        <i class="bi bi-pencil me-1"></i> Edit
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        // Attach edit handlers
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.onclick = () => showModal(data.find(d => d.id === btn.dataset.id));
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 5. MODAL HANDLING
    // ═══════════════════════════════════════════════════════════
    async function showModal(item = null) {
        const modal = new bootstrap.Modal(document.getElementById('crudModal'));
        const modalTitle = document.getElementById('crudModalTitle');
        const modalBody = document.getElementById('crudModalBody');
        const saveBtn = document.getElementById('save-crud-btn');

        modalTitle.innerText = item ? 'Edit Item' : 'Tambah Item';
        modalBody.innerHTML = `
            <form id="item-form">
                <div class="mb-3">
                    <label class="form-label">Field Name</label>
                    <input type="text" class="form-control" id="item-field" 
                           value="${item?.field || ''}" required>
                </div>
            </form>
        `;

        // Clone button to remove old listeners
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

        newSaveBtn.onclick = async () => {
            const payload = {
                field: document.getElementById('item-field').value,
            };

            let result;
            if (item) {
                result = await supabase.from('table_name').update(payload).eq('id', item.id);
            } else {
                result = await supabase.from('table_name').insert(payload);
            }

            if (result.error) {
                showToast('error', 'Gagal menyimpan: ' + result.error.message);
                return;
            }

            showToast('success', item ? 'Data diperbarui.' : 'Data berhasil ditambahkan.');
            modal.hide();
            loadData();
        };

        modal.show();
    }

    // ═══════════════════════════════════════════════════════════
    // 6. INITIAL LOAD
    // ═══════════════════════════════════════════════════════════
    loadData();
}
```

### 3.2 Table Styling Pattern

```html
<!-- Standard Bootstrap Dark Table -->
<div class="table-container shadow-sm">
    <table class="table table-dark table-hover align-middle">
        <thead class="table-light">
            <tr>
                <th>Header</th>
            </tr>
        </thead>
        <tbody>
            <!-- rows -->
        </tbody>
    </table>
</div>
```

### 3.3 Status Badge Pattern

```javascript
// Status badges with conditional colors
`<span class="badge rounded-pill px-3 ${
    status === 'Aktif' ? 'bg-success' : 
    status === 'waiting' ? 'bg-warning text-dark' :
    status === 'open' ? 'bg-primary' :
    status === 'closed' ? 'bg-secondary' : 'bg-danger'
}">${status}</span>`
```

### 3.4 Empty State Pattern

```javascript
// Consistent empty state with icon
`<div class="text-white-50 text-center py-5">
    <i class="bi bi-inbox fs-1 d-block mb-3"></i>
    Tidak ada data ditemukan.
</div>`
```

### 3.5 Supabase Query Patterns

```javascript
// SELECT with relations
const { data, error } = await supabase
    .from('work_orders')
    .select('*, customers(name, phone), employees(name), master_queue_types(name)')
    .order('created_at', { ascending: false });

// INSERT
const { error } = await supabase.from('customers').insert({
    name: 'John',
    phone: '08123456789'
});

// UPDATE
const { error } = await supabase
    .from('employees')
    .update({ status: 'Non-Aktif' })
    .eq('id', employeeId);

// DELETE
const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', itemId);

// UPSERT with conflict handling
const { error } = await supabase
    .from('app_settings')
    .upsert({ setting_key: 'theme', setting_value: 'dark' });

// Filter patterns
.eq('status', 'active')           // equals
.neq('status', 'deleted')         // not equals
.gt('price', 100)                 // greater than
.gte('stock', 0)                  // greater than or equal
.lt('created_at', date)           // less than
.lte('updated_at', date)          // less than or equal
.like('name', '%keyword%')        // pattern match
.ilike('email', '%@gmail.com')    // case-insensitive pattern
.in('status', ['open', 'closed']) // in array
.is('deleted_at', null)           // is null
.not('role', 'eq', 'guest')       // negation
.or('status.eq.open,status.eq.confirmed') // OR condition
```

---

## 6. Feature Checkpoint Matrix

### Implementation Status

| Module | File | Status | Complexity | Notes |
|--------|------|--------|------------|-------|
| **Authentication** | `auth-service.js` | ✅ Done | 🟡 Medium | Login/logout/session |
| **Dashboard** | `dashboard.js` | ✅ Done | 🟢 Low | Stats via `/api/dashboard/stats` |
| **Employees** | `employees.js` | ✅ Done | 🟡 Medium | CRUD; create via `/api/admin/create-user` |
| **Customers** | `customers.js` | ✅ Done | 🟡 Medium | Read client-side; PATCH/DELETE via API |
| **Packages** | `packages.js` | ✅ Done | 🟢 Low | CRUD via `/api/packages` |
| **Inventory** | `inventory.js` | ✅ Done | 🟢 Low | CRUD via `/api/inventory` |
| **Roles** | `roles.js` | ✅ Done | 🟢 Low | CRUD via `/api/roles` |
| **Settings** | `settings.js` | ✅ Done | 🟢 Low | CRUD via `/api/settings` |
| **Work Orders** | `work-orders/` | ✅ Done | 🔴 High | Full lifecycle via `/api/work-orders/*` |
| **Customer Map** | `customer-map-view.js` | ✅ Done | 🔴 High | Leaflet integration, markers |
| **Add Customer** | `add-customer-view.js` | ✅ Done | 🟡 Medium | Form with location picker |
| **Add PSB Page** | `add-psb-page.js` | ✅ Done | 🔴 High | 3-step wizard, photo upload |

### API Coverage Status

| Operation Category | Before | After | Method |
|--------------------|--------|-------|--------|
| User creation (auth) | ❌ Client `signUp()` | ✅ `/api/admin/create-user` | POST |
| Password reset | ✅ API | ✅ `/api/admin/reset-password` | POST |
| Customer list | ✅ API | ✅ `/api/customers` | GET |
| Customer update | ❌ Direct Supabase | ✅ `/api/customers/:id` | PATCH |
| Customer delete | ❌ Direct Supabase | ✅ `/api/customers/:id` | DELETE |
| WO list | ❌ Direct Supabase | ✅ `/api/work-orders` | GET |
| WO create | ❌ Direct Supabase | ✅ `/api/work-orders` | POST |
| WO update | ❌ Direct Supabase | ✅ `/api/work-orders/:id` | PATCH |
| WO delete | ❌ Direct Supabase | ✅ `/api/work-orders/:id` | DELETE |
| WO confirm | ❌ Direct Supabase | ✅ `/api/work-orders/confirm` | POST |
| WO claim | ✅ API | ✅ `/api/work-orders/claim` | POST |
| WO close | ✅ API | ✅ `/api/work-orders/close` | POST |
| Packages CRUD | ❌ Direct Supabase | ✅ `/api/packages` + `/:id` | GET/POST/PATCH/DELETE |
| Inventory CRUD | ❌ Direct Supabase | ✅ `/api/inventory` + `/:id` | GET/POST/PATCH/DELETE |
| Roles CRUD | ❌ Direct Supabase | ✅ `/api/roles` | GET/POST |
| Settings CRUD | ❌ Direct Supabase | ✅ `/api/settings` | GET/PATCH |
| Dashboard stats | ❌ 4 separate queries | ✅ `/api/dashboard/stats` | GET (cached 30s) |

### Feature Roadmap

```
PHASE 1 - Master Data ✅ COMPLETE
├── Employees CRUD
├── Customers CRUD
├── Inventory CRUD
└── Packages CRUD

PHASE 2 - Work Orders ✅ COMPLETE
├── Queue Management
├── Status Workflow
├── Installation Monitoring
└── Map Integration

PHASE 3 - Serverless API ✅ COMPLETE
├── All mutations via Vercel Edge Functions
├── isAdmin() role codes fixed (S_ADM/OWNER/ADM)
├── withCors(), hasRole(), generateCustomerCode()
└── Dashboard stats aggregation endpoint

PHASE 4 - Security 🏗️ IN PROGRESS
├── RLS Policy Hardening ⏳
├── Remove Backdoor Credentials ⏳
└── Input Validation ⏳

PHASE 5 - Finance ⏳ PENDING
├── Invoice Generation
├── Payment Tracking
└── Revenue Reports

PHASE 6 - Points System 🏗️ IN PROGRESS
├── Point Calculation Formula ✅ (in /api/work-orders/close)
├── Technician Leaderboard ✅ (in /api/dashboard/stats)
└── Performance Reports ⏳
```

---

## 7. Code Review Checklist

### Pre-Commit Checklist

#### Security (Critical)
- [ ] No hardcoded credentials or API keys
- [ ] No `console.log` with sensitive data
- [ ] User input is sanitized before database operations
- [ ] RLS policies properly restrict data access
- [ ] No client-side price/discount calculations (use Edge Functions)

#### Code Quality
- [ ] Functions are < 50 lines (split if longer)
- [ ] Clear variable/function naming (English preferred)
- [ ] Consistent error handling (no bare `alert()`)
- [ ] Event listeners cleaned up (clone button pattern)
- [ ] No memory leaks (intervals/timeouts cleared)

#### Patterns
- [ ] Follows module template structure
- [ ] Uses shared `#crudModal` for CRUD operations
- [ ] Table uses `table-dark table-hover align-middle`
- [ ] Status badges use consistent color scheme
- [ ] Empty states use icon + message pattern

#### Supabase
- [ ] Queries include error handling
- [ ] Relations fetched in single query (no N+1)
- [ ] Proper use of `.maybeSingle()` vs `.single()`
- [ ] Updates/deletes include `.eq()` filter

#### UI/UX
- [ ] Loading states shown during async operations
- [ ] Form validation with user-friendly messages
- [ ] Mobile responsiveness verified
- [ ] No layout shifts after data loads

### Review Questions

```markdown
## Code Review Template

### Summary
Brief description of changes

### Checklist
- [ ] Security items verified
- [ ] Code quality standards met
- [ ] Pattern compliance checked
- [ ] Database queries optimized
- [ ] UI/UX requirements met

### Concerns
List any potential issues

### Testing
Describe manual testing performed
```

---

## 8. Best Practices Guide

### ✅ DO

```javascript
// ✅ Use async/await consistently
async function loadData() {
    const { data, error } = await supabase.from('table').select('*');
    if (error) throw error;
    return data;
}

// ✅ Clone buttons to prevent listener accumulation
const newBtn = saveBtn.cloneNode(true);
saveBtn.parentNode.replaceChild(newBtn, saveBtn);
newBtn.onclick = handleSave;

// ✅ Use template literals for HTML generation
const html = `<div class="${className}">${content}</div>`;

// ✅ Handle all error cases
if (error) {
    showToast('error', 'Gagal menyimpan: ' + error.message);
    return;
}

// ✅ Use meaningful variable names
const activeEmployees = employees.filter(e => e.status === 'Aktif');

// ✅ Early returns for cleaner code
if (!data) return;
if (data.length === 0) {
    renderEmptyState();
    return;
}

// ✅ Destructure Supabase responses
const { data: employees, error: fetchError } = await supabase...

// ✅ Use optional chaining
const roleName = employee?.roles?.name || 'Unknown';

// ✅ Consistent date formatting
const formatted = new Date(dateStr).toLocaleDateString('id-ID');
```

### ❌ DON'T

```javascript
// ❌ Don't use alert() for errors
alert('Error: ' + error.message); // Blocks UI, poor UX

// ❌ Don't ignore errors
const { data } = await supabase.from('table').select('*');
// Missing error check!

// ❌ Don't use inline event handlers
<button onclick="handleClick()">Click</button>

// ❌ Don't concatenate HTML strings
html += '<div>' + userInput + '</div>'; // XSS risk!

// ❌ Don't use var
var name = 'John'; // Use const or let

// ❌ Don't mutate function parameters
function process(arr) {
    arr.push(newItem); // Mutates original!
}

// ❌ Don't nest callbacks deeply
getData((data) => {
    process(data, (result) => {
        save(result, (response) => {
            // Callback hell!
        });
    });
});

// ❌ Don't hardcode URLs
const url = 'https://abc.supabase.co'; // Use config.js

// ❌ Don't skip loading states
listContainer.innerHTML = renderTable(data); // No loading indicator

// ❌ Don't use magic numbers
if (status === 3) { ... } // What is 3?
```

### Error Handling Pattern (Recommended)

```javascript
import { showToast } from '../utils/toast.js';

// Basic usage - backward compatible
try {
    const { error } = await supabase.from('table').insert(data);
    if (error) throw error;
    showToast('success', 'Data berhasil disimpan');
} catch (err) {
    showToast('error', 'Gagal menyimpan: ' + err.message);
}

// Enhanced usage with options
try {
    const { error } = await supabase.from('table').insert(data);
    if (error) throw error;
    showToast('success', 'Data berhasil disimpan!', {
        placement: 'bottom-right',
        customIcon: 'bi-check-circle-fill',
        duration: 4000
    });
} catch (err) {
    showToast('error', `Gagal menyimpan: ${err.message}`, {
        placement: 'top-left',
        duration: 7000,
        callback: () => {
            // Perform action when toast is dismissed
            console.log('User acknowledged error');
        }
    });
}
```

---

## 9. Maintenance Complexity Analysis

### Complexity Legend

| Level | Icon | Criteria |
|-------|------|----------|
| Low | 🟢 | Simple CRUD, <200 LOC, no external deps |
| Medium | 🟡 | Relations, validation logic, 200-500 LOC |
| High | 🔴 | Complex state, external APIs, >500 LOC |

### Module-by-Module Analysis

#### 🟢 Low Complexity (Easy to Maintain)

**`roles.js`**
- Simple 2-field CRUD (name, code)
- No relations or complex logic
- ~100 LOC
- **Risk**: Low
- **Refactor Need**: None

**`packages.js`**
- 4-field CRUD (name, price, speed, description)
- No relations
- ~120 LOC
- **Risk**: Low
- **Refactor Need**: Add price validation

**`settings.js`**
- Key-value pair management
- Upsert logic only
- ~80 LOC
- **Risk**: Low
- **Refactor Need**: None

**`inventory.js`**
- 4-field CRUD with stock tracking
- No relations
- ~130 LOC
- **Risk**: Low
- **Refactor Need**: Add stock transaction logging

---

#### 🟡 Medium Complexity (Moderate Maintenance)

**`employees.js`**
- 12+ fields with role relation
- Join to roles table
- Validation for employee_id uniqueness
- ~250 LOC
- **Risk**: Medium (role changes affect permissions)
- **Refactor Need**: Extract form validation

**`customers.js`**
- 15+ fields with location data
- Map picker integration
- Photo upload (Base64)
- ~400 LOC
- **Risk**: Medium (photo storage, map deps)
- **Refactor Need**: Move photos to Supabase Storage

**`dashboard.js`**
- Aggregates from multiple tables
- Stats calculations
- ~150 LOC
- **Risk**: Medium (performance with growth)
- **Refactor Need**: Use database views/functions

---

#### 🔴 High Complexity (Careful Maintenance Required)

**`work-orders.js`**
- Complex status workflow (waiting → confirmed → open → closed)
- Multiple filter combinations
- Installation monitoring sub-module
- Map integration with status markers
- Employee assignment logic
- ~800 LOC
- **Risk**: High (core business logic)
- **Refactor Need**: 
  - Split into smaller modules
  - Extract status machine
  - Add unit tests
- **Dependencies**: customers, employees, master_queue_types, installation_monitorings

**`customer-map-view.js`**
- Leaflet.js integration
- Custom marker icons by status
- Real-time filtering
- Popup with customer details
- ~450 LOC
- **Risk**: High (external library, performance)
- **Refactor Need**:
  - Cluster markers for performance
  - Add error boundary for map failures

**`add-psb-page.js`**
- 3-step wizard with validation
- Photo capture (camera/file)
- Location picker
- Customer + Work Order creation in transaction
- ~600 LOC
- **Risk**: High (multi-step, photo handling)
- **Refactor Need**:
  - Extract step components
  - Use form library (Zod)
  - Queue for offline submissions

---

### Technical Debt Hotspots

```
Priority | File                    | Issue                          | Impact
─────────┼─────────────────────────┼────────────────────────────────┼───────────
P0       │ auth-service.js         │ Hardcoded backdoor credentials │ Security
P0       │ schema.sql              │ USING(true) RLS policies       │ Security
P1       │ All modules             │ alert() for error handling     │ UX
P1       │ work-orders.js          │ 800 LOC monolith               │ Maintainability
P2       │ customers.js            │ Base64 photo storage           │ Storage/Perf
P2       │ All modules             │ No form validation library     │ Data integrity
P3       │ admin.js                │ window.switchAdminModule       │ Global pollution
```

---

## 10. Storage Optimization Strategy

> Reference: [optimation.md](optimation.md)

Supabase Free Tier has **500MB database + 1GB storage** limits. This section documents strategies to stay within limits.

### 10.1 Master-Transactional Sharding (Future)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DUAL-PROJECT ARCHITECTURE (FUTURE)                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────┐         ┌─────────────────────────┐
│   Project A (Master)    │         │  Project B (Transactions)│
├────────────────────────┤         ├─────────────────────────┤
│ • Auth/Users            │         │ • work_orders           │
│ • profiles              │         │ • installation_monitorings│
│ • roles                 │◄───────▶│ • activity_logs         │
│ • employees (reference) │  Cross  │ • notifications         │
│ • customers (reference) │  Link   │ • audit_trail           │
│ • app_settings          │         │                         │
├────────────────────────┤         ├─────────────────────────┤
│ Target: < 50MB          │         │ Target: < 400MB         │
│ (rarely grows)          │         │ (prune when needed)     │
└────────────────────────┘         └─────────────────────────┘
```

### 10.2 Image Storage Best Practices

```javascript
// ❌ CURRENT (Bad) - Base64 in database column
const photo = await capturePhoto();
const base64 = await toBase64(photo);  // ~500KB per image!
await supabase.from('customers').update({ photo_ktp: base64 });

// ✅ RECOMMENDED - Supabase Storage
const photo = await capturePhoto();
const fileName = `customers/${customerId}/ktp_${Date.now()}.jpg`;

// Upload to Storage bucket (1GB free)
const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, photo, { contentType: 'image/jpeg' });

// Store only the URL in database (~100 bytes)
const photoUrl = supabase.storage.from('photos').getPublicUrl(fileName);
await supabase.from('customers').update({ photo_ktp: photoUrl });
```

**Migration Path**:
1. Create `photos` storage bucket
2. Add migration to move existing Base64 to Storage
3. Update photo upload logic in `add-psb-page.js` and `customers.js`
4. Clean up old Base64 columns

### 10.3 Database Size Management

#### Auto-Pruning Strategy

```sql
-- Create scheduled cleanup function
CREATE OR REPLACE FUNCTION prune_old_data()
RETURNS void AS $$
BEGIN
    -- Delete notifications older than 30 days
    DELETE FROM notifications 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Archive closed work orders older than 1 year
    INSERT INTO work_orders_archive
    SELECT * FROM work_orders 
    WHERE status = 'closed' 
    AND completed_at < NOW() - INTERVAL '1 year';
    
    DELETE FROM work_orders 
    WHERE status = 'closed' 
    AND completed_at < NOW() - INTERVAL '1 year';
    
    -- Vacuum to reclaim space
    VACUUM ANALYZE;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron (if available)
SELECT cron.schedule('prune-weekly', '0 2 * * 0', 'SELECT prune_old_data()');
```

#### Calculated Summaries Pattern

```javascript
// ❌ BAD - Storing every transaction row for charts
// 1000 rows × 100 bytes = 100KB per customer

// ✅ GOOD - Store daily summaries
// 1 row per day × 50 bytes = 1.5KB per month per customer

// daily_summaries table
{
    date: '2026-03-15',
    customer_count: 150,
    new_registrations: 5,
    completed_installations: 3,
    revenue_total: 25000000
}
```

### 10.4 Edge Functions for Heavy Processing

```typescript
// supabase/functions/calculate-invoice/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    const { customer_id, month } = await req.json();
    
    // Heavy calculation in Edge Function (not client-side)
    const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Calculate with server-side validation
    const { data: customer } = await supabase
        .from('customers')
        .select('packet, install_date')
        .eq('id', customer_id)
        .single();
    
    const { data: pkg } = await supabase
        .from('internet_packages')
        .select('price')
        .eq('name', customer.packet)
        .single();
    
    // Apply discounts server-side (not client manipulable)
    const discount = calculateDiscount(customer.install_date);
    const total = pkg.price - discount;
    
    return new Response(JSON.stringify({ total, discount }), {
        headers: { 'Content-Type': 'application/json' }
    });
});
```

### 10.5 Monitoring Database Size

```sql
-- Check current database size
SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;

-- Size per table
SELECT 
    schemaname || '.' || tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;

-- Set up alert at 400MB
CREATE OR REPLACE FUNCTION check_db_size()
RETURNS void AS $$
DECLARE
    current_size BIGINT;
BEGIN
    SELECT pg_database_size(current_database()) INTO current_size;
    
    IF current_size > 400 * 1024 * 1024 THEN  -- 400MB
        -- Send alert (via Edge Function webhook)
        PERFORM net.http_post(
            url := 'https://your-function/alert',
            body := json_build_object('size_mb', current_size / 1024 / 1024)
        );
    END IF;
END;
$$ LANGUAGE plpgsql;
```

### 10.6 Emergency Backup Plan

When approaching 450MB:

```javascript
// Export old data to Storage as JSON/CSV
async function archiveOldData() {
    // 1. Fetch old closed work orders
    const { data: oldOrders } = await supabase
        .from('work_orders')
        .select('*')
        .eq('status', 'closed')
        .lt('completed_at', oneYearAgo);
    
    // 2. Save to Storage as JSON
    const fileName = `archives/work_orders_${Date.now()}.json`;
    await supabase.storage
        .from('backups')
        .upload(fileName, JSON.stringify(oldOrders));
    
    // 3. Delete from database
    await supabase
        .from('work_orders')
        .delete()
        .in('id', oldOrders.map(o => o.id));
    
    // 4. Vacuum to reclaim space (run via SQL Editor)
    // VACUUM FULL work_orders;
}
```

---

## 11. Security Audit Findings (CRITICAL)

### 🚨 P0 - Critical Issues

#### Issue 1: Over-Permissive RLS Policies

**Location**: `src/api/schema.sql`

**Current State**:
```sql
-- ❌ DANGEROUS - Allows any authenticated user full access
CREATE POLICY "Enable all for anyone" ON public.customers FOR ALL USING (true);
CREATE POLICY "Enable all for anyone" ON public.work_orders FOR ALL USING (true);
CREATE POLICY "Enable all for anyone" ON public.employees FOR ALL USING (true);
CREATE POLICY "Enable all for anyone" ON public.inventory_items FOR ALL USING (true);
```

**Risk**: Any authenticated user can read, update, or delete ALL data in these tables.

**Required Fix**:
```sql
-- ✅ SECURE - Role-based access
CREATE POLICY "Admins can manage customers" ON public.customers 
    FOR ALL USING (has_role('ADMIN') OR has_role('OWNER'))
    WITH CHECK (has_role('ADMIN') OR has_role('OWNER'));

CREATE POLICY "Technicians can view assigned work orders" ON public.work_orders
    FOR SELECT USING (
        has_role('ADMIN') OR 
        has_role('OWNER') OR 
        claimed_by = (SELECT id FROM employees WHERE email = auth.jwt()->>'email')
    );

CREATE POLICY "Admins can manage work orders" ON public.work_orders
    FOR ALL USING (has_role('ADMIN') OR has_role('OWNER'))
    WITH CHECK (has_role('ADMIN') OR has_role('OWNER'));
```

---

#### Issue 2: Hardcoded Backdoor Credentials

**Location**: `src/api/auth-service.js` (Line ~24)

**Current State**:
```javascript
// ❌ CRITICAL - Backdoor in production code
if (password === 'fatih1234') {
    // Bypass authentication
}
```

**Risk**: Anyone knowing this password can bypass authentication.

**Required Fix**:
```javascript
// ✅ REMOVE ENTIRELY or use environment check
if (import.meta.env.DEV && password === import.meta.env.VITE_DEV_BYPASS) {
    // Only in development
}
```

---

### 🔴 P1 - High Priority Issues

#### Issue 3: Global Function Exposure

**Location**: `src/admin/admin.js`

**Current State**:
```javascript
window.switchAdminModule = (target) => { ... };
window.adminModalMap = mapInstance;
```

**Risk**: XSS payloads could call `window.switchAdminModule()` or access map instance.

**Required Fix**:
```javascript
// Use CustomEvents instead
document.dispatchEvent(new CustomEvent('navigate', { detail: { target } }));
```

---

#### Issue 4: No Input Sanitization

**Location**: All modules generating HTML from user data

**Current State**:
```javascript
// ❌ XSS risk - user input directly in HTML
listContainer.innerHTML = `<div>${customer.name}</div>`;
```

**Required Fix**:
```javascript
// ✅ Sanitize or use textContent
const div = document.createElement('div');
div.textContent = customer.name;
listContainer.appendChild(div);

// OR use a sanitization library
import DOMPurify from 'dompurify';
listContainer.innerHTML = DOMPurify.sanitize(`<div>${customer.name}</div>`);
```

---

### 🟡 P2 - Medium Priority Issues

| Issue | Location | Risk | Fix |
|-------|----------|------|-----|
| Client-side price calculations | work-orders.js | Data manipulation | Move to Edge Function |
| No CSRF protection | All forms | Request forgery | Add tokens |
| Session stored in localStorage | supabase.js | XSS token theft | Use httpOnly cookies |
| No rate limiting | auth-service.js | Brute force | Add server-side limits |

---

## 12. Future Improvement Roadmap

### Quick Wins (1-2 Days)

| Task | Impact | Effort |
|------|--------|--------|
| Remove backdoor credentials | 🔴 Critical | 🟢 Low |
| Replace `alert()` with toast system | 🟡 Medium | 🟢 Low |
| Add loading spinners to all modules | 🟢 Low | 🟢 Low |
| Fix hardcoded URLs to use config | 🟢 Low | 🟢 Low |

### Medium Term (1-2 Weeks)

| Task | Impact | Effort |
|------|--------|--------|
| Implement proper RLS policies | 🔴 Critical | 🟡 Medium |
| Add Zod schemas for form validation | 🟡 Medium | 🟡 Medium |
| Extract reusable UI components | 🟡 Medium | 🟡 Medium |
| Migrate photos to Supabase Storage | 🟡 Medium | 🟡 Medium |
| Add error boundary middleware | 🟡 Medium | 🟡 Medium |

### Long Term (1+ Month)

| Task | Impact | Effort |
|------|--------|--------|
| Migrate to TypeScript | 🟡 Medium | 🔴 High |
| Add Vitest unit tests | 🟡 Medium | 🔴 High |
| Add Playwright E2E tests | 🟡 Medium | 🔴 High |
| Implement offline-first with sync | 🟡 Medium | 🔴 High |
| Add error monitoring (Sentry) | 🟢 Low | 🟡 Medium |
| Implement audit logging | 🟡 Medium | 🟡 Medium |

### Architecture Evolution

```
Current State                    Target State
─────────────────────────────    ─────────────────────────────
Vanilla JS                   →   TypeScript
alert() errors               →   Toast notifications
Manual validation            →   Zod schemas
Base64 photos                →   Supabase Storage URLs
USING(true) RLS              →   Role-based RLS
Global functions             →   CustomEvent communication
800 LOC monoliths            →   <200 LOC focused modules
No tests                     →   80%+ coverage
```

### Notification System (Future)

#### WhatsApp Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WHATSAPP NOTIFICATION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

Event Trigger                 Edge Function              WhatsApp Provider
─────────────────────────────────────────────────────────────────────────────
Work Order Created    ───▶   notify-customer     ───▶   Fonnte/Wablas API
                                    │
Status = Confirmed    ───▶   notify-technician   ───▶   Template: "Jadwal Hari Ini"
                                    │
Status = Closed       ───▶   notify-completion   ───▶   Template: "Pemasangan Selesai"
```

**Implementation Options**:

| Provider | Free Tier | Notes |
|----------|-----------|-------|
| Fonnte | 10 msgs/day | Indonesian provider |
| Wablas | Limited | Indonesian provider |
| WhatsApp Cloud API | 1000/month | Official Meta API |

**Edge Function Example**:

```typescript
// supabase/functions/notify-whatsapp/index.ts
serve(async (req) => {
    const { phone, template, params } = await req.json();
    
    const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
            'Authorization': Deno.env.get('FONNTE_TOKEN')!,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            target: phone,
            message: formatTemplate(template, params)
        })
    });
    
    return new Response(JSON.stringify(await response.json()));
});
```

#### PWA In-App Notifications

```javascript
// Service Worker Push Notification
// Already have vite-plugin-pwa configured

// 1. Register for push notifications
async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPID_PUBLIC_KEY
    });
    
    // Save subscription to database
    await supabase.from('push_subscriptions').insert({
        user_id: currentUser.id,
        subscription: JSON.stringify(subscription)
    });
}

// 2. Edge Function to send push
serve(async (req) => {
    const { user_id, title, body } = await req.json();
    
    const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('subscription')
        .eq('user_id', user_id);
    
    for (const sub of subscriptions) {
        await webPush.sendNotification(
            JSON.parse(sub.subscription),
            JSON.stringify({ title, body })
        );
    }
});
```

**Database Schema for Notifications**:

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    type TEXT NOT NULL,  -- 'whatsapp', 'push', 'email'
    title TEXT NOT NULL,
    body TEXT,
    data JSONB,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    subscription JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### Updated Feature Roadmap

```
CURRENT
├── ✅ Phase 1: Master Data (Complete)
├── ✅ Phase 2: Work Orders (Complete)
└── 🏗️ Phase 3: Security Hardening (In Progress)

NEXT UP
├── ⏳ Phase 4: Points System
│   ├── Define point formulas per ticket type
│   ├── Technician leaderboard
│   └── Monthly performance reports
│
├── ⏳ Phase 5: Finance Module
│   ├── Invoice generation
│   ├── Payment tracking
│   └── Revenue dashboard
│
└── ⏳ Phase 6: Notification System
    ├── WhatsApp integration (Fonnte API)
    ├── PWA push notifications
    └── Email notifications (optional)

LONG TERM
├── ⏳ Phase 7: Attendance & HR
├── ⏳ Phase 8: Inventory Integration
└── ⏳ Phase 9: Payroll Engine
```

---

## 13. Appendix: Command Reference

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Supabase CLI

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Generate types (if using TypeScript)
supabase gen types typescript --local > src/types/database.ts

# Deploy Edge Function
supabase functions deploy function-name

# View logs
supabase functions logs function-name
```

### Database

```bash
# Connect to local DB
psql postgresql://postgres:postgres@localhost:54322/postgres

# Run schema
psql -f src/api/schema.sql

# Reset database
supabase db reset
```

### Useful Queries

```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Count records per table
SELECT 
    schemaname,
    relname,
    n_live_tup AS row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Work order stats
SELECT * FROM get_work_order_stats();

-- Find users with role
SELECT p.email, r.name as role 
FROM profiles p 
JOIN roles r ON p.role_id = r.id;
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SIFATIH QUICK REFERENCE                               │
├─────────────────────────────────────────────────────────────────────────┤
│ ENTRY POINT     │ admin/index.html → admin.js → modules/*.js            │
│ DATA LAYER      │ supabase.js → Supabase cloud                          │
│ STYLES          │ Bootstrap 5 + admin.css + themes.css                  │
│ ICONS           │ Bootstrap Icons (bi-* classes)                        │
│ MAPS            │ Leaflet.js + OpenStreetMap tiles                      │
├─────────────────────────────────────────────────────────────────────────┤
│ NOTIFICATIONS   │ showToast(type, msg, options) - Enhanced system       │
│                 │ • 5 placements: top-right/left, bottom-right/left, center│
│                 │ • Custom icons, titles, styles                         │
│                 │ • Queue management (auto-sequential display)          │
│                 │ • File: src/admin/utils/toast.js                      │
├─────────────────────────────────────────────────────────────────────────┤
│ NEW MODULE      │ 1. Create src/admin/modules/name.js                   │
│                 │ 2. Export initName() function                         │
│                 │ 3. Add case in admin.js initModule()                  │
│                 │ 4. Add nav item + content container in HTML           │
├─────────────────────────────────────────────────────────────────────────┤
│ MODAL CRUD      │ Use #crudModal, #crudModalTitle, #crudModalBody       │
│ TABLE           │ table-dark table-hover align-middle                   │
│ STATUS BADGE    │ badge rounded-pill px-3 bg-{status}                   │
│ EMPTY STATE     │ text-white-50 text-center py-5 + icon                 │
├─────────────────────────────────────────────────────────────────────────┤
│ ⚠️ CRITICAL     │ Fix RLS policies before production deployment!        │
│ ⚠️ CRITICAL     │ Remove backdoor credentials from auth-service.js!     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*This guide is a living document. Update it as the codebase evolves.*
