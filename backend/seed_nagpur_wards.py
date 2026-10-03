import os
import sys
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.connection import engine

def seed_wards():
    print("Setting up Spatial Database with 50 Nagpur Wards...")
    try:
        with engine.begin() as conn:
            # Create table if it doesn't exist
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS wards (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    zone_name VARCHAR(100),
                    ward_name VARCHAR(100),
                    boundaries POLYGON NOT NULL
                )
            """))
            print("Table 'wards' verified/created.")

            # Clear existing mock data to prevent duplicates during testing
            conn.execute(text("TRUNCATE TABLE wards"))

            # Nagpur approximate bounding box
            # Lat: 21.05 to 21.25 (height 0.20)
            # Lng: 78.95 to 79.15 (width 0.20)
            
            lat_start = 21.05
            lng_start = 78.95
            
            rows = 10
            cols = 5
            
            lat_step = 0.20 / rows
            lng_step = 0.20 / cols
            
            zones = ["Dharampeth", "Laxmi Nagar", "Hanuman Nagar", "Dhantoli", "Nehru Nagar", 
                     "Gandhibagh", "Satranjipura", "Lakadganj", "Ashi Nagar", "Mangalwari"]

            ward_count = 1
            for r in range(rows):
                zone = zones[r % len(zones)]
                for c in range(cols):
                    min_lat = lat_start + (r * lat_step)
                    max_lat = min_lat + lat_step
                    min_lng = lng_start + (c * lng_step)
                    max_lng = min_lng + lng_step
                    
                    # Create rectangular polygon
                    # Order: BL, BR, TR, TL, BL
                    poly = f"POLYGON(({min_lng} {min_lat}, {max_lng} {min_lat}, {max_lng} {max_lat}, {min_lng} {max_lat}, {min_lng} {min_lat}))"
                    
                    ward_name = f"Ward {ward_count}"
                    
                    conn.execute(text(f"""
                        INSERT INTO wards (zone_name, ward_name, boundaries) 
                        VALUES ('{zone}', '{ward_name}', ST_GeomFromText('{poly}'))
                    """))
                    ward_count += 1

            print(f"Successfully seeded {ward_count - 1} Mock Wards for Nagpur!")

    except Exception as e:
        print("Error setting up spatial data:", e)

if __name__ == "__main__":
    seed_wards()
