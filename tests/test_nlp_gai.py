import spacy
from spacy.cli.download import download
import google.generativeai as genai

# --- spaCy Test ---
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

# --- Google Generative AI Test ---
API_KEY = "AIzaSyB1GWCjnv3EJvEgPIr0boFmcR0un0krrF8"  # replace with your actual key

genai.configure(api_key=API_KEY)

# Use the `GenerativeModel` API the new way
model = genai.GenerativeModel(model_name="gemini-1.5-flash")

prompt = "Write a short motivational quote about coding."

response = model.generate_content(prompt)

print("\nGoogle Generative AI Response:")
print(response.text)
