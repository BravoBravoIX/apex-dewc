# SCIP v2 Platform - Detailed Use Cases
## Real-World Implementation Scenarios

---

## Use Case 1: DEWC Indo-Pacific Humanitarian Crisis Training

### Background
**Client:** Defence Enterprise Wales Centre (DEWC)  
**Scenario:** Indo-Pacific Humanitarian Crisis  
**Teams:** 4 Blue Teams (Alpha, Bravo, Charlie, Delta)  
**Duration:** 60 minutes  
**Objective:** Train defense personnel in information warfare response during humanitarian operations

### Phase 1: CyberOps Admin Setup

**Actor:** CyberOps Administrator  
**System:** SCIP Control

#### Step 1.1: Create DEWC Organization
```
1. Login to SCIP Control (http://localhost:3000)
2. Navigate to Organizations → New Organization
3. Enter organization details:
   - Name: Defence Enterprise Wales Centre
   - Identifier: dewc
   - Subscription Tier: Builder ($8,500/month)
   - Contact: admin@dewc.mil
4. Upload branding assets:
   - Primary Logo: dewc-logo.svg
   - Colors: Navy Blue (#003366), Gold (#FFD700)
   - Secondary Logo: cyberops-logo.svg (co-branding)
```

#### Step 1.2: Create Scenario Template
```
1. Navigate to Scenarios → Create New
2. Configure scenario:
   - Name: Indo-Pacific Humanitarian Crisis
   - Code: INDO_PAC_2024
   - Duration: 60 minutes
   - Teams Supported: 2-6 teams
   - Difficulty: Intermediate
3. Define trigger timeline:
   
   T+00: Scenario Start - Mission Brief
   T+02: NEWS - "Naval Blockade at Spratly Islands"
   T+05: SOCIAL - "Civilians evacuating Darwin port"
   T+08: DOCUMENT - "Leaked Operations Plan"
   T+12: VIDEO - "CNN Breaking News Report"
   T+15: DECISION - "Route Selection for Aid Convoy"
   T+20: NEWS - "Indonesian Navy Denies Access"
   T+25: SOCIAL - "Viral misinformation campaign"
   T+30: EMAIL - "Embassy Security Alert"
   T+35: DECISION - "Escalation Response"
   T+40: VIDEO - "Red Team Propaganda"
   T+45: DOCUMENT - "Intelligence Assessment"
   T+50: NEWS - "Diplomatic Breakthrough"
   T+55: DECISION - "Final Mission Choice"
   T+60: Scenario End
```

#### Step 1.3: Configure Assets
```
1. Upload media assets:
   - Images: satellite photos, protest images, ship photos
   - Videos: news broadcasts, social media clips
   - Documents: PDF reports, classified briefs
2. Assign to scenario triggers
3. Set team visibility (which teams see which content)
```

#### Step 1.4: Assign to DEWC
```
1. Navigate to Scenarios → INDO_PAC_2024
2. Click "Assign to Organization"
3. Select DEWC
4. Set permissions:
   - Can configure: Yes
   - Can modify content: Yes
   - Can launch: Yes
   - Can view analytics: Yes
```

---

### Phase 2: DEWC Admin Configuration

**Actor:** DEWC Training Coordinator  
**System:** Client Dashboard

#### Step 2.1: Login to DEWC Portal
```
1. Access branded portal (http://training.dewc.mil)
2. Login with DEWC credentials
3. View dashboard showing:
   - Available Scenarios: 1
   - Scheduled Exercises: 0
   - Team Templates: 4
   - Past Exercises: 0
```

#### Step 2.2: Configure Exercise
```
1. Navigate to Scenarios → Indo-Pacific Crisis
2. Click "Configure Exercise"
3. Enter exercise details:
   - Name: "IndoPac Training - November 2024"
   - Date: November 15, 2024
   - Time: 14:00 AEST
   - Duration: 60 minutes
4. Configure teams:
   
   Team Alpha (Naval Operations):
   - Participants: 4 officers
   - Color: Navy Blue
   - Focus: Maritime operations
   
   Team Bravo (Intelligence):
   - Participants: 3 analysts
   - Color: Green
   - Focus: Information verification
   
   Team Charlie (Diplomatic):
   - Participants: 3 personnel
   - Color: Gold
   - Focus: Political implications
   
   Team Delta (Humanitarian):
   - Participants: 4 coordinators
   - Color: Red
   - Focus: Aid delivery
```

