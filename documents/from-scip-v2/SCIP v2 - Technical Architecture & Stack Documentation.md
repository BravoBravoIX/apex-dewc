# SCIP v2 - Technical Architecture & Stack Documentation
## Platform Technology Decisions & Implementation Guide

---

## Executive Summary

This document defines the technical architecture for the SCIP v2 platform, leveraging existing CyberOps codebases from scip-range, media-range (Portfall), Gap Analysis, and rf-range projects. The architecture prioritizes reusability, scalability, and future extensibility for complex decision trees and cascading scenario effects.

---

## Core Architecture Principles

### 1. **Maximum Code Reuse**
- Leverage 85% existing codebase from reference projects
- Minimize new development to multi-tenancy and organization management
- Maintain proven patterns from production systems

### 2. **Separation of Concerns**
- Single backend API serving all three frontends
- Clear boundaries between organizations via row-level security
- Isolated team dashboards with controlled information flow

### 3. **Real-Time First**
- MQTT for all real-time communications
- WebSocket fallback for browser clients
- Event-driven architecture for scenario execution

### 4. **Future-Ready for Decision Trees**
- State machine architecture for scenario progression
- Event sourcing for decision tracking
- Graph database ready (future enhancement)

---

## Technology Stack

### Backend Services

```yaml
Core API:
  Framework: FastAPI (Python 3.11+)
  Source: Adapted from scip-range
  Rationale: 
    - Proven in existing system
    - Excellent async support for real-time operations
    - Auto-generated OpenAPI documentation
    - Type hints for better code quality

Database:
  Primary: PostgreSQL 15
  Source: Upgrade from scip-range SQLite
  Rationale:
    - Row-level security for multi-tenancy
    - JSONB for flexible scenario storage
    - Excellent performance at scale
    - Native full-text search capabilities
  
  Future: Neo4j (Phase 2)
  Purpose: Complex decision trees and relationships
  Rationale:
    - Graph structure for decision cascades
    - Efficient path finding for scenario branches
    - Visual representation of decision impacts

Cache & Session:
  System: Redis 7
  Source: Reuse from media-range and scip-range
  Rationale:
    - Proven in existing systems
    - Excellent pub/sub for real-time updates
    - Session management
    - Scenario state caching
  Usage:
    - User sessions (24-hour TTL)
    - Scenario execution state
    - Real-time dashboard data
    - API response caching

Message Broker:
  System: Eclipse Mosquitto 2.0 (MQTT)
  Source: Direct reuse from both ranges
  Rationale:
    - Already implemented and tested
    - Excellent for real-time scenarios
    - Lightweight protocol for dashboards
    - Topic-based routing perfect for teams
  Topics Structure:
    - /org/{org_id}/exercise/{exercise_id}/team/{team_id}/feed
    - /org/{org_id}/exercise/{exercise_id}/control
    - /system/health/{service}

File Storage:
  Primary: Local filesystem with Docker volumes
  Future: S3-compatible object storage
  Structure:
    /storage/
      /organizations/{org_id}/
        /scenarios/
        /assets/
        /reports/
        /branding/
```

### Frontend Applications

```yaml
SCIP Control (Admin):
  Framework: React 18
  State: Redux Toolkit
  Source: Direct from scip-range frontend
  Styling: Tailwind CSS
  Build: Vite
  Key Libraries:
    - lucide-react (icons)
    - recharts (analytics)
    - tanstack-table (data grids)
    - react-hook-form (forms)
  Rationale:
    - Existing codebase works well
    - Redux proven for complex state
    - Component library ready to use

Client Dashboard (DEWC):
  Framework: React 18
  State: Zustand (lighter than Redux)
  Source: Gap Analysis UI + scip-range logic
  Styling: Tailwind CSS with dynamic theming
  Build: Vite
  Key Libraries:
    - lucide-react (icons)
    - recharts (analytics)
    - react-query (data fetching)
    - react-hook-form (forms)
    - docx/pdfmake (report generation)
  Rationale:
    - Professional UI from Gap Analysis
    - Zustand simpler for client needs
    - Dynamic theming for white-label

Team Dashboards (Operators):
  Framework: React 18 (minimal)
  State: Local state only
  Source: Portfall UI components
  Styling: Tailwind CSS with team colors
  Build: Vite (optimized production build)
  Key Libraries:
    - mqtt.js (real-time updates)
    - lucide-react (icons)
    - pdf.js (document viewer)
  Rationale:
    - Lightweight for multiple instances
    - Proven media inject components
    - Minimal dependencies for performance
```

