# SCIP v2 - Detailed Implementation Plan v1.0
**Date:** September 17, 2025
**Version:** 1.0
**Status:** Ready for Implementation

---

## 1. SYSTEM OVERVIEW

### 1.1 Architecture Summary
A simplified, scenario-driven exercise platform with visual media injection capabilities for cybersecurity training exercises.

### 1.2 Core Components
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  SCIP Client    │    │  Orchestration   │    │  Team Dashboard │
│  (React App)    │◄──►│  Service         │◄──►│  Containers     │
│  Port: 3001     │    │  (FastAPI)       │    │  Ports: 3201-   │
│                 │    │  Port: 8001      │    │  3299           │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         └──────────────┬─────────────────┬─────────────────┘
                        │                 │
                ┌───────▼─────────┐      ┌▼────────────────┐
                │  MQTT Broker    │      │  JSON Storage   │
                │  (Mosquitto)    │      │  (File System)  │
                │  Ports: 1883,   │      │  scenarios/     │
                │  9001           │      │                 │
                └─────────────────┘      └─────────────────┘
```

---

## 2. DETAILED COMPONENT SPECIFICATIONS

### 2.1 SCIP Client Container (`scip-client`)

#### 2.1.1 Container Configuration
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 3001
```

#### 2.1.2 Volume Mounts
```yaml
volumes:
  - ./scenarios:/app/scenarios:rw
  - ./uploads:/app/uploads:rw
  - ./thumbnails:/app/thumbnails:rw
```

#### 2.1.3 Application Structure
```
src/
├── components/
│   ├── scenarios/
│   │   ├── ScenarioCreator.tsx
│   │   ├── ScenarioSelector.tsx
│   │   ├── ScenarioConfig.tsx
│   │   └── ScenarioList.tsx
│   ├── teams/
│   │   ├── TeamCreator.tsx
│   │   ├── TeamList.tsx
│   │   └── TeamConfig.tsx
│   ├── media/
│   │   ├── MediaUploader.tsx
│   │   ├── MediaLibrary.tsx
│   │   ├── ThumbnailGrid.tsx
│   │   └── MediaPreview.tsx
│   ├── exercise/
│   │   ├── ExerciseControl.tsx
│   │   ├── ExerciseStatus.tsx
│   │   ├── TimelineViewer.tsx
│   │   └── InjectionScheduler.tsx
│   ├── analytics/
│   │   ├── TeamMonitor.tsx
│   │   ├── InjectionTracker.tsx
│   │   └── ExerciseMetrics.tsx
│   └── common/
│       ├── Navigation.tsx
│       ├── StatusIndicator.tsx
│       └── ConfirmDialog.tsx
├── pages/
│   ├── ScenariosPage.tsx
│   ├── TeamsPage.tsx
│   ├── ExercisePage.tsx
│   └── AnalyticsPage.tsx
├── services/
│   ├── scenarioService.ts
│   ├── teamService.ts
│   ├── mediaService.ts
│   ├── exerciseService.ts
│   └── mqttService.ts
├── hooks/
│   ├── useScenario.ts
│   ├── useTeams.ts
│   ├── useExercise.ts
│   └── useRealTime.ts
└── types/
    ├── scenario.ts
    ├── team.ts
    ├── injection.ts
    └── exercise.ts
```

### 2.2 Orchestration Service (Enhanced)

#### 2.2.1 Service Structure
```
app/
├── main.py                 # FastAPI app entry
├── models/
│   ├── scenario.py         # Scenario data models
│   ├── team.py            # Team data models
│   ├── injection.py       # Injection data models
│   └── exercise.py        # Exercise state models
├── services/
│   ├── scenario_service.py # Scenario CRUD operations
│   ├── team_service.py    # Team deployment management
│   ├── injection_service.py # Timeline execution engine
│   ├── mqtt_service.py    # MQTT publishing
│   └── docker_service.py  # Container management
├── api/
│   ├── scenarios.py       # Scenario endpoints
│   ├── teams.py          # Team endpoints
│   ├── exercise.py       # Exercise control endpoints
│   └── media.py          # Media upload endpoints
└── storage/
    ├── json_storage.py    # JSON file operations
    └── media_storage.py   # Media file handling
```

#### 2.2.2 Key Endpoints
```python
# Scenario Management
POST   /api/v1/scenarios                    # Create scenario
GET    /api/v1/scenarios                    # List scenarios
GET    /api/v1/scenarios/{id}               # Get scenario details
PUT    /api/v1/scenarios/{id}               # Update scenario
DELETE /api/v1/scenarios/{id}               # Delete scenario

# Team Management
POST   /api/v1/scenarios/{id}/teams         # Add team to scenario
GET    /api/v1/scenarios/{id}/teams         # List scenario teams
PUT    /api/v1/scenarios/{id}/teams/{team_id}  # Update team config
DELETE /api/v1/scenarios/{id}/teams/{team_id}  # Remove team

# Media Management
POST   /api/v1/scenarios/{id}/media         # Upload media
GET    /api/v1/scenarios/{id}/media         # List media files
DELETE /api/v1/scenarios/{id}/media/{file_id}  # Delete media

# Exercise Control
POST   /api/v1/scenarios/{id}/deploy        # Deploy team containers
POST   /api/v1/scenarios/{id}/start         # Start exercise
POST   /api/v1/scenarios/{id}/pause         # Pause exercise
POST   /api/v1/scenarios/{id}/resume        # Resume exercise
POST   /api/v1/scenarios/{id}/stop          # Stop exercise
POST   /api/v1/scenarios/{id}/reset         # Reset exercise
GET    /api/v1/scenarios/{id}/status        # Get exercise status

# Analytics
GET    /api/v1/scenarios/{id}/analytics     # Get exercise metrics
GET    /api/v1/scenarios/{id}/injections    # Get injection history
```

