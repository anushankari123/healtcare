import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

class DiseasePredictor:
    def __init__(self):
        self.model = None
        self.label_encoder = LabelEncoder()
        self.symptoms_list = []
        self.diseases_list = []
        self.feature_importances = None
        
    def load_and_preprocess_data(self, csv_path):
        """Load and preprocess the dataset"""
        try:
            # Read CSV file
            df = pd.read_csv(csv_path)
            print(f"Dataset loaded successfully with shape: {df.shape}")
            
            # Check if 'prognosis' column exists
            if 'prognosis' not in df.columns:
                print("Error: 'prognosis' column not found in dataset")
                return None, None
            
            # Features = all symptom columns (0/1 values)
            X = df.drop('prognosis', axis=1).values
            y = self.label_encoder.fit_transform(df['prognosis'])

            # Save metadata
            self.symptoms_list = df.drop('prognosis', axis=1).columns.tolist()
            self.diseases_list = sorted(df['prognosis'].unique())
            
            print(f"Number of symptoms: {len(self.symptoms_list)}")
            print(f"Number of diseases: {len(self.diseases_list)}")
            print(f"Diseases: {self.diseases_list}")

            return X, y

        except FileNotFoundError:
            print(f"Error: Dataset file not found at {csv_path}")
            return None, None
        except Exception as e:
            print(f"Error loading data: {e}")
            return None, None

    def train_model(self, csv_path):
        """Train the Random Forest model"""
        print("Starting model training...")
        X, y = self.load_and_preprocess_data(csv_path)
        
        if X is None or y is None:
            print("Failed to load data. Training aborted.")
            return False
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        # Train the model
        self.model = RandomForestClassifier(
            n_estimators=100, 
            random_state=42,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2
        )
        
        self.model.fit(X_train, y_train)
        
        # Get feature importances
        self.feature_importances = self.model.feature_importances_
        
        # Evaluate the model
        y_pred = self.model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        
        print(f"Model trained successfully!")
        print(f"Training accuracy: {accuracy:.4f}")
        print(f"Training set size: {len(X_train)}")
        print(f"Test set size: {len(X_test)}")
        
        # Print classification report
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=self.diseases_list))
        
        return True
    
    def predict_disease(self, symptoms):
        """Predict disease based on symptoms"""
        if self.model is None:
            return {"error": "Model not trained", "predicted_disease": None, "confidence": 0.0}
        
        if not symptoms:
            return {"error": "No symptoms provided", "predicted_disease": None, "confidence": 0.0}
        
        try:
            # Create input vector
            X_input = np.zeros(len(self.symptoms_list))
            matched_symptoms = []
            
            for symptom in symptoms:
                # Clean symptom input (remove extra spaces, convert to lowercase)
                clean_symptom = symptom.strip().lower().replace(' ', '_')
                
                # Try exact match first
                if clean_symptom in self.symptoms_list:
                    idx = self.symptoms_list.index(clean_symptom)
                    X_input[idx] = 1
                    matched_symptoms.append(clean_symptom)
                else:
                    # Try partial matching
                    for i, symptom_in_list in enumerate(self.symptoms_list):
                        if clean_symptom in symptom_in_list or symptom_in_list in clean_symptom:
                            X_input[i] = 1
                            matched_symptoms.append(symptom_in_list)
                            break
            
            if not matched_symptoms:
                return {
                    "error": "No matching symptoms found in the model",
                    "predicted_disease": None,
                    "confidence": 0.0,
                    "available_symptoms": self.symptoms_list[:20]  # Show first 20 symptoms as examples
                }
            
            # Make prediction
            prediction = self.model.predict([X_input])
            prediction_proba = self.model.predict_proba([X_input])
            
            # Get predicted disease
            predicted_disease = self.label_encoder.inverse_transform(prediction)[0]
            
            # Get confidence (probability of the predicted class)
            confidence = np.max(prediction_proba)
            
            # Get top 3 predictions with probabilities
            top_3_indices = np.argsort(prediction_proba[0])[-3:][::-1]
            top_3_predictions = []
            
            for idx in top_3_indices:
                disease = self.label_encoder.inverse_transform([idx])[0]
                probability = prediction_proba[0][idx]
                top_3_predictions.append({
                    "disease": disease,
                    "probability": float(probability)
                })
            
            return {
                "predicted_disease": predicted_disease,
                "confidence": float(confidence),
                "matched_symptoms": matched_symptoms,
                "top_3_predictions": top_3_predictions,
                "error": None
            }
            
        except Exception as e:
            print(f"Prediction error: {e}")
            return {"error": f"Prediction failed: {str(e)}", "predicted_disease": None, "confidence": 0.0}

    def get_symptom_suggestions(self, partial_symptom):
        """Get symptom suggestions based on partial input"""
        if not self.symptoms_list:
            return []
        
        partial_clean = partial_symptom.strip().lower()
        suggestions = []
        
        for symptom in self.symptoms_list:
            if partial_clean in symptom.lower():
                suggestions.append(symptom)
        
        return suggestions[:10]  # Return top 10 suggestions
    
    def save_model(self, model_path='disease_model.joblib'):
        """Save the trained model"""
        if self.model:
            model_data = {
                'model': self.model,
                'label_encoder': self.label_encoder,
                'symptoms_list': self.symptoms_list,
                'diseases_list': self.diseases_list,
                'feature_importances': self.feature_importances
            }
            joblib.dump(model_data, model_path)
            print(f"Model saved successfully at {model_path}")
            return True
        else:
            print("No trained model to save")
            return False
    
    def load_model(self, model_path='disease_model.joblib'):
        """Load a trained model"""
        try:
            if os.path.exists(model_path):
                data = joblib.load(model_path)
                self.model = data['model']
                self.label_encoder = data['label_encoder']
                self.symptoms_list = data['symptoms_list']
                self.diseases_list = data['diseases_list']
                self.feature_importances = data.get('feature_importances', None)
                print(f"Model loaded successfully from {model_path}")
                print(f"Available diseases: {len(self.diseases_list)}")
                print(f"Available symptoms: {len(self.symptoms_list)}")
                return True
            else:
                print(f"Model file not found at {model_path}")
                return False
        except Exception as e:
            print(f"Error loading model: {e}")
            return False

