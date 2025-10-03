# SATCOM Scenario - Dashboard Implementation Plan

## Overview
Create two professional, modern corporate-style dashboards for the SATCOM scenario that showcase trigger-based real-time updates.

---

## Design Philosophy

### Visual Style: **Modern Corporate Operations Center**
- Clean, professional aesthetic (not military-dark theme)
- Similar to current maritime dashboards but more technical
- Card-based layouts with subtle shadows
- Corporate color palette with accent colors for status
- Responsive design
- **NOT gamey** - looks like real operations software

### Color Scheme
```css
:root {
  --bg-primary: #f5f7fa;           /* Light gray background */
  --bg-card: #ffffff;              /* White cards */
  --text-primary: #1a202c;         /* Dark gray text */
  --text-secondary: #718096;       /* Medium gray */
  --accent-primary: #3182ce;       /* Blue - nominal */
  --accent-success: #38a169;       /* Green - healthy */
  --accent-warning: #d69e2e;       /* Yellow - degraded */
  --accent-danger: #e53e3e;        /* Red - critical */
  --accent-info: #805ad5;          /* Purple - intel */
  --border-light: #e2e8f0;         /* Light borders */
  --shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

---

## Dashboard 1: Space Operations Center (SPACEOPS)

### File Structure
```
/team-dashboard/
├── satcom-spaceops.html         (NEW - main dashboard)
├── css/
│   └── satcom-spaceops.css     (NEW - styles)
└── js/
    └── satcom-spaceops.js      (NEW - logic)
```

### Layout Design

```
┌─────────────────────────────────────────────────────────────────┐
│  SATCOM Operations Center          [UTC: 14:23:45]    [●LIVE]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ MILSTAR-4       │  │ AEHF-6          │  │ WGS-11          │ │
│  │ ━━━━━━━━━━ 98% │  │ ━━━━━░░░░░ 62% │  │ ━━━━━━━━━━ 94% │ │
│  │ ● NOMINAL       │  │ ⚠ DEGRADED      │  │ ● NOMINAL       │ │
│  │ 23.5°W          │  │ 105.5°E         │  │ 45.0°E          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  GROUND STATION STATUS                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Peterson SFB, CO                                               │
│  ████████████████░░░░ 82% Link Quality                         │
│  Status: DEGRADED  |  Last Contact: 14:23:12                   │
│                                                                  │
│  Thule AB, Greenland                                            │
│  ████████████████████ 100% Link Quality                        │
│  Status: NOMINAL  |  Last Contact: 14:23:45                    │
│                                                                  │
│  Diego Garcia, BIOT                                             │
│  █████░░░░░░░░░░░░░░ 28% Link Quality                          │
│  Status: IMPAIRED  |  Last Contact: 14:19:34                   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  SIGNAL HISTORY - AEHF-6                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Line chart showing signal strength over time]                 │
│  100% ┤                                                          │
│   80% ┤ ━━━━━━━━                                                │
│   60% ┤         ━━━━━━━                                         │
│   40% ┤               ━━━━━━━                                   │
│   20% ┤                      ━━━━━                              │
│    0% ┼──────────────────────────────────                       │
│       T+0  T+5  T+10 T+15 T+20 T+25                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **Satellite Status Cards**
   - Real-time signal strength bars
   - Color-coded status badges
   - Orbital position display
   - Trend indicators (↑ ↓ →)

2. **Ground Station Panels**
   - Horizontal progress bars for link quality
   - Status badges
   - Last contact timestamp
   - Location labels

3. **Signal History Chart**
   - Line chart showing degradation over time
   - Auto-scrolling as new data arrives
   - Color changes based on thresholds
   - X-axis: exercise time, Y-axis: signal %

4. **Alert Banner** (appears when triggered)
   - Slides in from top
   - Auto-dismisses after 10 seconds
   - Different colors per severity
   - Optional audio alert

### HTML Structure (satcom-spaceops.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SATCOM Operations Center</title>
    <link rel="stylesheet" href="css/satcom-spaceops.css">
