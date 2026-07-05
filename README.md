# CivicFix
**The modern civic reporting network. Connect directly with your local government to resolve infrastructure issues efficiently.**

## What Problem It Solves

Traditional municipal reporting systems are often fragmented, opaque, and frustrating for citizens to use. Reports disappear into a bureaucratic black box, leaving residents wondering if their voice was heard. Meanwhile, city operations teams struggle with duplicate reports, inaccurate locations, and inefficient routing of repair crews.

CivicFix modernizes this relationship. For citizens, it provides a seamless, transparent platform to report, track, and interact with civic issues. For municipal governments, it serves as a powerful operational dashboard that intelligently routes tickets, tracks SLAs (Service Level Agreements), and provides verifiable data to measure and improve community responsiveness.

## Features

### Citizen Features
- **Effortless Reporting:** Submit issues via a multi-step form with reverse geocoding (Nominatim), GPS coordinate pickers, and Cloudinary-powered photo uploads.
- **Interactive Map:** Browse nearby community reports on an interactive Leaflet map featuring dynamic severity clustering and heatmap visualizations.
- **Real-Time Tracking:** Track the resolution status of a report via a public timeline and a detailed citizen dashboard.
- **Community Upvoting & Comments:** Upvote existing issues to increase their priority, and discuss reports via a paginated comment section.
- **Personal Dashboard:** A dedicated space (`/dashboard`) summarizing your submitted reports, pending actions, and overall community pulse.
- **Transparent Notifications:** Receive automated alerts for SLA breaches, status changes, and new comments.

### Admin Features
- **Operations Dashboard:** Live KPI overview with total reports, open reports, SLA breaches, resolved-this-month, and average resolution time. Includes a live clock and SLA breach banner.
- **Report Queue:** Advanced filtering (status, severity, ward, type, date range), full-text search, bulk status/priority actions, and paginated data table.
- **Ticket Management:** Full CRUD for work-order tickets — create, reassign between crew, update status, view SLA countdown, and add internal notes.
- **User Management:** List, search, change roles, and deactivate/reactivate crew accounts with automatic ticket unassignment.
- **Crew Dispatch:** Visual crew cards with workload indicators and real-time ticket counts.
- **Analytics Dashboard:** Trend area chart (submitted vs resolved), donut chart (by status), horizontal bar chart (by severity), sortable ward performance table with resolution-rate progress bars, Leaflet hotspot map, and crew performance table with SLA compliance.
- **SLA Engine:** Priority-based deadline rules (P1 4h, P2 12h, P3 48h, P4 7d), breach detection, real-time countdown formatting, and SLA status classification (on_track / at_risk / breached).
- **Background Jobs:** Automated `slaWatcher` (runs every 15 minutes via Vercel Cron), `statsAggregator` for Redis-cached KPIs, and CRON_SECRET-secured cron endpoints.

### Crew Features
- **Mobile Dashboard:** Stats overview (active tickets, monthly completions, SLA compliance %, overdue count) with priority queue sorted by SLA urgency.
- **Ticket Manager:** Tabbed list (All / Active / Completed / Overdue) with SLA countdown badges and card-based layout optimised for touch.
- **Ticket Execution Page:** Full mobile-first detail view with Google Maps integration, status workflow buttons (Dispatched → En Route → Active → Completed/Blocked), citizen photo gallery, and internal notes timeline.
- **Repair Photo Upload:** Drag-and-drop (or camera capture) upload widget with Cloudinary integration and photo grid. Required before completing a ticket.
- **Workflow Status Machine:** Enforced valid status transitions (assigned → dispatched → en_route → active → completed/blocked) with confirmation modals and reason-required for blockages.

### System Features
- **Role-Based Access Control:** Secure JWT-based authentication for Citizens, Crews, and Admins.
- **Rate Limiting & Security:** Redis-backed brute force protection and request rate limiting.
- **Data Integrity:** Strict Zod validation and comprehensive Mongoose schema enforcement.

## Tech Stack

| Category | Technologies |
| --- | --- |
| **Frontend Framework** | Next.js 14 (App Router), React |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS, Framer Motion, class-variance-authority |
| **Icons** | Lucide React |
| **Forms & Validation** | React Hook Form, Zod |
| **Database** | MongoDB (Mongoose) |
| **Caching & Rate Limiting** | Redis (Upstash) |
| **Authentication** | Custom JWT Implementation + bcrypt |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- Redis instance (local or Upstash)
- Cloudinary Account (for image uploads and optimization)
- Firebase Project (for Cloud Messaging / Push Notifications)

