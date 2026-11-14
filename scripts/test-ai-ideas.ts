/**
 * End-to-end test cho AI idea generator in-app (GLM).
 * Tạo 1 project test -> gọi route thật -> verify rows -> XÓA SẠCH mọi row test.
 * Chạy: bun scripts/test-ai-ideas.ts
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!url || !key) {
  console.error("Missing Supabase env");
  process.exit(1);
}
const sb = createClient(url, key);
const MARKER = "ZZ-TEST-AI-DELETE";

async function createTestProject(): Promise<string> {
  const { data, error } = await sb
    .from("projects")
    .insert({
      id: Date.now().toString(),
      name: MARKER,
      description: "Project test cho AI idea generator",
      color: "#ff0000",
    })
    .select()
    .single();
  if (error) throw error;
  return data.id;
}

async function countRows(table: string, projectId: string) {
  const cols =
    table === "content_items"
      ? "idea, status, platform, project_name, content_type"
      : "idea, status, platform, project_name";
  const { data, error } = await sb.from(table).select(cols).eq("project_id", projectId);
  if (error) throw error;
  return data || [];
}

async function cleanup(projectId: string) {
  for (const t of ["video_items", "content_items"]) {
    const { error } = await sb.from(t).delete().eq("project_id", projectId);
    if (error) console.error(`cleanup ${t}:`, error.message);
  }
  await sb.from("projects").delete().eq("id", projectId);
}

// Purge test rows accidentally created on REAL projects: only status='idea'
// rows created inside the test window for the given project names.
async function purgeReal(sinceIso: string, names: string[]) {
  const { data, error } = await sb
    .from("video_items")
    .select("id, idea, project_name, created_at")
    .eq("status", "idea")
    .gte("created_at", sinceIso)
    .in("project_name", names);
  if (error) throw error;
  const rows = data || [];
  console.log(`purge candidates: ${rows.length}`);
  for (const r of rows) console.log(`- [${r.project_name}] ${String(r.idea).slice(0, 70)}`);
  if (rows.length > 0) {
    const { error: delError } = await sb
      .from("video_items")
      .delete()
      .in(
        "id",
        rows.map((r) => r.id)
      );
    if (delError) throw delError;
    console.log(`deleted ${rows.length} rows`);
  }
}

const command = process.argv[2];
const projectId = process.argv[3];

if (command === "create") {
  console.log("TEST_PROJECT_ID=" + (await createTestProject()));
} else if (command === "verify") {
  const v = await countRows("video_items", projectId);
  const c = await countRows("content_items", projectId);
  console.log(`video_items: ${v.length} rows; content_items: ${c.length} rows`);
  for (const r of [...v, ...c].slice(0, 6)) {
    console.log(`- [${r.status}] (${JSON.stringify(r.platform)}) ${String(r.idea).slice(0, 90)}`);
  }
} else if (command === "cleanup") {
  await cleanup(projectId);
  const v = await countRows("video_items", projectId);
  const c = await countRows("content_items", projectId);
  console.log(`after cleanup: video=${v.length}, content=${c.length}`);
} else if (command === "purge") {
  // bun scripts/test-ai-ideas.ts purge <sinceIso> <name1,name2,...>
  await purgeReal(projectId, process.argv[4].split(","));
} else {
  console.error("usage: bun scripts/test-ai-ideas.ts create|verify|cleanup [projectId]");
  process.exit(1);
}