### 2.3 Team Dashboard Integration

#### 2.3.1 Required Enhancements
```typescript
// Enhanced MQTT message handling
interface InjectionMessage {
  id: string;
  scenario_id: string;
  team_id: string;
  type: 'media' | 'alert' | 'news' | 'decision';
  target: 'twitter' | 'news' | 'alerts' | 'email';
  content: {
    title: string;
    description?: string;
    media_url?: string;
    media_type?: 'image' | 'video' | 'document';
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    duration?: number; // Display duration in seconds
  };
  timestamp: string;
  display_until?: string; // Auto-remove after this time
}
```

#### 2.3.2 Media Display Components
```typescript
// Twitter feed component enhancement
const TwitterFeed = () => {
  const [tweets, setTweets] = useState<TweetMessage[]>([]);
  const [injectedMedia, setInjectedMedia] = useState<InjectionMessage[]>([]);

  // Handle injected media
  useEffect(() => {
    const handleInjection = (injection: InjectionMessage) => {
      if (injection.target === 'twitter') {
        setInjectedMedia(prev => [...prev, injection]);

        // Auto-remove after duration
        if (injection.content.duration) {
          setTimeout(() => {
            setInjectedMedia(prev =>
              prev.filter(item => item.id !== injection.id)
            );
          }, injection.content.duration * 1000);
        }
      }
    };

    mqttClient.subscribe('injections', handleInjection);
    return () => mqttClient.unsubscribe('injections', handleInjection);
  }, []);

  return (
    <div className="twitter-feed">
      {injectedMedia.map(injection => (
        <InjectedMediaCard key={injection.id} injection={injection} />
      ))}
      {tweets.map(tweet => (
        <TweetCard key={tweet.id} tweet={tweet} />
      ))}
    </div>
  );
};
```

---

## 3. DATA MODELS & STORAGE

### 3.1 File System Structure
```
scenarios/
├── scenario-{uuid}/
│   ├── config.json                 # Scenario configuration
│   ├── state.json                 # Current exercise state
│   ├── teams/
│   │   ├── {team-id}.json         # Team injection timeline
│   │   └── {team-id}.json
│   ├── media/
│   │   ├── originals/
│   │   │   ├── {media-id}.jpg
│   │   │   └── {media-id}.png
│   │   └── thumbnails/
│   │       ├── {media-id}_thumb.jpg
│   │       └── {media-id}_thumb.png
│   └── logs/
│       ├── injections.json        # Injection execution log
│       └── analytics.json         # Exercise analytics
```

### 3.2 Data Schemas

#### 3.2.1 Scenario Configuration
```json
{
  "id": "scenario-{uuid}",
  "name": "Maritime Crisis Response",
  "description": "Multi-team coordination exercise simulating port security incident",
  "version": "1.0",
  "created_at": "2025-09-17T12:00:00Z",
  "updated_at": "2025-09-17T12:30:00Z",
  "created_by": "admin",
  "settings": {
    "duration_minutes": 60,
    "max_teams": 6,
    "auto_pause_on_error": true,
    "allow_team_communication": false,
    "record_analytics": true
  },
  "status": "draft|configured|deployed|running|paused|completed|archived",
  "teams": [
    {
      "id": "blue-team",
      "name": "Blue Team - Maritime Security",
      "color": "#0066cc",
      "container_port": 3201,
      "container_id": null,
      "status": "created|deployed|running|stopped"
    }
  ],
  "media_library": [
    {
      "id": "media-{uuid}",
      "filename": "suspicious-vessel.jpg",
      "original_name": "vessel-alert.jpg",
      "mime_type": "image/jpeg",
      "size_bytes": 245760,
      "uploaded_at": "2025-09-17T12:15:00Z",
      "thumbnail_path": "thumbnails/media-{uuid}_thumb.jpg",
      "description": "Suspicious vessel approaching port"
    }
  ]
}
```

