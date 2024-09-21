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

app = Flask(__name__)
if os.environ.get('VERCEL', None) != "True":
    app.config.from_file('config.json', load=json.load) 
else:
    app.config['TWILIO_AUTH_TOKEN'] = os.environ['TWILIO_AUTH_TOKEN']
    app.config['TWILIO_ACCOUNT_SID'] = os.environ['TWILIO_ACCOUNT_SID']
    app.config['DEXCOM_CLIENT_SECRET'] = os.environ['DEXCOM_CLIENT_SECRET']
    app.config['DEXCOM_CLIENT'] = os.environ['DEXCOM_CLIENT']
    app.config['SERVER_NAME'] = os.environ.get('SERVER_NAME', 'localhost:5000')
    app.config['MONGO_PASSWORD'] = os.environ.get('MONGO_PASSWORD')

# Set up Mongo URI
app.config['MONGO_URI'] = f"mongodb+srv://dennismiczek:{app.config['MONGO_PASSWORD']}@sweetfriendcluster.yzcni.mongodb.net/?retryWrites=true&w=majority&appName=SweetFriendCluster"
twilio_client = Client(app.config['TWILIO_ACCOUNT_SID'], app.config['TWILIO_AUTH_TOKEN'])

DEXCOM_API_URL = 'https://sandbox-api.dexcom.com'
HTTP_PREFIX = f"http{'s' if app.config['SERVER_NAME'][:5] != 'local' and app.config['SERVER_NAME'][:3] != '127' else ''}://"

# Mongo client 
client = MongoClient(app.config['MONGO_URI'])

# Send a ping to confirm a su ccessful connection
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
    twilio_client = Client(app.config['TWILIO_ACCOUNT_SID'], app.config['TWILIO_AUTH_TOKEN'])
    
    message = twilio_client.messages.create(
        from_='+18449053950',
        body='SweetFriend: Your glucose level is low and falling. Have a snack with around 15-20g of carbs.',
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
    app.config['DEXCOM_ACCESS_TOKEN'] = access_token
    
    # Store glucose readings, events, alerts, and calibrations
    def fetch_all_dexcom_data(access_token):
        fetch_and_store_glucose(access_token)
        fetch_and_store_events(access_token)
        fetch_and_store_alerts(access_token)
        fetch_and_store_calibrations(access_token)

    fetch_all_dexcom_data(access_token)

    return jsonify({'message': 'Data fetched and stored successfully'})

def get_db_connection():
    conn = sqlite3.connect('glucose_data.db')
    return conn

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
    headers = {'Authorization': f'Bearer {app.config['DEXCOM_ACCESS_TOKEN']}'}
    glucose_url = f'{DEXCOM_API_URL}/v3/users/self/egvs'
    params = {
        'startDate': '2024-01-01T00:00:00',
        'endDate': '2024-01-02T00:00:00'  # Adjust date range as needed
    }
    response = requests.get(glucose_url, headers=headers, params=params)
    glucose_data = response.json()['records']

    glucose_data = [{'value': record['value'], 'displayTime': record['displayTime']} for record in glucose_data]

    return jsonify(glucose_data)

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

    messages = []
    messages.append(
        {
            "role": "system",
            "content": "You do not use markdown headers or bolding, just lists. You are helping diabetes patients estimate the number of carbs in their meal so they can plan and monitor their glucose levels accordingly."
        })
    messages.append(
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "First, analyze the image and describe what food items are present. Then, break down the ingredients and estimate the carbs of each ingredient in grams, then calculate the total carbs and give the name of the meal."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            }
    )

    data = {
        "temperature": 0.2,
        "messages": messages,
        "model": "openai/gpt-4o-mini",
        "stream": False,
        "frequency_penalty": 0.2,
        "max_tokens": 2000
    }

    try:
        response = requests.post("https://proxy.tune.app/chat/completions", 
                                 headers={"Authorization": f"{app.config['TUNE_AUTH']}", "Content-Type": "application/json", "X-Org-Id": f"{app.config['TUNE_ORG_ID']}"}, 
                                 json=data)
        response.raise_for_status()
        messages.append(response.json()['choices'][0]['message'])
        messages.append(
            {
                "role": "system",
                "content": "You are a JSON generator. Always respond with valid json in the schema provided."
            })
        messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Using your estimates, fill the structured output JSON with the values. Only output valid JSON according to the schema. Only output for the meal total, one entry. Do not use code blocks or anything to surround json. Meal carbs must be in grams. Write in following format:
                        {
                    "meal_name": {"type": "string"},
                    "total_carbs": {"type": "number"}
                }"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}"
                        }
                    }
                ]
            })
        data = {
            "temperature": 0,
            "messages": messages,
            "model": "openai/gpt-4o-mini",
            "stream": False,
            "frequency_penalty": 0,
            "response-format": {
            "type": "json_object"
            },
            "guided_json": {
                "type": "object",
                "properties": {
                    "meal_name": {"type": "string"},
                    "total_carbs": {"type": "number"}
                }
            },
            "max_tokens": 200
        }
        try:
            response = requests.post("https://proxy.tune.app/chat/completions", 
                                    headers={"Authorization": f"{app.config['TUNE_AUTH']}", "Content-Type": "application/json", "X-Org-Id": f"{app.config['TUNE_ORG_ID']}"}, 
                                    json=data)
            response.raise_for_status()
            response_content = response.json()['choices'][0]['message']['content']
            try:
                json_response = json.loads(response_content)
                json_response['reason'] = messages[2]['content']
                return jsonify(json_response)
            except json.JSONDecodeError:
                return jsonify({"message": messages, "error": "Failed to decode JSON from response"}), 500
        except requests.exceptions.RequestException as e:
            return jsonify({"message": messages, "error": str(e)}), 500
    except requests.exceptions.RequestException as e:
        return jsonify({"message": messages, "error": str(e)}), 500


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

def log_food_entry(meal_name, meal_time, total_carbs):
    food_entry = {
        'meal_name': meal_name,
        'meal_time': meal_time,
        'total_carbs': total_carbs
    }
    db.food_entries.insert_one(food_entry)
    return food_entry

def log_exercise_entry(exercise_name, exercise_time, time_spent, intensity_level):
    exercise_entry = {
        'exercise_name': exercise_name,
        'exercise_time': exercise_time,
        'time_spent': time_spent,
        'intensity_level': intensity_level
    }
    db.exercise_entries.insert_one(exercise_entry)
    return exercise_entry

@app.route('/api/food_entry', methods=['POST'])
def food_entry():
    data = request.json
    meal_name = data['meal_name']
    meal_time = data['meal_time']
    total_carbs = data['total_carbs']
    
    entry = log_food_entry(meal_name, meal_time, total_carbs)
    
    return jsonify({'status': 'success', 'entry': entry})

@app.route('/api/exercise_entry', methods=['POST'])
def exercise_entry():
    data = request.json
    exercise_name = data['exercise_name']
    exercise_time = data['exercise_time']
    time_spent = data['time_spent']
    intensity_level = data['intensity_level']
    
    entry = log_exercise_entry(exercise_name, exercise_time, time_spent, intensity_level)
    
    return jsonify({'status': 'success', 'entry': entry})
