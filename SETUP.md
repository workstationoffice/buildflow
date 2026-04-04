# ConstructFlow — Setup Guide

## Prerequisites
- Node.js 20+
- PostgreSQL database
- Clerk account
- (Optional) Cloudflare R2, Resend, LINE Messaging API

---

## 1. Install dependencies
```bash
npm install
```

## 2. Configure environment
```bash
cp .env.example .env.local
```
Fill in all values in `.env.local`.

### Required services:
| Service | Purpose | Free tier |
|---------|---------|-----------|
| [Clerk](https://clerk.com) | Auth (Email + Google + Microsoft) | Yes |
| PostgreSQL | Database | Supabase free tier |
| [Resend](https://resend.com) | Email notifications | Yes |
| [Cloudflare R2](https://cloudflare.com) | File/selfie storage | Yes |
| LINE Messaging API | LINE notifications | Yes |

### Clerk setup:
1. Create app at clerk.com
2. Enable Email, Google, and Microsoft OAuth providers
3. For Google: request `https://www.googleapis.com/auth/calendar` scope
4. For Microsoft: request `Calendars.ReadWrite` scope
5. Copy publishable key + secret key to `.env.local`

---

## 3. Set up database
```bash
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Run migrations
npm run db:seed       # Seed default pipeline stages
```

## 4. Run development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
src/
├── app/
│   ├── (auth)/          # Sign-in / Sign-up pages
│   ├── (dashboard)/     # All protected pages
│   │   ├── dashboard/   # Live check-in overview
│   │   ├── visits/      # Check-in / Check-out flow
│   │   ├── calendar/    # Year/Month/Day calendar view
│   │   ├── deals/       # Kanban CRM board
│   │   ├── customers/   # Customer master + Customer 360
│   │   ├── sites/       # Project site management
│   │   ├── users/       # User management
│   │   └── settings/    # Storage, pipeline stages, permissions
│   └── api/             # API routes
├── components/
│   ├── deals/           # Kanban board, deal cards
│   ├── calendar/        # Calendar view component
│   ├── layout/          # Sidebar, header
│   └── dashboard/       # Settings tabs
├── lib/
│   ├── auth.ts          # User/role helpers
│   ├── permissions.ts   # Permission system
│   ├── resend.ts        # Email notifications
│   ├── line.ts          # LINE notifications
│   ├── r2.ts            # Cloudflare R2 uploads
│   ├── google-calendar.ts
│   └── microsoft-calendar.ts
└── prisma/
    └── schema.prisma    # Full database schema
```

---

## Key features implemented
- ✅ PWA (installable on mobile/desktop)
- ✅ Clerk auth — Email, Google, Microsoft
- ✅ Multi-tenant isolation
- ✅ 10 roles across 3 departments with configurable permissions
- ✅ Project site management (pre-registered for Foreman)
- ✅ Check-in: GPS + selfie + device type logging
- ✅ Check-out: job summary + duration
- ✅ Planned vs unplanned visits (Plan → Check-in → Check-out)
- ✅ Monthly planning calendar, auto-sync to Google/Microsoft Calendar
- ✅ Email notification (Resend) to supervisor + manager on check-in
- ✅ LINE group notification on check-in
- ✅ CRM: Kanban board with drag-and-drop, customizable stages per tenant
- ✅ Deal validation (past dates, next contact > close date)
- ✅ Deal red highlight alerts on Kanban
- ✅ Customer master (Personal/Company, Tax ID, multiple contact persons)
- ✅ Customer 360 view (deals, contacts, visits, pipeline value)
- ✅ Customer autocomplete search
- ✅ Deals tied to customers (required) and visits (optional)
- ✅ Sales Executive sees own customers only (owner field)
- ✅ Deal activities + attachments
- ✅ Flexible attachment storage: R2 / SharePoint / OneDrive / Google Drive
- ✅ Changelog for Users, Customers, Contact Persons, Deals
- ✅ Calendar view (Year/Month/Day) with filters
- ✅ Role-based dashboard visibility
- ✅ Permissions matrix — configurable per role per tenant
