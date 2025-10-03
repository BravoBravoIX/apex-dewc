# Client Dashboard Specifications

## Overview

The Client Dashboard is the control center for DEWC staff to configure, launch, and monitor multi-team exercises. It provides a web-based interface for managing scenarios, timelines, and real-time exercise execution.

## Navigation Structure

```
Left Sidebar Menu:
├── Dashboard (Home)
├── Scenarios
├── Inject Timelines
├── Exercise Control
├── Analytics
└── Settings
```

## Page Specifications

### 1. Dashboard (Home Page)

**Purpose**: Quick overview and rapid exercise launch

```
┌─────────────────────────────────────────────────┐
│ Welcome to DEWC Training Platform               │
├─────────────────────────────────────────────────┤
│ Quick Stats:                                    │
│ [3] Scenarios Available                         │
│ [12] Inject Timelines Created                   │
│ [0] Active Exercises                            │
│                                                  │
│ Quick Start:                                    │
│ ┌──────────────────────────────────────┐       │
│ │ Indo-Pacific Crisis                   │       │
│ │ Duration: 60 min | Max Teams: 10      │       │
│ │ [Configure & Launch →]                │       │
│ └──────────────────────────────────────┘       │
│                                                  │
│ Recent Activity:                                │
│ • Last exercise: 2 days ago                     │
│ • Teams deployed: 4                             │
│ • Success rate: 100%                            │
└─────────────────────────────────────────────────┘
```

### 2. Scenarios Page

**Purpose**: Browse and select available exercise scenarios

```
┌─────────────────────────────────────────────────┐
│ Available Scenarios                             │
├─────────────────────────────────────────────────┤
│ ┌────────────────────────────────────┐         │
│ │ Cyber Attack Response              │         │
│ │ Duration: 45 min | Max Teams: 10   │         │
│ │ Last run: Never                    │         │
│ │ [Configure]                        │         │
│ └────────────────────────────────────┘         │
│                                                  │
│ ┌────────────────────────────────────┐         │
│ │ Maritime Crisis                    │         │
│ │ Duration: 60 min | Max Teams: 10   │         │
│ │ Last run: 3 days ago               │         │
│ │ [Configure]                        │         │
│ └────────────────────────────────────┘         │
└─────────────────────────────────────────────────┘
```

### 3. Inject Timelines Page

**Purpose**: Create and manage reusable inject timelines

```
┌─────────────────────────────────────────────────┐
│ Inject Timelines                 [+ Create New] │
├─────────────────────────────────────────────────┤
│ Search: [___________] Filter: [All Types ▼]    │
│                                                  │
│ ┌────────────────────────────────────┐         │
│ │ Timeline: "Blue Team Standard"     │         │
│ │ ID: blue-standard                  │         │
│ │ Injections: 15                     │         │
│ │ Duration: 45 min                   │         │
│ │ Types: 📱 5  📧 4  📺 3  📄 3      │         │
│ │ [View] [Edit] [Duplicate] [Delete] │         │
│ └────────────────────────────────────┘         │
└─────────────────────────────────────────────────┘
```

### 4. Exercise Configuration Wizard

**Purpose**: Multi-step configuration before exercise launch

#### Step 1: Team Setup
```
┌─────────────────────────────────────────────────┐
│ Configure Teams                    (Step 1 of 3)│
├─────────────────────────────────────────────────┤
│ Add up to 10 teams for this exercise:           │
│                                                  │
│ Team 1:                                          │
│ ID: [blue_____] Name: [Blue Team_______]        │
│ Color: [🔵 Blue ▼]                              │
│                                                  │
│ Team 2:                                          │
│ ID: [red______] Name: [Red Team________]        │
│ Color: [🔴 Red ▼]                               │
│                                                  │
│ [+ Add Another Team]                            │
│                                                  │
│ [Back] [Next: Assign Timelines →]               │
└─────────────────────────────────────────────────┘
```

