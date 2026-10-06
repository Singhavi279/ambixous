Absolutely. Below is the **fully updated PRD**, rewritten so the software is built around **Ambixous as a multi-service LLP**, not around LinkedIn management.

It treats your three registered NIC activity areas as the top-level business taxonomy:

* **70200 — Management Consultancy**
* **73100 — Advertising**
* **82300 — Organization of Conventions and Trade Shows**

It also keeps **NIC classification, service catalogue, and future GST/SAC classification as separate concepts**, which is important for a clean accounting architecture.

# Ambixous Innovations LLP — Invoicing & Financial Operations Platform

## Master PRD + LLM Coding-Agent Build Prompt

```text
You are a senior Product Manager, Product Designer, Full-Stack Architect,
Accounting-System Architect, Security Engineer and India-focused financial
software engineer.

Your task is to design and implement a production-quality financial operations
and invoicing platform for:

AMBIXOUS INNOVATIONS LLP

This is NOT merely an invoice/PDF generator.

The application should function as a lightweight financial operating system
for a multi-service LLP, covering:

- Company/LLP management
- Business activity management
- Service catalogue
- Customers
- Vendors
- Quotations
- Invoicing
- Recurring invoices
- Payments
- Receivables
- Expenses
- Accounting ledger
- Financial reports
- Audit trail
- CA/accountant exports
- Compliance tracking
- Future GST functionality
- Future TDS functionality
- Future e-invoicing/e-way bill functionality

IMPORTANT:
Ambixous is not limited to LinkedIn management.

The system must be designed for multiple professional services and event
services across the LLP's registered business activities.

The current company is GST-unregistered, therefore the initial invoice
workflow must NOT levy GST.

The architecture must allow GST registration to be enabled later without
rewriting the application.
```

---

# 1. PRODUCT OBJECTIVE

```text
Build a modern, secure, scalable and easy-to-use invoicing and accounting
platform for Ambixous Innovations LLP.

The product should allow a founder/accountant to move through:

Customer
→ Service
→ Quotation
→ Invoice
→ Payment
→ Accounting
→ Reporting
→ CA Export

with minimum duplicate data entry.

The system must prioritize:

1. Financial correctness
2. Auditability
3. Simplicity
4. Extensibility
5. Automation
6. Professional UX
7. Compliance readiness
```

---

# 2. COMPANY CONTEXT

```text
Company:
Ambixous Innovations LLP

Entity:
Limited Liability Partnership

Primary currency:
INR

Current GST status:
Unregistered

Current invoice model:
Non-GST service invoice

Default payment terms:
10 Calendar Days

Primary billing model:
Services

Billing frequency:
One-time + recurring/monthly + project-based
```

The system must NOT assume that Ambixous only sells one particular service.

---

# 3. BUSINESS ACTIVITY TAXONOMY

Create a first-class **Business Activity Master**.

Initial activities:

```text
70200 — Management Consultancy Activities

73100 — Advertising

82300 — Organization of Conventions and Trade Shows
```

These are the company's **business activity classifications**.

They are NOT the invoice service itself and should NOT be treated as interchangeable with GST SAC.

Create the hierarchy:

```text
Company
   ↓
Business Activity
   ↓
Service Category
   ↓
Individual Service
   ↓
Invoice Line Item
```

Example:

```text
Business Activity:
73100 — Advertising

Service Category:
Social Media Management

Service:
LinkedIn Management

Invoice:
LinkedIn Management Services — October 2026
```

Another:

```text
Business Activity:
70200 — Management Consultancy

Service Category:
Consulting

Service:
Business Strategy Advisory
```

Another:

```text
Business Activity:
82300 — Organization of Conventions and Trade Shows

Service Category:
Events

Service:
Conference Management
```

---

# 4. BUSINESS ACTIVITY MASTER

Create:

## Business Activity

Fields:

```text
id
code
name
description
active
created_at
updated_at
```

Seed:

```text
70200 | Management Consultancy Activities
73100 | Advertising
82300 | Organization of Conventions and Trade Shows
```

The admin must be able to:

* Add activities
* Edit descriptions
* Activate/deactivate activities
* Assign services
* View revenue by activity

Do not allow deletion of an activity that has historical transactions.

Use soft deletion/deactivation instead.

---

# 5. SERVICE CATALOGUE

