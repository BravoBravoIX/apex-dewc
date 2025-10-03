# Team Dashboard Enhancement Plan - October 1st

## Overview
Enhance team dashboards with inject type filtering, dedicated pages for different communication channels, and theme selection capability. Focus on routing injects to the correct pages based on their type.

## Goals
1. Add light/dark theme selection to team dashboards (matching client-dashboard)
2. Create dedicated pages for News, Social Media, Email, and SMS injects
3. Ensure injects are routed to and displayed on the correct page based on their type
4. Maintain real-time updates and existing functionality

## Phase 1: Theme System Implementation (1-2 hours)

### 1.1 Port Theme Context
- Copy ThemeContext from client-dashboard to team-dashboard
- Adapt for team dashboard structure
- Ensure localStorage persistence works per team

### 1.2 CSS Variable System
- Add same CSS variables as client-dashboard
- Light theme (default): Clean, corporate white theme
- Dark theme: Matching dark colors from client-dashboard
- Ensure theme applies to all components

### 1.3 Theme Toggle UI
- Add theme toggle button in header (sun/moon icons)
- Position consistently with client-dashboard
- Smooth transition animations

### 1.4 Testing
- Verify theme persists on refresh
- Check all UI elements adapt properly
- Ensure both team dashboards work independently

## Phase 2: Navigation and Routing (2-3 hours)

### 2.1 Add React Router
- Install react-router-dom in team-dashboard
- Setup routing structure
- Maintain URL parameters (team, exercise)

### 2.2 Create Navigation Component
- **IMPORTANT**: Match client-dashboard navigation styling for consistency
  - Use same sidebar/nav component structure if applicable
  - Apply consistent hover effects, active states, and transitions
  - Maintain same color scheme (blue accents, etc.)
- Tab bar or sidebar with inject type filters
- Show counts per type (e.g., News (3), Social (5))
- Routes:
  - `/` or `/all` - All injects (current view)
  - `/news` - News injects only
  - `/social` - Social Media injects only
  - `/email` - Email injects only
  - `/sms` - SMS injects only
- Active state styling (matching client-dashboard)
- Mobile responsive

### 2.3 Route Structure
```
/?team=blue&exercise=xyz (All injects)
/news?team=blue&exercise=xyz (News only)
/social?team=blue&exercise=xyz (Social only)
/email?team=blue&exercise=xyz (Email only)
/sms?team=blue&exercise=xyz (SMS only)
```

## Phase 3: Type-Specific Pages (3-4 hours)

### 3.1 News Page
- **Layout**: Simple feed - latest at top, scrollable
- **Display**:
  - Headline prominently displayed
  - Body text in card format
  - Source attribution
  - Timestamp
  - Media images (if present)
- **Styling**: Clean feed/card layout (NOT newspaper-like)
- **Behavior**: All visible, newest pushes older down

### 3.2 Social Media Page
- **Layout**: Simple feed - latest at top, scrollable
- **Display**:
  - Platform indicator (Twitter/X, Facebook, etc.)
  - Username/handle
  - Post content
  - Media attachments
  - Engagement metrics (if in data)
- **Styling**: Clean feed/card layout (NOT social media feed simulation)
- **Behavior**: All visible, newest pushes older down

### 3.3 Email Page
- **Layout**: Email client interface (SPECIAL TREATMENT)
- **Display**:
  - Email list view with:
    - From/Subject/Timestamp
    - Unread indicators
    - Preview text
  - **CLICKABLE**: Click email to expand/view full content
  - Email detail view shows:
    - Full From/To/Subject headers
    - Complete email body
    - Attachments section
    - Timestamp
- **Styling**: Professional email client look (inbox list + detail view)
- **Behavior**: Click to read, collapse/expand

### 3.4 SMS Page
- **Layout**: Simple feed - latest at top, scrollable
- **Display**:
  - Sender information
  - Message content
  - Timestamp
  - Media attachments (if present)
- **Styling**: Clean feed/card layout (intercepted messages view)
- **Behavior**: All visible, newest pushes older down

### 3.5 All Injects Page (Current)
- Keep existing mixed view
- Add type badges/labels
- Sort by time
- Universal layout for all types

## Phase 4: Inject Type Routing & Filtering Logic (2 hours)

### 4.1 Inject Type Detection
- Read inject `type` field from timeline JSON
- Map inject types to correct pages:
  - `type: "news"` → News page
  - `type: "social"` or `type: "social_media"` → Social Media page
  - `type: "email"` → Email page
  - `type: "sms"` → SMS page
  - All types → All Injects page
- Handle unknown types gracefully (default to All Injects)

### 4.2 Filter Implementation
- Create filter functions for each inject type
- Maintain real-time updates per filter
- Update counts dynamically in navigation

