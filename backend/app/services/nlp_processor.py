import re
from app.services.gemini_service import generate_solution
from app.services.geocode_service import get_location

#Categorization based on keywords
def categorize_problem(problem: str):
    text = problem.lower()
    if any(word in text for word in ["road", "traffic", "pothole", "bridge", "street", "highway", "pavement", "infrastructure"]):
        return "Infrastructure"
    elif any(word in text for word in ["water", "electricity", "power", "pipeline", "leak", "supply", "utility"]):
        return "Utilities"
    elif any(word in text for word in ["garbage", "sanitation", "waste", "trash", "sewage", "drainage", "cleaning", "pollution"]):
        return "Sanitation"
    elif any(word in text for word in ["hospital", "doctor", "medicine", "ambulance", "health", "disease", "clinic", "medical", "injury"]):
        return "Medical"
    else:
        return "Other"
    

#Priority assignment based on keywords
def assign_priority(problem: str):
    text = problem.lower()
    if any(word in text for word in ["accident", "fire", "collapse", "emergency", "ambulance", "health", "massive pothole", "massive potholes", "water pipeline burst", "pipeline burst", "critical", "severe", "life-threatening", "fatality", "death", "hazard", "outbreak", "disaster", "burst"]):
        return "High"
    elif any(word in text for word in ["pothole", "flood", "supply issue", "power cut", "leak", "blockage", "damaged", "broken", "disruption", "stray dog", "stray animal"]):
        return "Medium"
    else:
        return "Low"
    
#Extract location using geocoding service
def extract_location(text: str):
    pattern = r'\b(?:in|at|near|around)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b'
    match = re.search(pattern, text)
    return match.group(1) if match else "Unknown Location"

from app.services.gemini_classifier import classify_grievance

def classify_with_fallback(problem_text: str):
    gemini_data = classify_grievance(problem_text)
    
    category = gemini_data.get("category")
    if not category or category == "Other":
        category = categorize_problem(problem_text)
        
    priority = gemini_data.get("priority")
    fallback_priority = assign_priority(problem_text)
    
    # Priority rank mapping to allow elevation if fallback detects higher urgency
    priority_rank = {"High": 3, "Medium": 2, "Low": 1, None: 0}
    if priority_rank.get(fallback_priority, 0) > priority_rank.get(priority, 0):
        priority = fallback_priority
        
    if not priority:
        priority = fallback_priority
        
    region = gemini_data.get("region")
    if not region or region == "Unknown":
        region = extract_location(problem_text)
        
    return {
        "category": category,
        "priority": priority,
        "region": region
    }

#Main Processing Pipeline
def process_grievance(problem_text: str):
    data = classify_with_fallback(problem_text)
    
    location = get_location(data["region"])
    solution = generate_solution(problem_text)

    return {
        "description": problem_text,
        "category": data["category"],
        "priority": data["priority"],
        "region": data["region"],
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "solution": solution
    }