Create a flexible Service Catalogue.

Each service contains:

```text
Service Name
Service Code
Business Activity
Service Category
Description
Billing Type
Billing Frequency
Default Price
Default Unit
Currency
Tax Configuration
SAC (future/configurable)
Active Status
```

Examples:

```text
LinkedIn Management
Business Activity: Advertising
Billing Type: Recurring
Billing Frequency: Monthly
Default Price: ₹20,000
```

```text
Business Strategy Consulting
Business Activity: Management Consultancy
Billing Type: Project
Default Price: ₹75,000
```

```text
Conference Management
Business Activity: Organization of Conventions and Trade Shows
Billing Type: Project
Default Price: ₹2,50,000
```

---

# 6. NIC VS SERVICE VS SAC

Maintain three separate concepts.

## Business Activity

Represents what business the company operates in.

Example:

```text
73100 — Advertising
```

## Service

Represents what the client actually bought.

Example:

```text
LinkedIn Management
```

## SAC

Represents the applicable GST service classification when GST becomes
relevant.

Example data model:

```text
Service
   ↓
Business Activity = 73100
   ↓
SAC = configurable
   ↓
GST Tax Rule = configurable
```

Never use NIC as a substitute for SAC.

Never derive GST treatment purely from NIC.

Never hard-code SAC/tax treatment without configurable rules.

---

# 7. CUSTOMER MASTER

Support both:

```text
Individual
Business
```

Fields:

```text
Customer ID
Customer Type
Legal Name
Display Name
PAN
GSTIN
GST Status
Contact Person
Email
Phone
Billing Address
Service Address
City
State
State Code
Country
PIN Code
Default Payment Terms
Default Currency
Notes
```

GSTIN must NOT be mandatory for individuals.

---

# 8. VENDOR MASTER

Create a Vendor module.

Fields:

```text
Vendor Name
Vendor Type
PAN
GSTIN
Email
Phone
Address
State
State Code
Bank Details
Payment Terms
Notes
```

---

# 9. QUOTATION MODULE

Create:

```text
Quotation
```

Workflow:

```text
Draft
→ Sent
→ Viewed
→ Accepted
→ Rejected
→ Expired
```

Quotation should contain:

* Customer
* Business activity
* Service
* Scope
* Line items
* Pricing
* Discounts
* Tax configuration
* Validity
* Terms
* Notes

Most importantly:

```text
Quotation
      ↓
Convert to Invoice
```

Do not make the user re-enter customer/service information.

---

# 10. INVOICE MODULE

The core document type is:

# INVOICE

Because Ambixous is currently GST-unregistered, do NOT default to:

# TAX INVOICE

The invoice must support:

* One-time services
* Monthly retainers
* Project billing
* Multiple line items
* Milestone billing
* Recurring invoices

---

# 11. INVOICE NUMBERING

Make invoice-number generation fully configurable.

Recommended default:

```text
AI/26-27/001
AI/26-27/002
AI/26-27/003
```

Configuration:

```text
Prefix:
AI

Financial Year:
26-27

Sequence:
001

Separator:
/

Padding:
3 digits

Reset:
Financial Year
```

Support formats such as:

```text
AI/26-27/001
INV/26-27/001
AI/26-27/10/001
AI-LINK-26-27-001
AI-EVT-26-27-001
```

Do NOT encourage unnecessarily complicated numbering.

Default recommended format remains:

```text
AI/26-27/001
```

Rules:

* Never generate duplicates
* Maintain uniqueness at database level
* Preserve historical invoice numbers
* Do not hard-delete issued invoices
* Financial-year rollover must work automatically
* Sequence must be transaction-safe under concurrent usage

---

# 12. INVOICE DATE

Invoice must contain:

```text
Invoice Date
```

Use actual document issuance date.

Do not silently change invoice dates.

For recurring invoices, allow the administrator to define the recurring invoice
generation day.

Example:

```text
Generate monthly invoice:
30th
```

---

# 13. PAYMENT TERMS

Payment terms must be a reusable configuration.

Support:

```text
Due on Receipt

X Calendar Days

X Business Days

Custom Due Date
```

Current Ambixous default:

```text
10 Calendar Days
```

Example:

```text
Invoice Date:
30 October 2026

Payment Terms:
10 Calendar Days

Due Date:
9 November 2026
```

