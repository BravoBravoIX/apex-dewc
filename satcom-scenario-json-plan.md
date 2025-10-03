# SATCOM Scenario - JSON Implementation Plan

## Overview
This plan details the creation of all JSON files needed for the SATCOM Disruption scenario without modifying any existing code.

---

## File Structure

```
/scenarios/
├── satcom-disruption-scenario.json          (NEW - main scenario file)
├── satcom-scenario.png                      (NEW - thumbnail image)
└── timelines/
    ├── timeline-spaceops.json               (NEW - Space Operations team)
    └── timeline-ew-intel.json               (NEW - EW Intelligence team)
```

---

## 1. Main Scenario File

**Location:** `/scenarios/satcom-disruption-scenario.json`

**Purpose:** Defines scenario metadata and team structure

**Content:**
```json
{
  "id": "satcom-disruption-scenario",
  "name": "SATCOM Disruption Exercise",
  "description": "Military SATCOM network experiencing electronic warfare interference. Teams must identify, classify, and respond to threats affecting critical satellite communications.",
  "thumbnail": "space-cyber-scenario.png",
  "duration_minutes": 45,
  "teams": [
    {
      "id": "spaceops",
      "name": "Space Operations Center",
      "timeline_file": "timelines/timeline-spaceops.json"
    },
    {
      "id": "ew-intel",
      "name": "Electronic Warfare Intelligence",
      "timeline_file": "timelines/timeline-ew-intel.json"
    }
  ]
}
```

**Key Points:**
- `id` must match filename (without .json extension)
- `team.id` values ("spaceops", "ew-intel") will be used in dashboard URLs
- `thumbnail` path relative to `/scenarios/` directory
- `timeline_file` paths relative to `/scenarios/` directory

---

## 2. Space Operations Timeline

**Location:** `/scenarios/timelines/timeline-spaceops.json`

**Purpose:** Injects for Space Operations team focusing on satellite health and telemetry

