# INZIRA Platform — Comprehensive Technical Specification & Architectural Document

**Platform Name:** INZIRA Insights / DataBridge Mobile  
**Target Market:** Small and Medium Enterprises (SMEs) in Rwanda  
**Primary Currency:** Rwandan Franc (RWF, 1 unit = base integer, no fractional subunits)  
**Target Infrastructure:** Node.js Express Backend (Vercel / Railway) + PostgreSQL (Neon / Vercel Postgres) + Vite React PWA & Mobile APK (Capacitor)  

---

## 1. System Architecture Overview

The INZIRA Platform is a multi-tenant business management and financial intelligence system designed for Rwandan SME retail and wholesale operations. It tracks sales, inventory, expenses, credit accounts, tax compliance (EBM receipts), and financial health scores.

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                         │
│  DataBridge Mobile PWA & Capacitor Android App          │
│  (React 18 + Vite + Tailwind CSS + Lucide Icons)        │
└────────────────────────────┬────────────────────────────┘
                             │  HTTP / HTTPS REST API
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    BACKEND GATEWAY                      │
│  Node.js + Express REST API Gateway (Port 5000)         │
│  - Middleware: CORS, JWT Auth Guard, Error Handler      │
│  - Background Jobs: node-cron (Daily summaries, alerts) │
└────────────────────────────┬────────────────────────────┘
                             │  pg.Pool (PostgreSQL Client)
                             ▼
┌─────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                       │
│  PostgreSQL (Neon / Vercel Postgres)                    │
│  - 17 Relational Tables + Multi-tenant owner_id         │
│  - Transactional Pessimistic Locks (FOR UPDATE)         │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Codebase Structure & Workspace Layout

The platform consists of two main repositories inside `INZIRA APP`:

### A. Mobile & Web Frontend Client (`/databridge-mobile-apk`)
* **Framework:** React 18, Vite 5, Tailwind CSS 3, React Router DOM 6.
* **Mobile Runtime:** Capacitor 8 (`@capacitor/android`, `@capacitor/cli`).
* **State & Sync:** Custom React Contexts (`AuthContext.jsx`, `DataContext.jsx`) with local `localStorage` caching and automatic 8-second polling / cross-tab storage event synchronization.
* **HTTP Client:** Axios instance (`src/lib/api.js`) with automatic JWT access token injection and silent token refresh retry logic.

### B. API Backend Service (`/inzira-gateway/backend`)
* **Runtime:** Node.js 18+ Express app.
* **Database Driver:** `pg` (Node-Postgres `Pool`).
* **Database Init & Schemas:** `src/config/initDb.js` bootstraps 17 PostgreSQL tables and indexes on application launch using `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

---

## 3. Core Database Schemas & Data Layer Design

The system enforces relational integrity across 17 PostgreSQL tables:

```sql
-- 1. Users & Business Owners
CREATE TABLE users (
  id               SERIAL PRIMARY KEY,
  name             VARCHAR(100) NOT NULL,
  email            VARCHAR(100) UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  role             VARCHAR(30) DEFAULT 'sme_owner',
  phone            VARCHAR(20),
  sector           VARCHAR(50),
  district         VARCHAR(50),
  currency         VARCHAR(10) DEFAULT 'RWF',
  consent_status   VARCHAR(20) DEFAULT 'pending',
  created_at       TIMESTAMP DEFAULT NOW()
);

-- 2. Stock & Product Catalog
CREATE TABLE stock_items (
  id                   SERIAL PRIMARY KEY,
  name                 VARCHAR(100) NOT NULL,
  name_rw              VARCHAR(100),
  category             VARCHAR(50),
  unit                 VARCHAR(20) DEFAULT 'pcs',
  barcode              VARCHAR(100) UNIQUE,
  quantity             INTEGER DEFAULT 0,
  cost_price_rwf       BIGINT DEFAULT 0,
  sell_price_rwf       BIGINT DEFAULT 0,
  low_stock_threshold  INTEGER DEFAULT 5,
  is_active            BOOLEAN DEFAULT true,
  owner_id             INTEGER REFERENCES users(id),
  created_at           TIMESTAMP DEFAULT NOW()
);

-- 3. Sales & Financial Header (Includes Idempotency Key)
CREATE TABLE sales (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER REFERENCES users(id),
  customer_id       INTEGER REFERENCES customers(id),
  payment_method    VARCHAR(20), -- 'cash','mtn_momo','airtel','card','credit','split'
  total_amount      BIGINT NOT NULL, -- Integer RWF
  is_voided         BOOLEAN DEFAULT false,
  is_offline        BOOLEAN DEFAULT false,
  payment_reference VARCHAR(100),
  payment_status    VARCHAR(20) DEFAULT 'completed',
  idempotency_key   VARCHAR(128) UNIQUE, -- Deduplication key
  owner_id          INTEGER REFERENCES users(id),
  created_at        TIMESTAMP DEFAULT NOW()
);

-- 4. Transaction Line Items
CREATE TABLE sale_items (
  id            SERIAL PRIMARY KEY,
  sale_id       INTEGER REFERENCES sales(id) ON DELETE CASCADE,
  stock_item_id INTEGER REFERENCES stock_items(id),
  quantity      INTEGER NOT NULL,
  unit_price    BIGINT NOT NULL,
  subtotal      BIGINT NOT NULL
);

