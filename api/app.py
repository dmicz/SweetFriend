from flask import Flask, jsonify
import json

app = Flask(__name__)

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
    return jsonify(routes)


@app.route('/api/json')
def json_test():
    data = {'message': 'test', 'status': 200}
    return jsonify(data)

