import sqlite3
from pathlib import Path
from typing import Optional, Dict, Any, List
from .config import settings, BASE_DIR

DB_FILE = BASE_DIR / "mediaflow.db"

def _get_connection():
    conn = sqlite3.connect(str(DB_FILE), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def _init_db_sync():
    conn = _get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        media_type TEXT DEFAULT 'video',
        target_ext TEXT NOT NULL,
        target_quality TEXT,
        status TEXT DEFAULT 'queued',
        progress REAL DEFAULT 0.0,
        speed TEXT,
        eta TEXT,
        phase TEXT DEFAULT 'Queued',
        message TEXT,
        file_name TEXT,
        file_path TEXT,
        file_size INTEGER,
        file_size_str TEXT,
        download_url TEXT,
        checksum TEXT,
        error TEXT,
        expires_at INTEGER,
        created_at TEXT,
        finished_at TEXT
    )
    """)
    conn.commit()
    conn.close()

async def init_db():
    _init_db_sync()

def _execute_query_sync(sql: str, params: tuple = ()) -> List[dict]:
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def _execute_write_sync(sql: str, params: tuple = ()):
    conn = _get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        conn.commit()
    finally:
        conn.close()

async def execute_query(sql: str, params: tuple = ()) -> List[dict]:
    return _execute_query_sync(sql, params)

async def execute_write(sql: str, params: tuple = ()):
    _execute_write_sync(sql, params)
