import json
from groq import Groq
from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def classify_grievance(problem: str):
    """
    Uses Groq LLM to classify a grievance into category, priority, and region.
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
        completion = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[
                {"role": "system", "content": "You output JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        text = completion.choices[0].message.content.strip()

        # Parse JSON safely
        parsed = json.loads(text)
        return parsed

    except Exception as e:
        print("LLM classification error:", e)
        return {
            "category": "Other",
            "priority": "Medium",
            "region": "Unknown",
            "state": None,
            "city": None,
            "zone": None,
            "ward": None
        }
