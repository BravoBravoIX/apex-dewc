# Exercise Orchestration Engine

## Overview

The Orchestration Service is the heart of the SCIP v3 platform, managing exercise execution, timeline synchronization, and inject delivery via MQTT. It ensures all teams receive their designated injects at precisely the right time during synchronized exercises.

## Core Components

### 1. Exercise Timer

The central timer that synchronizes all teams and triggers inject delivery.

```python
class ExerciseTimer:
    """Manages the global exercise timer"""
    
    def __init__(self, exercise_id: str, duration_minutes: int):
        self.exercise_id = exercise_id
        self.duration = duration_minutes * 60  # Convert to seconds
        self.start_time = None
        self.current_time = 0
        self.is_running = False
        self.is_paused = False
        
    async def start(self):
        """Start the exercise timer"""
        self.is_running = True
        self.start_time = datetime.now()
        
        while self.is_running and self.current_time < self.duration:
            if not self.is_paused:
                # Increment timer
                self.current_time += 1
                
                # Publish timer update
                await self.publish_timer_update()
                
                # Check for injects to deliver
                await self.check_inject_schedule(self.current_time)
                
            await asyncio.sleep(1)
    
    async def pause(self):
        """Pause the exercise timer"""
        self.is_paused = True
        await self.publish_status_update("paused")
    
    async def resume(self):
        """Resume the exercise timer"""
        self.is_paused = False
        await self.publish_status_update("running")
    
    async def stop(self):
        """Stop the exercise timer"""
        self.is_running = False
        await self.publish_status_update("stopped")
```

### 2. Timeline Executor

Manages timeline loading and inject delivery for all teams.

```python
class TimelineExecutor:
    """Executes timeline injects for all teams"""
    
    def __init__(self, exercise_id: str, teams_config: dict):
        self.exercise_id = exercise_id
        self.teams = teams_config
        self.timelines = {}
        self.delivered_injects = []
        self.missed_injects = []
        self.mqtt_client = MQTTPublisher()
        
    def load_timelines(self):
        """Load timeline JSON files for each team"""
        for team in self.teams:
            timeline_path = f"/media/exercises/{self.exercise_id}/timelines/{team['timeline_id']}.json"
            with open(timeline_path, 'r') as f:
                self.timelines[team['id']] = json.load(f)
                
    async def check_and_deliver_injects(self, current_time: int):
        """Check all timelines for injects at current time"""
        for team_id, timeline in self.timelines.items():
            for inject in timeline['injects']:
                if inject['time'] == current_time:
                    await self.deliver_inject(team_id, inject)
    
    async def deliver_inject(self, team_id: str, inject: dict):
        """Deliver inject to specific team via MQTT"""
        try:
            topic = f"/exercise/{self.exercise_id}/team/{team_id}/feed"
            
            message = {
                "id": inject['id'],
                "timestamp": datetime.utcnow().isoformat(),
                "exerciseTime": inject['time'],
                "type": inject['type'],
                "content": inject['content']
            }
            
            success = await self.mqtt_client.publish(topic, json.dumps(message))
            
            if success:
                self.delivered_injects.append({
                    "team_id": team_id,
                    "inject_id": inject['id'],
                    "delivered_at": datetime.utcnow(),
                    "exercise_time": inject['time']
                })
                logger.info(f"Delivered {inject['type']} to {team_id} at T+{inject['time']}")
            else:
                self.handle_failed_delivery(team_id, inject)
                
        except Exception as e:
            logger.error(f"Failed to deliver inject: {e}")
            self.handle_failed_delivery(team_id, inject)
    
    def handle_failed_delivery(self, team_id: str, inject: dict):
        """Handle failed inject delivery"""
        self.missed_injects.append({
            "team_id": team_id,
            "inject": inject,
            "attempted_at": datetime.utcnow(),
            "retry_count": 0,
            "status": "failed"
        })
        
    async def retry_missed_inject(self, missed_inject_id: str):
        """Manually retry a missed inject"""
        missed = self.missed_injects[missed_inject_id]
        missed['retry_count'] += 1
        await self.deliver_inject(missed['team_id'], missed['inject'])
```

### 3. MQTT Publisher

Handles all MQTT communication for the orchestration service.

