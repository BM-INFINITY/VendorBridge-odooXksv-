# VendorBridge – Product Requirements Document (PRD)

## 1. Project Overview

### Product Name

VendorBridge

### Product Type

Procurement & Vendor Management ERP

### Purpose

VendorBridge is a centralized Procurement & Vendor Management ERP designed to streamline procurement workflows for organizations.

The system enables procurement teams to manage vendors, create RFQs (Request for Quotations), collect vendor quotations, compare offers, process approvals, generate purchase orders, generate invoices, and monitor procurement activities through dashboards and reports.

The primary goal is to reduce manual procurement processes and provide a structured workflow from vendor selection to invoice generation.

---

# 2. Scope

## In Scope

### Authentication

* User Login
* User Registration
* Session Management

### Vendor Management

* Vendor Registration
* Vendor Listing
* Vendor Search
* Vendor Details Management

### RFQ Management

* Create RFQs
* Add Products/Services
* Set Quantities
* Assign Vendors
* Set Submission Deadlines

### Quotation Management

* Vendor Quotation Submission
* Quotation Editing
* Quotation Tracking

### Quotation Comparison

* Side-by-side Comparison
* Price Comparison
* Delivery Timeline Comparison
* Vendor Selection

### Approval Workflow

* Approve Requests
* Reject Requests
* Approval Remarks
* Approval History

### Purchase Orders

* Generate Purchase Orders
* Track Purchase Order Status

### Invoice Management

* Generate Invoices
* Tax Calculation
* Total Calculation
* Print Invoice
* Download Invoice PDF
* Send Invoice via Email

### Activity Tracking

* Activity Logs
* Procurement Timeline

### Reports & Analytics

* Procurement Statistics
* Vendor Performance
* Spending Analytics
* Monthly Procurement Trends

---

## Out of Scope (Future Phase)

* Multi-level Approval Workflows
* Vendor Ratings
* Budget Management
* Inventory Management
* Notification Center
* SMS Integration
* Mobile Application
* Multi-company Support

---

# 3. User Roles

## Admin

Responsibilities:

* Manage users
* Manage vendors
* View reports and analytics
* Access all modules

Permissions:

* Full system access

---

## Procurement Officer

Responsibilities:

* Create RFQs
* Manage procurement workflows
* Compare quotations
* Generate purchase orders
* Generate invoices

Permissions:

* RFQ Management
* Quotation Comparison
* Purchase Orders
* Invoices

---

## Vendor

Responsibilities:

* View assigned RFQs
* Submit quotations
* Track quotation status

Permissions:

* View RFQs assigned to them
* Submit quotations
* View purchase orders

---

## Manager / Approver

Responsibilities:

* Review procurement requests
* Approve or reject requests

Permissions:

* Approval workflow access
* Procurement monitoring

---

# 4. Business Workflow

## Procurement Lifecycle

1. Procurement Officer creates an RFQ.
2. RFQ is assigned to vendors.
3. Vendors submit quotations.
4. Procurement team compares quotations.
5. Selected quotation enters approval workflow.
6. Manager approves or rejects request.
7. Approved quotation generates Purchase Order.
8. Purchase Order generates Invoice.
9. Invoice can be printed, downloaded, or emailed.
10. Activities are logged for auditing.
11. Reports update automatically.

---

# 5. Functional Requirements

## Screen 1 – Login

Purpose:
Authenticate users.

Features:

* Email input
* Password input
* Login button
* Validation

Success Criteria:
User can access the system after successful login.

---

## Screen 2 – Registration

Purpose:
Create user accounts.

Features:

* First Name
* Last Name
* Email Address
* Phone Number
* Country
* Role Selection
* Additional Information
* Register Button

Success Criteria:
User account is created successfully.

---

## Screen 3 – Dashboard

Purpose:
Provide procurement overview.

Features:

* Active RFQs
* Pending Approvals
* Procurement Spend
* Vendor Count
* Procurement Overview Table
* Analytics Charts
* Quick Actions

Success Criteria:
Users can quickly monitor procurement activities.

---

## Screen 4 – Vendor Management

Purpose:
Manage vendor information.

Features:

* Add Vendor
* Vendor Listing
* Vendor Search
* Vendor Details
* Vendor Status

Success Criteria:
Users can manage vendor records.

---

## Screen 5 – RFQ Creation

Purpose:
Create procurement requests.

Features:

* RFQ Title
* Product/Service Information
* Quantity Details
* Vendor Assignment
* Deadline Selection
* Attachments

Success Criteria:
RFQ is successfully created and stored.

---

## Screen 6 – Quotation Submission

Purpose:
Collect vendor quotations.

Features:

* Unit Price
* Tax Details
* Delivery Timeline
* Notes
* Submit Quotation

Success Criteria:
Vendor quotations are saved successfully.

---

## Screen 7 – Quotation Comparison

Purpose:
Compare vendor quotations.

Features:

* Side-by-side Vendor Comparison
* Price Comparison
* Tax Comparison
* Delivery Timeline Comparison
* Vendor Selection

Success Criteria:
Users can select the preferred quotation.

---

## Screen 8 – Approval Workflow

Purpose:
Manage procurement approvals.

Features:

* Approval Timeline
* Approval Details
* Approve Action
* Reject Action
* Approval Remarks

Success Criteria:
Procurement requests move through approval stages.

---

## Screen 9 – Purchase Order & Invoice

Purpose:
Generate procurement documents.

Features:

* Purchase Order Generation
* Invoice Generation
* Tax Calculation
* Total Calculation
* Download PDF
* Print Invoice
* Send Email

Success Criteria:
Official procurement documents are generated.

---

## Screen 10 – Activity & Logs

Purpose:
Track procurement activities.

Features:

* Activity Timeline
* Audit Trail
* User Activities
* Procurement Events

Success Criteria:
Users can view procurement history.

---

## Screen 11 – Reports & Analytics

Purpose:
Provide procurement insights.

Features:

* Total Spend
* Active Vendors
* Procurement Performance
* Spending by Category
* Top Vendors
* Monthly Trends

Success Criteria:
Users can monitor procurement performance.

---

# 6. Non-Functional Requirements

## Performance

* Dashboard load time under 3 seconds
* Search results under 1 second

## Security

* Password hashing
* JWT Authentication
* Role-based access control

## Usability

* Responsive design
* Consistent navigation
* Clean ERP interface

## Scalability

* Modular architecture
* Reusable components
* Service-based backend structure

---

# 7. Suggested Technology Stack

Frontend:

* Next.js
* TypeScript
* Tailwind CSS
* Shadcn UI

Backend:

* NestJS
* Prisma ORM

Database:

* PostgreSQL

Authentication:

* JWT

Email:

* Nodemailer

PDF:

* PDFKit

---

# 8. Success Criteria

The project is considered complete when a user can:

1. Register and Login
2. Create Vendors
3. Create RFQs
4. Submit Quotations
5. Compare Quotations
6. Approve Requests
7. Generate Purchase Orders
8. Generate Invoices
9. Print or Email Invoices
10. View Activity Logs
11. View Procurement Reports

The entire procurement lifecycle must function end-to-end within the system.
