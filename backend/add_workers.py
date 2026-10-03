from app.db.connection import engine, SessionLocal
from sqlalchemy import text
from app.db.models import User, UserRole
from app.auth.utils import hash_password

def main():
    with engine.connect() as conn:
        try:
            conn.execute(text('ALTER TABLE users ADD COLUMN worker_category VARCHAR(100)'))
            conn.commit()
            print("Column added.")
        except Exception as e:
            print("Column might exist:", e)
            
    db = SessionLocal()
    workers = [
        ('Rajesh Kumar', 'rajesh@igrs.com', 'Road Infrastructure'), 
        ('Amit Singh', 'amit@igrs.com', 'Water Supply'), 
        ('Suresh Patel', 'suresh@igrs.com', 'Electricity'), 
        ('Vikram Sharma', 'vikram@igrs.com', 'Waste Management'), 
        ('Deepak Verma', 'deepak@igrs.com', 'Public Health')
    ]
    for n, e, c in workers:
        if not db.query(User).filter(User.email == e).first():
            db.add(User(name=n, email=e, password_hash=hash_password('worker123'), role=UserRole.worker, worker_category=c))
    db.commit()
    print('Workers created.')

if __name__ == "__main__":
    main()
