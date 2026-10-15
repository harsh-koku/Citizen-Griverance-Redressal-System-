import os
from dotenv import load_dotenv
from groq import Groq
import json

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def analyze_fraud_and_spam(description: str) -> dict:
    """
    AI Fraud Detector: Analyzes grievance for abusive language, nonsensical text, 
    spam, and fake reports. Assigns a Trust Score.
    """
    prompt = f"""
    You are an AI Fraud and Spam Detection engine for a government grievance portal.
    Analyze the following grievance text and output a JSON object indicating if it is spam/fake/abusive and give it a trust score (0 to 100).
    - 0-30: Definite Spam/Abusive/Fake
    - 31-70: Suspicious or very low quality
    - 71-100: Legitimate and clear

    Grievance: "{description}"

    Return JSON format:
    {{
        "trust_score": int (0-100),
        "is_spam": boolean,
        "reason": "Short 1-sentence reason"
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
            temperature=0.1
        )
        text = completion.choices[0].message.content.strip()
        parsed = json.loads(text)
        return parsed
    except Exception as e:
        print("Fraud Detector AI Error:", e)
        return {
            "trust_score": 100,
            "is_spam": False,
            "reason": "Failed to analyze."
        }
