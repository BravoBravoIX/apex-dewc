# Priority 5: Full Inject Content Editor - Detailed Implementation Plan

## Overview
Extend the Timeline Viewer to allow comprehensive editing of all inject properties, not just time and media. This includes content fields (headline, body, text), metadata (type, priority, ID), and action triggers. The goal is to provide a complete inline editing experience without needing to manually edit JSON files.

## Goals
- Edit all inject content fields (headline, body, text, source, platform, etc.)
- Change inject type and priority
- Add, edit, and remove action triggers
- Provide type-specific editing interfaces
- Validate all changes before saving
- Maintain compatibility with existing timeline functionality

## Integration Points with Existing Code
**CRITICAL - Must Not Break:**
- Priority 2: Time editing functionality
- Priority 3/Option 3: Media management in Timeline Viewer
- Team dashboards: All inject types must still render correctly
- Timeline JSON structure: Must remain valid

## 1. Current State Analysis

### What We Have Now (Timeline Viewer)
- ✅ View all inject properties in read-only format
- ✅ Edit inject times with inline text input
- ✅ Add/remove media files via modal
- ✅ Save changes to timeline JSON
- ✅ Auto-sort by time
- ✅ Visual feedback for edited items

### What's Missing
- ❌ Edit content fields (headline, body, text, etc.)
- ❌ Change inject type or priority
- ❌ Modify platform-specific fields
- ❌ Add/edit action triggers
- ❌ Type-specific validation
- ❌ Field-level error handling

## 2. Inject Type Structure Analysis

### 2.1 Common Fields (All Types)
```typescript
interface InjectBase {
  id: string;              // Unique identifier
  time: number;            // Seconds from start
  type: string;            // Inject type
  priority?: string;       // high, medium, low
  media?: string[];        // Media file paths
  action?: {               // Action trigger
    type: string;
    data?: any;
  };
}
```

### 2.2 Type-Specific Content Fields

**News Inject:**
```typescript
content: {
  headline: string;        // Main headline
  body: string;           // Article body
  source: string;         // News source (e.g., "BBC News")
}
```

**Social Media Inject:**
```typescript
content: {
  platform: string;       // e.g., "twitter", "facebook"
  username: string;       // Username/handle
  text: string;          // Post content
}
```

**Email Inject:**
```typescript
content: {
  subject: string;        // Email subject
  from: string;          // Sender
  body: string;          // Email body
}
```

**SMS Inject:**
```typescript
content: {
  from: string;          // Sender phone/name
  text: string;          // Message content
}
```

**Intelligence Inject:**
```typescript
content: {
  headline: string;       // Brief title
  body: string;          // Intel details
  classification?: string; // e.g., "CONFIDENTIAL"
}
```

**System/Command Inject:**
```typescript
content: {
  command: string;        // Command to display/execute
  description?: string;   // Command description
}
```

### 2.3 Action Types
```typescript
action: {
  type: "alert" | "notification" | "highlight" | "sound" | "custom";
  data?: {
    message?: string;
    color?: string;
    sound?: string;
    // ... other action-specific data
  }
}
```

## 3. UI/UX Design Decisions

### 3.1 Editing Approach: Inline Expandable Editor

**Chosen Approach:** Inline expandable row editor

