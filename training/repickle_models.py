# training/repickle_models.py
# Utility to (re)train and re-pickle models with a specific scikit-learn version
# so the backend can load them reliably.
#
# NOTE: Replace the data loading section with your real dataset.

import os
import joblib
from pathlib import Path

try:
    from sklearn.tree import DecisionTreeClassifier
    from sklearn.ensemble import RandomForestClassifier
except Exception as e:
    raise SystemExit(
        "scikit-learn is not installed in this environment.\n"
        "Install it first, e.g.:\n\n"
        "  pip install -U scikit-learn==1.5.2\n\n"
        f"Original error: {e}"
    )

# --------------------------------------------------------------------------------------
# 1) Load or generate training data
# --------------------------------------------------------------------------------------
# TODO: Replace this with your actual data loading logic.
# Example placeholders below create a tiny synthetic dataset just for demonstration.

def load_data():
    # Example: tiny dummy dataset (binary classification)
    # Replace with your real feature matrix X and labels y
    X = [
        [0.1, 1.2, 3.4],
        [1.1, 0.2, 0.4],
        [0.3, 1.5, 3.1],
        [2.1, 0.1, 0.7],
        [1.9, 0.0, 1.1],
    ]
    y = [0, 1, 0, 1, 1]
    return X, y


# --------------------------------------------------------------------------------------
# 2) Train models
# --------------------------------------------------------------------------------------

def train_models(X, y):
    print("⚡ Training DecisionTreeClassifier...")
    model_dt = DecisionTreeClassifier(random_state=42).fit(X, y)

    print("⚡ Training RandomForestClassifier...")
    model_rf = RandomForestClassifier(n_estimators=50, random_state=42).fit(X, y)

    return model_dt, model_rf


# --------------------------------------------------------------------------------------
# 3) Save models under backend/models/
# --------------------------------------------------------------------------------------

def save_models(model_dt, model_rf):
    out_dir = Path(__file__).resolve().parents[1] / "backend" / "models"
    out_dir.mkdir(parents=True, exist_ok=True)

    dt_path = out_dir / "decision_tree.pkl"
    rf_path = out_dir / "random_forest.pkl"

    joblib.dump(model_dt, dt_path)
    joblib.dump(model_rf, rf_path)

    print(f"✅ Models saved to: {dt_path} and {rf_path}")


def main():
    X, y = load_data()
    model_dt, model_rf = train_models(X, y)
    save_models(model_dt, model_rf)


if __name__ == "__main__":
    main()