-- 5. Invoices & Accounts Receivable (Customer Debts)
CREATE TABLE invoices (
  id             SERIAL PRIMARY KEY,
  sale_id        INTEGER REFERENCES sales(id),
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  status         VARCHAR(20) DEFAULT 'paid' -- 'paid','pending','overdue'
);

CREATE TABLE accounts_receivable (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER REFERENCES customers(id),
  sale_id       INTEGER REFERENCES sales(id),
  amount        BIGINT NOT NULL,
  paid_amount   BIGINT DEFAULT 0,
  due_date      DATE,
  status        VARCHAR(20) DEFAULT 'pending'
);
```

---

## 4. Architectural Enhancements & Security Control Implementations

The system includes the following critical security, resilience, and concurrency fixes:

### 1. Fail-Fast Database Resilience (No Silent Memory Leaks)
* **Rule:** The system **never** silently falls back to an in-memory database mock if PostgreSQL fails or if `DATABASE_URL` is unconfigured.
* **Implementation:** `backend/src/config/db.js`. If PostgreSQL fails at runtime or credentials are absent, the application refuses startup or returns **HTTP 503 Service Unavailable** (`dbErr.status = 503`). Offline memory mocks are strictly locked behind `LOCAL_DEV_MODE=true`.

### 2. Transactional Sales Deduplication (Idempotency Engine)
* **Rule:** Every `POST /api/sales` request must carry an `Idempotency-Key` HTTP header.
* **Implementation:** `backend/src/routes/sales.js`. Inside a PostgreSQL `BEGIN ... COMMIT` block:
  1. Executes `SELECT * FROM sales WHERE idempotency_key = $1 FOR UPDATE`.
  2. If found, commits immediately and replays the original `{ sale, invoice, idempotent_replay: true }` payload.
  3. If not found, locks stock items (`SELECT ... FOR UPDATE`), creates sale records, and updates inventory in a single atomic operation.

### 3. Integer Currency Standard (RWF)
* **Rule:** All financial fields (`total_amount`, `cost_price_rwf`, `sell_price_rwf`, `amount`, `paid_amount`) use integer arithmetic without JavaScript floating-point representation (`Math.round()` / `parseInt(..., 10)`).
* **Reason:** RWF contains no active fractional decimal sub-units, eliminating IEEE 754 float rounding errors (`0.1 + 0.2` anomalies).

### 4. Strict Environment Secret Enforcement
* **Rule:** The server refuses to boot if `JWT_SECRET` or `JWT_REFRESH_SECRET` environment variables are omitted.
* **Implementation:** `backend/src/config/env.js` throws a fatal startup error instead of substituting insecure hardcoded default strings.

---

## 5. API Route Specification Summary

| Endpoint | Method | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Public | Register new SME user account & shop |
| `/api/auth/login` | `POST` | Public | Authenticate user & issue JWT Access/Refresh tokens |
| `/api/auth/refresh` | `POST` | Public | Issue new Access Token via Refresh Token |
| `/api/sales` | `GET` | Bearer JWT | Fetch paginated sales list with tenant filters |
| `/api/sales` | `POST` | Bearer JWT | **Create sale (Requires `Idempotency-Key` header)** |
| `/api/sales/:id/receipt-pdf` | `GET` | Bearer JWT | Stream generated PDF transaction receipt |
| `/api/sales/:id/qr` | `GET` | Public | Generate RRA EBM verification QR Code PNG image |
| `/api/stock` | `GET`/`POST` | Bearer JWT | Inventory product CRUD & low-stock alerts |
| `/api/expenses` | `GET`/`POST` | Bearer JWT | Log and query operational business expenses |
| `/api/reports` | `GET` | Bearer JWT | Generate P&L, sales trend, and financial reports |
| `/api/health` | `GET` | Public | Live database connectivity & version status check |

---

## 6. Performance & Load Testing Benchmarks (Grafana k6)

Tested using Grafana k6 under high-concurrency spike conditions (50 parallel Virtual Users hitting the sale creation & inventory deduction routes simultaneously):

* **Total Assertions Checked:** 150 / 150 passed (100% success rate)
* **Unhandled 500 Server Error Rate:** `0.00%`
* **Concurrency Handling:** Zero database deadlocks or lock contention crashes.
* **Response Latency under 50 VUs:**
  * Median Duration: `413 ms` / `544 ms`
  * 95th Percentile ($p(95)$): `816 ms` / `1.79 s`

---

## 7. Instructions for Claude / Code Reviewer

When analyzing or extending this codebase:
1. Preserve **multi-tenant scoping** by ensuring all DB queries check `owner_id = req.ownerId` using `addOwnerFilter()`.
2. Do not introduce floating point `parseFloat()` arithmetic on currency values; keep all RWF figures strictly integer-based (`Math.round()` / `parseInt()`).
3. Ensure all new financial write endpoints require an `Idempotency-Key` header and execute inside PostgreSQL transactions using `FOR UPDATE` row locks.
4. Maintain `db.js` fail-fast semantics; never silently fall back to mock objects when operating outside explicit `LOCAL_DEV_MODE=true`.
