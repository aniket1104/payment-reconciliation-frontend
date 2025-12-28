# Payment Reconciliation Engine — Frontend

## Overview

This frontend implements an **admin-only reconciliation dashboard** used to review, validate, and finalize matches between **bank transactions** and **invoices**.

The UI is designed to support **high-risk financial workflows**, where clarity, safety, and explainability are more important than visual flair.

Key goals of the frontend:

- **Human-in-the-loop control** for financial decisions
- **Explainable matching results**, not black boxes
- **High performance** with large datasets
- **Explicit, safe actions** (no accidental confirmations)
- **Desktop-first UX** suitable for internal admin tools

This implementation strictly follows the **Round 2 BRD**.

---

## Design Philosophy

### 1. Desktop-Only by Design

This application is an **internal admin dashboard**, not a consumer-facing app.

- Dense tables
- Complex workflows
- Multi-column layouts
- Financial review actions

These do **not** translate well to mobile or tablet screens.

#### Decision
- The UI supports **desktop screens only**
- Mobile and tablet users see a clear message:
  
> “This is a desktop application. Please use a laptop or desktop device.”

This avoids half-broken responsive layouts and reflects real-world internal tooling.

---

### 2. Safety Over Speed

In reconciliation systems:
- A wrong confirmation is worse than a slow review
- Every action must be intentional

Therefore:
- All destructive or irreversible actions require confirmation
- No auto-confirmation happens on the frontend
- Backend remains the source of truth

---

### 3. Explainability Over Cleverness

Admins must understand:
- **Why** a match was suggested
- **What signals influenced confidence**
- **Why something needs review**

The UI focuses on:
- Clear labels
- Confidence breakdowns
- Readable explanations
- Predictable behavior

---

## Technology Stack & Rationale

### Next.js (App Router) + TypeScript
- Type safety across API boundaries
- Clear file-based routing
- Strong developer ergonomics

---

### Tailwind CSS
- Utility-first styling
- Predictable layouts
- Easy control over wide desktop screens

---

### shadcn/ui
- Accessible, composable UI primitives
- Clean, professional look
- No heavy abstraction or runtime cost

---

### No Global State Library
- Local React state is sufficient
- Avoids premature complexity
- Keeps data flow explicit and easy to reason about

---

## Core User Flows

### 1. Upload & Reconciliation Progress

**Route:** `/reconciliation/new`

Flow:
1. Admin uploads `bank_transactions.csv`
2. Backend returns `batchId` immediately
3. UI polls reconciliation progress
4. Progress is shown in real time
5. Admin is automatically redirected when complete

Key UX decisions:
- UI never blocks during processing
- Progress is explicit and visible
- Errors are handled gracefully

---

### 2. Reconciliation Dashboard

**Route:** `/reconciliation/{batchId}`

This is the main admin workspace.

Includes:
- Summary cards (counts by status)
- Status-based tabs
- Cursor-paginated transaction table
- Inline transaction actions

Statuses shown:
- AUTO_MATCHED
- NEEDS_REVIEW
- UNMATCHED
- CONFIRMED
- EXTERNAL

The dashboard is **readable at a glance**, even with thousands of records.

---

### 3. Transaction Actions (Human-in-the-Loop)

Supported actions:
- Confirm suggested match
- Reject suggested match
- Manually match to invoice
- Mark as external

UX safeguards:
- Confirmation dialogs for all actions
- Disabled states during API calls
- Immediate UI feedback after success
- Errors never silently ignored

No action is automatic or hidden.

---

### 4. Transaction Detail & Explainability

**Route:** `/transactions/{transactionId}`

Purpose:
- Explain *why* the system made a suggestion
- Provide transparency and trust

Includes:
- Transaction details
- Matched invoice details (if any)
- Confidence score visualization
- Breakdown of matching signals

This page is **read-only** and focused on clarity.

---

### 5. Bulk Actions & Power Features

To improve admin efficiency:
- Bulk confirm AUTO_MATCHED transactions
- Export UNMATCHED transactions (CSV)
- Optimized loading, empty, and error states

Bulk actions are:
- Explicit
- Confirmed
- Never auto-triggered

---

## Data Fetching Strategy

- Typed API client (`lib/api.ts`)
- Cursor-based pagination
- Incremental loading (“Load more”)
- No OFFSET pagination
- No fetching everything at once

This ensures:
- Fast initial loads
- Smooth interaction with large datasets
- Predictable performance

---

## State Management

- Local component state only
- No Redux / Zustand / Context API
- Backend is always the source of truth

State is intentionally kept:
- Shallow
- Explicit
- Easy to debug

---

## Error Handling & UX Resilience

Handled consistently across the app:
- Loading skeletons
- Empty states with guidance
- Inline, dismissible error banners
- Retry options for recoverable errors

The UI never freezes or crashes on API errors.

---

## Accessibility & Clarity

- Clear labels and status badges
- Color used as a signal, not the only indicator
- Descriptive confirmation messages
- No hidden or implicit actions

This is critical for financial review workflows.

---

## What This Frontend Optimizes For

- Safety
- Explainability
- Performance
- Admin efficiency
- Maintainability

Not optimized for:
- Mobile usage
- Animations or visual flair
- Consumer-style UX patterns

---

## Future Improvements (Out of Scope)

- Authentication & role-based access
- Saved filters & views
- Inline audit log visualization
- Reconciliation analytics
- Virtualized tables for extremely large datasets

---

## Final Notes

This frontend is intentionally **calm, explicit, and predictable**.

Every design choice favors:
- Human trust
- Clear decision-making
- Financial safety

The UI acts as a **decision support system**, not an automation engine.

---

## 🚀 How to Run Locally

### 1. Prerequisites
- **Node.js**: v20 or higher
- **Backend API**: Running (default `http://localhost:8080`)

### 2. Environment Setup
Create a `.env` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### 3. Installation
```bash
# Install dependencies
npm install
```

### 4. Start the Application
```bash
# Development mode
npm run dev

# Production build
npm run build
npm run start
```

## 📸 Test Results
> [!NOTE]
> Placeholder for test result screenshots (UI Dashboard, Match Explanation, Upload Flow).
> ![Frontend Tests Placeholder](https://via.placeholder.com/800x400?text=Insert+Frontend+Test+Results+Here)

---

