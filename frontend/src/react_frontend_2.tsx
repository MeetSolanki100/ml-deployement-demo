import React, { useState, useEffect } from 'react';
import { Home, Calculator, TrendingUp, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const HousePricePrediction = () => {
  const [formData, setFormData] = useState({
    bedrooms: '',
    bathrooms: '',
    sqft_living: '',
    floors: '',
    age: ''
  });
  
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [apiHealth, setApiHealth] = useState(false);

  // API base URL - change this to your Flask server URL
  const API_BASE_URL = 'http://localhost:5000';

  // Check API health on component mount
  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/health`);
      if (response.ok) {
        setApiHealth(true);
      }
    } catch (err) {
      setApiHealth(false);
      console.log('API not available - using mock data for demo');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError('');
    if (success) setSuccess(false);
  };

  const validateForm = () => {
    const { bedrooms, bathrooms, sqft_living, floors, age } = formData;
    
    if (!bedrooms || !bathrooms || !sqft_living || !floors || !age) {
      return 'Please fill in all fields';
    }
    
    if (bedrooms < 1 || bedrooms > 10) {
      return 'Bedrooms must be between 1 and 10';
    }
    
    if (bathrooms < 0.5 || bathrooms > 10) {
      return 'Bathrooms must be between 0.5 and 10';
    }
    
    if (sqft_living < 100 || sqft_living > 20000) {
      return 'Square footage must be between 100 and 20,000';
    }
    
    if (floors < 1 || floors > 5) {
      return 'Floors must be between 1 and 5';
    }
    
    if (age < 0 || age > 200) {
      return 'Age must be between 0 and 200 years';
    }
    
    return null;
  };

  const mockPredict = (data) => {
    // Simple mock prediction for demo when API is not available
    const price = (
      parseFloat(data.bedrooms) * 15000 +
      parseFloat(data.bathrooms) * 20000 +
      parseFloat(data.sqft_living) * 150 +
      parseFloat(data.floors) * 10000 -
      parseFloat(data.age) * 2000 +
      200000
    );
    
    return Math.max(price, 100000);
  };

  const handleSubmit = async () => {
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError('');
    setPrediction(null);
    
    try {
      if (apiHealth) {
        // Use real API
        const response = await fetch(`${API_BASE_URL}/api/predict`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setPrediction(data);
          setSuccess(true);
        } else {
          setError(data.error || 'Prediction failed');
        }
      } else {
        // Use mock prediction for demo
        const mockPrice = mockPredict(formData);
        setPrediction({
          predicted_price: mockPrice,
          formatted_price: `$${mockPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          input_features: formData
        });
        setSuccess(true);
      }
    } catch (err) {
      setError('Failed to connect to the prediction service');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      bedrooms: '',
      bathrooms: '',
      sqft_living: '',
      floors: '',
      age: ''
    });
    setPrediction(null);
    setError('');
    setSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Home className="h-12 w-12 text-indigo-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">House Price Predictor</h1>
          </div>
          <p className="text-lg text-gray-600">
            Get instant price predictions for your property using machine learning
          </p>
          
          {/* API Status */}
          <div className="mt-4 flex items-center justify-center">
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
              apiHealth 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {apiHealth ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Connected to ML API
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Demo Mode (API Offline)
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center mb-6">
              <Calculator className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-2xl font-semibold text-gray-800">Property Details</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Bedrooms
                </label>
                <input
                  type="number"
                  name="bedrooms"
                  value={formData.bedrooms}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                  placeholder="e.g., 3"
                  min="1"
                  max="10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Bathrooms
                </label>
                <input
                  type="number"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                  placeholder="e.g., 2.5"
                  min="0.5"
                  max="10"
                  step="0.5"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Living Area (sq ft)
                </label>
                <input
                  type="number"
                  name="sqft_living"
                  value={formData.sqft_living}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                  placeholder="e.g., 2000"
                  min="100"
                  max="20000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Floors
                </label>
                <select
                  name="floors"
                  value={formData.floors}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                >
                  <option value="">Select floors</option>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                  <option value="2.5">2.5</option>
                  <option value="3">3</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age of House (years)
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200"
                  placeholder="e.g., 10"
                  min="0"
                  max="200"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Predict Price
                    </>
                  )}
                </button>
                
                <button
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Prediction Results</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}
            
            {success && prediction && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-800 mb-2">
                    {prediction.formatted_price}
                  </div>
                  <p className="text-green-600">Estimated House Price</p>
                </div>
                
                <div className="mt-6 pt-6 border-t border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3">Input Summary:</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                    <div>Bedrooms: {prediction.input_features?.bedrooms || formData.bedrooms}</div>
                    <div>Bathrooms: {prediction.input_features?.bathrooms || formData.bathrooms}</div>
                    <div>Living Area: {(prediction.input_features?.sqft_living || formData.sqft_living).toLocaleString()} sq ft</div>
                    <div>Floors: {prediction.input_features?.floors || formData.floors}</div>
                    <div>Age: {prediction.input_features?.age || formData.age} years</div>
                  </div>
                </div>
              </div>
            )}
            
            {!prediction && !error && !loading && (
              <div className="text-center text-gray-500 py-12">
                <Home className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Fill out the form and click "Predict Price" to get your house price estimate</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8 text-gray-600">
          <p className="text-sm">
            This prediction is based on a machine learning model trained on sample data. 
            Actual prices may vary based on location, market conditions, and other factors.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HousePricePrediction;