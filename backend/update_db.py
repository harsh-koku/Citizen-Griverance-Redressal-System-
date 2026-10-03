import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.connection import engine

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE grievances ADD COLUMN image_url VARCHAR(255) NULL"))
        print("Column image_url added successfully!")
except Exception as e:
    print("Error altering table:", e)
