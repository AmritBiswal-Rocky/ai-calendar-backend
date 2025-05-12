from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, auth
from dotenv import load_dotenv
import os
from supabase import create_client, Client
import joblib
from functools import wraps

# Load environment variables
load_dotenv()

# Global variables
model = None
supabase: Client = None

# Firebase token verification decorator
def firebase_token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization token missing"}), 401
        try:
            id_token = auth_header.split(" ")[1]
            decoded_token = auth.verify_id_token(id_token)
            request.user = decoded_token
        except Exception as e:
            return jsonify({"error": f"Token verification failed: {str(e)}"}), 401
        return f(*args, **kwargs)
    return decorated_function

# Factory function to create Flask app
def create_app():
    global model, supabase

    app = Flask(__name__)
    CORS(app)

    # Initialize Firebase
    if not firebase_admin._apps:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "firebase-service-account.json")
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

    # Initialize Supabase
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_SERVICE_ROLE = os.getenv("SUPABASE_SERVICE_ROLE")
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

    # Load ML model
    model_path = os.path.join(os.path.dirname(__file__), "models", "model.pkl")
    try:
        model = joblib.load(model_path)
        print("✅ ML model loaded.")
    except Exception as e:
        model = None
        print(f"❌ Model load failed: {e}")

    # Routes
    @app.route("/")
    def home():
        return jsonify({"message": "Backend is running!"})

    @app.route("/verifyIdToken", methods=["POST"])
    def verify_token():
        try:
            data = request.get_json()
            id_token = data.get("idToken")
            if not id_token:
                return jsonify({"error": "Missing ID token"}), 400

            decoded_token = auth.verify_id_token(id_token)
            return jsonify({"uid": decoded_token["uid"]}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 401

    @app.route("/sync-profile", methods=["POST"])
    @firebase_token_required
    def sync_profile():
        user_info = request.user
        if not user_info:
            return jsonify({"error": "Unauthorized"}), 401

        email = user_info.get("email")
        name = user_info.get("name")
        picture = user_info.get("picture")
        uid = user_info.get("user_id")

        try:
            response = supabase.table("profiles").upsert({
                "id": uid,
                "email": email,
                "full_name": name,
                "avatar_url": picture
            }).execute()
            return jsonify({"message": "Profile synced", "data": response.data}), 200
        except Exception as e:
            print("Supabase error:", e)
            return jsonify({"error": "Profile sync failed"}), 500

    @app.route("/tasks", methods=["GET", "POST", "DELETE"])
    @firebase_token_required
    def handle_tasks():
        try:
            uid = request.user["uid"]

            if request.method == "GET":
                response = supabase.from_("tasks").select("*").eq("user_id", uid).execute()
                return jsonify(response.data), 200

            elif request.method == "POST":
                data = request.get_json()
                description = data.get("description")
                date = data.get("date")

                if not description or not date:
                    return jsonify({"error": "Missing description or date"}), 400

                response = supabase.from_("tasks").insert({
                    "user_id": uid,
                    "description": description,
                    "date": date
                }).execute()
                return jsonify(response.data), 201

            elif request.method == "DELETE":
                data = request.get_json()
                task_id = data.get("id")

                if not task_id:
                    return jsonify({"error": "Missing task ID"}), 400

                response = supabase.from_("tasks").delete().eq("id", task_id).eq("user_id", uid).execute()
                return jsonify({"message": "Task deleted"}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @app.route("/predict", methods=["POST"])
    def predict():
        try:
            data = request.get_json()

            if model and "features" in data:
                features = data["features"]
                prediction = model.predict([features])
                return jsonify({"prediction": int(prediction[0])})

            task_description = data.get("task_description", "")
            if not task_description:
                return jsonify({"error": "Missing input for prediction"}), 400

            predicted_category = "Urgent" if "deadline" in task_description.lower() else "Normal"
            return jsonify({"predicted_category": predicted_category})

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    return app

# Run locally
if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)

















