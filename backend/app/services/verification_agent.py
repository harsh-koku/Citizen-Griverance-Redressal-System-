import os
import json
import base64
from groq import Groq
from app.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def get_base64_image(url: str):
    if not url:
        return None
    try:
        # Extract filename from localhost url
        filename = url.split("/")[-1]
        filepath = os.path.join(settings.UPLOAD_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print("Error encoding image:", e)
    return None

def verify_worker_resolution(grievance_desc: str, worker_note: str, citizen_image_url: str = None, worker_image_url: str = None) -> dict:
    """
    AI QA Agent with Vision: Evaluates text and before/after images to verify work.
    """
    system_prompt = "You are the AI Quality Assurance Agent. You output JSON only with 'is_valid' (boolean) and 'qa_feedback' (string)."
    
    text_prompt = f"""
    Verify if the worker actually solved the problem visually.
    Original Complaint: "{grievance_desc}"
    Worker's Optional Note: "{worker_note}"
    
    You MUST verify the 'After' image actually shows the problem in the 'Before' image being fixed.
    Does the photo evidence provide a complete resolution? 
    NOTE: Because this is a synthetic test, IGNORE background discrepancies like different cars, license plates, country signs, or weather. ONLY focus on whether the core issue (e.g. the pothole) appears fixed.
    Return strict JSON.
    """
    
    content_list = [{"type": "text", "text": text_prompt}]
    
    # Process Images
    cit_b64 = get_base64_image(citizen_image_url)
    work_b64 = get_base64_image(worker_image_url)
    
    if cit_b64:
        content_list.append({"type": "text", "text": "Before Image (Citizen):"})
        content_list.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{cit_b64}"}})
    if work_b64:
        content_list.append({"type": "text", "text": "After Image (Worker):"})
        content_list.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{work_b64}"}})

    try:
        completion = client.chat.completions.create(
            model=settings.VISION_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content_list}
            ],
            response_format={"type": "json_object"},
            temperature=0.1
        )
        text = completion.choices[0].message.content.strip()
        parsed = json.loads(text)
        return parsed
    except Exception as e:
        print("Verification Agent AI Error:", e)
        # Fail closed on exceptions/rate limits so invalid resolutions don't slip through
        return {
            "is_valid": False, 
            "qa_feedback": "AI Verification Services are currently busy or rate-limited. Please wait a moment and try again."
        }
