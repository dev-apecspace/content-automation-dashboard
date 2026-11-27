import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { decrypt } from "@/lib/server/encryption";

// ============================================================================
// AUTO-POST ENGINE (thay thế n8n đã ngưng sử dụng)
//
// Chuỗi cũ: pg_cron → webhook n8n → n8n tự đăng → ghi DB. Server n8n đã tắt
// vĩnh viễn nên chuỗi đó chết. Engine này chạy NGAY TRONG app:
//   - instrumentation.ts khởi động nó lúc server boot (dev + standalone)
//   - Mỗi 60s quét các item có status "content_approved" và posting_time
//     (định dạng "dd/MM/yyyy HH:mm", giờ VN) đã đến/qua hạn
//   - Đăng trực tiếp lên Facebook Page qua Graph API bằng token đã lưu
//     (mã hóa AES trong bảng accounts), ghi bảng posts, cập nhật status
//
// Chống đăng trùng khi nhiều instance chạy cùng lúc: claim nguyên tử —
// UPDATE ... SET status='posting' WHERE id=... AND status='content_approved'
// — chỉ instance thắng claim mới được đăng.
// ============================================================================

const GRAPH_VERSION = "v23.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;
const SWEEP_INTERVAL_MS = 60_000;

let serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient | null {
  if (serviceClient) return serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  serviceClient = createClient(url, key, { auth: { persistSession: false } });
  return serviceClient;
}

/** "27/11/2026 09:00" (giờ VN, UTC+7) → Date UTC */
export function parseVnPostingTime(value?: string | null): Date | null {
  if (!value) return null;
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const [, d, mo, y, h, mi] = m;
  // Giờ VN trừ đi 7 để ra UTC
  return new Date(Date.UTC(+y, +mo - 1, +d, +h - 7, +mi));
}

/** Date → "27/11/2026 09:00" giờ VN */
export function formatVnPostingTime(date: Date = new Date()): string {
  const vn = new Date(date.getTime() + 7 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(vn.getUTCDate())}/${p(vn.getUTCMonth() + 1)}/${vn.getUTCFullYear()} ${p(vn.getUTCHours())}:${p(vn.getUTCMinutes())}`;
}

type AccountRow = {
  id: string;
  platform: string;
  channel_id: string;
  channel_name: string;
  token: string;
  client_id?: string | null;
  client_secret?: string | null;
};

export type EngineStats = {
  enabled: boolean;
  startedAt: string | null;
  lastSweepAt: string | null;
  sweeps: number;
  postedCount: number;
  failedCount: number;
  lastError: string | null;
  lastPostedSummary: string | null;
};

// LƯU Ý: Next dev bundling có thể tạo NHIỀU instance module của engine này
// (instrumentation vs route handler) — nếu lưu stats ở biến module thì health
// route sẽ nhìn thấy bản sao khác, báo enabled:false dù engine đang chạy.
// globalThis là per-process → mọi bundle trong cùng server thấy chung một object.
const g = globalThis as { __autoPostEngineStats?: EngineStats };
export const engineStats: EngineStats =
  g.__autoPostEngineStats ??
  (g.__autoPostEngineStats = {
    enabled: false,
    startedAt: null,
    lastSweepAt: null,
    sweeps: 0,
    postedCount: 0,
    failedCount: 0,
    lastError: null,
    lastPostedSummary: null,
  });

async function graphPost(
  path: string,
  params: Record<string, string>,
  token: string,
): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  const body = new URLSearchParams({ ...params, access_token: token });
  try {
    const res = await fetch(`${GRAPH_BASE}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: AbortSignal.timeout(30_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      const msg =
        data?.error?.message || `HTTP ${res.status} từ Graph API`;
      return { ok: false, error: msg };
    }
    return { ok: true, data };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Đăng 1 bài (text + ảnh) lên Facebook Page bằng page token */
async function postToFacebook(
  account: AccountRow,
  caption: string,
  imageLinks: string[],
): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  const token = decrypt(account.token);
  const pageId = account.channel_id;

  // Có ảnh: upload từng ảnh (chưa xuất bản) rồi publish feed kèm attached_media
  const mediaFbids: string[] = [];
  for (const url of imageLinks.slice(0, 10)) {
    const r = await graphPost(`${pageId}/photos`, { url, published: "false" }, token);
    if (!r.ok) return r;
    if (r.data?.id) mediaFbids.push(r.data.id);
  }

  const feedParams: Record<string, string> = { message: caption || "" };
  mediaFbids.forEach((fbid, i) => {
    feedParams[`attached_media[${i}][media_fbid]`] = fbid;
  });
  const feed = await graphPost(`${pageId}/feed`, feedParams, token);
  if (!feed.ok) return feed;
  return { ok: true, postId: feed.data?.id || "" };
}