**Content Structure:**
```json
{
  "id": "timeline-spaceops",
  "name": "SPACEOPS Team Timeline",
  "description": "Monitor satellite health and maintain communications",
  "version": "1.0.0",
  "injects": [
    {
      "id": "inject-spaceops-001",
      "time": 0,
      "type": "trigger",
      "content": {
        "command": "initialize_satellites",
        "parameters": {
          "satellites": [
            {
              "name": "MILSTAR-4",
              "signal_strength": 98,
              "status": "NOMINAL",
              "orbital_position": "23.5°W",
              "uplink_status": "NOMINAL"
            },
            {
              "name": "AEHF-6",
              "signal_strength": 96,
              "status": "NOMINAL",
              "orbital_position": "105.5°E",
              "uplink_status": "NOMINAL"
            }
          ]
        }
      }
    },
    {
      "id": "inject-spaceops-002",
      "time": 300,
      "type": "trigger",
      "content": {
        "command": "update_satellite_status",
        "parameters": {
          "satellite": "AEHF-6",
          "signal_strength": 85,
          "status": "NOMINAL",
          "trend": "declining",
          "note": "Minor signal fluctuation detected"
        }
      }
    },
    {
      "id": "inject-spaceops-003",
      "time": 510,
      "type": "trigger",
      "content": {
        "command": "update_satellite_status",
        "parameters": {
          "satellite": "AEHF-6",
          "signal_strength": 62,
          "status": "DEGRADED",
          "trend": "declining",
          "affected_ground_stations": ["Diego Garcia"],
          "alert_audio": true
        }
      }
    },
    {
      "id": "inject-spaceops-004",
      "time": 600,
      "type": "alert",
      "content": {
        "severity": "warning",
        "title": "SATCOM Link Degradation",
        "message": "AEHF-6 experiencing significant signal loss. Multiple ground stations reporting reduced link margin.",
        "timestamp": "2025-10-01T14:10:00Z"
      }
    },
    {
      "id": "inject-spaceops-005",
      "time": 720,
      "type": "trigger",
      "content": {
        "command": "update_ground_stations",
        "parameters": {
          "stations": [
            {
              "name": "Peterson SFB",
              "link_quality": 82,
              "status": "DEGRADED"
            },
            {
              "name": "Thule AB",
              "link_quality": 100,
              "status": "NOMINAL"
            },
            {
              "name": "Diego Garcia",
              "link_quality": 28,
              "status": "IMPAIRED"
            }
          ]
        }
      }
    },
    {
      "id": "inject-spaceops-006",
      "time": 900,
      "type": "intel_report",
      "content": {
        "classification": "SECRET//NOFORN",
        "source": "US SPACE COMMAND",
        "title": "SATCOM Interference Assessment",
        "body": "OPREP-3 PINNACLE: Hostile electronic attack confirmed against AEHF-6. Recommend immediate implementation of frequency agility protocols and alternative routing via MILSTAR constellation."
      }
    },
    {
      "id": "inject-spaceops-007",
      "time": 1200,
      "type": "trigger",
      "content": {
        "command": "update_satellite_status",
        "parameters": {
          "satellite": "AEHF-6",
          "signal_strength": 34,
          "status": "SEVERELY_DEGRADED",
          "trend": "critical",
          "recommendation": "Consider rerouting critical traffic"
        }
      }
    },
    {
      "id": "inject-spaceops-008",
      "time": 1800,
      "type": "trigger",
      "content": {
        "command": "countermeasure_available",
        "parameters": {
          "measure": "frequency_agility",
          "description": "Switch to alternate frequency plan ALPHA-3",
          "expected_improvement": "60-80%",
          "implementation_time": "2 minutes"
        }
      }
    },
    {
      "id": "inject-spaceops-009",
      "time": 2400,
      "type": "trigger",
      "content": {
        "command": "update_satellite_status",
        "parameters": {
          "satellite": "AEHF-6",
          "signal_strength": 78,
          "status": "RECOVERING",
          "trend": "improving",
          "note": "Frequency agility successful"
        }
      }
    },
    {
      "id": "inject-spaceops-010",
      "time": 2700,
      "type": "alert",
      "content": {
        "severity": "success",
        "title": "Link Restoration",
        "message": "AEHF-6 links restored to operational status. All ground stations reporting nominal connectivity.",
        "timestamp": "2025-10-01T14:45:00Z"
      }
    }
  ]
}
```

---

## 3. EW Intelligence Timeline

**Location:** `/scenarios/timelines/timeline-ew-intel.json`

**Purpose:** Injects for EW Intelligence team focusing on threat characterization and geolocation

