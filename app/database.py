from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

# Render provides PostgreSQL connection strings starting with postgres://
# which SQLAlchemy 1.4+ and 2.0 require to be postgresql:// or postgresql+psycopg2://
db_url = settings.database_url
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# check_same_thread=False is needed only for SQLite when used with FastAPI's
# threaded request handling.
connect_args = (
    {"check_same_thread": False} if db_url.startswith("sqlite") else {}
)

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
