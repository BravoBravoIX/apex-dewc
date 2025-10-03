# SCIP v2 - Scenario Management Models
## Flexible Scenario Control & Customization Options

---

## Overview

The SCIP v2 platform supports multiple scenario management models, giving clients different levels of control based on their subscription tier, expertise, and requirements. This flexibility allows CyberOps to serve everyone from hands-off clients who want turnkey solutions to advanced users who want complete authoring control.

---

## Model 1: Full Service (CyberOps Managed)
**Client Type:** Government agencies, time-constrained organizations  
**Client Role:** Consumer only  
**CyberOps Role:** Complete scenario creation and management  
**Example Client:** Australian Defence Force

### How It Works

**CyberOps Creates Everything:**
```
1. Scenario structure and timeline
2. All trigger content and timing
3. Team configurations
4. Media assets
5. Decision points
6. Monitoring dashboards
```

**Client Simply:**
```
1. Logs into their portal
2. Selects from available scenarios
3. Assigns participants to teams
4. Clicks "Launch"
5. Monitors execution
6. Downloads reports
```

### Example: Defence Force Readiness Training
```yaml
Scenario: "Operation Southern Shield"
Created by: CyberOps
Customization Level: None

Timeline (Locked):
  T+00: Mission briefing (all teams)
  T+05: Intelligence report (Team Alpha only)
  T+10: Radar contact (Team Bravo only)
  T+15: Media leak (all teams)
  T+20: Decision point (all teams)
  # ... continues for 60 minutes

Client Can:
  - View scenario details
  - Launch exercise
  - Monitor progress
  - Generate reports

Client Cannot:
  - Modify timeline
  - Change content
  - Adjust timing
  - Add triggers
```

---

## Model 2: Guided Customization (Template-Based)
**Client Type:** Training organizations with some expertise  
**Client Role:** Configurator  
**CyberOps Role:** Provides framework, client fills in details  
**Example Client:** DEWC with partial control

### How It Works

**CyberOps Provides:**
```
1. Scenario framework with placeholder slots
2. Suggested timeline with adjustable windows
3. Content templates and examples
4. Asset library access
5. Monitoring tools
```

**DEWC Configures:**
```
1. Uploads their own media assets
2. Adjusts trigger timing within ranges
3. Assigns content to specific teams
4. Customizes decision points
5. Sets difficulty level
```

### Example: DEWC Indo-Pacific Crisis (Configurable)

#### CyberOps Provides Framework:
```yaml
Scenario Framework: "Indo-Pacific Crisis Template"
Duration: 45-90 minutes (adjustable)
Teams: 2-6 (configurable)

Trigger Slots:
  - Opening Event (T+0 to T+5)
    Type: News Article
    Teams: Configurable
    Content: [DEWC uploads their own]
    
  - Early Escalation (T+5 to T+15)
    Type: Social Media
    Teams: Configurable
    Content: [DEWC creates posts]
    Timing: [DEWC sets exact time]
    
  - First Decision (T+10 to T+20)
    Type: Decision Point
    Options: [DEWC customizes choices]
    Timing: [DEWC determines when]
    
  - Information Injection (T+15 to T+30)
    Type: Document/Video/News
    Content: [DEWC uploads]
    Distribution: [DEWC assigns to teams]
```

