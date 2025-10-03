
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import paho.mqtt.client as mqtt
import time
import json
import os
import shutil
from pathlib import Path
from PIL import Image
from typing import List
from datetime import datetime
from executor import ExerciseExecutor
from redis_manager import RedisManager

app = FastAPI()

# In-memory storage for active exercise executors
active_exercises = {}

# Initialize Redis manager for status queries
redis_manager = RedisManager()

# Allow CORS for the React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCENARIOS_DIR = "/scenarios"
MEDIA_DIR = "/scenarios/media"
IQ_LIBRARY_DIR = "/scenarios/iq_library"

# Mount static files for media serving
# This allows accessing files at http://localhost:8001/media/*
if os.path.exists(MEDIA_DIR):
    app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")
else:
    # Create media directory if it doesn't exist
    os.makedirs(MEDIA_DIR, exist_ok=True)
    os.makedirs(os.path.join(MEDIA_DIR, "library"), exist_ok=True)
    app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

# Create IQ library directory if it doesn't exist
if not os.path.exists(IQ_LIBRARY_DIR):
    os.makedirs(IQ_LIBRARY_DIR, exist_ok=True)

# Mount scenarios directory for thumbnail serving
# This allows accessing files at http://localhost:8001/scenarios/*
if os.path.exists(SCENARIOS_DIR):
    app.mount("/scenarios", StaticFiles(directory=SCENARIOS_DIR), name="scenarios")

@app.post("/api/v1/exercises/{scenario_name}/deploy")
async def deploy_exercise(scenario_name: str):
    """Deploys a new exercise from a scenario (dashboards only, no timer)."""
    if scenario_name in active_exercises:
        raise HTTPException(status_code=409, detail="Exercise with this name is already deployed.")

    executor = ExerciseExecutor(scenario_name)
    active_exercises[scenario_name] = executor
    result = await executor.start()  # This now just deploys, doesn't start timer

    # Update analytics
    update_analytics_deployment(scenario_name)

    return result

@app.post("/api/v1/exercises/{scenario_name}/start")
async def start_exercise(scenario_name: str):
    """Actually starts the exercise timer and inject delivery."""
    if scenario_name not in active_exercises:
        raise HTTPException(status_code=404, detail="Exercise not deployed. Deploy it first.")

    executor = active_exercises[scenario_name]
    result = await executor.begin()
    return result

@app.post("/api/v1/exercises/{scenario_name}/stop")
async def stop_exercise(scenario_name: str):
    """Stops a running exercise."""
    if scenario_name not in active_exercises:
        raise HTTPException(status_code=404, detail="Exercise with this name is not running.")

    executor = active_exercises[scenario_name]
    result = await executor.stop()
    del active_exercises[scenario_name]
    return result

@app.post("/api/v1/exercises/{scenario_name}/pause")
async def pause_exercise(scenario_name: str):
    """Pause a running exercise."""
    if scenario_name not in active_exercises:
        raise HTTPException(status_code=404, detail="Exercise not running")

    executor = active_exercises[scenario_name]
    result = await executor.pause()
    return result

@app.post("/api/v1/exercises/{scenario_name}/finish")
async def finish_exercise(scenario_name: str):
    """Finish exercise timer but keep dashboards alive."""
    if scenario_name not in active_exercises:
        raise HTTPException(status_code=404, detail="Exercise not running")

    executor = active_exercises[scenario_name]
    # Just stop the timer, don't kill dashboards
    await executor.pause()  # Pause the timer
    executor.state = "FINISHED"  # Mark as finished
    return {"status": "Exercise finished. Dashboards remain active. Use 'stop' to tear down."}

@app.post("/api/v1/exercises/{scenario_name}/resume")
async def resume_exercise(scenario_name: str):
    """Resume a paused exercise."""
    if scenario_name not in active_exercises:
        raise HTTPException(status_code=404, detail="Exercise not running")

    executor = active_exercises[scenario_name]
    result = await executor.resume()
    return result

