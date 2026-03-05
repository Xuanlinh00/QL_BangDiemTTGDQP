from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/tvu_gdqp_admin"
    
    # AWS
    AWS_REGION: str = "ap-southeast-1"
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: str = "tvu-gdqp-admin-bucket"
    
    # OCR
    TESSERACT_PATH: str = "/usr/bin/tesseract"
    OCR_LANGUAGE: str = "vie"
    
    # API
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    class Config:
        env_file = ".env"

settings = Settings()