</head>
<body>
    <!-- Header -->
    <header class="header">
        <div class="header-left">
            <h1>SATCOM Operations Center</h1>
        </div>
        <div class="header-right">
            <span id="utc-clock" class="clock">--:--:--</span>
            <span id="connection-status" class="status-indicator">● LIVE</span>
        </div>
    </header>

    <!-- Alert Banner (hidden by default) -->
    <div id="alert-banner" class="alert-banner hidden">
        <div class="alert-content">
            <span class="alert-title"></span>
            <span class="alert-message"></span>
        </div>
        <button class="alert-close">&times;</button>
    </div>

    <!-- Main Content -->
    <main class="main-content">

        <!-- Satellite Status Section -->
        <section class="section">
            <h2 class="section-title">Satellite Constellation Status</h2>
            <div class="satellite-grid" id="satellite-grid">
                <!-- Satellite cards will be populated by JS -->
            </div>
        </section>

        <!-- Ground Stations Section -->
        <section class="section">
            <h2 class="section-title">Ground Station Links</h2>
            <div class="ground-stations" id="ground-stations">
                <!-- Ground station cards will be populated by JS -->
            </div>
        </section>

        <!-- Signal History Chart -->
        <section class="section">
            <h2 class="section-title">Signal History - AEHF-6</h2>
            <div class="chart-container">
                <canvas id="signal-chart"></canvas>
            </div>
        </section>

    </main>

    <!-- Scripts -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="js/satcom-spaceops.js"></script>
</body>
</html>
```

### JavaScript Logic (satcom-spaceops.js)

**Key Functions:**

```javascript
// WebSocket connection (same pattern as maritime dashboard)
const urlParams = new URLSearchParams(window.location.search);
const team = urlParams.get('team');
const exercise = urlParams.get('exercise');
const ws = new WebSocket(`ws://localhost:8001/ws/${team}/${exercise}`);

// State management
let satelliteData = {};
let groundStations = {};
let signalHistory = [];

// WebSocket message handler
ws.onmessage = (event) => {
    const inject = JSON.parse(event.data);

    // Route to appropriate handler based on inject type
    if (inject.type === 'trigger') {
        handleTrigger(inject.content);
    } else if (inject.type === 'alert') {
        showAlert(inject.content);
    } else if (inject.type === 'intel_report') {
        showIntelReport(inject.content);
    }
};

// Trigger handlers
function handleTrigger(content) {
    const { command, parameters } = content;

    switch(command) {
        case 'initialize_satellites':
            initializeSatellites(parameters.satellites);
            break;
        case 'update_satellite_status':
            updateSatellite(parameters);
            break;
        case 'update_ground_stations':
            updateGroundStations(parameters.stations);
            break;
        case 'countermeasure_available':
            showCountermeasure(parameters);
            break;
    }
}

// Update satellite display
function updateSatellite(data) {
    satelliteData[data.satellite] = data;
    renderSatelliteCard(data.satellite);
    updateSignalChart(data.satellite, data.signal_strength);

    if (data.alert_audio) {
        playAlertSound();
    }
}

// Render satellite card
function renderSatelliteCard(satelliteName) {
    const data = satelliteData[satelliteName];
    const statusClass = getStatusClass(data.status);
    const statusIcon = getStatusIcon(data.status);

    const html = `
        <div class="satellite-card ${statusClass}">
            <h3 class="satellite-name">${satelliteName}</h3>
            <div class="signal-bar">
                <div class="signal-fill" style="width: ${data.signal_strength}%"></div>
            </div>
            <div class="signal-value">${data.signal_strength}%</div>
            <div class="satellite-status">
                ${statusIcon} ${data.status}
            </div>
            <div class="satellite-position">${data.orbital_position || 'N/A'}</div>
        </div>
    `;

    // Update or insert card
    const container = document.getElementById('satellite-grid');
    const existingCard = container.querySelector(`[data-satellite="${satelliteName}"]`);
    if (existingCard) {
        existingCard.outerHTML = html;
    } else {
        container.innerHTML += html;
    }
}

