# Team Dashboard Specifications

## Overview

Team Dashboards are isolated interfaces deployed for each team during an exercise. They receive injects via MQTT and display them in categorized feeds, simulating real-world information channels during crisis scenarios.

## Interface Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ 🔵 Blue Team Dashboard                    Timer: T+05:32        │
├──────────────────────────────────────────────────────────────────┤
│ ┌────────────┬──────────────────────────────────────────────┐   │
│ │            │                                              │   │
│ │ Navigation │              Content Area                     │   │
│ │            │                                              │   │
│ │ 📱 Social  │  [Content displays here based on             │   │
│ │    (2)     │   selected navigation item]                  │   │
│ │            │                                              │   │
│ │ 📰 News    │                                              │   │
│ │    (1)     │                                              │   │
│ │            │                                              │   │
│ │ 💬 SMS     │                                              │   │
│ │    (1)     │                                              │   │
│ │            │                                              │   │
│ │ 📧 Email   │                                              │   │
│ │    (1)     │                                              │   │
│ │            │                                              │   │
│ │ 📄 Intel   │                                              │   │
│ │    (0)     │                                              │   │
│ │            │                                              │   │
│ └────────────┴──────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Feed Types

### 1. Social Media Feed

Displays social media posts (Twitter-style) with engagement metrics.

```
┌──────────────────────────────────────────┐
│ @BreakingNews ✓ - T+1:00 (4 min ago)     │
│ Cyber attack confirmed at major           │
│ financial institutions. Customers          │
│ advised to change passwords.              │
│ 🔄 2.1K  💬 834  ❤️ 5.2K                 │
└──────────────────────────────────────────┘
```

**Content Structure:**
- Username with verification badge
- Timestamp (exercise time and real time ago)
- Post text content
- Optional image attachment
- Engagement metrics (retweets, comments, likes)

### 2. News Feed

Traditional news articles with headlines and body text.

```
┌──────────────────────────────────────────┐
│ 📰 BREAKING NEWS                         │
│                                          │
│ Cyber Attack Disrupts Banking Services   │
│ Reuters - T+5:00                         │
│                                          │
│ [Image: Bank headquarters]               │
│                                          │
│ Multiple financial institutions have     │
│ reported widespread service disruptions  │
│ following what appears to be a          │
│ coordinated cyber attack...             │
│                                          │
│ [Continue Reading →]                     │
└──────────────────────────────────────────┘
```

**Content Structure:**
- News source and timestamp
- Headline
- Featured image (optional)
- Article body (truncated)
- Video embed (optional)

### 3. SMS Feed

Text message display with sender information.

```
┌──────────────────────────────────────────┐
│ 💬 SMS Message                           │
│                                          │
│ From: +61 400 123 456                   │
│ Time: T+5:00                             │
│                                          │
│ Message:                                 │
│ Code RED activated. All teams report     │
│ status immediately. This is not a drill. │
│                                          │
└──────────────────────────────────────────┘
```

**Content Structure:**
- Sender phone number
- Timestamp
- Message text
- Read/unread status

### 4. Email Feed

Email messages with standard email formatting.

```
┌──────────────────────────────────────────┐
│ 📧 Email                                 │
│                                          │
│ From: ops.director@command.gov          │
│ To: Blue Team                           │
│ Subject: URGENT: Immediate Action Required│
│ Time: T+2:00                             │
│                                          │
│ Team,                                    │
│                                          │
│ The situation has escalated. Implement   │
│ Protocol 7 immediately and report back.  │
│                                          │
│ All leaves are cancelled effective       │
│ immediately.                             │
│                                          │
│ Director of Operations                   │
│                                          │
│ [Attachments: protocol-7.pdf]           │
└──────────────────────────────────────────┘
```

**Content Structure:**
- From address
- Subject line
- Priority indicator
- Email body
- Attachments (optional)

### 5. Intelligence Feed

Classified documents and intelligence reports.

```
┌──────────────────────────────────────────┐
│ 📄 Intelligence Report                   │
│                                          │
│ Classification: SECRET                   │
│ Report ID: INT-2024-0142                │
│ Time: T+15:00                            │
│                                          │
│ Subject: Threat Actor Analysis          │
│                                          │
│ [PDF Viewer embedded]                    │
│                                          │
│ Summary:                                 │
│ Advanced persistent threat group         │
│ identified. Attribution confidence: HIGH │
│                                          │
│ [Download Full Report]                   │
└──────────────────────────────────────────┘
```

