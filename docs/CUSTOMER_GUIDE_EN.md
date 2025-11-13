# 📘 CRM Enterprise V3 - Customer Guide

## Welcome!

Welcome to CRM Enterprise V3! This guide will help you understand the basic features and usage of the system.

---

## 📋 Table of Contents

1. [First Login and Account Setup](#first-login)
2. [Dashboard Usage](#dashboard)
3. [Customer Management](#customer-management)
4. [Sales Process](#sales-process)
5. [Invoices and Finance](#invoices-finance)
6. [Tasks and Calendar](#tasks-calendar)
7. [Reports](#reports)
8. [Settings and Authorization](#settings)
9. [Frequently Asked Questions](#faq)

---

## 🚀 First Login and Account Setup {#first-login}

### Logging In

1. Log in with the email address and password provided by your system administrator.
2. It is recommended to change your password on first login.
3. You can select your language preference (Turkish/English).

### Initial Setup

- **Company Information**: Update your company information from the admin panel.
- **Adding Users**: You can add new users with Admin or SuperAdmin privileges.
- **Module Permissions**: You can set module-based permissions for each user.

---

## 📊 Dashboard Usage {#dashboard}

The Dashboard allows you to see the overall status of your business at a glance.

### Key Metrics

- **Active Opportunities**: Total number of opportunities in the pipeline
- **Hot Opportunities**: Your priority opportunities
- **Today's Agenda**: Scheduled meetings and tasks
- **Revenue Metrics**: Monthly/weekly revenue summary

### Pipeline View

- View your opportunities by stage
- Review the number of opportunities and details in each stage
- Click to access detailed information

### Charts

- **Sales Trend**: Sales performance over time
- **Status Distribution**: Analysis of opportunity and quote statuses
- **Customer Segmentation**: Customer distribution and analysis

---

## 👥 Customer Management {#customer-management}

### Customer Companies

1. **Adding New Customer**:
   - Go to "Customer Companies" → "Add New" from the left menu
   - Fill in company information (name, sector, address, etc.)
   - Save

2. **Customer List**:
   - View all your customers
   - Search and filter
   - Filter by status (Active/Inactive)

3. **Customer Details**:
   - Click on the customer card to go to the detail page
   - Related opportunities, quotes, and invoices are displayed
   - You can add communication history and notes

### Individual Customers

- A separate module is available for individual customers
- Managed independently from company customers

### Company Contacts

- You can add authorized persons to each customer company
- Track contact information and tasks

---

## 💼 Sales Process {#sales-process}

### Opportunities (Deals)

1. **Creating New Opportunity**:
   - Go to "Opportunities" → "Add New"
   - Enter customer, amount, stage information
   - Select assigned person

2. **Pipeline Management**:
   - Drag and drop opportunities in Kanban view
   - Track stage changes
   - Receive automatic notifications

3. **Opportunity Details**:
   - Related quotes and invoices are displayed
   - Activity history and notes can be added

### Quotes

1. **Creating Quote**:
   - Create quote from opportunity or add directly
   - Add products/services, set pricing
   - Download as PDF or send via email

2. **Quote Statuses**:
   - **DRAFT**: Draft
   - **SENT**: Sent
   - **ACCEPTED**: Accepted (invoice is automatically created)
   - **REJECTED**: Rejected

3. **Sending Quote**:
   - Click the "Send" button
   - Automatic notification is sent to the customer
   - Status is updated to "SENT"

### Contracts

- Create contracts from accepted quotes
- Manage contract details
- Download as PDF

---

## 💰 Invoices and Finance {#invoices-finance}

### Invoices

1. **Creating Invoice**:
   - Automatically created from accepted quotes
   - Or manually add from "Invoices" → "Add New"
   - Add products/services, VAT calculation is automatic

2. **Invoice Statuses**:
   - **DRAFT**: Draft
   - **SENT**: Sent
   - **PAID**: Paid (financial record is automatically created)
   - **OVERDUE**: Overdue

3. **PDF Download**:
   - Download PDF from invoice detail page
   - You can send it to the customer via email

### Finance Module

- Manage income and expense records
- Perform category-based analysis
- View financial reports

---

## ✅ Tasks and Calendar {#tasks-calendar}

### Tasks

1. **Creating Task**:
   - Go to "Tasks" → "Add New"
   - Set title, description, assigned person, due date
   - Select priority level

2. **Task Statuses**:
   - **TODO**: To Do
   - **IN_PROGRESS**: In Progress
   - **DONE**: Done

3. **Task Assignment**:
   - Assign tasks to team members
   - Automatic notifications are sent

### Meetings

- Record scheduled meetings with customers
- View in calendar view
- Set reminders

---

## 📈 Reports {#reports}

### Report Types

1. **Sales Reports**:
   - Opportunity-based analysis
   - Stage-based performance
   - Time-based trends

2. **Customer Reports**:
   - Customer segmentation
   - Sector-based analysis
   - City-based distribution

3. **Financial Reports**:
   - Income/expense analysis
   - Category-based reports
   - Time-based financial trends

4. **Product Reports**:
   - Best-selling products
   - Product-based revenue analysis

### Report Filtering

- Select date range
- Filter by user
- Filter by company/module

### Report Export

- Download in Excel format
- Save as PDF
- Export in CSV format

---

## ⚙️ Settings and Authorization {#settings}

### User Management

**Admin Privileges**:
- View users in your company
- Edit user permissions
- Grant module-based permissions

**SuperAdmin Privileges**:
- View all companies
- Create new users
- Manage by company

### Module Permissions

The following permissions can be defined for each module:
- **READ**: View
- **CREATE**: Create
- **UPDATE**: Update
- **DELETE**: Delete

### Company Settings

- Update company information
- Upload logo
- Edit contact information

---

## ❓ Frequently Asked Questions {#faq}

### General Questions

**Q: I forgot my password, what should I do?**
A: Contact your system administrator. Password reset is performed by the administrator.

**Q: Can I manage multiple companies?**
A: With SuperAdmin privileges, you can view all companies. Normal users only see their own company.

**Q: Is my data secure?**
A: Yes. The system isolates multi-company data from each other with Row-Level Security (RLS). Each user only sees their own company's data.

### Technical Questions

**Q: Can I use it from mobile devices?**
A: Yes, the system has a responsive design. You can use it comfortably from mobile browsers.

**Q: Does it work offline?**
A: No, the system requires an internet connection. Data is stored in Supabase cloud database.

**Q: Can I export my data?**
A: Yes, you can export in Excel, PDF, or CSV format from the reports module.

### Workflow Questions

**Q: What happens when a quote is accepted?**
A: When the quote status changes to "ACCEPTED", an invoice is automatically created and stock is deducted (if it's a product).

**Q: What happens when an invoice is paid?**
A: When the invoice status changes to "PAID", an income record is automatically added to the finance module.

**Q: Do I receive a notification when a task is assigned?**
A: Yes, an automatic notification is sent to the user assigned to the task.

---

## 📞 Support

### Help and Support

- **Email**: support@yourdomain.com
- **Help Center**: You can access the "Help" menu from within the system
- **User Guide**: You can review the "User Guide" section from within the system

### Error Reporting

If you encounter an error:
1. Note the error message
2. Take a screenshot
3. Report to the support team

---

## 🔄 Updates

The system is regularly updated. For new features and improvements:
- Check notifications on the Dashboard
- Read update notes in the help center

---

**Last Update**: 2024

**Version**: 1.0.0