The system must automatically calculate the due date.

Allow manual override with permission.

Display both:

```text
Payment Terms: 10 Calendar Days
Due Date: 9 November 2026
```

---

# 14. REFERENCE

Provide an optional invoice reference.

Examples:

```text
LinkedIn Management – October 2026

Monthly Retainer – October 2026

PO #ABC-123

Project Phase 1
```

Recurring invoices should automatically generate a useful reference from:

```text
Service + Billing Period
```

---

# 15. SERVICE PERIOD

Support:

```text
Start Date
End Date
```

Example:

```text
1 October 2026 – 31 October 2026
```

For recurring monthly services, automatically generate the correct period.

---

# 16. INVOICE LINE ITEMS

Each line item should contain:

```text
Service
Description
Business Activity
Service Period
Quantity
Unit
Rate
Discount
Tax
Amount
```

Example:

```text
Service:
LinkedIn Management Services

Business Activity:
73100 — Advertising

Period:
October 2026

Qty:
1

Rate:
₹20,000

Amount:
₹20,000
```

Do not force every line item to have the same service.

An invoice may contain multiple services from different business activities if
appropriate.

---

# 17. MULTI-SERVICE INVOICE

Support invoices such as:

```text
1. LinkedIn Management            ₹20,000
2. Content Production              ₹15,000
3. Event Consultation              ₹25,000
------------------------------------------
Total                              ₹60,000
```

Each line should retain:

* Service
* Business activity
* Tax classification
* Revenue account

This allows accurate reporting.

---

# 18. CURRENT GST-UNREGISTERED MODE

When:

```text
GST Status = Unregistered
```

the application MUST:

* Not calculate GST
* Not charge CGST
* Not charge SGST
* Not charge IGST
* Not display GSTIN
* Not display GST tax columns by default
* Not label invoice as Tax Invoice

Example:

```text
Subtotal:       ₹20,000
GST:            Not Applicable
Total Payable:  ₹20,000
```

Display:

```text
GST not charged — supplier is currently not registered under GST.
```

Make this note configurable.

Do not label GST as:

```text
GST @ 0%
```

when the actual reason is that the supplier is not charging GST.

---

# 19. FUTURE GST MODE

The system must support switching the company profile to:

```text
GST Registered — Regular
```

without changing the core invoice architecture.

Then enable configurable:

* GSTIN
* GST rates
* SAC
* HSN where relevant
* CGST
* SGST
* IGST
* Place of supply
* Reverse charge
* GST invoice fields
* GST reports
* Credit/debit notes
* E-invoice
* IRN
* QR
* E-way bill

The GST engine must be modular.

Tax logic must not be embedded directly into React/UI components.

---

# 20. RECURRING INVOICES

Create a reusable:

```text
Recurring Invoice Template
```

Fields:

```text
Customer
Services
Amounts
Frequency
Start Date
End Date
Invoice Generation Date
Payment Terms
Reference Pattern
Service Period Pattern
Automatic Email
Reminder Settings
Status
```

Example:

```text
Customer:
ABC Pvt Ltd

Service:
LinkedIn Management

Amount:
₹20,000

Frequency:
Monthly

Generation:
30th of month

Payment Terms:
10 Calendar Days
```

System automatically produces:

```text
AI/26-27/001
AI/26-27/002
AI/26-27/003
...
```

---

# 21. PAYMENT TRACKING

Support:

* Full payment
* Partial payment
* Multiple payments
* Overpayment
* Payment reversals where appropriate
* Payment allocation

Payment fields:

```text
Payment Date
Amount
Method
Bank Account
UPI
Transaction ID
Reference
Notes
TDS Deduction
Attachment
```

Example:

```text
Invoice:
₹20,000

Payment:
₹20,000

Outstanding:
₹0

Status:
Paid
```

---

# 22. RECEIVABLES

Create Accounts Receivable dashboard.

Metrics:

```text
Total Outstanding
Due Today
Due This Week
Overdue
Paid This Month
Revenue This Month
```

Ageing:

```text
0–30 Days
31–60 Days
61–90 Days
90+ Days
```

Clicking an amount should open the underlying invoices.

---

# 23. PAYMENT REMINDERS

Configurable:

```text
3 days before due date
On due date
3 days overdue
7 days overdue
Custom
```

Channels initially:

* Email

