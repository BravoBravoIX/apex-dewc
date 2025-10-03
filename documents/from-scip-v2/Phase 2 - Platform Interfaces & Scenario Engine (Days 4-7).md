# Phase 2: Platform Interfaces & Scenario Engine (Days 4-7)

## Phase Overview
**Duration:** 4 Days  
**Priority:** Critical - This delivers the visible platform and core functionality  
**Goal:** Build the team dashboards, client dashboard, and scenario execution engine on top of the Phase 1 foundation. This phase delivers the actual user experience and exercise capabilities.
**Tasks:** 11-20 (10 main tasks with additional sub-tasks)

## Success Criteria
- [ ] Team Dashboards deployed and receiving real-time feeds via MQTT
- [ ] Client Dashboard operational with organization branding
- [ ] Scenario data model and API endpoints complete
- [ ] Exercise execution engine launching exercises
- [ ] MQTT trigger delivery system operational
- [ ] Team isolation verified (teams see only their feeds)
- [ ] Real-time monitoring dashboard updating live
- [ ] Docker-based team dashboard deployment working
- [ ] Media assets (images, videos, documents) delivering correctly
- [ ] Decision capture system recording team responses

## Dependencies from Phase 1
- Working JWT authentication with organization context
- MQTT broker with topic isolation
- PostgreSQL with RLS enabled
- FastAPI backend structure
- Docker infrastructure operational
- Organization isolation proven

## Required Source References
- **media-range (Portfall):** UI components for media feeds, injection patterns
- **scip-range:** Dashboard layouts, exercise control patterns
- **Gap_Analysis:** Professional UI components, data tables, forms
- **Existing scenarios:** Reference content structure from past exercises

---

## Task List

### Task 11: Scenario Data Model & API
**Goal:** Complete scenario management system with database and API

**11.1 Database Schema for Scenarios**
Extend Phase 1 database with scenario tables:
```sql
Tables needed:
- scenarios (main scenario definitions)
- scenario_versions (version control)
- scenario_triggers (timeline events)
- trigger_content (actual content for triggers)
- media_assets (images, videos, documents)
- scenario_teams (team configurations)
- scenario_permissions (who can access)
- decision_points (decision configurations)
- scenario_templates (reusable templates)
```

Key design decisions:
- Scenarios owned by organizations
- Triggers stored as JSONB for flexibility
- Media assets with CDN-ready URLs
- Team configurations as JSONB
- Decision trees as structured JSON

**11.2 Scenario API Endpoints**
Create comprehensive scenario management API:
```
GET    /api/v1/scenarios                    # List scenarios for org
POST   /api/v1/scenarios                    # Create new scenario
GET    /api/v1/scenarios/{id}               # Get scenario details
PUT    /api/v1/scenarios/{id}               # Update scenario
DELETE /api/v1/scenarios/{id}               # Soft delete scenario
POST   /api/v1/scenarios/{id}/duplicate     # Clone scenario
GET    /api/v1/scenarios/{id}/triggers      # Get trigger timeline
POST   /api/v1/scenarios/{id}/triggers      # Add trigger
PUT    /api/v1/scenarios/{id}/triggers/{tid} # Update trigger
DELETE /api/v1/scenarios/{id}/triggers/{tid} # Remove trigger
```

**11.3 Media Asset Management**
File upload and management system:
- Upload endpoint with virus scanning
- File type validation (images, videos, PDFs)
- Automatic thumbnail generation
- CDN path generation
- Organization-based storage folders
- Size limits and quota enforcement

**11.4 Scenario Validation**
Business logic validation:
- Timeline conflicts detection
- Team assignment validation
- Content completeness checks
- Media asset availability
- Decision point validation
- Duration calculations

**11.5 Scenario Templates**
Template system for reusability:
- Convert scenario to template
- Template marketplace structure (future)
- Organization-specific templates
- Master templates from CyberOps
- Template versioning

**Testing for Task 11:**
- CRUD operations on scenarios work
- Media upload with various file types
- Organization isolation maintained
- Trigger timeline correctly ordered
- API returns proper error messages

---

### Task 12: Exercise Execution Engine
**Goal:** Complete system for running exercises from scenarios