### Firebase Push Notifications Setup
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable Cloud Messaging in project settings.
3. Generate a new private key from **Service Accounts**, download the JSON file, and base64 encode it (`cat serviceAccount.json | base64`). Set this as `FIREBASE_ADMIN_JSON`.
4. Register a Web App in General Settings, copy the Config object, stringify it, and set it as `NEXT_PUBLIC_FIREBASE_CONFIG`.
5. Under **Cloud Messaging**, generate a Web Push certificate key pair (VAPID key) and set it as `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/civicfix.git
   cd CivicFix
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy `.env.example` to `.env.local` and configure your credentials.
   ```bash
   cp .env.example .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

### Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `REDIS_URL` | Redis connection URL | `rediss://...` |
| `JWT_ACCESS_SECRET` | Secret for access tokens | `your_super_secret_access_key` |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens | `your_super_secret_refresh_key` |
| `NEXT_PUBLIC_APP_URL` | Base URL for the application | `http://localhost:3000` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary instance name | `ddnidur5c` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `653293753589925` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `-U9O-vaWCzJgKt9IF...` |
| `CRON_SECRET` | Shared secret to secure Vercel Cron job endpoints | `a-long-random-secret` |

> **Vercel Cron Setup:** CivicFix uses `vercel.json` to schedule background jobs. The `slaWatcher` runs every 15 minutes (`*/15 * * * *`) and `statsAggregator` runs every hour. Both endpoints are protected by the `Authorization: Bearer <CRON_SECRET>` header. Set `CRON_SECRET` in your Vercel project environment variables and mirror it in `.env.local` for local testing.

## Project Structure

```text
e:\CivicFix
├── src
│   ├── app               # Next.js App Router pages and API routes
│   │   ├── (auth)        # Authentication pages (Login, Register, etc.)
│   │   ├── (public)      # Public landing and track pages
│   │   └── api           # API Handlers (Auth, Public endpoints)
│   ├── components        # React components (UI, Layout, Auth)
│   ├── context           # React context providers (AuthContext)
│   ├── hooks             # Custom React hooks (useAuth)
│   ├── lib               # Utilities (DB connection, Redis, JWT, Email)
│   ├── models            # Mongoose schemas (User, Report, Ticket, etc.)
│   └── types             # Global TypeScript definitions
├── public                # Static assets
└── package.json          # Dependencies and scripts
```

