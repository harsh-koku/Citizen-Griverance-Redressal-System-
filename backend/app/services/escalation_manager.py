import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def evaluate_and_escalate(grievance_description: str, category: str, days_pending: int) -> dict:
    """
    AI Manager Agent: Evaluates delayed grievances and decides if they require immediate escalation.
    """
    prompt = f"""
    You are the Senior AI Grievance Manager.
    A grievance in category '{category}' has been pending for {days_pending} days.
    
    Complaint: "{grievance_description}"
    
    Decide whether this needs an immediate escalation (e.g., life-threatening, critical infrastructure, public safety) or if the delay is acceptable.
    
    Return a concise JSON object with:
    {{
        "escalate": true or false,
        "new_priority": "Critical" or "High" or "Normal",
        "manager_note": "A strict 1-sentence explanation of why it was escalated or not."
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
            temperature=0.2
        )
        import json
        text = completion.choices[0].message.content.strip()
        parsed = json.loads(text)
        return parsed
    except Exception as e:
        print("Escalation Manager AI Error:", e)
        return {
            "escalate": False,
            "new_priority": "High",
            "manager_note": "System escalated due to AI unavailability."
        }
