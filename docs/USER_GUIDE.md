# SCIP v3 User Guide for DEWC Staff

## Introduction

Welcome to the SCIP v3 Training Platform. This guide provides step-by-step instructions for Defence Electronics Warfare Centre (DEWC) staff to configure and run multi-team training exercises.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Creating Timelines](#creating-timelines)
3. [Configuring Exercises](#configuring-exercises)
4. [Running Exercises](#running-exercises)
5. [Monitoring Teams](#monitoring-teams)
6. [Troubleshooting](#troubleshooting)
7. [Best Practices](#best-practices)

## Getting Started

### Accessing the Platform

1. Open your web browser and navigate to the DEWC training platform:
   ```
   http://training.dewc.local
   ```

2. Log in with your DEWC credentials:
   - Username: Your DEWC username
   - Password: Your assigned password

3. You'll arrive at the Dashboard showing:
   - Available scenarios
   - Recent exercise activity
   - Quick start options

### Understanding the Interface

The platform consists of several key areas:

- **Dashboard**: Home page with overview and quick actions
- **Scenarios**: Pre-built exercise scenarios
- **Inject Timelines**: Library of inject sequences
- **Exercise Control**: Live exercise management
- **Analytics**: Post-exercise analysis (Phase 2)

## Creating Timelines

Timelines define what information each team receives and when during an exercise.

### Step 1: Navigate to Inject Timelines

1. Click **Inject Timelines** in the left menu
2. You'll see a list of existing timelines
3. Click **[+ Create New]** to create a new timeline

### Step 2: Configure Timeline Settings

1. Enter timeline details:
   - **ID**: Unique identifier (e.g., `blue-cyber-response`)
   - **Name**: Descriptive name (e.g., "Blue Team Cyber Response")
   - **Description**: Brief explanation of the timeline's purpose

2. The timeline editor will open showing an empty inject schedule

### Step 3: Add Injects

For each inject you want to add:

1. Click **[+ Add Inject]**

2. Configure inject timing:
   - **Time**: Enter the time in minutes (e.g., `T+5` for 5 minutes after start)

3. Select inject type:
   - **News**: News article with headline and body
   - **Social Media**: Twitter-style posts
   - **SMS**: Text messages
   - **Email**: Email messages
   - **Intelligence**: Classified reports

4. Enter content based on type:

#### News Inject Example:
```
Headline: Cyber Attack Disrupts Banking Services
Source: Reuters
Body: Multiple financial institutions report service disruptions...
Image: [Choose File] (optional)
```

#### Social Media Inject Example:
```
Platform: Twitter
Username: @BreakingTech
Verified: ✓
Text: BREAKING: Major banks offline. Customers unable to access accounts.
Likes: 5234
Retweets: 1823
```

#### SMS Inject Example:
```
From: +61 400 123 456
Text: Code RED activated. All teams report status immediately.
```

#### Email Inject Example:
```
From: operations.director@defence.gov.au
To: Blue Team
Subject: URGENT: Immediate Action Required
Body: Implement Protocol 7 immediately...
Attachments: [Choose File] (optional)
```

5. Click **[Add to Timeline]**

### Step 4: Save Timeline

1. Review your inject schedule
2. Click **[💾 Save Timeline]** to save
3. Or click **[Save As New]** to create a copy with different ID

### Example Timeline Structure

A typical 45-minute timeline might include:

| Time | Type | Content |
|------|------|---------|
| T+0 | News | Exercise briefing |
| T+1 | Tweet | First indication of crisis |
| T+2 | Email | Official notification |
| T+5 | SMS | Emergency alert |
| T+10 | Video | News broadcast |
| T+15 | Intel | Classified report |
| T+20 | News | Situation update |
| T+30 | Email | Decision request |
| T+40 | Tweet | Public reaction |
| T+45 | News | Exercise conclusion |

## Configuring Exercises

### Step 1: Select a Scenario

1. From the Dashboard or Scenarios page, find your desired scenario
2. Click **[Configure]** on the scenario card

### Step 2: Configure Teams (Configuration Wizard - Step 1)

1. Add teams participating in the exercise:

   **Team 1:**
   - ID: `blue` (lowercase, no spaces)
   - Name: `Blue Team`
   - Color: Select from dropdown (e.g., 🔵 Blue)

   **Team 2:**
   - ID: `red`
   - Name: `Red Team`
   - Color: Select from dropdown (e.g., 🔴 Red)

2. Click **[+ Add Another Team]** to add more teams (up to 10)

3. Click **[Next: Assign Timelines →]**

### Step 3: Assign Timelines (Configuration Wizard - Step 2)

1. For each team, select a timeline from the dropdown:
   - Blue Team: `Blue Team Standard`
   - Red Team: `Red Team Aggressive`
   - Orange Team: `Custom Timeline 3`
   - Green Team: `Blue Team Standard` (teams can share timelines)

2. Click **[← Back]** to modify teams
3. Click **[Next: Review & Deploy →]** to continue

### Step 4: Review & Deploy (Configuration Wizard - Step 3)

1. Review your configuration:
   - Exercise name and duration
   - Team assignments
   - Timeline selections
   - Number of containers to deploy

2. Options:
   - **[← Back]**: Return to modify configuration
   - **[💾 Save Config]**: Save configuration for later use
   - **[🚀 Deploy]**: Deploy team dashboards and prepare exercise

3. Click **[🚀 Deploy]** when ready

### Step 5: Deployment Process

1. The system will:
   - Create Docker containers for each team
   - Assign unique ports (3100-3200 range)
   - Configure MQTT topics
   - Load timeline data

2. Wait for deployment to complete (typically 10-30 seconds)

3. You'll be redirected to the Exercise Control page

## Running Exercises

### Exercise Control Interface

Once deployed, you'll see the Exercise Control page with:

- **Global Timer**: Shows current exercise time (e.g., T+05:32 / 45:00)
- **Control Buttons**: START, PAUSE, STOP, RESET
- **Team Dashboard Status**: Connection status and inject delivery
- **Timeline View**: Visual progress indicator
- **Recent/Upcoming Injects**: What's been delivered and what's next

### Starting the Exercise

1. Verify all teams show **✅ Ready** status
2. Click **[▶️ START]** to begin the exercise
3. The timer will start counting from T+00:00
4. Injects will automatically deliver according to timeline schedules

### During the Exercise

Monitor the following:

#### Team Status Table:
```
Team      | Port  | MQTT | Timeline        | Delivered/Total
----------|-------|------|-----------------|----------------
Blue      | 3142  | ✅   | blue-standard   | 3/15
Red       | 3789  | ✅   | red-aggressive  | 5/22
Orange    | 3567  | ✅   | blue-standard   | 3/15
Green     | 3901  | ⚠️   | custom-timeline | 2/18 (1 miss)
```

#### Recently Delivered:
- ✅ T+5:00 SMS delivered to Blue, Orange, Green
- ✅ T+2:00 Email delivered to All Teams
- ✅ T+1:00 Tweet delivered to Blue, Red

#### Upcoming Injects:
- ⏳ T+10:00 Video to Blue, Orange (in 4:28)
- ⏳ T+15:00 Document to Red (in 9:28)

### Viewing Team Dashboards

1. Click **[View Team: Blue ↗]** to open team dashboard in new tab
2. Team dashboards show isolated feeds:
   - Left menu: Social, News, SMS, Email, Intel
   - Main area: Feed content
   - Header: Team name and exercise timer

### Handling Issues

#### If a team loses connection:
1. Note the ⚠️ warning icon in team status
2. Check "Missed/Failed Injects" section
3. Click **[Resend]** to manually retry delivery
4. Team will receive missed content when reconnected

#### To pause the exercise:
1. Click **[⏸ PAUSE]**
2. Timer stops for all teams
3. No new injects delivered
4. Click **[▶️ RESUME]** to continue

#### To stop the exercise:
1. Click **[⏹ STOP]**
2. Confirm stop action
3. Exercise ends for all teams
4. Team dashboards remain accessible for review

## Monitoring Teams

### Real-Time Monitoring

During an exercise, monitor:

1. **Connection Status**
   - Green checkmark (✅): Connected and receiving
   - Warning sign (⚠️): Connection issue
   - Red X (❌): Disconnected

2. **Inject Delivery**
   - Shows X/Y format (delivered/total)
   - Updates in real-time as injects are sent

3. **Timer Synchronization**
   - All teams operate on same global timer
   - Displayed as T+MM:SS format

### Team Dashboard Features

Each team dashboard provides:

1. **Feed Categories** (Left Menu)
   - 📱 Social (Twitter-style posts)
   - 📰 News (News articles)
   - 💬 SMS (Text messages)
   - 📧 Email (Email messages)
   - 📄 Intel (Intelligence reports)

2. **Feed Content** (Main Area)
   - Chronological display
   - Most recent at top
   - Unread count badges

3. **Team Identity**
   - Team color in header
   - Team name displayed
   - Exercise timer synchronized

## Troubleshooting

### Common Issues and Solutions

#### Team Dashboard Won't Load
**Problem**: Clicking team link shows error or blank page

**Solution**:
1. Check team status shows ✅ Ready
2. Verify port number is correct
3. Try refreshing the page
4. Check browser allows popups

#### Injects Not Delivering
**Problem**: Timer running but teams not receiving content

**Solution**:
1. Check MQTT status in team table
2. Verify timeline has injects at current time
3. Look for failed injects section
4. Use manual resend if needed

#### Exercise Won't Start
**Problem**: START button doesn't work

**Solution**:
1. Ensure all teams deployed successfully
2. Check no other exercise is running
3. Verify browser has JavaScript enabled
4. Try refreshing the control page

#### Team Disconnected During Exercise
**Problem**: Team shows ⚠️ or ❌ during exercise

**Solution**:
1. Note which injects were missed
2. Check network connectivity
3. Team dashboard will auto-reconnect
4. Manually resend missed injects

#### Wrong Timeline Assigned
**Problem**: Team receiving wrong injects

**Solution**:
1. STOP the exercise
2. Return to configuration
3. Reassign correct timeline
4. Redeploy and restart

### Getting Help

If you encounter issues:

1. **Check Logs**: Note any error messages displayed
2. **Document Issue**: Record exercise ID, team affected, and time
3. **Contact Support**: Email support@cyberops.io with details
4. **Emergency Stop**: Use STOP button if exercise must end

## Best Practices

### Timeline Design

1. **Pacing**
   - Start slow, increase intensity
   - Allow 2-3 minutes between major injects
   - Cluster related injects together
   - End with clear resolution

2. **Content Variety**
   - Mix different inject types
   - Vary sources and perspectives
   - Include conflicting information
   - Add realistic noise/distractions

3. **Realism**
   - Use believable timestamps
   - Include typos in social media
   - Vary engagement metrics
   - Reference real organizations

### Exercise Configuration

1. **Team Setup**
   - Use descriptive team names
   - Choose distinct colors
   - Keep team sizes balanced
   - Document team roles

2. **Timeline Selection**
   - Match timeline to team expertise
   - Consider exercise objectives
   - Test new timelines first
   - Keep backup timelines ready

### Exercise Execution

1. **Pre-Exercise**
   - Brief participants 15 minutes before
   - Verify all systems operational
   - Have technical support ready
   - Document exercise parameters

2. **During Exercise**
   - Monitor all teams continuously
   - Document any issues
   - Avoid unnecessary pauses
   - Let scenarios play out

3. **Post-Exercise**
   - Stop exercise cleanly
   - Save exercise data
   - Conduct immediate hot-wash
   - Document lessons learned

### Media Management

1. **File Organization**
   - Use descriptive filenames
   - Organize by type (images/videos/docs)
   - Keep file sizes reasonable
   - Test media before exercise

2. **Content Creation**
   - Prepare media in advance
   - Use consistent styling
   - Check spelling and grammar
   - Verify classification markings

## Quick Reference

### Keyboard Shortcuts
- `Space`: Start/Pause exercise
- `S`: Stop exercise
- `R`: Reset exercise
- `T`: Focus on timer
- `1-9`: View team 1-9

### Time Format
- `T+0`: Exercise start
- `T+5`: 5 minutes after start
- `T+45`: 45 minutes (typical end)

### Status Icons
- ✅ Ready/Connected
- ⚠️ Warning/Issue
- ❌ Error/Disconnected
- ⏳ Pending/Upcoming
- 🔴 Live indicator

### Port Ranges
- Client Dashboard: 3000
- Team Dashboards: 3100-3200
- API: 8000
- Orchestration: 8001
- MQTT: 1883 (TCP), 9001 (WebSocket)

## Appendix: Sample Timelines

### Basic 30-Minute Timeline
```
T+0  - Briefing (News)
T+2  - First indication (Social)
T+5  - Official alert (Email)
T+10 - Media coverage (Video)
T+15 - Update (News)
T+20 - Decision point (Email)
T+25 - Resolution (News)
T+30 - Conclusion (Email)
```

### Intensive 60-Minute Timeline
```
T+0  - Briefing
T+1  - Social media rumors
T+3  - News flash
T+5  - Official notification
T+8  - Conflicting reports
T+10 - Video evidence
T+12 - Intelligence update
T+15 - Decision point 1
T+20 - Escalation
T+25 - Public panic (social)
T+30 - Government response
T+35 - International reaction
T+40 - Decision point 2
T+45 - Crisis peak
T+50 - De-escalation
T+55 - Resolution
T+60 - After-action
```

## Conclusion

The SCIP v3 platform provides powerful capabilities for multi-team training exercises. With proper preparation and execution, you can create realistic, challenging scenarios that test team coordination and decision-making under pressure.

For additional support or advanced features, contact the CyberOps development team.
