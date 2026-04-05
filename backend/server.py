from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext
import razorpay
import hmac
import hashlib
import secrets
import string

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 72

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Razorpay client
razorpay_client = razorpay.Client(auth=(
    os.environ['RAZORPAY_KEY_ID'],
    os.environ['RAZORPAY_KEY_SECRET']
))

# Product prices (INR)
PRODUCT_PRICES = {
    "main_guide": 499,
    "cost_calculator": 249,
    "vaastu_guide": 297,
    "maintenance_guide": 199,
    "luxury_decor_guide": 399,
    "tiles_guide": 499,
}

ADMIN_EMAIL = "sonakutu562@gmail.com"

# App and Router
app = FastAPI(title="Sundar Ghar Saathi API")
api_router = APIRouter(prefix="/api")

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ─── Pydantic Models ─────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    is_active: bool
    created_at: str
    role: str = "user"

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class ProductResponse(BaseModel):
    id: str
    product_key: str
    product_name: str
    price: int
    type: str

class DashboardSummary(BaseModel):
    reading_progress: int
    checklist_progress: int
    budget_used: int
    current_stage: str


# ─── Helper Functions ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ─── Seed Data ────────────────────────────────────────────────────────────────

SEED_PRODUCTS = [
    {"id": str(uuid.uuid4()), "product_key": "main_guide", "product_name": "Sundar Ghar Construction Guide", "price": 499, "type": "pdf"},
    {"id": str(uuid.uuid4()), "product_key": "cost_calculator", "product_name": "Construction Cost Calculator", "price": 249, "type": "software"},
    {"id": str(uuid.uuid4()), "product_key": "vaastu_guide", "product_name": "Vaastu Decor Tips Guide", "price": 297, "type": "pdf"},
    {"id": str(uuid.uuid4()), "product_key": "maintenance_guide", "product_name": "Home Maintenance & Aftercare Bible", "price": 199, "type": "pdf"},
    {"id": str(uuid.uuid4()), "product_key": "luxury_decor_guide", "product_name": "Luxury Home Decor Guide", "price": 399, "type": "pdf"},
    {"id": str(uuid.uuid4()), "product_key": "tiles_guide", "product_name": "Tiles & Wall Paint Mistakes Guide", "price": 499, "type": "pdf"},
]

# ─── Chapter Data ─────────────────────────────────────────────────────────────

CHAPTERS = [
    {"chapter_number": 1, "title": "Your Home Journey", "description": "Visualise your dream home"},
    {"chapter_number": 2, "title": "Why New Construction?", "description": "Pros of building vs buying"},
    {"chapter_number": 3, "title": "Are You Ready?", "description": "Assess budget & readiness"},
    {"chapter_number": 4, "title": "Choosing the Right Builder", "description": "Find trusted contractors"},
    {"chapter_number": 5, "title": "Budget & Cost Control", "description": "Save lakhs with smart planning"},
    {"chapter_number": 6, "title": "Site Supervision", "description": "Quality checks at every stage"},
    {"chapter_number": 7, "title": "Contractor & Labor Management", "description": "Avoid fraud & delays"},
    {"chapter_number": 8, "title": "Foundation to Roof Mastery", "description": "Build it strong"},
    {"chapter_number": 9, "title": "Legal & Paperwork Fortress", "description": "Protect yourself legally"},
    {"chapter_number": 10, "title": "Design, Aesthetics & Vastu", "description": "Beautiful & auspicious home"},
    {"chapter_number": 11, "title": "Future-Proof & Resale-Ready", "description": "Build smart for tomorrow"},
    {"chapter_number": 12, "title": "Room-Wise Mistakes", "description": "Kitchen, bedroom, bathroom tips"},
    {"chapter_number": 13, "title": "Door & Window Frame Mistakes", "description": "Avoid costly errors"},
    {"chapter_number": 14, "title": "Water Tank & Pipework Checks", "description": "Plumbing done right"},
    {"chapter_number": 15, "title": "Aftercare & Maintenance", "description": "Keep your home beautiful"},
    {"chapter_number": 16, "title": "Emotional & Psychological Wins", "description": "Stay stress-free"},
    {"chapter_number": 17, "title": "Family Vision & Harmony", "description": "Get everyone aligned"},
    {"chapter_number": 18, "title": "Safety & Disaster Preparedness", "description": "Protect your family"},
    {"chapter_number": 19, "title": "Waterproofing Hacks", "description": "Never let water damage your home"},
    {"chapter_number": 20, "title": "Time & Timeline Mastery", "description": "Finish on time"},
    {"chapter_number": 21, "title": "Advanced Checklists & Questions to Ask", "description": "Be an expert"},
    {"chapter_number": 22, "title": "Final Handover & Move-In", "description": "Your dream fulfilled"},
]

TOTAL_CHAPTERS = len(CHAPTERS)


# ─── Checklist Data ───────────────────────────────────────────────────────────

