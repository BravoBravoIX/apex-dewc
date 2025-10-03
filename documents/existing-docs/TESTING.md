# Testing Guide

## Overview

This guide covers testing strategies, tools, and procedures for the SCIP v3 platform, including unit tests, integration tests, end-to-end tests, and load testing.

## Testing Architecture

```
┌─────────────────────────────────────────────────┐
│                Testing Pyramid                   │
├─────────────────────────────────────────────────┤
│                                                   │
│                  E2E Tests                        │
│               (5-10% coverage)                    │
│            Multi-team exercises                   │
│                                                   │
│           Integration Tests                       │
│           (20-30% coverage)                       │
│       API endpoints, MQTT flow                    │
│                                                   │
│            Unit Tests                             │
│          (60-70% coverage)                        │
│    Functions, components, utilities               │
│                                                   │
└─────────────────────────────────────────────────┘
```

## Test Environment Setup

### Docker Test Environment

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  test-postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: scip_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_pass
    tmpfs:
      - /var/lib/postgresql/data  # Use memory for speed

  test-redis:
    image: redis:7-alpine
    command: redis-server --save ""  # No persistence

  test-mqtt:
    image: eclipse-mosquitto:2.0
    volumes:
      - ./mqtt/test.conf:/mosquitto/config/mosquitto.conf

  test-runner:
    build: 
      context: .
      dockerfile: Dockerfile.test
    depends_on:
      - test-postgres
      - test-redis
      - test-mqtt
    command: npm test
```

### Test Configuration

```env
# .env.test
NODE_ENV=test
APP_ENV=test
DB_NAME=scip_test
DB_USER=test_user
DB_PASSWORD=test_pass
REDIS_DB=1
MQTT_HOST=test-mqtt
LOG_LEVEL=error
```

## Frontend Testing

### React Component Testing

```typescript
// client-dashboard/src/components/Timeline.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timeline } from './Timeline';
import { mockTimeline } from '../__mocks__/timeline';

describe('Timeline Component', () => {
  it('renders timeline with injects', () => {
    render(<Timeline timeline={mockTimeline} />);
    
    expect(screen.getByText('Test Timeline')).toBeInTheDocument();
    expect(screen.getAllByTestId('inject-item')).toHaveLength(5);
  });
  
  it('adds new inject when Add button clicked', async () => {
    const onAdd = jest.fn();
    render(<Timeline timeline={mockTimeline} onAddInject={onAdd} />);
    
    const addButton = screen.getByRole('button', { name: /add inject/i });
    await userEvent.click(addButton);
    
    expect(onAdd).toHaveBeenCalled();
  });
  
  it('deletes inject when delete button clicked', async () => {
    const onDelete = jest.fn();
    render(<Timeline timeline={mockTimeline} onDeleteInject={onDelete} />);
    
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await userEvent.click(deleteButtons[0]);
    
    expect(onDelete).toHaveBeenCalledWith('inject-001');
  });
});
```

### MQTT Hook Testing

```typescript
// team-dashboard/src/hooks/useMQTT.test.ts
import { renderHook, act } from '@testing-library/react';
import { useMQTT } from './useMQTT';
import mqtt from 'mqtt';

jest.mock('mqtt');

describe('useMQTT Hook', () => {
  let mockClient: any;
  
  beforeEach(() => {
    mockClient = {
      on: jest.fn(),
      subscribe: jest.fn(),
      publish: jest.fn(),
      end: jest.fn()
    };
    (mqtt.connect as jest.Mock).mockReturnValue(mockClient);
  });
  
  it('connects to MQTT broker', () => {
    const { result } = renderHook(() => 
      useMQTT('ex-001', 'blue')
    );
    
    expect(mqtt.connect).toHaveBeenCalledWith(
      expect.stringContaining('ws://'),
      expect.objectContaining({
        username: 'team_blue'
      })
    );
  });
  
  it('subscribes to team topics', () => {
    const { result } = renderHook(() => 
      useMQTT('ex-001', 'blue')
    );
    
    // Simulate connection
    const connectCallback = mockClient.on.mock.calls
      .find(call => call[0] === 'connect')[1];
    
    act(() => {
      connectCallback();
    });
    
    expect(mockClient.subscribe).toHaveBeenCalledWith(
      [
        '/exercise/ex-001/team/blue/feed',
        '/exercise/ex-001/timer',
        '/exercise/ex-001/status'
      ],
      expect.any(Object)
    );
  });
  
  it('handles incoming messages', () => {
    const onMessage = jest.fn();
    const { result } = renderHook(() => 
      useMQTT('ex-001', 'blue', { onMessage })
    );
    
    const messageCallback = mockClient.on.mock.calls
      .find(call => call[0] === 'message')[1];
    
    const testMessage = { type: 'news', content: 'test' };
    
    act(() => {
      messageCallback(
        '/exercise/ex-001/team/blue/feed',
        Buffer.from(JSON.stringify(testMessage))
      );
    });
    
    expect(onMessage).toHaveBeenCalledWith(testMessage);
  });
});
```

### Store Testing (Zustand)

```typescript
// team-dashboard/src/stores/feedStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useFeedStore } from './feedStore';

