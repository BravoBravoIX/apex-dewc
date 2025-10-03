# API Reference

## Overview

The SCIP v3 platform provides RESTful APIs for managing exercises, timelines, teams, and monitoring. The API uses JWT authentication for secure access and JSON for request/response payloads.

## Base URL

```
Development: http://localhost:8000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

### Login
Authenticate to receive JWT token.

```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400,
  "user": {
    "id": "user-001",
    "username": "admin",
    "role": "admin"
  }
}
```

### Using the Token
Include the JWT token in the Authorization header:

```http
GET /exercises
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Exercises API

### Create Exercise
Create a new exercise from a scenario.

```http
POST /exercises
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Cyber Crisis Training - January 2024",
  "scenario_id": "cyber-crisis-001",
  "teams": [
    {
      "id": "blue",
      "name": "Blue Team",
      "color": "#0066CC",
      "timeline_id": "blue-standard"
    },
    {
      "id": "red",
      "name": "Red Team",
      "color": "#CC0000",
      "timeline_id": "red-aggressive"
    }
  ],
  "duration_minutes": 45,
  "scheduled_start": "2024-01-15T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "exercise": {
    "id": "ex-7f3a8b9c",
    "name": "Cyber Crisis Training - January 2024",
    "scenario_id": "cyber-crisis-001",
    "status": "initialized",
    "teams": [...],
    "duration_minutes": 45,
    "created_at": "2024-01-15T10:30:00Z",
    "dashboard_urls": {
      "blue": "http://localhost:3101",
      "red": "http://localhost:3102"
    }
  }
}
```

### List Exercises
Get all exercises with optional filters.

```http
GET /exercises?status=running&limit=10&offset=0
Authorization: Bearer {token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (initialized, running, paused, completed) |
| `from_date` | ISO 8601 | Exercises created after this date |
| `to_date` | ISO 8601 | Exercises created before this date |
| `limit` | integer | Maximum results to return (default: 20) |
| `offset` | integer | Pagination offset (default: 0) |

**Response:**
```json
{
  "success": true,
  "exercises": [
    {
      "id": "ex-7f3a8b9c",
      "name": "Cyber Crisis Training",
      "status": "running",
      "teams_count": 4,
      "started_at": "2024-01-15T14:00:00Z",
      "progress": 45.5
    }
  ],
  "total": 25,
  "limit": 10,
  "offset": 0
}
```

### Get Exercise Details
Get detailed information about a specific exercise.

```http
GET /exercises/{exercise_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "exercise": {
    "id": "ex-7f3a8b9c",
    "name": "Cyber Crisis Training",
    "scenario_id": "cyber-crisis-001",
    "status": "running",
    "teams": [
      {
        "id": "blue",
        "name": "Blue Team",
        "color": "#0066CC",
        "timeline_id": "blue-standard",
        "dashboard_url": "http://localhost:3101",
        "mqtt_connected": true,
        "injects_delivered": 12,
        "injects_total": 25
      }
    ],
    "timer": {
      "current": 1230,
      "total": 2700,
      "formatted": "T+20:30",
      "percentage": 45.5
    },
    "started_at": "2024-01-15T14:00:00Z",
    "scheduled_end": "2024-01-15T14:45:00Z"
  }
}
```

### Start Exercise
Start an initialized exercise.

```http
POST /exercises/{exercise_id}/start
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Exercise started successfully",
  "status": "running",
  "started_at": "2024-01-15T14:00:00Z"
}
```

### Pause Exercise
Pause a running exercise.

```http
POST /exercises/{exercise_id}/pause
Authorization: Bearer {token}

{
  "reason": "Technical issue with Team Green"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exercise paused",
  "status": "paused",
  "paused_at": "2024-01-15T14:15:30Z"
}
```

### Resume Exercise
Resume a paused exercise.

```http
POST /exercises/{exercise_id}/resume
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Exercise resumed",
  "status": "running",
  "resumed_at": "2024-01-15T14:20:00Z"
}
```

### Stop Exercise
Stop an exercise and cleanup resources.

```http
POST /exercises/{exercise_id}/stop
Authorization: Bearer {token}

{
  "reason": "Exercise completed",
  "cleanup_dashboards": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exercise stopped",
  "status": "completed",
  "ended_at": "2024-01-15T14:45:00Z",
  "dashboards_removed": 4
}
```

### Delete Exercise
Delete an exercise record (only if completed).

```http
DELETE /exercises/{exercise_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Exercise deleted"
}
```

## Timelines API

### Create Timeline
Create a new inject timeline.

```http
POST /timelines
Content-Type: application/json
Authorization: Bearer {token}

