# Timeline Format Specification

## Overview

Timelines are JSON files that define the sequence of injects delivered to teams during an exercise. Each timeline contains metadata and an array of inject objects with precise timing and content.

## Timeline Structure

### Complete Timeline Example

```json
{
  "id": "blue-standard",
  "name": "Blue Team Standard Timeline",
  "description": "Standard inject sequence for blue team scenarios",
  "version": "1.0.0",
  "duration_minutes": 45,
  "total_injects": 15,
  "created_at": "2024-01-15T08:00:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "tags": ["standard", "blue-team", "cyber"],
  "difficulty": "intermediate",
  "injects": [
    {
      "id": "inject-001",
      "time": 0,
      "type": "news",
      "priority": "high",
      "content": {
        "headline": "Exercise Briefing: Cyber Crisis Scenario",
        "body": "Teams have been activated to respond to an emerging cyber crisis affecting critical infrastructure. Monitor all channels for updates.",
        "source": "Command Center",
        "timestamp": "LIVE",
        "image": "/media/exercises/ex-001/images/briefing.jpg"
      }
    },
    {
      "id": "inject-002",
      "time": 60,
      "type": "social",
      "priority": "medium",
      "content": {
        "platform": "twitter",
        "username": "@BreakingTech",
        "verified": true,
        "text": "🚨 BREAKING: Major banks reporting widespread service outages. Customers unable to access online banking across the country. Developing...",
        "timestamp_display": "2 min ago",
        "engagement": {
          "likes": 5234,
          "retweets": 1823,
          "replies": 445
        },
        "image": "/media/exercises/ex-001/images/bank-outage.jpg"
      }
    },
    {
      "id": "inject-003",
      "time": 120,
      "type": "email",
      "priority": "urgent",
      "content": {
        "from": "operations.director@defence.gov.au",
        "to": "blue.team@exercise.local",
        "cc": ["command@exercise.local"],
        "subject": "URGENT: Immediate Response Required",
        "body": "Team,\n\nThe situation has escalated beyond initial assessments. Intelligence suggests coordinated attack on financial sector.\n\nImplement Protocol 7 immediately:\n1. Activate all response teams\n2. Establish secure communications\n3. Begin threat assessment\n4. Report status every 15 minutes\n\nAll leave is cancelled effective immediately.\n\nDirector of Operations",
        "classification": "OFFICIAL: SENSITIVE",
        "attachments": [
          {
            "name": "protocol-7.pdf",
            "size": "2.3MB",
            "path": "/media/exercises/ex-001/documents/protocol-7.pdf"
          }
        ]
      }
    },
    {
      "id": "inject-004",
      "time": 300,
      "type": "sms",
      "priority": "high",
      "content": {
        "from": "+61 400 123 456",
        "sender_name": "OPS CONTROL",
        "text": "CODE RED ACTIVATED. All teams report status immediately. This is not a drill. Reply ACKNOWLEDGED when received.",
        "timestamp_display": "Now"
      }
    },
    {
      "id": "inject-005",
      "time": 600,
      "type": "news",
      "priority": "medium",
      "content": {
        "headline": "International Response to Cyber Crisis",
        "body": "Allied nations have offered support as the cyber crisis deepens. The Five Eyes intelligence alliance has activated emergency protocols...",
        "source": "Reuters",
        "timestamp": "10:45 AM",
        "video": "/media/exercises/ex-001/videos/news-report.mp4",
        "video_duration": "2:35",
        "thumbnail": "/media/exercises/ex-001/images/video-thumb.jpg"
      }
    },
    {
      "id": "inject-006",
      "time": 900,
      "type": "intel",
      "priority": "high",
      "content": {
        "classification": "SECRET",
        "report_id": "INT-2024-0142",
        "title": "Threat Actor Attribution Report",
        "summary": "Advanced persistent threat group APT-29 identified as primary actor. Attribution confidence: HIGH. Tactics, Techniques, and Procedures (TTPs) consistent with previous operations.",
        "document": "/media/exercises/ex-001/documents/intel-report.pdf",
        "pages": 12,
        "distribution": "BLUE TEAM ONLY",
        "handling": "EYES ONLY"
      }
    }
  ]
}
```

## Field Specifications

### Timeline Metadata

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the timeline |
| `name` | string | Yes | Human-readable name |
| `description` | string | No | Detailed description of the timeline |
| `version` | string | Yes | Semantic version (e.g., "1.0.0") |
| `duration_minutes` | number | Yes | Total duration in minutes |
| `total_injects` | number | Yes | Count of injects in the timeline |
| `created_at` | ISO 8601 | Yes | Creation timestamp |
| `updated_at` | ISO 8601 | Yes | Last modification timestamp |
| `tags` | string[] | No | Tags for categorization |
| `difficulty` | string | No | "beginner", "intermediate", "advanced" |