**Content Structure:**
```json
{
  "id": "timeline-ew-intel",
  "name": "EW-INTEL Team Timeline",
  "description": "Characterize threats and provide countermeasure recommendations",
  "version": "1.0.0",
  "injects": [
    {
      "id": "inject-ew-001",
      "time": 0,
      "type": "trigger",
      "content": {
        "command": "initialize_spectrum",
        "parameters": {
          "frequency_range_ghz": [7.25, 8.40],
          "baseline_noise_floor_dbm": -95,
          "monitored_bands": ["X-band SATCOM"]
        }
      }
    },
    {
      "id": "inject-ew-002",
      "time": 300,
      "type": "trigger",
      "content": {
        "command": "spectrum_anomaly",
        "parameters": {
          "frequency_ghz": 7.85,
          "power_dbm": -75,
          "bandwidth_mhz": 5,
          "confidence": 45,
          "classification": "Unknown"
        }
      }
    },
    {
      "id": "inject-ew-003",
      "time": 510,
      "type": "trigger",
      "content": {
        "command": "inject_interference",
        "parameters": {
          "frequency_ghz": 7.85,
          "bandwidth_mhz": 20,
          "power_dbm": -45,
          "type": "narrowband_jammer",
          "modulation": "CW",
          "alert_audio": true
        }
      }
    },
    {
      "id": "inject-ew-004",
      "time": 600,
      "type": "alert",
      "content": {
        "severity": "critical",
        "title": "Jamming Detected",
        "message": "High-power interference detected at 7.85 GHz. Narrowband jamming pattern consistent with deliberate electronic attack.",
        "timestamp": "2025-10-01T14:10:00Z"
      }
    },
    {
      "id": "inject-ew-005",
      "time": 720,
      "type": "trigger",
      "content": {
        "command": "classify_emitter",
        "parameters": {
          "emitter_type": "Ground-based jammer",
          "threat_category": "HOSTILE",
          "confidence": 78,
          "characteristics": {
            "power_output_estimated": "10-50W",
            "antenna_pattern": "Directional",
            "duty_cycle": "Continuous"
          }
        }
      }
    },
    {
      "id": "inject-ew-006",
      "time": 900,
      "type": "trigger",
      "content": {
        "command": "geolocation_update",
        "parameters": {
          "latitude": 42.3156,
          "longitude": 71.8472,
          "altitude_meters": 245,
          "confidence": 67,
          "method": "TDOA",
          "error_radius_km": 15
        }
      }
    },
    {
      "id": "inject-ew-007",
      "time": 1080,
      "type": "intel_report",
      "content": {
        "classification": "SECRET//REL TO USA, FVEY",
        "source": "NSA SIGINT",
        "title": "Emitter Pattern Correlation",
        "body": "CRITIC FLASH: Intercepted emissions match signature of Russian R-330Zh Zhitel EW system. High confidence adversary electronic attack in progress. Emitter characteristics: 100W output, directional array, frequency-hopping capable."
      }
    },
    {
      "id": "inject-ew-008",
      "time": 1200,
      "type": "trigger",
      "content": {
        "command": "geolocation_refined",
        "parameters": {
          "latitude": 42.2894,
          "longitude": 71.8201,
          "altitude_meters": 278,
          "confidence": 87,
          "method": "Multi-sensor fusion",
          "error_radius_km": 3.5,
          "nearest_landmark": "12km NE of Saratov, Russia"
        }
      }
    },
    {
      "id": "inject-ew-009",
      "time": 1500,
      "type": "trigger",
      "content": {
        "command": "threat_database_match",
        "parameters": {
          "system_name": "R-330Zh Zhitel",
          "nato_designation": "TORN",
          "manufacturer": "KRET Corporation",
          "known_capabilities": [
            "SATCOM jamming (7-8 GHz)",
            "GPS denial",
            "Frequency agility (adaptive)",
            "Remote operation"
          ],
          "countermeasures": [
            "Frequency hopping",
            "Increased link margin",
            "Alternative routing",
            "Kinetic targeting (approved units only)"
          ]
        }
      }
    },
    {
      "id": "inject-ew-010",
      "time": 1800,
      "type": "alert",
      "content": {
        "severity": "info",
        "title": "Countermeasure Recommendation",
        "message": "Analysis complete. Recommend immediate frequency agility implementation. Enemy system lacks capability to track rapid frequency changes above 500 hops/second.",
        "timestamp": "2025-10-01T14:30:00Z"
      }
    },
    {
      "id": "inject-ew-011",
      "time": 2400,
      "type": "trigger",
      "content": {
        "command": "jamming_effectiveness",
        "parameters": {
          "effectiveness_percent": 15,
          "status": "Largely ineffective",
          "reason": "Frequency agility successful"
        }
      }
    },
    {
      "id": "inject-ew-012",
      "time": 2700,
      "type": "alert",
      "content": {
        "severity": "success",
        "title": "Threat Mitigated",
        "message": "Electronic attack successfully countered. Enemy jamming rendered ineffective through frequency agility protocols. All SATCOM links operational.",
        "timestamp": "2025-10-01T14:45:00Z"
      }
    }
  ]
}
```

