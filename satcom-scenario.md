# SATCOM Disruption Exercise - Scenario Design

## Scenario Concept: **"SATCOM Disruption Exercise"**

### Operational Context:
Military SATCOM network experiencing anomalous interference. Teams must identify, classify, and respond to electronic warfare threats affecting critical satellite communications.

### Why This Works:
- **Realistic** - Real DoD/allied concern (GPS jamming, SATCOM denial)
- **Trigger-Rich** - Perfect for dashboard updates (signal strength, spectrum analysis, satellite health)
- **Visually Professional** - Can look like actual SATCOM operations center
- **RF/EW Integration** - Natural fit for electromagnetic spectrum operations

---

## Dashboard Design (Realistic Operations Center)

### Layout Concept:
```
┌─────────────────────────────────────────────────────────────┐
│  SATCOM OPERATIONS - CLASSIFIED//SECRET                      │
├──────────────────────┬──────────────────────────────────────┤
│  SATELLITE STATUS    │   RF SPECTRUM ANALYZER               │
│                      │                                       │
│  🛰️ MILSTAR-4        │   [Live spectrum waterfall display]  │
│  ● HEALTHY           │   Freq: 7.25 - 8.40 GHz              │
│  Signal: 98%         │   Interference detected: 7.8 GHz      │
│  Uplink: NOMINAL     │                                       │
│                      │                                       │
│  🛰️ AEHF-6          │   THREAT CLASSIFICATION               │
│  ⚠️  DEGRADED        │   Type: Narrowband Jammer             │
│  Signal: 34% ↓       │   Confidence: 87%                     │
│  Uplink: IMPAIRED    │   Location: Estimated 42.3°N, 71.8°E  │
├──────────────────────┴──────────────────────────────────────┤
│  GROUND STATION LINKS                    SIGNAL HISTORY     │
│  Peterson SFB:    ████████░░ 82%        [Line graph]        │
│  Thule AB:        ██████████ 100%                           │
│  Diego Garcia:    ███░░░░░░░ 28% ⚠️                         │
└─────────────────────────────────────────────────────────────┘
```

### Visual Style:
- **Dark theme** (space ops center aesthetic)
- **Monospace fonts** for technical data
- **Real-time graphs** (signal strength, spectrum analysis)
- **Military color coding**: Green (nominal), Yellow (degraded), Red (denied)
- **Classification markings** at top/bottom
- **UTC timestamps** on all events
- **Grid coordinates** for geolocation data

---

## Team Structure

### Team 1: **Space Operations Center (SPACEOPS)**
**Role**: Monitor satellite health, maintain communications, identify anomalies

**Dashboard Focus**:
- Satellite telemetry
- Link budgets
- Ground station status
- Signal quality metrics

### Team 2: **Electronic Warfare Analysis (EW-INTEL)**
**Role**: Characterize threats, geolocate jammers, recommend countermeasures

**Dashboard Focus**:
- Spectrum analysis
- Interference classification
- Emitter geolocation
- Threat database correlation

---

## Trigger-Heavy Inject Examples

### 1. **Gradual Signal Degradation** (T+5:00)
```json
{
  "id": "inject-sat-001",
  "time": 300,
  "type": "trigger",
  "content": {
    "command": "update_satellite_status",
    "parameters": {
      "satellite": "AEHF-6",
      "signal_strength": 85,
      "status": "NOMINAL",
      "trend": "stable"
    }
  }
}
```

### 2. **Jamming Event Begins** (T+8:30)
```json
{
  "id": "inject-sat-002",
  "time": 510,
  "type": "trigger",
  "content": {
    "command": "inject_interference",
    "parameters": {
      "frequency_ghz": 7.85,
      "bandwidth_mhz": 20,
      "power_dbm": -45,
      "type": "narrowband_jammer",
      "affected_satellite": "AEHF-6",
      "alert_audio": true
    }
  }
}
```

### 3. **Signal Drops Further** (T+10:00)
```json
{
  "id": "inject-sat-003",
  "time": 600,
  "type": "trigger",
  "content": {
    "command": "update_satellite_status",
    "parameters": {
      "satellite": "AEHF-6",
      "signal_strength": 34,
      "status": "DEGRADED",
      "trend": "declining",
      "affected_ground_stations": ["Diego Garcia", "Thule AB"]
    }
  }
}
```