describe('Feed Store', () => {
  beforeEach(() => {
    useFeedStore.setState({
      socialFeed: [],
      newsFeed: [],
      smsFeed: [],
      emailFeed: [],
      unreadCounts: {
        social: 0,
        news: 0,
        sms: 0,
        email: 0
      }
    });
  });
  
  it('adds inject to correct feed', () => {
    const { result } = renderHook(() => useFeedStore());
    
    act(() => {
      result.current.addInject('news', {
        id: 'test-001',
        headline: 'Test News',
        body: 'Test content'
      });
    });
    
    expect(result.current.newsFeed).toHaveLength(1);
    expect(result.current.newsFeed[0].headline).toBe('Test News');
    expect(result.current.unreadCounts.news).toBe(1);
  });
  
  it('marks feed as read', () => {
    const { result } = renderHook(() => useFeedStore());
    
    act(() => {
      result.current.addInject('social', { id: '1', text: 'Post 1' });
      result.current.addInject('social', { id: '2', text: 'Post 2' });
    });
    
    expect(result.current.unreadCounts.social).toBe(2);
    
    act(() => {
      result.current.markAsRead('social');
    });
    
    expect(result.current.unreadCounts.social).toBe(0);
  });
});
```

## Backend Testing

### API Endpoint Testing (FastAPI)

```python
# api/tests/test_exercises.py
import pytest
from fastapi.testclient import TestClient
from datetime import datetime
from main import app

client = TestClient(app)

