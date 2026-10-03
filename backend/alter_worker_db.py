import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.connection import engine

try:
    with engine.begin() as conn:
        print("Altering users table...")
        conn.execute(text("ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'worker') DEFAULT 'user'"))
        
        print("Altering grievances table...")
        conn.execute(text("ALTER TABLE grievances ADD COLUMN assigned_worker_id INTEGER NULL"))
        conn.execute(text("ALTER TABLE grievances ADD COLUMN worker_note TEXT NULL"))
        conn.execute(text("ALTER TABLE grievances ADD COLUMN resolution_proof_url VARCHAR(255) NULL"))
        
        # Add foreign key constraint
        conn.execute(text("ALTER TABLE grievances ADD CONSTRAINT fk_worker FOREIGN KEY (assigned_worker_id) REFERENCES users(id)"))
        
        print("Database altered successfully for worker roles!")
except Exception as e:
    print("Error altering table:", e)
