# VendorBridge - Screen Requirements

## Screen 1: Login

### Purpose

Authenticate users and provide access to the ERP system.

### Layout

Centered login card with company branding.

### Fields

* Email / Username
* Password

### Actions

* Login

### Validation

* Email is required
* Password is required

### Success Flow

User is redirected to Dashboard after successful login.

---

# Screen 2: Registration

### Purpose

Allow new users to register.

### Layout

Single-page registration form.

### Fields

* Profile Photo (Optional)
* First Name
* Last Name
* Email Address
* Phone Number
* Role
* Country
* Additional Information

### Actions

* Register

### Validation

* Required fields cannot be empty
* Email must be unique

### Success Flow

User account is created successfully.

---

# Screen 3: Dashboard

### Purpose

Provide an overview of procurement activities.

### Layout

Sidebar navigation on left.
Main content area on right.

### Statistics Cards

* Active RFQs
* Pending Approvals
* Procurement Spend
* Vendors Count

### Components

* Procurement Overview Table
* Analytics Charts
* Quick Action Buttons

### Actions

* Create RFQ
* Add Vendor
* View Reports

### Success Flow

User can monitor procurement performance from one place.

---

# Screen 4: Vendor Management

### Purpose

Manage vendor records.

### Layout

Vendor table with search functionality.

### Features

* Add Vendor
* Search Vendors
* Filter Vendors

### Vendor Fields

* Vendor Name
* Company Name
* Contact Person
* Email
* Phone Number
* Address
* Status

### Table Actions

* View
* Edit
* Delete

### Success Flow

Vendor records are stored and managed successfully.

---

# Screen 5: RFQ Creation

### Purpose

Create Request for Quotations.

### Layout

Multi-section RFQ form.

### Fields

#### RFQ Information

* RFQ Title
* Description
* Category

#### Items Section

* Item Name
* Quantity
* Unit

#### Vendor Assignment

* Select Vendors

#### Timeline

* Submission Deadline

#### Attachments

* Upload Supporting Documents

### Actions

* Save Draft
* Submit RFQ

### Success Flow

RFQ is created and available for quotation submissions.

---

# Screen 6: Quotation Submission

### Purpose

Allow vendors to submit quotations.

### Layout

Quotation form with item pricing table.

### RFQ Details

* RFQ Number
* RFQ Title
* Deadline

### Quotation Fields

* Unit Price
* Quantity
* Tax Percentage
* Total Amount
* Delivery Timeline
* Notes

### Actions

* Save Draft
* Submit Quotation

### Success Flow

Quotation is recorded against the RFQ.

---

# Screen 7: Quotation Comparison

### Purpose

Compare submitted quotations.

### Layout

Side-by-side comparison table.

### Comparison Metrics

* Vendor Name
* Unit Price
* Total Cost
* Tax
* Delivery Timeline

### Features

* Highlight Lowest Price
* Compare Delivery Timelines
* Compare Total Cost

### Actions

* Select Vendor
* Reject Vendor

### Success Flow

Best quotation is selected for approval.

---

# Screen 8: Approval Workflow

### Purpose

Approve or reject procurement requests.

### Layout

Approval timeline with details panel.

### Information Displayed

* RFQ Reference
* Selected Vendor
* Quotation Amount
* Approval Timeline

### Approval Summary

* Vendor Details
* Cost Breakdown
* Delivery Information

### Actions

* Approve
* Reject

### Additional Field

* Approval Remarks

### Success Flow

Request moves to Approved or Rejected state.

---

# Screen 9: Purchase Order & Invoice

### Purpose

Generate official procurement documents.

### Layout

Document-style invoice view.

### Purchase Order Details

* PO Number
* Vendor Details
* Issue Date
* Item Details

### Invoice Details

* Subtotal
* Tax
* Grand Total

### Actions

* Download PDF
* Print
* Send Email

### Success Flow

Invoice is generated and available for distribution.

---

# Screen 10: Activity & Logs

### Purpose

Track procurement activities.

### Layout

Timeline-based activity feed.

### Filters

* All
* RFQs
* Approvals
* Quotations
* Vendors

### Activity Information

* User
* Action
* Module
* Timestamp

### Examples

* RFQ Created
* Vendor Added
* Quotation Submitted
* Approval Granted
* Invoice Generated

### Success Flow

Users can audit procurement activities.

---

# Screen 11: Reports & Analytics

### Purpose

Provide procurement insights.

### Layout

Analytics dashboard with charts and tables.

### KPI Cards

* Total Spend
* Active Vendors
* RFQs Processed
* Pending Approvals

### Reports

#### Spending by Category

* Hardware
* Software
* Office Supplies
* Logistics

#### Top Vendors

* Vendor Name
* Total Spend
* Number of Purchase Orders

#### Monthly Procurement Trend

* Monthly Spend Chart

### Actions

* Export Report
* Filter by Date Range

### Success Flow

Users can analyze procurement performance and trends.

---

# Global Navigation

### Sidebar Menu

* Dashboard
* Vendors
* RFQs
* Quotations
* Approvals
* Purchase Orders
* Invoices
* Reports
* Activity

### Common Layout

Header:

* Application Logo
* User Profile

Sidebar:

* Navigation Links

Main Content:

* Screen Specific Content

### Responsive Behavior

Desktop:

* Full Sidebar

Tablet:

* Collapsible Sidebar

Mobile:

* Drawer Navigation
