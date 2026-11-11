# Database Seeding Scripts

Instructions for populating the database with sample data.

## Option 1: Using SQL (Recommended for first-time setup)

### Steps:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open and run `seed-data.sql`
3. Execute the script
4. Verify with the count query at the end

### Data inserted:

- **5 Projects**: SUPER APP, HỆ THỐNG ECOOP, APEC BCI, APEC TECH, LIFE CARE
- **4 Users**: Admin, 2 Editors, 1 Viewer
- **5 Settings**: Google Sheet, API keys, sync config
- **1 AI Config**: GPT-4 model settings
- **4 Notification Settings**: One per user
- **14 Schedules**: Multiple schedules per project
- **6 Content Items**: Mix of pending and published
- **4 Script Scenes**: Sample video scripts
- **15 Activity Logs**: Sample audit trail

---

## Option 2: Using TypeScript (For programmatic seeding)

### Steps:

1. Create a **temporary seeding page** or **API route**:

```typescript
// app/api/seed/route.ts
import { seedDatabase } from "@/scripts/seed-data"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    await seedDatabase()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Seeding failed" }, { status: 500 })
  }
}
```

2. Call the endpoint:

```bash
curl -X POST http://localhost:3000/api/seed
```

3. Or create a CLI command in `package.json`:

```json
{
  "scripts": {
    "seed": "ts-node scripts/seed-data.ts"
  }
}
```

Then run:

```bash
npm run seed
```

---

## Data Structure

### Projects (5)
| ID | Name | Color | Description |
|----|------|-------|-------------|
| 1 | SUPER APP | #3b82f6 | Multi-purpose super app platform |
| 2 | HỆ THỐNG ECOOP | #22c55e | E-commerce cooperative system |
| 3 | APEC BCI | #eab308 | Business and Commerce Initiative |
| 4 | APEC TECH | #f97316 | Technology division |
| 5 | LIFE CARE | #8b5cf6 | Healthcare and wellness services |

### Users (4)
| Role | Email | Name |
|------|-------|------|
| admin | admin@example.com | Admin User |
| editor | editor1@example.com | Content Editor 1 |
| editor | editor2@example.com | Content Editor 2 |
| viewer | viewer@example.com | Content Viewer |

### Content Items (6)
- 4 items with status "cho_duyet" (pending)
- 2 items with status "da_dang_thanh_cong" (published)
- 2 items have script scenes
- Mix of different platforms and projects

### Schedules (14)
- 3 schedules for SUPER APP
- 3 schedules for HỆ THỐNG ECOOP
- 2 schedules for APEC BCI
- 3 schedules for APEC TECH
- 3 schedules for LIFE CARE

---

## After Seeding

1. **Verify in Supabase Dashboard**:
   - Go to each table and check data
   - Verify foreign key relationships

2. **Update `.env.local`** (already done):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://oaiswugdhhdqkauaxawj.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Start the app**:
   ```bash
   npm run dev
   ```

4. **Load data in components**:
   ```typescript
   import { getProjects, getContentItems } from "@/lib/api"
   
   const projects = await getProjects()
   const items = await getContentItems({ status: "cho_duyet" })
   ```

---

## Clearing Data (if needed)

### Delete all data and reseed:

```sql
-- In Supabase SQL Editor:
DELETE FROM activity_logs;
DELETE FROM script_scenes;
DELETE FROM content_items;
DELETE FROM notification_settings;
DELETE FROM ai_config;
DELETE FROM settings;
DELETE FROM schedules;
DELETE FROM users;
DELETE FROM projects;
```

Then reseed using either method above.

---

## Notes

- **IDs**: Using string-based IDs (timestamps for new records)
- **Timestamps**: Auto-generated via database defaults
- **Foreign Keys**: Properly configured with CASCADE delete
- **Indices**: Created for performance optimization
- **Test Data**: Uses realistic Vietnamese content for testing

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"
- Your tables already have data
- Delete existing data first and reseed

### Error: "permission denied for schema public"
- Check Supabase role and RLS policies
- Ensure anon key has insert permissions

### Script doesn't show in Supabase UI immediately
- Refresh the page or restart the SQL editor
- Wait a few seconds for database to sync

---

## Next Steps

1. ✅ Database schema created
2. ✅ Sample data seeded
3. ⬜ Replace mock-data.ts with API calls (next phase)
4. ⬜ Add real user authentication
5. ⬜ Integrate with Google Sheets
6. ⬜ Setup email notifications
