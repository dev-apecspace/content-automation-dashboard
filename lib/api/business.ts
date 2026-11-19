"use server";

import { supabase } from "@/lib/supabase";
import { createActivityLog } from "@/lib/api/activity-logs";

// ============================================================
// Cấu trúc kinh doanh: Ngành hàng, Gói dịch vụ, Khách hàng,
// Giao dịch mua gói. ID sinh kiểu epoch string (khớp users).
// ============================================================

function genId(): string {
  return Date.now().toString() + Math.floor(Math.random() * 900 + 100).toString();
}

// ---------- NGÀNH HÀNG ----------
export interface Industry {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getIndustries(activeOnly = false): Promise<Industry[]> {
  let query = supabase.from("industries").select("*");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query.order("name", { ascending: true });
  if (error) {
    console.error("Error fetching industries:", error);
    throw error;
  }
  return data || [];
}

export async function createIndustry(
  payload: Omit<Industry, "id" | "created_at" | "updated_at">
): Promise<Industry> {
  const { data, error } = await supabase
    .from("industries")
    .insert({ ...payload, id: genId() })
    .select()
    .single();
  if (error) {
    console.error("Error creating industry:", error);
    throw error;
  }
  await createActivityLog("create", "industry", data.id, {
    userId: null,
    description: `Tạo ngành hàng mới: ${data.name}`,
  }).catch(() => {});
  return data;
}

export async function updateIndustry(
  id: string,
  payload: Partial<Omit<Industry, "id" | "created_at" | "updated_at">>
): Promise<Industry> {
  const { data, error } = await supabase
    .from("industries")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Error updating industry:", error);
    throw error;
  }
  return data;
}

export async function deleteIndustry(id: string): Promise<void> {
  const { error } = await supabase.from("industries").delete().eq("id", id);
  if (error) {
    console.error("Error deleting industry:", error);
    throw error;
  }
}

// ---------- GÓI DỊCH VỤ ----------
export interface Package {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  max_projects: number | null;
  features: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getPackages(activeOnly = false): Promise<Package[]> {
  let query = supabase.from("packages").select("*");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query
    .order("price", { ascending: true });
  if (error) {
    console.error("Error fetching packages:", error);
    throw error;
  }
  return data || [];
}

export async function createPackage(
  payload: Omit<Package, "id" | "created_at" | "updated_at">
): Promise<Package> {
  const { data, error } = await supabase
    .from("packages")
    .insert({ ...payload, id: genId() })
    .select()
    .single();
  if (error) {
    console.error("Error creating package:", error);
    throw error;
  }
  await createActivityLog("create", "package", data.id, {
    userId: null,
    description: `Tạo gói dịch vụ: ${data.name}`,
  }).catch(() => {});
  return data;
}

export async function updatePackage(
  id: string,
  payload: Partial<Omit<Package, "id" | "created_at" | "updated_at">>
): Promise<Package> {
  const { data, error } = await supabase
    .from("packages")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Error updating package:", error);
    throw error;
  }
  return data;
}

export async function deletePackage(id: string): Promise<void> {
  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) {
    // Lỗi FK: gói đang có giao dịch mua → thông báo thân thiện
    if (error.code === "23503") {
      throw new Error(
        "Gói này đang có giao dịch mua gói, không thể xóa. Vô hiệu hóa gói thay vì xóa."
      );
    }
    console.error("Error deleting package:", error);
    throw error;
  }
}

// ---------- KHÁCH HÀNG ----------
export interface Customer {
  id: string;
  name: string;
  slug: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  industry_id: string | null;
  status: "active" | "inactive";
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  industry?: { id: string; name: string } | null;
}

export interface CustomerWithStats extends Customer {
  subscription_count?: number;
  total_paid?: number;
}

export async function getCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*, industry:industry_id(id, name)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching customers:", error);
    throw error;
  }
  return data || [];
}

/** Bỏ dấu tiếng Việt → slug URL: "APEC GLOBAL" → "apec-global" */
function slugifyVi(name: string): string {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "cong-ty";
  return base;
}