// Alert banner
function showAlert(content) {
    const banner = document.getElementById('alert-banner');
    const severityClass = `alert-${content.severity}`;

    banner.className = `alert-banner ${severityClass}`;
    banner.querySelector('.alert-title').textContent = content.title;
    banner.querySelector('.alert-message').textContent = content.message;
    banner.classList.remove('hidden');

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        banner.classList.add('hidden');
    }, 10000);
}

// Chart update
function updateSignalChart(satellite, signalStrength) {
    signalHistory.push({
        time: getCurrentExerciseTime(),
        value: signalStrength
    });

    // Update Chart.js instance
    signalChart.data.labels.push(signalHistory.length);
    signalChart.data.datasets[0].data.push(signalStrength);
    signalChart.update();
}
```

---

## Dashboard 2: Electronic Warfare Intelligence (EW-INTEL)

### File Structure
```
/team-dashboard/
├── satcom-ew-intel.html         (NEW - main dashboard)
├── css/
│   └── satcom-ew-intel.css     (NEW - styles)
└── js/
    └── satcom-ew-intel.js      (NEW - logic)
```

### Layout Design

```
┌─────────────────────────────────────────────────────────────────┐
│  EW Intelligence Analysis          [UTC: 14:23:45]    [●LIVE]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐│
│  │ RF SPECTRUM MONITOR      │  │ THREAT CLASSIFICATION        ││
│  │                          │  │                              ││
│  │ Frequency: 7.25-8.40 GHz │  │ Type: Narrowband Jammer      ││
│  │                          │  │ Confidence: 87%              ││
│  │ [Spectrum waterfall]     │  │ Power: -45 dBm               ││
│  │ [or simple freq bars]    │  │ Bandwidth: 20 MHz            ││
│  │                          │  │                              ││
│  │ ▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌   │  │ Pattern Match:               ││
│  │    ████ Interference     │  │ R-330Zh Zhitel (TORN)        ││
│  │     ↑                    │  │                              ││
│  │   7.85 GHz               │  │ Known Capabilities:          ││
│  │                          │  │ • SATCOM jamming (7-8 GHz)   ││
│  └──────────────────────────┘  │ • GPS denial                 ││
│                                 │ • Frequency agility          ││
│  ┌──────────────────────────┐  └──────────────────────────────┘│
│  │ EMITTER GEOLOCATION      │                                  │
│  │                          │  ┌──────────────────────────────┐│
│  │ [Map showing location]   │  │ COUNTERMEASURES              ││
│  │                          │  │                              ││
│  │ Lat: 42.29°N            │  │ ✓ Frequency Hopping          ││
│  │ Lon: 71.82°E            │  │ ✓ Increased Link Margin      ││
│  │ Confidence: 87%          │  │ ✓ Alternative Routing        ││
│  │ Error: ±3.5 km           │  │ ⚠ Kinetic (Requires Auth)    ││
│  │                          │  │                              ││
│  │ Nearest: 12km NE Saratov │  │ Recommended: Freq Hopping    ││
│  └──────────────────────────┘  └──────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Features

1. **RF Spectrum Monitor**
   - Visual representation of frequency spectrum
   - Highlighted interference zones
   - Frequency labels
   - Real-time updates as jamming intensity changes

2. **Threat Classification Panel**
   - Emitter type and confidence
   - Technical parameters (power, bandwidth)
   - Database matching (known systems)
   - Capability list

3. **Geolocation Display**
   - Simple map or coordinate display
   - Confidence percentage
   - Error radius
   - Nearest landmark reference

4. **Countermeasures List**
   - Checkbox-style list of options
   - Recommended action highlighted
   - Authorization requirements noted

### Spectrum Display Options

**Option A: Simple Frequency Bars** (Easier, still professional)
```
7.25 GHz  ▌▌▌▌▌▌░░░░  Baseline
7.50 GHz  ▌▌▌▌▌░░░░░  Baseline
7.75 GHz  ▌▌▌▌▌▌░░░░  Baseline
7.85 GHz  ████████████  INTERFERENCE ⚠
8.00 GHz  ▌▌▌▌▌▌░░░░  Baseline
8.25 GHz  ▌▌▌▌▌░░░░░  Baseline
```

**Option B: Waterfall-style Canvas** (More impressive, more complex)
- Scrolling waterfall display
- Color-coded by signal intensity
- Time on Y-axis, Frequency on X-axis
- Interference shows as bright bands

