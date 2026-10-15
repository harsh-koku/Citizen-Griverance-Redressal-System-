import os
from dotenv import load_dotenv
from groq import Groq
import json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_city_health_briefing(stats: dict) -> dict:
    """
    AI City Health Agent: Generates a high-level executive briefing for the Admin,
    advising on resource deployment based on real-time complaint data.
    """
    prompt = f"""
    You are the Chief AI Strategic Advisor for the City Administration.
    The admin is overwhelmed with millions of complaints. Your job is to read today's 
    aggregated grievance statistics and provide a highly concise, tactical Executive Briefing.
    
    Today's Data: {json.dumps(stats)}
    
    Output a JSON object with:
    {{
        "critical_alert": "The single most alarming trend (1 sentence)",
        "action_plan": ["Bullet 1: Tactical resource allocation", "Bullet 2: Tactical advice"],
        "overall_health_score": int (0-100, where 100 is perfect city health)
    }}
    """
    
    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": "You output JSON only."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        text = completion.choices[0].message.content.strip()
        parsed = json.loads(text)
        return parsed
    except Exception as e:
        print("City Health Agent AI Error:", e)
        return {
            "critical_alert": "Unable to generate AI briefing at this time.",
            "action_plan": ["Review system logs.", "Contact IT support."],
            "overall_health_score": 50
        }