#### Step 2.3: Customize Content
```
1. Click "Content Library"
2. Upload DEWC-specific content:
   - Australian Defence Force briefing video
   - Regional intelligence reports
   - Local news footage from Darwin
   - Custom social media posts in Bahasa
3. Assign content to triggers:
   - Replace generic news with ADF-specific content
   - Add local Darwin port authority communications
   - Include Indonesian language social media
```

#### Step 2.4: Pre-Exercise Setup
```
1. Generate team access codes:
   - Team Alpha: ALFA-2024-NAVY
   - Team Bravo: BRAVO-2024-INTEL
   - Team Charlie: CHARLIE-2024-DIPLO
   - Team Delta: DELTA-2024-HUMAN
2. Send briefing emails to participants
3. Verify technical requirements
4. Schedule pre-exercise briefing (T-30 minutes)
```

---

### Phase 3: Exercise Execution

**Actor:** DEWC Training Coordinator + Team Participants  
**Systems:** Client Dashboard + Team Dashboards

#### Step 3.1: Launch Exercise
```
DEWC Coordinator Actions:
1. Navigate to Exercise Control Panel
2. Verify all teams connected:
   - Team Alpha: ✅ 4/4 participants
   - Team Bravo: ✅ 3/3 participants
   - Team Charlie: ✅ 3/3 participants
   - Team Delta: ✅ 4/4 participants
3. Click "Launch Exercise"
4. System deploys:
   - Team Alpha Dashboard → Port 3201
   - Team Bravo Dashboard → Port 3202
   - Team Charlie Dashboard → Port 3203
   - Team Delta Dashboard → Port 3204
```

#### Step 3.2: Real-Time Execution

**T+00: Exercise Starts**
```
All Teams See:
- Mission briefing appears
- Humanitarian convoy departing Darwin
- Destination: Disputed waters near Spratly Islands
```

**T+02: First Information Injection**
```
Team Alpha Sees:
- NEWS: "Chinese Naval Forces Block Humanitarian Corridor"
- Operational impact assessment needed

Team Bravo Sees:
- NEWS: "Unconfirmed Reports of Naval Blockade"
- Source verification required

Team Charlie Sees:
- NEWS: "Diplomatic Tensions Rise in South China Sea"
- Political implications analysis

Team Delta Sees:
- NEWS: "Aid Convoy Route Threatened"
- Alternative delivery options needed
```

**T+05: Social Media Explosion**
```
All Teams See Different Perspectives:
- Team Alpha: Military Twitter accounts discussing deployments
- Team Bravo: Conflicting reports from various sources
- Team Charlie: Diplomatic channels expressing concern
- Team Delta: NGO panic about aid delivery
```

**T+15: First Decision Point**
```
All Teams Must Decide:
┌─────────────────────────────────────────┐
│ ⚡ DECISION REQUIRED                    │
├─────────────────────────────────────────┤
│ Convoy Route Selection:                 │
│ ○ Continue direct route (fastest)       │
│ ○ Divert through Indonesian waters      │
│ ○ Return to Darwin for reassessment     │
│ ○ Wait for diplomatic clearance         │
│                                         │
│ Time Remaining: 4:58                    │
│ [Submit Decision]                       │
└─────────────────────────────────────────┘
```