**Content Structure:**
- Classification level
- Report ID
- Document viewer (PDF)
- Summary text
- Download option

## Navigation Behavior

### Left Menu Navigation
- Click to switch between feed types
- Badge shows unread count
- Highlight active feed
- Persistent across exercise

### Feed Updates
- New items appear at top
- Smooth scroll animation
- Visual indicator for new content
- Chronological ordering

## MQTT Integration

### Connection
- Connect on dashboard load
- Subscribe to team-specific topic
- Maintain persistent connection
- Auto-reconnect on disconnect

### Message Reception
```javascript
// Subscribe to team feed
mqtt.subscribe(`/exercise/${exerciseId}/team/${teamId}/feed`);

// Handle incoming messages
mqtt.on('message', (topic, message) => {
  const inject = JSON.parse(message);
  
  // Route to appropriate feed
  switch(inject.type) {
    case 'social':
      addToSocialFeed(inject.content);
      break;
    case 'news':
      addToNewsFeed(inject.content);
      break;
    case 'sms':
      addToSMSFeed(inject.content);
      break;
    case 'email':
      addToEmailFeed(inject.content);
      break;
    case 'intel':
      addToIntelFeed(inject.content);
      break;
  }
  
  // Update unread count
  updateBadgeCount(inject.type);
});
```

## Team Customization

### Visual Identity
- Team color in header
- Team name display
- Color-coded UI elements
- Team-specific favicon

### Configuration
```javascript
// Team configuration loaded on startup
const teamConfig = {
  id: 'blue',
  name: 'Blue Team',
  color: '#0066CC',
  exerciseId: 'ex-001',
  port: 3142,
  mqttTopic: '/exercise/ex-001/team/blue/feed'
};
```

## State Management

### Feed State (Zustand Store)
```javascript
const useFeedStore = create((set) => ({
  socialFeed: [],
  newsFeed: [],
  smsFeed: [],
  emailFeed: [],
  intelFeed: [],
  unreadCounts: {
    social: 0,
    news: 0,
    sms: 0,
    email: 0,
    intel: 0
  },
  
  addInject: (type, content) => set((state) => ({
    [`${type}Feed`]: [content, ...state[`${type}Feed`]],
    unreadCounts: {
      ...state.unreadCounts,
      [type]: state.unreadCounts[type] + 1
    }
  })),
  
  markAsRead: (type) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [type]: 0
    }
  }))
}));
```

## Media Handling

### Images
- Display inline in feeds
- Click to enlarge
- Local file path reference
- Support jpg, png, gif

### Videos
- HTML5 video player
- Play inline
- Full screen option
- Support mp4, webm

### Documents
- PDF viewer embedded
- Download option
- Page navigation
- Zoom controls

## Performance Optimization

### Feed Rendering
- Virtual scrolling for long feeds
- Lazy load images
- Debounce rapid updates
- Limit feed items (max 100)

### Resource Management
- Minimal memory footprint
- Efficient state updates
- Cleanup on unmount
- Optimized re-renders

## User Interactions

### Reading Feeds
1. Click navigation item
2. View feed content
3. Unread count clears
4. Scroll through items

### Media Viewing
1. Click image to enlarge
2. Play video inline
3. Open PDF viewer
4. Download attachments

### Exercise Participation
- No response capability (Phase 1)
- Read-only interface
- Passive information consumption
- No team communication

## Error Handling

### Connection Loss
- Display connection status
- Queue incoming messages
- Auto-reconnect attempts
- Show reconnection message

### Missing Media
- Placeholder for missing images
- Error message for failed videos
- Fallback for PDF errors
- Graceful degradation

## Deployment

### Docker Container
- Lightweight React build
- Nginx serving static files
- Environment variables for config
- Health check endpoint

### Resource Limits
- Memory: 256MB per container
- CPU: 0.25 cores
- Network: Isolated
- Storage: Shared media volume

## Security

### Isolation
- No cross-team communication
- Read-only access
- Sandboxed containers
- Network segmentation

### Authentication
- Team-specific tokens
- Expire after exercise
- No persistent storage
- Session-only access

## Future Enhancements (Phase 2+)

- Decision capture interface
- Team collaboration tools
- Response mechanisms
- Analytics tracking
- Replay capability