```python
class MQTTPublisher:
    """Manages MQTT connections and publishing"""
    
    def __init__(self):
        self.client = mqtt.Client()
        self.connected = False
        self.setup_client()
        
    def setup_client(self):
        """Configure MQTT client"""
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.connect("localhost", 1883, 60)
        self.client.loop_start()
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback for successful connection"""
        if rc == 0:
            self.connected = True
            logger.info("Connected to MQTT broker")
        else:
            logger.error(f"Failed to connect to MQTT broker: {rc}")
            
    def on_disconnect(self, client, userdata, rc):
        """Callback for disconnection"""
        self.connected = False
        if rc != 0:
            logger.warning("Unexpected MQTT disconnection, attempting reconnect")
            
    async def publish(self, topic: str, message: str, qos: int = 1) -> bool:
        """Publish message to MQTT topic"""
        if not self.connected:
            logger.error("Not connected to MQTT broker")
            return False
            
        try:
            result = self.client.publish(topic, message, qos=qos)
            return result.rc == mqtt.MQTT_ERR_SUCCESS
        except Exception as e:
            logger.error(f"Failed to publish MQTT message: {e}")
            return False
```

## Exercise Lifecycle

### 1. Initialization Phase
```python
async def initialize_exercise(exercise_config: dict):
    """Initialize a new exercise"""
    
    # Create exercise instance
    exercise = {
        "id": generate_exercise_id(),
        "scenario_id": exercise_config["scenario_id"],
        "teams": exercise_config["teams"],
        "duration": exercise_config["duration"],
        "status": "initialized",
        "created_at": datetime.utcnow()
    }
    
    # Deploy team dashboards
    for team in exercise["teams"]:
        dashboard_url = await deploy_team_dashboard(
            exercise_id=exercise["id"],
            team_id=team["id"],
            team_config=team
        )
        team["dashboard_url"] = dashboard_url
    
    # Load timelines
    executor = TimelineExecutor(exercise["id"], exercise["teams"])
    executor.load_timelines()
    
    # Initialize timer
    timer = ExerciseTimer(exercise["id"], exercise["duration"])
    
    return exercise, timer, executor
```

### 2. Execution Phase
```python
async def start_exercise(exercise_id: str):
    """Start exercise execution"""
    
    # Get exercise components
    exercise = get_exercise(exercise_id)
    timer = get_timer(exercise_id)
    executor = get_executor(exercise_id)
    
    # Publish start notification
    await mqtt_publisher.publish(
        f"/exercise/{exercise_id}/control",
        json.dumps({"command": "start", "timestamp": datetime.utcnow().isoformat()})
    )
    
    # Start timer (this runs the main exercise loop)
    await timer.start()
    
    # Exercise complete
    await complete_exercise(exercise_id)
```

### 3. Control Commands
```python
async def handle_control_command(exercise_id: str, command: str):
    """Handle exercise control commands"""
    
    timer = get_timer(exercise_id)
    
    commands = {
        "start": timer.start,
        "pause": timer.pause,
        "resume": timer.resume,
        "stop": timer.stop,
        "reset": lambda: reset_exercise(exercise_id)
    }
    
    if command in commands:
        await commands[command]()
        logger.info(f"Executed command '{command}' for exercise {exercise_id}")
    else:
        logger.error(f"Unknown command: {command}")
```

## Timeline Synchronization

### Synchronized Delivery
All teams operate on the same global timer, ensuring synchronized inject delivery:

```
T+0:00  → All teams receive briefing
T+1:00  → Blue and Red receive Tweet
T+2:00  → All teams receive Email
T+5:00  → Blue, Orange, Green receive SMS
T+10:00 → Blue and Orange receive Video
```

### Timeline Assignment
Teams can share timelines or have unique ones:

```python
teams_config = [
    {"id": "blue", "timeline_id": "blue-standard"},
    {"id": "red", "timeline_id": "red-aggressive"},
    {"id": "orange", "timeline_id": "blue-standard"},  # Shares with Blue
    {"id": "green", "timeline_id": "custom-timeline"}
]
```

## MQTT Topic Management

### Topic Structure
```
/exercise/{exerciseId}/control         # Exercise control commands
/exercise/{exerciseId}/timer          # Timer updates
/exercise/{exerciseId}/status         # Status updates
/exercise/{exerciseId}/team/{teamId}/feed  # Team-specific injects
/exercise/{exerciseId}/monitoring     # Monitoring data
```

### Message Formats

#### Timer Update
```json
{
  "current": 332,
  "total": 2700,
  "formatted": "T+05:32",
  "percentage": 12.3,
  "status": "running"
}
```

#### Inject Message
```json
{
  "id": "inject-042",
  "timestamp": "2024-01-15T10:05:32Z",
  "exerciseTime": 332,
  "type": "social",
  "content": {
    "platform": "twitter",
    "username": "@BreakingNews",
    "verified": true,
    "text": "BREAKING: Situation escalating...",
    "likes": 1523,
    "retweets": 342
  }
}
```