#### DEWC Configuration Interface:
```javascript
// DEWC's Scenario Configuration Screen
{
  "scenario_id": "indo_pacific_template",
  "exercise_name": "November Training Exercise",
  "duration": 60,  // DEWC chose 60 minutes
  "teams": [
    {
      "id": "alpha",
      "name": "Naval Operations",  // DEWC named
      "size": 4
    },
    {
      "id": "bravo", 
      "name": "Intelligence Cell",  // DEWC named
      "size": 3
    },
    {
      "id": "charlie",
      "name": "Media Relations",  // DEWC named
      "size": 2
    }
  ],
  "triggers": [
    {
      "slot": "opening_event",
      "time": 2,  // DEWC set to T+2
      "content": {
        "title": "Chinese Naval Exercises Begin",  // DEWC wrote
        "body": "[DEWC's custom article text]",
        "image": "uploads/dewc/south_china_sea.jpg"  // DEWC uploaded
      },
      "teams": ["alpha", "bravo"]  // DEWC chose who sees it
    },
    {
      "slot": "early_escalation",
      "time": 8,  // DEWC set to T+8
      "content": {
        "platform": "twitter",
        "author": "@AusDefence",  // DEWC created
        "message": "Monitoring situation closely...",  // DEWC wrote
        "engagement": {"likes": 1520, "retweets": 847}
      },
      "teams": ["all"]  // DEWC chose all teams
    },
    {
      "slot": "first_decision",
      "time": 15,  // DEWC set to T+15
      "decision": {
        "prompt": "Humanitarian convoy approaching contested waters",  // DEWC wrote
        "options": [
          "Continue as planned",  // DEWC's options
          "Await diplomatic clearance",
          "Divert through Indonesian waters",
          "Return to Darwin"
        ],
        "timeout": 300  // 5 minute timer
      },
      "teams": ["all"]
    }
  ]
}
```

---

## Model 3: Full Authoring (Builder Access)
**Client Type:** Advanced training organizations  
**Client Role:** Full scenario author  
**CyberOps Role:** Platform and tools only  
**Example Client:** DEWC with full Builder subscription

### How It Works

**DEWC Has Complete Control:**
```
1. Creates scenarios from scratch
2. Builds complete timelines
3. Uploads all content
4. Sets all trigger timings
5. Configures team-specific views
6. Manages asset library
```

### DEWC's Scenario Builder Interface

#### Visual Timeline Editor:
```
┌────────────────────────────────────────────────────────┐
│ DEWC Scenario Builder - "Cyber Response Training"      │
├────────────────────────────────────────────────────────┤
│ Timeline                                               │
│ ├─T+00───T+10───T+20───T+30───T+40───T+50───T+60─┤   │
│                                                         │
│ Team Alpha  [📰][🐦]    [📧]    [📹] [📄]    [⚡]     │
│ Team Bravo     [📰] [🐦]    [📧]    [📹]    [⚡]     │
│ Team Charlie   [📰]    [🐦][📧] [📹]    [📄] [⚡]     │
│ Team Delta  [📰]    [🐦]    [📧][📹] [📄]    [⚡]     │
│                                                         │
│ [Add Trigger] [Preview] [Validate] [Save] [Publish]    │
└────────────────────────────────────────────────────────┘

Add New Trigger:
┌─────────────────────────────────────┐
│ Trigger Configuration               │
├─────────────────────────────────────┤
│ Time: [T+25] minutes                │
│ Type: [Social Media Post ▼]         │
│ Teams: ☑ Alpha ☑ Bravo ☐ Charlie   │
│                                     │
│ Content:                            │
│ Platform: [Twitter ▼]               │
│ Author: [@CyberSecurity]           │
│ Verified: ☑                        │
│ Message: [                         │
│   BREAKING: Major data breach      │
│   affecting Australian banks...    │
│ ]                                   │
│ Attachment: [Upload Image]          │
│                                     │
│ Engagement Metrics:                 │
│ Likes: [5234]                      │
│ Retweets: [1823]                   │
│ Replies: [445]                     │
│                                     │
│ [Save Trigger] [Cancel]            │
└─────────────────────────────────────┘
```