@app.get("/api/v1/exercises/{scenario_name}/status")
async def get_exercise_status(scenario_name: str):
    """Get real-time exercise status including timer and team progress."""
    if scenario_name not in active_exercises:
        return {
            "state": "NOT_STARTED",
            "timer": {"formatted": "T+00:00", "elapsed": 0},
            "teams": []
        }

    # Get executor to access scenario data
    executor = active_exercises[scenario_name]

    # Extract team IDs from the scenario
    team_ids = [team['id'] for team in executor.scenario_data.get('teams', [])]

    # Get status from Redis with actual team IDs
    status = await redis_manager.get_exercise_status(scenario_name, team_ids)

    # Add inject totals from timeline for each team
    total_injects = {}
    for team_id, timeline in executor.timelines.items():
        total_injects[team_id] = len(timeline.get('injects', []))

    # Enhance team data with totals, ports, and full dashboard URLs
    for team in status['teams']:
        team['total'] = total_injects.get(team['id'], 0)
        url = executor.dashboard_urls.get(team['id'], '')
        if url:
            # Parse URL to get just the port number for display
            port_part = url.split(':')[-1]  # Gets "3100/?team=blue&exercise=..."
            port = port_part.split('/')[0] if '/' in port_part else port_part.split('?')[0]
            team['port'] = port
            # Include full URL for links
            team['url'] = url
        else:
            team['port'] = ''
            team['url'] = ''

    return status

@app.get("/api/v1/exercises/current")
async def get_current_exercise():
    """Get the currently active exercise with full status."""
    if not active_exercises:
        return {"active": False}

    # Return first active exercise (we only support one at a time)
    scenario_name = list(active_exercises.keys())[0]
    status = await get_exercise_status(scenario_name)

    # Load scenario metadata to get thumbnail
    scenario_file = os.path.join(SCENARIOS_DIR, f"{scenario_name}.json")
    thumbnail = None
    if os.path.exists(scenario_file):
        try:
            with open(scenario_file, 'r') as f:
                scenario_data = json.load(f)
                if "thumbnail" in scenario_data:
                    thumbnail = f"/scenarios/{scenario_data['thumbnail']}"
        except Exception as e:
            print(f"Error loading scenario metadata: {e}")

    return {
        "active": True,
        "scenario_name": scenario_name,
        "thumbnail": thumbnail,
        **status
    }

@app.get("/api/v1/scenarios")
def list_scenarios():
    """Lists all available scenarios."""
    scenarios = []

    try:
        # List all JSON files in the scenarios directory
        for filename in os.listdir(SCENARIOS_DIR):
            if filename.endswith('.json') and not filename.startswith('.'):
                scenario_path = os.path.join(SCENARIOS_DIR, filename)

                # Skip files in subdirectories
                if not os.path.isfile(scenario_path):
                    continue

                try:
                    with open(scenario_path, 'r') as f:
                        scenario_data = json.load(f)

                        # Count total injects across all teams
                        total_injects = 0
                        for team in scenario_data.get("teams", []):
                            timeline_file = team.get("timeline_file")
                            if timeline_file:
                                timeline_path = os.path.join(SCENARIOS_DIR, timeline_file)
                                if os.path.exists(timeline_path):
                                    try:
                                        with open(timeline_path, 'r') as tf:
                                            timeline_data = json.load(tf)
                                            total_injects += len(timeline_data.get("injects", []))
                                    except:
                                        pass

                        # Extract key fields for listing
                        scenario_item = {
                            "id": filename.replace('.json', ''),  # Use filename as ID for API calls
                            "name": scenario_data.get("name", "Unnamed Scenario"),
                            "description": scenario_data.get("description", ""),
                            "duration_minutes": scenario_data.get("duration_minutes", 60),
                            "team_count": len(scenario_data.get("teams", [])),
                            "inject_count": total_injects
                        }

                        # Add thumbnail if present
                        if "thumbnail" in scenario_data:
                            scenario_item["thumbnail"] = f"/scenarios/{scenario_data['thumbnail']}"

                        scenarios.append(scenario_item)
                except Exception as e:
                    print(f"Error reading scenario file {filename}: {str(e)}")
                    continue

        return {"scenarios": scenarios}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing scenarios: {str(e)}")

@app.get("/api/v1/scenarios/{scenario_name}")
def get_scenario(scenario_name: str):
    """Loads a scenario configuration file."""
    scenario_path = os.path.join(SCENARIOS_DIR, f"{scenario_name}.json")

    if not os.path.exists(scenario_path):
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_name}' not found.")

    try:
        with open(scenario_path, 'r') as f:
            scenario_data = json.load(f)
        return scenario_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading scenario file: {str(e)}")


