import asyncio
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from fastapi.routing import APIRouter
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from typing import List
from bson import ObjectId
from db.database import job_profiles
import os
from datetime import datetime
from config import settings

# ─── Hard-coded mail & app settings ─────────────────────────────────────────────
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM     = os.getenv("MAIL_FROM")
MAIL_SERVER   = os.getenv("MAIL_SERVER")

# SSL-only: port 465, TLS disabled, SSL enabled
MAIL_PORT     = 465
MAIL_STARTTLS = False  # Changed from MAIL_TLS
MAIL_SSL_TLS  = True   # Changed from MAIL_SSL

FRONTEND_URL  =  settings.FRONTEND_URL


conf = ConnectionConfig(
    MAIL_USERNAME=MAIL_USERNAME,
    MAIL_PASSWORD=MAIL_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_SERVER=MAIL_SERVER,
    MAIL_PORT=MAIL_PORT,
    MAIL_STARTTLS=MAIL_STARTTLS,  # Required field
    MAIL_SSL_TLS=MAIL_SSL_TLS,    # Required field
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)

fastmail = FastMail(conf)
app      = FastAPI()
router   = APIRouter()


# Interview-related endpoints removed
# The email route now only contains general email functionality
# Interview invites and scheduling have been removed
