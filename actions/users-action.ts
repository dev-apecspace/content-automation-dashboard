"use server";

import {
  createUser as apiCreateUser,
  updateUser as apiUpdateUser,
  deactivateUser as apiDeactivateUser,
  getUsers as apiGetUsers,
} from "@/lib/api/users";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  return await apiGetUsers();
}

export async function createUser(formData: any) {
  // Simple wrapper, validation should happen here or in API
  const user = await apiCreateUser(formData);
  revalidatePath("/users");
  return user;
}

export async function updateUser(id: string, formData: any) {
  const user = await apiUpdateUser(id, formData);
  revalidatePath("/users");
  return user;
}

export async function deactivateUser(id: string) {
  const user = await apiDeactivateUser(id);
  revalidatePath("/users");
  return user;
}