**Why Not Modal?**
- ❌ Modals hide context (can't see other injects)
- ❌ Extra click to open/close
- ❌ Harder to compare injects

**Why Not Separate Page?**
- ❌ Loses timeline context
- ❌ Requires navigation
- ❌ Can't quickly edit multiple injects

**Why Inline Expandable?**
- ✅ See context while editing
- ✅ Quick to expand/collapse
- ✅ Edit multiple injects without page changes
- ✅ Familiar pattern (like accordion)

### 3.2 Visual Design

**Current Row Structure:**
```
[ Time | Type | ID | Content | Media | Actions ]
```

**Expanded Row Structure:**
```
[ Time | Type | ID | Content | Media | Actions ] ← Collapsed view
[                                                ]
[  Expanded Editor Panel                        ] ← Edit form
[  - Content fields (type-specific)             ]
[  - Priority selector                          ]
[  - Action editor                              ]
[  - Save/Cancel buttons                        ]
[                                                ]
```

**Interaction Flow:**
1. Click "Edit" button (or expand icon) on inject row
2. Row expands to show edit form below
3. Edit any fields
4. Click "Save" to commit or "Cancel" to discard
5. Row collapses back to normal view

### 3.3 Edit Button Placement
- Add "Edit" button in the Actions column (next to media management)
- Icon: Pencil/Edit icon
- Only show for valid inject types
- Disable during save operation

## 4. Implementation Architecture

### 4.1 State Management

**New State Variables:**
```typescript
const [expandedInject, setExpandedInject] = useState<string | null>(null);
const [editedContent, setEditedContent] = useState<Map<string, any>>(new Map());
const [editedPriority, setEditedPriority] = useState<Map<string, string>>(new Map());
const [editedActions, setEditedActions] = useState<Map<string, any>>(new Map());
const [editErrors, setEditErrors] = useState<Map<string, string[]>>(new Map());
```

**Tracking Changes:**
- Separate Maps for content, priority, actions
- Only track what's changed (efficient)
- Combine with existing editedInjects (time) and editedMedia Maps
- Clear on save or cancel

### 4.2 Component Structure

**New Components to Create:**

1. **InjectEditor.tsx**
   - Main expandable editor component
   - Renders type-specific content fields
   - Handles validation
   - Save/Cancel logic

2. **ContentEditor.tsx**
   - Type-specific content field renderer
   - Switch based on inject type
   - Form inputs for each field type

3. **PrioritySelector.tsx**
   - Dropdown for high/medium/low
   - Visual color coding
   - Optional field (can be none)

4. **ActionEditor.tsx**
   - Add/edit/remove actions
   - Action type selector
   - Action data fields (type-specific)
   - Preview action effect

### 4.3 Validation Logic

**Field Validations:**

**ID:**
- Must be unique across timeline
- No special characters (alphanumeric, dash, underscore only)
- Required field

**Time:**
- Already validated (existing functionality)
- Must be >= 0
- Format: M:SS

**Type:**
- Must be valid type (news, social_media, email, sms, etc.)
- Changing type resets content fields

**Content Fields:**
- Required fields per type:
  - News: headline, body, source
  - Social: platform, username, text
  - Email: subject, from, body
  - SMS: from, text
- Max lengths (prevent overflow):
  - Headlines: 200 chars
  - Body text: 5000 chars
  - Usernames: 100 chars
  - etc.

**Priority:**
- Optional field
- Values: "high", "medium", "low", or null

**Actions:**
- Valid action type
- Required data fields for action type

### 4.4 Type-Specific Content Fields

**Dynamic Field Rendering:**

```typescript
const getContentFields = (type: string) => {
  switch(type) {
    case 'news':
      return ['headline', 'body', 'source'];
    case 'social_media':
      return ['platform', 'username', 'text'];
    case 'email':
      return ['subject', 'from', 'body'];
    case 'sms':
      return ['from', 'text'];
    case 'intelligence':
      return ['headline', 'body', 'classification'];
    case 'system':
      return ['command', 'description'];
    default:
      return [];
  }
};
```

**Field Definitions:**
```typescript
const fieldDefinitions = {
  headline: { label: 'Headline', type: 'text', required: true, maxLength: 200 },
  body: { label: 'Body', type: 'textarea', required: true, maxLength: 5000 },
  source: { label: 'Source', type: 'text', required: true, maxLength: 100 },
  platform: { label: 'Platform', type: 'select', options: ['twitter', 'facebook', 'instagram'], required: true },
  username: { label: 'Username', type: 'text', required: true, maxLength: 100 },
  text: { label: 'Text', type: 'textarea', required: true, maxLength: 1000 },
  subject: { label: 'Subject', type: 'text', required: true, maxLength: 200 },
  from: { label: 'From', type: 'text', required: true, maxLength: 100 },
  command: { label: 'Command', type: 'text', required: true, maxLength: 500 },
  description: { label: 'Description', type: 'textarea', required: false, maxLength: 1000 },
  classification: { label: 'Classification', type: 'select', options: ['UNCLASSIFIED', 'CONFIDENTIAL', 'SECRET'], required: false },
};
```

## 5. Detailed Implementation Steps

### Step 1: Add Edit Button to Timeline Viewer (0.5 hour)
1. Add "Edit" button to Actions column
2. Use Pencil icon from lucide-react
3. Handle click to expand inject row
4. Add state for expandedInject

### Step 2: Create InjectEditor Component (1.5 hours)
1. Create expandable editor component
2. Show/hide based on expandedInject state
3. Display current inject data
4. Render type-specific content fields
5. Add Save/Cancel buttons

### Step 3: Implement ContentEditor (1.5 hours)
1. Create type-specific field renderer
2. Switch based on inject type
3. Generate form inputs dynamically
4. Handle field changes
5. Display validation errors

### Step 4: Add Priority Selector (0.5 hour)
1. Create priority dropdown
2. Options: High, Medium, Low, None
3. Color-coded badges
4. Track changes in state

### Step 5: Implement ActionEditor (1 hour)
1. Display current action (if exists)
2. Add "Add Action" button
3. Action type selector
4. Action data fields (type-specific)
5. Remove action button

### Step 6: Add Validation Logic (1 hour)
1. Validate required fields
2. Check field lengths
3. Validate unique ID
4. Display errors inline
5. Disable save if errors exist

### Step 7: Implement Save Functionality (1 hour)
1. Combine all edited fields
2. Update timeline JSON structure
3. Call existing PUT endpoint
4. Handle success/error
5. Clear edit state
6. Collapse editor

### Step 8: Handle Type Changes (0.5 hour)
1. Detect when type changes
2. Show warning about content reset
3. Clear old content fields
4. Show new type-specific fields
5. Update in state

### Step 9: Testing & Polish (1 hour)
1. Test each inject type
2. Test validation errors
3. Test save/cancel
4. Test type changes
5. Test with existing time/media edits
6. Ensure no regressions

## 6. UI Components Detail

### 6.1 InjectEditor Component Structure

```
┌─────────────────────────────────────────────────────────┐
│ Editing: news-inject-001                         [X Close] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Type: [News ▼]        Priority: [Medium ▼]            │
│                                                         │
│ Content:                                                │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Headline: [____________________________________]    ││
│ │                                                     ││
│ │ Source: [____________________________________]      ││
│ │                                                     ││
│ │ Body:                                               ││
│ │ ┌─────────────────────────────────────────────────┐││
│ │ │                                                 │││
│ │ │                                                 │││
│ │ └─────────────────────────────────────────────────┘││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ Action Trigger: [Add Action]  or  [Edit Action ✎]      │
│                                                         │
│ [Cancel]                                   [Save Changes]│
└─────────────────────────────────────────────────────────┘
```

### 6.2 Field Types and Styling

**Text Input:**
- Single line
- Max length indicator
- Border changes on focus/error

**Textarea:**
- Multi-line (3-5 rows)
- Auto-resize option
- Character count display

**Select/Dropdown:**
- Native select or custom dropdown
- Visual indicator for current value
- Options based on field

**Priority Badge:**
- Color-coded: Red (high), Yellow (medium), Gray (low), None
- Click to change
- Dropdown on click

### 6.3 Validation Display

**Error States:**
```
┌───────────────────────────────────────────────┐
│ Headline: [________________________]          │
│ ⚠ Headline is required                       │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ Headline: [Very long headline text that ex...] │
│ ⚠ Headline exceeds 200 character limit (215) │
└───────────────────────────────────────────────┘
```

**Success States:**
- Green border on valid field
- Checkmark icon (optional)

## 7. Save Logic Flow

### 7.1 Current Save Logic (Priority 2)
```typescript
saveChanges() {
  updatedTimeline = {
    ...timeline,
    injects: timeline.injects.map(inject => ({
      ...inject,
      time: editedInjects.get(inject.id) ?? inject.time,
      media: editedMedia.get(inject.id) ?? inject.media
    }))
  }

  PUT /api/v1/timelines/{scenario}/{team}
}
```

### 7.2 Enhanced Save Logic (Priority 5)
```typescript
saveChanges() {
  // Validate all changes first
  const errors = validateAllChanges();
  if (errors.length > 0) {
    setEditErrors(errors);
    return;
  }

  updatedTimeline = {
    ...timeline,
    injects: timeline.injects.map(inject => {
      let updated = { ...inject };

      // Time (existing)
      if (editedInjects.has(inject.id)) {
        updated.time = editedInjects.get(inject.id);
      }

      // Media (existing)
      if (editedMedia.has(inject.id)) {
        updated.media = editedMedia.get(inject.id);
      }

      // Content (NEW)
      if (editedContent.has(inject.id)) {
        updated.content = editedContent.get(inject.id);
      }

      // Priority (NEW)
      if (editedPriority.has(inject.id)) {
        updated.priority = editedPriority.get(inject.id);
      }

      // Actions (NEW)
      if (editedActions.has(inject.id)) {
        updated.action = editedActions.get(inject.id);
      }

      return updated;
    })
  }

  PUT /api/v1/timelines/{scenario}/{team}

  // Clear all edit states
  setEditedInjects(new Map());
  setEditedMedia(new Map());
  setEditedContent(new Map());
  setEditedPriority(new Map());
  setEditedActions(new Map());
  setExpandedInject(null);
}
```

## 8. Type Change Handling

### 8.1 Challenge
When changing inject type (e.g., news → email), the content fields are completely different. Need to handle gracefully.

### 8.2 Solution: Confirmation Dialog
```
┌─────────────────────────────────────────────────┐
│ Change Inject Type?                      [X]   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Changing from "News" to "Email" will reset    │
│ all content fields. Are you sure?             │
│                                                 │
│ Current content:                                │
│ • Headline: "Breaking News Story..."          │
│ • Body: "Lorem ipsum..."                       │
│ • Source: "BBC News"                           │
│                                                 │
│ Will be replaced with empty Email fields:      │
│ • Subject: (empty)                             │
│ • From: (empty)                                │
│ • Body: (empty)                                │
│                                                 │
│              [Cancel]  [Change Type]           │
└─────────────────────────────────────────────────┘
```

### 8.3 Implementation
1. Detect type change in dropdown
2. Show confirmation modal
3. If confirmed:
   - Clear current content
   - Show new type's empty fields
   - Mark as edited
4. If cancelled:
   - Revert type dropdown
   - Keep current content

## 9. Action Editor Detail

### 9.1 Action Types and Data

**Alert Action:**
```typescript
{
  type: "alert",
  data: {
    message: string;  // Alert message
    severity: "info" | "warning" | "error";
  }
}
```

**Notification Action:**
```typescript
{
  type: "notification",
  data: {
    title: string;
    message: string;
  }
}
```

**Highlight Action:**
```typescript
{
  type: "highlight",
  data: {
    color: string;  // Background color
    duration: number; // Seconds
  }
}
```

**Sound Action:**
```typescript
{
  type: "sound",
  data: {
    sound: string;  // Sound file name or type
  }
}
```

### 9.2 Action Editor UI

**No Action State:**
```
Action Trigger: [+ Add Action]
```

**With Action State:**
```
Action Trigger: Alert ▼
  Message: [Emergency notification]
  Severity: [⚠ Warning ▼]
  [Remove Action]
```

### 9.3 Action Type Selector
```
┌─────────────────────┐
│ Select Action Type  │
├─────────────────────┤
│ Alert               │
│ Notification        │
│ Highlight           │
│ Sound               │
│ Custom              │
└─────────────────────┘
```

## 10. Testing Strategy

### 10.1 Unit Tests (Manual)

**Content Editing:**
- [ ] Edit headline in news inject
- [ ] Edit body text in email inject
- [ ] Edit username in social media inject
- [ ] Edit command in system inject
- [ ] Edit with empty required field (validation error)
- [ ] Edit with text exceeding max length (validation error)

**Type Changes:**
- [ ] Change news to email (confirmation required)
- [ ] Confirm type change (content resets)
- [ ] Cancel type change (keeps original)
- [ ] Change type and save
- [ ] Change type and cancel edit (reverts to original type)

**Priority Editing:**
- [ ] Set priority to high
- [ ] Change priority from medium to low
- [ ] Remove priority (set to none)
- [ ] Save with priority change

**Action Editing:**
- [ ] Add alert action
- [ ] Edit existing notification action
- [ ] Remove action
- [ ] Change action type
- [ ] Save with action changes

**Combined Edits:**
- [ ] Edit time, content, and media in one inject
- [ ] Edit multiple injects before saving
- [ ] Save all changes together
- [ ] Cancel all changes
- [ ] Save with some validation errors (blocked)

### 10.2 Integration Tests

**With Team Dashboards:**
- [ ] Edit news inject, verify displays correctly on team dashboard
- [ ] Edit social media platform, verify correct icon shows
- [ ] Add action trigger, verify action executes on dashboard
- [ ] Change inject type, verify dashboard renders new type correctly

**With Media Management:**
- [ ] Edit content and add media in same inject
- [ ] Save changes, verify both content and media updated

**With Time Editing:**
- [ ] Edit time and content simultaneously
- [ ] Verify sort order after content edit
- [ ] Edit time in one inject, content in another, save both

### 10.3 Edge Cases

- [ ] Edit inject with no content (create content object)
- [ ] Edit inject with string content (convert to object)
- [ ] Very long field values (test UI overflow)
- [ ] Special characters in text fields
- [ ] Rapid expand/collapse/edit cycles
- [ ] Edit during save operation (should be blocked)
- [ ] Browser refresh during edit (changes lost - expected)

## 11. Error Handling

### 11.1 Validation Errors
**Display Method:** Inline below field
**Behavior:**
- Show red border on invalid field
- Display error message below field
- Disable save button while errors exist
- Clear error when field becomes valid

### 11.2 Save Errors
**Scenarios:**
- Network failure
- Backend rejection
- File permission error

**Handling:**
- Display error banner at top
- Keep edit form open (don't lose changes)
- Offer retry option
- Log error for debugging

### 11.3 Concurrent Edit Protection
**Challenge:** Multiple browser tabs editing same timeline

**Solution (Simple):**
- Show warning on save if timeline was modified
- "Timeline was updated by another user. Reload to see latest?"
- Don't implement full conflict resolution (too complex)

**Solution (Future Enhancement):**
- Optimistic locking with version numbers
- Merge non-conflicting changes

## 12. Performance Considerations

### 12.1 State Updates
**Optimization:**
- Use Maps for edited fields (O(1) lookup)
- Only re-render expanded editor row
- Memoize type-specific field renderers
- Debounce validation checks (300ms after typing stops)

### 12.2 Large Timelines
**Challenge:** Timeline with 100+ injects

**Optimizations:**
- Virtual scrolling (if needed - likely not for <200 injects)
- Only validate when saving, not on every keystroke
- Collapse editor on save to reduce DOM nodes

### 12.3 Complex Content
**Challenge:** Large body text (5000 chars)

**Handling:**
- Textarea with auto-resize
- Consider rich text editor (future)
- No live preview needed

## 13. Acceptance Criteria

### Must Have
✓ Edit all content fields for each inject type
✓ Change inject type with confirmation
✓ Edit priority level
✓ Add, edit, remove action triggers
✓ Inline validation with clear error messages
✓ Save changes to timeline JSON
✓ Cancel editing discards changes
✓ Edited injects show visual indicator (yellow highlight)
✓ No breaking changes to time/media editing
✓ Changes immediately usable in team dashboards

### Nice to Have (If Time Permits)
- Keyboard shortcuts (Esc to cancel, Ctrl+S to save)
- Field-level undo/redo
- Preview inject in dashboard style
- Copy inject content from another inject
- Rich text editor for body fields

## 14. Risks and Mitigations

### Risks

1. **Complex state management overwhelming**
   - *Mitigation*: Use Maps consistently, test incrementally
   - *Probability*: Medium
   - *Impact*: Medium

2. **Type-specific rendering breaks with unknown types**
   - *Mitigation*: Fallback to generic text fields, log warning
   - *Probability*: Low
   - *Impact*: Low

3. **Validation logic becomes tangled**
   - *Mitigation*: Separate validation functions per field type
   - *Probability*: Medium
   - *Impact*: Medium

4. **User loses work during edit (page refresh)**
   - *Mitigation*: Show warning on page unload if unsaved changes
   - *Probability*: Low
   - *Impact*: Medium

5. **Breaking existing time/media editing**
   - *Mitigation*: Thorough testing before finalizing
   - *Probability*: Low
   - *Impact*: High

6. **Save conflicts with concurrent edits**
   - *Mitigation*: Document as known limitation, implement warning
   - *Probability*: Very Low
   - *Impact*: Low

## 15. Time Estimate

- Step 1: Add edit button: 0.5 hour
- Step 2: InjectEditor component: 1.5 hours
- Step 3: ContentEditor (type-specific): 1.5 hours
- Step 4: Priority selector: 0.5 hour
- Step 5: ActionEditor: 1 hour
- Step 6: Validation logic: 1 hour
- Step 7: Save functionality: 1 hour
- Step 8: Type change handling: 0.5 hour
- Step 9: Testing & polish: 1 hour

**Total: 8-9 hours**

## 16. Success Metrics

- Can edit all inject types without manual JSON editing
- Zero regressions in existing time/media editing
- Validation prevents invalid data from being saved
- Changes reflect immediately on team dashboards
- Users can edit multiple injects and save all at once
- Type changes work smoothly with confirmation

## 17. Future Enhancements (Not in Priority 5)

- Rich text editor for body fields (formatting, links)
- Inject templates (quick-create from template)
- Duplicate inject feature
- Bulk edit (change type/priority for multiple injects)
- Import/export inject content
- AI-assisted content generation
- Inject preview in dashboard style
- Version history with rollback
- Collaborative editing indicators

---

## Summary

Priority 5 transforms the Timeline Viewer from a simple time/media editor into a comprehensive inject management system. By adding inline content editing with type-specific fields, priority management, and action triggers, users can fully manage inject timelines without ever touching JSON files.

**Key Implementation Strategy:**
- Inline expandable editor (not modal)
- Type-specific dynamic field rendering
- Comprehensive validation before save
- Seamless integration with existing time/media editing
- Clear visual feedback for edited items

**Confidence: 85%**

The 85% confidence is based on:
- ✅ Clear architecture and component structure
- ✅ Type-specific logic is straightforward (switch statements)
- ✅ Validation is well-defined
- ✅ Integration with existing save logic is clean
- ⚠️ Some complexity in handling type changes gracefully
- ⚠️ Need careful testing to avoid regressions in time/media editing
- ⚠️ Action editor complexity (multiple action types with different data)

The implementation is well-scoped and builds naturally on Priority 2's editing foundation. The main challenges are around state management complexity and ensuring type changes work smoothly, but these are manageable with careful implementation.
