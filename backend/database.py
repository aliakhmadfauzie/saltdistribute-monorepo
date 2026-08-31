import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "saltdistribute_db")

client = None
db = None

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2000)
    db = client[DB_NAME]
except Exception as e:
    print(f"MongoDB client initialization fallback: {e}")

def get_db():
    return db
