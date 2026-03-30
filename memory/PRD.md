# Sundar Ghar Saathi - PRD

## Original Problem Statement
Build "Sundar Ghar Saathi" - a paid learning and tools platform for Indian homeowners with lifetime access. Includes construction guides, budget tools, checklists, AI assistant, and Razorpay payment integration.

## Architecture
- **Frontend**: React.js + Tailwind CSS + shadcn/ui (port 3000)
- **Backend**: FastAPI/Python (port 8001)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt password hashing
- **Payments**: Razorpay (live keys configured)

## User Personas
- **Primary**: Indian homeowners building or renovating homes (mobile-first users)
- **Secondary**: First-time home builders needing guidance

## Core Requirements
- Authentication (signup/login/forgot password)
- Dashboard with sidebar navigation (8 sections)
- Mobile-responsive with bottom navigation
- Budget tracker, checklists, progress tracking
- Razorpay payment gateway for product purchases
- AI assistant (future)

## What's Been Implemented

### Backend
- [x] MongoDB collections: users, products, user_progress, checklist_items, budget_entries, construction_stage, purchases, user_products
- [x] 6 products seeded with correct prices
- [x] Auth endpoints: POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me
- [x] Dashboard summary: GET /api/dashboard/summary
- [x] Guide endpoints: GET /api/guide/chapters, GET /api/guide/chapters/{num}, POST /api/guide/chapters/{num}/complete, POST /api/guide/chapters/{num}/uncomplete
- [x] Checklist endpoints: GET /api/checklists, POST /api/checklists/toggle
- [x] Budget endpoints: GET /api/budget, POST /api/budget/total, POST /api/budget/category, POST /api/budget/expense, POST /api/budget/custom-category
- [x] Progress endpoints: GET /api/progress, POST /api/progress/set-stage
- [x] Library endpoint: GET /api/library
- [x] **Payment endpoints**: POST /api/payments/create-order, POST /api/payments/verify, POST /api/webhook/razorpay

### Frontend
- [x] Login, Signup, Forgot Password pages
- [x] Dashboard layout with sidebar + bottom nav
- [x] My Guide (22 chapters with progress tracking, mark complete/incomplete, next/previous chapter)
- [x] Checklists (3 categories, 37 items)
- [x] Budget Tracker (8 categories + custom, expense history)
- [x] Progress Tracker (10-stage timeline)
- [x] My Library (6 products, locked/unlocked status, Razorpay unlock flow)
- [x] **Buy Page** (/buy - public): Product details, form fields, Razorpay popup, security badges, money-back guarantee
- [x] **Razorpay Integration**: Checkout.js loaded dynamically, popup opens for both Buy page and Library page

### Product Prices (Updated)
- main_guide: ₹499
- cost_calculator: ₹249
- vaastu_guide: ₹297
- maintenance_guide: ₹199
- luxury_decor_guide: ₹399
- tiles_guide: ₹499

## Prioritized Backlog

### P0 - Completed
- [x] All core modules (Guide, Checklists, Budget, Progress, Library)
- [x] Razorpay payment integration

### P1
- [ ] PDF viewer for "View PDF" buttons in My Library
- [ ] "Download PDF" button in My Guide linked to actual file
- [ ] Welcome email integration (SendGrid/SMTP) for new users after payment

### P2
- [ ] AI Assistant - LLM-powered construction advice chat
- [ ] Settings page - Profile edit, password change
- [ ] Hindi language support
- [ ] Admin panel with "Unlock All Products" feature
- [ ] Push notifications for checklist reminders

## Key DB Schema
- **users**: {id, name, email, password_hash, phone, is_active, created_at}
- **products**: {product_key, product_name, price, type}
- **user_products**: {user_id, product_keys: [String], updated_at}
- **purchases**: {id, user_id, order_id, razorpay_payment_id, amount, product_key, payment_status, created_at}
- **user_progress**: {user_id, chapter_id, is_completed, updated_at}
- **checklist_items**: {user_id, checklist_type, item_key, is_checked, updated_at}
- **budget_settings**: {user_id, total_budget, category_budgets, updated_at}
- **budget_expenses**: {id, user_id, category, amount, note, date, created_at}
- **construction_stage**: {user_id, current_stage, updated_at}

## Design System
- Primary: #1B3A6B (deep blue)
- Accent: #E8500A (orange)
- Font: Poppins
- Components: Shadcn UI
