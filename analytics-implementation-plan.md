# Analytics Page Implementation Plan

## Overview
Build a comprehensive analytics dashboard to visualize APEX exercise usage, performance metrics, and trends using existing data from `scenarios/data/analytics.json`.

## Current State Analysis

### Existing Data Structure
```json
{
  "scenario_usage": {
    "scenario-id": {
      "total_deployments": 34,
      "total_duration_minutes": 0,
      "completion_count": 0,
      "average_duration_minutes": 0,
      "last_deployment": "2025-10-02T04:08:47.195308"
    }
  },
  "exercise_history": []
}
```

### Available Data Points
- Total deployments per scenario
- Last deployment timestamp
- Duration tracking (currently 0 - not being captured)
- Completion counts (currently 0)

### Limitations
- `exercise_history` array is empty - no per-exercise session data
- Duration/completion tracking not implemented yet

## Implementation Phases

---

## Phase 1: Backend API Endpoint

### 1.1 Create Analytics API Endpoint
**File:** `/orchestration/app/main.py`

**Add new endpoint:**
```python
@app.get("/api/v1/analytics")
async def get_analytics():
    """
    Returns analytics data for the dashboard
    """
    analytics = load_analytics()

    # Calculate aggregate metrics
    total_deployments = sum(
        scenario.get("total_deployments", 0)
        for scenario in analytics.get("scenario_usage", {}).values()
    )

    # Get scenario list with names
    scenarios_with_data = []
    for scenario_id, data in analytics.get("scenario_usage", {}).items():
        scenario_file = os.path.join(SCENARIOS_DIR, f"{scenario_id}.json")
        scenario_name = scenario_id

        if os.path.exists(scenario_file):
            try:
                with open(scenario_file, 'r') as f:
                    scenario_json = json.load(f)
                    scenario_name = scenario_json.get("name", scenario_id)
            except:
                pass

        scenarios_with_data.append({
            "id": scenario_id,
            "name": scenario_name,
            "deployments": data.get("total_deployments", 0),
            "last_deployment": data.get("last_deployment"),
            "avg_duration": data.get("average_duration_minutes", 0),
            "completion_count": data.get("completion_count", 0)
        })

    # Sort by deployments descending
    scenarios_with_data.sort(key=lambda x: x["deployments"], reverse=True)

    return {
        "total_deployments": total_deployments,
        "total_scenarios": len(scenarios_with_data),
        "scenarios": scenarios_with_data,
        "exercise_history": analytics.get("exercise_history", [])
    }
```

**Testing:** `curl http://localhost:8001/api/v1/analytics | jq`

---

## Phase 2: Frontend Setup

### 2.1 Install Chart Library
**File:** `/client-dashboard/package.json`

**Run:**
```bash
cd client-dashboard
npm install recharts
```

**Library choice:** Recharts
- React-native charting library
- Clean, simple API
- Good TypeScript support
- Works well with dark themes

### 2.2 Create Types
**File:** `/client-dashboard/src/types/analytics.ts`

```typescript
export interface ScenarioAnalytics {
  id: string;
  name: string;
  deployments: number;
  last_deployment: string | null;
  avg_duration: number;
  completion_count: number;
}

export interface AnalyticsData {
  total_deployments: number;
  total_scenarios: number;
  scenarios: ScenarioAnalytics[];
  exercise_history: any[];
}
```

---

## Phase 3: Analytics Components

### 3.1 Stats Cards Component
**File:** `/client-dashboard/src/components/analytics/StatsCards.tsx`

**Purpose:** Display key metrics at top of page

**Metrics:**
- Total Deployments
- Active Scenarios
- Most Used Scenario
- Recent Activity (days since last deployment)

**Layout:** 4-column grid on desktop, stack on mobile

### 3.2 Deployment Chart Component
**File:** `/client-dashboard/src/components/analytics/DeploymentChart.tsx`

**Chart Type:** Bar chart (horizontal)

**Data:** Deployments per scenario

**Features:**
- Color-coded bars
- Scenario name labels
- Deployment count values
- Responsive design

### 3.3 Usage Table Component
**File:** `/client-dashboard/src/components/analytics/UsageTable.tsx`

**Columns:**
- Scenario Name
- Total Deployments
- Last Deployed (relative time: "2 hours ago")
- Avg Duration
- Completion Rate

**Features:**
- Sortable columns
- Search/filter
- Pagination (if >10 scenarios)

### 3.4 Recent Activity Component
**File:** `/client-dashboard/src/components/analytics/RecentActivity.tsx`

**Purpose:** Timeline of recent deployments

**Data:** Last 5-10 deployments across all scenarios

**Display:**
- Scenario name
- Timestamp (relative)
- Status indicator

---

## Phase 4: Analytics Page Implementation

### 4.1 Update Analytics Page
**File:** `/client-dashboard/src/pages/AnalyticsPage.tsx`

**Layout:**
```
┌─────────────────────────────────────────┐
│  Stats Cards (4 metrics)                │
├─────────────────────┬───────────────────┤
│                     │                   │
│  Deployment Chart   │  Recent Activity  │
│  (Bar Chart)        │  (Timeline)       │
│                     │                   │
├─────────────────────┴───────────────────┤
│  Usage Table (Full Width)               │
│                                         │
└─────────────────────────────────────────┘
```

**State Management:**
- Fetch data on mount
- Auto-refresh every 30 seconds
- Loading states
- Error handling

**Code Structure:**
```typescript
const AnalyticsPage = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/v1/analytics');
      const data = await res.json();
      setAnalytics(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load analytics');
      setLoading(false);
    }
  };

  // Render components...
};
```

