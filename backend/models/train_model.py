from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

# Load sample data
iris = load_iris()
X = iris.data
y = iris.target

# Split into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train the model
model = RandomForestClassifier()
model.fit(X_train, y_train)

# Make sure models folder exists
model_dir = os.path.dirname(__file__)
model_path = os.path.join(model_dir, "model.pkl")

# Save the trained model
joblib.dump(model, model_path)

print(f"✅ Model trained and saved to {model_path}")