### Infrastructure & DevOps

```yaml
Containerization:
  System: Docker + Docker Compose
  Source: Existing configurations
  Rationale:
    - All projects already containerized
    - Easy local development
    - Production-ready deployments

Reverse Proxy:
  System: Nginx
  Source: Existing nginx configs
  Purpose:
    - Route to different services
    - Static file serving
    - WebSocket proxy for MQTT
    - SSL termination

Development Tools:
  Version Control: Git
  CI/CD: GitHub Actions ready
  Testing: Jest (frontend), Pytest (backend)
  Linting: ESLint, Black
  Type Checking: TypeScript, mypy
```

---

## Architecture Decisions

### Decision 1: Multi-Tenancy via Row-Level Security

**Choice:** PostgreSQL RLS with organization_id filtering

**Rationale:**
- Simpler than separate databases per client
- Easier backup and maintenance
- Cost-effective scaling
- Native PostgreSQL feature

**Implementation:**
```sql
-- Enable RLS on all tenant tables
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- Policy for organization isolation
CREATE POLICY tenant_isolation ON scenarios
  USING (organization_id = current_setting('app.current_org_id')::uuid);

-- Set organization context per request
SET LOCAL app.current_org_id = 'org_uuid_here';
```

### Decision 2: MQTT Topic Namespacing

**Choice:** Hierarchical topics with organization isolation

**Rationale:**
- Natural isolation between organizations
- Easy to implement ACLs
- Efficient message routing
- Supports wildcards for monitoring

**Structure:**
```
/org/{org_id}/                          # Organization root
  /exercise/{exercise_id}/               # Exercise context
    /team/{team_id}/                     # Team isolation
      /news                              # News feed
      /social                            # Social media
      /email                             # Communications
      /documents                         # Document delivery
      /decisions                         # Decision requests
      /alerts                           # Priority alerts
    /control/                           # Exercise control
      /status                           # Exercise status
      /timeline                         # Timeline updates
      /metrics                          # Performance metrics
```

### Decision 3: Scenario State Management

**Choice:** Redis for hot state, PostgreSQL for persistence

**Rationale:**
- Redis for sub-millisecond access during execution
- PostgreSQL for audit trail and recovery
- Proven pattern from existing systems

**Implementation:**
```python
# Redis state structure
scenario_state = {
    f"exercise:{exercise_id}:state": {
        "status": "running",
        "current_time": 1845,  # seconds
        "timeline_position": 12,
        "teams": {...},
        "pending_triggers": [...],
        "completed_triggers": [...],
        "decisions": {...}
    }
}

# PostgreSQL persistence
exercise_events (
    id, exercise_id, event_type, event_data, 
    team_id, timestamp, decision_id
)
```

### Decision 4: Dynamic Team Dashboard Deployment

**Choice:** Docker container per team with dynamic port allocation

**Rationale:**
- Complete isolation between teams
- Easy scaling
- Simple cleanup after exercise
- Resource limits per team

**Implementation:**
```python
def deploy_team_dashboard(exercise_id: str, team_id: str, team_config: dict):
    container = docker_client.containers.run(
        image='scip/team-dashboard:latest',
        detach=True,
        environment={
            'EXERCISE_ID': exercise_id,
            'TEAM_ID': team_id,
            'TEAM_COLOR': team_config['color'],
            'MQTT_TOPICS': json.dumps(team_config['topics']),
            'API_TOKEN': generate_team_token(exercise_id, team_id)
        },
        ports={'3000/tcp': None},  # Dynamic port allocation
        name=f"team_{exercise_id}_{team_id}",
        network='exercise_network',
        mem_limit='512m',
        cpu_quota=50000  # 0.5 CPU
    )
    return container.attrs['NetworkSettings']['Ports']['3000/tcp'][0]['HostPort']
```

### Decision 5: Future-Ready Decision Tree Architecture

