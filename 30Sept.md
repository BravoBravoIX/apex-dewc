# SCIP v3 Implementation Plan - September 30

## Objective
Implement Exercise Control page with real-time timer and inject tracking using proven patterns from scip-range and portfall-archive.

## Current State
- ✅ Docker deployment of team dashboards works
- ✅ MQTT inject publishing works (shows raw JSON on dashboards)
- ✅ Scenarios dynamically loaded from JSON files
- ✅ Basic start/stop exercise functionality
- ⚠️ No exercise timer display
- ⚠️ No inject delivery tracking
- ⚠️ No pause/resume capability
- ⚠️ Exercise Control page is placeholder

## Implementation Plan

### Phase 1: Add Redis Support (30 min)
**Purpose:** Add Redis for state management using scip-range patterns

#### 1.1 Update Requirements
```python
# orchestration/requirements.txt
fastapi
uvicorn
paho-mqtt
docker
redis==5.0.0  # ADD THIS
```

#### 1.2 Create Redis Manager
```python
# orchestration/app/redis_manager.py
import json
import time
from typing import Dict, Optional
import redis

class RedisManager:
    def __init__(self):
        self.redis = redis.Redis(host='redis', port=6379, decode_responses=True)
        self.EXERCISE_TTL = 86400  # 24 hours

    async def set_exercise_state(self, scenario_name: str, state: str):
        """Store exercise state (NOT_STARTED, RUNNING, PAUSED, STOPPED)"""
        key = f"exercise:{scenario_name}:state"
        self.redis.set(key, state, ex=self.EXERCISE_TTL)

    async def update_timer(self, scenario_name: str, elapsed: float):
        """Update exercise timer"""
        key = f"exercise:{scenario_name}:timer"
        formatted = f"T+{int(elapsed//60):02d}:{int(elapsed%60):02d}"
        self.redis.set(key, json.dumps({
            "elapsed": elapsed,
            "formatted": formatted,
            "timestamp": time.time()
        }), ex=self.EXERCISE_TTL)

    async def record_inject_delivery(self, scenario_name: str, team_id: str,
                                    inject_id: str, status: str):
        """Record inject delivery status"""
        key = f"exercise:{scenario_name}:team:{team_id}:delivered"
        self.redis.sadd(key, inject_id)

        # Update team delivery count
        count_key = f"exercise:{scenario_name}:team:{team_id}:count"
        self.redis.incr(count_key)

    async def get_exercise_status(self, scenario_name: str) -> Dict:
        """Get complete exercise status"""
        state = self.redis.get(f"exercise:{scenario_name}:state") or "NOT_STARTED"
        timer_data = self.redis.get(f"exercise:{scenario_name}:timer")
        timer = json.loads(timer_data) if timer_data else {"elapsed": 0, "formatted": "T+00:00"}

        # Get team statuses
        teams = []
        for team_id in ['blue', 'red']:  # TODO: Get from scenario
            delivered = self.redis.scard(f"exercise:{scenario_name}:team:{team_id}:delivered") or 0
            teams.append({
                "id": team_id,
                "delivered": delivered,
                "status": "connected"  # TODO: Track MQTT status
            })

        return {
            "state": state,
            "timer": timer,
            "teams": teams
        }
```

#### 1.3 Add Redis to Docker Compose
```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    container_name: scip-redis
    ports:
      - "6379:6379"
    networks:
      - scip-network
    volumes:
      - redis-data:/data  # Persist Redis data
    command: redis-server --appendonly yes  # Enable persistence

volumes:
  redis-data:
```

#### 1.4 Update Orchestration Service Dependencies
```yaml
# docker-compose.yml - update orchestration service
  orchestration:
    build: ./orchestration
    container_name: scip-orchestration
    ports:
      - "8001:8001"
    volumes:
      - ./scenarios:/scenarios:ro
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - scip-network
    depends_on:
      - mqtt
      - redis  # ADD THIS
```

### Phase 2: Update Exercise Executor (45 min)
**Purpose:** Add timer management and state tracking