---

## 4. Thumbnail Image

**Location:** `/scenarios/space-cyber-scenario.png`

**Specifications:**
- **Size:** 300x300px (matches maritime scenario)
- **Content:** Satellite/RF visualization or space operations imagery
- **Style:** Professional, not gamey
- **Format:** PNG

**Resize Command:**
```bash
sips -Z 300 /Users/brettburford/Development/CyberOps/scip-v3/scenarios/space-cyber-scenario.png
```

**Note:** Image already exists at `/scenarios/space-cyber-scenario.png` (1024x1024), needs resizing to 300x300px to match maritime-scenario.png

---

## Implementation Checklist

### Pre-Implementation:
- [ ] Review all inject types are supported (trigger, alert, intel_report)
- [ ] Verify team IDs don't conflict with existing scenarios
- [ ] Confirm timeline file paths are correct

### File Creation:
- [ ] Create `/scenarios/satcom-disruption-scenario.json`
- [ ] Create `/scenarios/timelines/timeline-spaceops.json`
- [ ] Create `/scenarios/timelines/timeline-ew-intel.json`
- [ ] Add `/scenarios/satcom-scenario.png` thumbnail

### Validation:
- [ ] Validate all JSON files (no syntax errors)
- [ ] Verify all `time` values are in ascending order
- [ ] Check all team IDs match between scenario and timelines
- [ ] Confirm inject IDs are unique within each timeline
- [ ] Test thumbnail image loads correctly

### Testing:
- [ ] Scenario appears in scenarios list
- [ ] Scenario workspace loads correctly
- [ ] Both team timelines are accessible
- [ ] Inject counts display correctly
- [ ] Deploy button works (even without dashboards ready)

---

## Timeline Timing Strategy

**45-minute scenario breakdown:**

| Time Range | Phase | Inject Frequency |
|------------|-------|------------------|
| T+0 to T+5 | Baseline | 1 inject (initialization) |
| T+5 to T+10 | Initial anomaly | 2-3 injects (every 2-3 min) |
| T+10 to T+20 | Escalation | 3-4 injects (every 2-3 min) |
| T+20 to T+30 | Analysis | 2-3 injects (every 3-5 min) |
| T+30 to T+40 | Response | 2-3 injects (every 3-5 min) |
| T+40 to T+45 | Resolution | 1-2 injects (every 2-3 min) |

**Total injects:**
- SPACEOPS: ~10-12 injects
- EW-INTEL: ~12-14 injects
- **Total: 22-26 injects** (good density for 45 minutes)

---

## Notes

1. **No Code Changes Required** - All existing backend code will automatically:
   - Discover this scenario in `/scenarios/`
   - Parse the JSON structure
   - Load timelines on demand
   - Deliver injects via WebSocket
   - Track analytics

2. **Team IDs in URLs** - When deployed:
   - SPACEOPS: `http://localhost:3100/?team=spaceops&exercise=satcom-disruption-scenario`
   - EW-INTEL: `http://localhost:3101/?team=ew-intel&exercise=satcom-disruption-scenario`

3. **Inject Types Used**:
   - `trigger` - Dashboard updates (most common)
   - `alert` - Alert banners/notifications
   - `intel_report` - Classified reports with text content

4. **Dashboard Integration** - The trigger commands (`update_satellite_status`, `inject_interference`, etc.) are custom - the dashboard JavaScript will listen for these specific commands and update the UI accordingly.

5. **Extensibility** - Easy to add more injects later:
   - Just add to the `injects` array
   - Maintain ascending time order
   - Use unique inject IDs
   - No deployment/restart required

---

## Next Steps

After JSON files are created:
1. Validate JSON syntax
2. Add to git repository
3. Test in management dashboard
4. Create team dashboards (separate plan)
5. Full end-to-end test with live deployment