**Choice:** State machine with event sourcing, prepared for graph database

**Rationale:**
- Current: Simple linear/branching in PostgreSQL JSONB
- Future: Complex graphs in Neo4j
- Event sourcing enables replay and analysis
- Cascading effects through state transitions

**Current Implementation (Phase 1):**
```python
class ScenarioStateMachine:
    def __init__(self, scenario_config: dict):
        self.states = scenario_config['states']
        self.transitions = scenario_config['transitions']
        self.current_state = 'initial'
    
    def process_decision(self, decision: Decision) -> List[Trigger]:
        # Find applicable transitions
        transitions = self.find_transitions(
            from_state=self.current_state,
            decision=decision
        )
        
        # Generate cascading triggers
        triggers = []
        for transition in transitions:
            self.current_state = transition.to_state
            triggers.extend(transition.triggers)
            
            # Cascade to affected teams
            if transition.cascade_to_teams:
                triggers.extend(
                    self.generate_cascade_triggers(
                        transition.cascade_to_teams,
                        transition.cascade_type
                    )
                )
        
        return triggers
```

**Future Enhancement (Phase 2):**
```python
# Neo4j graph structure for complex decision trees
class DecisionGraph:
    def __init__(self, neo4j_driver):
        self.driver = neo4j_driver
    
    def create_decision_node(self, decision: Decision):
        query = """
        CREATE (d:Decision {
            id: $id,
            exercise_id: $exercise_id,
            team_id: $team_id,
            choice: $choice,
            timestamp: $timestamp
        })
        """
        
    def find_cascading_effects(self, decision_id: str):
        query = """
        MATCH (d:Decision {id: $decision_id})
        -[:TRIGGERS*1..3]->(effect:Effect)
        -[:AFFECTS]->(team:Team)
        RETURN effect, team, length(path) as distance
        ORDER BY distance
        """
        # Returns all cascading effects up to 3 levels deep
```

### Decision 6: API Architecture

**Choice:** Single API with role-based endpoint filtering

**Rationale:**
- Simpler than multiple APIs
- Shared business logic
- Easier maintenance
- Clear permission boundaries

**Structure:**
```python
# FastAPI route organization
app = FastAPI()

# Admin routes (CyberOps only)
app.include_router(
    admin_router,
    prefix="/api/v1/admin",
    dependencies=[Depends(require_superadmin)]
)

# Client routes (Organization admins)
app.include_router(
    client_router,
    prefix="/api/v1/client",
    dependencies=[Depends(require_client_admin)]
)

# Dashboard routes (Exercise participants)
app.include_router(
    dashboard_router,
    prefix="/api/v1/dashboard",
    dependencies=[Depends(require_participant)]
)

# Shared health/status endpoints
app.include_router(
    health_router,
    prefix="/api/v1/health"
)
```

### Decision 7: Authentication & Authorization

**Choice:** JWT with organization context

**Rationale:**
- Stateless authentication
- Organization context in token
- Role-based permissions
- Secure and scalable

**JWT Payload Structure:**
```json
{
  "sub": "user_id",
  "org": "organization_id",
  "role": "client_admin|operator|superadmin",
  "permissions": ["scenarios.create", "exercises.launch"],
  "exercise_id": "current_exercise_id",  // For operators
  "team_id": "assigned_team_id",         // For operators
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Decision 8: Websocket Strategy

**Choice:** MQTT over WebSocket with Socket.io fallback

**Rationale:**
- MQTT proven in existing systems
- WebSocket for browser compatibility
- Socket.io for automatic reconnection
- Graceful degradation

**Implementation:**
```javascript
class RealtimeConnection {
  constructor(config) {
    this.primaryConnection = this.connectMQTT(config);
    this.fallbackConnection = null;
  }
  
  connectMQTT(config) {
    const client = mqtt.connect(`ws://${config.mqtt_host}:9001`, {
      username: config.team_id,
      password: config.exercise_token,
      clientId: `dashboard_${config.team_id}_${Date.now()}`
    });
    
    client.on('error', () => {
      this.connectSocketIO(config);
    });
    
    return client;
  }
  
