# Sundar Ghar Saathi - PRD

## Original Problem Statement
Build "Sundar Ghar Saathi" - a paid learning and tools platform for Indian homeowners with lifetime access. Includes construction guides, budget tools, checklists, AI assistant, Razorpay payments, and admin panel.

## Architecture
- **Frontend**: React.js + Tailwind CSS + shadcn/ui (port 3000)
- **Backend**: FastAPI/Python (port 8001)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt, role-based (user/admin)
- **Payments**: Razorpay (live keys)
- **AI**: Gemini 3 Flash via Emergent LLM key

## What's Been Implemented

### Admin Panel (Complete - 2026-03-30)
- [x] Role-based auth: `role` field in user model, admin guard on all `/api/admin/*` endpoints
- [x] Admin: `sonakutu562@gmail.com` (password: admin123)
- [x] `/admin` — Dashboard with 4 stat cards (total customers, revenue, today signups, today revenue)
- [x] `/admin/customers` — Table with search (name/email), filters (All/Paid/Free/Today), Grant Access dropdown to manually unlock products
- [x] `/admin/payments` — Table with customer info, Razorpay ID, status badges, 6 filters (All/Success/Failed/Today/Week/Month), Total Revenue card
- [x] `/admin/content` — Chapter editor (22 chapters, text editor, save to DB, customers see updated content), Product PDF URL manager (6 products)
- [x] Dark sidebar layout with nav links + Logout
- [x] Non-admin users see "Access Denied"
- [x] Admin login redirects to /admin, normal users to /dashboard

### AI Assistant Module (Complete)
- [x] `/dashboard/ai` — Chat UI with Gemini 3 Flash, Hinglish support, 4 suggestion chips, typing indicator, history persistence, clear chat

### Razorpay Payment Integration (Complete)
- [x] Order creation, payment verification, webhook handling
- [x] `/buy` page (public) + Library unlock flow

### Product Prices
| Product | Price |
|---------|-------|
| main_guide | ₹499 |
| cost_calculator | ₹249 |
| vaastu_guide | ₹297 |
| maintenance_guide | ₹199 |
| luxury_decor_guide | ₹399 |
| tiles_guide | ₹499 |

### Other Modules (All Complete)
- [x] JWT Auth, Dashboard, My Guide (22 chapters), Checklists, Budget Tracker, Progress Tracker, My Library

## Key DB Collections
users, products, user_products, purchases, user_progress, checklist_items, budget_settings, budget_expenses, construction_stage, chat_history, chapter_content, product_settings

## Admin Credentials
- Email: sonakutu562@gmail.com
- Password: admin123 (reset during setup)

## Prioritized Backlog

### P1
- [ ] Welcome email integration (SendGrid/SMTP) for new users after payment
- [ ] PDF viewer for "View PDF" buttons in My Library
- [ ] "Download PDF" in My Guide linked to actual file

### P2
- [ ] Settings page (profile edit, password change)
- [ ] Hindi language support
- [ ] Landing page at `/` for marketing

## Design System
- Primary: #1B3A6B (deep blue), Accent: #E8500A (orange)
- Admin sidebar: #0F172A (dark navy)
- Font: Poppins, Components: Shadcn UI