### 4. **Geolocation Data Available** (T+12:00)
```json
{
  "id": "inject-sat-004",
  "time": 720,
  "type": "trigger",
  "content": {
    "command": "update_threat_location",
    "parameters": {
      "latitude": 42.3,
      "longitude": 71.8,
      "confidence": 87,
      "method": "TDOA",
      "threat_type": "Ground-based jammer"
    }
  }
}
```

### 5. **Intelligence Report** (T+15:00)
```json
{
  "id": "inject-sat-005",
  "time": 900,
  "type": "intel_report",
  "content": {
    "classification": "SECRET//NOFORN",
    "source": "NSA SIGINT",
    "title": "Adversary EW Activity Detected",
    "body": "CRITIC: Confirmed hostile electronic attack against US SATCOM constellation. Emitter matches known R-330Zh TORN pattern. Recommend immediate frequency agility protocols."
  },
  "media": ["/media/library/classified-report.png"]
}
```

---

## Realistic Dashboard Features

### Real-time Elements (Updated by Triggers):
1. **Spectrum Waterfall Display** - Shows jamming as it appears
2. **Satellite Health Meters** - Degrades in real-time
3. **Signal Strength Graphs** - Live plotting
4. **Threat Geolocation Map** - Shows emitter position when calculated
5. **Alert Banners** - Flash when critical events occur
6. **Audio Alerts** - Beeps on signal loss

### Static Elements (Background Realism):
- UTC clock
- Classification markings
- Orbital parameters display
- Link budget calculations
- Frequency allocations reference

---

## Professional Touches

### 1. **Military Terminology**
- Use actual terms: "Link margin", "C/N0 ratio", "EIRP", "G/T ratio"
- Real satellite names (AEHF, MILSTAR, WGS)
- Proper frequency bands (X-band, Ka-band)

### 2. **Realistic Data**
- Signal strength in dBm, not percentages (for technical displays)
- Actual satellite orbital positions
- Real ground station locations
- Proper geospatial coordinates

### 3. **Operational Realism**
- Classification markings everywhere
- "OPREP-3" style reporting
- Time in Zulu (UTC)
- Military brevity codes

### 4. **Visual Design**
- Use actual USAF Space Command color schemes (dark blue/teal)
- Monospace fonts for technical data
- Grid-based layouts
- Subtle animations (not gamey)

---

## Comparison to Maritime Scenario

| Aspect | Maritime (Current) | SATCOM (Proposed) |
|--------|-------------------|-------------------|
| **Injects** | Mostly news/social media | Mostly triggers/technical |
| **Dashboard** | General audience | Technical operators |
| **Realism** | Journalistic | Military operations |
| **Triggers** | Minimal | Heavy (perfect demo) |
| **Visual Style** | News feed | Operations center |

---

## Implementation Benefits

**Why This Scenario Showcases the Platform:**

1. ✅ **Showcases triggers perfectly** - Every inject can update the dashboard in real-time
2. ✅ **Looks extremely professional** - Operations center aesthetic
3. ✅ **RF/EW integration** - Demonstrates domain expertise
4. ✅ **Not gamey** - Looks like real military tooling
5. ✅ **Demonstrates flexibility** - Shows the platform handles completely different scenario types
6. ✅ **Zero code changes** - Just new JSON + new dashboard HTML/CSS/JS

**Technical Implementation:**
- Same WebSocket backend
- Same inject delivery system
- Same exercise controls
- Just different dashboard listening for different trigger types

---

## Full Inject Timeline (45-minute scenario)

### Phase 1: Normal Operations (T+0 to T+5)
- Satellites nominal
- All ground stations operational
- Baseline telemetry

### Phase 2: Initial Anomaly (T+5 to T+10)
- Signal degradation begins on AEHF-6
- Teams start troubleshooting
- Initial spectrum anomalies detected

### Phase 3: Confirmed Jamming (T+10 to T+20)
- Jamming signature identified
- Multiple ground stations affected
- Geolocation analysis begins

### Phase 4: Intelligence Correlation (T+20 to T+30)
- SIGINT reports received
- Known threat actor identified
- Countermeasure options presented

### Phase 5: Response (T+30 to T+40)
- Teams implement frequency agility
- Alternative routing through unaffected satellites
- Restoration of critical links

### Phase 6: After Action (T+40 to T+45)
- Damage assessment
- Lessons learned
- Recommendations for hardening

---

## Instructor Controls

Via the management dashboard, instructors can:
- See both team views simultaneously
- Monitor team reactions to each inject
- Adjust scenario pace in real-time
- Add additional injects on the fly
- View analytics on team response times
