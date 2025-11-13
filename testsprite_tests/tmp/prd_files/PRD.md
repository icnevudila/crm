# CRM Enterprise V3 - Product Requirements Document

## Project Overview
Next.js 15 tabanlı, Supabase destekli, multi-tenant CRM sistemi. Performans odaklı (<300ms sekme geçişi), premium UI teması, TR/EN locale desteği.

## Tech Stack
- Frontend: Next.js 15 (App Router), React 18, TypeScript
- Backend: Supabase (PostgreSQL)
- UI: Tailwind CSS, shadcn/ui
- State: SWR, Zustand
- Auth: NextAuth.js
- Locale: next-intl

## Core Features
1. Authentication - Login/logout, session management
2. Dashboard - KPI cards, charts, analytics
3. Customer Management - CRUD, bulk operations
4. Deal Management - Pipeline, kanban view
5. Quote Management - CRUD, PDF generation
6. Invoice Management - CRUD, payment tracking
7. Product Management - CRUD, stock tracking
8. Finance Management - Income/expense tracking
9. Task Management - CRUD, assignment
10. Ticket Management - Support ticket system
11. Reports - Analytics and exports
12. Admin Panel - User and permission management

## Performance Requirements
- Page transition: <300ms
- Dashboard load: <500ms
- API response (cached): <200ms
- API response (uncached): <1000ms

## Security Requirements
- Multi-tenant RLS (Row-Level Security)
- Company-based data isolation
- Role-based access control
- Session management

