# 📘 CRM Enterprise V3 - Product Specification Document

**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** ✅ Production Ready  
**Document Type:** Product Specification Document

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [System Architecture](#system-architecture)
4. [Core Modules](#core-modules)
5. [Advanced Features](#advanced-features)
6. [API Specifications](#api-specifications)
7. [Database Schema](#database-schema)
8. [User Roles & Permissions](#user-roles--permissions)
9. [Automation & Workflows](#automation--workflows)
10. [Technical Stack](#technical-stack)
11. [Performance Requirements](#performance-requirements)
12. [Security & Compliance](#security--compliance)
13. [Integration Capabilities](#integration-capabilities)
14. [Deployment & Infrastructure](#deployment--infrastructure)
15. [Future Roadmap](#future-roadmap)

---

## 1. Executive Summary

### 1.1 Product Vision

CRM Enterprise V3 is a comprehensive, multi-tenant Customer Relationship Management system designed for enterprise-level businesses. The platform provides end-to-end sales, marketing, finance, and customer service management with advanced automation, analytics, and workflow capabilities.

### 1.2 Key Value Propositions

- **Multi-Tenant Architecture**: Isolated data per company with shared infrastructure
- **Complete Sales Pipeline**: From lead to invoice to shipment
- **Advanced Automation**: 71+ database triggers for workflow automation
- **Real-time Analytics**: Dashboard with KPIs, charts, and insights
- **Mobile-First Design**: Responsive UI optimized for all devices
- **Internationalization**: Full TR/EN locale support
- **Performance Optimized**: <300ms page transitions, <500ms dashboard load

### 1.3 Target Market

- **Primary**: B2B companies with sales teams
- **Secondary**: Service-based businesses requiring customer management
- **Tertiary**: E-commerce businesses with complex order management

---

## 2. Product Overview

### 2.1 Product Description

CRM Enterprise V3 is a cloud-based SaaS platform that enables businesses to manage their entire customer lifecycle from initial contact through sales, invoicing, and post-sale support. The system includes modules for customer management, sales pipeline tracking, quote and invoice generation, inventory management, financial tracking, and customer support.

### 2.2 Core Capabilities

1. **Customer Management**: Centralized customer database with segmentation and activity tracking
2. **Sales Pipeline**: Visual pipeline management with stage tracking and conversion analytics
3. **Quote & Invoice Management**: Automated quote-to-invoice conversion with PDF generation
4. **Inventory Management**: Real-time stock tracking with automated alerts
5. **Financial Management**: Income/expense tracking with budget alerts
6. **Task & Project Management**: Task assignment and tracking with deadlines
7. **Customer Support**: Ticket system with SLA tracking
8. **Document Management**: Secure document storage with access control
9. **Email Campaigns**: Marketing campaign management with email tracking
10. **Analytics & Reporting**: Comprehensive reporting with export capabilities

### 2.3 Product Metrics

| Metric | Value |
|--------|-------|
| Total Modules | 20+ |
| Database Tables | 50+ |
| API Endpoints | 150+ |
| Automation Triggers | 71+ |
| Supported Languages | 2 (TR/EN) |
| Page Load Time | <500ms |
| Page Transition | <300ms |

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                        │
│  Next.js 15 (App Router) + React 18 + TypeScript       │
│  - Server Components (SSR)                              │
│  - Client Components (Interactivity)                    │
│  - Edge Runtime (API Routes)                           │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    API Layer                            │
│  Next.js API Routes (Edge Runtime)                      │
│  - RESTful Endpoints                                    │
│  - Authentication (NextAuth.js)                        │
│  - Authorization (RLS + Permission Checks)             │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                  Database Layer                          │
│  Supabase (PostgreSQL)                                  │
│  - Row-Level Security (RLS)                             │
│  - Database Triggers (Automation)                       │
│  - Functions & Procedures                               │
│  - Storage (File Uploads)                               │
└─────────────────────────────────────────────────────────┘
```

### 3.2 Multi-Tenant Architecture

**Isolation Strategy**: Row-Level Security (RLS)

- Every table includes `companyId` column
- RLS policies filter data by `companyId`
- Users can only access their company's data
- SUPER_ADMIN role bypasses RLS for system administration

**Data Isolation Levels**:
1. **Company Level**: All data scoped to `companyId`
2. **User Level**: Activity logs track `createdBy` user
3. **Role Level**: Permissions control module access

### 3.3 Technology Stack

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (Strict Mode)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Animations**: Framer Motion
- **State Management**: SWR (data fetching), React Query
- **Forms**: React Hook Form + Zod validation
- **Internationalization**: next-intl

#### Backend
- **Runtime**: Edge Runtime (Vercel Edge)
- **Database**: Supabase (PostgreSQL 15)
- **Authentication**: NextAuth.js (Supabase Adapter)
- **Storage**: Supabase Storage
- **PDF Generation**: @react-pdf/renderer
- **Email Service**: Resend (with SendGrid/Brevo fallback)

#### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **CDN**: Vercel Edge Network
- **Cron Jobs**: Vercel Cron (2 slots)
- **Monitoring**: Built-in error logging

---

## 4. Core Modules

### 4.1 Dashboard Module

**Route**: `/dashboard`

**Features**:
- 6 KPI Cards (AnimatedCounter)
  - Total Customers
  - Active Deals
  - Monthly Revenue
  - Pending Quotes
  - Open Tickets
  - Low Stock Items
- 5 Interactive Charts
  - Revenue Trend (Line Chart)
  - Deal Stage Distribution (Pie Chart)
  - Sales Performance (Radar Chart)
  - Quote Status (Doughnut Chart)
  - Deal Pipeline (Kanban View)
- Recent Activities Timeline
- Quick Actions
- Spotlight Section (Important Items)

**Performance**:
- Cache: 60s revalidation
- Real-time: 30s auto-refresh
- Load Time: <500ms target

---

### 4.2 Customer Management Module

**Route**: `/customers`

**Features**:
- **CRUD Operations**: Create, Read, Update, Delete customers
- **Bulk Operations**: Import/Export (CSV, Excel)
- **Customer Segmentation**: Auto-assignment based on criteria
- **Activity Timeline**: Complete interaction history
- **Related Records**: Deals, Quotes, Invoices, Tickets
- **File Attachments**: Document upload and management
- **Status Management**: LEAD, ACTIVE, VIP, LOST
- **Contact Management**: Email, phone, address tracking

**Automations**:
- ✅ Segment criteria match → Auto segment assignment
- ✅ 30 days no contact → Follow-up task creation
- ✅ VIP + 7 days no contact → Priority task creation
- ✅ Status change → Activity log entry

**API Endpoints**:
- `GET /api/customers` - List with filters
- `POST /api/customers` - Create customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer
- `POST /api/customers/bulk` - Bulk operations
- `POST /api/customers/import` - CSV/Excel import
- `GET /api/customers/export` - Export to CSV/Excel

---

### 4.3 Deal (Sales Pipeline) Module

**Route**: `/deals`

**Features**:
- **Pipeline Stages**: LEAD → CONTACTED → PROPOSAL → NEGOTIATION → WON/LOST
- **Deal Value Tracking**: Amount, currency, expected close date
- **Win Probability**: Percentage-based probability tracking
- **Lead Scoring**: Automated scoring based on activity
- **Kanban View**: Visual pipeline representation
- **Workflow Stepper**: Stage progression visualization
- **Related Records**: Customer, Quotes, Contracts, Meetings

**Validations**:
- ❌ Cannot skip stages (must progress sequentially)
- ❌ WON requires `value` field
- ❌ LOST requires `lostReason` field
- ✅ Stage changes trigger notifications

**Automations**:
- ✅ Stage WON → Auto Contract creation
- ✅ Stage change → Notification to assigned user
- ✅ 7 days in LEAD → Auto follow-up task
- ✅ `assignedTo` change → Notification

**API Endpoints**:
- `GET /api/deals` - List with filters
- `POST /api/deals` - Create deal
- `GET /api/deals/[id]` - Get deal details
- `PUT /api/deals/[id]` - Update deal
- `DELETE /api/deals/[id]` - Delete deal
- `GET /api/deals/[id]/history` - Stage change history
- `GET /api/deals/[id]/score` - Calculate lead score
- `GET /api/analytics/deal-kanban` - Kanban data

---

### 4.4 Quote Module

**Route**: `/quotes`

**Features**:
- **Quote Creation**: Multi-item quotes with pricing
- **Version Control**: Revision system for quote updates
- **PDF Generation**: Professional quote PDF export
- **Status Management**: DRAFT → SENT → ACCEPTED/REJECTED/EXPIRED
- **Expiry Tracking**: Automatic expiry after validity period
- **Related Records**: Deal, Customer, Invoice

**Automations**:
- ✅ Status ACCEPTED → Auto Invoice + Contract creation
- ✅ Status SENT → Validation + Notification
- ✅ `validUntil < NOW()` → Auto EXPIRED status
- ✅ 2 days in SENT → Auto follow-up task
- ✅ Stock deduction on ACCEPTED

**API Endpoints**:
- `GET /api/quotes` - List with filters
- `POST /api/quotes` - Create quote
- `GET /api/quotes/[id]` - Get quote details
- `PUT /api/quotes/[id]` - Update quote
- `DELETE /api/quotes/[id]` - Delete quote
- `POST /api/quotes/[id]/revise` - Create revision
- `GET /api/pdf/quote/[id]` - Generate PDF

---

### 4.5 Invoice Module

**Route**: `/invoices`

**Features**:
- **Invoice Creation**: From quotes or manual entry
- **PDF Generation**: Professional invoice PDF export
- **Payment Tracking**: Status (DRAFT → SENT → PAID → OVERDUE)
- **Due Date Management**: Automatic overdue detection
- **Invoice Items**: Multi-item invoices with tax calculation
- **Related Records**: Quote, Customer, Shipment, Finance

**Automations**:
- ✅ Status PAID → Auto Finance record creation
- ✅ `dueDate < NOW()` → Auto OVERDUE status
- ✅ 3 days before due → Notification
- ✅ Overdue → Daily reminder notifications

**API Endpoints**:
- `GET /api/invoices` - List with filters
- `POST /api/invoices` - Create invoice
- `GET /api/invoices/[id]` - Get invoice details
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `GET /api/pdf/invoice/[id]` - Generate PDF
- `GET /api/invoices/available-for-shipment` - List ready for shipment

---

### 4.6 Product Module

**Route**: `/products`

**Features**:
- **Product Catalog**: SKU, name, description, pricing
- **Stock Management**: Real-time inventory tracking
- **Stock Movements**: In/Out tracking with reasons
- **Low Stock Alerts**: Automatic notifications
- **Product Categories**: Category-based organization
- **Related Records**: Quotes, Invoices, Stock Movements

**Automations**:
- ✅ Stock < threshold → Low stock notification
- ✅ Stock movement → Activity log entry
- ✅ Product update → Related quote/invoice update

**API Endpoints**:
- `GET /api/products` - List with filters
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `GET /api/products/[id]/quotes` - Related quotes
- `GET /api/products/[id]/invoices` - Related invoices

---

### 4.7 Finance Module

**Route**: `/finance`

**Features**:
- **Income/Expense Tracking**: Categorized financial records
- **Recurring Expenses**: Automated recurring entry creation
- **Budget Alerts**: Spending threshold notifications
- **Monthly Summaries**: Automated monthly reports
- **Payment Methods**: Cash, Bank Transfer, Credit Card
- **Related Entities**: Invoice, Contract, Meeting

**Automations**:
- ✅ Invoice PAID → Auto Finance record (Income)
- ✅ Recurring expense → Auto entry creation (Cron)
- ✅ Budget exceeded → Alert notification
- ✅ Monthly summary → Auto report generation

**API Endpoints**:
- `GET /api/finance` - List with filters
- `POST /api/finance` - Create finance record
- `GET /api/finance/[id]` - Get finance details
- `PUT /api/finance/[id]` - Update finance record
- `DELETE /api/finance/[id]` - Delete finance record
- `GET /api/finance/recurring` - List recurring expenses
- `GET /api/finance/monthly-summary` - Monthly summary
- `GET /api/finance/budget-alert` - Budget alerts
- `GET /api/finance/export` - Export to Excel

---

### 4.8 Task Module

**Route**: `/tasks`

**Features**:
- **Task Management**: Create, assign, track tasks
- **Priority Levels**: LOW, MEDIUM, HIGH, URGENT
- **Status Tracking**: TODO → IN_PROGRESS → DONE → CANCELLED
- **Due Date Management**: Deadline tracking with reminders
- **Task Assignment**: User-based assignment
- **Related Records**: Customer, Deal, Quote

**Automations**:
- ✅ Overdue task → Daily reminder notification
- ✅ Task assignment → Notification to assignee
- ✅ Task completion → Activity log entry

**API Endpoints**:
- `GET /api/tasks` - List with filters
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task details
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

---

### 4.9 Ticket (Support) Module

**Route**: `/tickets`

**Features**:
- **Ticket Management**: Create, assign, resolve tickets
- **Priority Levels**: LOW, MEDIUM, HIGH, URGENT
- **Status Tracking**: OPEN → IN_PROGRESS → RESOLVED → CLOSED
- **SLA Tracking**: Response time and resolution time
- **Customer Assignment**: Link tickets to customers
- **Related Records**: Customer, User (assignee)

**Automations**:
- ✅ Ticket creation → Notification to assignee
- ✅ Overdue ticket → Daily reminder notification
- ✅ Status change → Activity log entry

**API Endpoints**:
- `GET /api/tickets` - List with filters
- `POST /api/tickets` - Create ticket
- `GET /api/tickets/[id]` - Get ticket details
- `PUT /api/tickets/[id]` - Update ticket
- `DELETE /api/tickets/[id]` - Delete ticket

---

### 4.10 Contract Module

**Route**: `/contracts`

**Features**:
- **Contract Management**: Create, track, renew contracts
- **Contract Types**: SALES, SERVICE, PARTNERSHIP
- **Status Tracking**: DRAFT → ACTIVE → EXPIRED → RENEWED
- **Expiry Management**: Automatic expiry detection
- **Renewal Reminders**: 30/60/90 days before expiry
- **Related Records**: Deal, Customer, Quote

**Automations**:
- ✅ Deal WON → Auto Contract creation
- ✅ Quote ACCEPTED → Auto Contract creation
- ✅ 30 days before expiry → Renewal reminder
- ✅ Contract expiry → Status update + Notification

**API Endpoints**:
- `GET /api/contracts` - List with filters
- `POST /api/contracts` - Create contract
- `GET /api/contracts/[id]` - Get contract details
- `PUT /api/contracts/[id]` - Update contract
- `DELETE /api/contracts/[id]` - Delete contract

---

### 4.11 Shipment Module

**Route**: `/shipments`

**Features**:
- **Shipment Tracking**: Create and track shipments
- **Status Management**: PENDING → IN_TRANSIT → DELIVERED → RETURNED
- **Invoice Linking**: Link shipments to invoices
- **Stock Deduction**: Automatic stock movement on delivery
- **Tracking Number**: External tracking integration
- **Related Records**: Invoice, Customer

**Automations**:
- ✅ Status DELIVERED → Stock deduction + Activity log
- ✅ Shipment creation → Notification

**API Endpoints**:
- `GET /api/shipments` - List with filters
- `POST /api/shipments` - Create shipment
- `GET /api/shipments/[id]` - Get shipment details
- `PUT /api/shipments/[id]` - Update shipment
- `DELETE /api/shipments/[id]` - Delete shipment
- `PUT /api/shipments/[id]/status` - Update status

---

### 4.12 Meeting Module

**Route**: `/meetings`

**Features**:
- **Meeting Scheduling**: Create and track meetings
- **Expense Tracking**: Fuel, accommodation, food, other expenses
- **Status Management**: PLANNED → DONE → CANCELLED
- **Location Tracking**: Meeting location and duration
- **Related Records**: Customer, Deal, Company
- **Export**: PDF and Excel export

**Automations**:
- ✅ Meeting creation → Calendar notification
- ✅ Expense warning → Alert if no expense entered

**API Endpoints**:
- `GET /api/meetings` - List with filters
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/[id]` - Get meeting details
- `PUT /api/meetings/[id]` - Update meeting
- `DELETE /api/meetings/[id]` - Delete meeting
- `GET /api/meetings/export` - Export to PDF/Excel

---

### 4.13 Company Module

**Route**: `/companies`

**Features**:
- **Company Management**: Create and manage companies
- **Multi-Tenant Root**: Base table for multi-tenant architecture
- **Company Settings**: Module permissions, user management
- **Status Management**: ACTIVE/INACTIVE
- **Related Records**: Users, Customers, Deals, Quotes, Invoices

**API Endpoints**:
- `GET /api/companies` - List with filters
- `POST /api/companies` - Create company
- `GET /api/companies/[id]` - Get company details
- `PUT /api/companies/[id]` - Update company
- `DELETE /api/companies/[id]` - Delete company
- `GET /api/companies/export` - Export to Excel

---

### 4.14 Vendor Module

**Route**: `/vendors`

**Features**:
- **Vendor Management**: Create and manage vendors
- **Contact Information**: Email, phone, address
- **Sector Classification**: Industry sector tracking
- **Related Records**: Quotes, Products, Invoices, Shipments

**API Endpoints**:
- `GET /api/vendors` - List with filters
- `POST /api/vendors` - Create vendor
- `GET /api/vendors/[id]` - Get vendor details
- `PUT /api/vendors/[id]` - Update vendor
- `DELETE /api/vendors/[id]` - Delete vendor

---

## 5. Advanced Features

### 5.1 Document Management Module

**Route**: `/documents`

**Features**:
- **File Upload**: Secure file storage in Supabase Storage
- **Access Control**: User/Customer-based access management
- **Access Levels**: VIEW, DOWNLOAD, EDIT
- **Expiration Dates**: Time-based access expiration
- **Document Categories**: Categorized document organization
- **Version Control**: Document version tracking

**API Endpoints**:
- `GET /api/documents` - List with pagination
- `POST /api/documents` - Create document record
- `GET /api/documents/[id]` - Get document details
- `PUT /api/documents/[id]` - Update document
- `DELETE /api/documents/[id]` - Delete document
- `POST /api/documents/[id]/access` - Add access
- `DELETE /api/documents/[id]/access/[accessId]` - Remove access
- `POST /api/files/upload` - Upload file to storage

---

### 5.2 Approval Module

**Route**: `/approvals`

**Features**:
- **Approval Requests**: Create approval requests for various entities
- **Multi-Approver Support**: Multiple approvers per request
- **Priority Levels**: LOW, MEDIUM, HIGH, URGENT
- **Status Tracking**: PENDING → APPROVED/REJECTED
- **Entity Linking**: Link to Quote, Deal, Contract, Invoice
- **Reminder System**: Daily reminders for pending approvals

**Automations**:
- ✅ Approval request → Email notification to approvers
- ✅ Approval/Rejection → Email notification to requester
- ✅ Pending > 24 hours → Daily reminder

**API Endpoints**:
- `GET /api/approvals` - List with filters
- `POST /api/approvals` - Create approval request
- `GET /api/approvals/[id]` - Get approval details
- `POST /api/approvals/[id]/approve` - Approve request
- `POST /api/approvals/[id]/reject` - Reject request
- `GET /api/approvals/records` - Get related records

---

### 5.3 Email Campaign Module

**Route**: `/email-campaigns`

**Features**:
- **Campaign Creation**: Create email marketing campaigns
- **HTML Editor**: Rich text email content editor
- **Email Preview**: Preview emails before sending
- **Scheduling**: Schedule campaigns for future sending
- **Email Tracking**: Sent, opened, clicked, bounced statistics
- **Email Logs**: Individual email send status tracking
- **Target Segmentation**: Segment-based targeting

**Automations**:
- ✅ Scheduled campaign → Auto send (Cron)
- ✅ Email sent → Log entry + Statistics update

**API Endpoints**:
- `GET /api/email-campaigns` - List with filters
- `POST /api/email-campaigns` - Create campaign
- `GET /api/email-campaigns/[id]` - Get campaign details
- `PUT /api/email-campaigns/[id]` - Update campaign
- `DELETE /api/email-campaigns/[id]` - Delete campaign
- `POST /api/email-campaigns/[id]/send` - Send campaign
- `GET /api/email-campaigns/[id]/logs` - Get email logs

**Email Service Integration**:
- Primary: Resend
- Fallback: SendGrid, Brevo
- Test Endpoint: `/api/test-email`

---

### 5.4 Segment Module

**Route**: `/segments`

**Features**:
- **Customer Segmentation**: Create customer segments
- **Auto-Assignment**: Automatic customer assignment based on criteria
- **Criteria Builder**: JSON-based filtering criteria
- **Member Management**: Add/remove segment members
- **Member Count**: Automatic member count tracking
- **Color Coding**: Visual segment identification

**Automations**:
- ✅ Customer matches criteria → Auto segment assignment
- ✅ Member count → Auto update on add/remove

**API Endpoints**:
- `GET /api/segments` - List segments
- `POST /api/segments` - Create segment
- `GET /api/segments/[id]` - Get segment details
- `PUT /api/segments/[id]` - Update segment
- `DELETE /api/segments/[id]` - Delete segment
- `GET /api/segments/[id]/members` - List members
- `DELETE /api/segments/[id]/members/[memberId]` - Remove member

---

### 5.5 Competitor Module

**Route**: `/competitors`

**Features**:
- **Competitor Tracking**: Track competitor information
- **Strengths/Weaknesses**: SWOT-like analysis
- **Pricing Strategy**: Competitor pricing tracking
- **Market Position**: Market share and positioning
- **Related Records**: Deals, Quotes

**API Endpoints**:
- `GET /api/competitors` - List competitors
- `POST /api/competitors` - Create competitor
- `GET /api/competitors/[id]` - Get competitor details
- `PUT /api/competitors/[id]` - Update competitor
- `DELETE /api/competitors/[id]` - Delete competitor
- `GET /api/competitors/[id]/stats` - Get statistics

---

### 5.6 Reports Module

**Route**: `/reports`

**Features**:
- **Sales Reports**: Revenue, conversion, pipeline analysis
- **Customer Reports**: Customer segmentation, activity reports
- **Financial Reports**: Income/expense, profit/loss reports
- **Product Reports**: Sales by product, stock reports
- **Quote Reports**: Quote conversion, win/loss analysis
- **Invoice Reports**: Payment status, overdue analysis
- **Performance Reports**: User performance, team metrics
- **Time-Based Reports**: Daily, weekly, monthly reports
- **Export**: Excel, PDF, CSV export

**API Endpoints**:
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/customers` - Customer reports
- `GET /api/reports/financial` - Financial reports
- `GET /api/reports/products` - Product reports
- `GET /api/reports/quotes` - Quote reports
- `GET /api/reports/invoices` - Invoice reports
- `GET /api/reports/performance` - Performance reports
- `GET /api/reports/time` - Time-based reports
- `GET /api/reports/export` - Export reports

---

### 5.7 Analytics Module

**Route**: `/dashboard` (Analytics Section)

**Features**:
- **KPIs**: Real-time key performance indicators
- **Trend Analysis**: Revenue, sales, customer trends
- **Distribution Charts**: Deal stage, quote status distribution
- **Performance Metrics**: User and team performance
- **Kanban Views**: Visual pipeline representation
- **Recent Activities**: Activity timeline

**API Endpoints**:
- `GET /api/analytics/kpis` - Get KPIs
- `GET /api/analytics/trends` - Get trends
- `GET /api/analytics/distribution` - Get distributions
- `GET /api/analytics/deal-kanban` - Deal Kanban data
- `GET /api/analytics/quote-kanban` - Quote Kanban data
- `GET /api/analytics/invoice-kanban` - Invoice Kanban data
- `GET /api/analytics/user-performance` - User performance
- `GET /api/analytics/recent-activities` - Recent activities

---

## 6. API Specifications

### 6.1 API Architecture

**Base URL**: `/api`

**Authentication**: NextAuth.js (Session-based)

**Authorization**: 
- Row-Level Security (RLS) at database level
- Permission checks at API level
- Role-based access control

**Response Format**: JSON

**Error Format**:
```json
{
  "error": "Error message",
  "details": "Optional details"
}
```

### 6.2 Common API Patterns

#### List Endpoints
```
GET /api/{resource}?search={query}&status={status}&page={page}&limit={limit}
```

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

#### Create Endpoints
```
POST /api/{resource}
Content-Type: application/json

{
  "field1": "value1",
  "field2": "value2"
}
```

**Response**:
```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

#### Update Endpoints
```
PUT /api/{resource}/{id}
Content-Type: application/json

{
  "field1": "new_value1"
}
```

#### Delete Endpoints
```
DELETE /api/{resource}/{id}
```

### 6.3 API Endpoint Categories

**Total Endpoints**: 150+

**Categories**:
- CRUD Operations (20 modules × ~5 endpoints = 100 endpoints)
- Analytics Endpoints (10 endpoints)
- Report Endpoints (10 endpoints)
- Automation Endpoints (5 endpoints)
- File Upload Endpoints (3 endpoints)
- PDF Generation Endpoints (2 endpoints)
- Cron Job Endpoints (8 endpoints)
- Permission Endpoints (5 endpoints)
- Notification Endpoints (3 endpoints)
- Test Endpoints (4 endpoints)

---

## 7. Database Schema

### 7.1 Core Tables

#### Company (Multi-Tenant Root)
```sql
CREATE TABLE "Company" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  taxNumber TEXT,
  status TEXT DEFAULT 'ACTIVE',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### User
```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT DEFAULT 'USER',
  companyId UUID REFERENCES "Company"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Customer
```sql
CREATE TABLE "Customer" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'ACTIVE',
  companyId UUID REFERENCES "Company"(id) ON DELETE CASCADE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### 7.2 Sales Pipeline Tables

- **Deal**: Sales opportunities
- **Quote**: Sales quotes
- **QuoteItem**: Quote line items
- **Invoice**: Invoices
- **InvoiceItem**: Invoice line items
- **Contract**: Sales contracts

### 7.3 Inventory Tables

- **Product**: Product catalog
- **StockMovement**: Stock in/out movements
- **Shipment**: Shipment tracking
- **PurchaseShipment**: Purchase shipments

### 7.4 Financial Tables

- **Finance**: Income/expense records
- **RecurringExpense**: Recurring expense templates

### 7.5 Support Tables

- **Task**: Task management
- **Ticket**: Support tickets
- **Meeting**: Meeting records

### 7.6 Advanced Tables

- **Document**: Document records
- **DocumentAccess**: Document access control
- **Approval**: Approval requests
- **EmailCampaign**: Email campaigns
- **EmailLog**: Email send logs
- **Segment**: Customer segments
- **CustomerSegment**: Segment memberships
- **Competitor**: Competitor tracking

### 7.7 System Tables

- **ActivityLog**: System activity log
- **Notification**: User notifications
- **Module**: System modules
- **Role**: User roles
- **Permission**: Role permissions
- **CompanyModulePermission**: Company module access

### 7.8 Indexes

**Total Indexes**: 50+

**Key Indexes**:
- `idx_customer_company` on `Customer(companyId)`
- `idx_deal_company` on `Deal(companyId)`
- `idx_quote_status` on `Quote(status)`
- `idx_invoice_status` on `Invoice(status)`
- `idx_activitylog_company` on `ActivityLog(companyId)`

### 7.9 Row-Level Security (RLS)

**Policy Pattern**:
```sql
CREATE POLICY "Users can only see their company's data"
ON "Customer"
FOR SELECT
USING (auth.uid() IN (
  SELECT id FROM "User" WHERE "companyId" = "Customer"."companyId"
));
```

**SUPER_ADMIN Bypass**:
```sql
CREATE POLICY "Super admin can see all data"
ON "Customer"
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  )
);
```

---

## 8. User Roles & Permissions

### 8.1 System Roles

| Role | Code | Description | System Role |
|------|------|-------------|-------------|
| Super Admin | `SUPER_ADMIN` | System administrator | ✅ Yes |
| Admin | `ADMIN` | Company administrator | ❌ No |
| Sales | `SALES` | Sales representative | ❌ No |
| User | `USER` | Basic user | ❌ No |

### 8.2 Permission System

**Two-Level Permission System**:

1. **Company Module Permission**: Controls which modules a company can access
2. **Role Permission**: Controls CRUD operations per role per module

**Permission Types**:
- `canView`: View/list records
- `canCreate`: Create new records
- `canUpdate`: Update existing records
- `canDelete`: Delete records

### 8.3 Modules with Permissions

**Total Modules**: 20+

**Core Modules**:
- customer, deal, quote, invoice, contract
- product, finance, task, ticket, shipment
- activity, report, lead-scoring
- email-templates, segment, competitor
- email-campaign, document, approval

---

## 9. Automation & Workflows

### 9.1 Automation Triggers

**Total Triggers**: 71+

**Categories**:
- **Status Change Triggers**: Status updates trigger notifications
- **Creation Triggers**: Record creation triggers related record creation
- **Expiry Triggers**: Time-based expiry detection
- **Reminder Triggers**: Deadline-based reminders
- **Stock Triggers**: Stock level monitoring
- **Financial Triggers**: Payment and budget monitoring

### 9.2 Key Automations

#### Deal Automations
- ✅ Stage WON → Auto Contract creation
- ✅ Stage change → Notification
- ✅ 7 days in LEAD → Auto follow-up task
- ✅ `assignedTo` change → Notification

#### Quote Automations
- ✅ Status ACCEPTED → Auto Invoice + Contract creation
- ✅ Status SENT → Validation + Notification
- ✅ `validUntil < NOW()` → Auto EXPIRED
- ✅ 2 days in SENT → Auto follow-up task
- ✅ Stock deduction on ACCEPTED

#### Invoice Automations
- ✅ Status PAID → Auto Finance record creation
- ✅ `dueDate < NOW()` → Auto OVERDUE
- ✅ 3 days before due → Notification
- ✅ Overdue → Daily reminder

#### Customer Automations
- ✅ Segment criteria match → Auto segment assignment
- ✅ 30 days no contact → Follow-up task
- ✅ VIP + 7 days no contact → Priority task

#### Contract Automations
- ✅ Deal WON → Auto Contract creation
- ✅ Quote ACCEPTED → Auto Contract creation
- ✅ 30 days before expiry → Renewal reminder
- ✅ Contract expiry → Status update + Notification

#### Stock Automations
- ✅ Stock < threshold → Low stock notification
- ✅ Shipment DELIVERED → Stock deduction

#### Task Automations
- ✅ Overdue task → Daily reminder
- ✅ Task assignment → Notification

#### Ticket Automations
- ✅ Ticket creation → Notification
- ✅ Overdue ticket → Daily reminder

#### Approval Automations
- ✅ Approval request → Email to approvers
- ✅ Approval/Rejection → Email to requester
- ✅ Pending > 24 hours → Daily reminder

### 9.3 Cron Jobs

**Vercel Cron Slots**: 2 (Consolidated)

**Active Cron Jobs**:
1. **Invoice Check** (`/api/cron/check-invoices`)
   - Checks overdue invoices
   - Checks due-soon invoices
   - Sends daily reminders
   - Frequency: Daily at 9:00 AM

2. **Approval Reminders** (`/api/cron/check-approval-reminders`)
   - Checks pending approvals > 24 hours
   - Sends daily reminders
   - Frequency: Daily at 10:00 AM

3. **Scheduled Email Campaigns** (`/api/cron/send-scheduled-campaigns`)
   - Sends scheduled email campaigns
   - Frequency: Every 15 minutes

**Other Cron Jobs** (Consolidated or Removed):
- Quote expiry check (Trigger-based)
- Contract renewal check (Trigger-based)
- Low stock check (Trigger-based)
- Overdue tasks (Trigger-based)
- Overdue tickets (Trigger-based)

---

## 10. Technical Stack

### 10.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.x | React framework |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 3.x | Styling |
| shadcn/ui | Latest | Component library |
| Framer Motion | Latest | Animations |
| SWR | Latest | Data fetching |
| React Query | Latest | Server state |
| React Hook Form | Latest | Form management |
| Zod | Latest | Schema validation |
| next-intl | Latest | Internationalization |

### 10.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js API Routes | 15.x | API endpoints |
| Edge Runtime | Latest | Serverless functions |
| NextAuth.js | Latest | Authentication |
| Supabase Client | Latest | Database client |
| @react-pdf/renderer | Latest | PDF generation |

### 10.3 Database & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 15 | Primary database |
| Supabase Storage | Latest | File storage |
| Row-Level Security | Built-in | Data isolation |

### 10.4 External Services

| Service | Purpose |
|---------|---------|
| Resend | Email sending (Primary) |
| SendGrid | Email sending (Fallback) |
| Brevo | Email sending (Fallback) |
| Vercel | Hosting & CDN |
| Supabase | Database & Auth |

---

## 11. Performance Requirements

### 11.1 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load Time | <500ms | First contentful paint |
| Page Transition | <300ms | Link click → render |
| API Response (Cache Hit) | <200ms | Request → response |
| API Response (Cache Miss) | <1000ms | Request → response |
| Skeleton Display | <100ms | Loading → skeleton |
| Lighthouse Performance | >95 | Performance score |

### 11.2 Optimization Strategies

**Frontend**:
- ✅ Server Components (SSR)
- ✅ Lazy loading (dynamic imports)
- ✅ Code splitting (route-based)
- ✅ Image optimization (next/image)
- ✅ SWR caching (5s deduping)
- ✅ Optimistic updates

**Backend**:
- ✅ Edge Runtime (fast cold starts)
- ✅ Database indexes (50+ indexes)
- ✅ Connection pooling (Supabase singleton)
- ✅ Query optimization (RLS-aware)

**Caching**:
- ✅ SWR cache (client-side)
- ✅ API cache (60s revalidation)
- ✅ Static generation (where applicable)

---

## 12. Security & Compliance

### 12.1 Security Features

**Authentication**:
- ✅ NextAuth.js (Session-based)
- ✅ Supabase Auth integration
- ✅ Password hashing (bcrypt)
- ✅ Session management

**Authorization**:
- ✅ Row-Level Security (RLS)
- ✅ Permission-based access control
- ✅ Role-based restrictions
- ✅ API-level authorization checks

**Data Protection**:
- ✅ Multi-tenant isolation (RLS)
- ✅ Input validation (Zod schemas)
- ✅ SQL injection prevention (Parameterized queries)
- ✅ XSS prevention (React sanitization)

**File Security**:
- ✅ Secure file upload (Supabase Storage)
- ✅ Access control (DocumentAccess table)
- ✅ File type validation
- ✅ Size limits

### 12.2 Compliance

**GDPR Considerations**:
- ✅ Data isolation (multi-tenant)
- ✅ User data export capability
- ✅ Activity logging (audit trail)
- ✅ Access control (permission system)

**Data Privacy**:
- ✅ Encrypted connections (HTTPS)
- ✅ Secure storage (Supabase)
- ✅ No sensitive data logging
- ✅ Error message sanitization

---

## 13. Integration Capabilities

### 13.1 Email Integration

**Supported Services**:
- Resend (Primary)
- SendGrid (Fallback)
- Brevo (Fallback)

**Features**:
- Email campaign sending
- Email tracking (sent, opened, clicked, bounced)
- Email templates
- Scheduled sending

### 13.2 File Storage Integration

**Service**: Supabase Storage

**Buckets**:
- `crm-files`: Entity-related files
- `documents`: General documents

**Features**:
- Secure file upload
- Access control
- File versioning (planned)

### 13.3 PDF Generation

**Library**: @react-pdf/renderer

**Features**:
- Quote PDF generation
- Invoice PDF generation
- Customizable templates
- Edge Runtime compatible

### 13.4 Export Capabilities

**Formats**:
- CSV (Customer, Company exports)
- Excel (Reports, Finance exports)
- PDF (Quotes, Invoices)

**Features**:
- Bulk export
- Filtered export
- Scheduled exports (planned)

---

## 14. Deployment & Infrastructure

### 14.1 Hosting

**Platform**: Vercel

**Features**:
- Automatic deployments (Git integration)
- Edge Network (Global CDN)
- Serverless functions
- Environment variable management

### 14.2 Database

**Platform**: Supabase

**Features**:
- PostgreSQL 15
- Automatic backups
- Point-in-time recovery
- Connection pooling

### 14.3 Environment Variables

**Required Variables**:
```
NEXTAUTH_URL=
NEXTAUTH_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
SENDGRID_API_KEY= (optional)
BREVO_API_KEY= (optional)
```

### 14.4 Deployment Process

1. **Code Push**: Git push to main branch
2. **Build**: Vercel builds Next.js app
3. **Deploy**: Automatic deployment to production
4. **Database Migration**: Manual migration via Supabase SQL Editor
5. **Verification**: Health check endpoint

---

## 15. Future Roadmap

### 15.1 Planned Features

**Q1 2024**:
- [ ] Mobile app (React Native)
- [ ] Advanced reporting dashboard
- [ ] Webhook integrations
- [ ] API rate limiting

**Q2 2024**:
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics (ML-based insights)
- [ ] Custom workflow builder
- [ ] Third-party integrations (Zapier, etc.)

**Q3 2024**:
- [ ] AI-powered lead scoring
- [ ] Predictive analytics
- [ ] Automated email responses
- [ ] Voice call integration

### 15.2 Technical Improvements

- [ ] GraphQL API (alternative to REST)
- [ ] Microservices architecture (scalability)
- [ ] Redis caching layer
- [ ] Elasticsearch (advanced search)
- [ ] Kubernetes deployment (self-hosted option)

---

## Appendix A: API Endpoint Reference

### Complete API Endpoint List

**Total**: 150+ endpoints

**Categories**:
- Customer Management (8 endpoints)
- Deal Management (7 endpoints)
- Quote Management (7 endpoints)
- Invoice Management (7 endpoints)
- Product Management (7 endpoints)
- Finance Management (9 endpoints)
- Task Management (5 endpoints)
- Ticket Management (5 endpoints)
- Contract Management (5 endpoints)
- Shipment Management (6 endpoints)
- Meeting Management (6 endpoints)
- Company Management (6 endpoints)
- Vendor Management (5 endpoints)
- Document Management (7 endpoints)
- Approval Management (6 endpoints)
- Email Campaign Management (7 endpoints)
- Segment Management (6 endpoints)
- Competitor Management (6 endpoints)
- Reports (10 endpoints)
- Analytics (8 endpoints)
- User Management (5 endpoints)
- Permission Management (5 endpoints)
- Notification Management (3 endpoints)
- File Upload (3 endpoints)
- PDF Generation (2 endpoints)
- Cron Jobs (8 endpoints)
- Test Endpoints (4 endpoints)

---

## Appendix B: Database Schema Reference

### Complete Table List

**Total**: 50+ tables

**Core Tables**:
- Company, User, Customer, CustomerCompany

**Sales Tables**:
- Deal, Quote, QuoteItem, Invoice, InvoiceItem, Contract

**Inventory Tables**:
- Product, StockMovement, Shipment, PurchaseShipment

**Financial Tables**:
- Finance, RecurringExpense

**Support Tables**:
- Task, Ticket, Meeting

**Advanced Tables**:
- Document, DocumentAccess, Approval, EmailCampaign, EmailLog
- Segment, CustomerSegment, Competitor

**System Tables**:
- ActivityLog, Notification, Module, Role, Permission
- CompanyModulePermission, CompanyModule

---

## Appendix C: Glossary

**CRM**: Customer Relationship Management

**RLS**: Row-Level Security (PostgreSQL feature for data isolation)

**Multi-Tenant**: Architecture where multiple companies share the same infrastructure but have isolated data

**Pipeline**: Sales process stages from lead to closed deal

**KPI**: Key Performance Indicator

**SLA**: Service Level Agreement

**SWR**: Stale-While-Revalidate (data fetching library)

**SSR**: Server-Side Rendering

**Edge Runtime**: Serverless function runtime optimized for low latency

---

## Document Control

**Version History**:
- v1.0.0 (2024): Initial Product Specification Document

**Document Owner**: Development Team

**Review Cycle**: Quarterly

**Last Review Date**: 2024

---

**End of Document**









