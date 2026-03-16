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
    total_chapters = 20
    completed = await db.user_progress.count_documents({"user_id": user_id, "is_completed": True})
    reading_progress = int((completed / total_chapters) * 100) if total_chapters > 0 else 0

    # Checklist progress
    total_items = await db.checklist_items.count_documents({"user_id": user_id})
    checked_items = await db.checklist_items.count_documents({"user_id": user_id, "is_checked": True})
    checklist_progress = int((checked_items / total_items) * 100) if total_items > 0 else 0

    # Budget usage
    entries = await db.budget_entries.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    total_budgeted = sum(e.get("budgeted_amount", 0) for e in entries)
    total_spent = sum(e.get("spent_amount", 0) for e in entries)
    budget_used = int((total_spent / total_budgeted) * 100) if total_budgeted > 0 else 0

    # Construction stage
    stage_doc = await db.construction_stage.find_one({"user_id": user_id}, {"_id": 0})
    current_stage = stage_doc["current_stage"] if stage_doc else "Not Started"

    return DashboardSummary(
        reading_progress=reading_progress,
        checklist_progress=checklist_progress,
        budget_used=budget_used,
        current_stage=current_stage
    )


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