  connectSocketIO(config) {
    this.fallbackConnection = io(`http://${config.api_host}`, {
      auth: { token: config.exercise_token }
    });
  }
}
```

---

## Data Models

### Core Entities

```python
# SQLAlchemy models
class Organization(Base):
    __tablename__ = 'organizations'
    
    id = Column(UUID, primary_key=True)
    identifier = Column(String(100), unique=True)
    name = Column(String(255))
    branding_config = Column(JSONB)  # Logos, colors, fonts
    settings = Column(JSONB)          # Feature flags, limits
    created_at = Column(DateTime)
    is_active = Column(Boolean, default=True)

class Scenario(Base):
    __tablename__ = 'scenarios'
    
    id = Column(UUID, primary_key=True)
    organization_id = Column(UUID, ForeignKey('organizations.id'))
    name = Column(String(255))
    config = Column(JSONB)  # Complete scenario definition
    triggers = Column(JSONB)  # Array of trigger definitions
    decision_tree = Column(JSONB)  # Future: Decision logic
    is_template = Column(Boolean, default=False)
    version = Column(Integer, default=1)

class Exercise(Base):
    __tablename__ = 'exercises'
    
    id = Column(UUID, primary_key=True)
    organization_id = Column(UUID, ForeignKey('organizations.id'))
    scenario_id = Column(UUID, ForeignKey('scenarios.id'))
    name = Column(String(255))
    status = Column(Enum(ExerciseStatus))
    config = Column(JSONB)  # Team assignments, settings
    started_at = Column(DateTime)
    completed_at = Column(DateTime)

class ExerciseEvent(Base):
    __tablename__ = 'exercise_events'
    
    id = Column(UUID, primary_key=True)
    exercise_id = Column(UUID, ForeignKey('exercises.id'))
    event_type = Column(String(50))  # trigger, decision, alert
    event_data = Column(JSONB)
    team_id = Column(String(50))
    timestamp = Column(DateTime)
    
    # For decision tracking
    decision_id = Column(UUID)
    decision_choice = Column(String(255))
    decision_impacts = Column(JSONB)  # Future: Track cascades
```

---

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: scip_v2_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mqtt:
    image: eclipse-mosquitto:2.0
    ports:
      - "1883:1883"
      - "9001:9001"
    volumes:
      - ./mqtt/mosquitto.conf:/mosquitto/config/mosquitto.conf

  backend:
    build: 
      context: ./backend
      target: development
    volumes:
      - ./backend:/app
      - ./shared:/app/shared
    environment:
      DATABASE_URL: postgresql://dev_user:dev_password@postgres:5432/scip_v2_dev
      REDIS_URL: redis://redis:6379
      MQTT_BROKER: mqtt
      DEBUG: true
    ports:
      - "8000:8000"
    command: uvicorn app.main:app --reload --host 0.0.0.0

  scip-control:
    build:
      context: ./scip-control
      target: development
    volumes:
      - ./scip-control/src:/app/src
      - ./shared:/app/shared
    environment:
      VITE_API_URL: http://localhost:8000/api/v1/admin
      VITE_MQTT_URL: ws://localhost:9001
    ports:
      - "3000:3000"
    command: npm run dev

volumes:
  postgres_dev_data:
```

