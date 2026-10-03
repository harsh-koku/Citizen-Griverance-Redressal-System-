import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.connection import engine

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE grievances ADD COLUMN state VARCHAR(100) NULL"))
        conn.execute(text("ALTER TABLE grievances ADD COLUMN city VARCHAR(100) NULL"))
        conn.execute(text("ALTER TABLE grievances ADD COLUMN zone VARCHAR(100) NULL"))
        conn.execute(text("ALTER TABLE grievances ADD COLUMN ward VARCHAR(100) NULL"))
        print("Columns state, city, zone, ward added successfully!")
except Exception as e:
    print("Error altering table:", e)
