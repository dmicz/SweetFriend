from flask import Flask, jsonify, request, render_template, redirect
import requests
import base64
import json
import sqlite3

app = Flask(__name__)
app.config.from_file('config.json', load=json.load)

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