@app.get("/api/v1/timelines/{scenario_name}/{team_id}")
def get_timeline(scenario_name: str, team_id: str):
    """Get a specific team's timeline from a scenario."""
    # First, get the scenario to find the timeline file
    scenario_path = os.path.join(SCENARIOS_DIR, f"{scenario_name}.json")
    if not os.path.exists(scenario_path):
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_name}' not found.")

    try:
        with open(scenario_path, 'r') as f:
            scenario_data = json.load(f)

        # Find the team's timeline file
        timeline_file = None
        for team in scenario_data.get('teams', []):
            if team['id'] == team_id:
                timeline_file = team.get('timeline_file')
                break

        if not timeline_file:
            raise HTTPException(status_code=404, detail=f"Timeline not found for team '{team_id}' in scenario '{scenario_name}'.")

        # Load the timeline
        timeline_path = os.path.join(SCENARIOS_DIR, timeline_file)
        if not os.path.exists(timeline_path):
            raise HTTPException(status_code=404, detail=f"Timeline file '{timeline_file}' not found.")

        with open(timeline_path, 'r') as f:
            timeline_data = json.load(f)

        return timeline_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading timeline: {str(e)}")


@app.put("/api/v1/timelines/{scenario_name}/{team_id}")
def update_timeline(scenario_name: str, team_id: str, timeline_data: dict):
    """Update a specific team's timeline."""
    # First, get the scenario to find the timeline file
    scenario_path = os.path.join(SCENARIOS_DIR, f"{scenario_name}.json")
    if not os.path.exists(scenario_path):
        raise HTTPException(status_code=404, detail=f"Scenario '{scenario_name}' not found.")

    try:
        with open(scenario_path, 'r') as f:
            scenario_data = json.load(f)

        # Find the team's timeline file
        timeline_file = None
        for team in scenario_data.get('teams', []):
            if team['id'] == team_id:
                timeline_file = team.get('timeline_file')
                break

        if not timeline_file:
            raise HTTPException(status_code=404, detail=f"Timeline not found for team '{team_id}' in scenario '{scenario_name}'.")

        # Save the updated timeline
        timeline_path = os.path.join(SCENARIOS_DIR, timeline_file)

        # Create backup of original (skip if directory isn't writable)
        import shutil
        import datetime
        backup_filename = None
        try:
            backup_dir = os.path.join(SCENARIOS_DIR, "backups")
            os.makedirs(backup_dir, exist_ok=True)
            backup_filename = f"{os.path.basename(timeline_file)}.{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}.bak"
            backup_path = os.path.join(backup_dir, backup_filename)

            if os.path.exists(timeline_path):
                shutil.copy2(timeline_path, backup_path)
        except (OSError, IOError) as e:
            print(f"Warning: Could not create backup: {e}")
            backup_filename = None

        # Write updated timeline
        with open(timeline_path, 'w') as f:
            json.dump(timeline_data, f, indent=2)

        return {
            "status": "success",
            "message": f"Timeline updated for team '{team_id}' in scenario '{scenario_name}'",
            "backup": backup_filename
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating timeline: {str(e)}")


@app.get("/api/v1/media")
def list_media():
    """List all media files in the library with metadata."""
    library_path = os.path.join(MEDIA_DIR, "library")

    if not os.path.exists(library_path):
        return {"media": []}

    media_files = []
    supported_formats = {'.jpg', '.jpeg', '.png', '.gif', '.svg'}

    try:
        # Scan library directory recursively
        for root, dirs, files in os.walk(library_path):
            for filename in files:
                file_path = os.path.join(root, filename)
                file_ext = os.path.splitext(filename)[1].lower()

                # Only process image files
                if file_ext not in supported_formats:
                    continue

                # Get relative path from media root
                rel_path = os.path.relpath(file_path, MEDIA_DIR)

                # Get file stats
                stat = os.stat(file_path)
                file_size = stat.st_size
                modified_time = stat.st_mtime

                # Try to get image dimensions
                width = None
                height = None
                if file_ext in {'.jpg', '.jpeg', '.png', '.gif'}:
                    try:
                        with Image.open(file_path) as img:
                            width, height = img.size
                    except Exception as e:
                        print(f"Could not read dimensions for {filename}: {e}")

                # Determine MIME type
                mime_types = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.svg': 'image/svg+xml'
                }
                mime_type = mime_types.get(file_ext, 'application/octet-stream')

                media_files.append({
                    'filename': filename,
                    'path': f"/media/{rel_path}",
                    'size': file_size,
                    'width': width,
                    'height': height,
                    'modified': modified_time,
                    'mime_type': mime_type
                })

        # Sort by filename
        media_files.sort(key=lambda x: x['filename'])

        return {"media": media_files}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing media files: {str(e)}")