#### 2.1 Update Executor Class
```python
# orchestration/app/executor.py
import asyncio
import json
import os
import time
import paho.mqtt.client as mqtt
import docker
from redis_manager import RedisManager

class ExerciseExecutor:
    def __init__(self, scenario_name: str):
        self.scenario_name = scenario_name
        self.redis_manager = RedisManager()
        self.state = "NOT_STARTED"
        self.start_time = None
        self.pause_time = None
        self.elapsed_at_pause = 0
        # ... existing init code ...

    async def start(self):
        """Starts the exercise execution"""
        self._connect_mqtt()
        self.load_scenario()
        self._deploy_team_dashboards()

        # Set initial state
        self.state = "RUNNING"
        self.start_time = time.time()
        await self.redis_manager.set_exercise_state(self.scenario_name, "RUNNING")

        self.is_running = True
        asyncio.create_task(self.run())
        return {
            "status": "Exercise started",
            "scenario": self.scenario_name,
            "dashboard_urls": self.dashboard_urls
        }

    async def pause(self):
        """Pause the exercise"""
        if self.state == "RUNNING":
            self.state = "PAUSED"
            self.pause_time = time.time()
            self.elapsed_at_pause += (self.pause_time - self.start_time)
            await self.redis_manager.set_exercise_state(self.scenario_name, "PAUSED")
            return {"status": "Exercise paused"}
        return {"status": "Exercise not running"}

    async def resume(self):
        """Resume the exercise"""
        if self.state == "PAUSED":
            self.state = "RUNNING"
            self.start_time = time.time()
            await self.redis_manager.set_exercise_state(self.scenario_name, "RUNNING")
            return {"status": "Exercise resumed"}
        return {"status": "Exercise not paused"}

    async def run(self):
        """The main exercise loop with timer"""
        published_injects = set()

        while self.is_running:
            if self.state == "RUNNING":
                # Calculate elapsed time
                current_elapsed = self.elapsed_at_pause + (time.time() - self.start_time)
                elapsed_seconds = int(current_elapsed)

                # Publish timer update
                timer_topic = f"/exercise/{self.scenario_name}/timer"
                timer_payload = {
                    "elapsed": elapsed_seconds,
                    "formatted": f"T+{elapsed_seconds//60:02d}:{elapsed_seconds%60:02d}"
                }
                self.mqtt_client.publish(timer_topic, json.dumps(timer_payload), qos=0)

                # Update Redis
                await self.redis_manager.update_timer(self.scenario_name, elapsed_seconds)

                # Check and publish injects
                for team_id, timeline in self.timelines.items():
                    for inject in timeline.get('injects', []):
                        inject_id = inject.get('id')
                        inject_time = inject.get('time')

                        if inject_time == elapsed_seconds and inject_id not in published_injects:
                            topic = f"/exercise/{self.scenario_name}/team/{team_id}/feed"
                            payload = json.dumps(inject)

                            print(f"Publishing inject {inject_id} to {topic}")
                            self.mqtt_client.publish(topic, payload, qos=1)
                            published_injects.add(inject_id)

                            # Record delivery
                            await self.redis_manager.record_inject_delivery(
                                self.scenario_name, team_id, inject_id, "delivered"
                            )

            await asyncio.sleep(1)

    def stop(self):
        """Stops the exercise execution"""
        self.is_running = False
        self.state = "STOPPED"
        # ... existing stop code ...
```

### Phase 3: Add Exercise Control API Endpoints (30 min)
**Purpose:** Expose exercise status and control via API

#### 3.1 Update API Endpoints
```python
# orchestration/app/main.py
from redis_manager import RedisManager

# Add Redis manager instance
redis_manager = RedisManager()

@app.get("/api/v1/exercises/{scenario_name}/status")
async def get_exercise_status(scenario_name: str):
    """Get real-time exercise status"""
    if scenario_name not in active_exercises:
        return {
            "state": "NOT_STARTED",
            "timer": {"formatted": "T+00:00", "elapsed": 0},
            "teams": []
        }

    status = await redis_manager.get_exercise_status(scenario_name)

    # Add inject totals from timeline
    executor = active_exercises[scenario_name]
    total_injects = {}
    for team_id, timeline in executor.timelines.items():
        total_injects[team_id] = len(timeline.get('injects', []))

    # Enhance team data
    for team in status['teams']:
        team['total'] = total_injects.get(team['id'], 0)
        team['port'] = executor.dashboard_urls.get(team['id'], '').split(':')[-1]

    return status

@app.post("/api/v1/exercises/{scenario_name}/pause")
async def pause_exercise(scenario_name: str):
    """Pause a running exercise"""
    if scenario_name not in active_exercises:
        raise HTTPException(status_code=404, detail="Exercise not running")

    executor = active_exercises[scenario_name]
    result = await executor.pause()
    return result

@app.post("/api/v1/exercises/{scenario_name}/resume")
async def resume_exercise(scenario_name: str):
    """Resume a paused exercise"""
    if scenario_name not in active_exercises:
        raise HTTPException(status_code=404, detail="Exercise not running")

    executor = active_exercises[scenario_name]
    result = await executor.resume()
    return result

@app.get("/api/v1/exercises/current")
async def get_current_exercise():
    """Get the currently active exercise"""
    if not active_exercises:
        return {"active": False}

    # Return first active exercise (we only support one at a time)
    scenario_name = list(active_exercises.keys())[0]
    status = await get_exercise_status(scenario_name)
    return {
        "active": True,
        "scenario_name": scenario_name,
        **status
    }
```

