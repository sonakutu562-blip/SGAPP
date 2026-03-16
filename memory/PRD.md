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
- [x] Dashboard summary endpoint: GET /api/dashboard/summary (uses 22 chapters)
- [x] Products endpoint: GET /api/products
- [x] Guide endpoints: GET /api/guide/chapters, GET /api/guide/chapters/{num}, POST /api/guide/chapters/{num}/complete
- [x] JWT token auth with bcrypt password hashing

### Frontend
- [x] Login page, Signup page, Forgot password page (UI only)
- [x] Dashboard layout with sidebar + bottom nav + top navbar
- [x] 4 summary cards (Reading Progress, Checklist, Budget, Construction Stage)
- [x] **My Guide - Guide List Page**: Progress banner, 22 chapter cards with status (completed/reading/locked), floating PDF download button
- [x] **My Guide - Chapter Detail Page**: Chapter header, content, Mark as Complete button, Back to Guide
- [x] **Checklists Page**: 3 categories (Site Visit 15, Material Quality 12, Legal Documents 10 = 37 items), orange checkbox toggle with strikethrough, collapsible sections, progress tracking
- [x] **Budget Tracker Page**: Total budget input, 8 category cards with editable budgets, Add Expense dialog, expense history, Indian Rupee formatting, under/over budget color coding
- [x] Dashboard cards auto-update from checklists and budget data

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
