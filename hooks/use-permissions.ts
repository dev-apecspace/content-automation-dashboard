"use client";

import { useState, useEffect } from "react";
import { getMyPermissions } from "@/actions/auth-actions"; // We will create this
import { PermissionId } from "@/lib/constants/permissions";

export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getMyPermissions();
        setPermissions(data.permissions);
        setRole(data.role);
      } catch (error) {
        console.error("Failed to load permissions", error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const hasPermission = (permission: PermissionId) => {
    if (isLoading) return false;
    if (role === "admin") return true;
    return permissions.includes(permission);
  };

  return { permissions, role, isLoading, hasPermission };
}
