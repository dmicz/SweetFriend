from flask import Flask, jsonify, request, render_template, redirect
from twilio.rest import Client
import requests
import base64
import json
import sqlite3
import os
from pymongo.mongo_client import MongoClient 
from bson import ObjectId
from datetime import datetime
from cerebras.cloud.sdk import Cerebras

app = Flask(__name__)
if os.environ.get('VERCEL', None) != "True":
    app.config.from_file('config.json', load=json.load) 
else:
    app.config['TWILIO_AUTH_TOKEN'] = os.environ['TWILIO_AUTH_TOKEN']
    app.config['TWILIO_ACCOUNT_SID'] = os.environ['TWILIO_ACCOUNT_SID']
    app.config['DEXCOM_CLIENT_SECRET'] = os.environ['DEXCOM_CLIENT_SECRET']
    app.config['DEXCOM_CLIENT'] = os.environ['DEXCOM_CLIENT']
    app.config['SERVER_NAME'] = os.environ.get('SERVER_NAME', 'http://localhost:5000')
    app.config['MONGO_PASSWORD'] = os.environ.get('MONGO_PASSWORD')

# Set up Mongo URI
app.config['MONGO_URI'] = f"mongodb+srv://dennismiczek:{app.config['MONGO_PASSWORD']}@sweetfriendcluster.yzcni.mongodb.net/?retryWrites=true&w=majority&appName=SweetFriendCluster"
twilio_client = Client(app.config['TWILIO_ACCOUNT_SID'], app.config['TWILIO_AUTH_TOKEN'])

DEXCOM_API_URL = 'https://sandbox-api.dexcom.com'
HTTP_PREFIX = f"http{'s' if app.config['SERVER_NAME'][:5] != 'local' else ''}://"

# Mongo client 
client = MongoClient(app.config['MONGO_URI'])
cerebras_client = Cerebras( api_key=os.environ.get("CEREBRAS_KEY"))

# Send a ping to confirm a successful connection
try: 
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

# Select the database
    
db = client.dexcom_db

# ==========================
# Dexcom API: OAuth2 and Data Fetching
# ==========================

@app.route('/login')
def login():
    auth_url = f"{DEXCOM_API_URL}/v2/oauth2/login?client_id={app.config['DEXCOM_CLIENT']}&redirect_uri={HTTP_PREFIX + app.config['SERVER_NAME'] + '/callback'}&response_type=code&scope=offline_access"
    return redirect(auth_url)

@app.route('/twilio_send')
def twilio_send():
    message = twilio_client.messages.create(
        from_='+18449053950',
        body='Hello from Twilio (Flask)',
        to='+16467976340'
    )
    
    return jsonify({'status': 'message sent', 'message_sid': message.sid})

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_url = f'{DEXCOM_API_URL}/v2/oauth2/token'
    data = {
        'client_id': app.config['DEXCOM_CLIENT'],
        'client_secret': app.config['DEXCOM_CLIENT_SECRET'],
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': HTTP_PREFIX + app.config['SERVER_NAME'] + '/callback'
    }
    response = requests.post(token_url, data=data)
    tokens = response.json()
    access_token = tokens['access_token']
    
    


def get_db_connection():
    conn = sqlite3.connect('glucose_data.db')
    return conn

# Store glucose readings, events, alerts, and calibrations
    def fetch_all_dexcom_data(access_token, db):
        fetch_and_store_glucose(access_token, db)
        fetch_and_store_events(access_token, db)
        fetch_and_store_alerts(access_token, db)
        fetch_and_store_calibrations(access_token, db)

# ==========================
# Fetch Data from Dexcom and Store in MongoDB
# ==========================

