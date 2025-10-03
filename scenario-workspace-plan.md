# Scenario Workspace Implementation Plan - Quick Wins

## Overview
Reorganize navigation to be scenario-centric with a new Scenario Workspace page. Add basic analytics for polish. Minimal breaking changes, maximum impact.

## Goals
1. ✅ Cleaner navigation (3 items instead of 4-5)
2. ✅ Scenario-centric workflow
3. ✅ Room for detailed scenario metadata
4. ✅ Basic analytics that look professional
5. ✅ Show exercise control in context when running
6. ✅ No breaking changes to existing functionality

---

## Phase 1: Create Scenario Workspace Page (2 hours)

### 1.1 Create New Component: `ScenarioWorkspacePage.tsx`

**Location:** `/client-dashboard/src/pages/ScenarioWorkspacePage.tsx`

**Features:**
- Fetches scenario data by ID from URL params
- Displays scenario metadata (name, description, thumbnail, duration)
- Lists all teams with their timelines
- Shows inject counts per team
- Links to Timeline Viewer for each team
- Deploy Exercise button
- Back to Scenarios link

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ ← Back to Scenarios                                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  [Thumbnail]   Maritime Crisis                       │
│  96x96px       Multi-domain crisis response...       │
│                                                      │
│                Duration: 60 minutes                  │
│                Teams: 2                              │
│                                                      │
│                [Deploy Exercise]                     │
│                                                      │
├─────────────────────────────────────────────────────┤
│  Teams & Timelines                                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐│
│  │ 🔵 Blue Team         │  │ 🔴 Red Team          ││
│  │ Maritime Security    │  │ Opposing Force       ││
│  │                      │  │                      ││
│  │ 📊 2 Injects         │  │ 📊 1 Inject          ││
│  │                      │  │                      ││
│  │ [Edit Timeline]      │  │ [Edit Timeline]      ││
│  └──────────────────────┘  └──────────────────────┘│
│                                                      │
└─────────────────────────────────────────────────────┘
```

**API Calls:**
- `GET /api/v1/scenarios` - get all scenarios, filter by ID
- `GET /api/v1/timelines/{scenarioId}/{teamId}` - for each team to get inject count

**Data Structure:**
```typescript
interface ScenarioWorkspace {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  duration_minutes: number;
  teams: Array<{
    id: string;
    name: string;
    timeline_file: string;
    inject_count?: number; // fetched separately
  }>;
}
```

---

### 1.2 Update Routing

**File:** `/client-dashboard/src/App.tsx`

**Add new route:**
```typescript
<Route path="/scenarios/:scenarioId" element={<ScenarioWorkspacePage />} />
```

**Keep existing routes:**
- `/scenarios` - ScenariosPage
- `/timelines/:scenarioId/:teamId` - TimelineViewerPage
- `/exercise-control` - ExerciseControlPage
- `/media` - MediaLibraryPage

---

### 1.3 Update Scenarios Page Navigation

**File:** `/client-dashboard/src/pages/ScenariosPage.tsx`

**Change scenario cards from:**
```typescript
<button onClick={() => deployScenario(scenario.id)}>
  Deploy Exercise
</button>
```

**To:**
```typescript
<Link to={`/scenarios/${scenario.id}`}>
  <div className="scenario-card">...</div>
</Link>
```

**Move "Deploy" button into the card OR to workspace page**

---

## Phase 2: Add Exercise Control Widget (1 hour)

### 2.1 Create Reusable Exercise Control Component

**File:** `/client-dashboard/src/components/ExerciseControlWidget.tsx`

**Features:**
- Shows current exercise status if running
- Timer display
- Team progress bars
- Pause/Resume/Stop buttons
- Compact version for workspace, full version for dedicated page

**Props:**
```typescript
interface ExerciseControlWidgetProps {
  scenarioId?: string; // if provided, only show for this scenario
  compact?: boolean;   // compact mode for workspace embedding
}
```

**UI (Compact Mode):**
```
┌─────────────────────────────────────────────┐
│ ⚠ Exercise Currently Running                │
├─────────────────────────────────────────────┤
│ Timer: T+15:34        [⏸ Pause] [⏹ Stop]   │
│                                             │
│ Blue Team  [████████░░] 80% (2/2)          │
│ Red Team   [██████████] 100% (1/1)         │
└─────────────────────────────────────────────┘
```

---

### 2.2 Integrate into Scenario Workspace

**In `ScenarioWorkspacePage.tsx`:**

```typescript
// Check if current scenario is running
const [exerciseStatus, setExerciseStatus] = useState<any>(null);

useEffect(() => {
  const checkExercise = async () => {
    const res = await fetch('http://localhost:8001/api/v1/exercises/current');
    const data = await res.json();
    if (data.active && data.scenario_name === scenarioId) {
      setExerciseStatus(data);
    }
  };
  checkExercise();
  const interval = setInterval(checkExercise, 2000);
  return () => clearInterval(interval);
}, [scenarioId]);

