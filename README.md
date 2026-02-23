# 🗑️ UIT Smart Waste Management System

> **UIT Waste Watch** — A full-stack campus waste management platform for the University of Information Technology (Hlaing Campus), built with **Next.js 16**, **PHP/MySQL**, and **TailwindCSS**.

The system enables **students and teachers** to report overflowing bins and submit complaints, while **waste collectors** manage bin queues, respond to complaints, and view real-time analytics — all through a role-based dashboard.

---

## 📑 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [File-by-File Reference](#-file-by-file-reference)
  - [Root Configuration](#root-configuration)
  - [PHP Backend API (`api/`)](#php-backend-api-api)
  - [Frontend Entry (`src/app/`)](#frontend-entry-srcapp)
  - [Dashboard Pages (`src/app/dashboard/`)](#dashboard-pages-srcappdashboard)
  - [Server Actions (`src/app/actions/`)](#server-actions-srcappactions)
  - [Shared Libraries (`src/lib/`)](#shared-libraries-srclib)
  - [Components (`src/components/`)](#components-srccomponents)
  - [Hooks (`src/hooks/`)](#hooks-srchooks)
  - [AI Module (`src/ai/`)](#ai-module-srcai)
  - [Type Definitions (`types/`)](#type-definitions-types)
- [Database Schema](#-database-schema)
- [Data Flow & File Interactions](#-data-flow--file-interactions)
- [Environment Configuration](#-environment-configuration)
- [Getting Started](#-getting-started)

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                        │
│                                                             │
│  Landing Page ─► Role Selector ─► Auth Form ─► Dashboard    │
│            (student / teacher / collector)                   │
└─────────────┬──────────────────────┬────────────────────────┘
              │                      │
     Server Actions              PHP REST API
     (Next.js SSR)              (XAMPP / Cloud)
              │                      │
              └──────────┬───────────┘
                         │
                  ┌──────▼──────┐
                  │   MySQL DB   │
                  │ (via mysql2  │
                  │  & PDO/      │
                  │   mysqli)    │
                  └─────────────┘
```

The system uses a **dual-backend** approach:

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16 + React 19 + TailwindCSS | UI rendering, client routing, SSR |
| **Server Actions** | TypeScript (`src/app/actions/`) | Direct DB access for auth, reports, complaints, collector ops |
| **PHP REST API** | PHP 8+ (`api/`) | Analytics, chat, geospatial, media uploads, session mgmt |
| **Database** | MySQL (XAMPP / Clever Cloud) | Persistent storage for all entities |

Server Actions connect to MySQL via the `mysql2` Node.js driver. PHP endpoints connect via `mysqli` and `PDO`.

---

## 🧰 Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, TailwindCSS 3, Radix UI primitives |
| Charts | Recharts 3 |
| Forms | React Hook Form + Zod validation |
| Auth | bcryptjs (password hashing) |
| Database | MySQL via `mysql2/promise` (Node) and `PDO`/`mysqli` (PHP) |
| Backend API | PHP 8+ (XAMPP for local, Clever Cloud for prod) |
| Icons | Lucide React |
| Fonts | Inter + Space Grotesk (Google Fonts) |
| AI | Genkit + Google Gemini 2.5 Flash (scaffolded) |

---

## 📁 Project Structure

```
uit_smart_waste_management/
├── api/                          # PHP REST API endpoints (served by XAMPP/Apache)
│   ├── db_config.php             # Database connection (dual: mysqli + PDO)
│   ├── session_check.php         # Session middleware & role enforcement
│   ├── login.php                 # User login endpoint
│   ├── register.php              # User registration endpoint
│   ├── logout.php                # Session destruction
│   ├── change_password.php       # Password change endpoint
│   ├── analytics_provider.php    # Dashboard charts & metrics data
│   ├── chat_handler.php          # Real-time complaint chat system
│   ├── complaint_handler.php     # Collector complaint responses
│   ├── report_handler.php        # Collector-only: view all reports
│   ├── media_handler.php         # Secure file upload with validation
│   ├── fetch_map_bins.php        # Bin locations for map view
│   ├── fetch_uit_locations.php   # Room suggestion engine (X-Notation)
│   ├── geospatial_api.php        # Haversine nearest-bin finder
│   └── migrate.php               # DB migration: creates tables & seeds bins
│
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root HTML layout (dark theme, Google Fonts)
│   │   ├── page.tsx              # Landing page with AuthContainer
│   │   ├── globals.css           # Global CSS variables & base styles
│   │   ├── actions/              # Next.js Server Actions (direct DB access)
│   │   │   ├── auth.ts           # registerUser(), loginUser()
│   │   │   ├── report.ts         # submitReport() with image upload
│   │   │   ├── complaint.ts      # submitComplaintMessage()
│   │   │   ├── collector.ts      # Bin queue, mark empty, collection count
│   │   │   ├── getStats.ts       # Total & today's report counts
│   │   │   ├── getComplaints.ts  # CRUD complaints + unreplied count
│   │   │   └── userActivities.ts # Per-user report & complaint history
│   │   │
│   │   └── dashboard/
│   │       ├── layout.tsx        # Dashboard shell: sidebar + header + bottom nav
│   │       ├── page.tsx          # Home: metrics, weekly chart, building chart, history
│   │       ├── report/page.tsx   # "Report a Bin" form (students/teachers)
│   │       ├── complaint/page.tsx# Submit complaint with chat-style messages
│   │       ├── map/page.tsx      # Campus map with bin locations
│   │       ├── analytics/page.tsx# Collector analytics charts
│   │       ├── alerts/page.tsx   # Collector complaints inbox
│   │       ├── collector/page.tsx# Collector bin management queue
│   │       └── settings/page.tsx # User profile & password change
│   │
│   ├── components/
│   │   ├── auth/                 # Authentication UI components
│   │   │   ├── auth-container.tsx# Role selection → Auth form orchestrator
│   │   │   ├── auth-form.tsx     # Login/signup form with validation
│   │   │   └── role-selector.tsx # Student/Teacher/Collector role cards
│   │   ├── layout/               # Navigation components
│   │   │   ├── sidebar-nav.tsx   # Desktop sidebar with role-based menu items
│   │   │   └── bottom-nav.tsx    # Mobile bottom navigation bar
│   │   ├── settings/
│   │   │   └── profile-settings.tsx # Profile view + password change form
│   │   └── ui/                   # 35 Radix-based UI primitives (shadcn/ui)
│   │
│   ├── lib/
│   │   ├── config.ts             # API_URL (env-aware: localhost vs cloud)
│   │   ├── db.ts                 # MySQL2 connection pool for Server Actions
│   │   ├── utils.ts              # cn() — TailwindCSS class merger
│   │   ├── room-utils.ts         # X-Notation room code resolver
│   │   ├── placeholder-images.ts # Placeholder image URLs
│   │   └── placeholder-images.json
│   │
│   ├── hooks/
│   │   ├── use-mobile.tsx        # Responsive breakpoint detection
│   │   └── use-toast.ts          # Toast notification hook
│   │
│   └── ai/
│       ├── genkit.ts             # Genkit AI initialization (Gemini 2.5 Flash)
│       └── dev.ts                # AI development server entry
│
├── types/
│   ├── global.d.ts               # Global TypeScript declarations
│   ├── routes.d.ts               # Auto-generated route type definitions
│   └── validator.ts              # Auto-generated page/layout type validation
│
├── .env.development              # Local API URL (http://127.0.0.1/...)
├── .env.production               # Cloud API URL (Clever Cloud)
├── .env.local                    # DB credentials (gitignored)
├── next.config.ts                # Next.js config (images, TypeScript)
├── tailwind.config.ts            # TailwindCSS theme customization
├── package.json                  # Dependencies & scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 📖 File-by-File Reference

### Root Configuration

| File | Purpose |
|------|---------|
| `package.json` | Defines project dependencies (Next.js 16, React 19, Recharts, mysql2, bcryptjs, Zod, etc.) and scripts (`dev`, `build`, `start`) |
| `next.config.ts` | Next.js settings: disables dev indicators, ignores build TS errors, allows remote images from `placehold.co`, `unsplash`, and `picsum` |
| `tailwind.config.ts` | Extended Tailwind theme with custom colors, fonts (Inter, Space Grotesk), and animation utilities |
| `tsconfig.json` | TypeScript config with `@/` path alias mapping to `./src/` |
| `postcss.config.mjs` | PostCSS plugins for TailwindCSS processing |
| `.env.development` | Sets `NEXT_PUBLIC_API_URL` to `http://127.0.0.1/uit_smart_waste_management/api` |
| `.env.production` | Sets `NEXT_PUBLIC_API_URL` to the Clever Cloud deployment URL |
| `.env.local` | Contains `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` for the Node.js mysql2 connection |

---

### PHP Backend API (`api/`)

#### `db_config.php` — Database Connection Hub
- **Creates both** `$conn` (mysqli) and `$pdo` (PDO) connections
- **Environment detection**: checks for Clever Cloud env vars (`MYSQL_ADDON_HOST`, etc.); falls back to local XAMPP credentials
- **Included by**: every other PHP file via `require_once`

#### `session_check.php` — Authentication Middleware
- Starts PHP sessions and sets CORS headers
- Exports `requireRole(array $roles)` — verifies the user is logged in and has an allowed role
- **Used by**: `report_handler.php`, `fetch_uit_locations.php`, `geospatial_api.php`, `media_handler.php`
- **Can be called directly**: returns session status as JSON

#### `login.php` — User Login
- **Method**: POST
- Reads JSON body (`email`, `password`, `role`), finds user by email, verifies password with `password_verify()`, enforces role match
- Creates PHP session on success
- **Interacts with**: `users` table, `db_config.php`

#### `register.php` — User Registration
- **Method**: POST
- Validates email format, password strength (8+ chars, uppercase, number, special char), and role (`student` | `teacher` | `collector`)
- Checks for duplicate emails, then hashes password with `password_hash(PASSWORD_BCRYPT)` and inserts into `users`
- **Interacts with**: `users` table, `db_config.php`

#### `logout.php` — Session Destruction
- **Method**: POST
- Clears session data, destroys the session cookie, and calls `session_destroy()`

#### `change_password.php` — Password Update
- **Method**: POST
- Accepts `user_id`, `current_password`, `new_password`
- Verifies the current password, validates new password strength, then hashes and updates in DB
- **Interacts with**: `users` table, `db_config.php`

#### `analytics_provider.php` — Dashboard Data Aggregator
- **Method**: GET with `?action=...`
- **5 public endpoints** (no auth required):
  - `dashboard_overview` — Key metrics (cleanliness score, active bins, reports), weekly activity chart (Mon–Sun reports vs collections), and reports-by-building chart
  - `reports_by_building` — Report counts grouped by building for bar charts
  - `cleaning_completion_rate` — Bin status distribution for pie/doughnut charts
  - `reports_over_time` — Daily report counts over 30 days for line charts
  - `bin_status_summary` — Current status of all bins
- **Interacts with**: `reports`, `collections`, `bins` tables
- **Consumed by**: `dashboard/page.tsx`, `dashboard/analytics/page.tsx`

#### `chat_handler.php` — Real-Time Chat System
- **Method**: POST with `?action=...`
- **4 actions**:
  - `initiate_chat` — Student/teacher creates a chat session linked to a bin
  - `send_message` — Any participant sends a message
  - `get_history` — Fetches full message history with sender names
  - `get_sessions` — Lists all chat sessions for the current user
- **Interacts with**: `chat_sessions`, `messages`, `users`, `bins` tables

#### `complaint_handler.php` — Collector Complaint Response
- **Method**: POST with `?action=respond`
- Updates `admin_response` and `status` in the `complaint` table
- Also inserts the response into the `messages` table for chat history
- Uses relaxed auth (trusts frontend routing if no PHP session exists)
- **Interacts with**: `complaint`, `messages`, `chat_sessions`, `users` tables
- **Called by**: `dashboard/alerts/page.tsx` (collector's complaints inbox)

#### `report_handler.php` — Collector-Only Report Viewer
- **Method**: GET with `?action=get_all_reports`
- Returns ALL submitted reports (unlike Server Actions which show only per-user reports)
- **Requires**: collector role via `requireRole(['collector'])`
- **Interacts with**: `reports` table

#### `media_handler.php` — Secure File Upload
- Can be **included** by other scripts or used as a **standalone POST endpoint**
- Security checks: MIME type verification, extension validation, file size limit (5MB), image verification, SHA-256 filename hashing
- Supports only `.jpg` and `.png` files
- Saves files to `uploads/{category}/` with hashed filenames

#### `fetch_map_bins.php` — Map Bin Data
- **Method**: GET
- Queries `bins` table joined with `reports` to determine if each bin is "Full" or "Functional"
- Returns bin locations with lat/lng coordinates for map rendering
- **Consumed by**: `dashboard/map/page.tsx`

#### `fetch_uit_locations.php` — Room Suggestion Engine
- **Method**: GET with `?building_id=X&level=Y`
- Implements UIT's **X-Notation** room code system:
  - **Basement**: Canteen & Parking areas
  - **Level 1**: Building-specific landmarks (Main Hall, Student Affairs, Library, Computer Lab)
  - **Level 2**: Theatre corridor exception (Buildings 1 & 2), standard rooms for 3 & 4
  - **Levels 3–6**: Standard `X[Level]2` (front) / `X[Level]5` (behind) format
- Also fetches matching bins from the database
- **Interacts with**: `bins` table

#### `geospatial_api.php` — Nearest Bin Finder
- **Method**: GET with `?lat=X&lng=Y`
- Implements the **Haversine Formula** to calculate distances to all 4 UIT buildings + canteen
- Returns sorted distances and identifies the nearest bin
- **Interacts with**: `bins` table

#### `migrate.php` — Database Migration
- **Run once** to create tables: `bins`, `chat_sessions`, `messages`
- Seeds **48 bin locations** across 4 buildings with GPS coordinates
- Bin locations include basement, ground floor, and levels 2–6 for each building

---

### Frontend Entry (`src/app/`)

#### `layout.tsx` — Root Layout
- Sets HTML lang, dark theme class, and Google Fonts (Inter + Space Grotesk)
- Applies global metadata (title: "UIT Waste Watch")

#### `page.tsx` — Landing Page
- Renders the UIT Waste Watch logo and tagline
- Displays `<AuthContainer />` for role selection and login/signup
- Teal radial gradient background with neon-glow effects

#### `globals.css` — Global Styles
- CSS custom properties for the design system (colors, spacing, etc.)
- Dark theme variables and base component styles

---

### Dashboard Pages (`src/app/dashboard/`)

#### `layout.tsx` — Dashboard Shell
- **Guards** unauthenticated users (redirects to `/` if no `user_role` in localStorage)
- Reads `user_role` and `user_email` from localStorage
- Renders: `<SidebarNav>` (desktop) + `<BottomNav>` (mobile) + sticky header with user avatar

#### `page.tsx` — Dashboard Home
- Fetches data from `analytics_provider.php?action=dashboard_overview`
- Displays **4 metric cards**: Campus Cleanliness, Active Bins, Total Reports, Today's Reports
- **Weekly Activity chart** (bar chart: Reports vs Collections, Mon–Sun)
- **Reports by Building** (bar chart with teal-colored bars)
- **Your Activity** section: fetches user-specific reports and complaints via Server Actions
- **Interacts with**: `analytics_provider.php`, `userActivities.ts`

#### `report/page.tsx` — Report a Bin
- Multi-step form: select Building → Level → Side → optional image upload
- Uses `submitReport()` Server Action to save to database
- Available to **students** and **teachers**

#### `complaint/page.tsx` — Submit Complaint
- Chat-style complaint interface with message input and optional image
- Uses `submitComplaintMessage()` Server Action
- Shows previous complaints and admin responses

#### `map/page.tsx` — Campus Map
- Displays bin locations on an interactive map
- Color-coded markers: green (Functional), red (Full)
- Fetches data from `fetch_map_bins.php`

#### `analytics/page.tsx` — Collector Analytics
- Data visualization page for waste collectors
- Charts: reports by building, cleaning rates, reports over time, bin status
- Fetches from `analytics_provider.php` endpoints

#### `alerts/page.tsx` — Complaints Inbox (Collector)
- Lists all complaints with status indicators
- Collectors can type responses and update complaint status
- Calls both Server Actions (`getLiveComplaints`, `respondToComplaint`) and PHP (`complaint_handler.php?action=respond`)

#### `collector/page.tsx` — Bin Management Queue (Collector)
- Shows all bins with pending reports
- "Mark as Empty" button clears reports and logs collection
- Uses Server Actions: `getLiveBins()`, `markBinEmpty()`, `getCollectionCount()`, `getLiveReportCount()`

#### `settings/page.tsx` — User Settings
- Renders `<ProfileSettings />` component
- Shows profile info (name, email) and password change form

---

### Server Actions (`src/app/actions/`)

These are **Next.js Server Actions** — they run on the server and connect directly to MySQL via the `mysql2` Node.js driver. They are the primary backend for core features.

| File | Functions | Database Tables |
|------|-----------|----------------|
| `auth.ts` | `registerUser()` — hashes password with bcryptjs, inserts user<br>`loginUser()` — verifies credentials, enforces role match | `users` |
| `report.ts` | `submitReport()` — saves report with optional image upload to `public/uploads/` | `reports` |
| `complaint.ts` | `submitComplaintMessage()` — inserts/appends complaints using `ON DUPLICATE KEY UPDATE` for one-row-per-user-per-day logic | `complaint` |
| `collector.ts` | `getLiveReportCount()` — counts pending reports<br>`getLiveBins()` — grouped bin queue<br>`markBinEmpty()` — updates status to 'Cleared' & logs to `collections`<br>`getCollectionCount()` — today's collection count | `reports`, `collections` |
| `getStats.ts` | `getTotalReportCount()` — total + today's report counts | `reports` |
| `getComplaints.ts` | `getLiveComplaints()` — all complaints ordered by date<br>`deleteComplaint()` — removes by email + date<br>`getUnrepliedComplaintsCount()` — for notification badge<br>`respondToComplaint()` — updates admin response | `complaint` |
| `userActivities.ts` | `getUserReports()` — user's report history<br>`getUserComplaints()` — user's complaint history + admin responses | `reports`, `complaint` |

---

### Shared Libraries (`src/lib/`)

| File | Purpose |
|------|---------|
| `config.ts` | Exports `API_URL` — resolves from `NEXT_PUBLIC_API_URL` env var, defaults to `http://localhost/uit_smart_waste_management/api` |
| `db.ts` | Creates a MySQL2 connection pool using env vars (`DB_HOST`, `DB_USER`, etc.) — used by all Server Actions |
| `utils.ts` | Exports `cn()` — merges TailwindCSS classes using `clsx` + `tailwind-merge` |
| `room-utils.ts` | Exports `getRoomOrLandmark()` — client-side X-Notation resolver. Maps building/level/side to room codes or landmark names (Theatre Entry Corridor, Library, etc.) |
| `placeholder-images.ts` | Exports placeholder image URLs for development |

---

### Components (`src/components/`)

#### Auth Components (`auth/`)

| Component | Role |
|-----------|------|
| `auth-container.tsx` | Orchestrates the login flow: role selection → auth form → redirect to dashboard. Exports `UserRole` type. Saves `user_role` and `user_email` to localStorage on success |
| `auth-form.tsx` | Renders login/signup forms with validation using React Hook Form + Zod. Handles both Server Action auth (`auth.ts`) and PHP API auth (`login.php`, `register.php`) |
| `role-selector.tsx` | Three cards: Student (🎓), Teacher (👨‍🏫), Collector (🚛) — each with icon and description |

#### Layout Components (`layout/`)

| Component | Role |
|-----------|------|
| `sidebar-nav.tsx` | Desktop sidebar navigation. Shows different menu items based on user role. Includes red notification dot for unreplied complaints (collectors only). Uses `getUnrepliedComplaintsCount()` |
| `bottom-nav.tsx` | Mobile bottom navigation bar with role-appropriate icons and links |

#### Settings Components (`settings/`)

| Component | Role |
|-----------|------|
| `profile-settings.tsx` | Displays user profile info and password change form. Calls `change_password.php` API |

#### UI Primitives (`ui/`)

35 reusable components based on **shadcn/ui** + **Radix UI** primitives:

`accordion`, `alert-dialog`, `alert`, `avatar`, `badge`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `dialog`, `dropdown-menu`, `form`, `input`, `label`, `menubar`, `popover`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `tooltip`

---

### Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `use-mobile.tsx` | Detects mobile viewport (`< 768px`) for responsive layout switching |
| `use-toast.ts` | Toast notification state management — provides `toast()` function for success/error messages |

---

### AI Module (`src/ai/`)

| File | Purpose |
|------|---------|
| `genkit.ts` | Initializes Google Genkit AI with Gemini 2.5 Flash model via `@genkit-ai/google-genai` plugin |
| `dev.ts` | Development entry point for the AI module |

> **Note**: The AI module is scaffolded but not yet actively integrated into the main application flow.

---

### Type Definitions (`types/`)

| File | Purpose |
|------|---------|
| `global.d.ts` | Global TypeScript declarations for the project |
| `routes.d.ts` | Auto-generated by Next.js — defines all valid route paths and their param maps |
| `validator.ts` | Auto-generated by Next.js — validates that all page/layout files export correct types |

---

## 🗄 Database Schema

The system uses **6 core tables**:

```sql
-- Users & Authentication
users (id, name, email, password, role, identifier, created_at)

-- Waste Reports
reports (id, building, level, side, image_url, user_email, status, report_date, created_at)

-- Complaints
complaint (id, user_email, message, image_url, admin_response, status, report_date)

-- Collection History
collections (id, building, level, side, cleaned_at)

-- Bins (Physical Locations)
bins (id, building_id, level, side, room_code, status, lat, lng, updated_at)

-- Chat System
chat_sessions (id, reporter_id, collector_id, bin_id, status, created_at)
messages (id, session_id, sender_id, message, attachment_url, created_at)
```

---

## 🔄 Data Flow & File Interactions

### 1. Authentication Flow
```
page.tsx → AuthContainer → RoleSelector → AuthForm
    ├── Server Action: auth.ts (registerUser / loginUser)
    └── PHP API: login.php / register.php
            └── db_config.php → MySQL (users table)

On success → localStorage (user_role, user_email) → redirect to /dashboard
```

### 2. Report Submission Flow
```
dashboard/report/page.tsx
    → Server Action: report.ts (submitReport)
        → MySQL (INSERT INTO reports)
        → File system (public/uploads/)
```

### 3. Complaint & Chat Flow
```
Student:
    dashboard/complaint/page.tsx
        → Server Action: complaint.ts (submitComplaintMessage)
            → MySQL (INSERT/UPDATE complaint)

Collector:
    dashboard/alerts/page.tsx
        → Server Action: getComplaints.ts (getLiveComplaints)
        → PHP API: complaint_handler.php?action=respond
            → MySQL (UPDATE complaint, INSERT messages)
```

### 4. Collector Operations Flow
```
dashboard/collector/page.tsx
    → Server Action: collector.ts
        → getLiveBins() ──────── MySQL (SELECT grouped reports)
        → markBinEmpty() ─────── MySQL (UPDATE reports → INSERT collections)
        → getCollectionCount() ─ MySQL (SELECT COUNT from collections)
        → getLiveReportCount() ─ MySQL (SELECT COUNT from reports)
```

### 5. Analytics Flow
```
dashboard/page.tsx & dashboard/analytics/page.tsx
    → fetch(API_URL + '/analytics_provider.php?action=...')
        → analytics_provider.php
            → db_config.php → MySQL (reports, collections, bins)
                → JSON response → Recharts rendering
```

### 6. Map & Geospatial Flow
```
dashboard/map/page.tsx
    → fetch(API_URL + '/fetch_map_bins.php')
        → MySQL (bins LEFT JOIN reports)
            → JSON → Map markers

    → fetch(API_URL + '/geospatial_api.php?lat=X&lng=Y')
        → Haversine distance calculation
            → Nearest bin identification
```

---

## ⚙ Environment Configuration

The application supports two environments:

### Local Development (XAMPP)

1. **PHP API**: served by XAMPP Apache at `http://localhost/uit_smart_waste_management/api/`
2. **Next.js**: runs at `http://localhost:3000`
3. MySQL credentials configured in `.env.local`:
   ```env
   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASSWORD=password
   DB_NAME=db
   DB_PORT=3306
   ```

### Cloud Production (Clever Cloud)

- PHP API deployed on Clever Cloud
- MySQL credentials auto-injected via `MYSQL_ADDON_*` env vars
- `db_config.php` auto-detects the environment

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **XAMPP** with MySQL and Apache running
- **PHP** ≥ 8.0

### Installation

```bash
# 1. Clone the repository
git clone <repo-url>
cd uit_smart_waste_management

# 2. Install Node.js dependencies
npm install

# 3. Copy the api/ folder to XAMPP htdocs
# The api/ folder should be accessible at:
# http://localhost/uit_smart_waste_management/api/

# 4. Create the database
# Open phpMyAdmin and create a database (e.g., "db")

# 5. Run the migration script
# Visit: http://localhost/uit_smart_waste_management/api/migrate.php
# This creates the bins, chat_sessions, and messages tables

# 6. Configure environment variables
# Create .env.local with your DB credentials

# 7. Start the development server
npm run dev
```

### Default Accounts

After registration, users can log in with the role they registered with:
- **Student**: Can report bins and submit complaints
- **Teacher**: Same permissions as student
- **Collector**: Can manage bins, respond to complaints, and view analytics

---

## 📄 License

This project was built for the **University of Information Technology (UIT), Hlaing Campus** as part of an academic project.