#### 3.2.2 Team Injection Timeline
```json
{
  "team_id": "blue-team",
  "team_name": "Blue Team - Maritime Security",
  "scenario_id": "scenario-{uuid}",
  "timeline": [
    {
      "id": "injection-{uuid}",
      "time_offset_seconds": 300,
      "type": "media",
      "target": "twitter",
      "priority": "medium",
      "content": {
        "title": "🚨 BREAKING: Unusual vessel activity reported near Port Authority",
        "description": "Local marine patrol investigating suspicious movements in restricted waters",
        "media_id": "media-{uuid}",
        "hashtags": ["#PortSecurity", "#MarineAlert"],
        "display_duration": 180
      },
      "execution_status": "pending|executing|completed|failed",
      "executed_at": null,
      "error_message": null
    },
    {
      "id": "injection-{uuid}",
      "time_offset_seconds": 900,
      "type": "alert",
      "target": "alerts",
      "priority": "urgent",
      "content": {
        "title": "SECURITY ALERT: Unauthorized Access Detected",
        "description": "Motion sensors triggered in restricted area. Immediate response required.",
        "media_id": "media-{uuid}",
        "alert_level": "red",
        "requires_acknowledgment": true,
        "escalation_time": 300
      }
    },
    {
      "id": "injection-{uuid}",
      "time_offset_seconds": 1800,
      "type": "email",
      "target": "email",
      "priority": "high",
      "content": {
        "from": "security@portauthority.gov",
        "subject": "URGENT: Coordinate with Maritime Patrol Unit",
        "body": "Intelligence reports suggest coordinated threat. Attach surveillance footage for analysis.",
        "media_id": "media-{uuid}",
        "attachments": ["surveillance-log.pdf"]
      }
    }
  ],
  "injection_count": 3,
  "estimated_duration": 3600,
  "last_updated": "2025-09-17T12:30:00Z"
}
```

#### 3.2.3 Exercise State
```json
{
  "scenario_id": "scenario-{uuid}",
  "exercise_id": "exercise-{uuid}",
  "status": "deployed|running|paused|stopped|completed",
  "start_time": "2025-09-17T13:00:00Z",
  "pause_time": null,
  "end_time": null,
  "elapsed_seconds": 1247,
  "current_phase": "active_operations",
  "teams": {
    "blue-team": {
      "container_id": "team-dashboard-blue-{hash}",
      "status": "running",
      "port": 3201,
      "last_injection": "injection-{uuid}",
      "injections_completed": 2,
      "injections_pending": 1,
      "injections_failed": 0
    },
    "red-team": {
      "container_id": "team-dashboard-red-{hash}",
      "status": "running",
      "port": 3202,
      "last_injection": "injection-{uuid}",
      "injections_completed": 1,
      "injections_pending": 2,
      "injections_failed": 0
    }
  },
  "next_injection": {
    "team_id": "blue-team",
    "injection_id": "injection-{uuid}",
    "scheduled_time": "2025-09-17T13:15:00Z",
    "time_remaining_seconds": 127
  },
  "analytics": {
    "total_injections": 6,
    "completed_injections": 3,
    "failed_injections": 0,
    "average_response_time": 2.3,
    "team_performance": {
      "blue-team": {"score": 85, "response_time": 2.1},
      "red-team": {"score": 92, "response_time": 1.8}
    }
  }
}
```

---

## 4. MQTT TOPIC ARCHITECTURE

### 4.1 Topic Hierarchy
```
scip/
├── exercise/{scenario-id}/
│   ├── control/
│   │   ├── start              # Exercise start command
│   │   ├── pause              # Exercise pause command
│   │   ├── resume             # Exercise resume command
│   │   ├── stop               # Exercise stop command
│   │   └── reset              # Exercise reset command
│   ├── status/
│   │   ├── global             # Overall exercise status
│   │   └── teams/{team-id}    # Individual team status
│   └── teams/{team-id}/
│       ├── injections/
│       │   ├── media          # Media injections
│       │   ├── alerts         # Security alerts
│       │   ├── email          # Email messages
│       │   └── news           # News updates
│       ├── responses/         # Team responses/acknowledgments
│       └── analytics/         # Team performance data
```

### 4.2 Message Payloads

#### 4.2.1 Exercise Control Messages
```json
// Start Exercise
{
  "command": "start",
  "scenario_id": "scenario-{uuid}",
  "exercise_id": "exercise-{uuid}",
  "timestamp": "2025-09-17T13:00:00Z",
  "teams": ["blue-team", "red-team", "green-team"]
}

// Pause Exercise
{
  "command": "pause",
  "scenario_id": "scenario-{uuid}",
  "exercise_id": "exercise-{uuid}",
  "timestamp": "2025-09-17T13:15:00Z",
  "reason": "technical_issue|instructor_pause|scheduled_break"
}
```

