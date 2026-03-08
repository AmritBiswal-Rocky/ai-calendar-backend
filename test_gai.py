# test_gai.py

import os
import spacy
import google.generativeai as genai

# -------------------------------
# Part 1: Spacy NLP Test
# -------------------------------

try:
    # Load the small English model
    nlp = spacy.load("en_core_web_sm")
except OSError:
    print("Downloading 'en_core_web_sm' model for spaCy...")
    from spacy.cli.download import download  # ✅ correct import
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

text = "Google is launching new AI tools in London."
doc = nlp(text)

print("Spacy Named Entities:")
for ent in doc.ents:
    print(f"  - {ent.text} ({ent.label_})")

# -------------------------------
# Part 2: Google Generative AI Test
# -------------------------------

# --- Google Generative AI setup ---
API_KEY = "YOUR_GEMINI_API_KEY"  # replace with your real key

# Some versions use genai.configure(), some don’t — handle both
if hasattr(genai, "configure"):
    genai.configure(api_key=API_KEY)
else:
    os.environ["GOOGLE_API_KEY"] = API_KEY

# --- Create Gemini model client ---
model = genai.GenerativeModel("gemini-1.5-flash")

# --- Gemini example ---
prompt = "Write a short motivational quote about coding."
try:
    response = model.generate_content(prompt)
    print("\nGoogle Generative AI Response:")
    print(response.text)

except Exception as e:
    print("Error with Google Generative AI call:", e)
