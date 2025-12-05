import os
import secrets
from dotenv import load_dotenv
from langchain_openai import OpenAIEmbeddings


load_dotenv()
class Settings:

    SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 30
    REFRESH_TOKEN_EXPIRE_DAYS = 7
    MONGODB_URL= os.getenv("MONGODB_URL")
    FRONTEND_URL= os.getenv("FRONTEND_URL", "http://localhost:3000")
    AUTH_DB_NAME= os.getenv("AUTH_DB_NAME", "auth_db")
    APP_DB_NAME= os.getenv("APP_DB_NAME", "app_db")
    QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
    QDRANT_API_KEY= os.getenv("QDRANT_API_KEY", None)
    GOOGLE_API_KEY= os.getenv("GOOGLE_API_KEY") 
    embeddings = OpenAIEmbeddings(
        model="text-embedding-3-small",
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # Resend Configuration
    RESEND_API_KEY = os.getenv("RESEND_API_KEY")
    RESEND_SENDER_EMAIL = os.getenv("RESEND_SENDER_EMAIL", "adnanali11875@gmail.com")
    RESEND_SENDER_NAME = os.getenv("RESEND_SENDER_NAME", "HireHelper Team")
    
    # SendGrid Configuration
    SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
    SENDGRID_SENDER_EMAIL = os.getenv("SENDGRID_SENDER_EMAIL", "adnanali11875@gmail.com")
    SENDGRID_SENDER_NAME = os.getenv("SENDGRID_SENDER_NAME", "HireHelper Team")
    
    # Mailjet Configuration (Backup)
    MAILJET_SENDER_EMAIL = os.getenv("MAILJET_SENDER_EMAIL", "your_email@domain.com")
    MAILJET_SENDER_NAME = os.getenv("MAILJET_SENDER_NAME", "HireHelper Team")
    MAILJET_API_KEY    = os.getenv("MAILJET_API_KEY")
    MAILJET_SECRET_KEY = os.getenv("MAILJET_SECRET_KEY")
    DEEPGRAM_API_KEY = os.getenv("DEEPGRAM_API_KEY",)
    OPENAI_API_KEY=os.getenv("OPENAI_API_KEY")
    QDRANT_COLLECTION="resumes"
    # Cookie config: default safe for local dev (HTTP). For production set COOKIE_SECURE=true and COOKIE_SAMESITE=None
    COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
    COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "Lax")

settings = Settings()