**12.1 Exercise Data Model**
Exercise runtime tables:
```sql
Tables needed:
- exercises (exercise instances)
- exercise_participants (user assignments)
- exercise_state (current state in Redis + backup in DB)
- exercise_events (audit trail)
- exercise_decisions (captured decisions)
- exercise_metrics (performance data)
```

**12.2 Exercise Lifecycle API**
Complete exercise management:
```
POST   /api/v1/exercises                    # Create from scenario
GET    /api/v1/exercises/{id}              # Get exercise details
PUT    /api/v1/exercises/{id}/configure    # Configure teams
POST   /api/v1/exercises/{id}/launch       # Start exercise
POST   /api/v1/exercises/{id}/pause        # Pause execution
POST   /api/v1/exercises/{id}/resume       # Resume execution
POST   /api/v1/exercises/{id}/stop         # End exercise
GET    /api/v1/exercises/{id}/status       # Current status
POST   /api/v1/exercises/{id}/inject       # Manual trigger inject
```

**12.3 State Management Service**
Redis-based state with PostgreSQL backup:
- Exercise timer management
- Current timeline position
- Pending triggers queue
- Delivered triggers log
- Team states
- Decision windows tracking
- Automatic state persistence

**12.4 Trigger Delivery Service**
Python service for timeline execution:
- Load scenario triggers
- Sort by timeline position
- Timer-based execution
- Team-specific delivery
- MQTT publishing
- Delivery confirmation
- Retry logic for failed delivery

**12.5 Team Token Generation**
Secure team access:
- Generate unique tokens per team per exercise
- Limited scope (read-only, specific topics)
- Automatic expiry after exercise
- Token includes team color, name, allowed feeds

**Testing for Task 12:**
- Exercise launches successfully
- Triggers deliver on schedule
- State persists across restart
- Teams receive only their content
- Exercise stops cleanly

---

### Task 13: Team Dashboard Application
**Goal:** Lightweight React dashboards for exercise participants

**13.1 Project Setup**
Create team-dashboard React application:
```
team-dashboard/
├── src/
│   ├── components/
│   │   ├── feeds/
│   │   │   ├── NewsFeed.tsx
│   │   │   ├── SocialMedia.tsx
│   │   │   ├── EmailFeed.tsx
│   │   │   └── DocumentViewer.tsx
│   │   ├── decisions/
│   │   │   ├── DecisionModal.tsx
│   │   │   └── DecisionHistory.tsx
│   │   ├── alerts/
│   │   │   └── AlertBanner.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── StatusBar.tsx
│   ├── hooks/
│   │   ├── useMQTT.ts
│   │   └── useExercise.ts
│   ├── stores/
│   │   └── feedStore.ts
│   └── App.tsx
├── Dockerfile
└── package.json
```

**13.2 MQTT Integration**
Real-time feed subscription:
- Connect using team token
- Subscribe to team-specific topics
- Handle reconnection automatically
- Process messages into appropriate feeds
- Update UI in real-time
- Queue messages during disconnection

**13.3 Feed Components**
Port from Portfall and adapt:
- **News Feed**: Chronological articles with images
- **Social Media**: Twitter-style posts with engagement
- **Email/Comms**: Priority-based message list
- **Documents**: PDF viewer with classification marks
- **Alerts**: Full-screen priority alerts

**13.4 Decision Capture**
Team decision interface:
- Modal overlay for decisions
- Timer countdown display
- Multiple choice options
- Rationale text field
- Confidence slider
- Submit to backend API
- Show decision history

**13.5 Team Branding**
Dynamic theming per team:
- Team color as CSS variable
- Team name in header
- Team-specific logos (if configured)
- Exercise timer display
- Connection status indicator

**13.6 Production Build**
Optimized for multiple instances:
- Minimal bundle size (<500KB)
- Code splitting
- Lazy loading for document viewer
- CDN-ready static assets
- Docker container (<100MB)

**Testing for Task 13:**
- Dashboard connects via MQTT
- Feeds update in real-time
- Decision capture works
- Team isolation verified
- Performance acceptable with 10+ instances

---

### Task 14: Client Dashboard Application
**Goal:** Professional portal for client organizations

