# ScanPay - Payment Reconciliation Frontend

A sleek, modern dashboard for managing financial reconciliation with real-time feedback and intelligent matching explanations.

## 🏗 Architecture & Design Choices

### 1. Next.js App Router
Utilizes the latest Next.js features for optimal performance:
- **Server-Side Rendering (SSR)**: For initial page loads and SEO.
- **Client-Side Navigation**: For a fluid, application-like experience.
- **Aesthetic Black Theme**: Custom CSS and Tailwind configuration for a premium, high-contrast look that reduces eye strain for financial analysts.

### 2. State Management (Redux Toolkit)
- **Slices**: State is organized into domains (`batches`, `transactions`, `invoices`).
- **Async Thunks**: Centralized API call management with standardized error handling and loading states.
- **Optimistic Updates**: Used where appropriate to make the UI feel instantaneous.

### 3. API Communication Layer
- **Smart Base URL**: A custom environment handler that automatically ensures the `/api/v1` prefix is present, reducing configuration errors in production.
- **Robustness**: Global error handling for network failures and typed API responses using TypeScript interfaces.

### 4. Advanced UI Components
- **Custom Pagination**: Implemented offset-based pagination for the transactions table to allow analysts to jump to specific pages, with a fallback to cursor-based "load more" functionality.
- **Match Explanation Card**: A complex component that breaks down *why* a match was made, showing similarity scores and penalties (e.g., name similarity, date proximity).
- **Simplified Progress**: A clean, polling-based loader for reconciliation batches that eliminates visual clutter while keeping the user informed.

## 🛠 Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS + Framer Motion (micro-animations)
- **Icons**: Lucide React

---

## 🚀 How to Run Locally

### 1. Prerequisites
- Node.js v20 or higher
- Backend running at `http://localhost:8080`

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

# Construction build
npm run build
npm run start
```

## 📸 Test Results
> [!NOTE]
> Placeholder for test result screenshots (UI Flow, Mobile Responsiveness, or Lighthouse scores).
> ![Frontend Tests Placeholder](https://via.placeholder.com/800x400?text=Insert+Frontend+Test+Results+Here)

---