#### 4.2.2 Injection Messages
```json
// Media Injection
{
  "injection_id": "injection-{uuid}",
  "scenario_id": "scenario-{uuid}",
  "team_id": "blue-team",
  "type": "media",
  "target": "twitter",
  "timestamp": "2025-09-17T13:05:00Z",
  "content": {
    "title": "🚨 BREAKING: Unusual vessel activity reported",
    "description": "Local marine patrol investigating suspicious movements",
    "media_url": "/api/media/media-{uuid}",
    "media_type": "image/jpeg",
    "thumbnail_url": "/api/media/media-{uuid}/thumbnail",
    "hashtags": ["#PortSecurity", "#MarineAlert"],
    "display_duration": 180,
    "priority": "medium"
  },
  "metadata": {
    "source": "scip-orchestration",
    "correlation_id": "corr-{uuid}",
    "retry_count": 0
  }
}

// Alert Injection
{
  "injection_id": "injection-{uuid}",
  "scenario_id": "scenario-{uuid}",
  "team_id": "blue-team",
  "type": "alert",
  "target": "alerts",
  "timestamp": "2025-09-17T13:10:00Z",
  "content": {
    "title": "SECURITY ALERT: Unauthorized Access Detected",
    "description": "Motion sensors triggered in restricted area",
    "alert_level": "red",
    "media_url": "/api/media/media-{uuid}",
    "requires_acknowledgment": true,
    "escalation_time": 300,
    "actions": ["Investigate", "Escalate", "Dismiss"]
  }
}
```

---

## 5. USER INTERFACE SPECIFICATIONS

### 5.1 Navigation Structure
```
SCIP Client Dashboard
├── 🎯 Scenarios
│   ├── Create New Scenario
│   ├── Scenario Library
│   └── Import/Export
├── 👥 Teams & Configuration
│   ├── Team Management
│   ├── Injection Timeline
│   └── Media Library
├── 🎮 Exercise Control
│   ├── Exercise Dashboard
│   ├── Real-time Monitor
│   └── Team Status
└── 📊 Analytics & Reports
    ├── Performance Metrics
    ├── Injection History
    └── Export Reports
```

### 5.2 Key UI Components

#### 5.2.1 Scenario Creator Interface
```typescript
const ScenarioCreator = () => {
  return (
    <div className="scenario-creator">
      <h2>Create New Scenario</h2>

      {/* Basic Information */}
      <section className="basic-info">
        <Input label="Scenario Name" required />
        <TextArea label="Description" />
        <NumberInput label="Duration (minutes)" min={15} max={480} />
        <NumberInput label="Max Teams" min={1} max={6} />
      </section>

      {/* Advanced Settings */}
      <section className="advanced-settings">
        <Checkbox label="Auto-pause on errors" />
        <Checkbox label="Allow team communication" />
        <Checkbox label="Record detailed analytics" />
        <Select label="Difficulty Level" options={['Beginner', 'Intermediate', 'Advanced']} />
      </section>

      {/* Action Buttons */}
      <div className="actions">
        <Button variant="primary">Create Scenario</Button>
        <Button variant="secondary">Save as Template</Button>
      </div>
    </div>
  );
};
```

#### 5.2.2 Media Library Interface
```typescript
const MediaLibrary = ({ scenarioId }: { scenarioId: string }) => {
  return (
    <div className="media-library">
      <div className="upload-area">
        <FileDropzone
          accept="image/*,video/*,application/pdf"
          onUpload={handleMediaUpload}
          maxSize={10 * 1024 * 1024} // 10MB
        />
      </div>

      <div className="media-grid">
        {mediaFiles.map(media => (
          <MediaCard
            key={media.id}
            media={media}
            onEdit={handleEditMedia}
            onDelete={handleDeleteMedia}
            onPreview={handlePreviewMedia}
          />
        ))}
      </div>

      <div className="media-filters">
        <Select label="Type" options={['All', 'Images', 'Videos', 'Documents']} />
        <Select label="Team" options={['All Teams', ...teams]} />
        <Input label="Search" placeholder="Search media..." />
      </div>
    </div>
  );
};
```

#### 5.2.3 Exercise Control Dashboard
```typescript
const ExerciseControlDashboard = ({ scenarioId }: { scenarioId: string }) => {
  return (
    <div className="exercise-control">
      {/* Status Overview */}
      <section className="status-overview">
        <StatusCard
          title="Exercise Status"
          value={exerciseState.status}
          color={getStatusColor(exerciseState.status)}
        />
        <StatusCard
          title="Elapsed Time"
          value={formatDuration(exerciseState.elapsed_seconds)}
        />
        <StatusCard
          title="Active Teams"
          value={`${activeTeams}/${totalTeams}`}
        />
        <StatusCard
          title="Injections"
          value={`${completedInjections}/${totalInjections}`}
        />
      </section>

      {/* Control Buttons */}
      <section className="control-buttons">
        <Button
          variant="success"
          onClick={handleStart}
          disabled={exerciseState.status === 'running'}
        >
          ▶️ Start Exercise
        </Button>
        <Button
          variant="warning"
          onClick={handlePause}
          disabled={exerciseState.status !== 'running'}
        >
          ⏸️ Pause
        </Button>
        <Button
          variant="danger"
          onClick={handleStop}
          disabled={exerciseState.status === 'stopped'}
        >
          ⏹️ Stop
        </Button>
        <Button
          variant="secondary"
          onClick={handleReset}
        >
          🔄 Reset
        </Button>
      </section>

      {/* Team Monitor */}
      <section className="team-monitor">
        <h3>Team Status</h3>
        <div className="team-grid">
          {teams.map(team => (
            <TeamStatusCard
              key={team.id}
              team={team}
              exerciseState={exerciseState}
            />
          ))}
        </div>
      </section>

      {/* Injection Timeline */}
      <section className="injection-timeline">
        <h3>Upcoming Injections</h3>
        <TimelineView
          injections={upcomingInjections}
          currentTime={exerciseState.elapsed_seconds}
        />
      </section>
    </div>
  );
};
```