#### Control Command
```json
{
  "command": "pause",
  "timestamp": "2024-01-15T10:05:45Z",
  "reason": "Technical issue with Team Green"
}
```

## Failure Handling

### Delivery Failures
```python
class FailureHandler:
    """Handles inject delivery failures"""
    
    def __init__(self):
        self.retry_queue = []
        self.max_retries = 3
        self.retry_delay = 5  # seconds
        
    async def handle_failure(self, team_id: str, inject: dict, error: str):
        """Handle delivery failure"""
        
        failure_record = {
            "id": generate_id(),
            "team_id": team_id,
            "inject": inject,
            "error": error,
            "timestamp": datetime.utcnow(),
            "retry_count": 0,
            "status": "pending_retry"
        }
        
        self.retry_queue.append(failure_record)
        
        # Attempt automatic retry
        await self.schedule_retry(failure_record)
        
    async def schedule_retry(self, failure_record: dict):
        """Schedule automatic retry"""
        
        if failure_record["retry_count"] < self.max_retries:
            await asyncio.sleep(self.retry_delay)
            await self.retry_delivery(failure_record)
        else:
            failure_record["status"] = "failed"
            await self.notify_failure(failure_record)
            
    async def manual_retry(self, failure_id: str):
        """Manually retry a failed inject"""
        
        failure = next(f for f in self.retry_queue if f["id"] == failure_id)
        failure["retry_count"] = 0  # Reset retry count for manual retry
        await self.retry_delivery(failure)
```

## Monitoring & Logging

### Exercise Metrics
```python
class ExerciseMetrics:
    """Tracks exercise metrics"""
    
    def __init__(self, exercise_id: str):
        self.exercise_id = exercise_id
        self.metrics = {
            "injects_scheduled": 0,
            "injects_delivered": 0,
            "injects_failed": 0,
            "teams_connected": 0,
            "average_delivery_latency": 0,
            "exercise_duration": 0
        }
        
    def update_metrics(self):
        """Update metrics in real-time"""
        # Publish to monitoring topic
        mqtt_publisher.publish(
            f"/exercise/{self.exercise_id}/monitoring",
            json.dumps(self.metrics)
        )
```

### Logging
```python
import structlog

logger = structlog.get_logger()

# Structured logging for better observability
logger.info(
    "inject_delivered",
    exercise_id=exercise_id,
    team_id=team_id,
    inject_type=inject["type"],
    exercise_time=current_time,
    delivery_latency_ms=latency
)
```

## Performance Optimization

### Timer Precision
- Use high-precision timer (asyncio)
- Account for processing delays
- Compensate for drift over time

### Batch Processing
```python
async def batch_deliver_injects(injects_by_team: dict):
    """Deliver multiple injects in parallel"""
    
    tasks = []
    for team_id, injects in injects_by_team.items():
        for inject in injects:
            task = asyncio.create_task(deliver_inject(team_id, inject))
            tasks.append(task)
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results
```

### Resource Management
- Connection pooling for MQTT
- Efficient JSON parsing
- Memory-mapped file access for large timelines
- Async I/O for all operations

## Configuration

### Environment Variables
```bash
# MQTT Configuration
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
MQTT_QOS_LEVEL=1

# Exercise Configuration
MAX_EXERCISE_DURATION=7200  # 2 hours in seconds
MAX_TEAMS_PER_EXERCISE=10
MAX_INJECTS_PER_TIMELINE=1000

# Performance Configuration
TIMER_PRECISION_MS=100
DELIVERY_TIMEOUT_MS=5000
RETRY_DELAY_SECONDS=5
MAX_RETRY_ATTEMPTS=3

# Storage Configuration
MEDIA_STORAGE_PATH=/media/exercises
TIMELINE_STORAGE_PATH=/media/exercises/timelines
```

## Testing

### Unit Tests
```python
async def test_timer_accuracy():
    """Test timer maintains accuracy over time"""
    timer = ExerciseTimer("test-001", 10)  # 10 minute exercise
    await timer.start()
    
    # Verify timer increments correctly
    assert timer.current_time == 600  # 600 seconds
    
async def test_inject_delivery():
    """Test inject delivery to correct teams"""
    executor = TimelineExecutor("test-001", test_teams)
    await executor.deliver_inject("blue", test_inject)
    
    # Verify inject delivered to correct topic
    assert mqtt_messages[0]["topic"] == "/exercise/test-001/team/blue/feed"
```

### Integration Tests
- Full exercise execution
- Multi-team synchronization
- Failure recovery
- Performance under load