CHECKLIST_DATA = [
    {
        "type": "site_visit",
        "title": "Site Visit Checklist",
        "items": [
            {"key": "site_1", "text": "Check soil quality before foundation work"},
            {"key": "site_2", "text": "Verify land title and ownership documents"},
            {"key": "site_3", "text": "Get building plan sanctioned from municipality"},
            {"key": "site_4", "text": "Photograph the site before work begins"},
            {"key": "site_5", "text": "Check neighbouring plot boundaries clearly"},
            {"key": "site_6", "text": "Verify water and electricity connection points"},
            {"key": "site_7", "text": "Check road access for material delivery"},
            {"key": "site_8", "text": "Inspect drainage and water flow direction"},
            {"key": "site_9", "text": "Confirm no legal disputes on the land"},
            {"key": "site_10", "text": "Check sunlight direction for room planning"},
            {"key": "site_11", "text": "Verify setback rules for your plot area"},
            {"key": "site_12", "text": "Meet neighbours before construction starts"},
            {"key": "site_13", "text": "Check underground water table depth"},
            {"key": "site_14", "text": "Verify phone and internet cable locations"},
            {"key": "site_15", "text": "Note any trees that need to be removed"},
        ],
    },
    {
        "type": "material_quality",
        "title": "Material Quality Checklist",
        "items": [
            {"key": "mat_1", "text": "Verify cement brand, grade and expiry date"},
            {"key": "mat_2", "text": "Check steel rebar diameter and quality"},
            {"key": "mat_3", "text": "Test bricks by tapping — should ring clearly"},
            {"key": "mat_4", "text": "Verify sand quality — no mud or clay mixed"},
            {"key": "mat_5", "text": "Check aggregate (stone chips) size and grade"},
            {"key": "mat_6", "text": "Verify tiles are ISI marked"},
            {"key": "mat_7", "text": "Check electrical wire gauge and brand"},
            {"key": "mat_8", "text": "Verify plumbing pipe quality and brand"},
            {"key": "mat_9", "text": "Check paint brand and batch number"},
            {"key": "mat_10", "text": "Verify waterproofing material quality"},
            {"key": "mat_11", "text": "Check wood treatment for termites"},
            {"key": "mat_12", "text": "Verify window glass thickness"},
        ],
    },
    {
        "type": "legal_documents",
        "title": "Legal Documents Checklist",
        "items": [
            {"key": "legal_1", "text": "Land title deed in your name"},
            {"key": "legal_2", "text": "Encumbrance certificate obtained"},
            {"key": "legal_3", "text": "Building plan approved by authority"},
            {"key": "legal_4", "text": "Construction agreement registered"},
            {"key": "legal_5", "text": "Contractor agreement signed and stamped"},
            {"key": "legal_6", "text": "All payment receipts saved safely"},
            {"key": "legal_7", "text": "Labour contract documents ready"},
            {"key": "legal_8", "text": "Property tax receipts up to date"},
            {"key": "legal_9", "text": "NOC from neighbours if required"},
            {"key": "legal_10", "text": "Insurance for construction site taken"},
        ],
    },
]

TOTAL_CHECKLIST_ITEMS = sum(len(cat["items"]) for cat in CHECKLIST_DATA)


# ─── Budget Categories ────────────────────────────────────────────────────────

BUDGET_CATEGORIES = [
    {"key": "foundation", "name": "Foundation & Structure", "icon": "building"},
    {"key": "bricks_cement", "name": "Bricks, Cement & Sand", "icon": "bricks"},
    {"key": "steel_roofing", "name": "Steel & Roofing", "icon": "roof"},
    {"key": "labour", "name": "Labour Charges", "icon": "worker"},
    {"key": "plumbing_electrical", "name": "Plumbing & Electrical", "icon": "tools"},
    {"key": "doors_windows", "name": "Doors, Windows & Flooring", "icon": "door"},
    {"key": "interior", "name": "Interior & Finishing", "icon": "paint"},
    {"key": "miscellaneous", "name": "Miscellaneous & Buffer", "icon": "wallet"},
]


# ─── Construction Stages ──────────────────────────────────────────────────────

CONSTRUCTION_STAGES = [
    {"stage": 1, "name": "Planning & Documentation", "description": "Get all approvals & documents ready", "linked_chapter": 9},
    {"stage": 2, "name": "Site Preparation & Soil Testing", "description": "Clear the plot, test soil quality", "linked_chapter": 2},
    {"stage": 3, "name": "Foundation Work", "description": "Lay the foundation as per approved plan", "linked_chapter": 8},
    {"stage": 4, "name": "Plinth & Ground Floor Structure", "description": "Build plinth beam and ground slab", "linked_chapter": 8},
    {"stage": 5, "name": "Walls & Columns (Ground Floor)", "description": "Raise brick walls and RCC columns", "linked_chapter": 8},
    {"stage": 6, "name": "Roof Slab & First Floor", "description": "Cast the roof slab for ground floor", "linked_chapter": 8},
    {"stage": 7, "name": "Walls & Columns (First Floor)", "description": "Continue walls for first floor if any", "linked_chapter": 8},
    {"stage": 8, "name": "Plumbing & Electrical Work", "description": "Run all pipes and electrical conduits", "linked_chapter": 14},
    {"stage": 9, "name": "Plastering, Flooring & Tiling", "description": "Apply plaster, lay tiles and flooring", "linked_chapter": 12},
    {"stage": 10, "name": "Final Finishing & Handover", "description": "Paint, fixtures, cleanup and move in", "linked_chapter": 22},
]

TOTAL_STAGES = len(CONSTRUCTION_STAGES)


@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    count = await db.products.count_documents({})
    if count == 0:
        await db.products.insert_many(SEED_PRODUCTS)
        logger.info("Seeded %d products", len(SEED_PRODUCTS))
    # Ensure admin role
    await db.users.update_many(
        {"email": ADMIN_EMAIL},
        {"$set": {"role": "admin"}},
    )
    logger.info("Sundar Ghar Saathi API started successfully")


# ─── Auth Routes ──────────────────────────────────────────────────────────────

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(data: UserCreate):
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if len(data.phone) < 10:
        raise HTTPException(status_code=400, detail="Please enter a valid phone number")

    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    user_doc = {
        "id": user_id,
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "phone": data.phone,
        "is_active": True,
        "created_at": now,
        "role": "admin" if data.email == ADMIN_EMAIL else "user",
    }
    await db.users.insert_one(user_doc)

    token = create_token(user_id)
    user_resp = UserResponse(
        id=user_id, name=data.name, email=data.email,
        phone=data.phone, is_active=True, created_at=now,
        role=user_doc["role"]
    )
    return TokenResponse(token=token, user=user_resp)


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(user["id"])
    user_resp = UserResponse(
        id=user["id"], name=user["name"], email=user["email"],
        phone=user["phone"], is_active=user["is_active"], created_at=user["created_at"],
        role=user.get("role", "user")
    )
    return TokenResponse(token=token, user=user_resp)


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"], name=current_user["name"], email=current_user["email"],
        phone=current_user["phone"], is_active=current_user["is_active"],
        created_at=current_user["created_at"], role=current_user.get("role", "user")
    )


