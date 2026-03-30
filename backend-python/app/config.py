"""Application configuration using environment variables."""

import os
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Database
    DATABASE_URL: str = "postgresql://localhost:5432/tvu_gdqp_admin"
    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "tvu_gdqp"

    # API Keys (should be in .env file)
    GEMINI_API_KEY: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # AWS
    AWS_REGION: str = "ap-southeast-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "tvu-gdqp-admin-bucket"

    # OCR
    TESSERACT_PATH: str = "/usr/bin/tesseract"  # Linux default
    OCR_LANGUAGE: str = "vie"

    # Google Cloud
    GOOGLE_CLOUD_PROJECT_ID: Optional[str] = None
    GOOGLE_CLOUD_LOCATION: str = "us"
    DOCUMENTAI_PROCESSOR_ID: Optional[str] = None

    # API Server
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False
    )

settings = Settings()

# Set Google credentials path if file exists
google_creds_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "google-credentials.json")
if os.path.exists(google_creds_path):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = google_creds_path