#### Step 3.3: Monitoring & Intervention
```
DEWC Coordinator View:
┌─────────────────────────────────────────────┐
│ Exercise Monitor - Real Time                │
├─────────────────────────────────────────────┤
│ Timeline: ████████░░░░░░░░░░ T+25:43       │
│                                             │
│ Team Status:                                │
│ Alpha:  ✅ Active | Triggers: 8/15         │
│ Bravo:  ✅ Active | Triggers: 7/15         │
│ Charlie: ⚠️ Delayed | Triggers: 6/15       │
│ Delta:  ✅ Active | Triggers: 8/15         │
│                                             │
│ Decisions Captured: 1/3                    │
│ Next Event: T+30 (Embassy Alert)           │
│                                             │
│ [Pause] [Inject Message] [Skip Trigger]    │
└─────────────────────────────────────────────┘

Coordinator injects additional message to Team Charlie:
"URGENT: Ambassador requests immediate situation report"
```

---

### Phase 4: Post-Exercise Analysis

**Actor:** DEWC Training Coordinator  
**System:** Client Dashboard

#### Step 4.1: Immediate Debrief
```
1. Exercise automatically ends at T+60
2. System captures:
   - All team decisions with timestamps
   - Response times to critical events
   - Information sharing patterns
   - Team collaboration metrics
3. Generate quick summary:
   - Exercise completed successfully
   - 14/14 participants completed
   - 45/45 triggers delivered
   - 12/12 decisions captured
```

#### Step 4.2: Generate Reports
```
1. Navigate to Reports → Generate
2. Select report type:
   - Executive Summary (2 pages)
   - Detailed Team Analysis (15 pages)
   - Individual Performance (per participant)
   - Timeline Reconstruction (full event log)
3. Apply DEWC branding
4. Export as PDF with classification markings
```

---

## Use Case 2: Multi-Client, Multi-Scenario Management

### Scenario Overview
CyberOps manages multiple clients with different training needs:
1. **DEWC** - Information warfare scenarios
2. **Northrop Grumman** - Satellite operations training
3. **Royal Navy** - Maritime domain awareness

### CyberOps Admin Workflow

#### Client 1: DEWC (Existing)
```
Current Scenarios:
1. Indo-Pacific Humanitarian Crisis (Active)
2. Cyber Attack on Critical Infrastructure (In Development)
3. Election Interference Response (Planned)
```

#### Client 2: Northrop Grumman Setup
```
1. Create Organization:
   - Name: Northrop Grumman Space Systems
   - Subscription: Enterprise ($25,000/month)
   - Branding: NG logos and colors

2. Create Satellite Scenarios:
   
   Scenario A: "GPS Jamming Response"
   - Duration: 45 minutes
   - Teams: Ground Station Operators
   - Assets: Satellite telemetry, RF interference data
   - Decisions: Frequency hopping, backup systems
   
   Scenario B: "Space Debris Collision Avoidance"
   - Duration: 30 minutes
   - Teams: Mission Control, Orbital Analysts
   - Assets: Tracking data, collision predictions
   - Decisions: Maneuver planning, risk assessment

3. Configure Resources:
   - Satellite constellation simulator
   - Ground station interfaces
   - RF environment simulator
   - Orbital mechanics calculator
```

#### Client 3: Royal Navy Setup
```
1. Create Organization:
   - Name: Royal Navy Training Command
   - Subscription: Builder ($8,500/month)
   - Branding: RN insignia and colors

2. Adapt Maritime Scenarios:
   
   Scenario A: "Strait Transit Under Threat"
   - Duration: 90 minutes
   - Teams: Bridge, Combat Information Center, Intel
   - Assets: AIS data, radar feeds, threat assessments
   - Decisions: Route planning, ROE escalation
   
   Scenario B: "Humanitarian Assistance/Disaster Relief"
   - Duration: 60 minutes
   - Teams: Command, Logistics, Medical, Aviation
   - Assets: Weather data, refugee reports, supply status
   - Decisions: Resource allocation, evacuation priorities
```

### Scenario Sharing & Licensing

