# tests/test_nlp_gai.py

import os
import spacy
from spacy.cli.download import download
from google import genai   # ✅ comes from google-genai package

# --- SpaCy test ---
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

text = "Google is opening a new AI research center in London."
doc = nlp(text)

print("Spacy Named Entities:")
for ent in doc.ents:
    print(f"  - {ent.text} ({ent.label_})")

# --- Google GenAI test ---
API_KEY = os.getenv("GOOGLE_API_KEY", "YOUR_API_KEY_HERE")

try:
    client = genai.Client(api_key=API_KEY)

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        contents="Write a short motivational quote about coding."
    )

    print("\nGoogle GenAI Response:")
    if hasattr(response, "text") and response.text:
        print(response.text.strip())
    else:
        print(response)
except Exception as e:
    print("\nGoogle GenAI test failed:", e)
