# VendorBridge — Complete Technical Architecture Document

> **Version:** 1.0  
> **Date:** 2026-06-06  
> **Stack:** Next.js 15 · TypeScript · Tailwind CSS · Shadcn UI · Prisma · PostgreSQL · NextAuth.js · Nodemailer · PDFKit · Vercel/Neon

---

## Table of Contents

1. [High-Level Architecture](#1-high-level-architecture)
2. [Project Folder Structure](#2-project-folder-structure)
3. [Feature Module Architecture](#3-feature-module-architecture)
4. [PostgreSQL Database Design](#4-postgresql-database-design)
5. [Prisma Architecture](#5-prisma-architecture)
6. [Route Architecture](#6-route-architecture)
7. [State Management Strategy](#7-state-management-strategy)
8. [Authentication & Authorization Architecture](#8-authentication--authorization-architecture)
9. [API & Server Actions Architecture](#9-api--server-actions-architecture)
10. [Development Roadmap](#10-development-roadmap)

---

## 1. High-Level Architecture

### 1.1 System Architecture Overview

VendorBridge is a **monolithic full-stack web application** built on Next.js 15 App Router. All frontend rendering, backend logic (Server Actions & Route Handlers), and database access reside in a single deployable unit on Vercel. External services (Neon PostgreSQL, Nodemailer SMTP, PDFKit) are consumed as discrete layers.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                               │
│                                                                     │
│   React Server Components (RSC) + Client Components                 │
│   Tailwind CSS + Shadcn UI + Next.js App Router                     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   NEXT.JS 15 APPLICATION (Vercel)                   │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │  App Router     │  │  Server Actions  │  │  Route Handlers  │   │
│  │  (Pages/Layout) │  │  (Mutations)     │  │  (PDF/Email API) │   │
│  └────────┬────────┘  └────────┬─────────┘  └────────┬─────────┘   │
│           │                    │                      │             │
│           └────────────────────▼──────────────────────┘             │
│                                │                                    │
│                    ┌───────────▼───────────┐                        │
│                    │   Service Layer       │                        │
│                    │  (Business Logic)     │                        │
│                    └───────────┬───────────┘                        │
│                                │                                    │
│                    ┌───────────▼───────────┐                        │
│                    │   Prisma ORM Client   │                        │
│                    └───────────┬───────────┘                        │
└────────────────────────────────┼────────────────────────────────────┘
                                 │  TCP / SSL
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                  DATABASE LAYER (Neon PostgreSQL)                   │
│                                                                     │
│  users · vendors · rfqs · rfq_items · quotations                   │
│  quotation_items · approvals · purchase_orders                      │
│  purchase_order_items · invoices · activity_logs                    │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                              │
│                                                                     │
│  ┌──────────────────┐   ┌─────────────────┐   ┌────────────────┐   │
│  │  Nodemailer SMTP │   │  PDFKit (Node)  │   │  NextAuth.js   │   │
│  │  (Invoice Email) │   │  (PDF Gen)      │   │  (Sessions)    │   │
│  └──────────────────┘   └─────────────────┘   └────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### 1.2 Layers

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Frontend** | Next.js 15 App Router, RSC, TypeScript, Tailwind CSS, Shadcn UI | UI rendering, routing, forms, data display |
| **Backend** | Next.js Server Actions, Route Handlers | Business logic, mutations, file-generation endpoints |
| **Service** | TypeScript service classes (`/lib/services/`) | Domain logic, DB queries, email, PDF generation |
| **ORM** | Prisma ORM | Type-safe DB access, migrations |
| **Database** | PostgreSQL (Neon) | Persistent data storage |
| **Auth** | NextAuth.js v5 (Auth.js) | Session management, JWT, RBAC |
| **Email** | Nodemailer | Transactional invoice email |
| **PDF** | PDFKit | Server-side PDF generation |

### 1.3 Module Interaction Map

```
Procurement Officer ──► RFQ Module ──► Vendor Assignment ──► Vendor Portal
                                                                    │
                                                         Quotation Submission
                                                                    │
                              Quotation Comparison ◄───────────────┘
                                      │
                               Approval Module ◄── Manager/Approver
                                      │
                              Purchase Order Module
                                      │
                               Invoice Module ──► PDF + Email (Nodemailer + PDFKit)
                                      │
                           Activity Log (auto-written at every step)
                                      │
                             Reports & Analytics
```

---

## 2. Project Folder Structure

```
vendorbridge/
│
├── app/                              # Next.js 15 App Router root
│   ├── (auth)/                       # Route group: public auth pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/                  # Route group: protected app pages
│   │   ├── layout.tsx                # Shell: Sidebar + Header wrapper
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── vendors/
│   │   │   ├── page.tsx              # Vendor list
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # Add vendor form
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Vendor detail / edit
│   │   ├── rfqs/
│   │   │   ├── page.tsx              # RFQ list
│   │   │   ├── new/
│   │   │   │   └── page.tsx          # RFQ creation form
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # RFQ detail
│   │   │       └── compare/
│   │   │           └── page.tsx      # Quotation comparison
│   │   ├── quotations/
│   │   │   ├── page.tsx              # All quotations list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Single quotation / submission form
│   │   ├── approvals/
│   │   │   ├── page.tsx              # Approval queue
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Single approval detail
│   │   ├── purchase-orders/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── activity/
│   │       └── page.tsx
│   │
│   ├── api/                          # Route Handlers (REST endpoints)
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts          # NextAuth.js handler
│   │   ├── invoices/
│   │   │   └── [id]/
│   │   │       ├── pdf/
│   │   │       │   └── route.ts      # GET – stream PDF binary
│   │   │       └── email/
│   │   │           └── route.ts      # POST – send invoice via email
│   │   └── reports/
│   │       └── export/
│   │           └── route.ts          # GET – export report CSV/PDF
│   │
│   ├── layout.tsx                    # Root layout (fonts, providers)
│   └── globals.css
│
├── components/                       # Shared UI components
│   ├── ui/                           # Shadcn UI primitives (auto-generated)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── AppShell.tsx
│   ├── common/
│   │   ├── DataTable.tsx             # Reusable paginated table
│   │   ├── StatCard.tsx              # KPI stat card
│   │   ├── StatusBadge.tsx           # Enum → colored badge
│   │   ├── ConfirmDialog.tsx         # Reusable confirm modal
│   │   ├── PageHeader.tsx
│   │   └── EmptyState.tsx
│   └── charts/
│       ├── SpendChart.tsx            # Monthly trend line/bar chart
│       ├── CategoryPieChart.tsx
│       └── VendorBarChart.tsx
│
├── features/                         # Feature-scoped components & logic
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── vendors/
│   │   ├── VendorTable.tsx
│   │   ├── VendorForm.tsx
│   │   └── VendorDetailCard.tsx
│   ├── rfqs/
│   │   ├── RFQForm.tsx
│   │   ├── RFQTable.tsx
│   │   ├── RFQItemsEditor.tsx        # Dynamic item rows
│   │   └── VendorAssignPicker.tsx
│   ├── quotations/
│   │   ├── QuotationForm.tsx
│   │   ├── QuotationTable.tsx
│   │   └── QuotationCompareTable.tsx
│   ├── approvals/
│   │   ├── ApprovalCard.tsx
│   │   ├── ApprovalTimeline.tsx
│   │   └── ApprovalRemarksForm.tsx
│   ├── purchase-orders/
│   │   ├── PODocument.tsx            # Document-style PO view
│   │   └── POTable.tsx
│   ├── invoices/
│   │   ├── InvoiceDocument.tsx       # Document-style invoice view
│   │   ├── InvoiceTable.tsx
│   │   └── EmailInvoiceDialog.tsx
│   ├── reports/
│   │   ├── ReportKPIRow.tsx
│   │   ├── SpendByCategoryTable.tsx
│   │   └── TopVendorsTable.tsx
│   └── activity/
│       └── ActivityFeed.tsx
│
├── lib/                              # Core library / backend utilities
│   ├── actions/                      # Next.js Server Actions (mutations)
│   │   ├── auth.actions.ts
│   │   ├── vendor.actions.ts
│   │   ├── rfq.actions.ts
│   │   ├── quotation.actions.ts
│   │   ├── approval.actions.ts
│   │   ├── purchase-order.actions.ts
│   │   ├── invoice.actions.ts
│   │   └── activity.actions.ts
│   │
│   ├── services/                     # Domain service layer
│   │   ├── vendor.service.ts
│   │   ├── rfq.service.ts
│   │   ├── quotation.service.ts
│   │   ├── approval.service.ts
│   │   ├── purchase-order.service.ts
│   │   ├── invoice.service.ts
│   │   ├── pdf.service.ts            # PDFKit wrapper
│   │   ├── email.service.ts          # Nodemailer wrapper
│   │   └── report.service.ts
│   │
│   ├── db.ts                         # Prisma client singleton
│   ├── auth.ts                       # NextAuth.js configuration
│   ├── auth.config.ts                # Auth providers & callbacks
│   └── utils.ts                      # Shared helpers (cn, formatCurrency, etc.)
│
├── prisma/
│   ├── schema.prisma                 # Single schema file
│   └── migrations/                   # Auto-generated migration history
│
├── types/                            # Global TypeScript type definitions
│   ├── index.ts                      # Re-export barrel
│   ├── auth.types.ts
│   ├── vendor.types.ts
│   ├── rfq.types.ts
│   ├── quotation.types.ts
│   ├── approval.types.ts
│   ├── purchase-order.types.ts
│   ├── invoice.types.ts
│   └── report.types.ts
│
├── hooks/                            # Custom React hooks (client-side)
│   ├── useCurrentUser.ts             # Session user from NextAuth
│   ├── useDebounce.ts                # Search debounce
│   └── usePermission.ts             # Role-based UI visibility
│
├── middleware.ts                     # Next.js middleware (route protection)
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local
```

### Folder Purpose Summary

| Folder | Purpose |
|--------|---------|
| `app/(auth)/` | Unauthenticated pages (login, register). No sidebar layout. |
| `app/(dashboard)/` | All protected ERP pages sharing the sidebar/header shell. |
| `app/api/` | Route Handlers only for binary responses (PDF stream) and external webhooks. |
| `components/ui/` | Shadcn UI primitives; never edited directly. |
| `components/common/` | Generic, reusable UI atoms used across features. |
| `components/charts/` | Chart wrappers (e.g., Recharts inside RSC-compatible wrappers). |
| `features/` | Feature-scoped components tightly coupled to one domain module. |
| `lib/actions/` | All Next.js Server Actions. The only place where DB writes are initiated. |
| `lib/services/` | Pure TypeScript domain logic. Called by both Server Actions and Route Handlers. |
| `lib/db.ts` | Singleton Prisma client — prevents connection pool exhaustion in dev. |
| `lib/auth.ts` | NextAuth.js `auth()` export and session utilities. |
| `prisma/` | Schema and migration history. Managed via `prisma migrate dev`. |
| `types/` | Shared TypeScript interfaces and enums. No runtime code. |
| `hooks/` | Client-only React hooks (marked `"use client"`). |
| `middleware.ts` | Edge-compatible route guard using NextAuth session token. |

---

## 3. Feature Module Architecture

---

### Module 1 — Authentication

**Responsibilities:** User login, registration, session creation/destruction, JWT issuance via NextAuth.js.

**Pages:**
- `/login` — Login form
- `/register` — Registration form

**Components (`features/auth/`):**
- `LoginForm.tsx` — Email + password with client-side validation
- `RegisterForm.tsx` — Full registration fields including role selector

**Server Actions (`lib/actions/auth.actions.ts`):**
- `registerUser()` — Hash password with bcrypt, insert user record, log activity
- `loginUser()` — Delegate to NextAuth `signIn()` provider
- `logoutUser()` — Call NextAuth `signOut()`

**Database Tables:** `users`

---

### Module 2 — Dashboard

**Responsibilities:** Aggregate KPIs, render overview table, show quick actions. All data is read-only on this page.

**Pages:**
- `/dashboard` — Main overview

**Components (`features/`, `components/`):**
- `StatCard` — Active RFQs, Pending Approvals, Procurement Spend, Vendor Count
- `DataTable` — Procurement Overview Table (recent RFQs/POs)
- `SpendChart`, `CategoryPieChart` — Analytics charts
- Quick Action buttons (Create RFQ, Add Vendor, View Reports)

**Server Actions:** None (all read via RSC data fetching)

**Database Tables:** Aggregated queries across `rfqs`, `purchase_orders`, `invoices`, `vendors`, `approvals`

---

### Module 3 — Vendor Management

**Responsibilities:** CRUD for vendor records, search and filter, status management.

**Pages:**
- `/vendors` — Vendor list table
- `/vendors/new` — Add vendor form
- `/vendors/[id]` — View/Edit vendor detail

**Components (`features/vendors/`):**
- `VendorTable.tsx` — Searchable, filterable table with View/Edit/Delete actions
- `VendorForm.tsx` — Shared form for create and edit modes
- `VendorDetailCard.tsx` — Read-only detail view

**Server Actions (`lib/actions/vendor.actions.ts`):**
- `createVendor()` — Validate, insert, log activity
- `updateVendor()` — Validate, update, log activity
- `deleteVendor()` — Soft-delete or hard-delete based on FK constraints
- `getVendors()` — Paginated fetch with search/filter (used as data-fetch utility)

**Database Tables:** `vendors`

---

### Module 4 — RFQ Management

**Responsibilities:** RFQ creation with dynamic item rows, vendor assignment, deadline setting, attachment references, status lifecycle.

**Pages:**
- `/rfqs` — RFQ list
- `/rfqs/new` — Multi-section RFQ creation form
- `/rfqs/[id]` — RFQ detail view (items, assigned vendors, submitted quotations)
- `/rfqs/[id]/compare` — Side-by-side quotation comparison

**Components (`features/rfqs/`):**
- `RFQForm.tsx` — Multi-section form (Info, Items, Vendors, Timeline, Attachments)
- `RFQTable.tsx` — Filterable list with status badges
- `RFQItemsEditor.tsx` — Dynamic add/remove rows for items
- `VendorAssignPicker.tsx` — Multi-select vendor picker

**Server Actions (`lib/actions/rfq.actions.ts`):**
- `createRFQ()` — Insert RFQ + items + vendor assignments, log activity
- `updateRFQ()` — Update header/items/vendors
- `publishRFQ()` — Change status from DRAFT → PUBLISHED
- `closeRFQ()` — Change status to CLOSED

**Database Tables:** `rfqs`, `rfq_items`, `rfq_vendors` (join table)

---

### Module 5 — Quotation Management

**Responsibilities:** Vendor-facing quotation submission, draft saving, status tracking, comparison data aggregation.

**Pages:**
- `/quotations` — All quotations list (role-filtered)
- `/quotations/[id]` — Quotation submission/edit form (vendor view)

**Components (`features/quotations/`):**
- `QuotationForm.tsx` — Item pricing table with unit price, tax, totals
- `QuotationTable.tsx` — Status-filtered list
- `QuotationCompareTable.tsx` — Side-by-side comparison table (used inside `/rfqs/[id]/compare`)

**Server Actions (`lib/actions/quotation.actions.ts`):**
- `submitQuotation()` — Validate, upsert quotation + items, set status SUBMITTED
- `saveDraftQuotation()` — Upsert with status DRAFT
- `selectQuotation()` — Mark one quotation as SELECTED, others as REJECTED for that RFQ
- `rejectQuotation()` — Set individual quotation to REJECTED

**Database Tables:** `quotations`, `quotation_items`

---

### Module 6 — Approval Workflow

**Responsibilities:** Queue management for pending approvals, approve/reject actions with remarks, timeline display, status propagation to PO module.

**Pages:**
- `/approvals` — Approval queue (list of pending requests)
- `/approvals/[id]` — Single approval detail with timeline and action panel

**Components (`features/approvals/`):**
- `ApprovalCard.tsx` — Summary card in the queue list
- `ApprovalTimeline.tsx` — Chronological status timeline
- `ApprovalRemarksForm.tsx` — Approve/Reject button pair + remarks textarea

**Server Actions (`lib/actions/approval.actions.ts`):**
- `submitForApproval()` — Create approval record linked to quotation (called from quotation selection)
- `approveRequest()` — Set status APPROVED, store remarks, trigger PO creation, log activity
- `rejectRequest()` — Set status REJECTED, store remarks, log activity

**Database Tables:** `approvals`

---

### Module 7 — Purchase Orders

**Responsibilities:** Auto-generation of PO from approved quotation, PO status tracking, document display.

**Pages:**
- `/purchase-orders` — PO list with status
- `/purchase-orders/[id]` — PO document view (PO Number, vendor, items, dates)

**Components (`features/purchase-orders/`):**
- `PODocument.tsx` — Document-style formatted view of PO
- `POTable.tsx` — Sortable/filterable PO list

**Server Actions (`lib/actions/purchase-order.actions.ts`):**
- `generatePurchaseOrder()` — Called internally after approval; inserts PO + items from quotation data
- `updatePOStatus()` — Transition PO status (ISSUED → ACKNOWLEDGED → COMPLETED)

**Database Tables:** `purchase_orders`, `purchase_order_items`

---

### Module 8 — Invoices

**Responsibilities:** Invoice auto-generation from PO, tax and total calculation, PDF generation via PDFKit, email via Nodemailer.

**Pages:**
- `/invoices` — Invoice list
- `/invoices/[id]` — Invoice document view with Download/Print/Email actions

**Components (`features/invoices/`):**
- `InvoiceDocument.tsx` — Print-optimized document view (subtotal, tax, grand total)
- `InvoiceTable.tsx` — Filterable invoice list
- `EmailInvoiceDialog.tsx` — Dialog to confirm recipient email before sending

**Server Actions (`lib/actions/invoice.actions.ts`):**
- `generateInvoice()` — Create invoice record from PO data

**Route Handlers (`app/api/invoices/[id]/`):**
- `pdf/route.ts` (GET) — Stream PDFKit-generated PDF buffer as `application/pdf`
- `email/route.ts` (POST) — Call `email.service.ts` to send invoice via Nodemailer

**Database Tables:** `invoices`

---

### Module 9 — Activity Logs

**Responsibilities:** Passive audit trail written at every state-changing Server Action. Display-only timeline with filters.

**Pages:**
- `/activity` — Activity feed with module filters

**Components (`features/activity/`):**
- `ActivityFeed.tsx` — Timeline UI with user, action, module, timestamp

**Server Actions (`lib/actions/activity.actions.ts`):**
- `logActivity()` — Internal utility called by all other Server Actions; never called directly from UI

**Database Tables:** `activity_logs`

---

### Module 10 — Reports & Analytics

**Responsibilities:** Aggregated procurement statistics, spending by category, top vendors, monthly trend data. All read-only.

**Pages:**
- `/reports` — Analytics dashboard

**Components (`features/reports/`, `components/charts/`):**
- `ReportKPIRow.tsx` — Four KPI cards (Total Spend, Active Vendors, RFQs Processed, Pending Approvals)
- `SpendByCategoryTable.tsx` — Category breakdown table
- `TopVendorsTable.tsx` — Ranked vendor spend table
- `SpendChart.tsx` — Monthly trend bar/line chart

**Route Handlers (`app/api/reports/export/route.ts`):**
- Export report data as CSV or PDF

**Database Tables:** Aggregated queries across all tables via `report.service.ts`

---

## 4. PostgreSQL Database Design

### 4.1 Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │◄──────────────────────────────────────────────────────┐
│ first_name  │                                                        │
│ last_name   │                                                        │
│ email       │                                                        │
│ password    │                                                        │
│ phone       │                                                        │
│ country     │                                                        │
│ role        │ (ADMIN|PROCUREMENT_OFFICER|VENDOR|MANAGER)             │
│ image       │                                                        │
│ additional_info │                                                    │
│ created_at  │                                                        │
│ updated_at  │                                                        │
└──────┬──────┘                                                        │
       │                                                               │
       │ created_by                                                    │
       ▼                                                               │
┌─────────────┐       ┌──────────────────┐                            │
│   vendors   │       │  rfq_vendors     │ (join table)               │
│─────────────│       │──────────────────│                            │
│ id (PK)     │◄──────│ vendor_id (FK)   │                            │
│ vendor_name │       │ rfq_id    (FK)───┼──────────┐                 │
│ company_name│       └──────────────────┘          │                 │
│ contact_person│                                   │                 │
│ email       │                                     │                 │
│ phone       │       ┌──────────────────┐          │                 │
│ address     │       │      rfqs        │          │                 │
│ status      │       │──────────────────│          │                 │
│ created_by  │       │ id (PK)  ◄───────┘          │                 │
│ created_at  │       │ rfq_number       │          │                 │
│ updated_at  │       │ title            │          │                 │
└─────────────┘       │ description      │          │                 │
                      │ category         │          │                 │
                      │ status           │          │                 │
                      │ deadline         │          │                 │
                      │ created_by (FK)──┼──────────┼─────────────────┘
                      │ created_at       │          │
                      │ updated_at       │          │
                      └────────┬─────────┘          │
                               │                    │
                               │ rfq_id             │
                               ▼                    │
                      ┌──────────────────┐          │
                      │    rfq_items     │          │
                      │──────────────────│          │
                      │ id (PK)          │          │
                      │ rfq_id (FK)──────┘          │
                      │ item_name        │          │
                      │ quantity         │          │
                      │ unit             │          │
                      └──────────────────┘          │
                                                    │
                      ┌──────────────────┐          │
                      │   quotations     │          │
                      │──────────────────│          │
                      │ id (PK)          │          │
                      │ rfq_id (FK) ─────┼──────────┘
                      │ vendor_id (FK)───┼──► vendors.id
                      │ status           │ (DRAFT|SUBMITTED|SELECTED|REJECTED)
                      │ delivery_timeline│
                      │ notes            │
                      │ total_amount     │
                      │ submitted_at     │
                      │ created_at       │
                      │ updated_at       │
                      └────────┬─────────┘
                               │
                               │ quotation_id
                               ▼
                      ┌──────────────────┐
                      │ quotation_items  │
                      │──────────────────│
                      │ id (PK)          │
                      │ quotation_id (FK)│
                      │ rfq_item_id (FK)─┼──► rfq_items.id
                      │ unit_price       │
                      │ quantity         │
                      │ tax_percentage   │
                      │ total_amount     │
                      └──────────────────┘
                               │
                               │ (selected quotation)
                               ▼
                      ┌──────────────────┐
                      │    approvals     │
                      │──────────────────│
                      │ id (PK)          │
                      │ quotation_id (FK)│
                      │ rfq_id (FK)      │
                      │ status           │ (PENDING|APPROVED|REJECTED)
                      │ remarks          │
                      │ reviewed_by (FK)─┼──► users.id
                      │ reviewed_at      │
                      │ created_at       │
                      └────────┬─────────┘
                               │ (on APPROVED)
                               ▼
                      ┌──────────────────────┐
                      │   purchase_orders    │
                      │──────────────────────│
                      │ id (PK)              │
                      │ po_number            │
                      │ approval_id (FK)─────┼──► approvals.id
                      │ vendor_id (FK)───────┼──► vendors.id
                      │ rfq_id (FK)──────────┼──► rfqs.id
                      │ status               │ (ISSUED|ACKNOWLEDGED|COMPLETED)
                      │ issue_date           │
                      │ created_by (FK)──────┼──► users.id
                      │ created_at           │
                      │ updated_at           │
                      └──────────┬───────────┘
                                 │
                                 │ purchase_order_id
                                 ▼
                      ┌──────────────────────┐
                      │ purchase_order_items  │
                      │──────────────────────│
                      │ id (PK)              │
                      │ po_id (FK)           │
                      │ item_name            │
                      │ quantity             │
                      │ unit_price           │
                      │ tax_percentage       │
                      │ total_amount         │
                      └──────────────────────┘
                                 │
                                 │ (generates)
                                 ▼
                      ┌──────────────────┐
                      │    invoices      │
                      │──────────────────│
                      │ id (PK)          │
                      │ invoice_number   │
                      │ po_id (FK)───────┼──► purchase_orders.id
                      │ vendor_id (FK)───┼──► vendors.id
                      │ subtotal         │
                      │ tax_amount       │
                      │ grand_total      │
                      │ status           │ (GENERATED|SENT|PAID)
                      │ issued_at        │
                      │ created_at       │
                      └──────────────────┘

                      ┌──────────────────┐
                      │  activity_logs   │
                      │──────────────────│
                      │ id (PK)          │
                      │ user_id (FK)─────┼──► users.id
                      │ action           │ (string: "RFQ_CREATED", etc.)
                      │ module           │ (VENDOR|RFQ|QUOTATION|APPROVAL|PO|INVOICE)
                      │ entity_id        │ (UUID of affected record)
                      │ metadata         │ (JSONB – extra context)
                      │ created_at       │
                      └──────────────────┘
```

### 4.2 Table List & Relationships

| Table | Primary Key | Relationships | Notes |
|-------|-------------|---------------|-------|
| `users` | `id` (UUID) | Referenced by all tables via `created_by`, `reviewed_by` | Stores all roles |
| `vendors` | `id` (UUID) | `created_by → users.id`; joined via `rfq_vendors` | Vendor master |
| `rfqs` | `id` (UUID) | `created_by → users.id`; children: `rfq_items`, `rfq_vendors` | RFQ header |
| `rfq_items` | `id` (UUID) | `rfq_id → rfqs.id` | Line items on RFQ |
| `rfq_vendors` | composite `(rfq_id, vendor_id)` | Join table linking RFQs to assigned vendors | No extra columns needed |
| `quotations` | `id` (UUID) | `rfq_id → rfqs.id`, `vendor_id → vendors.id` | One per vendor per RFQ |
| `quotation_items` | `id` (UUID) | `quotation_id → quotations.id`, `rfq_item_id → rfq_items.id` | Priced line items |
| `approvals` | `id` (UUID) | `quotation_id → quotations.id`, `rfq_id → rfqs.id`, `reviewed_by → users.id` | One per selected quotation |
| `purchase_orders` | `id` (UUID) | `approval_id → approvals.id`, `vendor_id → vendors.id`, `rfq_id → rfqs.id` | Created post-approval |
| `purchase_order_items` | `id` (UUID) | `po_id → purchase_orders.id` | Copied from quotation items |
| `invoices` | `id` (UUID) | `po_id → purchase_orders.id`, `vendor_id → vendors.id` | One invoice per PO |
| `activity_logs` | `id` (UUID) | `user_id → users.id` | Append-only audit trail |

### 4.3 Key Enums

```
UserRole:       ADMIN | PROCUREMENT_OFFICER | VENDOR | MANAGER
VendorStatus:   ACTIVE | INACTIVE
RFQStatus:      DRAFT | PUBLISHED | CLOSED
QuotationStatus: DRAFT | SUBMITTED | SELECTED | REJECTED
ApprovalStatus: PENDING | APPROVED | REJECTED
POStatus:       ISSUED | ACKNOWLEDGED | COMPLETED
InvoiceStatus:  GENERATED | SENT | PAID
ActivityModule: VENDOR | RFQ | QUOTATION | APPROVAL | PURCHASE_ORDER | INVOICE
```

---

## 5. Prisma Architecture

### 5.1 Schema Organization

All models will live in a **single `prisma/schema.prisma` file**. This is appropriate for MVP scope and aligns with Prisma's standard approach. If the schema grows significantly beyond MVP, Prisma's `prismaSchemaFolder` preview feature can split it into multiple files per domain.

### 5.2 Model Naming Conventions

| Convention | Rule |
|------------|------|
| **Model names** | PascalCase singular (`User`, `Vendor`, `RFQ`, `PurchaseOrder`) |
| **Table names** | `snake_case` plural via `@@map` (`users`, `vendors`, `rfqs`, `purchase_orders`) |
| **Field names** | `camelCase` in Prisma, `snake_case` in DB via `@map` |
| **Primary keys** | `id String @id @default(cuid())` — CUID for all models |
| **Timestamps** | `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt` on all models |
| **Enums** | PascalCase: `UserRole`, `RFQStatus`, `QuotationStatus`, etc. |

### 5.3 Key Relationships in Prisma

- **One-to-Many:** `User → RFQs` (a user creates many RFQs), `RFQ → RFQItems`, `Quotation → QuotationItems`, `PurchaseOrder → PurchaseOrderItems`
- **Many-to-Many:** `RFQ ↔ Vendor` via implicit/explicit `RFQVendor` join model
- **One-to-One:** `Approval → PurchaseOrder` (one approval yields one PO), `PurchaseOrder → Invoice` (one PO yields one invoice)
- **Self-referential:** None in MVP
- **Optional relations:** `Approval.reviewedBy` is optional until decision is made; `Invoice.issuedAt` optional until generated

### 5.4 Migration Strategy

| Phase | Command | Notes |
|-------|---------|-------|
| Initial setup | `prisma migrate dev --name init` | Creates all tables from scratch |
| Per-feature development | `prisma migrate dev --name add_<feature>` | One migration per logical change |
| Production deploy | `prisma migrate deploy` | Run in Vercel build step via `postinstall` or `build` script |
| Data seeding | `prisma db seed` | Seed admin user + sample data for development |
| Schema inspection | `prisma studio` | Visual DB browser in development |

**`package.json` scripts:**
```json
"prisma": {
  "seed": "ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
}
```

### 5.5 Prisma Client Singleton (`lib/db.ts`)

To prevent multiple Prisma Client instances in Next.js development (caused by hot reload), export a singleton:

```
// Pattern: check global cache in dev, instantiate once in prod
globalThis.__prisma ?? (globalThis.__prisma = new PrismaClient())
```

---

## 6. Route Architecture

### 6.1 Public Routes (No Authentication Required)

| Route | Purpose |
|-------|---------|
| `/login` | User login page |
| `/register` | User registration page |

### 6.2 Protected Routes (Authentication Required)

All routes under the `(dashboard)` route group require a valid NextAuth session. The middleware enforces this at the edge.

| Route | Purpose | Allowed Roles |
|-------|---------|---------------|
| `/dashboard` | KPI overview | All |
| `/vendors` | Vendor list | Admin, Procurement Officer |
| `/vendors/new` | Create vendor | Admin, Procurement Officer |
| `/vendors/[id]` | View/Edit vendor | Admin, Procurement Officer |
| `/rfqs` | RFQ list | Admin, Procurement Officer, Manager |
| `/rfqs/new` | Create RFQ | Admin, Procurement Officer |
| `/rfqs/[id]` | RFQ detail | Admin, Procurement Officer, Manager, Vendor* |
| `/rfqs/[id]/compare` | Compare quotations | Admin, Procurement Officer |
| `/quotations` | Quotation list | Admin, Procurement Officer, Vendor |
| `/quotations/[id]` | Submit/view quotation | Vendor (own), Admin, Procurement Officer |
| `/approvals` | Approval queue | Admin, Manager |
| `/approvals/[id]` | Approval detail | Admin, Manager |
| `/purchase-orders` | PO list | Admin, Procurement Officer, Vendor* |
| `/purchase-orders/[id]` | PO detail | Admin, Procurement Officer, Vendor* |
| `/invoices` | Invoice list | Admin, Procurement Officer |
| `/invoices/[id]` | Invoice detail + actions | Admin, Procurement Officer |
| `/reports` | Analytics dashboard | Admin, Manager |
| `/activity` | Activity logs | Admin, Manager |

> *Vendor role can only see records associated with their own `vendor_id`.

### 6.3 API Route Handlers

| Route | Method | Purpose | Auth Required |
|-------|--------|---------|---------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js handler | No |
| `/api/invoices/[id]/pdf` | GET | Stream PDF buffer | Yes |
| `/api/invoices/[id]/email` | POST | Send invoice email | Yes |
| `/api/reports/export` | GET | Export report data | Yes (Admin, Manager) |

### 6.4 Middleware Route Protection Strategy

```
middleware.ts intercepts all requests:
  ├── if path matches /login or /register → allow (skip if already authenticated → redirect /dashboard)
  ├── if path matches /api/auth/** → allow
  ├── else → check NextAuth session token
  │     ├── token exists → allow, attach role to headers
  │     └── token missing → redirect to /login
```

---

## 7. State Management Strategy

### 7.1 Philosophy: Server-First

VendorBridge follows a **server-first state model**. The vast majority of state lives in the database and is fetched via React Server Components. Client-side state is minimal and used only for UI interactions.

### 7.2 Decision Matrix

| Data Type | Strategy | Rationale |
|-----------|----------|-----------|
| Page data (vendor list, RFQ detail) | **RSC + `async/await`** | No waterfall, no client bundle cost |
| Form submission state | **`useActionState` / `useFormStatus`** | Native Next.js 15 patterns for Server Actions |
| Global session/user | **NextAuth `useSession`** or server `auth()` | Already provided by NextAuth |
| Toast notifications | **Shadcn `Sonner`** (lightweight client state) | Transient UI feedback only |
| Table filters / search | **URL search params (`useSearchParams`)** | Shareable, bookmarkable, server-renderable |
| Modal open/close | **`useState` (local)** | UI-only ephemeral state |
| Chart data | **RSC fetch → serialized props** | Data fetched on server, passed as plain JSON |

### 7.3 No Zustand Needed

Zustand is **not required** for this MVP. Zustand is appropriate when:
- Multiple disconnected components share mutable state
- Optimistic updates across many UI layers are needed

In VendorBridge, the App Router + Server Actions model handles all cross-component data flow via URL state, revalidation (`revalidatePath`), and server refetch.

### 7.4 No React Query Needed

React Query (TanStack Query) is **not required** for this MVP. It is beneficial for:
- Client-side polling / real-time updates
- Complex caching with background refetch

VendorBridge's data does not require polling. All mutations use Server Actions with `revalidatePath` to keep data fresh. If real-time requirements appear in a future phase, React Query or SWR can be added to specific pages.

### 7.5 Summary

```
Server Components  →  Fetch & render all page data
Server Actions     →  Handle all mutations + revalidate cache
URL Params         →  Filters, pagination, search
useActionState     →  Form pending/error state
Local useState     →  Modal, dropdown, accordion state only
NextAuth session   →  Identity & role in all RSC and actions
```

---

## 8. Authentication & Authorization Architecture

### 8.1 Authentication Stack

| Component | Technology |
|-----------|-----------|
| Auth library | NextAuth.js v5 (Auth.js) |
| Strategy | Credentials Provider (email + password) |
| Password hashing | `bcryptjs` |
| Session type | JWT (stored in HTTP-only cookie) |
| Session duration | 24 hours (configurable) |
| Token storage | HTTP-only, Secure, SameSite=Lax cookie |

### 8.2 Login Flow

```
User submits LoginForm
        │
        ▼
Server Action: loginUser()
        │
        ▼
NextAuth signIn("credentials", { email, password })
        │
        ▼
auth.config.ts: authorize() callback
  ├── Query DB for user by email
  ├── Compare password hash with bcrypt.compare()
  ├── If match → return user object { id, email, role, name }
  └── If no match → return null (NextAuth handles error)
        │
        ▼
NextAuth creates JWT: { sub: userId, role, name, email }
        │
        ▼
JWT stored in HTTP-only cookie: next-auth.session-token
        │
        ▼
Redirect to /dashboard
```

### 8.3 Session Flow (Per Request)

```
Incoming Request
        │
        ▼
middleware.ts (Edge Runtime)
  ├── auth() from NextAuth — reads JWT cookie
  ├── if no session → redirect /login
  └── if session valid → attach user to request context
        │
        ▼
RSC / Server Action: auth() call
  └── Returns { user: { id, role, name, email } }
```

### 8.4 Registration Flow

```
User submits RegisterForm
        │
        ▼
Server Action: registerUser(data)
  ├── Validate input (Zod schema)
  ├── Check email uniqueness
  ├── Hash password: bcrypt.hash(password, 12)
  ├── Insert user record via Prisma
  ├── Log activity: USER_REGISTERED
  └── Return { success: true }
        │
        ▼
Redirect to /login
```

### 8.5 Role-Based Access Control (RBAC)

#### Role Definitions

| Role | Scope |
|------|-------|
| `ADMIN` | Full system access — all modules, all records |
| `PROCUREMENT_OFFICER` | Vendors, RFQs, Quotation comparison, POs, Invoices |
| `VENDOR` | Own RFQs (assigned), submit quotations, view own POs |
| `MANAGER` | Approval queue, Reports, Activity logs, Dashboard |

#### RBAC Enforcement Layers

**Layer 1 — Middleware (Route Level):**
Route groups restricted by role check in `middleware.ts`. Unauthorized role → redirect to `/dashboard` with error.

**Layer 2 — Server Action (Data Level):**
Every Server Action begins with:
```
const session = await auth()
if (!session) throw new Error("Unauthorized")
if (!allowedRoles.includes(session.user.role)) throw new Error("Forbidden")
```

**Layer 3 — Service Layer (Record Level):**
Vendor role queries are scoped to records where `vendor_id` matches the session user's associated vendor record. Example:
```
// Vendor can only see their own quotations
where: { vendorId: session.user.vendorId }
```

**Layer 4 — UI Level (Conditional Rendering):**
`usePermission(role)` hook and server-passed `userRole` prop control visibility of action buttons (e.g., Approve button only renders for MANAGER).

---

## 9. API & Server Actions Architecture

### 9.1 All Server Actions

#### Auth Actions (`lib/actions/auth.actions.ts`)

| Action | Input | Responsibility |
|--------|-------|----------------|
| `registerUser(data)` | RegisterFormData | Validate, hash password, insert user, log activity |
| `loginUser(credentials)` | email, password | Delegate to NextAuth `signIn()` |
| `logoutUser()` | — | Call NextAuth `signOut()` |

#### Vendor Actions (`lib/actions/vendor.actions.ts`)

| Action | Input | Responsibility |
|--------|-------|----------------|
| `createVendor(data)` | VendorFormData | Validate, insert vendor, log `VENDOR_CREATED` |
| `updateVendor(id, data)` | id, VendorFormData | Validate, update vendor, log `VENDOR_UPDATED` |
| `deleteVendor(id)` | id | Delete/deactivate vendor, log `VENDOR_DELETED` |

#### RFQ Actions (`lib/actions/rfq.actions.ts`)

| Action | Input | Responsibility |
|--------|-------|----------------|
| `createRFQ(data)` | RFQFormData | Validate, insert RFQ + items + vendor assignments, log `RFQ_CREATED` |
| `updateRFQ(id, data)` | id, RFQFormData | Update RFQ header/items/vendors, log `RFQ_UPDATED` |
| `publishRFQ(id)` | id | Set status PUBLISHED, notify assigned vendors (email), log `RFQ_PUBLISHED` |
| `closeRFQ(id)` | id | Set status CLOSED, log `RFQ_CLOSED` |

#### Quotation Actions (`lib/actions/quotation.actions.ts`)

| Action | Input | Responsibility |
|--------|-------|----------------|
| `saveDraftQuotation(data)` | QuotationFormData | Upsert quotation + items, status DRAFT |
| `submitQuotation(data)` | QuotationFormData | Upsert, set status SUBMITTED, log `QUOTATION_SUBMITTED` |
| `selectQuotation(id)` | quotationId | Mark SELECTED, set others REJECTED for same RFQ, log `QUOTATION_SELECTED`, call `submitForApproval()` |
| `rejectQuotation(id)` | quotationId | Mark REJECTED, log `QUOTATION_REJECTED` |

#### Approval Actions (`lib/actions/approval.actions.ts`)

| Action | Input | Responsibility |
|--------|-------|----------------|
| `submitForApproval(quotationId)` | quotationId | Create approval record (PENDING), log `APPROVAL_REQUESTED` — called internally from `selectQuotation()` |
| `approveRequest(id, remarks)` | approvalId, string | Set APPROVED, store remarks, call `generatePurchaseOrder()`, log `APPROVAL_GRANTED` |
| `rejectRequest(id, remarks)` | approvalId, string | Set REJECTED, store remarks, log `APPROVAL_REJECTED` |

#### Purchase Order Actions (`lib/actions/purchase-order.actions.ts`)

| Action | Input | Responsibility |
|--------|-------|----------------|
| `generatePurchaseOrder(approvalId)` | approvalId | Create PO + items from approved quotation, auto-generate PO number, log `PO_GENERATED` — called internally from `approveRequest()` |
| `updatePOStatus(id, status)` | poId, POStatus | Transition PO status, log `PO_STATUS_UPDATED` |

#### Invoice Actions (`lib/actions/invoice.actions.ts`)

| Action | Input | Responsibility |
|--------|-------|----------------|
| `generateInvoice(poId)` | poId | Create invoice record from PO, calculate subtotal/tax/total, auto-generate invoice number, log `INVOICE_GENERATED` |

#### Activity Actions (`lib/actions/activity.actions.ts`)

| Action | Input | Responsibility |
|--------|-------|----------------|
| `logActivity(data)` | ActivityData | Internal utility. Insert activity_log record. Called by all other actions. Never exposed to UI. |

### 9.2 Route Handlers

| Handler | Method | Responsibility |
|---------|--------|----------------|
| `app/api/invoices/[id]/pdf/route.ts` | GET | Call `pdf.service.ts` → generate PDF buffer with PDFKit → stream as `application/pdf` |
| `app/api/invoices/[id]/email/route.ts` | POST | Call `email.service.ts` → send invoice PDF as attachment via Nodemailer |
| `app/api/reports/export/route.ts` | GET | Query `report.service.ts` → return CSV or JSON |

### 9.3 Service Layer Responsibilities

| Service | Responsibility |
|---------|----------------|
| `vendor.service.ts` | Prisma queries for vendor CRUD, search, pagination |
| `rfq.service.ts` | Prisma queries for RFQ operations, vendor assignment joins |
| `quotation.service.ts` | Prisma queries for quotation CRUD and comparison aggregations |
| `approval.service.ts` | Prisma queries for approval queue, status transitions |
| `purchase-order.service.ts` | Prisma queries for PO generation and status management |
| `invoice.service.ts` | Prisma queries for invoice CRUD, total calculations |
| `pdf.service.ts` | PDFKit wrapper — builds document structure for invoices and POs |
| `email.service.ts` | Nodemailer transporter setup, send invoice email with PDF attachment |
| `report.service.ts` | Aggregated queries: spend totals, vendor rankings, monthly trends |

### 9.4 Input Validation Strategy

All Server Action inputs are validated using **Zod schemas** defined in `types/` alongside their TypeScript interfaces. This provides:
- Runtime type safety (Zod parse)
- Compile-time type safety (TypeScript)
- Consistent error messages returned to `useActionState`

---

## 10. Development Roadmap

### Dependency Chain

```
Phase 1 (Auth)
    └── Phase 2 (Vendors)
            └── Phase 3 (RFQs)
                    └── Phase 4 (Quotations)
                            └── Phase 5 (Approvals)
                                    └── Phase 6 (Purchase Orders)
                                            └── Phase 7 (Invoices)
                                                    └── Phase 8 (Reports)
                                                            └── Phase 9 (Activity & Polish)
```

---

### Phase 1 — Foundation & Authentication

**Goal:** Users can register, log in, and access a protected shell.

**Tasks:**
- Initialize Next.js 15 project with TypeScript, Tailwind CSS, Shadcn UI
- Configure Prisma with PostgreSQL (Neon connection)
- Create `users` table migration
- Implement NextAuth.js Credentials Provider
- Build `/login` and `/register` pages and forms
- Implement `registerUser()` and `loginUser()` Server Actions
- Configure `middleware.ts` for route protection
- Build `AppShell.tsx` (Sidebar + Header layout)
- Implement `useCurrentUser()` hook

**Milestone:** A user can register, log in, and see the empty dashboard shell.

---

### Phase 2 — Vendor Management

**Goal:** Procurement Officers and Admins can create and manage vendors.

**Tasks:**
- Create `vendors` table migration
- Implement `createVendor()`, `updateVendor()`, `deleteVendor()` Server Actions
- Build `VendorTable.tsx` with search and filter
- Build `VendorForm.tsx` (create + edit modes)
- Build `/vendors`, `/vendors/new`, `/vendors/[id]` pages
- Add RBAC enforcement for vendor actions

**Milestone:** Vendor CRUD is fully functional with role restrictions.

---

### Phase 3 — RFQ Module

**Goal:** Procurement Officers can create RFQs with items and assign vendors.

**Tasks:**
- Create `rfqs`, `rfq_items`, `rfq_vendors` table migrations
- Implement `createRFQ()`, `updateRFQ()`, `publishRFQ()`, `closeRFQ()` Server Actions
- Build `RFQForm.tsx` with dynamic `RFQItemsEditor.tsx`
- Build `VendorAssignPicker.tsx` multi-select component
- Build `/rfqs`, `/rfqs/new`, `/rfqs/[id]` pages
- Implement RFQ status badge and lifecycle

**Milestone:** RFQs can be created, assigned to vendors, and published.

---

### Phase 4 — Quotation Module

**Goal:** Vendors can submit quotations; procurement team can compare them.

**Tasks:**
- Create `quotations`, `quotation_items` table migrations
- Implement `submitQuotation()`, `saveDraftQuotation()`, `selectQuotation()`, `rejectQuotation()` Server Actions
- Build `QuotationForm.tsx` with pricing table and auto-calculated totals
- Build `QuotationCompareTable.tsx` with lowest-price highlight
- Build `/quotations`, `/quotations/[id]` pages
- Build `/rfqs/[id]/compare` comparison page

**Milestone:** Vendors can submit quotations; the best quotation can be selected.

---

### Phase 5 — Approval Workflow

**Goal:** Managers can review, approve, or reject selected quotations.

**Tasks:**
- Create `approvals` table migration
- Implement `submitForApproval()`, `approveRequest()`, `rejectRequest()` Server Actions
- Build `ApprovalCard.tsx`, `ApprovalTimeline.tsx`, `ApprovalRemarksForm.tsx`
- Build `/approvals`, `/approvals/[id]` pages
- Enforce MANAGER role for approval actions
- Wire `selectQuotation()` to auto-call `submitForApproval()`

**Milestone:** Full approval workflow — pending → approved/rejected.

---

### Phase 6 — Purchase Orders

**Goal:** Approved quotations automatically generate purchase orders.

**Tasks:**
- Create `purchase_orders`, `purchase_order_items` table migrations
- Implement `generatePurchaseOrder()` Server Action (called from approval)
- Build `PODocument.tsx` formatted view
- Build `POTable.tsx` list
- Build `/purchase-orders`, `/purchase-orders/[id]` pages
- Auto-generate PO numbers (e.g., `PO-2026-0001`)

**Milestone:** POs auto-created on approval, visible to all authorized users.

---

### Phase 7 — Invoice Module

**Goal:** Invoices can be generated from POs, downloaded as PDF, and emailed.

**Tasks:**
- Create `invoices` table migration
- Implement `generateInvoice()` Server Action
- Implement `pdf.service.ts` using PDFKit (invoice PDF layout)
- Implement `email.service.ts` using Nodemailer
- Build `app/api/invoices/[id]/pdf/route.ts` (PDF stream)
- Build `app/api/invoices/[id]/email/route.ts` (email send)
- Build `InvoiceDocument.tsx`, `EmailInvoiceDialog.tsx`
- Build `/invoices`, `/invoices/[id]` pages
- Auto-generate invoice numbers (e.g., `INV-2026-0001`)

**Milestone:** Invoices generated, downloadable as PDF, and emailable.

---

### Phase 8 — Reports & Analytics

**Goal:** Admins and Managers can view procurement analytics.

**Tasks:**
- Implement `report.service.ts` with aggregation queries
- Build `ReportKPIRow.tsx`, `SpendByCategoryTable.tsx`, `TopVendorsTable.tsx`
- Implement `SpendChart.tsx`, `CategoryPieChart.tsx` with Recharts
- Build `/reports` page
- Implement `app/api/reports/export/route.ts` (CSV export)
- Add date range filter using URL search params

**Milestone:** Full analytics dashboard with export functionality.

---

### Phase 9 — Activity Logs & System Polish

**Goal:** Activity log is populated, Dashboard KPIs are live, system is production-ready.

**Tasks:**
- Create `activity_logs` table migration
- Implement `logActivity()` Server Action, wire it to all Phase 2–8 actions
- Build `ActivityFeed.tsx` with module filters
- Build `/activity` page
- Implement Dashboard KPI aggregations (connect to real data)
- Responsive design audit (mobile drawer navigation)
- End-to-end flow testing across all roles
- Environment variable setup for Vercel deployment
- Configure `prisma migrate deploy` in Vercel build step

**Milestone:** System is complete, all 11 success criteria from PRD are met, deployable to Vercel.

---

## Appendix A — Environment Variables

```env
# Database
DATABASE_URL=postgresql://...@neon.tech/vendorbridge?sslmode=require

# NextAuth
NEXTAUTH_SECRET=<strong-random-secret>
NEXTAUTH_URL=https://vendorbridge.vercel.app

# Email (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@vendorbridge.com
SMTP_PASS=<app-password>
SMTP_FROM="VendorBridge <noreply@vendorbridge.com>"
```

---

## Appendix B — Auto-Number Generation Strategy

All document numbers (PO Number, Invoice Number) are generated server-side using a sequential counter pattern:

```
PO Number:      PO-YYYY-NNNN    (e.g., PO-2026-0001)
Invoice Number: INV-YYYY-NNNN   (e.g., INV-2026-0001)
RFQ Number:     RFQ-YYYY-NNNN   (e.g., RFQ-2026-0001)
```

**Strategy:** Use `prisma.$queryRaw` with `SELECT COUNT(*) + 1` for the current year to generate the next sequence number within a transaction, preventing race conditions.

---

*End of VendorBridge Technical Architecture Document v1.0*
