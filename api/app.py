from flask import Flask, jsonify, request, render_template, redirect
import requests
import base64
import json

app = Flask(__name__)
app.config.from_file('config.json', load=json.load)

CLIENT_ID = '<your_client_id>'
CLIENT_SECRET = '<your_client_secret>'
REDIRECT_URI = 'http://localhost:5000/callback'
DEXCOM_API_URL = 'https://api.dexcom.com/v3'

# ==========================
# Dexcom API: OAuth2 and Data Fetching
# ==========================

@app.route('/login')
def login():
    auth_url = f"{DEXCOM_API_URL}/oauth2/login?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=offline_access"
    return redirect(auth_url)

@app.route('/callback')
def callback():
    code = request.args.get('code')
    token_url = f'{DEXCOM_API_URL}/oauth2/token'
    data = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': REDIRECT_URI
    }
    response = requests.post(token_url, data=data)
    tokens = response.json()
    access_token = tokens['access_token']
    
    # Store glucose readings, events, alerts, and calibrations
    fetch_and_store_glucose(access_token)
    fetch_and_store_events(access_token)
    fetch_and_store_alerts(access_token)
    fetch_and_store_calibrations(access_token)

    return jsonify({'message': 'Data fetched and stored successfully'})


def get_db_connection():
    conn = sqlite3.connect('dexcom_data.db')
    return conn

# ==========================
# Fetch Data from Dexcom and Store in SQLite
# ==========================

def fetch_and_store_glucose(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    glucose_url = f'{DEXCOM_API_URL}/users/self/egvs'
    params = {
        'startDate': '2024-01-01T00:00:00',
        'endDate': '2024-01-02T00:00:00'  # Adjust date range as needed
    }
    response = requests.get(glucose_url, headers=headers, params=params)
    glucose_data = response.json()

    conn = get_db_connection()
    for reading in glucose_data['egvs']:
        conn.execute('''
            INSERT INTO glucose_readings (system_time, display_time, glucose_value, trend, trend_rate)
            VALUES (?, ?, ?, ?, ?)
        ''', (reading['systemTime'], reading['displayTime'], reading['value'], reading['trend'], reading['trendRate']))
    conn.commit()
    conn.close()

def fetch_and_store_events(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    events_url = f'{DEXCOM_API_URL}/users/self/events'
    params = {
        'startDate': '2024-01-01T00:00:00',
        'endDate': '2024-01-02T00:00:00'
    }
    response = requests.get(events_url, headers=headers, params=params)
    event_data = response.json()

    conn = get_db_connection()
    for event in event_data['events']:
        conn.execute('''
            INSERT INTO dexcom_events (record_id, system_time, display_time, event_type, event_sub_type, value, unit, event_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (event['recordId'], event['systemTime'], event['displayTime'], event['eventType'], event['eventSubType'], event['value'], event['unit'], event['eventStatus']))
    conn.commit()
    conn.close()

def fetch_and_store_alerts(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    alerts_url = f'{DEXCOM_API_URL}/users/self/alerts'
    params = {
        'startDate': '2024-01-01T00:00:00',
        'endDate': '2024-01-02T00:00:00'
    }
    response = requests.get(alerts_url, headers=headers, params=params)
    alert_data = response.json()

    conn = get_db_connection()
    for alert in alert_data['alerts']:
        conn.execute('''
            INSERT INTO glucose_alerts (alert_id, system_time, display_time, alert_type, alert_value, unit, alert_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (alert['alertId'], alert['systemTime'], alert['displayTime'], alert['alertType'], alert['alertValue'], alert['unit'], alert['alertStatus']))
    conn.commit()
    conn.close()

def fetch_and_store_calibrations(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    calibrations_url = f'{DEXCOM_API_URL}/users/self/calibrations'
    params = {
        'startDate': '2024-01-01T00:00:00',
        'endDate': '2024-01-02T00:00:00'
    }
    response = requests.get(calibrations_url, headers=headers, params=params)
    calibration_data = response.json()

    conn = get_db_connection()
    for calibration in calibration_data['calibrations']:
        conn.execute('''
            INSERT INTO calibrations (system_time, display_time, glucose_value, unit, calibration_status)
            VALUES (?, ?, ?, ?, ?)
        ''', (calibration['systemTime'], calibration['displayTime'], calibration['value'], calibration['unit'], calibration['calibrationStatus']))
    conn.commit()
    conn.close()

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