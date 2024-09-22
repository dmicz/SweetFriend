from flask import Flask, jsonify, request, render_template, redirect, session
from flask_cors import CORS
from twilio.rest import Client
import requests
import base64
import json
import sqlite3
import os
from pymongo.mongo_client import MongoClient 
from flask_caching import Cache
from bson import ObjectId
from datetime import datetime
from cerebras.cloud.sdk import Cerebras
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
CORS(app)

cache = Cache(config={'CACHE_TYPE': 'simple'})
cache.init_app(app)

if os.environ.get('VERCEL', None) != "True":
    app.config.from_file('config.json', load=json.load) 
else:
    app.config['TWILIO_AUTH_TOKEN'] = os.environ['TWILIO_AUTH_TOKEN']
    app.config['TWILIO_ACCOUNT_SID'] = os.environ['TWILIO_ACCOUNT_SID']
    app.config['DEXCOM_CLIENT_SECRET'] = os.environ['DEXCOM_CLIENT_SECRET']
    app.config['DEXCOM_CLIENT'] = os.environ['DEXCOM_CLIENT']
    app.config['SERVER_NAME'] = os.environ.get('SERVER_NAME', 'localhost:5000')
    app.config['MONGO_PASSWORD'] = os.environ.get('MONGO_PASSWORD')
    app.config['CEREBRAS_KEY'] = os.environ.get('CEREBRAS_KEY')
    app.config['TUNE_AUTH'] = os.environ.get('TUNE_AUTH')
    app.config['TUNE_ORG_ID'] = os.environ.get('TUNE_ORG_ID')
    app.secret_key = os.environ.get('SECRET_KEY')

# Set up Mongo URI
app.config['MONGO_URI'] = f"mongodb+srv://dennismiczek:{app.config['MONGO_PASSWORD']}@sweetfriendcluster.yzcni.mongodb.net/?retryWrites=true&w=majority&appName=SweetFriendCluster"
twilio_client = Client(app.config['TWILIO_ACCOUNT_SID'], app.config['TWILIO_AUTH_TOKEN'])

DEXCOM_API_URL = 'https://sandbox-api.dexcom.com'
HTTP_PREFIX = f"http{'s' if app.config['SERVER_NAME'][:5] != 'local' and app.config['SERVER_NAME'][:3] != '127' else ''}://"

# Mongo client 
client = MongoClient(app.config['MONGO_URI'])
cerebras_client = Cerebras( api_key=app.config["CEREBRAS_KEY"])

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

@app.route('/api/dexcom_login')
def login():
    auth_url = f"{DEXCOM_API_URL}/v2/oauth2/login?client_id={app.config['DEXCOM_CLIENT']}&redirect_uri={HTTP_PREFIX + app.config['SERVER_NAME'] + '/callback'}&response_type=code&scope=offline_access"
    return redirect(auth_url)