# ─── Product Routes ──────────────────────────────────────────────────────────

@api_router.get("/products", response_model=List[ProductResponse])
async def get_products():
    products = await db.products.find({}, {"_id": 0}).to_list(100)
    return products


# ─── Dashboard Routes ────────────────────────────────────────────────────────

@api_router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    # Reading progress
    total_chapters = TOTAL_CHAPTERS
    completed = await db.user_progress.count_documents({"user_id": user_id, "is_completed": True})
    reading_progress = int((completed / total_chapters) * 100) if total_chapters > 0 else 0

    # Checklist progress
    checked_items = await db.checklist_items.count_documents({"user_id": user_id, "is_checked": True})
    checklist_progress = int((checked_items / TOTAL_CHECKLIST_ITEMS) * 100)

    # Budget usage
    b_settings = await db.budget_settings.find_one({"user_id": user_id}, {"_id": 0})
    total_budgeted = b_settings.get("total_budget", 0) if b_settings else 0
    b_expenses = await db.budget_expenses.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    total_spent = sum(e.get("amount", 0) for e in b_expenses)
    budget_used = int((total_spent / total_budgeted) * 100) if total_budgeted > 0 else 0

    # Construction stage
    stage_doc = await db.construction_stage.find_one({"user_id": user_id}, {"_id": 0})
    current_stage_num = stage_doc["current_stage"] if stage_doc else 1
    stage_info = next((s for s in CONSTRUCTION_STAGES if s["stage"] == current_stage_num), CONSTRUCTION_STAGES[0])
    current_stage = f"Stage {current_stage_num}: {stage_info['name']}"

    return DashboardSummary(
        reading_progress=reading_progress,
        checklist_progress=checklist_progress,
        budget_used=budget_used,
        current_stage=current_stage
    )


# ─── Guide Routes ─────────────────────────────────────────────────────────────