#### DEWC's Complete Control:
```javascript
// DEWC creates entire scenario from scratch
const dewcScenario = {
  "name": "Banking Sector Cyber Crisis",
  "created_by": "DEWC Training Team",
  "duration": 75,
  "teams": 4,
  "triggers": [
    {
      "id": "dewc_001",
      "time": 0,
      "type": "briefing",
      "content": {/* DEWC's content */},
      "teams": ["all"]
    },
    {
      "id": "dewc_002", 
      "time": 3,
      "type": "news",
      "content": {
        "source": "ABC News Australia",
        "headline": "Unusual network activity detected at major banks",
        "article": "DEWC's full article text...",
        "image": "dewc/uploads/bank_headquarters.jpg"
      },
      "teams": ["alpha", "charlie"]
    },
    {
      "id": "dewc_003",
      "time": 7,
      "type": "social_media",
      "content": {
        "platform": "twitter",
        "posts": [
          {
            "author": "@concernedcitizen",
            "message": "Can't access my online banking!",
            "timestamp": "relative",
            "engagement": {"likes": 234, "retweets": 89}
          },
          {
            "author": "@techexpert",
            "message": "Seeing similar patterns to 2017 attack",
            "timestamp": "relative", 
            "engagement": {"likes": 1822, "retweets": 567}
          }
        ]
      },
      "teams": ["bravo", "delta"]
    },
    // ... DEWC continues building entire timeline
  ]
}
```

---

## Model 4: Hybrid Collaborative
**Client Type:** Organizations wanting CyberOps expertise with customization  
**Client Role:** Co-creator  
**CyberOps Role:** Partner in development  
**Example Client:** Northrop Grumman

### How It Works

**Collaborative Development:**
```
1. CyberOps provides domain expertise (space operations)
2. Northrop provides proprietary content (satellite data)
3. Joint timeline development
4. Shared asset creation
5. CyberOps handles technical execution
6. Northrop controls sensitive content
```

### Example Workflow:

**Initial Planning Meeting:**
```
CyberOps: "We'll create the GPS jamming detection triggers"
Northrop: "We'll provide actual telemetry data patterns"
CyberOps: "We'll build the decision tree logic"
Northrop: "We'll define the correct response procedures"
```

**Shared Development:**
```yaml
Timeline Development:
  T+00-20: CyberOps creates opening scenario
    - Generic space weather reports
    - Initial anomaly detection
    - Standard news feeds
    
  T+20-40: Northrop adds proprietary elements
    - Actual satellite telemetry patterns
    - Company-specific procedures
    - Internal communication templates
    
  T+40-60: Joint decision points
    - CyberOps provides framework
    - Northrop defines correct answers
    - Shared scoring rubric
```

---

## Subscription Tier Capabilities

### Consumer Tier ($2,500/month)
```
Scenario Control:
- Launch pre-built scenarios ✓
- Basic participant management ✓
- View reports ✓
- Modify content ✗
- Adjust timing ✗
- Create scenarios ✗
```

### Builder Tier ($8,500/month) - DEWC
```
Scenario Control:
- Launch pre-built scenarios ✓
- Full participant management ✓
- Advanced reports ✓
- Modify content ✓
- Adjust timing ✓
- Create scenarios ✓
- Upload custom assets ✓
- Configure team views ✓
- Timeline editor access ✓
```

### Enterprise Tier ($25,000/month)
```
Everything in Builder plus:
- Unlimited scenarios ✓
- API access ✓
- Custom integrations ✓
- White-label options ✓
- Priority support ✓
- Custom development ✓
```

---

## Technical Implementation

### Database Schema for Flexible Control