---

## 6. IMPLEMENTATION ROADMAP

### 6.1 Phase 1: Foundation Setup (Days 1-2)
**Objective:** Clean infrastructure and basic container setup

#### Tasks:
1. **Environment Cleanup**
   - Stop all current containers
   - Clean Docker volumes and networks
   - Remove temporary files

2. **Create SCIP Client Container**
   ```bash
   mkdir scip-client
   cd scip-client
   npm create react-app . --template typescript
   # Configure Dockerfile, nginx.conf
   # Set up volume mounts
   ```

3. **Simplified Docker Compose**
   ```yaml
   version: '3.8'
   services:
     scip-client:
       build: ./scip-client
       ports:
         - "3001:80"
       volumes:
         - ./scenarios:/app/scenarios
         - ./uploads:/app/uploads

     orchestration:
       build: ./orchestration
       ports:
         - "8001:8001"
       volumes:
         - ./scenarios:/app/scenarios
         - /var/run/docker.sock:/var/run/docker.sock

     mqtt:
       image: eclipse-mosquitto:2
       ports:
         - "1883:1883"
         - "9001:9001"
       volumes:
         - ./mosquitto.conf:/mosquitto/config/mosquitto.conf
   ```

4. **Test Basic Setup**
   - Verify all containers start
   - Test MQTT connectivity
   - Confirm volume mounts work

**Deliverables:**
- [ ] Clean development environment
- [ ] Working SCIP client container
- [ ] Basic orchestration service
- [ ] MQTT broker configured

### 6.2 Phase 2: Data Models & Storage (Days 3-4)
**Objective:** Implement JSON-based storage and data models

#### Tasks:
1. **JSON Storage Service**
   ```python
   class JSONStorage:
       def save_scenario(self, scenario: Scenario) -> None
       def load_scenario(self, scenario_id: str) -> Scenario
       def save_team_timeline(self, team_timeline: TeamTimeline) -> None
       def load_team_timeline(self, scenario_id: str, team_id: str) -> TeamTimeline
   ```

2. **TypeScript Data Models**
   ```typescript
   interface Scenario {
     id: string;
     name: string;
     description: string;
     duration_minutes: number;
     max_teams: number;
     status: ScenarioStatus;
     teams: Team[];
     media_library: MediaFile[];
   }
   ```

3. **File System Structure**
   - Create scenarios directory structure
   - Implement media upload handling
   - Set up thumbnail generation

4. **API Endpoints**
   - Scenario CRUD operations
   - Team management endpoints
   - Media upload/download

**Deliverables:**
- [ ] JSON storage system
- [ ] TypeScript data models
- [ ] File system structure
- [ ] Basic API endpoints

### 6.3 Phase 3: UI Implementation (Days 5-7)
**Objective:** Build scenario management interface

#### Tasks:
1. **Scenario Management UI**
   - Scenario creator form
   - Scenario library with search/filter
   - Scenario configuration editor

2. **Team Management UI**
   - Team creation interface
   - Team configuration panel
   - Team status monitoring

3. **Media Library UI**
   - Drag-and-drop file upload
   - Thumbnail grid view
   - Media preview modal
   - File management (delete, rename)

4. **Navigation & Layout**
   - Responsive sidebar navigation
   - Breadcrumb navigation
   - Loading states and error handling

**Deliverables:**
- [ ] Scenario management interface
- [ ] Team configuration UI
- [ ] Media library with uploads
- [ ] Responsive navigation

### 6.4 Phase 4: Injection System (Days 8-10)
**Objective:** Build timeline execution engine

#### Tasks:
1. **Injection Timeline UI**
   - Visual timeline editor
   - Drag-and-drop injection scheduling
   - Injection configuration forms
   - Timeline validation

2. **Timeline Execution Engine**
   ```python
   class InjectionEngine:
       def start_exercise(self, scenario_id: str) -> None
       def pause_exercise(self, scenario_id: str) -> None
       def resume_exercise(self, scenario_id: str) -> None
       def stop_exercise(self, scenario_id: str) -> None
       def execute_injection(self, injection: Injection) -> None
   ```

3. **MQTT Integration**
   - Message publishing service
   - Topic management
   - Message queuing for paused exercises

4. **Exercise State Management**
   - Real-time state tracking
   - State persistence
   - Error handling and recovery

**Deliverables:**
- [ ] Timeline editor interface
- [ ] Injection execution engine
- [ ] MQTT integration
- [ ] Exercise state management

### 6.5 Phase 5: Exercise Control (Days 11-12)
**Objective:** Build exercise control dashboard

#### Tasks:
1. **Exercise Control UI**
   - Real-time status dashboard
   - Control buttons (start/pause/stop/reset)
   - Team status monitoring
   - Injection progress tracking

2. **Real-time Updates**
   - WebSocket connection for live updates
   - Auto-refresh team status
   - Real-time injection tracking

