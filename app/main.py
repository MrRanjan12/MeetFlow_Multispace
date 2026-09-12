from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import auth as auth_router
from app.routers import meetings as meetings_router
from app.routers import ws as ws_router

# Creates tables if they don't exist yet. For anything beyond local dev,
# switch to Alembic migrations instead of relying on this.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Team Meeting App API", version="0.1.0")

origins = [o.strip() for o in settings.frontend_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://([a-zA-Z0-9_-]+\.(onrender\.com|netlify\.app|vercel\.app)|(localhost|127\.0\.0\.1)(:\d+)?)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(meetings_router.router)
app.include_router(ws_router.router)


@app.get("/health")
def health():
    return {"status": "ok"}
