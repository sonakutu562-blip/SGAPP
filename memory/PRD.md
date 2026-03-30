# Sundar Ghar Saathi - PRD

## Original Problem Statement
Build "Sundar Ghar Saathi" - a paid learning and tools platform for Indian homeowners with lifetime access. Includes construction guides, budget tools, checklists, AI assistant, and Razorpay payment integration.

## Architecture
- **Frontend**: React.js + Tailwind CSS + shadcn/ui (port 3000)
- **Backend**: FastAPI/Python (port 8001)
- **Database**: MongoDB
- **Auth**: JWT with bcrypt password hashing
- **Payments**: Razorpay (live keys configured)
- **AI**: Gemini 3 Flash via Emergent LLM key (emergentintegrations library)

## What's Been Implemented

### AI Assistant Module (Complete - 2026-03-30)
- [x] `POST /api/chat/send` — Sends user message to Gemini 3 Flash, returns AI response, saves to MongoDB
- [x] `GET /api/chat/history` — Returns last 10 messages for the user
- [x] `DELETE /api/chat/clear` — Clears chat history and resets AI context
- [x] `/dashboard/ai` page — Full chat UI with welcome message, 4 suggestion chips, typing indicator, user/bot message bubbles, character counter
- [x] System prompt enforces construction-only answers, Hinglish support, Indian context
- [x] Error handling: Shows friendly Hindi error message if AI fails

### Razorpay Payment Integration (Complete)
- [x] `POST /api/payments/create-order`, `POST /api/payments/verify`, `POST /api/webhook/razorpay`
- [x] `/buy` page (public) with Razorpay popup
- [x] Library "Unlock for ₹XXX" buttons with instant unlock on payment success

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
- [x] My Guide (22 chapters, progress tracking)
- [x] Checklists (3 categories, 37 items)
- [x] Budget Tracker (8 categories + custom)
- [x] Progress Tracker (10-stage timeline)
- [x] My Library (6 products, locked/unlocked)

## Key DB Collections
- **users**, **products**, **user_products**, **purchases**
- **user_progress**, **checklist_items**, **budget_settings**, **budget_expenses**
- **construction_stage**, **chat_history**

## Prioritized Backlog

### P1
- [ ] Welcome email integration (SendGrid/SMTP) for new users after payment
- [ ] PDF viewer for "View PDF" buttons in My Library
- [ ] "Download PDF" in My Guide linked to actual file

### P2
- [ ] Settings page (profile edit, password change)
- [ ] Hindi language support
- [ ] Admin panel with "Unlock All Products"

## Design System
- Primary: #1B3A6B (deep blue)
- Accent: #E8500A (orange)
- Font: Poppins
- Components: Shadcn UI
