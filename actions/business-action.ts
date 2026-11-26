"use server";

import {
  getIndustries as apiGetIndustries,
  createIndustry as apiCreateIndustry,
  updateIndustry as apiUpdateIndustry,
  deleteIndustry as apiDeleteIndustry,
  getPackages as apiGetPackages,
  createPackage as apiCreatePackage,
  updatePackage as apiUpdatePackage,
  deletePackage as apiDeletePackage,
  getCustomers as apiGetCustomers,
  createCustomer as apiCreateCustomer,
  updateCustomer as apiUpdateCustomer,
  deleteCustomer as apiDeleteCustomer,
  getSubscriptions as apiGetSubscriptions,
  createSubscription as apiCreateSubscription,
  updateSubscription as apiUpdateSubscription,
  deleteSubscription as apiDeleteSubscription,
  getCustomerBySlug as apiGetCustomerBySlug,
  resolveCustomerForUser as apiResolveCustomerForUser,
  getPackagePermissions as apiGetPackagePermissions,
  setPackagePermissions as apiSetPackagePermissions,
  getAccessibleCompanies as apiGetAccessibleCompanies,
  checkUserCompanyAccess as apiCheckUserCompanyAccess,
  getUserCompanyIds as apiGetUserCompanyIds,
  setUserCompanyIds as apiSetUserCompanyIds,
  getCompanyMainAccounts as apiGetCompanyMainAccounts,
} from "@/lib/api/business";
import { getCurrentUser } from "@/lib/auth/permissions";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth/permissions";

// ---------- NGÀNH HÀNG ----------
export async function getIndustries(activeOnly = false) {
  await requirePermission("industries.view");
  return await apiGetIndustries(activeOnly);
}

export async function createIndustry(formData: any) {
  await requirePermission("industries.create");
  const industry = await apiCreateIndustry(formData);
  revalidatePath("/industries");
  return industry;
}

export async function updateIndustry(id: string, formData: any) {
  await requirePermission("industries.edit");
  const industry = await apiUpdateIndustry(id, formData);
  revalidatePath("/industries");
  return industry;
}

export async function deleteIndustry(id: string) {
  await requirePermission("industries.delete");
  await apiDeleteIndustry(id);
  revalidatePath("/industries");
}

// ---------- GÓI DỊCH VỤ ----------
export async function getPackages(activeOnly = false) {
  await requirePermission("packages.view");
  return await apiGetPackages(activeOnly);
}

export async function createPackage(formData: any) {
  await requirePermission("packages.create");
  const pkg = await apiCreatePackage(formData);
  revalidatePath("/packages");
  return pkg;
}

export async function updatePackage(id: string, formData: any) {
  await requirePermission("packages.edit");
  const pkg = await apiUpdatePackage(id, formData);
  revalidatePath("/packages");
  return pkg;
}

export async function deletePackage(id: string) {
  await requirePermission("packages.delete");
  await apiDeletePackage(id);
  revalidatePath("/packages");
}

// ---------- KHÁCH HÀNG ----------
export async function getCustomers() {
  await requirePermission("customers.view");
  return await apiGetCustomers();
}

export async function createCustomer(formData: any) {
  await requirePermission("customers.create");
  const customer = await apiCreateCustomer(formData);
  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: string, formData: any) {
  await requirePermission("customers.edit");
  const customer = await apiUpdateCustomer(id, formData);
  revalidatePath("/customers");
  return customer;
}

export async function deleteCustomer(id: string) {
  await requirePermission("customers.delete");
  await apiDeleteCustomer(id);
  revalidatePath("/customers");
}

// ---------- GIAO DỊCH MUA GÓI ----------
export async function getSubscriptions() {
  await requirePermission("subscriptions.view");
  return await apiGetSubscriptions();
}

export async function createSubscription(formData: any) {
  await requirePermission("subscriptions.create");
  const sub = await apiCreateSubscription(formData);
  revalidatePath("/subscriptions");
  return sub;
}

