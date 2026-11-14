import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateIdeasForProject, type IdeaPostType } from "@/lib/ai/idea-generator";

const DEFAULT_QUANTITY = 5;
const MAX_PROJECTS = 15;

/**
 * Sinh ý tưởng nội dung bằng AI trong app (GLM qua z-ai-web-dev-sdk) và ghi thẳng
 * vào video_items / content_items với status "idea". Trước đây route này chỉ
 * forward sang webhook n8n (n8n.apecglobal.net) — server đó đã chết khiến feature
 * luôn fail; giờ chạy độc lập, không phụ thuộc dịch vụ ngoài.
 *
 * UI đang lắng nghe Supabase realtime nên các row mới sẽ tự hiện trong bảng.
 */
export async function POST(request: NextRequest) {
  try {
    const { postType, projectQuantities } = await request.json();
    const kind: IdeaPostType = postType === "video" ? "video" : "content";

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name, description");

    if (projectsError) {
      return new Response(JSON.stringify({ error: projectsError.message }), {
        status: 500,
      });
    }
    if (!projects || projects.length === 0) {
      return new Response(
        JSON.stringify({ error: "Chưa có dự án nào để tạo ý tưởng" }),
        { status: 400 }
      );
    }

    // Chọn project mục tiêu: theo payload (content page) hoặc tất cả project (video page)
    const qtyByProject = new Map<string, number>();
    if (Array.isArray(projectQuantities) && projectQuantities.length > 0) {
      for (const pq of projectQuantities) {
        if (pq?.projectId) {
          qtyByProject.set(
            pq.projectId,
            Math.min(Math.max(Number(pq.quantity) || DEFAULT_QUANTITY, 1), 20)
          );
        }
      }
    } else {
      for (const p of projects) qtyByProject.set(p.id, DEFAULT_QUANTITY);
    }

    const targets = projects
      .filter((p) => qtyByProject.has(p.id))
      .slice(0, MAX_PROJECTS);

    if (targets.length === 0) {
      return new Response(
        JSON.stringify({ error: "Không tìm thấy dự án phù hợp với yêu cầu" }),
        { status: 400 }
      );
    }

    // Sinh ý tưởng TUẦN TỰ theo project: gọi song song nhiều LLM requests bị
    // service AI từ chối với 429 (rate limit). Lỗi một project không chặn cái khác.
    const results: { project: string; created: number; error: string | null }[] = [];
    for (const project of targets) {
      const quantity = qtyByProject.get(project.id) || DEFAULT_QUANTITY;
      try {
        const ideas = await generateIdeasForProject({
          postType: kind,
          projectName: project.name,
          projectDescription: project.description,
          quantity,
        });

        const rows = ideas.map((idea) =>
          kind === "video"
            ? {
                id: crypto.randomUUID(),
                status: "idea",
                idea,
                project_id: project.id,
                project_name: project.name,
                platform: ["Facebook Reels", "Youtube Shorts"],
              }
            : {
                id: crypto.randomUUID(),
                status: "idea",
                idea,
                project_id: project.id,
                project_name: project.name,
                platform: ["Facebook Post"],
                content_type: "Facebook Post",
              }
        );

        const table = kind === "video" ? "video_items" : "content_items";
        const { error: insertError } = await supabase
          .from(table)
          .insert(rows);

        if (insertError) throw insertError;
        results.push({ project: project.name, created: ideas.length, error: null });
      } catch (err: any) {
        console.error(`Idea generation failed for project ${project.name}:`, err?.message);
        results.push({
          project: project.name,
          created: 0,
          error: err?.message || "Lỗi không xác định",
        });
      }
    }

    const created = results.reduce((sum, r) => sum + r.created, 0);
    const failures = results.filter((r) => r.error);

    if (created === 0) {
      return new Response(
        JSON.stringify({
          error: failures[0]?.error || "Không sinh được ý tưởng nào",
          details: results,
        }),
        { status: 500 }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        created,
        perProject: results,
        ...(failures.length > 0 ? { warnings: failures } : {}),
      }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error("ai-search-ideas error:", err);
    return new Response(JSON.stringify({ error: err?.message || "Lỗi không xác định" }), {
      status: 500,
    });
  }
}