### Inject Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique inject identifier |
| `time` | number | Yes | Trigger time in seconds from start (T+) |
| `type` | string | Yes | Inject type (see Types section) |
| `priority` | string | No | "low", "medium", "high", "urgent" |
| `content` | object | Yes | Type-specific content object |

## Inject Types

### 1. News Inject (`type: "news"`)

```json
{
  "type": "news",
  "content": {
    "headline": "string",           // Required: News headline
    "body": "string",              // Required: Article body text
    "source": "string",            // Required: News source (e.g., "Reuters")
    "timestamp": "string",         // Optional: Display timestamp
    "author": "string",            // Optional: Author name
    "location": "string",          // Optional: Dateline location
    "image": "string",             // Optional: Path to image
    "video": "string",             // Optional: Path to video
    "video_duration": "string",    // Optional: Video duration (e.g., "2:35")
    "thumbnail": "string",         // Optional: Video thumbnail path
    "breaking": boolean            // Optional: Breaking news indicator
  }
}
```

### 2. Social Media Inject (`type: "social"`)

```json
{
  "type": "social",
  "content": {
    "platform": "string",          // Required: "twitter", "facebook", "instagram"
    "username": "string",          // Required: Account username
    "display_name": "string",      // Optional: Display name
    "verified": boolean,           // Optional: Verification badge
    "text": "string",             // Required: Post content
    "hashtags": ["string"],       // Optional: Hashtags
    "mentions": ["string"],       // Optional: Mentioned accounts
    "timestamp_display": "string", // Optional: "2 min ago", "1 hour ago"
    "engagement": {
      "likes": number,            // Optional: Like count
      "retweets": number,         // Optional: Retweet/share count
      "replies": number,          // Optional: Reply count
      "views": number             // Optional: View count
    },
    "image": "string",            // Optional: Path to image
    "images": ["string"],         // Optional: Multiple images
    "quoted_tweet": object,       // Optional: Quoted post
    "thread_position": number     // Optional: Position in thread
  }
}
```

### 3. Email Inject (`type: "email"`)

```json
{
  "type": "email",
  "content": {
    "from": "string",             // Required: Sender email
    "from_name": "string",        // Optional: Sender display name
    "to": "string|array",         // Required: Recipient(s)
    "cc": ["string"],            // Optional: CC recipients
    "bcc": ["string"],           // Optional: BCC recipients
    "subject": "string",          // Required: Email subject
    "body": "string",            // Required: Email body (plain text or HTML)
    "body_html": "string",       // Optional: HTML version of body
    "priority": "string",         // Optional: "low", "normal", "high"
    "classification": "string",   // Optional: Security classification
    "timestamp": "string",        // Optional: Send timestamp
    "read": boolean,             // Optional: Read status
    "attachments": [
      {
        "name": "string",        // Attachment filename
        "size": "string",        // File size
        "type": "string",        // MIME type
        "path": "string"         // File path
      }
    ],
    "signature": "string"        // Optional: Email signature
  }
}
```

### 4. SMS Inject (`type: "sms"`)

```json
{
  "type": "sms",
  "content": {
    "from": "string",            // Required: Sender number
    "sender_name": "string",     // Optional: Sender display name
    "text": "string",           // Required: Message text
    "timestamp_display": "string", // Optional: Display time
    "read": boolean,            // Optional: Read status
    "urgent": boolean           // Optional: Urgent indicator
  }
}
```

### 5. Intelligence Report (`type: "intel"`)

```json
{
  "type": "intel",
  "content": {
    "classification": "string",   // Required: Classification level
    "report_id": "string",        // Required: Report identifier
    "title": "string",           // Required: Report title
    "summary": "string",         // Optional: Executive summary
    "document": "string",        // Required: Path to document
    "pages": number,            // Optional: Page count
    "distribution": "string",    // Optional: Distribution list
    "handling": "string",       // Optional: Handling instructions
    "author": "string",         // Optional: Author/agency
    "date": "string",          // Optional: Report date
    "confidence": "string"     // Optional: "low", "medium", "high"
  }
}
```

### 6. Video Inject (`type: "video"`)

```json
{
  "type": "video",
  "content": {
    "title": "string",          // Required: Video title
    "description": "string",    // Optional: Description
    "path": "string",          // Required: Path to video file
    "duration": "string",      // Optional: Duration (e.g., "5:23")
    "thumbnail": "string",     // Optional: Thumbnail path
    "source": "string",       // Optional: Video source
    "autoplay": boolean       // Optional: Autoplay on load
  }
}
```

### 7. Document Inject (`type: "document"`)

```json
{
  "type": "document",
  "content": {
    "title": "string",         // Required: Document title
    "description": "string",   // Optional: Description
    "path": "string",         // Required: Path to document
    "type": "string",        // Optional: "pdf", "docx", "txt"
    "pages": number,         // Optional: Page count
    "classification": "string", // Optional: Classification
    "download": boolean      // Optional: Allow download
  }
}
```