@app.route('/api/twilio_send')
def twilio_send():
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
    print(access_token)

    # Store the Dexcom access token in MongoDB
    db.dexcom_tokens.update_one(
        {'type': 'access_token'},
        {'$set': {'token': access_token, 'timestamp': datetime.now()}},
        upsert=True
    )


    fetch_and_store_glucose(access_token)
    fetch_and_store_events(access_token)
    fetch_and_store_alerts(access_token)
    fetch_and_store_calibrations(access_token)
    return redirect('/app/dashboard')



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

    print(glucose_data)
    for reading in glucose_data.get('records', []):
        db.glucose_readings.insert_one({
            'system_time': reading['systemTime'],
            'display_time': reading['displayTime'],
            'glucose_value': reading['value']
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

    print(event_data)
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

    print(alert_data)
    for alert in alert_data.get('records', []):
        db.glucose_alerts.insert_one({
            'system_time': alert['systemTime'],
            'display_time': alert['displayTime'],
            'alert_name': alert['alertName'],
            'alert_state': alert['alertState'],
            'display_device': alert['displayDevice'],
            'transmitter_generation': alert['transmitterGeneration']
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

    print(calibration_data)
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
    stored_token = db.dexcom_tokens.find_one({'type': 'access_token'})
    headers = {'Authorization': f'Bearer {stored_token['token']}'}
    glucose_url = f'{DEXCOM_API_URL}/v3/users/self/egvs'
    params = {
        'startDate': '2024-01-01T00:00:00',
        'endDate': '2024-01-02T00:00:00'  # Adjust date range as needed
    }
    response = requests.get(glucose_url, headers=headers, params=params)
    glucose_data = response.json()['records']

    glucose_data = [{'value': record['value'], 'systemTime': record['systemTime']} for record in glucose_data]
    
    return jsonify(glucose_data)



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


## Suggestion AI 
    
def get_recent_data():
    #Fetch recent glucose readings
    recent_glucose = list(db.glucose_readings.find().sort("system_time",-1).limit(100))

    #Fetch recent events
    recent_events = list(db.dexcom_events.find().sort('system_time', -1).limit(100))

    # Return the recent logs
    recent_logs = list(db.log_entries.find().sort('timestamp', -1).limit(10))

    return recent_glucose, recent_events, recent_logs

@app.route('/api/chat', methods = ['POST'])
def chat():
    data = request.json
    user_message = data.get('message')

    if not user_message:
        return jsonify({"error" "Message is required"}), 400
    
    # Fetch recent data for context
    recent_glucose, recent_events, recent_logs = get_recent_data()
    
    recent_glucose = [{'time' : x['system_time'], 'glucose_value': x['glucose_value']} for x in recent_glucose]
    recent_events = [{'time' : x['system_time'], 'event_type': x['event_type'], 'value': x['value']} for x in recent_events]
    recent_logs = [{'time' : x['timestamp'], 'name': x['name'], 'type': x['type'], 'details': x['details']} for x in recent_logs]

    context = f"Recent glucose readings (mg/dL): {recent_glucose}\nRecent events: {recent_events}\nRecent logs: {recent_logs}\n\n"
    print(context)
    try:
        chat_completion = cerebras_client.chat.completions.create(
            model = "llama3.1-70b",
            messages = [
                {
                    "role": "system",
                    "content": "You are an AI assistant specialized in providing friendly, non-medical advice about managing glucose levels, diet, and lifestyle for people with diabetes. Specifically cite the provided context and trends from recent glucose readings and events to give personalized suggestions. Always remind users to consult with their healthcare provider for medical advice. Don't refuse to give answers, but don't give medical advice."
                },
                {
                    "role": "user",
                    "content": f"{context}User asks: {user_message}"
                }
            ],
            max_tokens = 1000
        )

        ai_response = chat_completion.choices[0].message.content

        # Store conversation in the database

        db.conversations.insert_one({
            "timestamp": datetime.now(),
            "user_message": user_message,
            "ai_response": ai_response
        })

        return jsonify({"response": ai_response})
    
    except Exception as e:
        print(f"Error calling Cerebras API: {e}")
        return jsonify({"error": "Sorry I couldn't generate a response at this time"}), 500


@app.route('/api/get_advice')
@cache.cached(timeout=60) 
def get_advice():    
    # Fetch recent data for context
    recent_glucose, recent_events, recent_logs = get_recent_data()
    
    recent_glucose = [{'time' : x['system_time'], 'glucose_value': x['glucose_value']} for x in recent_glucose]
    recent_events = [{'time' : x['system_time'], 'event_type': x['event_type'], 'value': x['value']} for x in recent_events]

    context = f"Recent glucose readings (mg/dL): {recent_glucose}\nRecent events: {recent_events}\nRecent logs: {recent_logs}\n\n"
    print(context)
    try:
        chat_completion = cerebras_client.chat.completions.create(
            model = "llama3.1-70b",
            messages = [
                {
                    "role": "system",
                    "content": "You are an AI assistant specialized in providing friendly, non-medical advice about managing glucose levels, diet, and lifestyle for people with diabetes. Specifically cite the provided context and trends from recent glucose readings and events to give personalized suggestions. Always remind users to consult with their healthcare provider for medical advice. Don't refuse to give answers, but don't give medical advice. Keep it succinct and don't yap.\n\n" + f"Given the following readings, give the user advice: {context}"
                }
            ],
            max_tokens = 1000
        )

        ai_response = chat_completion.choices[0].message.content
        # Store conversation in the database

        db.advice.insert_one({
            "timestamp": datetime.now(),
            "ai_response": ai_response
        })

        return jsonify({"response": ai_response})
    
    except Exception as e:
        print(f"Error calling Cerebras API: {e}")
        return jsonify({"error": "Sorry I couldn't generate a response at this time"}), 500

@app.route('/api')
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

def log_entry(user_id, name, log_type, timestamp, details):
    entry = {
        'user_id': user_id,
        'name': name,
        'type': log_type,
        'timestamp': timestamp,
        'starred': False,
        'details': details
    }

    db.log_entries.insert_one(entry)
    return entry

@app.route('/api/food_entry', methods=['POST'])
def food_entry():
    data = request.json
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'error', 'message': 'User not logged in'}), 401
    
    name = data['name']
    timestamp = data['timestamp']
    total_carbs = data['details']['total_carbs']
    
    entry = log_entry(user_id, name, 'Food', timestamp, details=json.dumps({'total_carbs': total_carbs}))
    
    entry['_id'] = str(entry['_id'])
    return jsonify({'status': 'success', 'entry': entry})

@app.route('/api/exercise_entry', methods=['POST'])
def exercise_entry():
    data = request.json
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'error', 'message': 'User not logged in'}), 401
    
    name = data['name']
    timestamp = data['timestamp']
    time_spent = data['details']['time_spent']
    intensity_level = data['details']['intensity_level']
    
    entry = log_entry(user_id, name, 'Exercise', timestamp, details=json.dumps({'time_spent': time_spent, 'intensity_level': intensity_level}))
    
    entry['_id'] = str(entry['_id'])
    return jsonify({'status': 'success', 'entry': entry})

