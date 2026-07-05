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
- **Real-Time Notifications:** Receive live in-app alerts via WebSocket and browser push notifications (Firebase Cloud Messaging) for SLA breaches, status changes, and new comments.
- **User Profile:** Full self-service profile management — update personal info, change avatar, set notification preferences (email/push toggles), and manage account security.

### Admin Features
- **Operations Dashboard:** Live KPI overview with total reports, open reports, SLA breaches, resolved-this-month, and average resolution time. Includes a live clock and SLA breach banner.
- **Report Queue:** Advanced filtering (status, severity, ward, type, date range), full-text search, bulk status/priority actions, and paginated data table.
- **Ticket Management:** Full CRUD for work-order tickets — create, reassign between crew, update status, view SLA countdown, and add internal notes.
- **User Management:** List, search, change roles, and deactivate/reactivate crew accounts with automatic ticket unassignment.
- **Crew Dispatch:** Visual crew cards with workload indicators and real-time ticket counts.
- **Analytics Dashboard:** Trend area chart (submitted vs resolved), donut chart (by status), horizontal bar chart (by severity), sortable ward performance table with resolution-rate progress bars, Leaflet hotspot map, and crew performance table with SLA compliance.
- **SLA Engine:** Priority-based deadline rules (P1 4h, P2 12h, P3 48h, P4 7d), breach detection, real-time countdown formatting, and SLA status classification (on_track / at_risk / breached).
- **Background Jobs:** Automated `slaWatcher` (runs every 15 minutes via Vercel Cron), `statsAggregator` for Redis-cached KPIs, and CRON_SECRET-secured cron endpoints.

### Super Admin Features
- **Platform Overview:** Platform-wide health indicators (DB, Redis, Storage), user breakdown by role, active session count, and total resolved count.
- **Full User Management:** View all users across all roles, edit roles, activate/deactivate, and permanently delete accounts with cascading cleanup.
- **System Health Dashboard:** Real-time server metrics (Node version, Next.js, Mongoose, heap memory, uptime), infrastructure connection status, and manual job trigger panel.
- **Broadcast Announcements:** Send platform-wide or role-targeted announcements via WebSocket + Firebase push, with info/warning/critical priorities and history log.

### Crew Features
- **Mobile Dashboard:** Stats overview (active tickets, monthly completions, SLA compliance %, overdue count) with priority queue sorted by SLA urgency.
- **Ticket Manager:** Tabbed list (All / Active / Completed / Overdue) with SLA countdown badges and card-based layout optimised for touch.
- **Ticket Execution Page:** Full mobile-first detail view with Google Maps integration, status workflow buttons (Dispatched → En Route → Active → Completed/Blocked), citizen photo gallery, and internal notes timeline.
- **Repair Photo Upload:** Drag-and-drop (or camera capture) upload widget with Cloudinary integration and photo grid. Required before completing a ticket.
- **Workflow Status Machine:** Enforced valid status transitions (assigned → dispatched → en_route → active → completed/blocked) with confirmation modals and reason-required for blockages.

### System Features
- **Role-Based Access Control:** Secure JWT-based authentication for Citizens, Crews, Admins, and Super Admins.
- **Real-Time Engine:** Socket.io custom server with authenticated WebSocket connections. Room strategy: `user:{id}`, `role:admin`, `role:crew`, `report:{id}`. Typed event emitters integrated across all APIs.
- **Push Notifications:** Firebase Cloud Messaging (FCM) for browser and mobile push. Service worker (`/firebase-messaging-sw.js`) handles background messages. Graceful degradation: socket → push → email.
- **Professional Email Templates:** 7 React Email transactional templates — Welcome, VerifyEmail, PasswordReset, ReportStatus, TicketAssigned, SlaBreach, NewComment.
- **Notification Dispatcher:** Central `src/lib/notifications.ts` orchestrates all notification channels from a single `sendNotification()` call.
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
| **Caching & Rate Limiting** | Redis (Upstash / ioredis) |
| **Authentication** | Custom JWT (jose) + bcrypt, dual-token with Redis sessions |
| **Real-Time** | Socket.io (custom Next.js server), typed room-based event emitters |
| **Push Notifications** | Firebase Cloud Messaging (Admin SDK + Client SDK + Service Worker) |
| **Email** | Nodemailer + React Email components with HTML rendering |
| **Image Processing** | Cloudinary (upload, transform, delete), Sharp (server-side compression) |
| **Background Jobs** | Vercel Cron (slaWatcher every 15 min, statsAggregator every hour) |
| **Charts** | Recharts (area, bar, donut), Leaflet (maps, heatmap) |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or Atlas)
- Redis instance (local or Upstash)
- Cloudinary Account (for image uploads and optimization)
- Firebase Project (for Cloud Messaging / Push Notifications)

