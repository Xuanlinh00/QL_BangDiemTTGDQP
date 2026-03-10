from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database - PostgreSQL
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/tvu_gdqp_admin"

    # Database - MongoDB
    MONGODB_URL: str = "mongodb+srv://user:ocH1WGTKmC0dQ1gW@cluster0.tqmq2ht.mongodb.net/tvu_gdqp?appName=Cluster0"
    MONGODB_DB_NAME: str = "tvu_gdqp"

    # AWS
    AWS_REGION: str = "ap-southeast-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "tvu-gdqp-admin-bucket"

    # OCR - Tesseract (fallback)
    TESSERACT_PATH: str = "/usr/bin/tesseract"
    OCR_LANGUAGE: str = "vie"

    # Google Cloud Document AI
    GOOGLE_CLOUD_PROJECT_ID: Optional[str] = None
    GOOGLE_CLOUD_LOCATION: str = "us"           # hoặc "eu"
    DOCUMENTAI_PROCESSOR_ID: Optional[str] = None   # ID processor Form Parser
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None  # đường dẫn file JSON key

    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    class Config:
        env_file = ".env"

settings = Settings()
