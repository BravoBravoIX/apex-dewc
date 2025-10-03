# Component Extraction Guide for SCIP v3

## Overview
This guide details exactly which components and patterns to extract from each reference project for the SCIP v3 platform.

## 1. From scip-range (Management Tool)

### Backend Components to Extract:
```
backend/
├── app/
│   ├── main.py                    → Copy FastAPI app initialization
│   ├── core/
│   │   ├── config.py              → Adapt for multi-tenant config
│   │   ├── security.py            → Extend with organization context
│   │   ├── database.py            → Upgrade to PostgreSQL 15
│   │   └── middleware.py          → Add organization middleware
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/         → Adapt endpoint structure
│   │       └── dependencies.py    → Add org context dependency
│   ├── models/                    → Extend with multi-tenant fields
│   ├── schemas/                   → Add organization schemas
│   └── services/
│       └── mqtt_service.py        → Extend for org isolation
```

### Docker Configuration:
```yaml
# Extract and enhance from docker-compose.yml:
- Service definitions
- Network configuration
- Volume management
- Health checks
- Environment variable patterns
```

### Frontend Dashboard Patterns:
```
src/
├── layouts/
│   └── DashboardLayout.tsx        → Base layout structure
├── components/
│   ├── exercise/
│   │   └── ExerciseControl.tsx   → Exercise management UI
│   └── monitoring/
│       └── SystemStatus.tsx       → Status indicators
└── services/
    └── api.ts                     → API client patterns
```

## 2. From media-range (Portfall - Maritime Scenario)

### Feed Components to Extract:
```
src/components/
├── feeds/
│   ├── NewsFeed.tsx               → News article display
│   ├── SocialMediaFeed.tsx        → Twitter-style posts
│   ├── EmailList.tsx              → Communications display
│   ├── DocumentViewer.tsx         → PDF viewer component
│   └── MediaPlayer.tsx            → Video/audio player
├── timeline/
│   └── TimelineVisualization.tsx  → Exercise timeline
└── alerts/
    └── AlertModal.tsx             → Priority alerts
```

### MQTT Implementation:
```javascript
// src/services/mqtt.js - Extract and adapt:
class MQTTClient {
  - Connection management
  - Topic subscription patterns
  - Message parsing
  - Reconnection logic
  - Message queuing
}
```

### Scenario JSON Format:
```json
// scenarios/maritime-crisis.json - Study structure:
{
  "triggers": [],
  "timeline": [],
  "teams": [],
  "content": {}
}
```

## 3. From Gap_Analysis (Professional Theme)

### Theme Configuration:
```
src/
├── styles/
│   ├── theme.css                  → Corporate white/grey theme
│   ├── variables.css              → CSS variables
│   └── typography.css            → Font definitions
├── tailwind.config.js            → Tailwind configuration
└── components/
    └── ui/                        → Styled base components
```

### Professional UI Components:
```
src/components/
├── common/
│   ├── Button.tsx                 → Styled buttons
│   ├── Card.tsx                  → Card containers
│   ├── Modal.tsx                 → Modal dialogs
│   └── Badge.tsx                 → Status badges
├── tables/
│   ├── DataTable.tsx             → Advanced data tables
│   ├── TableFilters.tsx         → Filtering components
│   └── TablePagination.tsx      → Pagination
├── forms/
│   ├── FormField.tsx             → Form inputs
│   ├── Select.tsx                → Dropdown selects
│   └── DatePicker.tsx            → Date selection
└── charts/
    ├── LineChart.tsx             → Performance graphs
    └── BarChart.tsx              → Analytics charts
```

### Authentication UI:
```
src/pages/
├── Login.tsx                     → Professional login page
├── ForgotPassword.tsx            → Password recovery
└── MFA.tsx                       → Two-factor auth
```

## 4. From rf-range (SDR Integration)

### RF Service Components:
```
rf_controller/
├── sdr_interface.py              → Hardware interface
├── frequency_control.py          → Frequency generation
├── jamming_patterns.py           → Jamming algorithms
└── safety_limits.py              → Safety constraints

docker/rf-service/
├── Dockerfile                    → RF service container
└── entrypoint.sh                → Service initialization
```

### RF Integration Points:
```python
# Extract patterns for:
- Hardware detection
- GNU Radio integration
- Frequency control API
- Safety interlocks
- Status monitoring
```

## 5. From phase2.16 Implementation

### Dashboard Orchestration:
```
# Extract patterns for:
- Dynamic dashboard deployment
- Port allocation (3201-3299)
- Container management
- Team isolation
- Cleanup procedures
```

### Configuration Examples:
```yaml
# Team dashboard configurations
- Environment variables per team
- MQTT topic assignments
- Resource limits
- Network isolation
```

## Phase-Based Extraction Plan

### Phase 1 (Days 1-3): Foundation
**Priority Extractions:**
1. Docker Compose structure from `scip-range`
2. FastAPI backend skeleton from `scip-range`
3. PostgreSQL configuration patterns
4. JWT authentication from `Gap_Analysis`
5. MQTT broker configuration from `media-range`

### Phase 2 (Days 4-7): Platform Core
**Priority Extractions:**
1. Feed components from `media-range`
2. Dashboard layout from `scip-range`
3. MQTT client from `media-range`
4. Basic UI components from `Gap_Analysis`
5. Team deployment from `phase2.16`

### Phase 3 (Days 8-10): Control & Polish
**Priority Extractions:**
1. Admin interface patterns from `Gap_Analysis`
2. Data tables from `Gap_Analysis`
3. Charts and analytics from `Gap_Analysis`
4. RF service structure from `rf-range`
5. Professional theme from `Gap_Analysis`

## Adaptation Guidelines

### 1. Multi-Tenancy Additions
Every extracted component needs:
- Organization context awareness
- Row-level security considerations
- Tenant isolation in topics/channels
- Scoped API endpoints

### 2. Theme Consistency
Apply Gap_Analysis theme:
- White/grey color scheme
- Professional typography
- Consistent spacing
- Corporate feel

### 3. MQTT Enhancement
Extend media-range patterns with:
- Organization namespacing
- Topic ACLs
- Connection pooling
- Enhanced security

### 4. Component Modernization
Update extracted components:
- React 18 features
- TypeScript strict mode
- Latest library versions
- Performance optimizations

## File Mapping Quick Reference

| Need | Source Project | File/Directory | Adapt For |
|------|---------------|----------------|-----------|
| Docker setup | scip-range | docker-compose.yml | Multi-service |
| FastAPI structure | scip-range | backend/app/ | Multi-tenant |
| MQTT client | media-range | src/services/mqtt.js | Org isolation |
| Feed components | media-range | src/components/feeds/ | Team context |
| Theme | Gap_Analysis | src/styles/ | All interfaces |
| Data tables | Gap_Analysis | src/components/tables/ | Admin views |
| Auth UI | Gap_Analysis | src/pages/Login.tsx | Org branding |
| RF control | rf-range | rf_controller/ | Demo only |
| Dashboard deploy | phase2.16 | docker scripts | Dynamic teams |

## Component Dependencies

When extracting components, also copy:
- Package dependencies (package.json entries)
- Type definitions (TypeScript interfaces)
- Utility functions
- CSS/styling dependencies
- Test files (if available)
- Configuration files

## Testing Extracted Components

After extraction:
1. Verify component renders in isolation
2. Check TypeScript compilation
3. Test with sample data
4. Verify theme application
5. Test in multi-tenant context
