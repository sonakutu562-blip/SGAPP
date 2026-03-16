from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List
import uuid
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

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
    {"id": str(uuid.uuid4()), "product_key": "luxury_decor_guide", "product_name": "Luxury Home Decor Guide", "price": 388, "type": "pdf"},
    {"id": str(uuid.uuid4()), "product_key": "tiles_guide", "product_name": "Tiles & Wall Paint Mistakes Guide", "price": 455, "type": "pdf"},
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
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    # Seed products if empty
    count = await db.products.count_documents({})
    if count == 0:
        await db.products.insert_many(SEED_PRODUCTS)
        logger.info("Seeded %d products", len(SEED_PRODUCTS))
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
        "created_at": now
    }
    await db.users.insert_one(user_doc)

    token = create_token(user_id)
    user_resp = UserResponse(
        id=user_id, name=data.name, email=data.email,
        phone=data.phone, is_active=True, created_at=now
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
        phone=user["phone"], is_active=user["is_active"], created_at=user["created_at"]
    )
    return TokenResponse(token=token, user=user_resp)


@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"], name=current_user["name"], email=current_user["email"],
        phone=current_user["phone"], is_active=current_user["is_active"],
        created_at=current_user["created_at"]
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

    return {
        "chapter_number": chapter["chapter_number"],
        "title": chapter["title"],
        "description": chapter["description"],
        "content": (
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
        ),
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
        "price": 388,
        "icon": "sparkles",
        "action_unlocked": "view_pdf",
        "action_label": "View PDF",
    },
    {
        "product_key": "tiles_guide",
        "name": "Tiles & Wall Paint Mistakes Guide",
        "description": "Insider secrets to picking perfect tiles and wall colours",
        "price": 455,
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
