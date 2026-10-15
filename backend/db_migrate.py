import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE grievances ADD COLUMN trust_score INT DEFAULT 100"))
        print("Added trust_score column.")
    except Exception as e:
        print("Could not add trust_score:", e)
        
    try:
        conn.execute(text("ALTER TABLE grievances ADD COLUMN is_spam INT DEFAULT 0"))
        print("Added is_spam column.")
    except Exception as e:
        print("Could not add is_spam:", e)
    
    conn.commit()
print("Database schema updated.")
