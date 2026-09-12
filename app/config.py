from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # In production, override these via environment variables / .env file.
    # NEVER commit a real secret key.
    secret_key: str = "change-me-in-production-use-a-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    database_url: str = "sqlite:///./meeting_app.db"

    # Comma-separated list of allowed frontend origins for CORS
    frontend_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