#### Making Scenarios Available Across Clients
```
CyberOps Admin Actions:
1. Navigate to Scenarios → Indo-Pacific Crisis
2. Click "Licensing Options"
3. Configure availability:
   
   For Northrop Grumman:
   - Available: No (not relevant to their domain)
   
   For Royal Navy:
   - Available: Yes (relevant maritime component)
   - Licensing: Additional $2,000/month
   - Customization: Allowed with restrictions
   
4. Royal Navy can now:
   - See the scenario in their catalog
   - License it for their use
   - Customize with UK-specific content
   - Cannot share with other organizations
```

### Resource Library Management

#### Shared Assets
```
Global Asset Library:
├── Generic Resources (Available to all)
│   ├── News templates
│   ├── Social media templates
│   ├── Weather data feeds
│   └── Map overlays
│
├── Domain-Specific (Licensed separately)
│   ├── Maritime (AIS, shipping data)
│   ├── Space (TLE data, orbital mechanics)
│   ├── Cyber (network diagrams, exploits)
│   └── Aviation (flight tracking, ATC comms)
│
└── Client-Specific (Private)
    ├── DEWC (Australian Defence content)
    ├── Northrop (Proprietary satellite data)
    └── Royal Navy (UK classified materials)
```

---

## Use Case 3: Concurrent Multi-Organization Training

### Scenario
**Date:** November 15, 2024  
**Time:** Multiple exercises running simultaneously

#### 14:00 - DEWC Indo-Pacific Exercise
```
- 4 teams (Alpha, Bravo, Charlie, Delta)
- 14 participants
- Ports 3201-3204 allocated
- MQTT topics: exercise/dewc_001/team_*/
- Coordinator: DEWC Training Staff
```

#### 14:30 - Northrop Grumman GPS Jamming
```
- 2 teams (Ground Control, Satellite Ops)
- 8 participants
- Ports 3205-3206 allocated
- MQTT topics: exercise/ng_001/team_*/
- Coordinator: NG Training Lead
```

#### 15:00 - Royal Navy Strait Transit
```
- 3 teams (Bridge, CIC, Intel)
- 12 participants
- Ports 3207-3209 allocated
- MQTT topics: exercise/rn_001/team_*/
- Coordinator: RN Exercise Director
```

### System Performance
```
CyberOps Monitoring Dashboard:
┌──────────────────────────────────────────┐
│ SCIP Platform Status - Real Time         │
├──────────────────────────────────────────┤
│ Active Organizations: 3                  │
│ Running Exercises: 3                     │
│ Total Participants: 34                   │
│ Active Team Dashboards: 9                │
│                                          │
│ Resource Utilization:                    │
│ CPU: ████████░░ 78%                     │
│ Memory: ██████░░░░ 62%                  │
│ Network: ████░░░░░░ 41%                 │
│ MQTT Messages/sec: 847                   │
│                                          │
│ Exercise Health:                         │
│ DEWC_001: ✅ Healthy (T+45:00)          │
│ NG_001: ✅ Healthy (T+15:00)            │
│ RN_001: ✅ Starting...                   │
└──────────────────────────────────────────┘
```

---

## Use Case 4: Concurrent Multi-Organization Training

### Scenario
**Date:** November 15, 2024  
**Time:** Multiple organizations running different exercises

#### 14:00 - DEWC Custom Banking Crisis
```
- Scenario: Banking Cyber Crisis (DEWC-created)
- 5 teams (Financial, Gov, Media, Cyber, Public)
- 20 participants
- Ports 3201-3205 allocated
- MQTT topics: exercise/dewc_bank_001/team_*/
- Coordinator: DEWC Financial Training Lead
- Control Level: Full (DEWC controls all timing/content)
```

#### 14:00 - Australian Defence Force
```
- Scenario: Operation Southern Shield (CyberOps-managed)
- 3 teams (predetermined by CyberOps)
- 12 participants
- Ports 3206-3208 allocated
- MQTT topics: exercise/adf_ops_001/team_*/
- Coordinator: ADF Training Officer
- Control Level: None (just launch and monitor)
```

