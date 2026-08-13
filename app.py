from flask import Flask, render_template, request, session
import pickle
import re
from scipy.sparse import csr_matrix, hstack

app = Flask(__name__)
app.secret_key = "your_secret_key"

with open("model.pkl", "rb") as file:
    model = pickle.load(file)

with open("vectorizer.pkl", "rb") as file:
    tfidf = pickle.load(file)

with open("department_mapping.pkl", "rb") as file:
    department_mapping = pickle.load(file)

QUESTIONS = [
    "How can I help you today?",
    "How old are you?",
    "Please select your gender.",
    "How long have you had these symptoms?",
    "Please select symptom severity."
]

FIELDS = [
    "complaint",
    "age",
    "gender",
    "duration",
    "severity"
]

severity_mapping = {
    "low": 0,
    "medium": 1,
    "high": 2,
    "critical": 3
}

@app.route("/")
def home():
    session.clear()
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():

    if "step" not in session:
        session["step"] = 0

    user_message = request.json.get("message", "").strip()

    if not user_message:
        return {"reply": "Please provide an answer."}

    current_field = FIELDS[session["step"]]
    session[current_field] = user_message
    session["step"] += 1

    if session["step"] < len(QUESTIONS):

        response = {
            "reply": QUESTIONS[session["step"]]
        }

        if session["step"] == 2:
            response["type"] = "gender"

        elif session["step"] == 3:
            response["type"] = "duration"

        elif session["step"] == 4:
            response["type"] = "severity"

        return response

    complaint = session["complaint"]
    age = session["age"]
    gender = session["gender"]
    duration = session["duration"]
    severity = session["severity"]

    complaint = re.sub(
        r"[^\w\s]",
        "",
        complaint.lower()
    ).strip()

    X_text = tfidf.transform([complaint])

    female = 0
    male = 0
    other = 0

    if gender.lower() == "male":
        male = 1
    elif gender.lower() == "female":
        female = 1
    else:
        other = 1

    X_structured = [[
        int(age),
        severity_mapping[severity.lower()],
        int(duration),
        female,
        male,
        other
    ]]

    X_structured = csr_matrix(X_structured)

    X_input = hstack([
        X_text,
        X_structured
    ])

    prediction = model.predict(X_input)[0]

    department = department_mapping[prediction]

    session.clear()

    return {
        "reply": f"🏥 Recommended Department: {department}",
        "type": "prediction",
        "department": department
    }

if __name__ == "__main__":
    app.run(debug=True)