3. **Error Handling**
   - Failed injection retry mechanism
   - Container health monitoring
   - Automatic recovery procedures

**Deliverables:**
- [ ] Exercise control dashboard
- [ ] Real-time monitoring
- [ ] Error handling system

### 6.6 Phase 6: Team Dashboard Integration (Days 13-14)
**Objective:** Enhance team dashboards for media display

#### Tasks:
1. **Enhanced MQTT Handling**
   - Update team dashboard MQTT client
   - Add injection message processing
   - Implement media display components

2. **Media Display Components**
   ```typescript
   const InjectedMediaCard = ({ injection }: { injection: InjectionMessage }) => {
     return (
       <div className={`injected-media ${injection.priority}`}>
         <div className="media-header">
           <h3>{injection.content.title}</h3>
           <span className="timestamp">{formatTime(injection.timestamp)}</span>
         </div>
         {injection.content.media_url && (
           <img src={injection.content.media_url} alt={injection.content.title} />
         )}
         <p>{injection.content.description}</p>
       </div>
     );
   };
   ```

3. **Page Integration**
   - Twitter feed injections
   - News feed injections
   - Alert system injections
   - Email inbox injections

**Deliverables:**
- [ ] Enhanced team dashboard MQTT
- [ ] Media display components
- [ ] Page-specific injection handling

### 6.7 Phase 7: Analytics & Testing (Days 15-16)
**Objective:** Add analytics and comprehensive testing

#### Tasks:
1. **Analytics Dashboard**
   - Exercise performance metrics
   - Team response tracking
   - Injection success rates
   - Timeline adherence metrics

2. **Analytics Data Collection**
   ```python
   class AnalyticsCollector:
       def track_injection_execution(self, injection: Injection, success: bool) -> None
       def track_team_response(self, team_id: str, response_time: float) -> None
       def generate_exercise_report(self, scenario_id: str) -> ExerciseReport
   ```

3. **End-to-End Testing**
   - Create test scenarios
   - Test all exercise states
   - Verify injection delivery
   - Test multi-team scenarios

4. **Performance Optimization**
   - Optimize image loading
   - Reduce MQTT message overhead
   - Improve UI responsiveness

**Deliverables:**
- [ ] Analytics dashboard
- [ ] Data collection system
- [ ] Comprehensive testing
- [ ] Performance optimization

---

## 7. TECHNICAL REQUIREMENTS

### 7.1 System Requirements
- **Docker Engine:** 20.10+
- **Docker Compose:** 2.0+
- **Node.js:** 18+ (for development)
- **Python:** 3.11+ (for orchestration)
- **Available Ports:** 1883, 3001, 8001, 9001, 3201-3299
- **Storage:** 10GB minimum for media files

### 7.2 Dependencies

