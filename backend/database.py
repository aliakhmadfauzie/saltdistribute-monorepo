import os
import sys
from typing import Optional, Any
from dotenv import load_dotenv

load_dotenv()

# Database Environment Configurations
DB_ENGINE = os.getenv("DB_ENGINE", "mongodb").lower() # "mongodb" | "sqlite" | "memory"
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "saltdistribute_db")
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", "saltdistribute.db")

client = None
db: Optional[Any] = None
is_connected = False

def initialize_database():
    """Initializes database driver based on configured DB_ENGINE and environment variables."""
    global client, db, is_connected

    if DB_ENGINE == "mongodb":
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=2500)
            db = client[DB_NAME]
            is_connected = True
            print(f"[Database] Connected to MongoDB database: '{DB_NAME}' at {MONGODB_URI}")
        except Exception as e:
            print(f"[Database] MongoDB connection notice (falling back to in-memory store): {e}")
            is_connected = False
            db = None
    elif DB_ENGINE == "sqlite":
        print(f"[Database] Configured SQLite database at: {SQLITE_DB_PATH}")
        is_connected = True
    else:
        print("[Database] Using In-Memory state store.")
        is_connected = True

initialize_database()

def get_db():
    """Returns active database handle."""
    return db

def check_db_health():
    """Returns health status object for database monitoring."""
    return {
        "engine": DB_ENGINE,
        "database_name": DB_NAME,
        "is_connected": is_connected,
        "connection_target": MONGODB_URI if DB_ENGINE == "mongodb" else SQLITE_DB_PATH,
    }