export async function updateSubscription(id: string, formData: any) {
  await requirePermission("subscriptions.edit");
  const sub = await apiUpdateSubscription(id, formData);
  revalidatePath("/subscriptions");
  return sub;
}

export async function deleteSubscription(id: string) {
  await requirePermission("subscriptions.delete");
  await apiDeleteSubscription(id);
  revalidatePath("/subscriptions");
}

// ---------- TRA CỨU CÔNG TY THEO SLUG (guard: chỉ cần đăng nhập) ----------
// Dùng cho trang workspace /[slug] và chọn công ty — không yêu cầu
// customers.view vì user khách cũng phải vào được công ty của mình.
export async function getCustomerBySlug(slug: string) {
  const me = await getCurrentUser();
  if (!me) throw new Error("Chưa đăng nhập");
  return await apiGetCustomerBySlug(slug);
}

export async function resolveCustomerForUser(userId: string) {
  const me = await getCurrentUser();
  if (!me) throw new Error("Chưa đăng nhập");
  return await apiResolveCustomerForUser(userId);
}

// ---------- QUYỀN THEO GÓI ----------
export async function getPackagePermissions(packageId: string) {
  await requirePermission("packages.view");
  return await apiGetPackagePermissions(packageId);
}

export async function setPackagePermissions(
  packageId: string,
  permissionIds: string[]
) {
  await requirePermission("packages.edit");
  await apiSetPackagePermissions(packageId, permissionIds);
  revalidatePath("/packages");
}

// ---------- CHỌN CÔNG TY ĐANG QUẢN LÝ (cookie selected_company) ----------
/**
 * Chọn công ty để quản lý dữ liệu nghiệp vụ. Verify quyền vào công ty:
 *  - Admin: tất cả
 *  - User khách: chỉ công ty của mình
 *  - Nhân viên: phải được phân qua user_companies
 */
export async function selectCompany(slug: string): Promise<boolean> {
  const me = await getCurrentUser();
  if (!me) throw new Error("Chưa đăng nhập");

  const customer = await apiGetCustomerBySlug(slug);
  if (!customer) return false;

  if (me.role === "customer") {
    const mine = await apiResolveCustomerForUser(me.userId);
    if (mine.customer_id !== customer.id) return false;
  } else if (me.role !== "admin") {
    const ok = await apiCheckUserCompanyAccess(me.userId, customer.id);
    if (!ok) return false;
  }

  (await cookies()).set("selected_company", slug, {
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  return true;
}

/** Thoát khỏi xem công ty → dữ liệu nghiệp vụ trở về toàn bộ workspace */
export async function clearSelectedCompany(): Promise<void> {
  (await cookies()).delete("selected_company");
}

/** Công ty đang chọn (hiện banner tên công ty trên layout) */
export async function getSelectedCompanyInfo() {
  const me = await getCurrentUser();
  if (!me || me.role === "customer") return null;
  const slug = (await cookies()).get("selected_company")?.value;
  if (!slug) return null;
  const c = await apiGetCustomerBySlug(slug);
  return c ? { slug: c.slug, name: c.name } : null;
}

// ---------- PHÂN QUYỀN NHÂN VIÊN VÀO CÔNG TY ----------
export async function getAccessibleCompanies() {
  const me = await getCurrentUser();
  if (!me) throw new Error("Chưa đăng nhập");
  return await apiGetAccessibleCompanies();
}

export async function getUserCompanies(userId: string) {
  await requirePermission("users.view");
  return await apiGetUserCompanyIds(userId);
}

export async function setUserCompanies(userId: string, customerIds: string[]) {
  await requirePermission("users.edit");
  await apiSetUserCompanyIds(userId, customerIds);
  revalidatePath("/users");
}

/** Tài khoản chính của các công ty (admin) — email/sđt công ty = tk này */
export async function getCompanyMainAccounts(customerIds: string[]) {
  await requirePermission("users.view");
  return await apiGetCompanyMainAccounts(customerIds);
}