/** Đăng video Facebook (file_url Cloudinary) */
async function postVideoToFacebook(
  account: AccountRow,
  videoUrl: string,
  title: string,
  caption: string,
): Promise<{ ok: true; postId: string } | { ok: false; error: string }> {
  const token = decrypt(account.token);
  const r = await graphPost(
    `${account.channel_id}/videos`,
    { file_url: videoUrl, description: [title, caption].filter(Boolean).join("\n\n") },
    token,
  );
  if (!r.ok) return r;
  return { ok: true, postId: r.data?.id || "" };
}

// --- YouTube (OAuth2 refresh token → resumable upload videos.insert) ---

type GoogleTokenCache = { access: string; expiresAt: number };
// globalThis như engineStats: chống chênh lệch module instance giữa các bundle
const gt = globalThis as { __autoPostGoogleTokens?: Map<string, GoogleTokenCache> };
const googleTokens = gt.__autoPostGoogleTokens ?? (gt.__autoPostGoogleTokens = new Map());

function decryptMaybe(text?: string | null): string {
  if (!text) return "";
  if (!text.includes(":")) return text;
  try {
    return decrypt(text);
  } catch {
    return text;
  }
}

/** Đổi refresh token lấy access token (cache ~50 phút, token sống 1 giờ) */
async function getGoogleAccessToken(account: AccountRow): Promise<string> {
  const cached = googleTokens.get(account.id);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.access;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: account.client_id || "",
      client_secret: decryptMaybe(account.client_secret),
      refresh_token: decrypt(account.token),
      grant_type: "refresh_token",
    }).toString(),
    signal: AbortSignal.timeout(20_000),
  });
  const j = await res.json().catch(() => ({}));
  if (!j.access_token) {
    throw new Error(
      `YouTube token thất bại: ${j.error_description || j.error || "HTTP " + res.status} (token kênh đã hết — cập nhật lại refresh token trong Quản lý tài khoản)`,
    );
  }
  googleTokens.set(account.id, {
    access: j.access_token,
    expiresAt: Date.now() + ((j.expires_in || 3600) - 120) * 1000,
  });
  return j.access_token;
}

/**
 * Upload video lên YouTube (resumable upload — chuẩn của videos.insert):
 * 1. Khởi tạo → nhận upload URL (header Location)
 * 2. Tải file từ Cloudinary rồi PUT nguyên bytes lên upload URL
 * privacyStatus mặc định "public"; có thể đổi bằng env YOUTUBE_UPLOAD_PRIVACY
 * (dùng "private" khi test để không công khai video ra kênh).
 */
async function uploadYoutubeVideo(
  account: AccountRow,
  videoUrl: string,
  title: string,
  description: string,
  shorts: boolean,
): Promise<{ ok: true; videoId: string } | { ok: false; error: string }> {
  try {
    const access = await getGoogleAccessToken(account);
    const privacy = process.env.YOUTUBE_UPLOAD_PRIVACY || "public";
    const desc =
      shorts && !`${description}`.includes("#Shorts")
        ? `${description}\n\n#Shorts`.trim()
        : description;
    const meta = {
      snippet: {
        title: (title || "Video").slice(0, 100),
        description: desc.slice(0, 5000),
        categoryId: "22", // People & Blogs
      },
      status: { privacyStatus: privacy, selfDeclaredMadeForKids: false },
    };
    const init = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + access,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": "video/mp4",
        },
        body: JSON.stringify(meta),
        signal: AbortSignal.timeout(30_000),
      },
    );
    const uploadUrl = init.headers.get("location");
    if (!init.ok || !uploadUrl) {
      const t = await init.text().catch(() => "");
      return { ok: false, error: `YouTube khởi tạo upload lỗi HTTP ${init.status}: ${t.slice(0, 160)}` };
    }

    const fileRes = await fetch(videoUrl, { signal: AbortSignal.timeout(120_000) });
    if (!fileRes.ok) {
      return { ok: false, error: `Tải video nguồn (Cloudinary) lỗi HTTP ${fileRes.status}` };
    }
    const buf = Buffer.from(await fileRes.arrayBuffer());
    if (buf.length === 0) {
      return { ok: false, error: "File video nguồn rỗng (0 bytes)" };
    }
    const up = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": "video/mp4", "Content-Length": String(buf.length) },
      body: new Uint8Array(buf),
      signal: AbortSignal.timeout(300_000),
    });
    const j = await up.json().catch(() => ({}));
    if (!up.ok || !j.id) {
      return { ok: false, error: `YouTube upload lỗi HTTP ${up.status}: ${JSON.stringify(j).slice(0, 160)}` };
    }
    return { ok: true, videoId: j.id };
  } catch (e: unknown) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function loadAccounts(ids: string[]): Promise<Map<string, AccountRow>> {
  const client = getServiceClient();
  const map = new Map<string, AccountRow>();
  if (!client || ids.length === 0) return map;
  const { data } = await client
    .from("accounts")
    .select("id,platform,channel_id,channel_name,token,client_id,client_secret")
    .in("id", ids);
  for (const row of data || []) map.set(row.id, row as AccountRow);
  return map;
}