#### 14:30 - DEWC Indo-Pacific (Different Division)
```
- Scenario: Indo-Pacific Crisis (DEWC-customized)
- 4 teams (Navy, Intel, Diplo, NGO)
- 14 participants
- Ports 3209-3212 allocated
- MQTT topics: exercise/dewc_indo_002/team_*/
- Coordinator: DEWC Indo-Pacific Specialist
- Control Level: Guided (DEWC set timings within ranges)
```

#### 15:00 - Northrop Grumman Satellite Ops
```
- Scenario: GPS Jamming Response (Hybrid development)
- 2 teams (Ground Control, Satellite Ops)
- 8 participants
- Ports 3213-3214 allocated
- MQTT topics: exercise/ng_gps_001/team_*/
- Coordinator: NG Space Training Lead
- Control Level: Collaborative (NG provided proprietary content)
```

### CyberOps Master Monitoring View
```
┌──────────────────────────────────────────────────┐
│ SCIP Platform Master Control - Real Time          │
├──────────────────────────────────────────────────┤
│ Active Organizations: 3 (DEWC, ADF, NG)          │
│ Running Exercises: 4                              │
│ Total Participants: 54                            │
│ Active Team Dashboards: 14                        │
│                                                    │
│ Exercise Status:                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ DEWC Banking      ████████░░ T+45/75 min    │ │
│ │ Control: Full     Teams: 5   Status: ✅      │ │
│ │                                              │ │
│ │ ADF Operations    ██████░░░░ T+30/60 min    │ │
│ │ Control: Locked   Teams: 3   Status: ✅      │ │
│ │                                              │ │
│ │ DEWC Indo-Pacific ██░░░░░░░░ T+10/60 min    │ │
│ │ Control: Guided   Teams: 4   Status: ✅      │ │
│ │                                              │ │
│ │ NG Satellite      [Starting in 5 min]        │ │
│ │ Control: Hybrid   Teams: 2   Status: ⏳      │ │
│ └─────────────────────────────────────────────┘ │
│                                                    │
│ Resource Utilization:                             │
│ CPU: ██████░░░░ 62%                              │
│ Memory: █████░░░░░ 51%                           │
│ Network: ███░░░░░░░ 34%                          │
│ MQTT Messages/sec: 1,247                          │
│                                                    │
│ Revenue Tracking (Monthly):                       │
│ DEWC (Builder): $8,500 ✅                        │
│ ADF (Consumer): $2,500 ✅                        │
│ NG (Enterprise): $25,000 ✅                      │
│ Total MRR: $36,000                                │
└──────────────────────────────────────────────────┘
```

---

## Key Platform Benefits Demonstrated

### For CyberOps
1. **Scalability**: Multiple clients and exercises simultaneously
2. **Reusability**: Scenarios can be licensed across organizations
3. **Revenue Growth**: Each client pays monthly + scenario licensing
4. **Efficiency**: One platform serves all clients
5. **Control**: Complete oversight of all platform activity

### For Clients (DEWC, NG, RN)
1. **Customization**: Brand and content control
2. **Flexibility**: Run exercises on their schedule
3. **Isolation**: Complete data separation from other orgs
4. **Analytics**: Detailed performance insights
5. **Cost-Effective**: No infrastructure to maintain

### For End Users (Team Participants)
1. **Realism**: Information warfare conditions simulated
2. **Immersion**: Isolated team views create fog of war
3. **Simplicity**: Easy login, clear interface
4. **Engagement**: Real-time updates maintain attention
5. **Learning**: Immediate feedback on decisions

---

## Success Metrics

### DEWC Engagement
- Exercises run per month: 8-12
- Participants trained: 200+
- Scenarios licensed: 3-5
- Satisfaction score: 4.8/5.0
- Contract renewal: Confirmed annually

### Platform Performance
- Concurrent exercises supported: 10+
- Total participants simultaneous: 150+
- Message delivery success rate: 99.8%
- System uptime: 99.9%
- Average response time: <100ms

### Business Growth
- Month 1: 1 client (DEWC)
- Month 6: 5 clients
- Month 12: 12 clients
- Year 2: 25+ clients
- Revenue: $8M ARR by Year 3