---

## Shared Components

### Common CSS (both dashboards)

**File:** `/team-dashboard/css/common-satcom.css`

```css
/* Modern corporate styling */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                 'Helvetica Neue', Arial, sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.6;
}

.header {
    background: var(--bg-card);
    border-bottom: 2px solid var(--border-light);
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--shadow);
}

.section {
    background: var(--bg-card);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: var(--shadow);
}

.section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-light);
}

/* Status badges */
.status-nominal {
    color: var(--accent-success);
    background: rgba(56, 161, 105, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
}

.status-degraded {
    color: var(--accent-warning);
    background: rgba(214, 158, 46, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
}

.status-critical {
    color: var(--accent-danger);
    background: rgba(229, 62, 62, 0.1);
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.875rem;
}

/* Alert banner */
.alert-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1000;
    animation: slideDown 0.3s ease-out;
}

.alert-warning {
    background: var(--accent-warning);
    color: white;
}

.alert-critical {
    background: var(--accent-danger);
    color: white;
}

.alert-success {
    background: var(--accent-success);
    color: white;
}

@keyframes slideDown {
    from {
        transform: translateY(-100%);
    }
    to {
        transform: translateY(0);
    }
}

/* Signal strength bar */
.signal-bar {
    width: 100%;
    height: 24px;
    background: var(--border-light);
    border-radius: 4px;
    overflow: hidden;
}

.signal-fill {
    height: 100%;
    background: linear-gradient(90deg,
        var(--accent-success),
        var(--accent-primary));
    transition: width 0.5s ease-out;
}

.signal-fill.degraded {
    background: var(--accent-warning);
}

.signal-fill.critical {
    background: var(--accent-danger);
}
```

---

## Implementation Checklist

### Pre-Implementation
- [ ] Decide on spectrum display type (bars vs waterfall)
- [ ] Choose map library or simple coordinate display
- [ ] Confirm Chart.js version compatibility
- [ ] Review audio alert requirements

### SPACEOPS Dashboard
- [ ] Create `satcom-spaceops.html`
- [ ] Create `css/satcom-spaceops.css`
- [ ] Create `js/satcom-spaceops.js`
- [ ] Implement WebSocket connection
- [ ] Implement satellite status rendering
- [ ] Implement ground station display
- [ ] Implement signal history chart
- [ ] Add alert banner functionality
- [ ] Add UTC clock
- [ ] Test with mock injects

### EW-INTEL Dashboard
- [ ] Create `satcom-ew-intel.html`
- [ ] Create `css/satcom-ew-intel.css`
- [ ] Create `js/satcom-ew-intel.js`
- [ ] Implement spectrum display
- [ ] Implement threat classification panel
- [ ] Implement geolocation display
- [ ] Implement countermeasures list
- [ ] Add alert functionality
- [ ] Test with mock injects

### Testing
- [ ] Test WebSocket connection on both dashboards
- [ ] Verify all trigger commands are handled
- [ ] Test alert banners on both dashboards
- [ ] Verify responsive design on different screen sizes
- [ ] Test with full inject timeline
- [ ] Verify audio alerts work
- [ ] Check color contrast for accessibility
- [ ] Test connection loss/reconnection

---

## Integration with Existing System

### No Changes Required To:
- ✅ Backend orchestration
- ✅ WebSocket infrastructure
- ✅ Management dashboard
- ✅ Timeline editor
- ✅ Exercise controls

### Dashboard URLs (Auto-Generated):
```
SPACEOPS: http://localhost:3100/?team=spaceops&exercise=satcom-disruption-scenario
EW-INTEL: http://localhost:3101/?team=ew-intel&exercise=satcom-disruption-scenario
```

### How Dashboards Are Served:
The existing team-dashboard container serves ALL dashboards:
- `maritime-dashboard.html` (existing)
- `satcom-spaceops.html` (NEW)
- `satcom-ew-intel.html` (NEW)

**IMPORTANT - Backend Routing Update Required:**

The backend routing logic needs update to map team IDs to dashboard files.