Future:

* WhatsApp
* SMS

Do not hard-code messaging providers.

---

# 24. CREDIT NOTES / DEBIT NOTES

Support both.

Each must be linked to:

```text
Original Invoice
Customer
Reason
Date
Amount
Line Items
Tax Impact
```

Historical relationships must be preserved.

---

# 25. EXPENSE MANAGEMENT

Create:

```text
Expenses
Purchase Bills
Vendor Expenses
```

Fields:

```text
Vendor
Date
Invoice Number
Category
Business Purpose
Amount
Tax
Payment Method
Payment Account
Attachment
Notes
```

Support:

* Receipts
* PDFs
* Images

Future OCR may extract:

```text
Vendor
Invoice Number
Date
Amount
GST
GSTIN
```

---

# 26. ACCOUNTING ENGINE

Implement a proper double-entry accounting architecture.

Invoice example:

```text
Accounts Receivable    Dr ₹20,000
    To Service Revenue      ₹20,000
```

Payment:

```text
Bank                   Dr ₹20,000
    To Accounts Receivable  ₹20,000
```

The accounting engine must be independent of the UI.

All accounting entries must balance.

Use database transactions for financial operations.

---

# 27. REVENUE ACCOUNTS BY BUSINESS ACTIVITY

Allow revenue accounts such as:

```text
Advertising Revenue
Consulting Revenue
Event Revenue
Other Service Revenue
```

Example:

```text
73100 Advertising
→ Advertising Revenue

70200 Management Consultancy
→ Consulting Revenue

82300 Events
→ Event Revenue
```

This allows management reporting by business activity.

---

# 28. CHART OF ACCOUNTS

Provide default chart of accounts.

### Revenue

```text
Advertising Revenue
Management Consulting Revenue
Event Revenue
Other Service Revenue
```

### Expenses

```text
Software
Advertising & Promotion
Freelancer Charges
Professional Fees
Travel
Internet
Office Expenses
Bank Charges
Rent
Other Expenses
```

### Assets

```text
Bank
Cash
Accounts Receivable
Equipment
```

### Liabilities

```text
Accounts Payable
Tax Payable
TDS Payable
```

### Capital

```text
Partner Capital
Partner Current Account
Drawings
```

Allow CA/accountant to customize.

---

# 29. LLP PARTNER ACCOUNTING

Support:

```text
Partner Master
Partner Capital
Capital Contribution
Drawings
Partner Current Account
Profit Sharing Ratio
Partner Ledger
```

Do NOT automatically assume tax treatment for partner remuneration,
interest, drawings, etc.

Those should be configurable and CA-reviewed.

---

# 30. BUSINESS ACTIVITY REPORTING

Create:

# Revenue by Business Activity

Example:

```text
Advertising                      ₹8,20,000
Management Consultancy           ₹5,40,000
Conventions & Trade Shows        ₹3,10,000
------------------------------------------
Total                           ₹16,70,000
```

Also allow:

* Revenue by service
* Revenue by client
* Revenue by month
* Revenue by activity
* Revenue by invoice
* Revenue by recurring vs project

---

# 31. FINANCIAL REPORTS

Support:

```text
Profit & Loss
Balance Sheet
Trial Balance
General Ledger
Cash Book
Bank Book
Accounts Receivable
Accounts Payable
Revenue Report
Expense Report
Cash Flow
```

Each report supports:

```text
Current Month
Previous Month
Current Quarter
Current FY
Previous FY
Custom Date Range
```

---

# 32. CA EXPORT

Create:

# Export for CA

Export:

```text
Invoice Register
Sales Register
Purchase Register
Expense Register
Payment Register
Receivables
Payables
General Ledger
Trial Balance
P&L
Balance Sheet
Partner Ledger
Credit Notes
Debit Notes
Tax Reports
Attachments
```

Formats:

```text
XLSX
CSV
PDF
ZIP
```

All exports must be deterministic and traceable.

---

# 33. GST THRESHOLD MONITOR

Because Ambixous is currently GST-unregistered, provide:

```text
Current FY Turnover
Configured Threshold
Remaining Headroom
Percentage Utilisation
```

Example:

```text
Current FY Turnover:
₹18,72,000

Configured Threshold:
₹20,00,000

Remaining:
₹1,28,000
```

Create alerts as the configured threshold approaches.