// In render:
{exerciseStatus && (
  <div className="mb-4">
    <ExerciseControlWidget
      scenarioId={scenarioId}
      compact={true}
    />
  </div>
)}
```

**Disable timeline editing while exercise is running:**
```typescript
{exerciseStatus ? (
  <div className="opacity-50 cursor-not-allowed">
    <p className="text-yellow-400">Timeline editing disabled during exercise</p>
  </div>
) : (
  <Link to={`/timelines/${scenarioId}/${team.id}`}>
    Edit Timeline
  </Link>
)}
```

---

## Phase 3: Add Basic Analytics (1 hour)

### 3.1 Create Analytics Tracking File

**File:** `/scenarios/analytics.json`

**Structure:**
```json
{
  "scenario_usage": {
    "maritime-crisis-01": {
      "total_deployments": 5,
      "last_deployment": "2025-01-15T14:30:00Z",
      "total_duration_minutes": 290,
      "average_duration_minutes": 58,
      "completion_count": 4
    }
  },
  "exercise_history": [
    {
      "scenario_id": "maritime-crisis-01",
      "start_time": "2025-01-15T14:30:00Z",
      "end_time": "2025-01-15T15:45:00Z",
      "duration_minutes": 75,
      "teams": ["blue", "red"],
      "injects_delivered": 5,
      "injects_total": 5,
      "completion_rate": 100,
      "stopped_early": false
    }
  ]
}
```

**Created/updated by backend when:**
- Exercise is deployed (increment deployment count)
- Exercise ends (add to history)
- Manual stop (mark as stopped_early)

---

### 3.2 Backend Endpoint for Analytics

**File:** `/orchestration/app/main.py`

**Add endpoints:**
```python
@app.get("/api/v1/analytics/scenarios")
def get_scenario_analytics():
    """Get usage statistics for all scenarios."""
    analytics_file = os.path.join(SCENARIOS_DIR, "analytics.json")

    if not os.path.exists(analytics_file):
        return {"scenario_usage": {}, "exercise_history": []}

    with open(analytics_file, 'r') as f:
        return json.load(f)

@app.get("/api/v1/analytics/scenarios/{scenario_id}")
def get_scenario_analytics_detail(scenario_id: str):
    """Get detailed analytics for a specific scenario."""
    analytics = get_scenario_analytics()

    return {
        "usage": analytics["scenario_usage"].get(scenario_id, {}),
        "history": [
            ex for ex in analytics["exercise_history"]
            if ex["scenario_id"] == scenario_id
        ]
    }
```

**Update exercise lifecycle to log analytics:**

In `deploy_scenario()`:
```python
# After successful deployment
update_analytics(scenario_name, "deployed")
```

In `stop_scenario()`:
```python
# Before cleanup
update_analytics(scenario_name, "completed", exercise_stats)
```

**Helper function:**
```python
def update_analytics(scenario_id: str, event: str, data: dict = None):
    analytics_file = os.path.join(SCENARIOS_DIR, "analytics.json")

    # Load existing
    if os.path.exists(analytics_file):
        with open(analytics_file, 'r') as f:
            analytics = json.load(f)
    else:
        analytics = {"scenario_usage": {}, "exercise_history": []}

    # Update based on event
    if event == "deployed":
        if scenario_id not in analytics["scenario_usage"]:
            analytics["scenario_usage"][scenario_id] = {
                "total_deployments": 0,
                "total_duration_minutes": 0,
                "completion_count": 0
            }
        analytics["scenario_usage"][scenario_id]["total_deployments"] += 1
        analytics["scenario_usage"][scenario_id]["last_deployment"] = datetime.now().isoformat()

    elif event == "completed":
        # Add to history
        analytics["exercise_history"].append(data)
        # Update usage stats
        analytics["scenario_usage"][scenario_id]["completion_count"] += 1
        # Calculate averages
        # ...

    # Save
    with open(analytics_file, 'w') as f:
        json.dump(analytics, f, indent=2)
```

---

### 3.3 Display Analytics in Scenario Workspace

**In `ScenarioWorkspacePage.tsx`:**

```typescript
const [analytics, setAnalytics] = useState<any>(null);

useEffect(() => {
  const fetchAnalytics = async () => {
    const res = await fetch(`http://localhost:8001/api/v1/analytics/scenarios/${scenarioId}`);
    const data = await res.json();
    setAnalytics(data);
  };
  fetchAnalytics();
}, [scenarioId]);