### Phase 4: Implement Exercise Control Page (45 min)
**Purpose:** Create functional UI for exercise monitoring

#### 4.1 Update Exercise Control Page
```typescript
// client-dashboard/src/pages/ExerciseControlPage.tsx
import { useState, useEffect } from 'react';

interface ExerciseStatus {
  state: 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'STOPPED';
  timer: {
    formatted: string;
    elapsed: number;
  };
  teams: Array<{
    id: string;
    delivered: number;
    total: number;
    status: string;
    port: string;
  }>;
  scenario_name?: string;
}

const ExerciseControlPage = () => {
  const [status, setStatus] = useState<ExerciseStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Poll status every second
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/v1/exercises/current');
        const data = await res.json();
        if (data.active) {
          setStatus(data);
        } else {
          setStatus(null);
        }
      } catch (error) {
        console.error('Failed to fetch status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    // Start would be initiated from Scenarios page
    setLoading(false);
  };

  const handlePause = async () => {
    if (!status?.scenario_name) return;
    setLoading(true);
    await fetch(`http://localhost:8001/api/v1/exercises/${status.scenario_name}/pause`, {
      method: 'POST'
    });
    setLoading(false);
  };

  const handleResume = async () => {
    if (!status?.scenario_name) return;
    setLoading(true);
    await fetch(`http://localhost:8001/api/v1/exercises/${status.scenario_name}/resume`, {
      method: 'POST'
    });
    setLoading(false);
  };

  const handleStop = async () => {
    if (!status?.scenario_name) return;
    setLoading(true);
    await fetch(`http://localhost:8001/api/v1/exercises/${status.scenario_name}/stop`, {
      method: 'POST'
    });
    setLoading(false);
  };

  if (!status) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4">Exercise Control</h2>
        <div className="card p-6">
          <p className="text-text-secondary">No active exercise. Start one from the Scenarios page.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">
        Exercise Control - {status.scenario_name}
      </h2>

      {/* Timer Display */}
      <div className="card p-6 mb-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">
            {status.timer.formatted}
          </div>
          <div className="text-text-secondary">
            Status: {status.state}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="card p-4 mb-4">
        <div className="flex gap-2 justify-center">
          {status.state === 'RUNNING' && (
            <button
              onClick={handlePause}
              disabled={loading}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded"
            >
              ⏸ Pause
            </button>
          )}
          {status.state === 'PAUSED' && (
            <button
              onClick={handleResume}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              ▶ Resume
            </button>
          )}
          <button
            onClick={handleStop}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            ⏹ Stop
          </button>
        </div>
      </div>

      {/* Team Status Table */}
      <div className="card p-4">
        <h3 className="text-xl font-semibold mb-3">Team Status</h3>
        <table className="w-full">
          <thead>
            <tr className="text-left text-text-secondary">
              <th className="pb-2">Team</th>
              <th className="pb-2">Port</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Injects Delivered</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {status.teams.map(team => (
              <tr key={team.id} className="border-t border-gray-700">
                <td className="py-2 capitalize">{team.id} Team</td>
                <td className="py-2">{team.port}</td>
                <td className="py-2">
                  <span className="text-green-500">✓ Connected</span>
                </td>
                <td className="py-2">
                  {team.delivered} / {team.total}
                </td>
                <td className="py-2">
                  <a
                    href={`http://localhost:${team.port}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    View Dashboard →
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExerciseControlPage;
```

### Phase 5: Enhance Team Dashboard Display (30 min)
**Purpose:** Better inject display (optional for MVP)

#### 5.1 Update Team Dashboard
```typescript
// team-dashboard/src/App.tsx
function App() {
  const teamId = import.meta.env.VITE_TEAM_ID || 'default-team';
  const topic = import.meta.env.VITE_MQTT_TOPIC || '/exercise/test/team/default/feed';
  const timerTopic = topic.replace('/feed', '').replace('/team/' + teamId, '/timer');
  const brokerUrl = import.meta.env.VITE_BROKER_URL || 'ws://localhost:9001';

  const { messages } = useMqtt(brokerUrl, [topic, timerTopic]);
  const [timer, setTimer] = useState('T+00:00');
  const [injects, setInjects] = useState([]);

  useEffect(() => {
    messages.forEach(msg => {
      try {
        const parsed = JSON.parse(msg);
        if (parsed.formatted) {
          // Timer message
          setTimer(parsed.formatted);
        } else if (parsed.id) {
          // Inject message
          setInjects(prev => [parsed, ...prev]);
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    });
  }, [messages]);

  return (
    <div className="bg-background text-text-primary min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">
            Team Dashboard: <span className="text-primary capitalize">{teamId}</span>
          </h1>
          <div className="text-xl font-mono">{timer}</div>
        </div>

        <div className="bg-surface p-4 rounded-lg card">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Received Injects ({injects.length})
          </h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {injects.map((inject, idx) => (
              <div key={idx} className="bg-background p-3 rounded border border-gray-700">
                <div className="flex justify-between text-sm text-text-secondary mb-1">
                  <span>ID: {inject.id}</span>
                  <span>Time: T+{inject.time}s</span>
                </div>
                <div className="text-text-primary">
                  {inject.message || inject.content || JSON.stringify(inject.data)}
                </div>
              </div>
            ))}
            {injects.length === 0 && (
              <p className="text-text-secondary">Waiting for injects...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Important Notes & Gotchas

### Timeline JSON Format
Ensure your timeline JSON files use the `time` field in seconds:
```json
{
  "injects": [
    {
      "id": "inject-001",
      "time": 0,      // T+00:00
      "type": "news",
      "content": "Exercise begins..."
    },
    {
      "id": "inject-002",
      "time": 60,     // T+01:00
      "type": "email",
      "content": "Urgent update..."
    },
    {
      "id": "inject-003",
      "time": 300,    // T+05:00
      "type": "social",
      "content": "Breaking news..."
    }
  ]
}
```

### MQTT Topic Structure
The system uses these MQTT topics:
- `/exercise/{scenario_name}/timer` - Timer updates every second
- `/exercise/{scenario_name}/team/{team_id}/feed` - Team-specific injects
- `/exercise/{scenario_name}/control` - Control commands (future)

### Port Allocations
- 3001: Client Dashboard
- 3100-3199: Team Dashboard range
- 8001: Orchestration API
- 1883: MQTT (TCP)
- 9001: MQTT (WebSocket)
- 6379: Redis

### Phase 6: Update Client Dashboard Pages (15 min)
**Purpose:** Make all dashboard pages dynamic and show real-time status

#### 6.1 Update Dashboard Page
```typescript
// client-dashboard/src/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import Card from "@/components/common/Card.tsx";
import ScenarioCard from "@/components/scenarios/ScenarioCard.tsx";

const DashboardPage = () => {
  const [activeCount, setActiveCount] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/v1/exercises/current');
        const data = await res.json();
        setActiveCount(data.active ? 1 : 0);
        setCurrentExercise(data.active ? data : null);
      } catch (error) {
        console.error('Failed to fetch exercise status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="text-center p-6">
          <h3 className="text-3xl font-bold">3</h3>
          <p className="text-text-secondary">Scenarios Available</p>
        </Card>
        <Card className="text-center p-6">
          <h3 className="text-3xl font-bold">12</h3>
          <p className="text-text-secondary">Inject Timelines</p>
        </Card>
        <Card className="text-center p-6">
          <h3 className="text-3xl font-bold text-primary">{activeCount}</h3>
          <p className="text-text-secondary">Active Exercises</p>
        </Card>
      </div>

      {currentExercise && (
        <div className="mb-4">
          <Card className="p-4 bg-green-900/20 border-green-500">
            <h3 className="text-lg font-semibold text-green-400">Exercise Running</h3>
            <p className="text-text-primary">{currentExercise.scenario_name}</p>
            <p className="text-2xl font-mono mt-2">{currentExercise.timer?.formatted}</p>
            <a href="/control" className="text-primary hover:underline mt-2 inline-block">
              Go to Exercise Control →
            </a>
          </Card>
        </div>
      )}

      <div>
        <h3 className="text-xl font-bold mb-4">Quick Start</h3>
        <ScenarioCard
          title="Indo-Pacific Crisis"
          description="A multi-domain crisis response scenario requiring coordination between naval, intelligence, and diplomatic teams."
          duration={60}
          maxTeams={10}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
```

#### 6.2 Update Scenarios Page to Show Running Status
```typescript
// client-dashboard/src/pages/ScenariosPage.tsx - Add to existing component
const ScenariosPage = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [dashboardUrls, setDashboardUrls] = useState<{[key: string]: string} | null>(null);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);

  // Add effect to check for active scenario
  useEffect(() => {
    const checkActive = async () => {
      try {
        const res = await fetch('http://localhost:8001/api/v1/exercises/current');
        const data = await res.json();
        if (data.active) {
          setActiveScenario(data.scenario_name);
        } else {
          setActiveScenario(null);
        }
      } catch (error) {
        console.error('Failed to check active scenario:', error);
      }
    };

    checkActive();
    const interval = setInterval(checkActive, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update the render to show status badge
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Scenarios</h1>
      {loading ? (
        <div className="text-text-secondary">Loading scenarios...</div>
      ) : scenarios.length === 0 ? (
        <div className="text-text-secondary">No scenarios found. Add JSON files to the scenarios folder.</div>
      ) : (
        <div className="space-y-4">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="card p-6 flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-semibold text-text-primary">{scenario.name}</h2>
                  {activeScenario === scenario.id && (
                    <span className="bg-green-500 text-white text-sm px-2 py-1 rounded animate-pulse">
                      ● Running
                    </span>
                  )}
                </div>
                <p className="text-text-secondary mb-2">{scenario.description}</p>
                <div className="flex gap-4 text-sm text-text-secondary">
                  <span>Duration: {scenario.duration_minutes} min</span>
                  <span>•</span>
                  <span>Teams: {scenario.team_count}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startScenario(scenario.id)}
                  disabled={activeScenario !== null}
                  className={`font-bold py-2 px-4 rounded ${
                    activeScenario !== null
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-primary hover:bg-blue-700 text-white'
                  }`}
                >
                  Deploy Exercise
                </button>
                <button
                  onClick={() => stopScenario(scenario.id)}
                  disabled={activeScenario !== scenario.id}
                  className={`font-bold py-2 px-4 rounded ${
                    activeScenario === scenario.id
                      ? 'bg-red-600 hover:bg-red-800 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  End Exercise
                </button>
                {activeScenario === scenario.id && (
                  <a
                    href="/control"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Control →
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {/* ... rest of existing status display code ... */}
    </div>
  );
};
```

## Testing Plan

1. **Start Redis container first**
   ```bash
   docker-compose up -d redis
   ```

2. **Rebuild orchestration service**
   ```bash
   docker-compose build orchestration
   docker-compose up -d orchestration
   ```

3. **Rebuild client dashboard**
   ```bash
   cd client-dashboard && npm run build && cd ..
   docker-compose build client-dashboard
   docker-compose up -d client-dashboard
   ```

4. **Test sequence:**
   - Navigate to Scenarios page
   - Deploy Exercise (starts containers)
   - Navigate to Exercise Control page
   - Verify timer is running
   - Test pause/resume buttons
   - Verify inject delivery counts
   - Check team dashboards for received injects

## Success Criteria

- [ ] Timer displays and updates every second
- [ ] Pause/Resume functionality works
- [ ] Team status shows inject delivery progress
- [ ] Team dashboards receive and display injects
- [ ] Exercise state persists in Redis
- [ ] Stop button cleans up properly

## Troubleshooting

### Common Issues & Solutions

1. **Redis Connection Error**
   - Ensure Redis container is running: `docker ps | grep redis`
   - Check Redis connectivity: `docker exec -it scip-redis redis-cli ping`
   - Should return "PONG"

2. **Injects Not Appearing**
   - Check MQTT broker is running: `docker logs scip-mqtt`
   - Verify timeline JSON format (time in seconds)
   - Check team dashboard console for errors

3. **Timer Not Updating**
   - Verify Redis is accessible from orchestration service
   - Check orchestration logs: `docker logs scip-orchestration`
   - Ensure exercise is in RUNNING state

4. **Import Errors in Python**
   - Rebuild orchestration container after adding redis to requirements.txt
   - `docker-compose build --no-cache orchestration`

## Next Steps After This

1. **Immediate Enhancements**
   - Style feed components for better inject display
   - Add inject type icons (📰 News, 📧 Email, 📱 Social)
   - Add sound notifications for new injects

2. **Performance Improvements**
   - Add WebSocket for real-time updates (replace polling)
   - Implement Redis connection pooling
   - Add caching for scenario data

3. **Reliability Features**
   - Add inject retry mechanism for failed deliveries
   - Implement exercise state recovery after crash
   - Add health checks for all services

4. **Advanced Features**
   - Exercise replay functionality
   - Detailed logging and audit trail
   - Multi-exercise support (concurrent exercises)
   - Exercise analytics and reporting