@app.post("/api/v1/media/upload")
async def upload_media(files: List[UploadFile] = File(...)):
    """Upload media files to the library."""
    library_path = os.path.join(MEDIA_DIR, "library")

    # Ensure library directory exists
    os.makedirs(library_path, exist_ok=True)

    uploaded = []
    errors = []

    # Supported file types
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.svg'}
    allowed_mime_types = {
        'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'
    }

    # File size limit: 10MB
    max_file_size = 10 * 1024 * 1024

    for file in files:
        try:
            # Get file extension
            file_ext = os.path.splitext(file.filename)[1].lower()

            # Validate file extension
            if file_ext not in allowed_extensions:
                errors.append({
                    "filename": file.filename,
                    "error": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
                })
                continue

            # Validate MIME type
            if file.content_type not in allowed_mime_types:
                errors.append({
                    "filename": file.filename,
                    "error": f"Invalid MIME type: {file.content_type}"
                })
                continue

            # Read file content
            content = await file.read()
            file_size = len(content)

            # Validate file size
            if file_size > max_file_size:
                errors.append({
                    "filename": file.filename,
                    "error": f"File too large ({file_size / (1024*1024):.1f}MB > 10MB limit)"
                })
                continue

            # Sanitize filename (remove special characters, keep alphanumeric and basic punctuation)
            import re
            safe_filename = re.sub(r'[^\w\s.-]', '', file.filename)
            safe_filename = safe_filename.replace(' ', '-')

            # Handle filename conflicts (auto-rename)
            base_name = os.path.splitext(safe_filename)[0]
            extension = os.path.splitext(safe_filename)[1]
            final_filename = safe_filename
            counter = 1

            while os.path.exists(os.path.join(library_path, final_filename)):
                final_filename = f"{base_name}-{counter}{extension}"
                counter += 1

            # Save file
            file_path = os.path.join(library_path, final_filename)
            with open(file_path, 'wb') as f:
                f.write(content)

            # Extract metadata
            stat = os.stat(file_path)
            file_size = stat.st_size
            modified_time = stat.st_mtime

            # Get image dimensions
            width = None
            height = None
            if file_ext in {'.jpg', '.jpeg', '.png', '.gif'}:
                try:
                    with Image.open(file_path) as img:
                        width, height = img.size
                except Exception as e:
                    print(f"Could not read dimensions for {final_filename}: {e}")

            # Determine MIME type
            mime_types = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml'
            }
            mime_type = mime_types.get(file_ext, 'application/octet-stream')

            uploaded.append({
                'filename': final_filename,
                'original_filename': file.filename,
                'path': f"/media/library/{final_filename}",
                'size': file_size,
                'width': width,
                'height': height,
                'modified': modified_time,
                'mime_type': mime_type
            })

        except Exception as e:
            errors.append({
                "filename": file.filename,
                "error": f"Upload failed: {str(e)}"
            })

    return {
        "success": len(uploaded) > 0,
        "uploaded": uploaded,
        "errors": errors,
        "total": len(files),
        "successful": len(uploaded),
        "failed": len(errors)
    }