### Firebase Push Notifications Setup
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Cloud Messaging** in project settings.
3. Generate a new private key from **Service Accounts**, download the JSON file, and base64-encode it:
   ```bash
   cat serviceAccount.json | base64
   ```
   Set this as `FIREBASE_ADMIN_JSON`.
4. Register a Web App in **General Settings**, copy the Config object, stringify it, and set it as `NEXT_PUBLIC_FIREBASE_CONFIG`.
5. Under **Cloud Messaging → Web configuration**, generate a VAPID key pair and set as `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.
6. Add the service worker to your `public/` folder — it's already included at `public/firebase-messaging-sw.js`.

### Socket.io Architecture Note
CivicFix uses a **custom Node.js server** (`server.ts`) to attach Socket.io alongside Next.js. Key design decisions:
- JWT access token is validated on every WebSocket connection (middleware)
- Clients join rooms: `user:{id}`, `role:{role}`, `report:{reportId}` (on entering a report page)
- All typed events are dispatched via `src/lib/socket/emitters.ts`
- The socket server instance is retrieved anywhere via `getIO()` from `src/lib/socket/server.ts`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/muhammadhurairnasir/CivicFix.git
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
| `FIREBASE_ADMIN_JSON` | Base64-encoded Firebase service account JSON | `eyJhbGci...` |
| `NEXT_PUBLIC_FIREBASE_CONFIG` | JSON-stringified Firebase web app config | `{"apiKey":"..."}` |
| `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | VAPID key from Firebase Cloud Messaging web push | `BIB...` |
| `RESEND_API_KEY` | Resend API key (or SMTP via `SMTP_*` vars) | `re_...` |

> **Vercel Cron Setup:** CivicFix uses `vercel.json` to schedule background jobs. The `slaWatcher` runs every 15 minutes (`*/15 * * * *`) and `statsAggregator` runs every hour. Both endpoints are protected by the `Authorization: Bearer <CRON_SECRET>` header. Set `CRON_SECRET` in your Vercel project environment variables and mirror it in `.env.local` for local testing.

## Project Structure

```text
CivicFix/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Authentication pages (login, register, forgot-password)
│   │   ├── (dashboard)/      # Protected dashboard pages (citizen, admin, crew, super-admin, profile)
│   │   ├── (public)/         # Public pages (landing, track, community feed)
│   │   └── api/              # API route handlers
│   │       ├── auth/         # JWT auth, refresh, logout, sessions
│   │       ├── reports/      # Report CRUD, upvote, comments, heatmap, nearby
│   │       ├── admin/        # Admin report queue, tickets, users
│   │       ├── crew/         # Crew ticket management
│   │       ├── analytics/    # Summary, trends, ward stats, hotspots, crew perf
│   │       ├── notifications/# Notification feed, mark read
│   │       ├── users/        # Profile update, avatar, password, preferences
│   │       ├── super-admin/  # Platform stats, users, reports, system, announcements
│   │       └── cron/         # Cron job trigger endpoints
│   ├── components/
│   │   ├── ui/               # Button, Input, Skeleton, Switch, Tabs, DataTable, etc.
│   │   ├── layout/           # DashboardShell, DashboardSidebar, Topbar
│   │   └── profile/          # AvatarUpload
│   ├── context/              # AuthContext
│   ├── emails/               # React Email templates (7 transactional templates)
│   ├── hooks/                # useReports, useSocket, usePushNotifications
│   ├── lib/
│   │   ├── db.ts             # Mongoose connection
│   │   ├── redis.ts          # ioredis singleton + typed helpers
│   │   ├── jwt.ts            # jose-based JWT sign/verify
│   │   ├── auth.ts           # requireAuth / requireRole helpers
│   │   ├── cloudinary.ts     # Upload helpers (report, repair, avatar)
│   │   ├── email.ts          # Nodemailer + React Email renderer
│   │   ├── notifications.ts  # Central notification dispatcher
│   │   ├── sla.ts            # SLA calculation and classification
│   │   ├── firebase/         # Admin SDK + client SDK helpers
│   │   ├── socket/           # server.ts (io), events.ts, emitters.ts
│   │   └── jobs/             # slaWatcher, statsAggregator
│   ├── models/               # User, Report, Ticket, Upvote, Comment, Notification
│   └── types/                # Global TypeScript interfaces and enums
├── public/
│   └── firebase-messaging-sw.js  # FCM background service worker
├── server.ts                 # Custom Node.js server (Next.js + Socket.io)
└── package.json
```

