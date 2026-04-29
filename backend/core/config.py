from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./ticketrush.db"
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

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
