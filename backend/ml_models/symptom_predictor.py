import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import re
import os

class SymptomPredictor:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
        self.classifier = RandomForestClassifier(n_estimators=100, random_state=42)
        self.label_encoder = LabelEncoder()
        self.lemmatizer = WordNetLemmatizer()
        
        # Download required NLTK data
        try:
            nltk.data.find('tokenizers/punkt')
            nltk.data.find('corpora/stopwords')
            nltk.data.find('corpora/wordnet')
        except LookupError:
            nltk.download('punkt')
            nltk.download('stopwords')
            nltk.download('wordnet')
    
    def preprocess_text(self, text):
        """Clean and preprocess symptom text"""
        if not text:
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and lemmatize
        stop_words = set(stopwords.words('english'))
        tokens = [self.lemmatizer.lemmatize(token) for token in tokens if token not in stop_words]
        
        return ' '.join(tokens)
    
    def load_dataset(self, dataset_path=None):
        """Load and prepare the dataset"""
        if dataset_path and os.path.exists(dataset_path):
            df = pd.read_csv(dataset_path)
        else:
            # Create a sample dataset if no file provided
            df = self.create_sample_dataset()
        
        return df
    
    def create_sample_dataset(self):
        """Create an expanded sample dataset for better training"""
        # Create a more comprehensive dataset with varied symptoms
        symptoms_data = [
            # Viral infections
            'fever headache body ache chills fatigue', 'high temperature muscle pain weakness tiredness',
            'fever cough sore throat runny nose sneezing', 'temperature body aches cold symptoms',
            
            # Respiratory issues
            'cough shortness breath chest tightness wheezing', 'difficulty breathing chest pain cough',
            'persistent cough chest congestion breathing problems', 'wheezing shortness breath chest discomfort',
            
            # Digestive issues
            'nausea vomiting stomach pain abdominal cramps', 'upset stomach diarrhea abdominal pain',
            'stomach ache nausea bloating digestive problems', 'abdominal cramps diarrhea stomach upset',
            
            # Neurological symptoms
            'headache dizziness vision problems confusion', 'severe headache neck stiffness light sensitivity',
            'dizziness balance problems coordination issues', 'headache confusion memory problems',
            
            # Musculoskeletal
            'joint pain muscle stiffness back ache', 'muscle pain joint swelling stiffness',
            'back pain neck stiffness muscle tension', 'joint inflammation muscle weakness',
            
            # Skin conditions
            'skin rash itching irritation redness', 'itchy skin rash bumps inflammation',
            'skin irritation rash allergic reaction', 'redness itching skin problems',
            
            # Cardiovascular
            'chest pain heart palpitations shortness breath', 'chest discomfort rapid heartbeat',
            'heart racing chest tightness breathing difficulty', 'palpitations chest pain dizziness',
            
            # Allergic reactions
            'sneezing runny nose watery eyes itching', 'allergic reaction itchy eyes sneezing',
            'seasonal allergies congestion sneezing itching', 'hay fever symptoms runny nose',
            
            # Fatigue syndromes
            'chronic fatigue muscle pain sleep problems', 'extreme tiredness muscle aches',
            'fatigue weakness muscle pain joint aches', 'exhaustion muscle fatigue weakness',
            
            # Infections
            'fever chills sweating body aches infection', 'high temperature chills muscle pain',
            'fever headache nausea infection symptoms', 'temperature chills body aches'
        ]
        
        conditions = [
            # Viral infections
            'Viral Infection', 'Flu', 'Common Cold', 'Viral Syndrome',
            
            # Respiratory
            'Bronchitis', 'Asthma', 'Respiratory Infection', 'COPD',
            
            # Digestive
            'Gastroenteritis', 'Food Poisoning', 'IBS', 'Stomach Flu',
            
            # Neurological
            'Tension Headache', 'Migraine', 'Vertigo', 'Concussion',
            
            # Musculoskeletal
            'Muscle Strain', 'Arthritis', 'Back Pain', 'Fibromyalgia',
            
            # Skin
            'Dermatitis', 'Eczema', 'Allergic Reaction', 'Contact Dermatitis',
            
            # Cardiovascular
            'Anxiety', 'Heart Palpitations', 'Chest Wall Pain', 'Panic Attack',
            
            # Allergies
            'Seasonal Allergies', 'Hay Fever', 'Allergic Rhinitis', 'Environmental Allergies',
            
            # Fatigue
            'Chronic Fatigue Syndrome', 'Sleep Disorder', 'Fibromyalgia', 'Depression',
            
            # Infections
            'Bacterial Infection', 'Viral Infection', 'Upper Respiratory Infection', 'Systemic Infection'
        ]
        
        severity_levels = [
            'mild', 'moderate', 'severe', 'mild',
            'moderate', 'severe', 'mild', 'moderate',
            'severe', 'mild', 'moderate', 'severe',
            'mild', 'moderate', 'severe', 'mild',
            'moderate', 'severe', 'mild', 'moderate',
            'severe', 'mild', 'moderate', 'severe',
            'mild', 'moderate', 'severe', 'mild',
            'moderate', 'severe', 'mild', 'moderate',
            'severe', 'mild', 'moderate', 'severe',
            'mild', 'moderate', 'severe', 'mild'
        ]

        data = {
            'symptoms': symptoms_data,
            'predicted_condition': conditions,
            'severity': severity_levels
        }
        return pd.DataFrame(data)
    
    def train_model(self, dataset_path=None):
        """Train the ML model"""
        # Load dataset
        df = self.load_dataset(dataset_path)
        
        # Preprocess symptoms
        df['processed_symptoms'] = df['symptoms'].apply(self.preprocess_text)
        
        # Prepare features and labels
        X = df['processed_symptoms']
        y_condition = df['predicted_condition']
        y_severity = df['severity']
        
        # Vectorize text
        X_vectorized = self.vectorizer.fit_transform(X)
        
        # Encode labels
        y_condition_encoded = self.label_encoder.fit_transform(y_condition)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_vectorized, y_condition_encoded, test_size=0.2, random_state=42
        )
        
        # Train model
        self.classifier.fit(X_train, y_train)
        
        # Evaluate
        y_pred = self.classifier.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Model accuracy: {accuracy:.2f}")
        
        # Save model components
        self.save_model()
        
        return accuracy
    
    def predict(self, symptoms_text):
        """Predict condition and severity from symptoms"""
        # Preprocess input
        processed_text = self.preprocess_text(symptoms_text)
        
        # Vectorize
        X_vectorized = self.vectorizer.transform([processed_text])
        
        # Predict condition
        condition_pred = self.classifier.predict(X_vectorized)[0]
        condition_prob = self.classifier.predict_proba(X_vectorized)[0]
        
        # Get condition name
        condition_name = self.label_encoder.inverse_transform([condition_pred])[0]
        
        # Get confidence score
        confidence = max(condition_prob)
        
        # Simple severity prediction based on keywords
        severity = self.predict_severity(symptoms_text)
        
        return {
            'predicted_condition': condition_name,
            'confidence': float(confidence),
            'predicted_severity': severity,
            'recommendations': self.get_recommendations(condition_name, severity)
        }
    
    def predict_severity(self, symptoms_text):
        """Simple rule-based severity prediction"""
        severe_keywords = ['severe', 'intense', 'excruciating', 'unbearable', 'difficulty breathing', 'chest pain']
        moderate_keywords = ['moderate', 'persistent', 'chronic', 'frequent']
        
        symptoms_lower = symptoms_text.lower()
        
        if any(keyword in symptoms_lower for keyword in severe_keywords):
            return 'severe'
        elif any(keyword in symptoms_lower for keyword in moderate_keywords):
            return 'moderate'
        else:
            return 'mild'
    
    def get_recommendations(self, condition, severity):
        """Get basic recommendations based on condition and severity"""
        recommendations = {
            'Viral Infection': 'Rest, stay hydrated, monitor temperature',
            'Common Cold': 'Rest, drink fluids, consider over-the-counter medications',
            'Respiratory Issue': 'Seek medical attention, avoid strenuous activity',
            'Gastroenteritis': 'Stay hydrated, BRAT diet, rest',
            'Arthritis': 'Anti-inflammatory medications, gentle exercise',
            'Fatigue Syndrome': 'Rest, stress management, gradual activity increase',
            'Skin Condition': 'Keep area clean, avoid irritants, topical treatment',
            'Musculoskeletal': 'Rest, ice/heat therapy, gentle stretching'
        }
        
        base_rec = recommendations.get(condition, 'Consult healthcare provider')
        
        if severity == 'severe':
            return f"URGENT: Seek immediate medical attention. {base_rec}"
        elif severity == 'moderate':
            return f"Consider medical consultation. {base_rec}"
        else:
            return base_rec
    
    def save_model(self, model_dir='ml_models/saved_models'):
        """Save trained model components"""
        os.makedirs(model_dir, exist_ok=True)
        
        joblib.dump(self.classifier, f'{model_dir}/classifier.pkl')
        joblib.dump(self.vectorizer, f'{model_dir}/vectorizer.pkl')
        joblib.dump(self.label_encoder, f'{model_dir}/label_encoder.pkl')
    
    def load_model(self, model_dir='ml_models/saved_models'):
        """Load trained model components"""
        try:
            self.classifier = joblib.load(f'{model_dir}/classifier.pkl')
            self.vectorizer = joblib.load(f'{model_dir}/vectorizer.pkl')
            self.label_encoder = joblib.load(f'{model_dir}/label_encoder.pkl')
            return True
        except FileNotFoundError:
            print("Model files not found. Please train the model first.")
            return False
