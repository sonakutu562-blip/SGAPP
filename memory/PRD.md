# Sundar Ghar Saathi - PRD

## Original Problem Statement
Build "Sundar Ghar Saathi" - a paid learning and tools platform for Indian homeowners with lifetime access. Includes construction guides, budget tools, checklists, and AI assistant.

## Architecture
- **Frontend**: React.js + Tailwind CSS + shadcn/ui (port 3000)
- **Backend**: FastAPI/Python (port 8001)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt password hashing

## User Personas
- **Primary**: Indian homeowners building or renovating homes (mobile-first users)
- **Secondary**: First-time home builders needing guidance

## Core Requirements
- Authentication (signup/login/forgot password)
- Dashboard with sidebar navigation (8 sections)
- Mobile-responsive with bottom navigation
- Budget tracker, checklists, progress tracking
- AI assistant (future)
- Payment integration (future - Razorpay)

## What's Been Implemented (March 16, 2026)
### Backend
- [x] MongoDB collections: users, products, user_progress, checklist_items, budget_entries, construction_stage, chat_history
- [x] 6 products seeded (guides + calculator)
- [x] Auth endpoints: POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me
- [x] Dashboard summary endpoint: GET /api/dashboard/summary
- [x] Products endpoint: GET /api/products
- [x] JWT token auth with bcrypt password hashing
- [x] Email unique index, user ID index

### Frontend
- [x] Login page (email + password, split layout with branding)
- [x] Signup page (name, email, phone, password)
- [x] Forgot password page (UI only)
- [x] Dashboard layout with sidebar (desktop) + bottom nav (mobile)
- [x] Top navbar with user dropdown (settings, logout)
- [x] 4 summary cards (Reading Progress, Checklist, Budget, Construction Stage)
- [x] Welcome message "Namaste, [User Name]!"
- [x] Protected routes (redirect to login)
- [x] Brand colors: #1B3A6B primary, #E8500A accent
- [x] Poppins font, mobile-first design

## Prioritized Backlog

### P0 (Next Session)
- [ ] My Guide page - Display construction guide chapters
- [ ] Checklists page - Interactive construction checklists
- [ ] Budget Tracker page - Category-wise budget entry & tracking

### P1
- [ ] Progress Tracker page - Construction stage visualization
- [ ] My Library page - Display purchased products
- [ ] Razorpay payment integration
- [ ] Forgot password API (email-based reset)

### P2
- [ ] AI Assistant - LLM-powered construction advice chat
- [ ] Settings page - Profile edit, password change
- [ ] Hindi language support
- [ ] Push notifications for checklist reminders

## Next Tasks
1. Build My Guide page with chapter reading & progress tracking
2. Build interactive Checklists (pre-construction, during, post-construction)
3. Build Budget Tracker with category inputs and visual charts
4. Integrate Razorpay for product purchases