The system must NOT claim that this tracker itself determines GST registration
obligation.

Tax rules and thresholds must be configurable and CA-reviewable.

---

# 34. TDS ENGINE

Create a future-ready TDS structure.

Support:

```text
TDS Applicable
TDS Section
TDS Rate
TDS Amount
Deductor
TAN
Certificate/reference
TDS Receivable
TDS Payable
```

TDS must not be automatically applied merely because a service sounds like a
professional service.

The rule engine must be configurable.

---

# 35. COMPLIANCE MODULE

Create:

# Compliance Calendar

Categories:

```text
GST
TDS
Income Tax
LLP / MCA
Other
```

Each task contains:

```text
Compliance Name
Category
Due Date
Status
Assigned User
Reminder
Notes
Documents
```

Legal due dates must be configurable.

Never hard-code dates that may change by notification/regulatory update.

---

# 36. AUDIT TRAIL

Every financially relevant action must be auditable.

Store:

```text
User
Timestamp
Action
Entity
Entity ID
Old Value
New Value
Reason
```

Examples:

```text
Invoice Created
Invoice Issued
Invoice Sent
Invoice Cancelled
Payment Added
Payment Edited
Customer Updated
Service Updated
Tax Setting Changed
Company Setting Changed
```

Issued invoices must not be hard-deleted.

---

# 37. DOCUMENT STORAGE

Every transaction can contain attachments.

Examples:

```text
Invoice
├── Generated PDF
├── Agreement
├── Scope
├── Work Proof
└── Payment Proof
```

Expense:

```text
Expense
├── Vendor Bill
├── Receipt
└── Payment Proof
```

Use secure file storage.

---

# 38. INVOICE PDF DESIGN

Create a highly polished A4 invoice.

Design requirements:

```text
Modern
Minimal
Corporate
High readability
Print friendly
White background
Dark navy typography
Subtle blue/grey accents
Clean tables
Clear hierarchy
Generous whitespace
```

Header:

```text
AMBIXOUS LOGO

Ambixous Innovations LLP
LLPIN
PAN
Address
Contact
```

There must be:

* NO tagline beside logo
* NO stamp
* NO company seal
* NO fake handwritten signature

Use:

```text
Authorized Signatory
Ambixous Innovations LLP
```

without fabricating a signature.

---

# 39. CURRENT SAMPLE INVOICE CONFIGURATION

The system should be capable of producing this exact type of invoice:

```text
AMBIXOUS INNOVATIONS LLP

INVOICE

Invoice No:
AI/26-27/001

Invoice Date:
30 October 2026

Due Date:
9 November 2026

Payment Terms:
10 Calendar Days

Reference:
LinkedIn Management – October 2026

Service Period:
1 October 2026 – 31 October 2026
```

Line item:

```text
LinkedIn Management Services

Strategic content planning, content creation,
post scheduling, profile management, community
engagement and performance reporting as per agreed scope.

Qty: 1
Rate: ₹20,000
Amount: ₹20,000
```

Totals:

```text
Subtotal: ₹20,000

GST: Not Applicable

Total Payable:
₹20,000
```

Note:

```text
GST not charged — supplier is currently not registered under GST.
```

This is only a SAMPLE.

Production data must come from actual company/customer records.

---

# 40. INVOICE TEMPLATE ENGINE

Do not hard-code one invoice design.

Create:

```text
Invoice Template
```

Allow future templates:

```text
Modern
Classic
Minimal
Corporate
```

Company admin can select the default.

However, all templates must respect the company's tax/document configuration.

---

# 41. GLOBAL SEARCH

Search across:

```text
Invoice Number
Customer
Vendor
Payment
Expense
Service
Business Activity
Transaction ID
Reference
```

Search should be fast and indexed.

---

# 42. DASHBOARD

Main dashboard:

```text
Revenue This Month
Outstanding
Overdue
Paid This Month
Expenses This Month
Net Profit
```

Add:

```text
Revenue by Business Activity
Revenue by Client
Revenue Trend
Outstanding Ageing
```

Quick actions:

```text
+ New Invoice
+ New Quotation
+ New Customer
+ Add Payment
+ Add Expense
+ Recurring Invoice
```

---

# 43. USER ROLES

## Owner / Partner

Full access.

## Accountant

Accounting + invoices + expenses + reports.