@app.delete("/api/v1/media")
def delete_media(path: str):
    """Delete a media file from the library."""
    # Ensure path starts with /media/library/
    if not path.startswith('/media/library/'):
        raise HTTPException(status_code=400, detail="Invalid media path")

    # Convert to filesystem path
    relative_path = path[7:]  # Remove '/media/' prefix
    file_path = os.path.join(MEDIA_DIR, relative_path)

    # Security: Ensure path is within MEDIA_DIR
    real_media_dir = os.path.realpath(MEDIA_DIR)
    real_file_path = os.path.realpath(file_path)

    if not real_file_path.startswith(real_media_dir):
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    # Check if it's a file (not directory)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=400, detail="Path is not a file")

    try:
        # Delete the file
        os.remove(file_path)
        return {
            "success": True,
            "message": f"File deleted successfully",
            "path": path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")


@app.get("/api/v1/status")
def get_status():
    """Checks the status of backend services."""
    
    # Check MQTT status
    mqtt_status = "disconnected"
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        client.connect("mqtt", 1883, 60)
        client.loop_start()
        # Give it a moment to connect
        time.sleep(0.5)
        if client.is_connected():
            mqtt_status = "connected"
        client.loop_stop()
        client.disconnect()
    except Exception as e:
        mqtt_status = f"error: {str(e)}"

    return {
        "orchestration_service": "running",
        "mqtt_broker": mqtt_status,
        "active_exercises": list(active_exercises.keys())
    }

# Analytics helper functions
def load_analytics():
    """Load analytics data from JSON file."""
    analytics_file = os.path.join(SCENARIOS_DIR, "data", "analytics.json")

    if not os.path.exists(analytics_file):
        return {"scenario_usage": {}, "exercise_history": []}

    try:
        with open(analytics_file, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Failed to load analytics: {e}")
        return {"scenario_usage": {}, "exercise_history": []}

def save_analytics(analytics_data):
    """Save analytics data to JSON file."""
    analytics_file = os.path.join(SCENARIOS_DIR, "data", "analytics.json")

    try:
        with open(analytics_file, 'w') as f:
            json.dump(analytics_data, f, indent=2)
    except Exception as e:
        print(f"Failed to save analytics (non-critical): {e}")

def update_analytics_deployment(scenario_id: str):
    """Update analytics when scenario is deployed."""
    try:
        analytics = load_analytics()

        if scenario_id not in analytics["scenario_usage"]:
            analytics["scenario_usage"][scenario_id] = {
                "total_deployments": 0,
                "total_duration_minutes": 0,
                "completion_count": 0,
                "average_duration_minutes": 0
            }

        analytics["scenario_usage"][scenario_id]["total_deployments"] += 1
        analytics["scenario_usage"][scenario_id]["last_deployment"] = datetime.now().isoformat()

        save_analytics(analytics)
    except Exception as e:
        print(f"Analytics update failed (non-critical): {e}")

def update_analytics_completion(scenario_id: str, duration_minutes: int, injects_delivered: int, injects_total: int):
    """Update analytics when exercise completes."""
    try:
        analytics = load_analytics()

        # Add to history
        analytics["exercise_history"].append({
            "scenario_id": scenario_id,
            "start_time": datetime.now().isoformat(),
            "duration_minutes": duration_minutes,
            "injects_delivered": injects_delivered,
            "injects_total": injects_total,
            "completion_rate": round((injects_delivered / injects_total * 100) if injects_total > 0 else 0, 1)
        })

        # Update usage stats
        if scenario_id in analytics["scenario_usage"]:
            usage = analytics["scenario_usage"][scenario_id]
            usage["completion_count"] += 1
            usage["total_duration_minutes"] += duration_minutes

            # Calculate average
            if usage["completion_count"] > 0:
                usage["average_duration_minutes"] = round(
                    usage["total_duration_minutes"] / usage["completion_count"]
                )

        save_analytics(analytics)
    except Exception as e:
        print(f"Analytics completion update failed (non-critical): {e}")

@app.get("/api/v1/analytics/scenarios")
def get_all_analytics():
    """Get analytics for all scenarios."""
    return load_analytics()

@app.get("/api/v1/analytics/scenarios/{scenario_id}")
def get_scenario_analytics(scenario_id: str):
    """Get analytics for a specific scenario."""
    analytics = load_analytics()

    return {
        "usage": analytics["scenario_usage"].get(scenario_id, {}),
        "history": [
            ex for ex in analytics["exercise_history"]
            if ex.get("scenario_id") == scenario_id
        ]
    }


@app.get("/api/v1/iq-library")
def list_iq_files():
    """List all IQ files in the library with metadata."""
    if not os.path.exists(IQ_LIBRARY_DIR):
        return {"iq_files": []}

    iq_files = []
    supported_formats = {'.iq', '.dat', '.raw', '.cfile'}

    try:
        for filename in os.listdir(IQ_LIBRARY_DIR):
            file_path = os.path.join(IQ_LIBRARY_DIR, filename)
            file_ext = os.path.splitext(filename)[1].lower()

            # Only process IQ files
            if file_ext not in supported_formats or not os.path.isfile(file_path):
                continue

            # Get file stats
            stat = os.stat(file_path)
            file_size = stat.st_size
            modified_time = stat.st_mtime

            # Calculate duration (assuming complex64 at 1.024 MHz)
            sample_rate = 1024000  # Default sample rate
            num_samples = file_size // 8  # 8 bytes per complex64 sample
            duration_seconds = num_samples / sample_rate

            iq_files.append({
                'filename': filename,
                'path': f"/iq_library/{filename}",
                'size': file_size,
                'size_mb': round(file_size / (1024 * 1024), 2),
                'duration_seconds': round(duration_seconds, 1),
                'num_samples': num_samples,
                'modified': modified_time,
                'format': file_ext[1:]  # Remove leading dot
            })

        # Sort by filename
        iq_files.sort(key=lambda x: x['filename'])

        return {"iq_files": iq_files}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing IQ files: {str(e)}")


@app.post("/api/v1/iq-library/upload")
async def upload_iq_file(files: List[UploadFile] = File(...)):
    """Upload IQ files to the library."""
    os.makedirs(IQ_LIBRARY_DIR, exist_ok=True)

    uploaded = []
    errors = []

    # Supported file types
    allowed_extensions = {'.iq', '.dat', '.raw', '.cfile'}

    # File size limit: 500MB (IQ files can be large)
    max_file_size = 500 * 1024 * 1024

    for file in files:
        try:
            file_ext = os.path.splitext(file.filename)[1].lower()

            # Validate file extension
            if file_ext not in allowed_extensions:
                errors.append({
                    "filename": file.filename,
                    "error": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
                })
                continue

            # Read file content
            content = await file.read()
            file_size = len(content)

            # Validate file size
            if file_size > max_file_size:
                errors.append({
                    "filename": file.filename,
                    "error": f"File too large ({file_size / (1024*1024):.1f}MB > 500MB limit)"
                })
                continue

            # Validate file is complex64 format (size must be multiple of 8)
            if file_size % 8 != 0:
                errors.append({
                    "filename": file.filename,
                    "error": "File size invalid - must be multiple of 8 bytes (complex64 format)"
                })
                continue

            # Sanitize filename
            import re
            safe_filename = re.sub(r'[^\w\s.-]', '', file.filename)
            safe_filename = safe_filename.replace(' ', '-')

            # Handle filename conflicts
            base_name = os.path.splitext(safe_filename)[0]
            extension = os.path.splitext(safe_filename)[1]
            final_filename = safe_filename
            counter = 1

            while os.path.exists(os.path.join(IQ_LIBRARY_DIR, final_filename)):
                final_filename = f"{base_name}-{counter}{extension}"
                counter += 1

            # Save file
            file_path = os.path.join(IQ_LIBRARY_DIR, final_filename)
            with open(file_path, 'wb') as f:
                f.write(content)

            # Calculate metadata
            stat = os.stat(file_path)
            num_samples = file_size // 8
            sample_rate = 1024000
            duration_seconds = num_samples / sample_rate

            uploaded.append({
                'filename': final_filename,
                'original_filename': file.filename,
                'path': f"/iq_library/{final_filename}",
                'size': file_size,
                'size_mb': round(file_size / (1024 * 1024), 2),
                'duration_seconds': round(duration_seconds, 1),
                'num_samples': num_samples,
                'modified': stat.st_mtime
            })

        except Exception as e:
            errors.append({
                "filename": file.filename,
                "error": f"Upload failed: {str(e)}"
            })

    return {
        "success": len(uploaded) > 0,
        "uploaded": uploaded,
        "errors": errors,
        "total": len(files),
        "successful": len(uploaded),
        "failed": len(errors)
    }


@app.delete("/api/v1/iq-library")
def delete_iq_file(path: str):
    """Delete an IQ file from the library."""
    # Ensure path starts with /iq_library/
    if not path.startswith('/iq_library/'):
        raise HTTPException(status_code=400, detail="Invalid IQ library path")

    # Convert to filesystem path
    relative_path = path[13:]  # Remove '/iq_library/' prefix
    file_path = os.path.join(IQ_LIBRARY_DIR, relative_path)

    # Security: Ensure path is within IQ_LIBRARY_DIR
    real_library_dir = os.path.realpath(IQ_LIBRARY_DIR)
    real_file_path = os.path.realpath(file_path)

    if not real_file_path.startswith(real_library_dir):
        raise HTTPException(status_code=403, detail="Access denied")

    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    if not os.path.isfile(file_path):
        raise HTTPException(status_code=400, detail="Path is not a file")

    try:
        os.remove(file_path)
        return {
            "success": True,
            "message": "IQ file deleted successfully",
            "path": path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")
