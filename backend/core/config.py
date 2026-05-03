from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/ticketrush"
    SECRET_KEY: str = "change-this-secret-key-in-production-32chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    APP_ENV: str = "development"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    SEAT_LOCK_MINUTES: int = 10
    QUEUE_BATCH_SIZE: int = 50
    QUEUE_ADMIT_INTERVAL_SECONDS: int = 30

    # VietQR bank transfer config (thay bằng thông tin thật khi deploy)
    BANK_ID: str = "MB"
    BANK_ACCOUNT: str = "0123456789"
    BANK_ACCOUNT_NAME: str = "TICKETRUSH ENTERTAINMENT"

    # Email / SMTP
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "TicketRush <no-reply@ticketrush.vn>"

    # Frontend URL - dùng để tạo link reset password trong email
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
