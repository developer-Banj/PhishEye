from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 🔹 Add this import
from pydantic import BaseModel
import pickle
import numpy as np

from Backend.utils.preprocessing import text_preprocessing, drop_stopwords, delete_one_characters

app = FastAPI(title="Phishing Email Detector API")

# 🔐 Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://mail.google.com"],  # Only allow Gmail
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and feature importance
with open("Backend/model/pipeline.pkl", "rb") as f:
    pipeline = pickle.load(f)

with open("Backend/model/feature_importance.pkl", "rb") as f:
    feature_importance = pickle.load(f)

vectorizer = pipeline.named_steps['tfidfvectorizer']
model = pipeline.named_steps['logisticregression']

class EmailRequest(BaseModel):
    text: str

@app.post("/predict")
def predict_and_explain_email(request: EmailRequest):
    email = request.text
    preprocessed = delete_one_characters(drop_stopwords(text_preprocessing(email)))
    
    # Prediction and confidence
    prediction = pipeline.predict([preprocessed])[0]
    proba = pipeline.predict_proba([preprocessed])[0]
    label = "Phishing" if prediction == 1 else "Legitimate"

    # Explanation
    features = vectorizer.transform([preprocessed])
    feature_array = features.toarray()[0]
    feature_names = vectorizer.get_feature_names_out()
    
    top_words = []
    for idx in np.where(feature_array != 0)[0]:
        word = feature_names[idx]
        weight = feature_importance.get(word, 0)
        impact = feature_array[idx] * weight
        top_words.append((word, round(impact, 4)))

    top_words = sorted(top_words, key=lambda x: abs(x[1]), reverse=True)[:5]
    explanation = [{"word": w, "impact": i} for w, i in top_words]

    return {
        "prediction": label,
        "confidence": {
            "Legitimate": round(proba[0], 4),
            "Phishing": round(proba[1], 4)
        },
        "top_contributing_words": explanation
    }

# To run: uvicorn main:app --reload
