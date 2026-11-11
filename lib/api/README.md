SUPABASE_LINK=https://supabase.com/dashboard/project/oaiswugdhhdqkauaxawj

# Supabase API Functions

Complete API reference for the Content Automation Dashboard.

## Installation & Setup

1. Install Supabase client:
```bash
npm install @supabase/supabase-js
```

2. Create `.env.local` with credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

3. Import and use:
```typescript
import { getProjects, createProject } from "@/lib/api"
```

---

## Projects API

### `getProjects(): Promise<Project[]>`
Fetch all projects ordered by creation date.

```typescript
const projects = await getProjects()
```

### `getProjectById(id: string): Promise<Project | null>`
Fetch a specific project by ID.

### `createProject(project: Omit<Project, "id">): Promise<Project>`
Create a new project.

```typescript
const project = await createProject({
  name: "My Project",
  color: "#3b82f6"
})
```

### `updateProject(id: string, updates: Partial<Project>): Promise<Project>`
Update project details.

### `deleteProject(id: string): Promise<void>`
Delete a project.

---

## Schedules API

### `getSchedules(): Promise<Schedule[]>`
Fetch all schedules.

### `getSchedulesByProjectId(projectId: string): Promise<Schedule[]>`
Fetch schedules for a specific project.

### `getScheduleById(id: string): Promise<Schedule | null>`
Fetch a specific schedule.

### `createSchedule(schedule: Omit<Schedule, "id">): Promise<Schedule>`
Create a new schedule.

### `updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule>`
Update schedule details.

### `deleteSchedule(id: string): Promise<void>`
Delete a schedule.

### `toggleScheduleActive(id: string, isActive: boolean): Promise<Schedule>`
Toggle schedule active status.

---

## Content Items API

### `getContentItems(filters?: Object): Promise<ContentItem[]>`
Fetch content items with optional filters.

```typescript
const items = await getContentItems({
  status: "cho_duyet",
  projectId: "1",
  platform: "Facebook Reels"
})
```

**Filter options:**
- `status`: "cho_duyet" | "da_dang_thanh_cong" | "dang_xu_ly" | "loi" | "all"
- `projectId`: string
- `platform`: "Facebook Post" | "Facebook Reels" | "Youtube Shorts"

### `getContentItemById(id: string): Promise<ContentItem | null>`
Fetch a specific content item with script scenes.

### `createContentItem(content: Omit<ContentItem, "id" | "created_at" | "updated_at">): Promise<ContentItem>`
Create a new content item.

```typescript
const content = await createContentItem({
  idea: "Video idea",
  projectId: "1",
  projectName: "SUPER APP",
  platform: "Facebook Reels",
  status: "cho_duyet",
  videoDuration: 5,
  script: [
    {
      scene: 1,
      description: "Opening scene",
      dialogue: "Hello!"
    }
  ]
})
```

### `updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem>`
Update content details and script.

### `deleteContentItem(id: string): Promise<void>`
Delete a content item.

### `updateContentStatus(id: string, status: ContentStatus): Promise<ContentItem>`
Update only the content status.

### `approveContent(id: string, approvedBy: string): Promise<ContentItem>`
Approve and publish content (sets status to "da_dang_thanh_cong").

---

## Users API

### `getUsers(): Promise<User[]>`
Fetch all active users.

### `getUserById(id: string): Promise<User | null>`
Fetch a specific user.

### `createUser(user: Omit<User, "id" | "created_at" | "updated_at">): Promise<User>`
Create a new user.

```typescript
const user = await createUser({
  email: "user@example.com",
  name: "John Doe",
  role: "editor",
  is_active: true
})
```

### `updateUser(id: string, updates: Partial<User>): Promise<User>`
Update user details.

### `deactivateUser(id: string): Promise<User>`
Deactivate a user.

---

## Settings API

### `getSetting(key: string): Promise<Setting | null>`
Get a specific setting by key.

```typescript
const sheetUrl = await getSetting("google_sheet_url")
```

### `getSettings(keys: string[]): Promise<Record<string, string | null>>`
Get multiple settings at once.

```typescript
const settings = await getSettings(["google_sheet_url", "api_key"])
```

### `updateSetting(key: string, value: string, updatedBy: string): Promise<Setting>`
Create or update a setting.

```typescript
await updateSetting("google_sheet_url", "https://...", "user123")
```

### AI Configuration

### `getAIConfig(): Promise<AIConfig | null>`
Get active AI configuration.

### `updateAIConfig(updates: Partial<AIConfig>): Promise<AIConfig>`
Update AI configuration.

```typescript
await updateAIConfig({
  model_name: "gpt-4",
  max_tokens: 2000,
  temperature: 0.7
})
```

### Notification Settings

### `getNotificationSettings(userId?: string): Promise<NotificationSettings[]>`
Get notification settings for user(s).

### `updateNotificationSettings(userId: string, email: string, settings: Object): Promise<NotificationSettings>`
Update notification preferences.

```typescript
await updateNotificationSettings("user123", "user@example.com", {
  notify_on_approve: true,
  notify_on_publish: true,
  notify_on_error: false
})
```

---

## Activity Logs API

### `createActivityLog(activityType: ActivityType, entityType: EntityType, entityId: string, options?: Object): Promise<ActivityLog>`
Create an activity log entry.

```typescript
await createActivityLog("update", "content", "item123", {
  userId: "user456",
  oldValues: { status: "cho_duyet" },
  newValues: { status: "dang_xu_ly" },
  description: "Status changed to processing"
})
```

**Activity Types:** "create" | "update" | "delete" | "approve" | "publish"
**Entity Types:** "content" | "schedule" | "project" | "user" | "settings"

### `getActivityLogs(filters?: Object): Promise<ActivityLog[]>`
Fetch activity logs with optional filters.

```typescript
const logs = await getActivityLogs({
  userId: "user123",
  entityType: "content",
  activityType: "update",
  limit: 50
})
```

### `getEntityHistory(entityType: EntityType, entityId: string): Promise<ActivityLog[]>`
Get all activities for a specific entity.

### `deleteActivityLog(id: number): Promise<void>`
Delete an activity log entry.

### `clearOldActivityLogs(daysOld?: number): Promise<void>`
Delete activity logs older than specified days (default: 90).

---

## Error Handling

All API functions throw errors on failure. Use try-catch:

```typescript
try {
  const projects = await getProjects()
} catch (error) {
  console.error("Failed to fetch projects:", error)
}
```

---

## Type Definitions

### ContentStatus
```typescript
type ContentStatus = "cho_duyet" | "da_dang_thanh_cong" | "dang_xu_ly" | "loi"
```

### Platform
```typescript
type Platform = "Facebook Post" | "Facebook Reels" | "Youtube Shorts"
```

### UserRole
```typescript
type UserRole = "admin" | "editor" | "viewer"
```

### ActivityType
```typescript
type ActivityType = "create" | "update" | "delete" | "approve" | "publish"
```

### EntityType
```typescript
type EntityType = "content" | "schedule" | "project" | "user" | "settings"
```