#### Step 2: Timeline Assignment
```
┌─────────────────────────────────────────────────┐
│ Assign Inject Timelines            (Step 2 of 3)│
├─────────────────────────────────────────────────┤
│ Assign a timeline to each team:                 │
│                                                  │
│ Blue Team:    [Blue Team Standard ▼]            │
│ Red Team:     [Red Team Aggressive ▼]           │
│ Orange Team:  [Custom Timeline 3 ▼]             │
│ Green Team:   [Blue Team Standard ▼]            │
│                                                  │
│ ⓘ Teams can share the same timeline             │
│                                                  │
│ [← Back] [Next: Review & Deploy →]              │
└─────────────────────────────────────────────────┘
```

#### Step 3: Review & Deploy
```
┌─────────────────────────────────────────────────┐
│ Review Configuration                (Step 3 of 3)│
├─────────────────────────────────────────────────┤
│ Exercise: Cyber Attack Response                 │
│ Duration: 45 minutes                            │
│                                                  │
│ Teams & Timelines:                              │
│ • Blue Team → Blue Team Standard (15 injects)   │
│ • Red Team → Red Team Aggressive (22 injects)   │
│ • Orange Team → Custom Timeline 3 (18 injects)  │
│ • Green Team → Blue Team Standard (15 injects)  │
│                                                  │
│ ⚠️ Deploying will start 4 Docker containers     │
│                                                  │
│ [← Back] [💾 Save Config] [🚀 Deploy]           │
└─────────────────────────────────────────────────┘
```

### 5. Exercise Control Page

**Purpose**: Real-time exercise monitoring and control

```
┌──────────────────────────────────────────────────────────────────┐
│ Exercise Control - Cyber Attack Response                         │
├──────────────────────────────────────────────────────────────────┤
│ ⏱️ Global Timer: T+05:32 / 45:00                                │
│ [▶️ START] [⏸ PAUSE] [⏹ STOP] [🔄 RESET]                       │
│                                                                   │
│ Team Dashboard Status:                                           │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Team      │ Port  │ MQTT │ Timeline        │ Delivered/Total│ │
│ ├───────────┼───────┼──────┼─────────────────┼────────────────┤ │
│ │ Blue      │ 3142  │ ✅   │ blue-standard   │ 3/15          │ │
│ │ Red       │ 3789  │ ✅   │ red-aggressive  │ 5/22          │ │
│ │ Orange    │ 3567  │ ✅   │ blue-standard   │ 3/15          │ │
│ │ Green     │ 3901  │ ⚠️   │ custom-timeline │ 2/18 (1 miss) │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ Synchronized Timeline View:                                      │
│ ──────────█────────────────────────────────────── T+5:32       │
│                                                                   │
│ Recently Delivered (All Teams):                                  │
│ ✅ T+5:00  SMS delivered to Blue, Orange, Green                 │
│ ✅ T+2:00  Email delivered to All Teams                         │
│ ✅ T+1:00  Tweet delivered to Blue, Red                         │
│                                                                   │
│ Upcoming Injects:                                                │
│ ⏳ T+10:00 Video to Blue, Orange (in 4:28)                     │
│ ⏳ T+15:00 Document to Red (in 9:28)                           │
│                                                                   │
│ Missed/Failed Injects:                                           │
│ ⚠️ T+5:00  SMS to Green - Connection lost [Resend]             │
│                                                                   │
│ [View Team: Blue ↗] [Red ↗] [Orange ↗] [Green ↗]              │
└──────────────────────────────────────────────────────────────────┘
```

## Timeline Editor Interface

### Timeline List View
- Grid or list display of all timelines
- Search and filter capabilities
- Quick stats (inject count, duration)
- Action buttons (View, Edit, Duplicate, Delete)

