"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Shield,
  UserCircle,
  Mail,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { User } from "@/lib/api/users";
import {
  getUsers,
  createUser,
  updateUser,
  deactivateUser,
  deleteUser,
} from "@/actions/users-action";
import { UserFormModal } from "@/components/users/user-form-modal";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";

const roleColors: Record<string, string> = {
  admin: "bg-red-500/10 text-red-500 border-red-500/20",
  editor: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  viewer: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { hasPermission } = usePermissions();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (formData: any) => {
    if (!formData.password) {
      toast.error("Vui lòng nhập mật khẩu cho user mới");
      return;
    }
    try {
      setIsSubmitting(true);
      const newUser = await createUser(formData);
      setUsers((prev) => [newUser, ...prev]);
      setIsModalOpen(false);
      toast.success("Tạo người dùng thành công");
    } catch (error: any) {
      toast.error(error.message || "Tạo người dùng thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (formData: any) => {
    if (!editingUser) return;
    try {
      setIsSubmitting(true);
      // Clean password if empty to strictly avoid sending empty string
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      const updatedUser = await updateUser(editingUser.id, updateData);
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      );
      setIsModalOpen(false);
      setEditingUser(null);
      toast.success("Cập nhật thành công");
    } catch (error: any) {
      toast.error("Cập nhật thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn vô hiệu hóa người dùng này?")) return;
    try {
      await deactivateUser(id);
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)),
      );
      toast.success("Đã vô hiệu hóa người dùng");
    } catch (error) {
      toast.error("Vô hiệu hóa thất bại");
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await updateUser(id, { is_active: true });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: true } : u)),
      );
      toast.success("Đã kích hoạt người dùng");
    } catch (error) {
      toast.error("Kích hoạt thất bại");
    }
  };

  const handleToggleStatus = (user: User) => {
    if (user.is_active) {
      handleDeactivate(user.id);
    } else {
      handleActivate(user.id);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Bạn có chắc chắn muốn xóa vĩnh viễn người dùng này? Hành động này không thể hoàn tác.",
      )
    )
      return;
    try {
      await deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.success("Đã xóa vĩnh viễn người dùng");
    } catch (error) {
      toast.error("Xóa thất bại");
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-600 drop-shadow-sm">
            Quản lý người dùng
          </h2>
          <p className="text-slate-500 font-medium">
            Quản lý quyền truy cập và tài khoản hệ thống
          </p>
        </div>

        <div className="flex gap-3 bg-white/40 p-1.5 rounded-xl border border-white/60 shadow-sm backdrop-blur-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-[250px] bg-white/50 border-0 focus-visible:ring-0 focus-visible:bg-white transition-colors h-9"
            />
          </div>
          {hasPermission("users.create") && (
            <Button
              onClick={() => {
                setEditingUser(null);
                setIsModalOpen(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white shadow-md shadow-indigo-200 border-0 h-9"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm người dùng
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <Card className="bg-white/60 backdrop-blur-xl border-white/60 shadow-lg rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Người dùng
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Email
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Vai trò
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Trạng thái
                </th>
                <th className="text-left p-4 font-semibold text-sm text-slate-600">
                  Ngày tạo
                </th>
                <th className="text-right p-4 font-semibold text-sm text-slate-600">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/40">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-indigo-50/30 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-cyan-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">
                          {user.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-600 text-sm">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "uppercase text-xs font-bold shadow-sm backdrop-blur-sm",
                          roleColors[user.role] || roleColors.viewer,
                        )}
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => handleToggleStatus(user)}
                        />
                        <span
                          className={cn(
                            "text-xs font-medium",
                            user.is_active
                              ? "text-emerald-600"
                              : "text-slate-500",
                          )}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-500 text-sm">
                        <Calendar className="h-3 w-3" />
                        {user.created_at
                          ? format(new Date(user.created_at), "dd/MM/yyyy")
                          : "-"}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasPermission("users.edit") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingUser(user);
                              setIsModalOpen(true);
                            }}
                            className="hover:bg-white/60 hover:text-indigo-600"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission("users.delete") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-white/60"
                            title="Xóa vĩnh viễn"
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

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={editingUser ? handleUpdate : handleCreate}
        initialData={editingUser}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