## API Documentation

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| **POST** | `/api/auth/register` | Public | Register a new user account |
| **POST** | `/api/auth/login` | Public | Authenticate user and return JWT |
| **POST** | `/api/auth/refresh` | Public | Refresh JWT access token |
| **POST** | `/api/auth/logout` | Public | Clear auth cookies and invalidate token |
| **POST** | `/api/auth/forgot-password` | Public | Request a password reset link |
| **GET** | `/api/public/stats` | Public | Aggregate basic platform metrics |
| **GET** | `/api/public/reports/[id]` | Public | Track a report securely without logging in |
| **GET** | `/api/reports` | Public | Fetch all community reports (paginated/filtered) |
| **POST** | `/api/reports` | Citizen | Submit a new report (with photos/geo data) |
| **GET** | `/api/reports/my` | Citizen | Fetch reports submitted by the active user |
| **GET** | `/api/reports/my/stats` | Citizen | Fetch active user metrics (total, pending, avg fix) |
| **GET** | `/api/reports/[id]` | Private | Fetch full detail of a specific report |
| **PUT** | `/api/reports/[id]` | Owner/Admin | Edit an open report |
| **DELETE**| `/api/reports/[id]` | Owner/Admin | Soft delete an open report |
| **POST** | `/api/reports/[id]/upvote` | Private | Toggle upvote state for a report |
| **GET** | `/api/reports/[id]/comments`| Private | Paginated comment stream for a report |
| **POST** | `/api/reports/[id]/comments`| Private | Add a new comment |
| **GET** | `/api/reports/nearby` | Public | Geospatial query: reports near given coords |
| **GET** | `/api/reports/heatmap` | Public | Unclustered coordinate mass for heatmaps |
| **GET** | `/api/reports/clusters` | Public | Pre-clustered geographic data for zoomed-out maps |
| **GET** | `/api/analytics/hotspots` | Admin | Identify high-frequency issue areas |
| **GET** | `/api/analytics/summary` | Admin | Deep platform health metrics |
| **GET** | `/api/analytics/trends` | Admin | Time-series data for issue submission rates |
| **GET** | `/api/analytics/by-ward` | Admin | Distribution of reports by civic ward |
| **GET** | `/api/notifications` | Private | User's paginated notification feed |
| **PATCH** | `/api/notifications/[id]/read`| Private | Mark single notification as read |
| **PATCH** | `/api/notifications/read-all` | Private | Mark all unread notifications as read |
| **GET** | `/api/admin/reports` | Admin | Paginated report queue with advanced filters |
| **PATCH** | `/api/admin/reports/[id]/status` | Admin | Update a single report's status |
| **POST** | `/api/admin/reports/[id]/verify` | Admin | Verify/reject a submitted report |
| **GET** | `/api/admin/tickets` | Admin | Paginated ticket list with SLA metadata |
| **POST** | `/api/admin/tickets` | Admin | Create a new work-order ticket |
| **GET** | `/api/admin/tickets/[id]` | Admin | Full ticket detail with notes & report |
| **PATCH** | `/api/admin/tickets/[id]` | Admin | Update ticket (status, priority, cost, notes) |
| **PATCH** | `/api/admin/tickets/[id]/reassign` | Admin | Reassign ticket to different crew member |
| **GET** | `/api/admin/tickets/sla-breaches` | Admin | All breached + at-risk tickets |
| **GET** | `/api/admin/users` | Admin | Paginated user list with role filter |
| **PATCH** | `/api/admin/users/[id]` | Admin | Update user role or active status |
| **GET** | `/api/crew/tickets` | Crew | Tickets assigned to the authenticated crew member |
| **GET** | `/api/crew/tickets/[id]` | Crew | Full detail of a single assigned ticket |
| **PATCH** | `/api/crew/tickets/[id]` | Crew | Update ticket status or add an internal note |
| **POST** | `/api/crew/tickets/[id]/repair-photos` | Crew | Upload repair evidence photo |
| **GET** | `/api/analytics/crew-performance` | Admin | Per-crew SLA compliance & completion metrics |
| **GET** | `/api/cron/sla-check` | Cron | Trigger SLA breach detection job |
| **GET** | `/api/cron/stats` | Cron | Trigger stats aggregation and cache refresh |

## Deployment

CivicFix is designed to be easily deployed on modern cloud infrastructure:
1. **Frontend & Serverless APIs:** Deploy directly to **Vercel** for optimal Next.js performance.
2. **Database:** Host MongoDB on **MongoDB Atlas** for managed scaling.
3. **Caching:** Use **Upstash Redis** for low-latency rate limiting and token storage.

## Week Progress

| Week | Status | Focus Area | Deliverables |
| :---: | :---: | --- | --- |
| **Week 1** | ✅ | Foundation & Auth | Project Scaffold, Mongoose Models, JWT/Redis Auth API, Login/Register UI, Landing Page, Track Page |
| **Week 2** | ✅ | Report Submission | Leaflet Maps, Cloudinary Photo Uploads, Dashboard Shell, Feed UIs, Full CRUD APIs, Analytics, Notifications |
| **Week 3** | ✅ | Admin Operations & SLA | Admin APIs (reports, tickets, users), SLA Engine, Background Jobs, Admin Dashboard, Admin Report Queue, Admin Ticket Manager, Admin Crew Dispatch, Crew Dashboard, Crew Ticket Manager, Analytics Dashboard, Reusable Charts |
| **Week 4** | 🔜 | Real-time & Notifications | Socket.io Real-time, Push Notifications (FCM), Email Templates, Super Admin Panel, User Profile Pages |
| **Week 5** | 🔜 | Public & Community | Public analytics portal, Ward leaderboards, Community feed |
| **Week 6-8** | 🔜 | Quality & Performance | E2E Testing (Playwright), Performance Tuning, PWA Support |
| **Week 9-12** | 🔜 | Polish & Launch | Final UX audit, Production hardening, Handoff |

## License

This project is licensed under the MIT License.
