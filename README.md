# VendorBridge — Procurement ERP

> A full-stack decoupled procurement ERP system built with **React + Vite** (frontend) and **Express + Prisma + PostgreSQL** (backend).

---

## 🗂️ Project Structure

```
VendorBridge/
├── backend/          # Express.js API server (TypeScript + Prisma)
│   ├── prisma/       # Database schema & seed
│   ├── src/
│   │   ├── routes/   # Auth, RFQ, Quotation, Approval, PO, Invoice, etc.
│   │   ├── services/ # Email (Nodemailer), Activity logging
│   │   ├── middleware/  # JWT auth guard
│   │   └── server.ts   # Express app entry point
│   └── .env          # Environment variables (not committed)
├── frontend/         # React + Vite + Tailwind CSS
│   ├── src/
│   │   ├── pages/    # Login, Dashboard, RFQs, Quotations, Approvals, etc.
│   │   ├── components/  # AppShell, Sidebar, shared UI
│   │   └── context/  # AuthContext (JWT + apiFetch)
│   └── vercel.json   # Vercel SPA routing config
└── render.yaml       # Render deployment config for backend
```

---

## ✨ Features

| Module | Description |
|---|---|
| **Auth** | JWT login, vendor self-registration with **email OTP verification**, RBAC (Admin / Procurement Officer / Manager / Vendor) |
| **RFQs** | 3-step wizard to create Requests for Quotation, manage lifecycle (Draft → Published → Closed) |
| **Quotations** | Vendors submit quotes; side-by-side **comparison matrix** for bid evaluation |
| **Approvals** | Multi-level manager approval chain with email notifications |
| **Purchase Orders** | Auto-generated on approval; PDF export |
| **Invoices** | Auto-generated on PO; status tracking (Pending → Paid) |
| **Vendors** | Admin approval gate for new vendors (INACTIVE → ACTIVE) |
| **Dashboard** | Role-specific KPIs, charts (Recharts), recent activity feed |
| **Activity Logs** | Full audit trail of all system actions |

---

## 🔐 Demo Credentials

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `123` |
| Procurement Officer | `officer` | `123` |
| Manager | `manager` | `123` |
| Vendor | `vendor` | `123` |

---

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express.js** (TypeScript)
- **Prisma ORM** + **PostgreSQL** (Neon serverless)
- **JWT** authentication
- **Nodemailer** (Gmail SMTP) for OTP & notification emails
- **PDFKit** for purchase order PDF generation
- **Zod** for request validation

### Frontend
- **React 19** + **TypeScript**
- **Vite 8**
- **Tailwind CSS v3**
- **React Router v7**
- **Recharts** for analytics
- **Sonner** for toast notifications
- **Lucide React** icons

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- A PostgreSQL database (or [Neon](https://neon.tech) free tier)

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push        # Apply schema to DB
npm run db:seed           # Seed demo users & data
npm run dev               # Starts on http://localhost:4000
```

Create `backend/.env`:
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
JWT_SECRET="your-jwt-secret"
CLIENT_URL="http://localhost:5173"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="VendorBridge"
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # Starts on http://localhost:5173
```

> The Vite dev server proxies `/api/*` → `http://localhost:4000` automatically.

---

## ☁️ Deployment

### Backend → [Render](https://render.com)

1. Connect this GitHub repo to Render
2. Set **Root Directory** to `backend`
3. Render auto-detects `render.yaml` for build/start commands
4. Add these environment variables in Render dashboard:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Random secret string |
| `NEXTAUTH_SECRET` | Random secret string |
| `CLIENT_URL` | Your Vercel frontend URL (e.g. `https://vendorbridge.vercel.app`) |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Gmail address |
| `SMTP_PASS` | Gmail App Password |
| `SMTP_FROM` | `VendorBridge` |

### Frontend → [Vercel](https://vercel.com)

1. Connect this GitHub repo to Vercel
2. Set **Root Directory** to `frontend`
3. Add this environment variable:

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL (e.g. `https://vendorbridge-backend.onrender.com`) |

4. Build command: `npm run build` | Output directory: `dist`

---

## 📧 OTP Email Verification

New vendor registrations require email OTP verification:
1. Fill in registration form → click **"Send Verification OTP"**
2. 6-digit code is emailed (valid 10 minutes)
3. Enter code in the OTP screen → click **"Verify & Register"**
4. Account is created with **INACTIVE** status — an Admin must approve it before login is allowed

---

## 📄 License

MIT