#### 7.2.1 SCIP Client (React)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "mqtt": "^5.2.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.48.0",
    "react-dropzone": "^14.2.0",
    "lucide-react": "^0.400.0",
    "react-query": "^3.39.0",
    "zustand": "^4.4.0"
  }
}
```

#### 7.2.2 Orchestration Service (Python)
```python
# requirements.txt
fastapi==0.104.1
uvicorn==0.24.0
docker==6.1.3
pydantic==2.5.0
aiofiles==23.2.1
paho-mqtt==1.6.1
pillow==10.1.0
python-multipart==0.0.6
websockets==12.0
asyncio-mqtt==0.13.0
```

### 7.3 Security Considerations
- **Container Isolation:** Each team dashboard runs in isolated container
- **File Upload Validation:** Strict file type and size validation
- **MQTT Security:** Topic-based access control (future enhancement)
- **Media Storage:** Secure file storage with virus scanning (future)
- **API Rate Limiting:** Prevent abuse of upload endpoints

---

## 8. SUCCESS CRITERIA

### 8.1 Functional Requirements
- [ ] Create scenarios with up to 6 teams
- [ ] Upload and manage media files with thumbnails
- [ ] Configure injection timelines per team
- [ ] Deploy team dashboard containers dynamically
- [ ] Execute timed injections with media display
- [ ] Control exercise state (start/pause/stop/reset)
- [ ] Monitor real-time exercise progress
- [ ] Generate exercise analytics and reports

### 8.2 Performance Requirements
- [ ] Media upload < 5 seconds for 10MB files
- [ ] Injection delivery < 2 seconds from trigger
- [ ] Dashboard response time < 1 second
- [ ] Support 6 concurrent team dashboards
- [ ] Handle 100+ injections per exercise

### 8.3 Quality Requirements
- [ ] Zero data loss during pause/resume
- [ ] Graceful error handling and recovery
- [ ] Responsive UI on tablets and desktops
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] Comprehensive logging and debugging

---

## 9. DEPLOYMENT CHECKLIST

### 9.1 Pre-Deployment
- [ ] All components built successfully
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Security scan completed
- [ ] Performance benchmarks met

### 9.2 Deployment Steps
1. [ ] Clone repository
2. [ ] Configure environment variables
3. [ ] Build all containers: `docker-compose build`
4. [ ] Start services: `docker-compose up -d`
5. [ ] Verify service health: `docker-compose ps`
6. [ ] Test MQTT connectivity
7. [ ] Upload test media
8. [ ] Create test scenario
9. [ ] Execute end-to-end test

### 9.3 Post-Deployment Verification
- [ ] All services running and healthy
- [ ] SCIP client accessible at http://localhost:3001
- [ ] Orchestration API responding at http://localhost:8001
- [ ] MQTT broker accepting connections
- [ ] Media upload functionality working
- [ ] Team dashboard deployment working
- [ ] Injection system functioning correctly

---

## 10. MAINTENANCE & SUPPORT

### 10.1 Monitoring
- **Container Health:** Monitor all service containers
- **Disk Usage:** Monitor scenarios and media storage
- **MQTT Broker:** Monitor connection count and message throughput
- **Team Dashboards:** Monitor container resource usage

### 10.2 Backup Strategy
- **Scenarios:** Daily backup of scenarios directory
- **Media Files:** Incremental backup of media uploads
- **Configuration:** Version control for all configuration files
- **Container Images:** Tag and store production-ready images

### 10.3 Troubleshooting Guide
- **Container Won't Start:** Check logs, verify ports, check dependencies
- **MQTT Connection Failed:** Verify broker status, check firewall
- **Media Upload Failed:** Check disk space, verify file permissions
- **Injection Not Delivered:** Check MQTT topics, verify team container health

---

## 11. SCALABILITY & FUTURE EXTENSIBILITY

### 11.1 Scenario Type Flexibility
The system is designed to support **multiple scenario types** with different constraints:

#### **Maritime Crisis Scenario (Current)**
- **Team Limit:** 6 teams maximum
- **Duration:** 60 minutes
- **Injection Types:** Media (images), alerts, emails, news
- **Target Pages:** Twitter, news feeds, alert system, email

#### **Future Scenario Types (Extensible)**
- **Cyber Attack Scenario:** Up to 12 teams, 120 minutes
- **Natural Disaster Response:** Up to 20 teams, 4 hours
- **Corporate Crisis Management:** Up to 8 teams, 90 minutes
- **Multi-Domain Operations:** Up to 15 teams, 180 minutes

### 11.2 Scalable Architecture Components

#### **11.2.1 Dynamic Team Limits**
```json
// Scenario Template Schema
{
  "scenario_template": {
    "id": "maritime-crisis-v1",
    "name": "Maritime Crisis Response",
    "constraints": {
      "min_teams": 2,
      "max_teams": 6,
      "max_duration_minutes": 120,
      "required_roles": ["Security", "Operations", "Command"]
    }
  },
  "cyber-attack-template": {
    "id": "cyber-attack-v1",
    "name": "Advanced Persistent Threat Response",
    "constraints": {
      "min_teams": 4,
      "max_teams": 12,
      "max_duration_minutes": 240,
      "required_roles": ["SOC", "Incident Response", "Management", "Legal"]
    }
  }
}
```

#### **11.2.2 Extensible Injection System**
```typescript
// Future injection types
interface InjectionTypes {
  media: MediaInjection;        // Current: images
  video: VideoInjection;        // Future: video clips
  audio: AudioInjection;        // Future: radio communications
  document: DocumentInjection;  // Future: PDF reports
  simulation: SimulationInjection; // Future: live data feeds
  interactive: InteractiveInjection; // Future: decision trees
}

// Extensible target pages
interface TargetPages {
  twitter: TwitterPage;         // Current
  news: NewsPage;              // Current
  alerts: AlertsPage;          // Current
  email: EmailPage;            // Current
  radio: RadioPage;            // Future
  intelligence: IntelPage;     // Future
  logistics: LogisticsPage;    // Future
  finance: FinancePage;        // Future
}
```

#### **11.2.3 Scalable Container Management**
```python
# Dynamic port allocation
class PortManager:
    def __init__(self, port_ranges: Dict[str, range]):
        self.maritime_range = range(3201, 3207)  # 6 teams max
        self.cyber_range = range(3301, 3313)     # 12 teams max
        self.disaster_range = range(3401, 3421)  # 20 teams max

    def allocate_ports(self, scenario_type: str, team_count: int) -> List[int]:
        port_range = self.get_range_for_scenario(scenario_type)
        return list(port_range)[:team_count]

# Scalable resource limits
class ResourceManager:
    def get_limits_for_scenario(self, scenario_type: str) -> ResourceLimits:
        return {
            "maritime": {"cpu": "0.5", "memory": "512MB", "max_teams": 6},
            "cyber": {"cpu": "1.0", "memory": "1GB", "max_teams": 12},
            "disaster": {"cpu": "0.3", "memory": "256MB", "max_teams": 20}
        }[scenario_type]