{
  "id": "custom-timeline-001",
  "name": "Custom Blue Team Timeline",
  "description": "Modified timeline for advanced teams",
  "duration_minutes": 60,
  "injects": [
    {
      "id": "inject-001",
      "time": 0,
      "type": "news",
      "content": {
        "headline": "Exercise Begins",
        "body": "Scenario briefing...",
        "source": "Command Center"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "timeline": {
    "id": "custom-timeline-001",
    "name": "Custom Blue Team Timeline",
    "total_injects": 1,
    "created_at": "2024-01-15T10:00:00Z"
  }
}
```

### List Timelines
Get all available timelines.

```http
GET /timelines
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "timelines": [
    {
      "id": "blue-standard",
      "name": "Blue Team Standard",
      "description": "Standard timeline for blue teams",
      "duration_minutes": 45,
      "total_injects": 15,
      "tags": ["standard", "blue-team"],
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-10T12:00:00Z"
    }
  ],
  "total": 12
}
```

### Get Timeline Details
Get detailed timeline with all injects.

```http
GET /timelines/{timeline_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "timeline": {
    "id": "blue-standard",
    "name": "Blue Team Standard",
    "description": "Standard timeline for blue teams",
    "duration_minutes": 45,
    "total_injects": 15,
    "injects": [
      {
        "id": "inject-001",
        "time": 0,
        "type": "news",
        "content": {...}
      }
    ],
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-10T12:00:00Z"
  }
}
```

### Update Timeline
Update an existing timeline.

```http
PUT /timelines/{timeline_id}
Content-Type: application/json
Authorization: Bearer {token}

{
  "name": "Updated Timeline Name",
  "injects": [...]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Timeline updated",
  "timeline": {...}
}
```

### Duplicate Timeline
Create a copy of an existing timeline.

```http
POST /timelines/{timeline_id}/duplicate
Content-Type: application/json
Authorization: Bearer {token}

{
  "new_id": "custom-timeline-002",
  "new_name": "Custom Timeline Copy"
}
```

**Response:**
```json
{
  "success": true,
  "timeline": {
    "id": "custom-timeline-002",
    "name": "Custom Timeline Copy",
    "based_on": "blue-standard"
  }
}
```

### Delete Timeline
Delete a timeline (if not in use).

```http
DELETE /timelines/{timeline_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Timeline deleted"
}
```

## Teams API

### Deploy Team Dashboard
Deploy a dashboard for a specific team.

```http
POST /teams/deploy
Content-Type: application/json
Authorization: Bearer {token}

{
  "exercise_id": "ex-7f3a8b9c",
  "team_id": "blue",
  "team_name": "Blue Team",
  "team_color": "#0066CC"
}
```

**Response:**
```json
{
  "success": true,
  "dashboard": {
    "team_id": "blue",
    "container_id": "abc123def456",
    "port": 3101,
    "url": "http://localhost:3101",
    "status": "running"
  }
}
```

### Get Team Status
Get status of a team's dashboard.

```http
GET /teams/{team_id}/status?exercise_id=ex-7f3a8b9c
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "team": {
    "id": "blue",
    "name": "Blue Team",
    "dashboard_status": "running",
    "mqtt_connected": true,
    "injects_delivered": 12,
    "injects_failed": 1,
    "last_activity": "2024-01-15T14:30:00Z"
  }
}
```

### Remove Team Dashboard
Stop and remove a team's dashboard container.

```http
DELETE /teams/{team_id}/dashboard?exercise_id=ex-7f3a8b9c
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Dashboard removed",
  "container_id": "abc123def456"
}
```

## Injects API

### Manually Send Inject
Manually trigger an inject delivery to a team.

```http
POST /injects/send
Content-Type: application/json
Authorization: Bearer {token}

