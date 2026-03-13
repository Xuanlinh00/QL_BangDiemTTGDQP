from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/tvu_gdqp_admin"
    gemini_api_key: str = ""
    MONGODB_URL: str = "mongodb+srv://user:ocH1WGTKmC0dQ1gW@cluster0.tqmq2ht.mongodb.net/tvu_gdqp?appName=Cluster0"
    MONGODB_DB_NAME: str = "tvu_gdqp"
    AWS_REGION: str = "ap-southeast-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "tvu-gdqp-admin-bucket"
    TESSERACT_PATH: str = "C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
    OCR_LANGUAGE: str = "vie"
    GOOGLE_CLOUD_PROJECT_ID: Optional[str] = None
    GOOGLE_CLOUD_LOCATION: str = "us"
    DOCUMENTAI_PROCESSOR_ID: Optional[str] = None
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=False
    )

settings = Settings()
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"C:\tt\backend-python\google-credentials.json"