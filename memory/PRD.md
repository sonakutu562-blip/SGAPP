# Sundar Ghar Saathi - PRD

## Original Problem Statement
Build "Sundar Ghar Saathi" - a paid learning and tools platform for Indian homeowners with lifetime access. Includes construction guides, budget tools, checklists, AI assistant, and Razorpay payment integration.

## Architecture
- **Frontend**: React.js + Tailwind CSS + shadcn/ui (port 3000)
- **Backend**: FastAPI/Python (port 8001)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt password hashing
- **Payments**: Razorpay (live keys configured)

## What's Been Implemented

### Razorpay Payment Integration (Complete)
- [x] `POST /api/payments/create-order` — Creates Razorpay order for any of the 6 products
- [x] `POST /api/payments/verify` — Verifies payment signature, saves purchase to MongoDB `purchases` collection, unlocks product in `user_products`, auto-creates user if new
- [x] `POST /api/webhook/razorpay` — Handles `payment.captured` (unlock product) and `payment.failed` (log failure) with signature verification
- [x] `/buy` page (public) — Product details, user form, security badges, money-back guarantee, Razorpay popup
- [x] Library page "Unlock for ₹XXX" buttons — Opens Razorpay popup, on success refreshes to show "Unlocked" badge (no page refresh)
- [x] Payment failure handling — Error toast with support email
- [x] Failed payments logged to `purchases` collection

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
- [x] JWT Auth (signup/login)
- [x] Dashboard with summary cards
- [x] My Guide (22 chapters, progress tracking, complete/incomplete toggle)
- [x] Checklists (3 categories, 37 items)
- [x] Budget Tracker (8 categories + custom)
- [x] Progress Tracker (10-stage timeline)
- [x] My Library (6 products, locked/unlocked)

## Important Note
- **Razorpay domain whitelist**: The preview domain must be added in Razorpay Dashboard → Settings → Website and App Details for payments to succeed. Without this, Razorpay blocks payments with "website does not match" error.

## Prioritized Backlog

### P1
- [ ] Welcome email integration (SendGrid/SMTP) for new users after payment
- [ ] PDF viewer for "View PDF" buttons in My Library
- [ ] "Download PDF" in My Guide linked to actual file

### P2
- [ ] AI Assistant (LLM chat)
- [ ] Settings page (profile, password)
- [ ] Hindi language support
- [ ] Admin panel

## Design System
- Primary: #1B3A6B (deep blue)
- Accent: #E8500A (orange)
- Font: Poppins
- Components: Shadcn UI