### Production Deployment

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 1G

  backend:
    image: scip/backend:latest
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      SECRET_KEY: ${SECRET_KEY}
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - scip-control
      - client-dashboard

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```

---

## Performance Targets

### System Requirements
- **Concurrent Organizations:** 50+
- **Concurrent Exercises:** 20+
- **Total Active Users:** 500+
- **Team Dashboards:** 100+ simultaneous
- **Message Throughput:** 10,000 msg/sec
- **API Response Times:**
  - Admin API: < 500ms (p95) - Complex queries acceptable
  - Platform API: < 200ms (p95) - Fast UI responses
  - Integration API: < 1000ms (p95) - Bulk operations allowed
- **Dashboard Load Time:** < 2 seconds
- **Real-time Latency:** < 100ms

### API-Specific Targets
- **Admin API:** 100 req/sec (lower volume, complex operations)
- **Platform API:** 1000 req/sec (high volume, simple operations)
- **Integration API:** 500 req/sec (rate-limited per client)

### Scaling Strategy
1. **API-Specific Scaling:**
   - Admin API: Vertical scaling (more powerful instances)
   - Platform API: Horizontal scaling (multiple instances)
   - Integration API: Rate-limited horizontal scaling
2. **Read Replicas:** PostgreSQL for read-heavy operations
3. **Redis Cluster:** For high-throughput caching
4. **MQTT Clustering:** For message broker redundancy
5. **CDN:** For static assets and media

---

## Security Considerations

### Application Security
- JWT tokens with 24-hour expiry
- Organization-scoped API access
- Rate limiting per organization
- Input validation and sanitization
- SQL injection prevention via ORM
- XSS protection in React

### Infrastructure Security
- Network segmentation between organizations
- TLS for all external communications
- Encrypted database connections
- Secure environment variables
- Docker security scanning
- Regular dependency updates

### Data Protection
- Encryption at rest (PostgreSQL)
- Encrypted backups
- GDPR compliance ready
- Audit logging
- Data retention policies
- Secure file upload handling

---

## Migration Path from Existing Systems

### Phase 1: Core Platform (Weeks 1-4)
1. Adapt scip-range backend to FastAPI structure
2. Implement PostgreSQL schema with RLS
3. Add organization management layer
4. Port MQTT messaging system
5. Integrate Redis caching

### Phase 2: User Interfaces (Weeks 5-6)
1. Adapt scip-range frontend for SCIP Control
2. Apply Gap Analysis styling to Client Dashboard
3. Extract Portfall components for Team Dashboards
4. Implement dynamic branding system

### Phase 3: Integration (Weeks 7-8)
1. Connect all systems via MQTT
2. Test multi-organization isolation
3. Implement exercise launch workflow
4. Validate real-time messaging
5. Performance testing

### Phase 4: Decision Trees (Future)
1. Design state machine architecture
2. Implement event sourcing
3. Add Neo4j for complex graphs
4. Build decision cascade engine
5. Create visual decision tree editor

---

## Monitoring & Observability

### Metrics Collection
```yaml
Prometheus Metrics:
  - API request rates and latencies
  - Database query performance
  - MQTT message throughput
  - Redis cache hit rates
  - Container resource usage
  - Exercise execution metrics

Application Metrics:
  - Active exercises count
  - Concurrent users per organization  
  - Trigger delivery success rate
  - Decision capture rate
  - Team response times
  - System error rates
```

### Logging Strategy
```python
# Structured logging with context
import structlog

logger = structlog.get_logger()

logger.info("exercise_started", 
    organization_id=org_id,
    exercise_id=exercise_id,
    scenario_id=scenario_id,
    team_count=len(teams),
    duration_minutes=duration
)
```

---

## Development Workflow

### Git Repository Structure
```
scip-v2/
├── backend/           # FastAPI backend
├── scip-control/      # Admin frontend
├── client-dashboard/  # Client frontend
├── team-dashboard/    # Operator frontend
├── shared/           # Shared types and utilities
├── infrastructure/   # Docker and deployment configs
├── docs/            # Documentation
└── tests/           # Integration tests
```

### Branch Strategy
- `main` - Production ready code
- `develop` - Integration branch
- `feature/*` - Feature development
- `hotfix/*` - Production fixes

### Code Quality Standards
- Type hints in Python
- TypeScript for all frontend code
- 80% test coverage minimum
- Code review required
- Automated linting in CI

---

## Future Enhancements Roadmap

### Phase 2: Advanced Decision Trees (Months 2-3)
- State machine implementation
- Event sourcing for replay
- Basic cascade effects
- Decision impact visualization

### Phase 3: Complex Scenarios (Months 4-6)
- Neo4j graph database integration
- Multi-path scenario branching
- AI-driven cascade generation
- Predictive decision impacts
- Scenario editor UI

### Phase 4: Advanced Capabilities (Months 7-12)
- RF range integration
- Hardware-in-the-loop support
- VR/AR interfaces
- Machine learning for scenario adaptation
- Multi-organization collaborative exercises

---

## Conclusion

This architecture leverages 85% of existing, proven code while adding the minimal necessary components for multi-organization support. The design is future-ready for complex decision trees while maintaining simplicity for the initial MVP. By reusing battle-tested components from scip-range, media-range, and Gap Analysis, we significantly reduce development risk and time to market.