## API Documentation

### Auth
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register a new user account |
| POST | `/api/auth/login` | Public | Authenticate user and return JWT |
| POST | `/api/auth/refresh` | Public | Refresh JWT access token |
| POST | `/api/auth/logout` | Public | Clear auth cookies and invalidate token |
| POST | `/api/auth/forgot-password` | Public | Request a password reset link |
| DELETE | `/api/auth/sessions/all` | Private | Sign out of all devices (delete Redis token) |

### Reports (Citizen / Public)
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/reports` | Public | Fetch all community reports (paginated/filtered) |
| POST | `/api/reports` | Citizen | Submit a new report |
| GET | `/api/reports/my` | Citizen | Reports submitted by the active user |
| GET | `/api/reports/my/stats` | Citizen | Active user metrics (total, pending, avg fix) |
| GET | `/api/reports/[id]` | Private | Full detail of a specific report |
| PUT | `/api/reports/[id]` | Owner/Admin | Edit an open report |
| DELETE | `/api/reports/[id]` | Owner/Admin | Soft delete a report |
| POST | `/api/reports/[id]/upvote` | Private | Toggle upvote + real-time emit |
| GET | `/api/reports/[id]/comments` | Private | Paginated comment stream |
| POST | `/api/reports/[id]/comments` | Private | Add a comment + real-time emit |
| GET | `/api/reports/nearby` | Public | Geospatial reports near coords |
| GET | `/api/reports/heatmap` | Public | Unclustered coords for heatmap |
| GET | `/api/reports/clusters` | Public | Pre-clustered data for maps |

### Admin
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/admin/reports` | Admin | Report queue with advanced filters |
| PATCH | `/api/admin/reports/[id]/status` | Admin | Update report status |
| POST | `/api/admin/reports/[id]/verify` | Admin | Verify/reject a report |
| GET | `/api/admin/tickets` | Admin | Paginated ticket list with SLA metadata |
| POST | `/api/admin/tickets` | Admin | Create a work-order ticket |
| GET | `/api/admin/tickets/[id]` | Admin | Full ticket detail |
| PATCH | `/api/admin/tickets/[id]` | Admin | Update ticket |
| PATCH | `/api/admin/tickets/[id]/reassign` | Admin | Reassign to crew |
| GET | `/api/admin/tickets/sla-breaches` | Admin | Breached + at-risk tickets |
| GET | `/api/admin/users` | Admin | Paginated user list |
| PATCH | `/api/admin/users/[id]` | Admin | Update user role/status |

### Super Admin
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/super-admin/stats` | Super Admin | Platform-wide stats + system health |
| GET | `/api/super-admin/users` | Super Admin | All users across all roles |
| PATCH | `/api/super-admin/users/[id]` | Super Admin | Update any user's role/status |
| DELETE | `/api/super-admin/users/[id]` | Super Admin | Permanently delete user + cascade |
| GET | `/api/super-admin/reports` | Super Admin | All reports including soft-deleted |
| DELETE | `/api/super-admin/reports` | Super Admin | Hard delete report + Cloudinary cleanup |
| GET | `/api/super-admin/system` | Super Admin | Node/Next.js/Mongoose metrics, Redis/DB status |
| POST | `/api/super-admin/system` | Super Admin | Trigger background job manually |
| GET | `/api/super-admin/announcements` | Super Admin | Announcement history |
| POST | `/api/super-admin/announcements` | Super Admin | Broadcast via socket + FCM |

### User Profile
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/users/me` | Private | Full profile + stats (reports, resolved, upvotes) |
| PUT | `/api/users/me` | Private | Update name, phone, ward |
| POST | `/api/users/me/avatar` | Private | Upload avatar (sharp → Cloudinary) |
| POST | `/api/users/me/change-password` | Private | Verify + change password + invalidate sessions |
| GET | `/api/users/me/notification-preferences` | Private | Get email/push notification prefs |
| PUT | `/api/users/me/notification-preferences` | Private | Update notification prefs |
| POST | `/api/users/me/deactivate` | Private | Password-confirmed account deactivation |
| GET | `/api/users/[id]/public` | Public | Public profile (no sensitive data) |
| POST | `/api/users/me/fcm-token` | Private | Save FCM device token |