## Billing Manager

Customers + quotations + invoices + payments.

## CA / Auditor

Read + reports + export.

## Viewer

Read-only.

Authorization MUST be enforced server-side.

Frontend-only role restrictions are insufficient.

---

# 44. SECURITY

Implement:

```text
Authentication
Authorization
Role-Based Access Control
Secure Sessions
Password Hashing
Optional 2FA
Rate Limiting
Input Validation
Secure File Uploads
Audit Logs
Database Backups
Secrets Management
Encryption Where Appropriate
```

Do not expose:

* Database credentials
* API secrets
* OAuth secrets
* Payment credentials
* authentication tokens

to the client.

---

# 45. DATA MODEL

Design a normalized relational model including at minimum:

```text
Company
CompanySettings

BusinessActivities
ServiceCategories
Services

Users
Roles
Permissions

Customers
Vendors

Quotations
QuotationItems

Invoices
InvoiceItems

RecurringInvoices
RecurringInvoiceItems

Payments
PaymentAllocations

Expenses
ExpenseItems

CreditNotes
DebitNotes

Accounts
JournalEntries
JournalEntryLines
LedgerTransactions

TaxConfigurations

FinancialYears

BankAccounts

Attachments

AuditLogs

ComplianceTasks

NotificationTemplates
```

Add appropriate:

* Foreign keys
* Unique constraints
* Indexes
* Soft deletion
* Timestamps
* Transaction safety

---

# 46. API ARCHITECTURE

Create clean API boundaries:

```text
/auth
/company
/business-activities
/service-categories
/services
/customers
/vendors
/quotations
/invoices
/recurring-invoices
/payments
/expenses
/credit-notes
/debit-notes
/accounts
/journals
/ledger
/reports
/compliance
/attachments
/audit
/settings
```

Use consistent request/response structures.

Use validation schemas at API boundaries.

---

# 47. FINANCIAL DATA INTEGRITY

This is CRITICAL.

Never allow:

```text
Unbalanced journal entries
Duplicate invoice numbers
Orphan payments
Negative/incorrect receivables
Silent financial edits
Frontend-only calculations
```

All important financial operations must happen inside database transactions.

Example:

```text
Issue Invoice
→ create invoice
→ create invoice items
→ create journal
→ create receivable
→ commit transaction
```

If any stage fails:

```text
rollback entire operation
```

---

# 48. ERROR HANDLING

Never silently fail financial operations.

Example:

```text
Unable to record payment.

No payment or accounting entry was created.

Please retry.
```

Make errors actionable.

---

# 49. PERFORMANCE

Target:

```text
Dashboard < 2 sec
Search < 1 sec
Normal invoice creation < 1 sec interactions
PDF generation < 5 sec
```

Use:

* Pagination
* Database indexes
* Caching where useful
* Lazy loading
* Efficient queries
* Background jobs for heavy operations

Do not fetch entire tables unnecessarily.

---

# 50. RESPONSIVE DESIGN

Support:

```text
Desktop
Laptop
Tablet
Mobile
```

Desktop is primary.

Mobile must support:

```text
Dashboard
Customer search
Invoice creation
Invoice viewing
Payment recording
PDF sharing
```

---

# 51. UX PRINCIPLES

The product should feel like:

```text
Modern fintech software
```

not legacy accounting software.

Prioritize:

```text
Simple
Fast
Visual
Clear
Trustworthy
Professional
Low cognitive load
```

Use progressive disclosure.

Do not expose complex tax/accounting configuration to ordinary users unless
needed.

---

# 52. RECURRING INVOICE QUICK FLOW

For an existing customer, the target UX is:

```text
Select Customer
→ Select Recurring Invoice
→ Review
→ Generate
```

The user should NOT have to repeatedly enter:

* Customer details
* Service
* Price
* Billing period
* Payment terms

---

# 53. EMAIL INVOICE

Allow:

```text
Generate PDF
Send Invoice
```

Email template should support:

```text
Client Name
Invoice Number
Service
Amount
Due Date
PDF Attachment
```

Make templates configurable.

---

# 54. FUTURE INTEGRATIONS

Architect with adapters/interfaces for:

```text
GST APIs
E-Invoice
E-Way Bill
Bank APIs
UPI
Payment Gateways
Email
WhatsApp
OCR
Accounting Software
```