**Current Implementation:** Check `/team-dashboard/index.html` or equivalent to see how team parameter is handled.

**Likely Needed Change:**
```javascript
// In team-dashboard routing logic
const dashboardMap = {
    'blue': 'maritime-dashboard.html',
    'red': 'maritime-dashboard.html',
    'spaceops': 'satcom-spaceops.html',      // NEW
    'ew-intel': 'satcom-ew-intel.html'       // NEW
};

// Use team parameter from URL to load correct dashboard
const team = new URLSearchParams(window.location.search).get('team');
const dashboardFile = dashboardMap[team] || 'maritime-dashboard.html';
```

**Alternative (if current implementation uses team parameter directly):**
- Name files to match team IDs: `spaceops.html` and `ew-intel.html`
- Or use query parameter to dynamically load correct HTML

**Action Item:** Need to review current team-dashboard implementation to determine exact routing mechanism.

---

## Advanced Feature: Real IQ Waterfall (Question #4)

**Your Question:** Inject jamming into real recorded IQ data for RF waterfall display

**Assessment:** This would be EXTREMELY impressive and unique.

### Approach Options:

**Option A: Pre-recorded Waterfall Animation** (Simpler)
1. Record clean IQ data → generate waterfall PNG/video
2. Record jammed IQ data → generate waterfall PNG/video
3. Dashboard switches between recordings based on inject timing
4. **Pros:** Simple, looks real, no heavy processing in browser
5. **Cons:** Not truly "live", limited variability

**Option B: Live IQ Processing in Browser** (Complex but amazing)
1. Load baseline IQ recording (as binary data)
2. When jamming inject arrives, add interference to IQ samples
3. Use WebGL or Canvas to render live waterfall
4. **Pros:** Truly dynamic, can vary jamming parameters
5. **Cons:** Heavy browser processing, complex DSP in JavaScript

**Option C: Backend IQ Processing** (Best balance)
1. Backend holds IQ recordings
2. When jamming inject triggers, backend processes IQ + interference
3. Backend streams processed waterfall images to dashboard
4. **Pros:** Real processing, manageable complexity, looks authentic
5. **Cons:** Requires backend DSP code

### My Recommendation for Question #4:

**Use Option A for initial demo** (pre-recorded waterfall transitions):
- Create 2-3 waterfall video clips or animated PNGs:
  - `baseline.mp4` - Clean spectrum
  - `jamming-light.mp4` - Minor interference
  - `jamming-heavy.mp4` - Strong jamming
- Dashboard switches videos based on inject parameters
- **Implementation time:** 2-3 hours
- **Visual impact:** Very high
- **Technical risk:** Low

**Upgrade to Option C later if client is impressed**:
- Integrate your existing IQ injection software
- Backend generates waterfalls on-demand
- Can demo "we can inject any jamming signature in real-time"
- **Implementation time:** 1-2 days
- **Visual impact:** Extremely high
- **Demo value:** Off the charts

### Quick Implementation for Option A:

```javascript
// In satcom-ew-intel.js
const waterfallVideos = {
    'baseline': 'media/waterfall-baseline.mp4',
    'light': 'media/waterfall-jamming-light.mp4',
    'heavy': 'media/waterfall-jamming-heavy.mp4'
};

function handleInterferenceInject(parameters) {
    const videoElement = document.getElementById('waterfall-video');

    if (parameters.power_dbm > -50) {
        videoElement.src = waterfallVideos.heavy;
    } else if (parameters.power_dbm > -65) {
        videoElement.src = waterfallVideos.light;
    } else {
        videoElement.src = waterfallVideos.baseline;
    }

    videoElement.play();
}
```

---

## Summary

**Two modern, professional dashboards that:**
- ✅ Look corporate, not gamey
- ✅ Showcase trigger-based real-time updates
- ✅ Demonstrate technical depth (RF/EW domain)
- ✅ Use same backend infrastructure
- ✅ No code changes to existing system
- ✅ Can integrate real IQ waterfall for maximum impact

**Next Steps:**
1. Approve design direction
2. Implement HTML/CSS/JS for both dashboards
3. Test with scenario JSON timelines
4. Optional: Add real IQ waterfall processing