### 4.3 State Management
- Keep all injects in state
- Filter on display (not on receive)
- Preserve inject order (by time)
- Ensure new injects appear on correct page immediately

### 4.4 Performance
- Memoize filtered results
- Efficient re-renders
- Handle large inject volumes

## Technical Implementation Details

### Component Structure
```
team-dashboard/
├── src/
│   ├── contexts/
│   │   └── ThemeContext.tsx (new)
│   ├── components/
│   │   ├── Navigation.tsx (new)
│   │   ├── InjectCard.tsx (refactor)
│   │   ├── NewsCard.tsx (new)
│   │   ├── SocialCard.tsx (new)
│   │   ├── EmailCard.tsx (new)
│   │   └── SMSCard.tsx (new)
│   ├── pages/
│   │   ├── AllInjects.tsx (new)
│   │   ├── NewsPage.tsx (new)
│   │   ├── SocialPage.tsx (new)
│   │   ├── EmailPage.tsx (new)
│   │   └── SMSPage.tsx (new)
│   └── App.tsx (update)
```

### Inject Type Mapping
```javascript
const injectTypes = {
  news: 'News',
  social: 'Social Media',
  social_media: 'Social Media',
  email: 'Email',
  sms: 'SMS',
  alert: 'Alert',
  intelligence: 'Intelligence',
  intel: 'Intelligence'
};
```

### Timeline JSON Format
```javascript
// In timeline JSON files - ensure type field is set correctly
{
  "id": "news-001",
  "time": 120,
  "type": "news",  // ← Critical: this determines which page it appears on
  "content": {
    "headline": "Breaking News...",
    "body": "Story content...",
    "source": "Maritime News Network"
  },
  "media": ["/media/file.png"]  // Optional: media still works
}
```

## Testing Requirements

### Functional Tests
1. Theme switching works and persists
2. Navigation between inject types
3. Correct filtering per page - each inject appears ONLY on its designated page
4. News injects (`type: "news"`) appear on News page
5. Social injects (`type: "social"`) appear on Social page
6. Email injects (`type: "email"`) appear on Email page
7. SMS injects (`type: "sms"`) appear on SMS page
8. All injects appear on All Injects page
9. Real-time updates continue working on all pages
10. Both team dashboards function independently
11. Media images display properly (if present in inject)
12. Click-to-enlarge works for media

### Visual Tests
1. Light theme matches client-dashboard
2. Dark theme consistency
3. Type-specific layouts look appropriate for each communication channel
4. Mobile responsive design
5. Image sizing correct (if media present)

### Performance Tests
1. Page switching is instant
2. Filtering doesn't lag with many injects
3. Theme switching is smooth
4. Real-time inject delivery doesn't slow down filtering

## Timeline JSON Updates Needed

### Blue Team Timeline
- **Verify all injects have correct `type` field**:
  ```json
  {
    "id": "inject-001",
    "time": 60,
    "type": "news",  // ← Must be set correctly
    "content": {...}
  }
  ```
- Ensure variety of inject types: news, social, email, sms
- Test that each type appears on correct page

### Red Team Timeline
- Same verification - check all `type` fields are accurate
- Ensure balanced distribution of inject types for testing all pages

## Risks and Mitigations

### Risks
1. **Performance with many injects**: Filtering/rendering could slow down
   - *Mitigation*: Use React.memo, virtualization if needed

2. **Theme conflicts**: Team dashboard styling might conflict
   - *Mitigation*: Careful CSS scoping, test thoroughly

3. **Routing complexity**: URL parameters + routes might conflict
   - *Mitigation*: Careful route configuration, preserve params

4. **Incorrect inject type mapping**: Injects might not appear on correct pages
   - *Mitigation*: Strict type validation, fallback to "All Injects" page, thorough testing

5. **Real-time updates on filtered pages**: New injects might not appear immediately on type-specific pages
   - *Mitigation*: Test MQTT updates across all routes, ensure filtering happens after state update

## Success Criteria
- Theme selection works identically to client-dashboard
- Each inject type has its own dedicated, well-styled page
- Navigation between pages is smooth and intuitive
- **Injects appear ONLY on their designated page based on `type` field**
- **All injects appear on the "All Injects" page**
- Real-time updates work correctly on all filtered pages
- Both team dashboards function independently
- Mobile responsive design works well
- Media displays correctly when present in inject data

## Estimated Time
- Phase 1 (Theme): 1-2 hours
- Phase 2 (Navigation): 2-3 hours
- Phase 3 (Type Pages): 3-4 hours
- Phase 4 (Inject Routing & Filtering): 2 hours
- Testing & Refinement: 1-2 hours
- **Total: 9-13 hours**

## Next Steps After Completion
1. Add more inject types (intelligence, alerts, etc.)
2. Implement inject acknowledgment system
3. Add search/filter within each type
4. Export capabilities per inject type
5. Team-specific theming options