# Updated common symptoms list (cleaned and standardized)
COMMON_SYMPTOMS = [
    'itching', 'skin_rash', 'nodal_skin_eruptions', 'continuous_sneezing',
    'shivering', 'chills', 'joint_pain', 'stomach_pain', 'acidity',
    'ulcers_on_tongue', 'muscle_wasting', 'vomiting', 'burning_micturition',
    'spotting_urination', 'fatigue', 'weight_gain', 'anxiety',
    'cold_hands_and_feets', 'mood_swings', 'weight_loss', 'restlessness',
    'lethargy', 'patches_in_throat', 'irregular_sugar_level',
    'cough', 'high_fever', 'sunken_eyes', 'breathlessness', 'sweating',
    'dehydration', 'indigestion', 'headache', 'yellowish_skin',
    'dark_urine', 'nausea', 'loss_of_appetite', 'pain_behind_the_eyes',
    'back_pain', 'constipation', 'abdominal_pain', 'diarrhoea',
    'mild_fever', 'yellow_urine', 'yellowing_of_eyes', 'acute_liver_failure',
    'fluid_overload', 'swelling_of_stomach', 'swelled_lymph_nodes',
    'malaise', 'blurred_and_distorted_vision', 'phlegm', 'throat_irritation',
    'redness_of_eyes', 'sinus_pressure', 'runny_nose', 'congestion',
    'chest_pain', 'weakness_in_limbs', 'fast_heart_rate',
    'pain_during_bowel_movements', 'pain_in_anal_region', 'bloody_stool',
    'irritation_in_anus', 'neck_pain', 'dizziness', 'cramps',
    'bruising', 'obesity', 'swollen_legs', 'swollen_blood_vessels',
    'puffy_face_and_eyes', 'enlarged_thyroid', 'brittle_nails',
    'swollen_extremeties', 'excessive_hunger', 'extra_marital_contacts',
    'drying_and_tingling_lips', 'slurred_speech', 'knee_pain', 'hip_joint_pain',
    'muscle_weakness', 'stiff_neck', 'swelling_joints', 'movement_stiffness',
    'spinning_movements', 'loss_of_balance', 'unsteadiness',
    'weakness_of_one_body_side', 'loss_of_smell', 'bladder_discomfort',
    'foul_smell_of_urine', 'continuous_feel_of_urine', 'passage_of_gases',
    'internal_itching', 'toxic_look_(typhos)', 'depression', 'irritability',
    'muscle_pain', 'altered_sensorium', 'red_spots_over_body', 'belly_pain',
    'abnormal_menstruation', 'dischromic_patches', 'watering_from_eyes',
    'increased_appetite', 'polyuria', 'family_history', 'mucoid_sputum',
    'rusty_sputum', 'lack_of_concentration', 'visual_disturbances',
    'receiving_blood_transfusion', 'receiving_unsterile_injections',
    'coma', 'stomach_bleeding', 'distention_of_abdomen',
    'history_of_alcohol_consumption', 'blood_in_sputum',
    'prominent_veins_on_calf', 'palpitations', 'painful_walking',
    'pus_filled_pimples', 'blackheads', 'scurring', 'skin_peeling',
    'silver_like_dusting', 'small_dents_in_nails', 'inflammatory_nails',
    'blister', 'red_sore_around_nose', 'yellow_crust_ooze'
]

def train_model_if_needed(dataset_path, model_path):
    """Utility function to train model if it doesn't exist"""
    predictor = DiseasePredictor()
    
    if os.path.exists(model_path):
        print("Loading existing model...")
        success = predictor.load_model(model_path)
        if success:
            return predictor
    
    print("Training new model...")
    if os.path.exists(dataset_path):
        success = predictor.train_model(dataset_path)
        if success:
            predictor.save_model(model_path)
            return predictor
    else:
        print(f"Dataset not found at {dataset_path}")
    
    return None