class TestExerciseAPI:
    
    @pytest.fixture
    def auth_headers(self):
        """Get authentication headers"""
        response = client.post("/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_create_exercise(self, auth_headers, db_session):
        """Test creating a new exercise"""
        exercise_data = {
            "name": "Test Exercise",
            "scenario_id": "test-scenario",
            "teams": [
                {
                    "id": "blue",
                    "name": "Blue Team",
                    "color": "#0066CC",
                    "timeline_id": "test-timeline"
                }
            ],
            "duration_minutes": 30
        }
        
        response = client.post(
            "/api/v1/exercises",
            json=exercise_data,
            headers=auth_headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["exercise"]["name"] == "Test Exercise"
        assert len(data["exercise"]["teams"]) == 1
        assert data["exercise"]["status"] == "initialized"
    
    def test_list_exercises(self, auth_headers, create_test_exercises):
        """Test listing exercises with filters"""
        response = client.get(
            "/api/v1/exercises?status=running",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(ex["status"] == "running" for ex in data["exercises"])
    
    def test_start_exercise(self, auth_headers, initialized_exercise):
        """Test starting an exercise"""
        exercise_id = initialized_exercise["id"]
        
        response = client.post(
            f"/api/v1/exercises/{exercise_id}/start",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.json()["status"] == "running"
    
    def test_unauthorized_access(self):
        """Test that unauthorized requests are rejected"""
        response = client.get("/api/v1/exercises")
        assert response.status_code == 401
```

### Orchestration Service Testing

```python
# orchestration/tests/test_timer.py
import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, AsyncMock, patch
from timer import ExerciseTimer

class TestExerciseTimer:
    
    @pytest.fixture
    def timer(self):
        return ExerciseTimer("ex-001", 10)  # 10 minute exercise
    
    @pytest.mark.asyncio
    async def test_timer_starts(self, timer):
        """Test timer starts correctly"""
        timer.check_inject_schedule = AsyncMock()
        timer.publish_timer_update = AsyncMock()
        
        # Start timer for 2 seconds
        task = asyncio.create_task(timer.start())
        await asyncio.sleep(2.1)
        timer.is_running = False
        await task
        
        assert timer.current_time == 2
        assert timer.publish_timer_update.call_count >= 2
    
    @pytest.mark.asyncio
    async def test_timer_pause_resume(self, timer):
        """Test pause and resume functionality"""
        timer.publish_status_update = AsyncMock()
        
        task = asyncio.create_task(timer.start())
        await asyncio.sleep(1)
        
        # Pause
        await timer.pause()
        paused_time = timer.current_time
        await asyncio.sleep(1)
        
        # Time shouldn't advance while paused
        assert timer.current_time == paused_time
        
        # Resume
        await timer.resume()
        await asyncio.sleep(1)
        
        # Time should advance after resume
        assert timer.current_time > paused_time
        
        timer.is_running = False
        await task
```

### MQTT Publisher Testing

```python
# orchestration/tests/test_mqtt.py
import pytest
import json
from unittest.mock import Mock, patch
from mqtt_publisher import OrchestrationMQTTPublisher

class TestMQTTPublisher:
    
    @pytest.fixture
    def publisher(self):
        with patch('paho.mqtt.client.Client'):
            return OrchestrationMQTTPublisher(
                host="localhost",
                port=1883,
                username="test",
                password="test"
            )
    
    def test_publish_inject(self, publisher):
        """Test publishing inject to team"""
        publisher.client.publish = Mock(return_value=Mock(rc=0))
        publisher.connected = True
        
        inject = {
            "id": "inject-001",
            "time": 60,
            "type": "news",
            "content": {
                "headline": "Test News",
                "body": "Test body"
            }
        }
        
        result = publisher.publish_inject("ex-001", "blue", inject)
        
        assert result is True
        publisher.client.publish.assert_called_once()
        
        call_args = publisher.client.publish.call_args
        assert call_args[0][0] == "/exercise/ex-001/team/blue/feed"
        
        message = json.loads(call_args[0][1])
        assert message["type"] == "news"
        assert message["content"]["headline"] == "Test News"
    
    def test_publish_timer(self, publisher):
        """Test publishing timer update"""
        publisher.client.publish = Mock(return_value=Mock(rc=0))
        publisher.connected = True
        
        result = publisher.publish_timer("ex-001", 300, 1800)
        
        assert result is True
        
        call_args = publisher.client.publish.call_args
        assert call_args[0][0] == "/exercise/ex-001/timer"
        
        message = json.loads(call_args[0][1])
        assert message["current"] == 300
        assert message["formatted"] == "T+05:00"
        assert message["percentage"] == pytest.approx(16.67, 0.01)
```

## Integration Testing

### End-to-End Exercise Test

```python
# tests/integration/test_exercise_flow.py
import pytest
import asyncio
import json
from datetime import datetime

class TestExerciseFlow:
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_complete_exercise_flow(
        self, 
        api_client, 
        mqtt_client, 
        docker_client
    ):
        """Test complete exercise from creation to completion"""
        
        # 1. Create exercise
        exercise_data = {
            "name": "Integration Test Exercise",
            "scenario_id": "test-scenario",
            "teams": [
                {
                    "id": "blue",
                    "name": "Blue Team",
                    "color": "#0066CC",
                    "timeline_id": "test-timeline"
                },
                {
                    "id": "red",
                    "name": "Red Team",
                    "color": "#CC0000",
                    "timeline_id": "test-timeline"
                }
            ],
            "duration_minutes": 5
        }
        
        response = await api_client.post("/api/v1/exercises", json=exercise_data)
        assert response.status_code == 201
        exercise = response.json()["exercise"]
        exercise_id = exercise["id"]
        
        # 2. Verify team dashboards deployed
        containers = docker_client.containers.list(
            filters={"label": f"scip.exercise={exercise_id}"}
        )
        assert len(containers) == 2
        
        # 3. Subscribe to MQTT topics
        received_messages = []
        
        def on_message(client, userdata, msg):
            received_messages.append({
                "topic": msg.topic,
                "payload": json.loads(msg.payload)
            })
        
        mqtt_client.on_message = on_message
        mqtt_client.subscribe(f"/exercise/{exercise_id}/#")
        
        # 4. Start exercise
        response = await api_client.post(f"/api/v1/exercises/{exercise_id}/start")
        assert response.status_code == 200
        
        # 5. Wait for timer updates and injects
        await asyncio.sleep(10)
        
        # 6. Verify messages received
        timer_messages = [
            m for m in received_messages 
            if m["topic"].endswith("/timer")
        ]
        assert len(timer_messages) >= 8  # Should get timer updates
        
        inject_messages = [
            m for m in received_messages
            if "/team/" in m["topic"] and m["topic"].endswith("/feed")
        ]
        assert len(inject_messages) > 0  # Should get injects
        
        # 7. Stop exercise
        response = await api_client.post(f"/api/v1/exercises/{exercise_id}/stop")
        assert response.status_code == 200
        
        # 8. Verify cleanup
        containers = docker_client.containers.list(
            filters={"label": f"scip.exercise={exercise_id}"}
        )
        assert len(containers) == 0
```

### MQTT Flow Test

```python
# tests/integration/test_mqtt_flow.py
import pytest
import paho.mqtt.client as mqtt
import json
import time

class TestMQTTFlow:
    
    @pytest.mark.integration
    def test_inject_delivery(self, mqtt_broker):
        """Test inject delivery through MQTT"""
        received = []
        
        # Create subscriber (team dashboard)
        subscriber = mqtt.Client()
        subscriber.username_pw_set("team_blue", "password")
        subscriber.connect("localhost", 1883)
        
        def on_message(client, userdata, msg):
            received.append(json.loads(msg.payload))
        
        subscriber.on_message = on_message
        subscriber.subscribe("/exercise/test/team/blue/feed")
        subscriber.loop_start()
        
        # Create publisher (orchestration)
        publisher = mqtt.Client()
        publisher.username_pw_set("orchestration", "password")
        publisher.connect("localhost", 1883)
        
        # Publish inject
        inject = {
            "id": "test-001",
            "type": "news",
            "content": {
                "headline": "Test News",
                "body": "Test content"
            }
        }
        
        publisher.publish(
            "/exercise/test/team/blue/feed",
            json.dumps(inject),
            qos=1
        )
        
        # Wait for delivery
        time.sleep(1)
        
        # Verify received
        assert len(received) == 1
        assert received[0]["id"] == "test-001"
        assert received[0]["type"] == "news"
        
        # Cleanup
        subscriber.loop_stop()
        subscriber.disconnect()
        publisher.disconnect()
```

## Load Testing

### Locust Load Test

```python
# tests/load/locustfile.py
from locust import HttpUser, task, between
import json
import random

class SCIPUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        """Login and get token"""
        response = self.client.post("/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        self.token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)
    def list_exercises(self):
        """List exercises"""
        self.client.get("/api/v1/exercises", headers=self.headers)
    
    @task(2)
    def get_exercise_details(self):
        """Get exercise details"""
        # Assume we have some exercise IDs
        exercise_id = random.choice(["ex-001", "ex-002", "ex-003"])
        self.client.get(
            f"/api/v1/exercises/{exercise_id}",
            headers=self.headers
        )
    
    @task(1)
    def create_exercise(self):
        """Create new exercise"""
        exercise_data = {
            "name": f"Load Test Exercise {random.randint(1000, 9999)}",
            "scenario_id": "test-scenario",
            "teams": [
                {
                    "id": f"team-{i}",
                    "name": f"Team {i}",
                    "color": "#0066CC",
                    "timeline_id": "test-timeline"
                }
                for i in range(random.randint(2, 5))
            ],
            "duration_minutes": 30
        }
        
        self.client.post(
            "/api/v1/exercises",
            json=exercise_data,
            headers=self.headers
        )
```

Run load test:
```bash
# Install locust
pip install locust

# Run with 100 users, spawn rate 10/sec
locust -f tests/load/locustfile.py \
  --host=http://localhost:8000 \
  --users=100 \
  --spawn-rate=10 \
  --time=60s
```

### MQTT Load Test

```python
# tests/load/mqtt_load_test.py
import asyncio
import time
import json
from datetime import datetime
import paho.mqtt.client as mqtt
from concurrent.futures import ThreadPoolExecutor

class MQTTLoadTest:
    def __init__(self, num_teams=50, messages_per_second=100):
        self.num_teams = num_teams
        self.messages_per_second = messages_per_second
        self.stats = {
            "sent": 0,
            "received": 0,
            "errors": 0,
            "latencies": []
        }
    
    def create_team_client(self, team_id):
        """Create MQTT client for team"""
        client = mqtt.Client(client_id=f"team_{team_id}")
        client.username_pw_set(f"team_{team_id}", "password")
        
        received_count = [0]
        
        def on_message(client, userdata, msg):
            received_count[0] += 1
            # Calculate latency if timestamp in message
            try:
                message = json.loads(msg.payload)
                if "timestamp" in message:
                    sent_time = datetime.fromisoformat(message["timestamp"])
                    latency = (datetime.utcnow() - sent_time).total_seconds() * 1000
                    self.stats["latencies"].append(latency)
            except:
                pass
        
        client.on_message = on_message
        client.connect("localhost", 1883)
        client.subscribe(f"/exercise/load-test/team/{team_id}/feed")
        client.loop_start()
        
        return client, received_count
    
    def run_publisher(self, duration=60):
        """Run publisher sending messages"""
        publisher = mqtt.Client()
        publisher.username_pw_set("orchestration", "password")
        publisher.connect("localhost", 1883)
        
        start_time = time.time()
        message_count = 0
        
        while time.time() - start_time < duration:
            for team_id in range(self.num_teams):
                inject = {
                    "id": f"inject-{message_count}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "type": "test",
                    "content": {"test": "data"}
                }
                
                publisher.publish(
                    f"/exercise/load-test/team/{team_id}/feed",
                    json.dumps(inject),
                    qos=1
                )
                
                message_count += 1
                self.stats["sent"] += 1
                
                # Rate limiting
                if message_count % self.messages_per_second == 0:
                    elapsed = time.time() - start_time
                    sleep_time = (message_count / self.messages_per_second) - elapsed
                    if sleep_time > 0:
                        time.sleep(sleep_time)
        
        publisher.disconnect()
    
    def run_test(self, duration=60):
        """Run complete load test"""
        print(f"Starting MQTT load test: {self.num_teams} teams, {self.messages_per_second} msg/sec")
        
        # Create team clients
        clients = []
        for i in range(self.num_teams):
            client, counter = self.create_team_client(i)
            clients.append((client, counter))
        
        # Run publisher
        self.run_publisher(duration)
        
        # Wait for messages to be delivered
        time.sleep(2)
        
        # Collect stats
        for client, counter in clients:
            self.stats["received"] += counter[0]
            client.loop_stop()
            client.disconnect()
        
        # Calculate statistics
        delivery_rate = (self.stats["received"] / self.stats["sent"]) * 100
        avg_latency = sum(self.stats["latencies"]) / len(self.stats["latencies"]) if self.stats["latencies"] else 0
        
        print(f"\nResults:")
        print(f"Messages sent: {self.stats['sent']}")
        print(f"Messages received: {self.stats['received']}")
        print(f"Delivery rate: {delivery_rate:.2f}%")
        print(f"Average latency: {avg_latency:.2f}ms")
        print(f"Errors: {self.stats['errors']}")

# Run test
if __name__ == "__main__":
    test = MQTTLoadTest(num_teams=50, messages_per_second=100)
    test.run_test(duration=60)
```

## Test Scripts

### Run All Tests

```bash
#!/bin/bash
# scripts/run-tests.sh

echo "Running SCIP v3 Test Suite"

# Start test environment
echo "Starting test environment..."
docker-compose -f docker-compose.test.yml up -d
sleep 10

# Run frontend tests
echo "Running frontend tests..."
cd client-dashboard && npm test -- --coverage
cd ../team-dashboard && npm test -- --coverage

# Run backend tests
echo "Running backend tests..."
cd ../api && pytest tests/ --cov=app --cov-report=html
cd ../orchestration && pytest tests/ --cov=. --cov-report=html

# Run integration tests
echo "Running integration tests..."
cd ../tests/integration
pytest -m integration

# Run load tests (optional)
if [ "$1" == "--load" ]; then
    echo "Running load tests..."
    locust -f tests/load/locustfile.py \
        --host=http://localhost:8000 \
        --users=50 \
        --spawn-rate=5 \
        --time=60s \
        --headless
fi

# Cleanup
echo "Cleaning up..."
docker-compose -f docker-compose.test.yml down

echo "Test suite complete!"
```

### Test Coverage Report

```bash
#!/bin/bash
# scripts/coverage-report.sh

# Generate coverage reports
echo "Generating coverage reports..."

# Frontend coverage
cd client-dashboard
npm test -- --coverage --coverageReporters=json
cd ../team-dashboard
npm test -- --coverage --coverageReporters=json

# Backend coverage
cd ../api
pytest tests/ --cov=app --cov-report=json
cd ../orchestration
pytest tests/ --cov=. --cov-report=json

# Combine coverage reports
cd ..
npx nyc merge coverage coverage/combined.json
npx nyc report -t coverage --report-dir coverage/html

echo "Coverage report available at coverage/html/index.html"
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, development ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: test_pass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      mqtt:
        image: eclipse-mosquitto:2.0
        ports:
          - 1883:1883
          - 9001:9001
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.10'
        cache: 'pip'
    
    - name: Install frontend dependencies
      run: |
        cd client-dashboard && npm ci
        cd ../team-dashboard && npm ci
    
    - name: Install backend dependencies
      run: |
        cd api && pip install -r requirements.txt -r requirements-dev.txt
        cd ../orchestration && pip install -r requirements.txt -r requirements-dev.txt
    
    - name: Run linters
      run: |
        cd client-dashboard && npm run lint
        cd ../api && flake8 .
    
    - name: Run frontend tests
      run: |
        cd client-dashboard && npm test -- --coverage
        cd ../team-dashboard && npm test -- --coverage
    
    - name: Run backend tests
      run: |
        cd api && pytest tests/ --cov=app
        cd ../orchestration && pytest tests/ --cov=.
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
```

## Test Data Fixtures

### Create Test Data

```python
# tests/fixtures/test_data.py
import json
from datetime import datetime, timedelta

def create_test_timeline(timeline_id="test-timeline"):
    """Create test timeline"""
    return {
        "id": timeline_id,
        "name": "Test Timeline",
        "duration_minutes": 10,
        "injects": [
            {
                "id": f"{timeline_id}-001",
                "time": 0,
                "type": "news",
                "content": {
                    "headline": "Test Exercise Begins",
                    "body": "This is a test exercise",
                    "source": "Test System"
                }
            },
            {
                "id": f"{timeline_id}-002",
                "time": 60,
                "type": "social",
                "content": {
                    "platform": "twitter",
                    "username": "@TestUser",
                    "text": "Test tweet at T+1",
                    "likes": 100
                }
            },
            {
                "id": f"{timeline_id}-003",
                "time": 120,
                "type": "sms",
                "content": {
                    "from": "+1234567890",
                    "text": "Test SMS at T+2"
                }
            }
        ]
    }

def create_test_exercise(exercise_id="test-ex-001"):
    """Create test exercise"""
    return {
        "id": exercise_id,
        "name": "Test Exercise",
        "scenario_id": "test-scenario",
        "status": "initialized",
        "teams": [
            {
                "id": "blue",
                "name": "Blue Team",
                "color": "#0066CC",
                "timeline_id": "test-timeline"
            },
            {
                "id": "red",
                "name": "Red Team",
                "color": "#CC0000",
                "timeline_id": "test-timeline"
            }
        ],
        "duration_minutes": 10,
        "created_at": datetime.utcnow().isoformat()
    }

# Save test fixtures
with open('tests/fixtures/timeline.json', 'w') as f:
    json.dump(create_test_timeline(), f, indent=2)

with open('tests/fixtures/exercise.json', 'w') as f:
    json.dump(create_test_exercise(), f, indent=2)
```

## Test Best Practices

1. **Test Isolation**: Each test should be independent
2. **Use Fixtures**: Create reusable test data
3. **Mock External Services**: Don't rely on external APIs
4. **Test Edge Cases**: Empty data, nulls, invalid inputs
5. **Performance Benchmarks**: Set acceptable response times
6. **Security Testing**: Include authentication/authorization tests
7. **Documentation**: Document what each test verifies
8. **Continuous Testing**: Run tests on every commit
9. **Coverage Goals**: Aim for >80% code coverage
10. **Clean Up**: Always clean up test data after tests

## Debugging Tests

### Debug Frontend Tests
```bash
# Run tests in watch mode
npm test -- --watch

# Debug specific test
npm test -- Timeline.test.tsx --watch

# Run with debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debug Backend Tests
```python
# Add breakpoint in test
import pdb; pdb.set_trace()

# Run specific test with output
pytest tests/test_exercises.py::TestExerciseAPI::test_create_exercise -vvs

# Run with debugger
python -m pdb -m pytest tests/test_exercises.py
```

## References

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Pytest Documentation](https://docs.pytest.org/)
- [Locust Load Testing](https://locust.io/)
- [MQTT Testing](https://www.hivemq.com/blog/mqtt-testing/)