### Timeline Edit View
```
┌──────────────────────────────────────────────────────────────────┐
│ Edit Timeline: "blue-standard"                                   │
├──────────────────────────────────────────────────────────────────┤
│ Timeline Settings:                                               │
│ Name: [Blue Team Standard_____________]                          │
│ Description: [Standard timeline for blue team scenarios_______]  │
│                                                                   │
│ Inject Schedule:                                                 │
│ ┌────────┬──────────┬────────────────────────┬────────────────┐ │
│ │ Time   │ Type     │ Content                │ Actions        │ │
│ ├────────┼──────────┼────────────────────────┼────────────────┤ │
│ │ T+0    │ 📰 News  │ Exercise briefing      │ [Edit] [Delete]│ │
│ │ T+1    │ 📱 Tweet │ "Cyber attack..."      │ [Edit] [Delete]│ │
│ │ T+2    │ 📧 Email │ Urgent memo            │ [Edit] [Delete]│ │
│ │ T+5    │ 💬 SMS   │ "Code RED..."          │ [Edit] [Delete]│ │
│ │ T+10   │ 🎥 Video │ news-report.mp4        │ [Edit] [Delete]│ │
│ └────────┴──────────┴────────────────────────┴────────────────┘ │
│                                                                   │
│ [+ Add Inject] [Import JSON] [Export JSON]                      │
│                                                                   │
│ [💾 Save Timeline] [Save As New] [Cancel]                       │
└──────────────────────────────────────────────────────────────────┘
```

### Add/Edit Inject Modal
```
┌──────────────────────────────────────────────────────────────────┐
│ Add Inject to Timeline                                           │
├──────────────────────────────────────────────────────────────────┤
│ Time: T+ [5___] minutes                                          │
│                                                                   │
│ Type: [SMS ▼]                                                    │
│                                                                   │
│ Content:                                                          │
│ ┌────────────────────────────────────────┐                      │
│ │ From: [+61 400 123 456_______________] │                      │
│ │                                        │                      │
│ │ Message:                               │                      │
│ │ [Code RED activated. All teams        │                      │
│ │  report status immediately.           │                      │
│ │ _____________________________________] │                      │
│ └────────────────────────────────────────┘                      │
│                                                                   │
│ OR Upload Media:                                                 │
│ [Choose File] No file selected                                   │
│                                                                   │
│ File will be saved to: /media/exercises/current/                 │
│                                                                   │
│ [Add to Timeline] [Cancel]                                       │
└──────────────────────────────────────────────────────────────────┘
```

## Key Features

### Exercise Management
- Multi-step configuration wizard
- Team creation and color assignment
- Timeline assignment per team
- Pre-deployment review
- One-click deployment

### Timeline Management
- Create reusable inject timelines
- Table-based inject scheduling
- Support for multiple content types
- Import/Export JSON format
- Timeline duplication

### Real-Time Monitoring
- Global exercise timer
- Team connection status
- MQTT health indicators
- Inject delivery tracking
- Failed inject management
- Manual resend capability

### Team Dashboard Access
- Automatic port assignment
- Direct dashboard links
- Connection status monitoring
- Quick access buttons

## User Interactions

### Starting an Exercise
1. Select scenario from dashboard or scenarios page
2. Configure teams (names, colors)
3. Assign timelines to teams
4. Review configuration
5. Deploy team dashboards
6. Start exercise timer

### Creating a Timeline
1. Navigate to Inject Timelines
2. Click "Create New"
3. Add inject entries with timing
4. Configure content for each inject
5. Save timeline with unique ID

### Monitoring Exercise
1. View real-time timer
2. Track inject delivery status
3. Monitor team connections
4. Handle failed deliveries
5. Access team dashboards

## Data Management

### Timeline Storage
- Stored as JSON files
- Located in `/media/exercises/{exercise-id}/timelines/`
- Can be imported/exported
- Reusable across exercises

### Media Files
- Uploaded through inject editor
- Stored in `/media/exercises/{exercise-id}/`
- Organized by type (images, videos, documents)
- Referenced by path in inject content

## Error Handling

### Failed Inject Delivery
- Automatic retry attempts
- Visual indication of failures
- Manual resend button
- Failure reason display

### Connection Issues
- Team dashboard disconnection alerts
- MQTT broker status monitoring
- Automatic reconnection attempts
- Manual intervention options

## Performance Considerations

- Support 10+ simultaneous teams
- Real-time updates every second
- Minimal UI latency
- Efficient timeline loading
- Optimized media delivery
