import re
import json
import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def classify_grievance(problem: str):
    """
    Uses Gemini AI to classify a grievance into category, priority, and region.
    Returns a clean JSON dict that the frontend can parse directly.
    """
    prompt = f"""
    You are a grievance classification assistant for a government system.
    Classify the following grievance and return only a JSON object.

    Required JSON format:
    {{
      "category": "One of [Water, Electricity, Roads, Waste, Health, Law & Order, Other]",
      "priority": "High / Medium / Low",
      "region": "General area or region (if mentioned, else null)",
      "state": "State name (if mentioned, else null)",
      "city": "City name (if mentioned, else null)",
      "zone": "Zone name e.g., North, South, East, West (if mentioned, else null)",
      "ward": "Ward name or number (if mentioned, else null)"
    }}

    Grievance: "{problem}"
    """

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        text = response.text.strip()

        # Remove markdown formatting like ```json ... ```
        text = re.sub(r"^```(?:json)?", "", text)
        text = re.sub(r"```$", "", text)
        text = text.strip()

        # Parse JSON safely
        parsed = json.loads(text)
        return parsed

    except Exception as e:
        print("Gemini classification error:", e)
        return {
            "category": "Other",
            "priority": "Medium",
            "region": "Unknown",
            "state": None,
            "city": None,
            "zone": None,
            "ward": None
        }