Do not build fake API integrations.

Do not hard-code provider-specific logic into core accounting modules.

---

# 55. TECHNOLOGY APPROACH

If an existing repository is provided:

FIRST audit it.

Inspect:

```text
Architecture
Frontend
Backend
Database
API
Authentication
Components
State Management
Financial Logic
Tests
Deployment
Security
Performance
```

Reuse existing architecture when it is sound.

Do not rewrite the entire project unnecessarily.

If building from scratch, a suitable stack could be:

```text
Frontend:
React / Next.js + TypeScript

Backend:
Node.js + TypeScript

Database:
PostgreSQL

ORM:
Prisma or equivalent

Authentication:
Secure session/auth architecture

PDF:
Server-side PDF generation

Storage:
Object Storage

Hosting:
AWS / Vercel / equivalent
```

Do not force this stack if the existing repository already has a good architecture.

---

# 56. TESTING

Create automated tests for:

## Invoice

* Number generation
* Duplicate prevention
* FY rollover
* Totals
* Discounts
* Due dates
* Recurring invoices

## Business Activity

* Correct activity assignment
* Activity-level revenue reporting
* Multi-activity invoices

## GST

* Unregistered mode
* Registered mode
* Tax calculation
* CGST/SGST
* IGST
* Tax rounding
* Config changes

## Payments

* Full payment
* Partial payment
* Multiple payments
* Overpayment
* Allocation

## Accounting

* Balanced journals
* Ledger posting
* Receivable creation
* Payment reconciliation

## Security

* Permission checks
* API authorization
* Upload validation
* Audit logs

---

# 57. DEMO DATA

Create demo data clearly marked as DEMO.

Example:

### Customer

```text
Rohan Mehta
Individual Client
```

### Service

```text
LinkedIn Management
Business Activity:
73100 — Advertising
```

### Invoice

```text
AI/26-27/001

30 October 2026

Due:
9 November 2026

Terms:
10 Calendar Days

Service Period:
1 October 2026 – 31 October 2026

Amount:
₹20,000

GST:
Not Applicable
```

---

# 58. CRITICAL BUSINESS RULES

The application MUST prevent:

```text
1. Duplicate invoice numbers.

2. GST being charged when GST status is Unregistered.

3. Issued invoices being hard-deleted.

4. Payments existing without traceable allocation/accounting impact.

5. Unbalanced accounting entries.

6. Unauthorized users modifying financial data.

7. Financial totals differing between UI, backend and PDF.

8. Hard-coded tax assumptions that cannot be updated.

9. Fabricated legal/tax claims.

10. Fabricated bank details.

11. Fabricated signatures.

12. Fabricated company stamps.

13. Historical transactions changing without audit trail.

14. NIC being incorrectly used as a replacement for SAC.

15. LinkedIn Management being treated as the only available Ambixous service.
```

---

# 59. PHASED IMPLEMENTATION

## PHASE 1 — Core MVP

Build:

```text
Authentication
Company Profile
Business Activities
Service Catalogue
Customer Management
Vendor Management
Quotation
Invoice
Invoice Numbering
PDF Generation
GST-Unregistered Invoice Mode
Payment Terms
Payment Tracking
Receivables
Basic Expenses
Basic Ledger
Audit Trail
Dashboard
Basic Reports
CA Export
```

---

## PHASE 2 — Financial Operations

Add:

```text
Recurring Invoices
Automated Reminders
Credit Notes
Debit Notes
Advanced Expense Management
Partner Accounting
Bank Reconciliation
Advanced Financial Reports
Compliance Calendar
GST Threshold Tracker
```

---

## PHASE 3 — Indian Tax & Integrations

Add:

```text
GST Registered Mode
GST Tax Engine
SAC/HSN
CGST
SGST
IGST
Place of Supply
TDS
GSTR Reporting
E-Invoice
IRN
QR
E-Way Bill
Bank Integrations
Payment Gateways
UPI
WhatsApp
OCR
```

---

# 60. ACCEPTANCE TEST — COMPLETE BUSINESS FLOW

The following scenario MUST work:

```text
Create customer:
Rohan Mehta

Customer Type:
Individual

Create service:
LinkedIn Management

Business Activity:
73100 — Advertising

Price:
₹20,000/month

Create recurring invoice:

Invoice:
AI/26-27/001

Invoice Date:
30 Oct 2026

Payment Terms:
10 Calendar Days

Automatically calculate:
Due Date = 9 Nov 2026

Service Period:
1 Oct 2026 – 31 Oct 2026

GST:
Not Applicable

Invoice Total:
₹20,000

Generate A4 PDF

Send invoice

Record payment:
₹20,000

Invoice status:
Paid

Receivable:
₹0

Accounting:
Balanced

Revenue:
Advertising Revenue +₹20,000

Audit trail:
Complete

CA export:
Invoice + payment + ledger data available
```

---

# 61. SECOND ACCEPTANCE TEST — CONSULTING

The system must ALSO handle:

```text
Customer:
ABC Pvt Ltd

Service:
Business Strategy Advisory

Business Activity:
70200 — Management Consultancy

Billing:
Project

Amount:
₹75,000
```

Generate:

```text
Invoice
₹75,000
GST:
Not Applicable while GST is unregistered
```

The same invoice engine must work without creating a separate consulting
workflow.

---

# 62. THIRD ACCEPTANCE TEST — EVENTS

The system must ALSO handle:

```text
Customer:
XYZ Organisation

Service:
Conference Management

Business Activity:
82300 — Organization of Conventions and Trade Shows

Billing:
Project

Amount:
₹2,50,000
```

Again:

```text
Same invoice engine
Same accounting engine
Same customer engine
Same payment engine
Same reporting architecture
```

---

# 63. REPORTING ACCEPTANCE TEST

Suppose the company generates:

```text
Advertising:
₹8,20,000

Management Consultancy:
₹5,40,000

Events:
₹3,10,000
```

Dashboard must report:

```text
Total Revenue:
₹16,70,000
```

and allow drill-down into each business activity.

---

# 64. FINAL ARCHITECTURAL PRINCIPLE

The core hierarchy should be:

```text
AMBIXOUS INNOVATIONS LLP
│
├── BUSINESS ACTIVITIES
│   │
│   ├── 70200 Management Consultancy
│   │     └── Services
│   │
│   ├── 73100 Advertising
│   │     └── Services
│   │
│   └── 82300 Conventions & Trade Shows
│         └── Services
│
├── CUSTOMERS
│
├── QUOTATIONS
│
├── INVOICES
│
├── PAYMENTS
│
├── EXPENSES
│
├── ACCOUNTING
│
├── REPORTING
│
├── COMPLIANCE
│
└── AUDIT TRAIL
```

The key separation is:

```text
NIC / Business Activity
        ≠
Service
        ≠
SAC / GST Classification
        ≠
Revenue Account
```

These should be independent but related entities.

This design is important because Ambixous can add new services without changing
the invoice architecture.

---

# 65. FINAL PRODUCT VISION

Do not build:

"An invoice generator for LinkedIn management."

Build:

"A financial operations platform for Ambixous Innovations LLP that can handle
any legitimate service offered by the LLP, organized under its business
activities, with a robust invoice, payment, accounting and reporting engine."

The application should allow Ambixous to evolve from:

```text
GST Unregistered
```

to:

```text
GST Registered
```

without rebuilding its data model.

It should also allow:

```text
LinkedIn Management
Strategy Consulting
Advertising
Content Production
Event Management
Conference Management
Sponsorship Management
Other professional services
```

to coexist inside the same platform.

Before coding:

1. Inspect the existing repository thoroughly.
2. Map its current architecture.
3. Identify reusable components.
4. Identify existing technical debt.
5. Identify missing business logic.
6. Identify security/performance problems.
7. Produce a proposed implementation plan.
8. Then implement incrementally.

Do not rewrite functioning modules without justification.

Do not invent statutory rules.

Do not hard-code tax assumptions.

Where statutory/tax interpretation is uncertain, implement the system so the
rule is configurable and flag it for CA verification.

```

### One architectural change I strongly recommend

In the actual software UI, don't call the top-level section **"NIC Codes"** and force the founder to think in NIC terminology every time they create an invoice.

Use:

**Business Activities → Services**

For example:

> **Advertising** → LinkedIn Management

> **Management Consultancy** → Strategy Advisory

> **Conventions & Trade Shows** → Event Management

Keep the actual NIC code in the underlying master data and settings. That makes the software much more natural to use while preserving the classification structure.
```