{
  "exercise_id": "ex-7f3a8b9c",
  "team_id": "blue",
  "inject": {
    "type": "sms",
    "content": {
      "from": "+61 400 000 000",
      "text": "Emergency update: Situation critical"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inject delivered",
  "delivery_id": "del-xyz789",
  "delivered_at": "2024-01-15T14:35:00Z"
}
```

### Retry Failed Inject
Retry delivery of a failed inject.

```http
POST /injects/retry
Content-Type: application/json
Authorization: Bearer {token}

{
  "exercise_id": "ex-7f3a8b9c",
  "delivery_id": "del-abc123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Inject redelivered",
  "retry_count": 2
}
```

### Get Inject Delivery Status
Check delivery status of injects.

```http
GET /injects/status?exercise_id=ex-7f3a8b9c&team_id=blue
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "deliveries": [
    {
      "id": "del-abc123",
      "inject_id": "inject-001",
      "team_id": "blue",
      "status": "delivered",
      "delivered_at": "2024-01-15T14:00:00Z"
    },
    {
      "id": "del-xyz789",
      "inject_id": "inject-002",
      "team_id": "blue",
      "status": "failed",
      "error": "MQTT connection lost",
      "retry_count": 1
    }
  ]
}
```

## Monitoring API

### Get System Health
Check overall system health.

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "services": {
    "database": "connected",
    "redis": "connected",
    "mqtt": "connected",
    "storage": "available"
  },
  "timestamp": "2024-01-15T14:30:00Z"
}
```

### Get Exercise Metrics
Get real-time metrics for a running exercise.

```http
GET /monitoring/exercises/{exercise_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "metrics": {
    "exercise_id": "ex-7f3a8b9c",
    "status": "running",
    "elapsed_seconds": 1230,
    "progress_percentage": 45.5,
    "teams_connected": 4,
    "injects_scheduled": 60,
    "injects_delivered": 48,
    "injects_failed": 2,
    "average_delivery_latency_ms": 125,
    "mqtt_messages_sent": 480,
    "resource_usage": {
      "cpu_percent": 15.5,
      "memory_mb": 2048,
      "disk_mb": 500
    }
  }
}
```

### Get Platform Statistics
Get overall platform usage statistics.

```http
GET /monitoring/statistics
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "statistics": {
    "total_exercises": 150,
    "active_exercises": 2,
    "total_teams_deployed": 600,
    "total_injects_delivered": 9000,
    "average_exercise_duration_minutes": 52,
    "platform_uptime_hours": 720,
    "peak_concurrent_exercises": 5,
    "storage_used_gb": 12.5
  }
}
```

## Media API

### Upload Media File
Upload media for use in injects.

```http
POST /media/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

file: [binary data]
type: image
exercise_id: ex-7f3a8b9c
```

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "media-abc123",
    "filename": "alert.jpg",
    "type": "image",
    "size_bytes": 245678,
    "path": "/media/exercises/ex-7f3a8b9c/images/alert.jpg",
    "url": "http://localhost:8000/media/exercises/ex-7f3a8b9c/images/alert.jpg",
    "uploaded_at": "2024-01-15T10:00:00Z"
  }
}
```

### List Media Files
Get list of uploaded media files.

```http
GET /media?exercise_id=ex-7f3a8b9c&type=image
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "media": [
    {
      "id": "media-abc123",
      "filename": "alert.jpg",
      "type": "image",
      "size_bytes": 245678,
      "path": "/media/exercises/ex-7f3a8b9c/images/alert.jpg"
    }
  ],
  "total": 25
}
```

### Delete Media File
Delete an uploaded media file.

```http
DELETE /media/{media_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Media file deleted"
}
```

## Scenarios API

### List Scenarios
Get available exercise scenarios.

```http
GET /scenarios
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "scenarios": [
    {
      "id": "cyber-crisis-001",
      "name": "Cyber Crisis Response",
      "description": "Multi-team cyber crisis scenario",
      "duration_minutes": 60,
      "max_teams": 10,
      "difficulty": "intermediate",
      "tags": ["cyber", "crisis", "multi-team"]
    }
  ],
  "total": 5
}
```

### Get Scenario Details
Get detailed scenario information.

```http
GET /scenarios/{scenario_id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "scenario": {
    "id": "cyber-crisis-001",
    "name": "Cyber Crisis Response",
    "description": "Multi-team cyber crisis scenario",
    "duration_minutes": 60,
    "max_teams": 10,
    "difficulty": "intermediate",
    "objectives": [
      "Coordinate multi-team response",
      "Manage information flow",
      "Make critical decisions under pressure"
    ],
    "available_timelines": [
      "blue-standard",
      "red-aggressive",
      "custom-timeline-001"
    ]
  }
}
```

## WebSocket Events

The platform uses WebSocket connections for real-time updates.

### Connection
```javascript
const socket = new WebSocket('ws://localhost:9001');

socket.onopen = () => {
  // Subscribe to exercise updates
  socket.send(JSON.stringify({
    action: 'subscribe',
    exercise_id: 'ex-7f3a8b9c'
  }));
};
```

### Event Types

#### Timer Update
```json
{
  "event": "timer_update",
  "exercise_id": "ex-7f3a8b9c",
  "data": {
    "current": 1230,
    "total": 2700,
    "formatted": "T+20:30"
  }
}
```

#### Inject Delivered
```json
{
  "event": "inject_delivered",
  "exercise_id": "ex-7f3a8b9c",
  "data": {
    "team_id": "blue",
    "inject_id": "inject-005",
    "type": "news",
    "delivered_at": "2024-01-15T14:20:30Z"
  }
}
```

#### Team Status Change
```json
{
  "event": "team_status",
  "exercise_id": "ex-7f3a8b9c",
  "data": {
    "team_id": "blue",
    "mqtt_connected": false,
    "reason": "Connection timeout"
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "EXERCISE_NOT_FOUND",
    "message": "Exercise with ID ex-7f3a8b9c not found",
    "details": {
      "exercise_id": "ex-7f3a8b9c"
    }
  },
  "timestamp": "2024-01-15T14:30:00Z"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate ID) |
| `EXERCISE_RUNNING` | 409 | Cannot modify running exercise |
| `MQTT_ERROR` | 500 | MQTT broker connection error |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 10 requests per minute
- **Exercise control endpoints**: 30 requests per minute
- **Monitoring endpoints**: 60 requests per minute
- **General endpoints**: 100 requests per minute

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

## Pagination

List endpoints support pagination:

```http
GET /exercises?limit=20&offset=40
```

Paginated responses include:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 40,
    "has_more": true
  }
}
```

## Versioning

The API uses URL versioning:
- Current version: `/api/v1`
- Deprecated endpoints include `Deprecation` header
- Breaking changes require new version