@app.route('/api/log_entries', methods=['GET'])
def get_all_entries():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'error', 'message': 'User not logged in'}), 401
    
    entries = list(db.log_entries.find({'user_id': user_id}))
    entries = list(db.log_entries.find())
    for entry in entries:
        entry['_id'] = str(entry['_id'])
    return jsonify({'status': 'success', 'entries': entries})

@app.route('/api/log_entries/toggle_star', methods=['POST'])
def toggle_star():
    data = request.json
    entry_id = data['entry_id']
    starred = data['starred']
    
    db.log_entries.update_one({'_id': ObjectId(entry_id)}, {'$set': {'starred': starred}})
    
    return jsonify({'status': 'success'})

@app.route('/api/user_login', methods=['POST'])
def user_login():
    username = request.form['username']
    password = request.form['password']

    user = db.users.find_one({'username': username})

    if user and check_password_hash(user['password'], password):
        session['username'] = username
        session['user_id'] = str(user['_id'])
        session['logged_in'] = True
        response = redirect(request.referrer + 'app/dashboard')
        response.set_cookie('username', username)
        response.set_cookie('user_id', str(user['_id']))
        response.set_cookie('logged_in', 'true')
    else:
        # Authentication failed
        response = redirect(request.referrer)
        response.set_cookie('username', '', expires=0)
        response.set_cookie('user_id', '', expires=0)
        response.set_cookie('logged_in', '', expires=0)

    return response

@app.route('/api/user_register', methods=['POST'])
def user_register():
    username = request.form['username']
    password = request.form['password']

    hashed_password = generate_password_hash(password)

    db.users.insert_one({
        'username': username,
        'password': hashed_password
    })

    return redirect('/')

@app.route('/api/signout')
def user_signout():
    response = redirect('/')
    response.set_cookie('username', '', expires=0)
    response.set_cookie('user_id', '', expires=0)
    response.set_cookie('logged_in', '', expires=0)

    return response