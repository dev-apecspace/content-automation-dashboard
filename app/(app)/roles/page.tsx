"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Shield,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Role,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/lib/api/roles";
import { RoleFormModal } from "@/components/roles/role-form-modal";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/use-permissions";

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission } = usePermissions();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const data = await getRoles();
      setRoles(data);
    } catch (error) {
      toast.error("Failed to load roles");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    try {
      setIsSubmitting(true);
      const newRole = await createRole(formData);
      setRoles((prev) => [...prev, newRole]);
      setIsModalOpen(false);
      toast.success("Tạo vai trò thành công");
    } catch (error: any) {
      toast.error(error.message || "Tạo vai trò thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!editingRole) return;
    try {
      setIsSubmitting(true);
      const updatedRole = await updateRole(editingRole.id, formData);
      setRoles((prev) =>
        prev.map((r) => (r.id === updatedRole.id ? updatedRole : r))
      );
      setIsModalOpen(false);
      setEditingRole(null);
      toast.success("Cập nhật thành công");
    } catch (error: any) {
      toast.error("Cập nhật thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id === "admin") {
      toast.error("Không thể xóa vai trò Admin");
      return;
    }
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa vai trò này? Việc này có thể ảnh hưởng đến người dùng đang được gán quyền."
      )
    )
      return;
    try {
      await deleteRole(id);
      setRoles((prev) => prev.filter((r) => r.id !== id));
      toast.success("Đã xóa vai trò");
    } catch (error) {
      toast.error("Xóa thất bại");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 drop-shadow-sm">
            Quản lý phân quyền
          </h2>
          <p className="text-slate-500 font-medium">
            Quản lý vai trò và phân quyền
          </p>
        </div>

        {hasPermission("roles.create") && (
          <Button
            onClick={() => {
              setEditingRole(null);
              setIsModalOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-md shadow-purple-200 border-0 h-9"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm vai trò
          </Button>
        )}
      </div>

      {/* Roles Table */}
      <Card className="bg-white/60 backdrop-blur-xl border-white/60 shadow-lg rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-sm text-slate-600 w-[200px]">
                  Vai trò (ID)
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600 w-[200px]">
                  Tên hiển thị
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Mô tả
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600 w-[100px]">
                  Quyền
                </th>
                <th className="text-right p-4 font-semibold text-sm text-slate-600 w-[100px]">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Chưa có vai trò nào được định nghĩa.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm text-slate-500">
                      {role.id}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-purple-500" />
                        <span className="font-medium text-slate-800">
                          {role.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {role.description}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className="bg-slate-200/50">
                        {role.permissions?.length || 0} quyền
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission("roles.edit") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingRole(role);
                              setIsModalOpen(true);
                            }}
                            className="hover:bg-white/60 hover:text-purple-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission("roles.delete") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(role.id)}
                            disabled={role.id === "admin"}
                            className="text-red-400 hover:text-red-600 hover:bg-white/60 disabled:opacity-30 disabled:hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRole(null);
        }}
        onSubmit={editingRole ? handleUpdate : handleCreate}
        initialData={editingRole}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