async function claimItem(
  table: "content_items" | "video_items",
  id: string,
): Promise<boolean> {
  const client = getServiceClient();
  if (!client) return false;
  // Claim nguyên tử: chỉ thắng khi status vẫn còn content_approved
  const { data } = await client
    .from(table)
    .update({ status: "posting", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "content_approved")
    .select("id");
  return (data || []).length > 0;
}

type SweepResult = {
  posted: number;
  failed: number;
  skippedUnsupported: number;
};

async function processContentItem(
  client: SupabaseClient,
  item: any,
): Promise<boolean> {
  const accountIds: string[] = Array.isArray(item.account_ids)
    ? item.account_ids
    : [];
  const accounts = await loadAccounts(accountIds);
  const images: string[] = Array.isArray(item.image_links)
    ? item.image_links.filter(Boolean)
    : [];
  let anySuccess = false;
  let lastError = "";

  for (const accId of accountIds) {
    const account = accounts.get(accId);
    if (!account || account.platform !== "Facebook" || !account.channel_id) {
      lastError = `Tài khoản không hợp lệ/không phải Facebook: ${accId}`;
      continue;
    }
    const r = await postToFacebook(account, item.caption || "", images);
    if (r.ok && r.postId) {
      anySuccess = true;
      const pageId = account.channel_id;
      const suffix = r.postId.includes("_") ? r.postId.split("_")[1] : r.postId;
      await client.from("posts").insert({
        id: r.postId,
        item_id: item.id,
        item_type: "content",
        platform: "Facebook Post",
        post_url: `https://facebook.com/${pageId}/posts/${suffix}`,
        published_at: new Date().toISOString(),
        account_id: account.id,
        status: "published",
      });
    } else if (!r.ok) {
      lastError = r.error;
    } else {
      lastError = "Facebook không trả về post id";
    }
  }

  if (anySuccess) {
    await client
      .from("content_items")
      .update({ status: "posted_successfully", updated_at: new Date().toISOString() })
      .eq("id", item.id);
    engineStats.postedCount += 1;
    engineStats.lastPostedSummary = `Nội dung "${(item.idea || "").slice(0, 60)}" đã đăng Facebook`;
    return true;
  }

  await client
    .from("content_items")
    .update({ status: "error", updated_at: new Date().toISOString() })
    .eq("id", item.id);
  engineStats.failedCount += 1;
  engineStats.lastError = lastError;
  console.error(`[auto-post] content ${item.id} THẤT BẠI: ${lastError}`);
  return false;
}

async function processVideoItem(
  client: SupabaseClient,
  item: any,
): Promise<boolean> {
  const accountIds: string[] = Array.isArray(item.account_ids)
    ? item.account_ids
    : [];
  const accounts = await loadAccounts(accountIds);
  const shorts = (item.platform || []).some((p: string) =>
    (p || "").includes("Shorts"),
  );
  let anySuccess = false;
  let lastError = "";

  for (const accId of accountIds) {
    const account = accounts.get(accId);
    if (!account || !account.channel_id) {
      lastError = `Tài khoản không hợp lệ: ${accId}`;
      continue;
    }
    if (!item.video_link) {
      lastError = "Video chưa có file (video_link trống)";
      continue;
    }

    if (account.platform === "Youtube") {
      // YouTube: refresh token → resumable upload
      const r = await uploadYoutubeVideo(
        account,
        item.video_link,
        item.title || "",
        item.caption || "",
        shorts,
      );
      if (r.ok) {
        anySuccess = true;
        await client.from("posts").insert({
          id: r.videoId,
          item_id: item.id,
          item_type: "video",
          platform: (item.platform || ["Youtube"])[0],
          post_url: `https://www.youtube.com/watch?v=${r.videoId}`,
          published_at: new Date().toISOString(),
          account_id: account.id,
          status: "published",
        });
      } else {
        lastError = r.error;
      }
    } else if (account.platform === "Facebook") {
      // Facebook: video upload qua Graph file_url
      const r = await postVideoToFacebook(
        account,
        item.video_link,
        item.title || "",
        item.caption || "",
      );
      if (r.ok && r.postId) {
        anySuccess = true;
        const pageId = account.channel_id;
        const suffix = r.postId.includes("_") ? r.postId.split("_")[1] : r.postId;
        await client.from("posts").insert({
          id: r.postId,
          item_id: item.id,
          item_type: "video",
          platform: "Facebook Video",
          post_url: `https://facebook.com/${pageId}/videos/${suffix}`,
          published_at: new Date().toISOString(),
          account_id: account.id,
          status: "published",
        });
      } else if (!r.ok) {
        lastError = r.error;
      } else {
        lastError = "Facebook không trả về post id";
      }
    } else {
      lastError = `Platform tài khoản chưa hỗ trợ đăng tự động: ${account.platform}`;
    }
  }

  if (anySuccess) {
    await client
      .from("video_items")
      .update({ status: "posted_successfully", updated_at: new Date().toISOString() })
      .eq("id", item.id);
    engineStats.postedCount += 1;
    engineStats.lastPostedSummary = `Video "${(item.idea || "").slice(0, 60)}" đã đăng ${shorts ? "YouTube Shorts/Facebook" : "Facebook"}`;
    return true;
  }

  await client
    .from("video_items")
    .update({ status: "error", updated_at: new Date().toISOString() })
    .eq("id", item.id);
  engineStats.failedCount += 1;
  engineStats.lastError = lastError;
  console.error(`[auto-post] video ${item.id} THẤT BẠI: ${lastError}`);
  return false;
}

function isFacebookPlatform(platform?: string[] | null): boolean {
  return (platform || []).some((p) => (p || "").startsWith("Facebook"));
}

function isSupportedVideoPlatform(platform?: string[] | null): boolean {
  return (platform || []).some(
    (p) => (p || "").startsWith("Facebook") || (p || "").startsWith("Youtube"),
  );
}

/** Quét + đăng tất cả item đến hạn. Gọi từ timer và từ "Đăng ngay". */
export async function runAutoPostSweep(): Promise<SweepResult> {
  const result: SweepResult = { posted: 0, failed: 0, skippedUnsupported: 0 };
  const client = getServiceClient();
  if (!client) return result;

  const now = Date.now();

  // --- content_items ---
  const { data: contents } = await client
    .from("content_items")
    .select("id,idea,caption,image_links,platform,account_ids,posting_time")
    .eq("status", "content_approved");
  for (const item of contents || []) {
    const due = parseVnPostingTime(item.posting_time);
    if (!due || due.getTime() > now) continue;
    if (!isFacebookPlatform(item.platform)) {
      result.skippedUnsupported += 1;
      continue;
    }
    if (!(await claimItem("content_items", item.id))) continue;
    if (await processContentItem(client, item)) result.posted += 1;
    else result.failed += 1;
  }

  // --- video_items ---
  const { data: videos } = await client
    .from("video_items")
    .select("id,idea,title,caption,video_link,platform,account_ids,posting_time")
    .eq("status", "content_approved");
  for (const item of videos || []) {
    const due = parseVnPostingTime(item.posting_time);
    if (!due || due.getTime() > now) continue;
    if (!isSupportedVideoPlatform(item.platform)) {
      result.skippedUnsupported += 1;
      continue;
    }
    if (!(await claimItem("video_items", item.id))) continue;
    if (await processVideoItem(client, item)) result.posted += 1;
    else result.failed += 1;
  }

  return result;
}

let sweepInFlight = false;

async function guardedSweep() {
  if (sweepInFlight) return;
  sweepInFlight = true;
  try {
    engineStats.lastSweepAt = new Date().toISOString();
    engineStats.sweeps += 1;
    await runAutoPostSweep();
  } catch (e: unknown) {
    engineStats.lastError = e instanceof Error ? e.message : String(e);
    console.error("[auto-post] sweep error:", e);
  } finally {
    sweepInFlight = false;
  }
}

/** Khởi động vòng quét định kỳ — gọi 1 lần từ instrumentation.ts */
export function startAutoPostEngine() {
  const client = getServiceClient();
  if (!client) {
    console.error("[auto-post] thiếu NEXT_PUBLIC_SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY — engine KHÔNG khởi động");
    return;
  }
  if (engineStats.enabled) return;
  engineStats.enabled = true;
  engineStats.startedAt = new Date().toISOString();
  console.log("[auto-post] engine đã khởi động — quét mỗi 60s");
  setTimeout(() => void guardedSweep(), 5_000);
  const timer = setInterval(() => void guardedSweep(), SWEEP_INTERVAL_MS);
  // Không giữ process chỉ vì timer (Next standalone tự quản lý vòng đời)
  if (typeof timer.unref === "function") timer.unref();
}