def fetch_and_store_glucose(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    glucose_url = f'{DEXCOM_API_URL}/v3/users/self/egvs'
    params = {
        'startDate': '2024-01-01T00:00:00',
        'endDate': '2024-01-02T00:00:00'  # Adjust date range as needed
    }
    response = requests.get(glucose_url, headers=headers, params=params)
    glucose_data = response.json()

    for reading in glucose_data.get('records', []):
        db.glucose_readings.insert_one({
            'system_time': reading['systemTime'],
            'display_time': reading['displayTime'],
            'glucose_value': reading['value'],
            'trend': reading['trend'],
            'trend_rate': reading['trendRate']
        })
        

def fetch_and_store_events(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    events_url = f'{DEXCOM_API_URL}/v3/users/self/events'
    params = {
        'startDate': '2024-01-01T00:00:00',
        'endDate': '2024-01-02T00:00:00'
    }
    response = requests.get(events_url, headers=headers, params=params)
    event_data = response.json()

    for event in event_data.get('records', []):
        db.dexcom_events.insert_one({
            'system_time': event['systemTime'],
            'display_time': event['displayTime'],
            'event_type': event['eventType'],
            'event_sub_type': event.get('eventSubType', ''),
            'value': event['value'],
            'unit': event['unit'],
            'event_status': event['eventStatus']
        })


def fetch_and_store_alerts(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    alerts_url = f'{DEXCOM_API_URL}/v3/users/self/alerts'
    params = {
        'startDate': '2024-01-01T00:00:00',
        'endDate': '2024-01-02T00:00:00'
    }
    response = requests.get(alerts_url, headers=headers, params=params)
    alert_data = response.json()

    for alert in alert_data.get('records', []):
        db.glucose_alerts.insert_one({
            'alert_id': alert['alertId'],
            'system_time': alert['systemTime'],
            'display_time': alert['displayTime'],
            'alert_type': alert['alertType'],
            'alert_value': alert['alertValue'],
            'unit': alert['unit'],
            'alert_status': alert['alertStatus']
        })

def fetch_and_store_calibrations(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    calibrations_url = f'{DEXCOM_API_URL}/v3/users/self/calibrations'
    params = {
        'startDate': '2024-01-01T00:00:00',
        'endDate': '2024-01-02T00:00:00'
    }
    response = requests.get(calibrations_url, headers=headers, params=params)
    calibration_data = response.json()

    for calibration in calibration_data.get('records', []):
        db.calibrations.insert_one({
            'system_time': calibration['systemTime'],
            'display_time': calibration['displayTime'],
            'glucose_value': calibration['value'],
            'unit': calibration['unit'],
            'calibration_status': calibration.get('calibrationStatus', '')
        })

@app.route('/api/get_glucose')
def get_glucose():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        SELECT * FROM glucose_readings
    ''')
    rows = cur.fetchall()

    column_names = [desc[0] for desc in cur.description]

    results = []
    for row in rows:
        results.append(dict(zip(column_names, row)))

    cur.close()
    conn.close()
    return jsonify(results)

# ==========================
# Existing Routes for Image Upload
# ==========================

@app.route('/')
def upload_form():
    return render_template("test_image_upload.html")

@app.route('/api/analyze_image', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    image = request.files['file']
    if image.filename == '':
        return jsonify({"error": "No selected file"}), 400

    base64_image = base64.b64encode(image.read()).decode('utf-8')

    data = {
        "temperature": 0.9,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "What do you see?"
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        "model": "openai/gpt-4o-mini",
        "stream": False,
        "frequency_penalty": 0.2,
        "max_tokens": 200
    }

    try:
        response = requests.post("https://proxy.tune.app/chat/completions", 
                                 headers={"Authorization": f"{app.config['TUNE_AUTH']}", "Content-Type": "application/json", "X-Org-Id": f"{app.config['TUNE_ORG_ID']}"}, 
                                 json=data,
                                 verify=False)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 500


## Suggestion AI 
    
async def get_ai_advice(glucose_level, recent_events):
    try:
        chat_completion = await client.chat.completions.create(
            model="llama3.1-8b",
        messages=[
            {
                "role": "system",
                "content": "You are an AI assistant providing friendly, non-medical advice for managing blood glucose levels. Suggest some general lifestyle tips based on glucose levels and recent events."
            },
            {
                "role": "user",
                "content": f"Current glucose level: {glucose_level}mg/dL. Recent events:{json.dumps(recent_events)}. What general advice can you give?"
            }
            
        ],)
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error calling Cerebras API: {e}")
    return "Sorry, I couldn't generate advice at this time."


## chat bot 
def get_recent_data(user_id):
    #Fetch recent glucose readings

    recent_glucose = list(db.glucose_readings.find(
        {user_id: user_id}
    ).sort("system_time",-1).limit(10))

    #Fetch recent events
    recent_events = list(db.dexcom_events.find(
        {
            "user_id": user_id
        }.sort('system_time', -1).limit(10)
    ))

    return recent_glucose, recent_events

@app.route('/api/chat', methods = ['POST'])
async def chat():
    data = request.json
    user_id = data.get('user_id')
    user_message = data.get('message')

    if not user_id or not user_message:
        return jsonify({"error" "User ID and message are required"}), 400
    
    # Fetch recent data for context
    recent_glucose, recent_events = get_recent_data(user_id)

    context = f"Recent glucose readings: {recent_glucose}\nRecent events: {recent_events}\n\n"

    try:
        chat_completion = await cerebras_client.chat.completions.create(
            model = "llama3.1-8b",
            messages = [
                {
                    "role": "system",
                    "content": " You are an AI assistant specialized in providing friendly, non-medical advice about managing glucose levels, diet, and lifestyle for people with diabetes. Use the provided context about recent glucose readings and events to give personalized suggestions. Always remind users to consult with their healthcare provider for medical advice."
                },
                {
                    "role": "user",
                    "content": f"{context}User asks: {user_message}"
                }
            ],
            max_tokens = 300
        )

        ai_response = chat_completion.choices[0].message.content

        # Store conversation in the database

        db.conversations.insert_one({
            "user_id": user_id,
            "timestamp": datetime.now(),
            "user_message": user_message,
            "ai_response": ai_response
        })

        return jsonify({"response": ai_response})
    
    except Exception as e:
        print(f"Error calling Cerebras API: {e}")
        return jsonify({"error": "Sorry I couldn't generate a response at this time"}), 500
    
@app.route('api/get_advice', methods = ['POST'])
async def get_advice():
    data = request.json
    glucose_level = data.get('glucose_level')
    recent_events = data.get('recent_events', [])

    if not glucose_level:
        return jsonify({"error": "Glucose level is required"}), 400
    
    advice = await get_ai_advice(glucose_level, recent_events)
    return jsonify({"advice": advice})


@app.route('/api/')
def home():
    routes = []
    for rule in app.url_map.iter_rules():
        methods = ', '.join(rule.methods)
        routes.append({
            'endpoint': rule.endpoint,
            'methods': methods,
            'url': str(rule)
        })
    
    return render_template("docs.html", routes=routes)


@app.route('/api/json')
def json_test():
    data = {'message': 'test', 'status': 200}
    return jsonify(data)