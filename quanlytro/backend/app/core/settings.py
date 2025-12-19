from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# File này: backend/app/core/settings.py
# Cần lên 3 cấp: backend/app/core -> backend/app -> backend
current_file = Path(__file__).resolve()
backend_dir = current_file.parent.parent.parent  # backend/

# Load .env files nhưng KHÔNG override biến môi trường đã có (từ Docker)
# override=False: Ưu tiên biến môi trường từ docker-compose
env_docker_path = backend_dir / ".env.docker"
env_dev_path = backend_dir / ".env.development"

if env_docker_path.exists():
    load_dotenv(env_docker_path, override=False)
    print(f"[OK] Loaded: {env_docker_path} (override=False)")
elif env_dev_path.exists():
    load_dotenv(env_dev_path, override=False)
    print(f"[OK] Loaded: {env_dev_path} (override=False)")
else:
    print(f"[WARNING] No .env file found!")

# Debug: Print DATABASE_URL
print(f"[DEBUG] DATABASE_URL = {os.getenv('DATABASE_URL', 'NOT SET')}")

class Setting(BaseSettings):
    
    # Application
    PROJECT_NAME: str = "Tenant and Room Management System"

    # Database configuration
    DATABASE_URL: str = ""

    # JWT configuration  
    SECRET_KEY: str = ""
    ACCESS_TOKEN_EXPIRE: str = ""
    REFRESH_TOKEN_EXPIRE_DAY: str = ""
    ALGORITHM: str = "HS256"

    # CORS origins
    BACKEND_CORS_ORIGINS: str = ""

    # Environment
    ENVIRONMENT: str = "development"

    # PayOS configuration
    PAYOS_CLIENT_ID: str = ""
    PAYOS_API_KEY: str = ""
    PAYOS_CHECKSUM_KEY: str = ""
    PAYOS_RETURN_URL: str = "http://localhost:3000/payment/success"
    PAYOS_CANCEL_URL: str = "http://localhost:3000/payment/cancel"

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins từ comma-separated string."""
        if not self.BACKEND_CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]
    
    class Config:
        env_file_encoding = "utf-8"
        case_sensitive = True

# Khởi tạo settings toàn cục
settings = Setting()
