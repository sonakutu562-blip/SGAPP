# Sundar Ghar Saathi - PRD

## Original Problem Statement
Build "Sundar Ghar Saathi" - a paid learning and tools platform for Indian homeowners. Includes construction guides, budget tools, checklists, AI assistant, Razorpay payments, admin panel, and user settings.

## Architecture
- **Frontend**: React.js + Tailwind CSS + shadcn/ui (port 3000)
- **Backend**: FastAPI/Python (port 8001)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt, role-based (user/admin)
- **Payments**: Razorpay (live keys)
- **AI**: Gemini 3 Flash via Emergent LLM key

## What's Been Implemented (All Complete)

### Settings Page (2026-04-05)
- [x] Profile: Avatar initials, editable name/phone, non-editable email
- [x] Change Password: Current/new/confirm with strength indicator, backend verification
- [x] Language: English/Hindi toggle (saved to DB, full translation pending)
- [x] Notifications: 3 toggles (email, construction reminders, new content alerts)
- [x] My Purchases: List of successful payments with product name, date, amount
- [x] Danger Zone: Account deletion with "DELETE MY ACCOUNT" confirmation, removes all user data

### Admin Panel
- [x] Dashboard stats, Customers table + Grant Access, Payments table, Content Manager (chapter editor + PDF URLs)

### AI Assistant
- [x] Gemini 3 Flash chat, Hinglish support, 4 suggestion chips, history persistence

### Razorpay Payments
- [x] Order creation, verification, webhook, Buy page, Library unlock

### Core Modules
- [x] Auth, Dashboard, My Guide (22 chapters), Checklists, Budget Tracker, Progress Tracker, My Library

## Key DB Collections
users, products, user_products, purchases, user_progress, checklist_items, budget_settings, budget_expenses, construction_stage, chat_history, chapter_content, product_settings, user_preferences

## Admin Credentials
- Email: sonakutu562@gmail.com / Password: admin123

## Prioritized Backlog

### P1
- [ ] Welcome email (SendGrid/SMTP) for new users after payment
- [ ] PDF viewer for My Library products
- [ ] Full Hindi translation

### P2
- [ ] Landing page at `/` for marketing/SEO
- [ ] Download PDF in My Guide

## Design System
- Primary: #1B3A6B, Accent: #E8500A, Admin: #0F172A, Font: Poppins
