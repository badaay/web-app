# Step-by-Step Implementation Guide

This document outlines the detailed, phase-by-phase implementation plan for the Lightweight Multi-Role Web App. The strategy prioritizes building a Minimum Viable Product (MVP) centered around the **Master Data** and **Work Order System** first, leveraging the Vanilla JS + Vite + Supabase architecture, before migrating more complex and high-risk modules (like Payroll).

---

## 🏗️ Phase 0: Project Setup & Infrastructure (Foundation)
Before jumping into app features, the foundational architecture must be established to ensure the app is offline-capable, lightweight, and secure.

### Tasks:
1. **Initialize Project:** 
   - Set up the project using Vite + Vanilla JS.
   - Configure the folder structure separating `/admin` and `/customer`.
2. **PWA & Caching Setup:**
   - Install and configure `vite-plugin-pwa`.
   - Set up the Service Worker (`sw.js`) and Workbox caching strategies (Cache First for static assets, Stale-While-Revalidate for Supabase API).
   - Create `manifest.json` for installability.
3. **Backend Integration (Supabase):**
   - Create a new Supabase project.
   - Initialize Supabase client in `/src/api`.
   - Set up Supabase Auth for login/signup.
4. **Database Security (RLS):**
   - Define user roles (`admin`, `owner`, `customer`).
   - Implement Row Level Security (RLS) policies so users can only access appropriate data.
5. **CI/CD:**
   - Set up GitHub Actions workflow (`deploy.yml`) to automatically build and deploy to GitHub Pages.

---

## 🚀 Phase 1: MVP Core - Master Data Module (Low Risk)
**Goal:** Establish the foundational data required for work orders. This phase runs parallel with existing Excel processes.

### Database Schema (Supabase):
- employees
- `customers`
- `inventory_items`
- `locations` (For maps integration)

### Features to Implement:
1. **Auth UI:** Login pages and role-based routing (Admin vs Customer dashboards).
2. **CRUD Interfaces:** 
   - Build lightweight, vanilla JS forms and tables for Customers, and Inventory Items.
3. **Map Integration (Leaflet.js):**
   - Lazy load Leaflet maps for displaying customer/inventory locations.
   - Fetch coordinate data from the `locations` table.

---

## ⚙️ Phase 2: MVP Core - Work Order System (The Heart of the App)
**Goal:** Stop inputting daily tasks into Excel. All other modules depend on this workflow.

### Database Schema (Supabase):
- `work_orders` (linked to `customers`, `employees`, and `inventory_items`)

### Features to Implement:
1. **Work Order Management:**
   - Create interface to generate and assign work orders to employees.
   - Implement Status Workflows (e.g., Pending -> In Progress -> Completed).
2. **Point Calculation:**
   - Automatically calculate points upon work order completion.
3. **Offline Sync (PWA):**
   - Allow employees to update work order statuses offline.
   - Queue actions in the Service Worker to sync with Supabase when the internet connection is restored.

> **🎉 MVP Milestone Reached:** Once Phase 1 and 2 are deployed, the core operational activities are live on the web app.

---

## 💰 Phase 3: Finance Module
**Goal:** Digitize financial tracking without abandoning Excel for high-level accounting yet.

### Features to Implement:
1. **Automated Ledger:** Auto-credit balances based on completed Work Orders.
2. **Manual Debit:** UI for owners/admins to manually input debit transactions.
3. **Real-Time Dashboard:** Show running balances and financial summaries.
4. **Reporting:** Add generic data export functionality (CSV/JSON) for historical tracking.

---

## ⏱️ Phase 4: Attendance & Overtime
**Goal:** Transition employee time tracking to the web app.

### Features to Implement:
1. **Daily Attendance:** Simple check-in/check-out UI for employees.
2. **Overtime Management:** Form for submitting overtime requests.
3. **Approval Workflow:** Dashboard for Admins/Owners to approve or reject overtime.
4. **Auto-Calculation:** Script to calculate overtime nominals based on approved hours.

---

## 📦 Phase 5: Inventory Integration
**Goal:** Full visibility over stock movements. (Can be done in parallel with Phase 4).

### Features to Implement:
1. **Movement Logs:** Track incoming and outgoing inventory items.
2. **Employee Stock:** Real-time tracking of stock currently held by individual employees.
3. **Work Order Links:** Automatically deduct items from inventory when used in a Work Order.

---

## ⚠️ Phase 6: Payroll Engine (High Risk)
**Goal:** Fully migrate the most sensitive component (salary calculations) from Excel to the Web App.

### Strategy: **2-Month Parallel Run**
- **Month 1 & 2:** Compute payroll in Excel as usual. Use the Web App to *simulate* and generate matching payroll outputs.
- **Verification:** Systematically compare the Web App's output against the Excel output.
- **Switch:** Once 100% accuracy is confirmed over two periods, fully switch.

### Features to Implement:
1. **Payroll Formula Engine:** Calculate total pay based on:
   - Base Salary
   - Points (from Work Orders)
   - Approved Overtime (from Phase 4)
   - Bonuses
   - Alpha Deductions (from Attendance)
2. **Payslip Generation:** UI to view, download, and print salary slips.

---

## 🏁 Final State
After all phases are complete, **Excel will be relegated purely to a historical backup archive.**
The 1,000+ users will interact solely with the high-performance, offline-capable PWA, communicating securely with Supabase.