async function uniqueSlug(name: string, ignoreId?: string): Promise<string> {
  const base = slugifyVi(name);
  const { data } = await supabase
    .from("customers")
    .select("id, slug")
    .ilike("slug", `${base}%`);
  const taken = new Set(
    (data || []).filter((c) => c.id !== ignoreId).map((c) => c.slug)
  );
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/**
 * Tra cứu khách hàng theo slug (URL /{slug}). Guard: chỉ cần đăng nhập —
 * dùng cho trang workspace /[slug] của cả admin lẫn user khách.
 */
export async function getCustomerBySlug(slug: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*, industry:industry_id(id, name)")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data || null;
}

/** Công ty mà một user thuộc về (user khách): customer_id + slug. */
export async function resolveCustomerForUser(
  userId: string
): Promise<{ customer_id: string | null; slug: string | null; name: string | null }> {
  const { data } = await supabase
    .from("users")
    .select("customer_id")
    .eq("id", userId)
    .single();
  if (!data?.customer_id) {
    return { customer_id: null, slug: null, name: null };
  }
  const { data: c } = await supabase
    .from("customers")
    .select("id, slug, name")
    .eq("id", data.customer_id)
    .single();
  return {
    customer_id: c?.id ?? null,
    slug: c?.slug ?? null,
    name: c?.name ?? null,
  };
}

export async function createCustomer(
  payload: Omit<Customer, "id" | "created_at" | "updated_at" | "industry">
): Promise<Customer> {
  const { industry, ...fields } = payload as Customer;
  const slug = fields.slug || (await uniqueSlug(fields.name));
  const { data, error } = await supabase
    .from("customers")
    .insert({ ...fields, slug, id: genId() })
    .select()
    .single();
  if (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
  await createActivityLog("create", "customer", data.id, {
    userId: null,
    description: `Thêm khách hàng mới: ${data.name}`,
  }).catch(() => {});
  return data;
}

export async function updateCustomer(
  id: string,
  payload: Partial<Omit<Customer, "id" | "created_at" | "updated_at" | "industry">>
): Promise<Customer> {
  const { industry, ...fields } = payload as Customer;
  const { data, error } = await supabase
    .from("customers")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
  return data;
}

export async function deleteCustomer(id: string): Promise<void> {
  // subscriptions có ON DELETE CASCADE → xóa khách sẽ xóa giao dịch của họ
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) {
    console.error("Error deleting customer:", error);
    throw error;
  }
}

// ---------- GIAO DỊCH MUA GÓI ----------
export interface Subscription {
  id: string;
  customer_id: string;
  package_id: string;
  start_date: string;
  end_date: string | null;
  price_paid: number;
  payment_status: "unpaid" | "partial" | "paid";
  payment_method: string | null;
  status: "active" | "expired" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  customer?: { id: string; name: string; company: string | null } | null;
  package?: { id: string; name: string; duration_days: number } | null;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "*, customer:customer_id(id, name, company), package:package_id(id, name, duration_days)"
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching subscriptions:", error);
    throw error;
  }
  return data || [];
}

export async function createSubscription(
  payload: {
    customer_id: string;
    package_id: string;
    start_date: string;
    price_paid: number;
    payment_status: Subscription["payment_status"];
    payment_method?: string | null;
    notes?: string | null;
  }
): Promise<Subscription> {
  // Tự tính end_date từ thời hạn gói
  const pkg = await supabase
    .from("packages")
    .select("duration_days")
    .eq("id", payload.package_id)
    .single();
  const duration = pkg.data?.duration_days ?? 30;
  const end = new Date(payload.start_date);
  end.setDate(end.getDate() + duration);

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      ...payload,
      payment_method: payload.payment_method ?? null,
      notes: payload.notes ?? null,
      end_date: end.toISOString().slice(0, 10),
      status: "active",
      id: genId(),
    })
    .select()
    .single();
  if (error) {
    console.error("Error creating subscription:", error);
    throw error;
  }
  await createActivityLog("create", "subscription", data.id, {
    userId: null,
    description: `Ghi nhận giao dịch mua gói (khách ${data.customer_id})`,
  }).catch(() => {});
  return data;
}

export async function updateSubscription(
  id: string,
  payload: Partial<Omit<Subscription, "id" | "created_at" | "updated_at" | "customer" | "package">>
): Promise<Subscription> {
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("Error updating subscription:", error);
    throw error;
  }
  return data;
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase.from("subscriptions").delete().eq("id", id);
  if (error) {
    console.error("Error deleting subscription:", error);
    throw error;
  }
}

// ---------- QUYỀN THEO GÓI ----------
export async function getPackagePermissions(
  packageId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from("package_permissions")
    .select("permission_id")
    .eq("package_id", packageId);
  if (error) {
    console.error("Error fetching package permissions:", error);
    throw error;
  }
  return (data || []).map((r) => r.permission_id);
}

export async function setPackagePermissions(
  packageId: string,
  permissionIds: string[]
): Promise<void> {
  // Ghi đè toàn bộ: xóa cũ → insert mới (gói ít quyền, đơn giản là tốt)
  const { error: delErr } = await supabase
    .from("package_permissions")
    .delete()
    .eq("package_id", packageId);
  if (delErr) {
    console.error("Error clearing package permissions:", delErr);
    throw delErr;
  }
  if (permissionIds.length === 0) return;
  const { error } = await supabase
    .from("package_permissions")
    .insert(permissionIds.map((permission_id) => ({ package_id: packageId, permission_id })));
  if (error) {
    console.error("Error setting package permissions:", error);
    throw error;
  }
}
