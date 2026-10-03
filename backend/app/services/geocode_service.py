from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError

def get_location(address):
    if not address or address == "Unknown":
        return {"latitude": None, "longitude": None}
        
    try:
        # Nominatim requires a user_agent
        geolocator = Nominatim(user_agent="igrs_grievance_system")
        location = geolocator.geocode(address)
        
        if location:
            return {
                "latitude": location.latitude,
                "longitude": location.longitude
            }
        return {"latitude": None, "longitude": None}
    except (GeocoderTimedOut, GeocoderServiceError) as e:
        print(f"Geocoding error: {e}")
        return {"latitude": None, "longitude": None}
