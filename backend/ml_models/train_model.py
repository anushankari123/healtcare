from .symptom_predictor import SymptomPredictor

def train_symptom_model():
    """Train and save the symptom prediction model"""
    predictor = SymptomPredictor()
    
    # Train with sample data (replace with your dataset path)
    accuracy = predictor.train_model()
    
    print(f"Model trained successfully with accuracy: {accuracy:.2f}")
    return predictor

if __name__ == "__main__":
    train_symptom_model()