**14.1 Project Setup**
Create client-dashboard React application:
```
client-dashboard/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Scenarios.tsx
│   │   ├── Exercises.tsx
│   │   ├── Monitor.tsx
│   │   ├── Reports.tsx
│   │   └── Teams.tsx
│   ├── components/
│   │   ├── scenarios/
│   │   │   ├── ScenarioCard.tsx
│   │   │   ├── ScenarioDetail.tsx
│   │   │   └── ScenarioBuilder.tsx
│   │   ├── exercises/
│   │   │   ├── ExerciseConfig.tsx
│   │   │   ├── LaunchControl.tsx
│   │   │   └── TeamAssignment.tsx
│   │   ├── monitoring/
│   │   │   ├── Timeline.tsx
│   │   │   ├── TeamStatus.tsx
│   │   │   └── MetricsPanel.tsx
│   │   └── common/
│   │       └── (shared components)
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   └── mqtt.ts
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── scenarioStore.ts
│   │   └── exerciseStore.ts
│   └── App.tsx
├── Dockerfile
└── package.json
```

**14.2 Authentication Integration**
Connect to Phase 1 auth:
- Login page with organization branding
- JWT token management
- Auto-refresh tokens
- Logout functionality
- Session timeout warning
- Remember me option

**14.3 Scenario Management UI**
Browse and manage scenarios:
- Grid/list view toggle
- Scenario cards with thumbnails
- Filter by category, duration, difficulty
- Search functionality
- Scenario detail modal
- Quick launch button
- Edit capabilities (based on permissions)

**14.4 Exercise Configuration**
Multi-step exercise setup:
- Select scenario
- Configure exercise details
- Assign participants to teams
- Set exercise schedule
- Review configuration
- Save as draft or launch

**14.5 Launch Control Interface**
Exercise launch panel:
- Pre-launch checklist
- Team connection status
- System health indicators
- Launch button with confirmation
- Generate team access codes
- Display team dashboard URLs
- Emergency stop button

**14.6 Real-Time Monitoring**
Live exercise dashboard:
- Visual timeline with position marker
- Team status grid
- Trigger delivery status
- Decision capture indicators
- Performance metrics
- Intervention controls
- Manual inject capability

**14.7 Dynamic Branding**
Organization-specific theming:
- Load branding config from API
- Apply colors via CSS variables
- Display organization logo
- Custom fonts if specified
- Favicon update
- Email template branding

**Testing for Task 14:**
- Login works with org context
- Scenarios filtered by organization
- Exercise launch flow completes
- Monitoring updates in real-time
- Branding applies correctly

---

### Task 15: Docker Team Dashboard Orchestration
**Goal:** Dynamic deployment of team dashboards

**15.1 Orchestration Service**
Python service for container management:
- Docker SDK integration
- Container lifecycle management
- Port allocation (3201-3299)
- Resource limits per container
- Health checking
- Automatic cleanup

**15.2 Deployment API**
Endpoints for dashboard management:
```
POST   /api/v1/dashboards/deploy     # Deploy team dashboards
GET    /api/v1/dashboards/status     # Check dashboard health
DELETE /api/v1/dashboards/{id}       # Terminate dashboard
GET    /api/v1/dashboards/ports      # Get assigned ports
```

**15.3 Container Configuration**
Per-team container setup:
- Environment variables (team ID, color, exercise)
- Memory limits (512MB)
- CPU limits (0.5 cores)
- Network isolation
- Volume mounts for logs
- Auto-restart policy

**15.4 Nginx Routing**
Dynamic proxy configuration:
- Route by team ID
- WebSocket support for MQTT
- Load balancing if multiple instances
- SSL termination
- Cache static assets

**15.5 Cleanup Service**
Automatic resource management:
- Stop containers after exercise
- Remove stopped containers
- Clean up unused images
- Free allocated ports
- Archive logs

**Testing for Task 15:**
- Containers deploy successfully
- Each team gets unique port
- Containers isolated from each other
- Cleanup removes all resources
- Can handle 20+ simultaneous containers

---

### Task 16: MQTT Trigger Delivery System
**Goal:** Reliable content delivery to team dashboards

**16.1 Message Schema Definition**
Standardize all message types:
```json
{
  "id": "uuid",
  "type": "news|social|email|document|decision|alert",
  "timestamp": "ISO-8601",
  "exercise_id": "uuid",
  "team_id": "string",
  "priority": "routine|urgent|flash",
  "content": {
    // Type-specific content
  },
  "metadata": {
    "source": "string",
    "classification": "string",
    "correlation_id": "uuid"
  }
}
```