## Media File References

### Path Structure
All media paths are relative to the exercise media directory:
```
/media/exercises/{exercise-id}/
├── images/
├── videos/
├── documents/
└── audio/
```

### Supported Formats
- **Images**: jpg, jpeg, png, gif, svg, webp
- **Videos**: mp4, webm, avi, mov
- **Documents**: pdf, docx, doc, txt, rtf
- **Audio**: mp3, wav, ogg

### Path Examples
```json
{
  "image": "/media/exercises/ex-001/images/alert.jpg",
  "video": "/media/exercises/ex-001/videos/briefing.mp4",
  "document": "/media/exercises/ex-001/documents/report.pdf"
}
```

## Timeline Validation

### Required Validation Rules

1. **Unique IDs**: All inject IDs must be unique within a timeline
2. **Time Ordering**: Injects should be ordered by time (ascending)
3. **Time Range**: All inject times must be within timeline duration
4. **Required Fields**: All required fields must be present
5. **File Existence**: Referenced media files must exist
6. **Valid Types**: Inject types must be from allowed set

### Validation Schema (JSON Schema)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "version", "duration_minutes", "injects"],
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$"
    },
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "duration_minutes": {
      "type": "number",
      "minimum": 1,
      "maximum": 480
    },
    "injects": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "time", "type", "content"],
        "properties": {
          "id": {
            "type": "string"
          },
          "time": {
            "type": "number",
            "minimum": 0
          },
          "type": {
            "type": "string",
            "enum": ["news", "social", "email", "sms", "intel", "video", "document"]
          },
          "priority": {
            "type": "string",
            "enum": ["low", "medium", "high", "urgent"]
          },
          "content": {
            "type": "object"
          }
        }
      }
    }
  }
}
```

## Timeline Operations

### Loading a Timeline
```python
import json

def load_timeline(timeline_id: str, exercise_id: str) -> dict:
    """Load timeline from JSON file"""
    timeline_path = f"/media/exercises/{exercise_id}/timelines/{timeline_id}.json"
    
    with open(timeline_path, 'r') as f:
        timeline = json.load(f)
    
    # Validate timeline
    validate_timeline(timeline)
    
    return timeline
```

### Saving a Timeline
```python
def save_timeline(timeline: dict, exercise_id: str) -> str:
    """Save timeline to JSON file"""
    timeline_id = timeline['id']
    timeline_path = f"/media/exercises/{exercise_id}/timelines/{timeline_id}.json"
    
    # Update metadata
    timeline['updated_at'] = datetime.utcnow().isoformat()
    timeline['total_injects'] = len(timeline['injects'])
    
    # Sort injects by time
    timeline['injects'].sort(key=lambda x: x['time'])
    
    # Save to file
    with open(timeline_path, 'w') as f:
        json.dump(timeline, f, indent=2)
    
    return timeline_path
```

### Duplicating a Timeline
```python
def duplicate_timeline(source_id: str, new_id: str, new_name: str) -> dict:
    """Create a copy of an existing timeline"""
    source = load_timeline(source_id)
    
    # Create new timeline
    new_timeline = source.copy()
    new_timeline['id'] = new_id
    new_timeline['name'] = new_name
    new_timeline['created_at'] = datetime.utcnow().isoformat()
    new_timeline['updated_at'] = datetime.utcnow().isoformat()
    
    # Generate new inject IDs
    for i, inject in enumerate(new_timeline['injects']):
        inject['id'] = f"{new_id}-inject-{i:03d}"
    
    return new_timeline
```

## Import/Export

### Exporting Timeline
```python
def export_timeline(timeline_id: str) -> str:
    """Export timeline for sharing"""
    timeline = load_timeline(timeline_id)
    
    # Remove internal metadata
    export_data = {
        'version': '2.0',
        'exported_at': datetime.utcnow().isoformat(),
        'timeline': timeline
    }
    
    return json.dumps(export_data, indent=2)
```

### Importing Timeline
```python
def import_timeline(import_data: str, exercise_id: str) -> dict:
    """Import timeline from external source"""
    data = json.loads(import_data)
    
    # Validate version compatibility
    if not is_compatible_version(data['version']):
        raise ValueError(f"Incompatible version: {data['version']}")
    
    timeline = data['timeline']
    
    # Update paths for local environment
    update_media_paths(timeline, exercise_id)
    
    # Save to local system
    save_timeline(timeline, exercise_id)
    
    return timeline
```

## Best Practices

1. **Timing**: Space injects appropriately to avoid overwhelming teams
2. **Variety**: Mix different inject types for realism
3. **Escalation**: Gradually increase complexity and urgency
4. **Relevance**: Ensure content is relevant to exercise objectives
5. **Media**: Pre-validate all media files exist before exercise
6. **Testing**: Test timelines in dry-run mode before live exercises
