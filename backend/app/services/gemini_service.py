from groq import Groq
from app.config import settings

# Initialize Groq client
client = Groq(api_key=settings.GROQ_API_KEY)

def generate_solution(grievance_text: str):
    """
    Generates a structured short-term and long-term solution using Groq LLM.
    """
    try:
        prompt = (
            f"Act as a government grievance expert. Analyze this complaint: '{grievance_text}'.\n\n"
            f"Provide a highly concise, 2-bullet response (max 30 words total):\n"
            f"1. **Action:** (1-step immediate fix)\n"
            f"2. **Prevention:** (1-step long-term fix)\n"
            f"Do not include any pleasantries or extra text."
        )
        
        completion = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1024
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        return "Solution generation unavailable at the moment."

def generate_analytics_summary(prompt_text: str):
    """
    Generates a general summary for analytics or forecasts using Groq.
    """
    try:
        completion = client.chat.completions.create(
            model=settings.LLM_MODEL,
            messages=[{"role": "user", "content": prompt_text}],
            temperature=0.7,
            max_tokens=1024
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"LLM Analytics Error: {e}")
        return "Analytics summary generation unavailable at the moment."