---

## Phase 5: Styling & Theme Integration

### 5.1 Chart Theme Configuration
**Match existing dark theme:**
- Background: `--color-surface`
- Text: `--color-text-primary`
- Primary color: `--color-primary`
- Grid lines: `--color-border`

### 5.2 Responsive Design
- Desktop: 2-column layout for chart + activity
- Tablet: Stack chart above activity
- Mobile: Single column, simplified charts

---

## Phase 6: Optional Enhancements

### 6.1 Export Functionality
**Add export buttons:**
- Export table to CSV
- Export chart as PNG
- Generate PDF report

### 6.2 Date Range Filter
**Add controls:**
- Last 7 days
- Last 30 days
- Last 90 days
- All time

*Note: Requires exercise_history data*

### 6.3 Real-time Updates
**WebSocket integration:**
- Live deployment notifications
- Auto-update charts when exercises start/stop

*Note: Lower priority, current 30s polling is sufficient*

---

## Implementation Steps

### Step 1: Backend (15 minutes)
1. Add analytics endpoint to `main.py`
2. Test endpoint returns correct data
3. Rebuild orchestration container

### Step 2: Frontend Setup (10 minutes)
1. Install recharts: `npm install recharts`
2. Create types file
3. Rebuild client-dashboard container

### Step 3: Components (30 minutes)
1. Create StatsCards component (10 min)
2. Create DeploymentChart component (10 min)
3. Create UsageTable component (10 min)

### Step 4: Page Integration (15 minutes)
1. Update AnalyticsPage.tsx
2. Add data fetching logic
3. Compose components into layout

### Step 5: Styling (10 minutes)
1. Apply theme colors to charts
2. Ensure responsive layout
3. Add loading/error states

### Step 6: Testing (10 minutes)
1. Test with current data
2. Verify auto-refresh works
3. Check mobile responsiveness
4. Validate all calculations

**Total Time Estimate: 90 minutes**

---

## Testing Checklist

### Data Validation
- [ ] Total deployments match sum of individual scenarios
- [ ] Scenario names display correctly
- [ ] Last deployment timestamps formatted properly
- [ ] Chart displays all scenarios

### Functionality
- [ ] Page loads without errors
- [ ] Data refreshes every 30 seconds
- [ ] Loading states show correctly
- [ ] Error handling works if API fails
- [ ] Charts are interactive (tooltips, hover states)

### UI/UX
- [ ] Matches APEX theme
- [ ] Responsive on mobile/tablet/desktop
- [ ] Stats cards are readable
- [ ] Chart labels don't overlap
- [ ] Table is sortable

### Performance
- [ ] Page loads quickly (<2s)
- [ ] No memory leaks from auto-refresh
- [ ] Charts render smoothly

---

## Future Improvements

### When exercise_history is populated:
1. **Trend Charts**
   - Deployments over time (line chart)
   - Peak usage hours (heatmap)
   - Exercise duration distribution

2. **Team Analytics**
   - Performance metrics per team
   - Response time analysis
   - Inject completion rates

3. **Comparison Tools**
   - Compare scenarios side-by-side
   - Benchmark against historical averages

### Backend Changes Required:
- Modify exercise deployment to log start time
- Modify exercise stop/complete to log end time and status
- Add to `exercise_history` array:
  ```json
  {
    "exercise_id": "uuid",
    "scenario_id": "maritime-crisis-scenario",
    "start_time": "2025-10-02T10:00:00Z",
    "end_time": "2025-10-02T11:30:00Z",
    "duration_minutes": 90,
    "status": "completed",
    "teams": ["blue", "red"]
  }
  ```

---

## Risk Mitigation

### If Analytics API Fails:
- Display fallback message: "Analytics temporarily unavailable"
- Don't crash page
- Retry automatically

### If Chart Library Issues:
- Fallback to simple table view
- Can always display raw data even without charts

### If Data is Empty:
- Show "No analytics data yet" message
- Display placeholder cards with 0 values
- Encourage deploying first exercise

---

## Success Criteria

✅ Analytics page displays current deployment data
✅ Charts are visually appealing and match theme
✅ Data updates automatically without refresh
✅ Page is responsive across devices
✅ No impact on existing exercise functionality
✅ Implementation complete in <2 hours

---

## Dependencies

### NPM Packages:
- `recharts` - Chart library
- `date-fns` - Date formatting (may already be installed)

### API Endpoints:
- `/api/v1/analytics` (new)
- `/api/v1/scenarios` (existing - for scenario names)

### Files to Create:
- `/orchestration/app/main.py` - Add endpoint
- `/client-dashboard/src/types/analytics.ts`
- `/client-dashboard/src/components/analytics/StatsCards.tsx`
- `/client-dashboard/src/components/analytics/DeploymentChart.tsx`
- `/client-dashboard/src/components/analytics/UsageTable.tsx`
- `/client-dashboard/src/pages/AnalyticsPage.tsx` - Update existing

### Files to Modify:
- `/client-dashboard/package.json` - Add recharts

---

## Rollback Plan

If issues arise:
1. Remove analytics endpoint from orchestration
2. Revert AnalyticsPage.tsx to empty state
3. Remove recharts from package.json
4. Rebuild containers

**Time to rollback: ~5 minutes**

---

## Conclusion

This implementation provides a solid analytics foundation using existing data, with clear paths for enhancement as more data becomes available. The isolated nature of the changes ensures minimal risk to core exercise functionality.
