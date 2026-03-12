from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import json
import os

app = Flask(__name__)
CORS(app)

EVENTS_FILE = 'events.json'
NOTES_FILE = 'notes.json'


def load_events():
    """Load events from file."""
    if os.path.exists(EVENTS_FILE):
        try:
            with open(EVENTS_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def save_events(events):
    """Save events to file."""
    with open(EVENTS_FILE, 'w') as f:
        json.dump(events, f, indent=2)


def load_notes():
    """Load notes from file."""
    if os.path.exists(NOTES_FILE):
        try:
            with open(NOTES_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {}
    return {}


def save_notes(notes):
    """Save notes to file."""
    with open(NOTES_FILE, 'w') as f:
        json.dump(notes, f, indent=2)

@app.route('/api/events', methods=['GET'])
def get_events():
    events = load_events()
    start_date = request.args.get('start')

    print(f"this is the start date: {start_date}")


    end_date = request.args.get('end')
    
    filtered_events = []
    
    for event_id, event in events.items():
        event_date = event.get('date')
        
        if start_date and end_date:
            if start_date <= event_date <= end_date:
                filtered_events.append({**event, 'id': event_id})
        else:
            filtered_events.append({**event, 'id': event_id})
    

    print(f"filtered_events: {filtered_events}")

    return jsonify(filtered_events)

@app.route('/api/events', methods=['POST'])
def create_event():
    data = request.get_json()
    
    if not data or 'title' not in data or 'date' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    events = load_events()
    event_id = str(datetime.now().timestamp())
    
    events[event_id] = {
        'title': data['title'],
        'date': data['date'],
        'time': data.get('time', ''),
        'description': data.get('description', ''),
        'created_at': datetime.now().isoformat()
    }
    
    save_events(events)
    
    return jsonify({
        'id': event_id,
        **events[event_id]
    }), 201

@app.route('/api/events/<event_id>', methods=['PUT'])
def update_event(event_id):
    events = load_events()
    
    if event_id not in events:
        return jsonify({'error': 'Event not found'}), 404
    
    data = request.get_json()
    
    events[event_id].update({
        'title': data.get('title', events[event_id]['title']),
        'date': data.get('date', events[event_id]['date']),
        'time': data.get('time', events[event_id].get('time', '')),
        'description': data.get('description', events[event_id].get('description', ''))
    })
    
    save_events(events)
    
    return jsonify({
        'id': event_id,
        **events[event_id]
    })

@app.route('/api/events/<event_id>', methods=['DELETE'])
def delete_event(event_id):
    events = load_events()
    
    if event_id not in events:
        return jsonify({'error': 'Event not found'}), 404
    
    del events[event_id]
    save_events(events)
    
    return jsonify({'message': 'Event deleted successfully'})

@app.route('/api/notes/<date>', methods=['GET'])
def get_note(date):
    notes = load_notes()
    note_content = notes.get(date, '')
    return jsonify({'date': date, 'content': note_content})

@app.route('/api/notes/<date>', methods=['POST'])
def save_note(date):
    data = request.get_json()
    content = data.get('content', '')
    
    notes = load_notes()
    notes[date] = content
    save_notes(notes)
    
    return jsonify({'date': date, 'content': content})

@app.route('/api/notes', methods=['GET'])
def get_all_notes():
    notes = load_notes()
    return jsonify(notes)

@app.route('/api/calendar/weekdays', methods=['GET'])
def get_weekdays():
    weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return jsonify({'weekdays': weekdays})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True, host='localhost', port=5000)