```sql
-- Scenarios table with ownership and permissions
CREATE TABLE scenarios (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    organization_id UUID REFERENCES organizations(id),
    created_by UUID REFERENCES users(id),
    template_id UUID REFERENCES scenario_templates(id),
    
    -- Control levels
    content_locked BOOLEAN DEFAULT false,  -- Can client modify content?
    timing_locked BOOLEAN DEFAULT false,   -- Can client adjust timing?
    teams_locked BOOLEAN DEFAULT false,    -- Can client configure teams?
    
    -- Configuration
    config JSONB NOT NULL,  -- Full scenario configuration
    triggers JSONB,         -- Array of triggers (may be empty initially)
    
    -- Permissions
    allow_client_upload BOOLEAN DEFAULT false,
    allow_timing_adjustment BOOLEAN DEFAULT false,
    allow_team_configuration BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Scenario templates (CyberOps managed)
CREATE TABLE scenario_templates (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    category VARCHAR(100),
    framework JSONB,  -- Slots and ranges for customization
    default_triggers JSONB,  -- Pre-built triggers
    customization_level ENUM('none', 'guided', 'full'),
    min_duration INTEGER,
    max_duration INTEGER,
    min_teams INTEGER,
    max_teams INTEGER
);

-- Client customizations
CREATE TABLE scenario_customizations (
    id UUID PRIMARY KEY,
    scenario_id UUID REFERENCES scenarios(id),
    organization_id UUID REFERENCES organizations(id),
    customized_triggers JSONB,  -- Client's trigger modifications
    uploaded_assets JSONB,       -- References to client uploads
    team_configurations JSONB,   -- Client's team setup
    saved_at TIMESTAMP,
    published BOOLEAN DEFAULT false
);
```

### API Endpoints for Different Models

```python
# Model 1: Full Service (Read-only for clients)
@router.get("/api/v1/client/scenarios")
async def list_available_scenarios(org_id: str):
    # Return only completed, locked scenarios
    return db.query(Scenario).filter(
        Scenario.organization_id == org_id,
        Scenario.content_locked == True,
        Scenario.timing_locked == True
    ).all()

# Model 2: Guided Customization
@router.post("/api/v1/client/scenarios/{id}/customize")
async def customize_scenario(
    scenario_id: str,
    customization: ScenarioCustomization,
    current_user: User
):
    scenario = get_scenario(scenario_id)
    
    # Validate customizations against template rules
    template = get_template(scenario.template_id)
    
    # Check timing is within allowed ranges
    for trigger in customization.triggers:
        slot = template.get_slot(trigger.slot_id)
        if trigger.time < slot.min_time or trigger.time > slot.max_time:
            raise ValueError(f"Timing outside allowed range")
    
    # Save client customizations
    save_customization(scenario_id, customization)

# Model 3: Full Authoring
@router.post("/api/v1/client/scenarios/create")
async def create_scenario(
    scenario: ScenarioCreate,
    current_user: User
):
    # Check if user has Builder or Enterprise tier
    if current_user.organization.subscription_tier not in ['builder', 'enterprise']:
        raise PermissionError("Full authoring requires Builder subscription")
    
    # Create completely custom scenario
    new_scenario = Scenario(
        name=scenario.name,
        organization_id=current_user.organization_id,
        created_by=current_user.id,
        content_locked=False,  # Client has full control
        timing_locked=False,
        teams_locked=False,
        config=scenario.config,
        triggers=scenario.triggers
    )
    
    return save_scenario(new_scenario)
```

---

## Benefits of Flexible Models

### For CyberOps
1. **Broader Market Appeal**: Can serve clients with varying expertise levels
2. **Scalable Revenue**: Different price points for different service levels  
3. **Reduced Support Burden**: Advanced clients self-serve
4. **IP Protection**: Can lock valuable content while allowing customization
5. **Upsell Opportunities**: Clients can graduate from Consumer to Builder

### For Clients
1. **Right-Sized Solution**: Pay for only the control they need
2. **Learning Curve**: Can start simple and grow into advanced features
3. **Expertise Leverage**: Use CyberOps expertise where needed
4. **Cost Control**: Full service for critical scenarios, self-build for routine
5. **Flexibility**: Different models for different scenarios

### For End Users
1. **Consistency**: Same interface regardless of who built scenario
2. **Quality**: CyberOps QA on templates ensures minimum quality
3. **Relevance**: Client customization makes content more applicable
4. **Variety**: Mix of CyberOps and client content keeps training fresh

---

This flexible approach allows DEWC to have exactly the level of control they want - from hands-off launching of pre-built scenarios to complete authoring control where they upload all assets and set all timings themselves.