**16.2 Publisher Service**
Reliable message publishing:
- Connection pooling to MQTT
- Message validation before sending
- Delivery confirmation
- Failed message queue
- Retry logic with backoff
- Dead letter queue

**16.3 Topic Management**
Organized topic structure:
- Organization namespacing
- Exercise isolation
- Team-specific topics
- Broadcast topics for all teams
- Control channel for exercise management
- System status topics

**16.4 Message Persistence**
Store messages for replay:
- Save all published messages
- Enable exercise replay
- Audit trail of delivery
- Performance analysis
- Debugging support

**16.5 QoS Configuration**
Quality of Service levels:
- QoS 0 for status updates
- QoS 1 for content delivery
- QoS 2 for critical decisions
- Retention for late-joining clients

**Testing for Task 16:**
- Messages reach correct teams only
- High-priority messages deliver first
- System handles 1000+ msg/sec
- Failed messages retry correctly
- Message order preserved per team

---

### Task 17: Media Asset Delivery
**Goal:** Efficient delivery of images, videos, and documents

**17.1 Storage Architecture**
Organized file storage:
```
/storage/
  /organizations/{org_id}/
    /scenarios/{scenario_id}/
      /images/
      /videos/
      /documents/
    /exercises/{exercise_id}/
      /uploads/
      /captures/
```

**17.2 Upload Processing**
Media handling pipeline:
- Virus scanning
- Format validation
- Image optimization (WebP conversion)
- Video transcoding (if needed)
- PDF security check
- Thumbnail generation

**17.3 CDN Preparation**
Ready for CDN integration:
- Generate CDN-compatible paths
- Cache headers
- CORS configuration
- Signed URLs for private content
- Expiry timestamps

**17.4 Delivery Optimization**
Performance enhancements:
- Progressive image loading
- Video streaming support
- PDF lazy loading
- Compression for documents
- Bandwidth management

**17.5 Access Control**
Media security:
- Organization-based access
- Exercise-specific permissions
- Time-limited URLs
- Team-specific filtering
- Audit media access

**Testing for Task 17:**
- Large files upload successfully
- Images display in dashboards
- Videos stream smoothly
- PDFs open in viewer
- Access control enforced

---

### Task 18: Decision Capture System
**Goal:** Record and analyze team decisions

**18.1 Decision Model**
Database structure for decisions:
```sql
Tables:
- decision_points (configured decision scenarios)
- exercise_decisions (captured responses)
- decision_metadata (timing, confidence, rationale)
- decision_impacts (cascading effects - foundation)
- decision_state_transitions (state machine tracking)
```

State Machine Foundation:
- Each decision can trigger state transitions
- States defined per scenario
- Transitions can generate new triggers
- Event sourcing for replay capability

**18.2 Decision API**
Decision management endpoints:
```
GET    /api/v1/exercises/{id}/decisions      # List decision points
POST   /api/v1/exercises/{id}/decisions      # Submit decision
GET    /api/v1/exercises/{id}/decisions/{did} # Get decision details
GET    /api/v1/decisions/analytics           # Decision analytics
```

**18.3 Capture Interface**
Team dashboard integration:
- Modal appears at trigger time
- Countdown timer
- Options presented clearly
- Confidence slider (0-100%)
- Rationale text (optional/required)
- Submit confirmation

**18.4 Validation & Storage**
Decision processing:
- Validate within time window
- Check team authorization
- Store with timestamp
- Calculate response time
- Update exercise state
- Trigger any cascades (future)

**18.5 Analytics Foundation**
Decision analysis preparation:
- Response time tracking
- Choice distribution
- Confidence correlation
- Team comparison
- Historical trends

**Testing for Task 18:**
- Decisions capture successfully
- Time windows enforced
- All teams can submit
- Analytics calculate correctly
- Rationale stored properly

---

### Task 19: Exercise Reports Foundation
**Goal:** Basic reporting structure (full implementation in Phase 3)

**19.1 Report Data Model**
Report storage structure:
```sql
Tables:
- reports (generated reports)
- report_templates (report formats)
- report_schedules (automated reports - future)
```

