import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
print(f"Using API Key: {api_key[:5] if api_key else 'None'}... (truncated for security)")

if not api_key or api_key == "your_groq_api_key_here":
    print("Error: Invalid or missing GROQ_API_KEY in .env")
    exit(1)

client = Groq(api_key=api_key)

try:
    completion = client.chat.completions.create(
        model="openai/gpt-oss-20b",
        messages=[{"role": "user", "content": "Hello, this is a test. Reply with 'Groq works!'"}],
        temperature=0.7,
        max_tokens=20
    )
    print("Success:", completion.choices[0].message.content.strip())
except Exception as e:
    print("Error:", e)