@api_router.get("/guide/chapters")
async def get_guide_chapters(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    # Fetch all completed chapter_ids for this user
    progress_docs = await db.user_progress.find(
        {"user_id": user_id, "is_completed": True}, {"_id": 0, "chapter_id": 1}
    ).to_list(100)
    completed_ids = {doc["chapter_id"] for doc in progress_docs}
    completed_count = len(completed_ids)

    # Determine the "reading" chapter (first uncompleted)
    reading_chapter = None
    for ch in CHAPTERS:
        if str(ch["chapter_number"]) not in completed_ids:
            reading_chapter = ch["chapter_number"]
            break

    # Build chapter list with status
    chapters = []
    for ch in CHAPTERS:
        ch_id = str(ch["chapter_number"])
        if ch_id in completed_ids:
            status = "completed"
        elif ch["chapter_number"] == reading_chapter:
            status = "reading"
        else:
            status = "locked"
        chapters.append({**ch, "status": status})

    return {
        "total_chapters": TOTAL_CHAPTERS,
        "completed_count": completed_count,
        "chapters": chapters,
    }


@api_router.get("/guide/chapters/{chapter_number}")
async def get_chapter_detail(chapter_number: int, current_user: dict = Depends(get_current_user)):
    # Find chapter data
    chapter = next((ch for ch in CHAPTERS if ch["chapter_number"] == chapter_number), None)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    # Check user progress
    progress = await db.user_progress.find_one(
        {"user_id": current_user["id"], "chapter_id": str(chapter_number)}, {"_id": 0}
    )
    is_completed = progress["is_completed"] if progress else False

    # Check for custom content from admin
    content_doc = await db.chapter_content.find_one(
        {"chapter_number": chapter_number}, {"_id": 0}
    )
    custom_content = content_doc.get("content", "") if content_doc else ""

    if custom_content:
        content = custom_content
    else:
        content = (
            f"Welcome to Chapter {chapter_number}: {chapter['title']}.\n\n"
            f"{chapter['description']}.\n\n"
            "This chapter covers everything you need to know about this important aspect of home construction. "
            "As an Indian homeowner, understanding these concepts will help you make better decisions, save money, "
            "and ensure your dream home is built exactly the way you want it.\n\n"
            "Key Topics Covered:\n"
            "- Understanding the fundamentals and best practices\n"
            "- Common mistakes to avoid and how to prevent them\n"
            "- Expert tips from experienced builders and architects\n"
            "- Cost-saving strategies without compromising quality\n"
            "- Checklist of action items for this stage\n\n"
            "Detailed content for this chapter will be available soon. "
            "In the meantime, use the checklist and budget tools to stay on track with your home building journey."
        )

    return {
        "chapter_number": chapter["chapter_number"],
        "title": chapter["title"],
        "description": chapter["description"],
        "content": content,
        "is_completed": is_completed,
    }


@api_router.post("/guide/chapters/{chapter_number}/complete")
async def mark_chapter_complete(chapter_number: int, current_user: dict = Depends(get_current_user)):
    # Validate chapter exists
    chapter = next((ch for ch in CHAPTERS if ch["chapter_number"] == chapter_number), None)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    user_id = current_user["id"]
    now = datetime.now(timezone.utc).isoformat()

    # Upsert progress
    await db.user_progress.update_one(
        {"user_id": user_id, "chapter_id": str(chapter_number)},
        {"$set": {"is_completed": True, "updated_at": now}},
        upsert=True,
    )

    # Get updated count
    completed_count = await db.user_progress.count_documents({"user_id": user_id, "is_completed": True})

    return {
        "success": True,
        "chapter_number": chapter_number,
        "message": f"Chapter {chapter_number} marked as complete",
        "completed_count": completed_count,
        "total_chapters": TOTAL_CHAPTERS,
    }


@api_router.post("/guide/chapters/{chapter_number}/uncomplete")
async def unmark_chapter_complete(chapter_number: int, current_user: dict = Depends(get_current_user)):
    chapter = next((ch for ch in CHAPTERS if ch["chapter_number"] == chapter_number), None)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    user_id = current_user["id"]

    await db.user_progress.delete_one(
        {"user_id": user_id, "chapter_id": str(chapter_number)}
    )

    completed_count = await db.user_progress.count_documents({"user_id": user_id, "is_completed": True})

    return {
        "success": True,
        "chapter_number": chapter_number,
        "message": f"Chapter {chapter_number} marked as incomplete",
        "completed_count": completed_count,
        "total_chapters": TOTAL_CHAPTERS,
    }


# ─── Checklist Routes ─────────────────────────────────────────────────────────

@api_router.get("/checklists")
async def get_checklists(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    checked_docs = await db.checklist_items.find(
        {"user_id": user_id, "is_checked": True}, {"_id": 0}
    ).to_list(200)
    checked_keys = {doc["item_key"] for doc in checked_docs}

    categories = []
    for cat in CHECKLIST_DATA:
        cat_checked = sum(1 for item in cat["items"] if item["key"] in checked_keys)
        items = [{**item, "is_checked": item["key"] in checked_keys} for item in cat["items"]]
        categories.append({
            "type": cat["type"],
            "title": cat["title"],
            "total_items": len(cat["items"]),
            "checked_count": cat_checked,
            "items": items,
        })

    return {
        "total_items": TOTAL_CHECKLIST_ITEMS,
        "total_checked": len(checked_keys),
        "categories": categories,
    }


class ChecklistToggle(BaseModel):
    checklist_type: str
    item_key: str


@api_router.post("/checklists/toggle")
async def toggle_checklist_item(data: ChecklistToggle, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    now = datetime.now(timezone.utc).isoformat()

    existing = await db.checklist_items.find_one(
        {"user_id": user_id, "item_key": data.item_key}, {"_id": 0}
    )

    if existing and existing.get("is_checked"):
        await db.checklist_items.update_one(
            {"user_id": user_id, "item_key": data.item_key},
            {"$set": {"is_checked": False, "updated_at": now}},
        )
        is_checked = False
    else:
        await db.checklist_items.update_one(
            {"user_id": user_id, "item_key": data.item_key},
            {"$set": {"checklist_type": data.checklist_type, "is_checked": True, "updated_at": now}},
            upsert=True,
        )
        is_checked = True

    total_checked = await db.checklist_items.count_documents({"user_id": user_id, "is_checked": True})

    return {
        "item_key": data.item_key,
        "is_checked": is_checked,
        "total_checked": total_checked,
        "total_items": TOTAL_CHECKLIST_ITEMS,
    }


# ─── Budget Routes ────────────────────────────────────────────────────────────

class BudgetTotal(BaseModel):
    total_budget: float

class CategoryBudget(BaseModel):
    category: str
    budgeted_amount: float

class ExpenseCreate(BaseModel):
    category: str
    amount: float
    note: str = ""
    date: str = ""

class CustomCategoryCreate(BaseModel):
    name: str


@api_router.get("/budget")
async def get_budget(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    settings = await db.budget_settings.find_one({"user_id": user_id}, {"_id": 0})
    total_budget = settings.get("total_budget", 0) if settings else 0
    category_budgets = settings.get("category_budgets", {}) if settings else {}

    # Merge preset + custom categories
    custom_cats = await db.custom_budget_categories.find({"user_id": user_id}, {"_id": 0}).to_list(50)
    all_categories = list(BUDGET_CATEGORIES) + [
        {"key": c["key"], "name": c["name"], "icon": "wallet"} for c in custom_cats
    ]

    expenses = await db.budget_expenses.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    spent_by_cat = {}
    for exp in expenses:
        spent_by_cat[exp["category"]] = spent_by_cat.get(exp["category"], 0) + exp["amount"]
    total_spent = sum(spent_by_cat.values())

    categories = []
    for cat in all_categories:
        categories.append({
            "key": cat["key"],
            "name": cat["name"],
            "icon": cat.get("icon", "wallet"),
            "budgeted_amount": category_budgets.get(cat["key"], 0),
            "spent_amount": spent_by_cat.get(cat["key"], 0),
        })

    recent = await db.budget_expenses.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)

    return {
        "total_budget": total_budget,
        "total_spent": total_spent,
        "remaining": total_budget - total_spent,
        "categories": categories,
        "recent_expenses": recent,
    }


@api_router.post("/budget/total")
async def set_budget_total(data: BudgetTotal, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    await db.budget_settings.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"total_budget": data.total_budget, "updated_at": now}},
        upsert=True,
    )
    return {"success": True, "total_budget": data.total_budget}


@api_router.post("/budget/category")
async def set_category_budget(data: CategoryBudget, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    await db.budget_settings.update_one(
        {"user_id": current_user["id"]},
        {"$set": {f"category_budgets.{data.category}": data.budgeted_amount, "updated_at": now}},
        upsert=True,
    )
    return {"success": True, "category": data.category, "budgeted_amount": data.budgeted_amount}


@api_router.post("/budget/expense")
async def add_expense(data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    expense_date = data.date if data.date else datetime.now(timezone.utc).strftime("%Y-%m-%d")
    expense_doc = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "category": data.category,
        "amount": data.amount,
        "note": data.note,
        "date": expense_date,
        "created_at": now,
    }
    await db.budget_expenses.insert_one(expense_doc)
    return {"success": True, "expense": {k: v for k, v in expense_doc.items() if k != "_id"}}


@api_router.post("/budget/custom-category")
async def create_custom_category(data: CustomCategoryCreate, current_user: dict = Depends(get_current_user)):
    import re
    user_id = current_user["id"]
    key = re.sub(r'[^a-z0-9]+', '_', data.name.lower()).strip('_')
    if not key:
        raise HTTPException(status_code=400, detail="Invalid category name")

    # Check duplicates among preset keys
    preset_keys = {c["key"] for c in BUDGET_CATEGORIES}
    if key in preset_keys:
        raise HTTPException(status_code=400, detail="Category already exists")

    # Check duplicates among user's custom categories
    existing = await db.custom_budget_categories.find_one({"user_id": user_id, "key": key})
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    now = datetime.now(timezone.utc).isoformat()
    await db.custom_budget_categories.insert_one({
        "user_id": user_id,
        "key": key,
        "name": data.name.strip(),
        "created_at": now,
    })
    return {"success": True, "category": {"key": key, "name": data.name.strip(), "icon": "wallet"}}


# ─── Progress Tracker Routes ─────────────────────────────────────────────────

class SetStage(BaseModel):
    stage: int


@api_router.get("/progress")
async def get_progress(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    stage_doc = await db.construction_stage.find_one({"user_id": user_id}, {"_id": 0})
    current_stage_num = stage_doc["current_stage"] if stage_doc else 1

    stages = []
    for s in CONSTRUCTION_STAGES:
        if s["stage"] < current_stage_num:
            status = "completed"
        elif s["stage"] == current_stage_num:
            status = "current"
        else:
            status = "upcoming"
        stages.append({**s, "status": status})

    completion_pct = int(((current_stage_num - 1) / TOTAL_STAGES) * 100)

    return {
        "current_stage": current_stage_num,
        "total_stages": TOTAL_STAGES,
        "completion_pct": completion_pct,
        "stages": stages,
    }


@api_router.post("/progress/set-stage")
async def set_current_stage(data: SetStage, current_user: dict = Depends(get_current_user)):
    if data.stage < 1 or data.stage > TOTAL_STAGES:
        raise HTTPException(status_code=400, detail="Invalid stage number")

    user_id = current_user["id"]
    now = datetime.now(timezone.utc).isoformat()

    await db.construction_stage.update_one(
        {"user_id": user_id},
        {"$set": {"current_stage": data.stage, "updated_at": now}},
        upsert=True,
    )

    stage_info = CONSTRUCTION_STAGES[data.stage - 1]
    return {
        "success": True,
        "current_stage": data.stage,
        "stage_name": stage_info["name"],
        "completion_pct": int(((data.stage - 1) / TOTAL_STAGES) * 100),
    }


# ─── Library Routes ──────────────────────────────────────────────────────────

LIBRARY_PRODUCTS = [
    {
        "product_key": "main_guide",
        "name": "Sundar Ghar Construction Guide",
        "description": "Complete 22-chapter guide to build your dream home",
        "price": 499,
        "icon": "book",
        "action_unlocked": "read_guide",
        "action_label": "Read Guide",
    },
    {
        "product_key": "cost_calculator",
        "name": "Construction Cost Calculator",
        "description": "Calculate exact costs for cement, steel, labour & materials",
        "price": 249,
        "icon": "calculator",
        "action_unlocked": "external_link",
        "action_label": "Open Calculator",
    },
    {
        "product_key": "vaastu_guide",
        "name": "Vaastu Decor Tips Guide",
        "description": "Attract positive energy with powerful Vaastu-inspired decor tips",
        "price": 297,
        "icon": "home",
        "action_unlocked": "view_pdf",
        "action_label": "View PDF",
    },
    {
        "product_key": "maintenance_guide",
        "name": "Home Maintenance & Aftercare Bible",
        "description": "Keep your dream home fresh, flawless and beautiful forever",
        "price": 199,
        "icon": "wrench",
        "action_unlocked": "view_pdf",
        "action_label": "View PDF",
    },
    {
        "product_key": "luxury_decor_guide",
        "name": "Luxury Home Decor Guide",
        "description": "Transform your home into a luxurious, money-attracting space",
        "price": 399,
        "icon": "sparkles",
        "action_unlocked": "view_pdf",
        "action_label": "View PDF",
    },
    {
        "product_key": "tiles_guide",
        "name": "Tiles & Wall Paint Mistakes Guide",
        "description": "Insider secrets to picking perfect tiles and wall colours",
        "price": 499,
        "icon": "palette",
        "action_unlocked": "view_pdf",
        "action_label": "View PDF",
    },
]


@api_router.get("/library")
async def get_library(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    # Get user's unlocked products (default: main_guide)
    user_prods = await db.user_products.find_one({"user_id": user_id}, {"_id": 0})
    if not user_prods:
        # Initialize default product access
        await db.user_products.insert_one({
            "user_id": user_id,
            "product_keys": ["main_guide"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        unlocked_keys = {"main_guide"}
    else:
        unlocked_keys = set(user_prods.get("product_keys", ["main_guide"]))

    products = []
    for p in LIBRARY_PRODUCTS:
        is_unlocked = p["product_key"] in unlocked_keys
        products.append({
            "product_key": p["product_key"],
            "name": p["name"],
            "description": p["description"],
            "price": p["price"],
            "icon": p["icon"],
            "action_unlocked": p["action_unlocked"],
            "action_label": p["action_label"],
            "is_unlocked": is_unlocked,
        })

    return {
        "products": products,
        "unlocked_count": len(unlocked_keys),
        "total_count": len(LIBRARY_PRODUCTS),
    }


# ─── Admin Routes ─────────────────────────────────────────────────────────────

class GrantAccessRequest(BaseModel):
    user_id: str
    product_key: str

class UpdateChapterContent(BaseModel):
    content: str

class UpdateProductPdf(BaseModel):
    pdf_url: str


async def get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Access denied. Admin only.")
    return user


@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(get_admin_user)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    total_customers = await db.users.count_documents({"role": {"$ne": "admin"}})

    pipeline = [
        {"$match": {"payment_status": {"$in": ["success", "captured"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    result = await db.purchases.aggregate(pipeline).to_list(1)
    total_revenue = result[0]["total"] if result else 0

    today_signups = await db.users.count_documents({
        "created_at": {"$gte": today_start},
        "role": {"$ne": "admin"}
    })

    pipeline_today = [
        {"$match": {"payment_status": {"$in": ["success", "captured"]}, "created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    result_today = await db.purchases.aggregate(pipeline_today).to_list(1)
    today_revenue = result_today[0]["total"] if result_today else 0

    return {
        "total_customers": total_customers,
        "total_revenue": total_revenue,
        "today_signups": today_signups,
        "today_revenue": today_revenue,
    }


@api_router.get("/admin/customers")
async def admin_customers(search: str = "", filter: str = "all", admin: dict = Depends(get_admin_user)):
    query = {"role": {"$ne": "admin"}}

    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    if filter == "today":
        query["created_at"] = {"$gte": today_start}

    users_list = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)

    customers = []
    for u in users_list:
        user_prods = await db.user_products.find_one({"user_id": u["id"]}, {"_id": 0})
        products = user_prods.get("product_keys", []) if user_prods else []

        purchases = await db.purchases.find(
            {"user_id": u["id"], "payment_status": {"$in": ["success", "captured"]}},
            {"_id": 0, "amount": 1}
        ).to_list(100)
        total_paid = sum(p.get("amount", 0) for p in purchases)

        if filter == "paid" and total_paid == 0:
            continue
        if filter == "free" and total_paid > 0:
            continue

        customers.append({
            "id": u["id"],
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "phone": u.get("phone", ""),
            "created_at": u.get("created_at", ""),
            "products": products,
            "total_paid": total_paid,
        })

    return {"customers": customers}


@api_router.post("/admin/grant-access")
async def admin_grant_access(data: GrantAccessRequest, admin: dict = Depends(get_admin_user)):
    user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.product_key not in PRODUCT_PRICES:
        raise HTTPException(status_code=400, detail="Invalid product")

    now = datetime.now(timezone.utc).isoformat()
    await db.user_products.update_one(
        {"user_id": data.user_id},
        {"$addToSet": {"product_keys": data.product_key}, "$set": {"updated_at": now}},
        upsert=True,
    )
    return {"success": True, "message": f"Access granted for {data.product_key}"}


@api_router.get("/admin/payments")
async def admin_payments(filter: str = "all", admin: dict = Depends(get_admin_user)):
    query = {}
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0).isoformat()

    if filter == "success":
        query["payment_status"] = {"$in": ["success", "captured"]}
    elif filter == "failed":
        query["payment_status"] = "failed"
    elif filter == "today":
        query["created_at"] = {"$gte": today_start}
    elif filter == "week":
        query["created_at"] = {"$gte": (now - timedelta(days=7)).isoformat()}
    elif filter == "month":
        query["created_at"] = {"$gte": (now - timedelta(days=30)).isoformat()}

    payments = await db.purchases.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)

    enriched = []
    for p in payments:
        user = await db.users.find_one({"id": p.get("user_id")}, {"_id": 0, "name": 1, "email": 1})
        enriched.append({
            **p,
            "customer_name": user.get("name", "Unknown") if user else "Unknown",
            "customer_email": user.get("email", "") if user else "",
        })

    pipeline = [
        {"$match": {"payment_status": {"$in": ["success", "captured"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    result = await db.purchases.aggregate(pipeline).to_list(1)
    total_revenue = result[0]["total"] if result else 0

    return {"payments": enriched, "total_revenue": total_revenue}


@api_router.get("/admin/chapters")
async def admin_chapters(admin: dict = Depends(get_admin_user)):
    chapters = []
    for ch in CHAPTERS:
        content_doc = await db.chapter_content.find_one(
            {"chapter_number": ch["chapter_number"]}, {"_id": 0}
        )
        chapters.append({
            **ch,
            "content": content_doc.get("content", "") if content_doc else "",
            "has_content": bool(content_doc and content_doc.get("content")),
        })
    return {"chapters": chapters}


@api_router.put("/admin/chapters/{chapter_number}")
async def admin_update_chapter(chapter_number: int, data: UpdateChapterContent, admin: dict = Depends(get_admin_user)):
    chapter = next((ch for ch in CHAPTERS if ch["chapter_number"] == chapter_number), None)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")

    now = datetime.now(timezone.utc).isoformat()
    await db.chapter_content.update_one(
        {"chapter_number": chapter_number},
        {"$set": {"content": data.content, "updated_at": now}},
        upsert=True,
    )
    return {"success": True, "message": f"Chapter {chapter_number} content updated"}


@api_router.get("/admin/products-settings")
async def admin_products_settings(admin: dict = Depends(get_admin_user)):
    products = []
    for p in SEED_PRODUCTS:
        settings = await db.product_settings.find_one(
            {"product_key": p["product_key"]}, {"_id": 0}
        )
        products.append({
            "product_key": p["product_key"],
            "product_name": p["product_name"],
            "price": p["price"],
            "pdf_url": settings.get("pdf_url", "") if settings else "",
        })
    return {"products": products}


@api_router.put("/admin/products-settings/{product_key}")
async def admin_update_product_settings(product_key: str, data: UpdateProductPdf, admin: dict = Depends(get_admin_user)):
    if product_key not in PRODUCT_PRICES:
        raise HTTPException(status_code=404, detail="Product not found")

    now = datetime.now(timezone.utc).isoformat()
    await db.product_settings.update_one(
        {"product_key": product_key},
        {"$set": {"pdf_url": data.pdf_url, "updated_at": now}},
        upsert=True,
    )
    return {"success": True, "message": f"PDF URL updated for {product_key}"}


# ─── Settings Routes ─────────────────────────────────────────────────────────

class UpdateProfileRequest(BaseModel):
    name: str
    phone: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class PreferencesRequest(BaseModel):
    language: str = "en"
    email_notifications: bool = True
    construction_reminders: bool = True
    new_content_alerts: bool = True

class DeleteAccountRequest(BaseModel):
    confirmation: str


@api_router.put("/settings/profile")
async def update_profile(data: UpdateProfileRequest, current_user: dict = Depends(get_current_user)):
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"name": data.name.strip(), "phone": data.phone.strip(), "updated_at": now}},
    )
    return {"success": True, "name": data.name.strip(), "phone": data.phone.strip()}


@api_router.put("/settings/password")
async def change_password(data: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"password_hash": hash_password(data.new_password), "updated_at": now}},
    )
    return {"success": True, "message": "Password updated successfully"}


@api_router.get("/settings/preferences")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    prefs = await db.user_preferences.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not prefs:
        prefs = {
            "language": "en",
            "email_notifications": True,
            "construction_reminders": True,
            "new_content_alerts": True,
        }
    return {
        "language": prefs.get("language", "en"),
        "email_notifications": prefs.get("email_notifications", True),
        "construction_reminders": prefs.get("construction_reminders", True),
        "new_content_alerts": prefs.get("new_content_alerts", True),
    }


@api_router.put("/settings/preferences")
async def update_preferences(data: PreferencesRequest, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    await db.user_preferences.update_one(
        {"user_id": current_user["id"]},
        {"$set": {
            "language": data.language,
            "email_notifications": data.email_notifications,
            "construction_reminders": data.construction_reminders,
            "new_content_alerts": data.new_content_alerts,
            "updated_at": now,
        }},
        upsert=True,
    )
    return {"success": True}


@api_router.get("/settings/purchases")
async def get_user_purchases(current_user: dict = Depends(get_current_user)):
    purchases = await db.purchases.find(
        {"user_id": current_user["id"], "payment_status": {"$in": ["success", "captured"]}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)

    enriched = []
    for p in purchases:
        product = next(
            (pr for pr in SEED_PRODUCTS if pr["product_key"] == p.get("product_key")),
            None,
        )
        enriched.append({
            "product_name": product["product_name"] if product else p.get("product_key", "Unknown"),
            "amount": p.get("amount", 0),
            "created_at": p.get("created_at", ""),
            "razorpay_payment_id": p.get("razorpay_payment_id", ""),
        })
    return {"purchases": enriched}


@api_router.delete("/settings/account")
async def delete_account(data: DeleteAccountRequest, current_user: dict = Depends(get_current_user)):
    if data.confirmation != "DELETE MY ACCOUNT":
        raise HTTPException(status_code=400, detail="Please type 'DELETE MY ACCOUNT' to confirm")

    uid = current_user["id"]
    await db.users.delete_one({"id": uid})
    await db.user_products.delete_many({"user_id": uid})
    await db.user_progress.delete_many({"user_id": uid})
    await db.checklist_items.delete_many({"user_id": uid})
    await db.budget_settings.delete_many({"user_id": uid})
    await db.budget_expenses.delete_many({"user_id": uid})
    await db.construction_stage.delete_many({"user_id": uid})
    await db.chat_history.delete_many({"user_id": uid})
    await db.user_preferences.delete_many({"user_id": uid})
    await db.purchases.delete_many({"user_id": uid})

    logger.info(f"Account deleted: {current_user['email']}")
    return {"success": True, "message": "Account deleted successfully"}


# ─── Payment Routes ──────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    product_key: str
    user_email: str = ""
    user_name: str = ""
    user_phone: str = ""

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    product_key: str
    user_email: str = ""
    user_name: str = ""
    user_phone: str = ""


async def get_optional_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token_str = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token_str, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                user = await db.users.find_one({"id": user_id}, {"_id": 0})
                return user
        except Exception:
            pass
    return None


def generate_random_password(length=10):
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


@api_router.post("/payments/create-order")
async def create_payment_order(data: CreateOrderRequest):
    if data.product_key not in PRODUCT_PRICES:
        raise HTTPException(status_code=400, detail="Invalid product")

    price = PRODUCT_PRICES[data.product_key]
    amount_paise = price * 100
    receipt = f"rcpt_{data.product_key[:10]}_{uuid.uuid4().hex[:8]}"

    try:
        order = razorpay_client.order.create(data={
            "amount": amount_paise,
            "currency": "INR",
            "payment_capture": 1,
            "receipt": receipt,
            "notes": {
                "product_key": data.product_key,
                "user_email": data.user_email,
            }
        })
    except Exception as e:
        logger.error(f"Razorpay order creation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to create payment order")

    product_name = next(
        (p["product_name"] for p in SEED_PRODUCTS if p["product_key"] == data.product_key),
        data.product_key
    )

    return {
        "order_id": order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "key_id": os.environ['RAZORPAY_KEY_ID'],
        "product_key": data.product_key,
        "product_name": product_name,
    }


@api_router.post("/payments/verify")
async def verify_payment(data: VerifyPaymentRequest, request: Request):
    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "razorpay_signature": data.razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        now = datetime.now(timezone.utc).isoformat()
        await db.purchases.insert_one({
            "id": str(uuid.uuid4()),
            "order_id": data.razorpay_order_id,
            "razorpay_payment_id": data.razorpay_payment_id,
            "product_key": data.product_key,
            "payment_status": "failed",
            "failure_reason": "signature_verification_failed",
            "created_at": now,
        })
        raise HTTPException(status_code=400, detail="Payment verification failed. Please contact support@sundarghar.in")

    now = datetime.now(timezone.utc).isoformat()
    current_user = await get_optional_user(request)
    token_to_return = None
    user_resp = None
    is_new_user = False

    if current_user:
        user_id = current_user["id"]
    else:
        existing = await db.users.find_one({"email": data.user_email}, {"_id": 0})
        if existing:
            user_id = existing["id"]
            token_to_return = create_token(user_id)
            user_resp = {
                "id": user_id,
                "name": existing["name"],
                "email": existing["email"],
                "phone": existing.get("phone", ""),
                "is_active": True,
                "created_at": existing.get("created_at", now),
            }
        else:
            is_new_user = True
            user_id = str(uuid.uuid4())
            auto_password = generate_random_password()
            user_doc = {
                "id": user_id,
                "name": data.user_name or data.user_email.split("@")[0],
                "email": data.user_email,
                "password_hash": hash_password(auto_password),
                "phone": data.user_phone or "",
                "is_active": True,
                "created_at": now,
            }
            await db.users.insert_one(user_doc)
            logger.info(f"New user created via payment: {data.user_email} (auto-password logged for welcome email)")
            token_to_return = create_token(user_id)
            user_resp = {
                "id": user_id,
                "name": user_doc["name"],
                "email": data.user_email,
                "phone": data.user_phone or "",
                "is_active": True,
                "created_at": now,
            }

    price = PRODUCT_PRICES.get(data.product_key, 0)
    purchase_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "order_id": data.razorpay_order_id,
        "razorpay_payment_id": data.razorpay_payment_id,
        "amount": price,
        "product_key": data.product_key,
        "payment_status": "success",
        "created_at": now,
    }
    await db.purchases.insert_one(purchase_doc)

    await db.user_products.update_one(
        {"user_id": user_id},
        {"$addToSet": {"product_keys": data.product_key}, "$set": {"updated_at": now}},
        upsert=True,
    )

    result = {
        "success": True,
        "product_key": data.product_key,
        "is_new_user": is_new_user,
    }
    if token_to_return:
        result["token"] = token_to_return
        result["user"] = user_resp

    return result


@api_router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")
    webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", os.environ['RAZORPAY_KEY_SECRET'])

    try:
        razorpay_client.utility.verify_webhook_signature(
            body.decode('utf-8'), signature, webhook_secret
        )
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload = json.loads(body)
    event = payload.get("event", "")
    now = datetime.now(timezone.utc).isoformat()

    if event == "payment.captured":
        payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payment.get("order_id")
        payment_id = payment.get("id")
        notes = payment.get("notes", {})
        product_key = notes.get("product_key", "")

        await db.purchases.update_one(
            {"order_id": order_id},
            {"$set": {"payment_status": "captured", "razorpay_payment_id": payment_id, "webhook_verified": True, "updated_at": now}},
        )

        if product_key:
            purchase = await db.purchases.find_one({"order_id": order_id}, {"_id": 0})
            if purchase and purchase.get("user_id"):
                await db.user_products.update_one(
                    {"user_id": purchase["user_id"]},
                    {"$addToSet": {"product_keys": product_key}, "$set": {"updated_at": now}},
                    upsert=True,
                )
        logger.info(f"Webhook: payment.captured - {payment_id} for order {order_id}")

    elif event == "payment.failed":
        payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
        order_id = payment.get("order_id")
        payment_id = payment.get("id")

        await db.purchases.update_one(
            {"order_id": order_id},
            {"$set": {"payment_status": "failed", "failure_reason": "webhook_payment_failed", "updated_at": now}},
            upsert=True,
        )
        logger.info(f"Webhook: payment.failed - {payment_id} for order {order_id}")

    return {"status": "ok"}


# ─── AI Chat Routes ──────────────────────────────────────────────────────────

from emergentintegrations.llm.chat import LlmChat, UserMessage

AI_SYSTEM_PROMPT = """You are "Sundar Ghar AI Saathi", a helpful assistant for Indian homeowners building their dream homes. You are based on the Sundar Ghar Construction Guide which covers:
- Home construction planning and budgeting
- Choosing contractors and avoiding fraud
- Material quality checks (cement, steel, bricks, tiles, paint, plumbing)
- Foundation, walls, roof construction
- Legal documents and approvals needed
- Vastu tips for Indian homes
- Budget tracking and cost control
- Site supervision and quality checks
- Interior design and finishing tips
- Home maintenance after construction

RULES:
- Answer only construction and home building related questions
- If asked anything unrelated say: "Main sirf ghar banane ke sawaalon ka jawab de sakta hun. Koi construction related sawaal poochho!"
- Always be warm, helpful and encouraging
- Use simple Hindi/English mix (Hinglish) when user writes in Hindi
- Use English when user writes in English
- Keep answers concise and practical
- Always refer to Indian context (Indian materials, contractors, prices)
- When relevant, suggest which chapter of the Sundar Ghar Guide covers that topic"""

_chat_instances: dict = {}


def get_chat_instance(user_id: str) -> LlmChat:
    if user_id not in _chat_instances:
        _chat_instances[user_id] = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"sundar_ghar_{user_id}",
            system_message=AI_SYSTEM_PROMPT,
        ).with_model("gemini", "gemini-3-flash-preview")
    return _chat_instances[user_id]


class ChatMessageRequest(BaseModel):
    message: str


@api_router.post("/chat/send")
async def send_chat_message(data: ChatMessageRequest, current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]

    if len(data.message) > 500:
        raise HTTPException(status_code=400, detail="Message too long. Maximum 500 characters.")
    if not data.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        chat = get_chat_instance(user_id)
        user_msg = UserMessage(text=data.message.strip())
        response_text = await chat.send_message(user_msg)
    except Exception as e:
        logger.error(f"AI chat error for user {user_id}: {e}")
        response_text = "Kuch technical issue aa gaya. Please thodi der baad try karein."

    now = datetime.now(timezone.utc).isoformat()
    chat_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "message": data.message.strip(),
        "response": response_text,
        "created_at": now,
    }
    await db.chat_history.insert_one(chat_doc)

    return {
        "id": chat_doc["id"],
        "message": chat_doc["message"],
        "response": response_text,
        "created_at": now,
    }


@api_router.get("/chat/history")
async def get_chat_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    messages = await db.chat_history.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(10)
    messages.reverse()
    return {"messages": messages}


@api_router.delete("/chat/clear")
async def clear_chat_history(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    await db.chat_history.delete_many({"user_id": user_id})
    if user_id in _chat_instances:
        del _chat_instances[user_id]
    return {"success": True, "message": "Chat history cleared"}


# ─── Health Check ────────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "Sundar Ghar Saathi API is running"}


# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
