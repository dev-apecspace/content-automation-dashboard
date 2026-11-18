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
} from "@/lib/api/business";
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