### Analytics & Crew
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/analytics/summary` | Admin | Deep platform health metrics |
| GET | `/api/analytics/trends` | Admin | Time-series submission rates |
| GET | `/api/analytics/by-ward` | Admin | Reports by civic ward |
| GET | `/api/analytics/hotspots` | Admin | High-frequency issue areas |
| GET | `/api/analytics/crew-performance` | Admin | Per-crew SLA compliance |
| GET | `/api/notifications` | Private | User notification feed |
| PATCH | `/api/notifications/[id]/read` | Private | Mark notification as read |
| PATCH | `/api/notifications/read-all` | Private | Mark all as read |
| GET | `/api/crew/tickets` | Crew | Tickets assigned to crew member |
| GET | `/api/crew/tickets/[id]` | Crew | Full assigned ticket detail |
| PATCH | `/api/crew/tickets/[id]` | Crew | Update status / add note |
| POST | `/api/crew/tickets/[id]/repair-photos` | Crew | Upload repair photo |
| GET | `/api/public/stats` | Public | Aggregate platform metrics |
| GET | `/api/public/reports/[id]` | Public | Track report without login |
| GET | `/api/cron/sla-check` | Cron | Trigger SLA breach detection |
| GET | `/api/cron/stats` | Cron | Trigger stats aggregation |

## Deployment

CivicFix is designed to be easily deployed on modern cloud infrastructure:
1. **Frontend & Serverless APIs:** Deploy directly to **Vercel** for optimal Next.js performance.
2. **Database:** Host MongoDB on **MongoDB Atlas** for managed scaling.
3. **Caching:** Use **Upstash Redis** for low-latency rate limiting and token storage.
4. **Custom Server:** Because CivicFix uses a custom Node.js server for Socket.io, use Vercel's **Node.js runtime** or deploy to a VPS (Railway, Render, Fly.io) that supports persistent connections.

## Week Progress

| Week | Status | Focus Area | Deliverables |
| :---: | :---: | --- | --- |
| **Week 1** | ✅ | Foundation & Auth | Project Scaffold, Mongoose Models, JWT/Redis Auth API, Login/Register UI, Landing Page, Track Page |
| **Week 2** | ✅ | Report Submission | Leaflet Maps, Cloudinary Photo Uploads, Dashboard Shell, Feed UIs, Full CRUD APIs, Analytics, Notifications |
| **Week 3** | ✅ | Admin Operations & SLA | Admin APIs (reports, tickets, users), SLA Engine, Background Jobs, Admin Dashboard, Admin Report Queue, Admin Ticket Manager, Admin Crew Dispatch, Crew Dashboard, Crew Ticket Manager, Analytics Dashboard, Reusable Charts |
| **Week 4** | ✅ | Real-time & Notifications | Socket.io Real-time Engine, Firebase Cloud Messaging, 7 React Email Templates, Super Admin Panel (4 pages), User Profile System (4-tab page + avatar + prefs), Public Profile Page, Switch/Tabs/AvatarUpload components |
| **Week 5** | 🔜 | PWA & Performance | PWA implementation, offline report queue, service worker, Lighthouse optimization, mobile-first refinements, install prompt |
| **Week 6-8** | 🔜 | Quality & Testing | E2E Testing (Playwright), Performance Tuning, Accessibility audit |
| **Week 9-12** | 🔜 | Polish & Launch | Final UX audit, Production hardening, Handoff |

## License

This project is licensed under the MIT License.
