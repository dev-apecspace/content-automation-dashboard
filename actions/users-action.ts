"use server";

import {
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deactivateUser as apiDeactivateUser,
  getUsers as apiGetUsers,
  deleteUser as apiDeleteUser,
} from "@/lib/api/users";
import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/permissions";

export async function getUsers() {
  await requirePermission("users.view");
  return await apiGetUsers();
}

export async function createUser(formData: any) {
  await requirePermission("users.create");
  // Simple wrapper, validation should happen here or in API
  const user = await apiCreateUser(formData);
  revalidatePath("/users");
  return user;
}

export async function updateUser(id: string, formData: any) {
  await requirePermission("users.edit");
  const user = await apiUpdateUser(id, formData);
  revalidatePath("/users");
  return user;
}

export async function deactivateUser(id: string) {
  await requirePermission("users.delete");
  const user = await apiDeactivateUser(id);
  revalidatePath("/users");
  return user;
}

export async function deleteUser(id: string) {
  await requirePermission("users.delete");
  await apiDeleteUser(id);
  revalidatePath("/users");
}