// In render (below scenario metadata):
{analytics && analytics.usage && (
  <div className="card p-4 mb-4 bg-surface-light">
    <h3 className="font-semibold text-text-primary mb-2">📊 Usage Statistics</h3>
    <div className="grid grid-cols-3 gap-4 text-sm">
      <div>
        <p className="text-text-muted">Deployments</p>
        <p className="text-2xl font-bold text-primary">
          {analytics.usage.total_deployments || 0}
        </p>
      </div>
      <div>
        <p className="text-text-muted">Avg Duration</p>
        <p className="text-2xl font-bold text-primary">
          {analytics.usage.average_duration_minutes || 0}m
        </p>
      </div>
      <div>
        <p className="text-text-muted">Last Used</p>
        <p className="text-sm text-text-secondary">
          {analytics.usage.last_deployment
            ? new Date(analytics.usage.last_deployment).toLocaleDateString()
            : 'Never'
          }
        </p>
      </div>
    </div>
  </div>
)}
```

---

## Phase 4: Navigation Updates (0.5 hours)

### 4.1 Update Sidebar/Navigation

**File:** `/client-dashboard/src/components/Sidebar.tsx` (or wherever nav is)

**Change from:**
- Scenarios
- Timelines ← REMOVE THIS
- Exercise Control
- Media Library

**To:**
- Scenarios
- Exercise Control
- Media Library

**Rationale:** Timelines are now accessed through Scenario Workspace, no need for separate nav item

---

### 4.2 Update Quick Guide in Timeline Viewer

**File:** `/client-dashboard/src/pages/TimelineViewerPage.tsx`

**Update breadcrumb/back link:**

From:
```typescript
<Link to="/timelines">Back to Timelines</Link>
```

To:
```typescript
<Link to={`/scenarios/${scenarioId}`}>
  ← Back to {scenarioName}
</Link>
```

Fetch scenario name:
```typescript
const [scenarioName, setScenarioName] = useState('Scenario');

useEffect(() => {
  const fetchScenario = async () => {
    const res = await fetch('http://localhost:8001/api/v1/scenarios');
    const data = await res.json();
    const scenario = data.scenarios.find(s => s.id === scenarioId);
    if (scenario) setScenarioName(scenario.name);
  };
  fetchScenario();
}, [scenarioId]);
```

---

## Phase 5: Polish & Testing (0.5 hours)

### 5.1 Error Handling

**In ScenarioWorkspacePage:**
- Handle scenario not found (404)
- Handle failed API calls
- Show loading states

### 5.2 Responsive Design

- Ensure team cards stack on mobile
- Analytics stats go vertical on small screens

### 5.3 Testing Checklist

**Navigation Flow:**
- [ ] Scenarios page → Click scenario → Opens workspace
- [ ] Workspace → Click "Edit Timeline" → Opens Timeline Viewer
- [ ] Timeline Viewer → Click back → Returns to workspace
- [ ] Workspace → Click "Deploy" → Deploys exercise
- [ ] Deployed exercise shows control widget in workspace
- [ ] Can pause/stop exercise from workspace

**Analytics:**
- [ ] Deploy exercise → Analytics increment
- [ ] Stop exercise → History logged
- [ ] Workspace shows correct stats
- [ ] Stats update after new deployment

**Existing Functionality:**
- [ ] Exercise Control standalone page still works
- [ ] Media Library untouched
- [ ] Timeline editing still works exactly the same
- [ ] Can still deploy from scenarios page (if keeping button)

---

## File Changes Summary

### New Files:
1. `/client-dashboard/src/pages/ScenarioWorkspacePage.tsx` (NEW)
2. `/client-dashboard/src/components/ExerciseControlWidget.tsx` (NEW)
3. `/scenarios/analytics.json` (NEW - created by backend)

### Modified Files:
1. `/client-dashboard/src/App.tsx` - Add route
2. `/client-dashboard/src/pages/ScenariosPage.tsx` - Change card links
3. `/client-dashboard/src/pages/TimelineViewerPage.tsx` - Update back link
4. `/client-dashboard/src/pages/ExerciseControlPage.tsx` - Extract widget (optional)
5. `/client-dashboard/src/components/Sidebar.tsx` - Remove Timelines nav
6. `/orchestration/app/main.py` - Add analytics endpoints & tracking

### No Changes:
- ✅ All timeline JSON files
- ✅ All scenario JSON files (structure stays same for now)
- ✅ Media Library
- ✅ Backend timeline/scenario APIs
- ✅ Team dashboard code

---

## Time Estimate

| Phase | Task | Time |
|-------|------|------|
| 1 | Create Scenario Workspace Page | 2h |
| 2 | Exercise Control Widget | 1h |
| 3 | Analytics Backend + Frontend | 1h |
| 4 | Navigation Updates | 0.5h |
| 5 | Testing & Polish | 0.5h |
| **Total** | | **5 hours** |

---

## Success Metrics

After implementation:
- ✅ Navigation has 3 items instead of 4-5
- ✅ Clear scenario → team → timeline workflow
- ✅ Exercise control visible in context
- ✅ Basic analytics show professional polish
- ✅ Zero breaking changes to existing features
- ✅ Foundation for future scenario metadata enhancements

---

## Future Enhancements (Not in Quick Wins)

**After this is working:**
1. Add scenario metadata fields (learning objectives, difficulty, etc.)
2. Exercise history page (detailed view of past exercises)
3. Scenario duplication feature
4. Export/import scenarios as ZIP
5. Briefing document uploads per scenario
6. Live exercise dashboard with charts
7. Team performance metrics
8. Scenario builder wizard

---

## Notes

- Keep it simple - don't over-engineer
- Analytics file can be enhanced later with more metrics
- Widget can be made fancier later (charts, graphs)
- Focus on clean workflow and professional appearance
- Client will be impressed by clean navigation + stats

**Ready to implement when you are!**
