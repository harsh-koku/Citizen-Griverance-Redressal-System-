import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.connection import Base, engine
from app.db.models import Grievance

print("Creating database tables.... on MySQL...")

try:
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully")
except Exception as e:
    print("Error creating tables:", e)


