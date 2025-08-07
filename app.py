from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Global variables for model and scaler
model = None
scaler = None
feature_names = ['bedrooms', 'bathrooms', 'sqft_living', 'floors', 'age']

def create_sample_data():
    """Create sample house data for training"""
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        'bedrooms': np.random.randint(1, 6, n_samples),
        'bathrooms': np.random.randint(1, 4, n_samples) + np.random.rand(n_samples),
        'sqft_living': np.random.randint(800, 5000, n_samples),
        'floors': np.random.choice([1, 1.5, 2, 2.5, 3], n_samples),
        'age': np.random.randint(0, 50, n_samples)
    }
    
    # Create realistic price based on features
    prices = (
        data['bedrooms'] * 15000 +
        data['bathrooms'] * 20000 +
        data['sqft_living'] * 150 +
        data['floors'] * 10000 -
        data['age'] * 2000 +
        np.random.normal(0, 20000, n_samples) +
        200000  # base price
    )
    
    data['price'] = np.maximum(prices, 100000)  # minimum price of 100k
    
    return pd.DataFrame(data)

def train_model():
    """Train the house price prediction model"""
    global model, scaler
    
    # Create sample data
    df = create_sample_data()
    
    # Prepare features and target
    X = df[feature_names]
    y = df['price']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train the model
    model = LinearRegression()
    model.fit(X_train_scaled, y_train)
    
    # Evaluate the model
    y_pred = model.predict(X_test_scaled)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model trained successfully!")
    print(f"Mean Squared Error: {mse:.2f}")
    print(f"R² Score: {r2:.4f}")
    
    # Save the model and scaler
    joblib.dump(model, 'house_price_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')

def load_model():
    """Load the trained model and scaler"""
    global model, scaler
    
    if os.path.exists('house_price_model.pkl') and os.path.exists('scaler.pkl'):
        model = joblib.load('house_price_model.pkl')
        scaler = joblib.load('scaler.pkl')
        print("Model loaded successfully!")
    else:
        print("No saved model found. Training new model...")
        train_model()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "message": "House Price Prediction API is running"})

@app.route('/api/predict', methods=['POST'])
def predict_price():
    """Predict house price based on input features"""
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate required fields
        required_fields = feature_names
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Extract features
        features = [
            float(data['bedrooms']),
            float(data['bathrooms']),
            float(data['sqft_living']),
            float(data['floors']),
            float(data['age'])
        ]
        
        # Validate feature ranges
        if features[0] < 1 or features[0] > 10:
            return jsonify({"error": "Bedrooms must be between 1 and 10"}), 400
        if features[1] < 0.5 or features[1] > 10:
            return jsonify({"error": "Bathrooms must be between 0.5 and 10"}), 400
        if features[2] < 100 or features[2] > 20000:
            return jsonify({"error": "Square footage must be between 100 and 20,000"}), 400
        if features[3] < 1 or features[3] > 5:
            return jsonify({"error": "Floors must be between 1 and 5"}), 400
        if features[4] < 0 or features[4] > 200:
            return jsonify({"error": "Age must be between 0 and 200 years"}), 400
        
        # Scale features
        features_scaled = scaler.transform([features])
        
        # Make prediction
        prediction = model.predict(features_scaled)[0]
        
        # Ensure minimum price
        prediction = max(prediction, 50000)
        
        return jsonify({
            "predicted_price": round(prediction, 2),
            "formatted_price": f"${prediction:,.2f}",
            "input_features": {
                "bedrooms": features[0],
                "bathrooms": features[1],
                "sqft_living": features[2],
                "floors": features[3],
                "age": features[4]
            }
        })
        
    except ValueError as e:
        return jsonify({"error": f"Invalid input data: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500

@app.route('/api/model-info', methods=['GET'])
def model_info():
    """Get information about the trained model"""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    return jsonify({
        "model_type": "Linear Regression",
        "features": feature_names,
        "feature_descriptions": {
            "bedrooms": "Number of bedrooms (1-10)",
            "bathrooms": "Number of bathrooms (0.5-10)",
            "sqft_living": "Living area in square feet (100-20,000)",
            "floors": "Number of floors (1-5)",
            "age": "Age of the house in years (0-200)"
        }
    })

if __name__ == '__main__':
    # Load or train the model
    load_model()
    
    # Run the Flask app
    print("Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)