```

### 11.3 Database Schema Extensibility

#### **11.3.1 Flexible Scenario Configuration**
```json
{
  "scenario_config": {
    "metadata": {
      "type": "maritime-crisis|cyber-attack|disaster-response|custom",
      "version": "1.0",
      "template_id": "maritime-crisis-v1"
    },
    "constraints": {
      "min_teams": 2,
      "max_teams": 6,          // Configurable per type
      "duration_range": {
        "min_minutes": 30,
        "max_minutes": 120     // Configurable per type
      },
      "injection_limits": {
        "max_per_team": 50,
        "max_total": 300,
        "max_concurrent": 5
      }
    },
    "capabilities": {
      "supported_media_types": ["image/jpeg", "image/png", "video/mp4"],
      "supported_injection_types": ["media", "alert", "email", "news"],
      "supported_target_pages": ["twitter", "news", "alerts", "email"],
      "real_time_analytics": true,
      "team_communication": false
    }
  }
}
```

#### **11.3.2 Extensible Injection Schema**
```json
{
  "injection": {
    "core_fields": {
      "id": "injection-{uuid}",
      "time_offset_seconds": 300,
      "team_id": "blue-team",
      "type": "media|alert|email|news|video|audio|document|simulation",
      "target": "twitter|news|alerts|email|radio|intel|logistics|finance"
    },
    "extensible_content": {
      "base_content": {
        "title": "Required field",
        "description": "Optional field"
      },
      "type_specific_content": {
        // Different content structure per injection type
        "media_content": { "media_url": "", "display_duration": 180 },
        "video_content": { "video_url": "", "auto_play": true, "subtitles": true },
        "simulation_content": { "data_feed_url": "", "update_interval": 30 }
      }
    }
  }
}
```

### 11.4 UI Scalability Features

#### **11.4.1 Dynamic Scenario Templates**
```typescript
const ScenarioTemplateSelector = () => {
  const templates = [
    {
      id: "maritime-crisis",
      name: "Maritime Crisis Response",
      maxTeams: 6,
      suggestedDuration: 60,
      complexity: "Intermediate"
    },
    {
      id: "cyber-attack",
      name: "Cyber Attack Response",
      maxTeams: 12,
      suggestedDuration: 120,
      complexity: "Advanced"
    },
    {
      id: "custom",
      name: "Custom Scenario",
      maxTeams: 50,  // System maximum
      suggestedDuration: 480,
      complexity: "Expert"
    }
  ];

  return (
    <TemplateGrid>
      {templates.map(template => (
        <TemplateCard
          key={template.id}
          template={template}
          onSelect={handleTemplateSelect}
        />
      ))}
    </TemplateGrid>
  );
};
```

#### **11.4.2 Adaptive Team Management UI**
```typescript
const TeamManagementGrid = ({ maxTeams }: { maxTeams: number }) => {
  return (
    <div className={`team-grid ${getGridLayout(maxTeams)}`}>
      {/* Automatically adjust grid layout based on team count */}
      {/* 6 teams = 2x3 grid */}
      {/* 12 teams = 3x4 grid */}
      {/* 20 teams = 4x5 grid */}
      {teams.map(team => (
        <TeamCard key={team.id} team={team} compact={maxTeams > 12} />
      ))}
    </div>
  );
};
```

### 11.5 Performance Scaling

#### **11.5.1 Resource Optimization**
- **Container Resource Limits:** Adjust based on scenario type and team count
- **MQTT Topic Optimization:** Hierarchical topics to reduce message overhead
- **Media Streaming:** Progressive loading for large scenarios
- **Database Indexing:** Optimize for scenario and team lookups

#### **11.5.2 Horizontal Scaling**
```yaml
# Future: Multiple orchestration instances
services:
  orchestration-1:
    image: scip-orchestration
    environment:
      - SCENARIO_TYPES=maritime,cyber
      - PORT_RANGE=3201-3400

  orchestration-2:
    image: scip-orchestration
    environment:
      - SCENARIO_TYPES=disaster,custom
      - PORT_RANGE=3401-3600
```

### 11.6 Migration Strategy

#### **11.6.1 Version Compatibility**
- **Scenario Schema Versioning:** Support multiple schema versions simultaneously
- **API Versioning:** Maintain backward compatibility for existing scenarios
- **Template Migration:** Auto-upgrade old scenarios to new template formats

#### **11.6.2 Data Migration**
```python
class ScenarioMigrator:
    def migrate_v1_to_v2(self, scenario_v1: dict) -> dict:
        """Migrate v1.0 scenarios to v2.0 with extended capabilities"""
        return {
            **scenario_v1,
            "version": "2.0",
            "constraints": self.extract_constraints(scenario_v1),
            "capabilities": self.detect_capabilities(scenario_v1)
        }
```

---

**Updated Implementation Plan v1.0 - Now with Full Scalability**

---

**End of Implementation Plan v1.0**

---

## READY TO BUILD

This detailed implementation plan provides:

✅ **Complete architecture specification**
✅ **Detailed component breakdown**
✅ **Comprehensive data models**
✅ **Step-by-step implementation roadmap**
✅ **Technical requirements and dependencies**
✅ **Success criteria and quality gates**
✅ **Deployment and maintenance procedures**

**The plan is comprehensive, actionable, and ready for implementation. All technical details, file structures, API endpoints, UI components, and implementation phases are clearly defined.**

**Ready to proceed with Phase 1: Foundation Setup when you give the go-ahead!**