**19.2 Data Collection**
Gather exercise data:
- Exercise configuration
- Timeline of events
- Team responses
- Decision timings
- System metrics
- Participation data

**19.3 Report Generation API**
Basic report endpoints:
```
POST   /api/v1/reports/generate      # Generate report
GET    /api/v1/reports/{id}         # Get report
GET    /api/v1/reports/{id}/export  # Export (PDF, Excel)
```

**19.4 Report Templates**
Initial templates:
- Exercise summary (1 page)
- Team performance (basic metrics)
- Decision analysis (choices made)
- Timeline reconstruction
- Participation record

**19.5 Export Formats**
Output options:
- JSON (raw data)
- PDF (formatted - basic)
- Excel (data tables)
- CSV (simple export)

**Testing for Task 19:**
- Reports generate after exercise
- Data accurately captured
- Exports work in all formats
- Organization isolation maintained
- Performance acceptable

---

### Task 20: Integration Testing
**Goal:** Verify all Phase 2 components work together

**20.1 End-to-End Scenarios**
Complete workflow tests:
- Create scenario
- Configure exercise
- Launch exercise
- Deliver triggers
- Capture decisions
- Monitor progress
- Generate report

**20.2 Multi-Organization Tests**
Isolation verification:
- Two orgs run exercises simultaneously
- Verify complete isolation
- No data leakage
- Independent monitoring
- Separate reports

**20.3 Performance Testing**
Load testing:
- 10 concurrent exercises
- 50 team dashboards
- 1000 messages/second
- 100 simultaneous users
- Measure response times

**20.4 Failure Recovery**
Resilience testing:
- MQTT broker restart
- Database failover
- Container crashes
- Network interruption
- Redis failure

**20.5 Security Testing**
Security verification:
- Team token validation
- Cross-team access attempts
- SQL injection attempts
- XSS in user content
- File upload exploits

**Testing for Task 20:**
- All E2E tests pass
- Isolation verified
- Performance meets targets
- System recovers from failures
- No security vulnerabilities

---

## Validation Checklist
Before moving to Phase 3:

1. **Scenarios**
   - [ ] Can create and edit scenarios
   - [ ] Media assets upload and display
   - [ ] Trigger timeline works
   - [ ] Organization isolation verified

2. **Exercises**
   - [ ] Exercise launches from scenario
   - [ ] Teams assigned correctly
   - [ ] State management working
   - [ ] Can pause/resume/stop

3. **Team Dashboards**
   - [ ] Deploy dynamically
   - [ ] Receive correct feeds
   - [ ] Capture decisions
   - [ ] Display media assets

4. **Client Dashboard**
   - [ ] Scenario management works
   - [ ] Exercise configuration complete
   - [ ] Monitoring updates live
   - [ ] Branding applied

5. **Real-Time Delivery**
   - [ ] MQTT messages delivered
   - [ ] Team isolation confirmed
   - [ ] Timeline executes correctly
   - [ ] Decisions captured

6. **Integration**
   - [ ] All components connected
   - [ ] End-to-end flow works
   - [ ] Multi-org isolation verified
   - [ ] Performance acceptable

## Files to Reference from Existing Projects

From **media-range (Portfall):**
- Feed component designs
- Media player components
- Timeline visualization
- Content injection patterns
- Message formatting

From **scip-range:**
- Dashboard layouts
- Exercise control patterns
- State management approaches
- WebSocket/real-time patterns

From **Gap_Analysis:**
- Data tables for listings
- Form components
- Modal designs
- Professional styling
- Loading states

## Success Metrics
- Team dashboards deploy in < 10 seconds
- Triggers deliver within 100ms of scheduled time
- Dashboard loads in < 2 seconds
- 99.9% message delivery success
- Zero cross-team information leakage
- Support 20+ concurrent team dashboards

## Next Phase Dependencies
Phase 3 will require:
- Working exercise execution from Phase 2
- Team dashboards operational
- Client dashboard functional
- Decision capture system
- Basic reporting structure

---

## Implementation Notes
- Reuse Portfall components where possible
- Keep team dashboards lightweight
- Test multi-organization scenarios thoroughly
- Ensure media delivery is optimized
- Document all message schemas
- Plan for scale from the start
- Security review all user inputs