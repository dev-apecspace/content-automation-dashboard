"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { Role, Permission, getAllPermissions } from "@/lib/api/roles";

const roleSchema = z.object({
  id: z
    .string()
    .min(2, "Mã vai trò phải có ít nhất 2 ký tự")
    .regex(
      /^[a-z0-9-_]+$/,
      "Mã vai trò chỉ chứa chữ thường, số, dấu gạch ngang và gạch dưới"
    ),
  name: z.string().min(2, "Tên vai trò phải có ít nhất 2 ký tự"),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoleFormValues) => Promise<void>;
  initialData?: Role | null;
  isSubmitting?: boolean;
}

export function RoleFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isSubmitting,
}: RoleFormModalProps) {
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      id: "",
      name: "",
      description: "",
      permissions: [],
    },
  });

  const selectedPermissions = watch("permissions");

  // Load available permissions from DB
  useEffect(() => {
    async function load() {
      try {
        const perms = await getAllPermissions();
        setAvailablePermissions(perms);
      } catch (e) {
        console.error("Failed to load permissions", e);
      } finally {
        setLoadingPermissions(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (initialData) {
      setValue("id", initialData.id);
      setValue("name", initialData.name);
      setValue("description", initialData.description);
      setValue("permissions", initialData.permissions || []);
    } else {
      reset({
        id: "",
        name: "",
        description: "",
        permissions: [],
      });
    }
  }, [initialData, setValue, reset, isOpen]);

  const togglePermission = (permissionId: string) => {
    const current = selectedPermissions || [];
    if (current.includes(permissionId)) {
      setValue(
        "permissions",
        current.filter((id) => id !== permissionId)
      );
    } else {
      setValue("permissions", [...current, permissionId]);
    }
  };

  const handleSelectAllGroup = (group: string, isChecked: boolean) => {
    const groupPermissions = availablePermissions
      .filter((p) => p.group === group)
      .map((p) => p.id);
    const current = selectedPermissions || [];

    if (isChecked) {
      // Add all from group if not present
      const toAdd = groupPermissions.filter((id) => !current.includes(id));
      setValue("permissions", [...current, ...toAdd]);
    } else {
      // Remove all from group
      setValue(
        "permissions",
        current.filter((id) => !groupPermissions.includes(id))
      );
    }
  };

  // Group permissions for display
  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900/90 backdrop-blur-xl border-white/10 text-slate-100 sm:max-w-[700px] h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col flex-1 min-h-0"
        >
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              {initialData ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="id" className="text-slate-300">
                  Mã vai trò (ID)
                </Label>
                <Input
                  id="id"
                  {...register("id")}
                  placeholder="vd: content_manager"
                  disabled={!!initialData} // ID immutable after creation
                  className="bg-black/20 border-white/10 text-white focus:border-purple-500/50 disabled:opacity-50"
                />
                {errors.id && (
                  <p className="text-red-400 text-xs">{errors.id.message}</p>
                )}
                <p className="text-xs text-slate-500">
                  Mã duy nhất dùng trong hệ thống (slug).
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Tên hiển thị
                </Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="vd: Quản lý Nội dung"
                  className="bg-black/20 border-white/10 text-white focus:border-purple-500/50"
                />
                {errors.name && (
                  <p className="text-red-400 text-xs">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">
                Mô tả
              </Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Mô tả chức năng của vai trò này..."
                className="bg-black/20 border-white/10 text-white focus:border-purple-500/50 min-h-[80px]"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-slate-200">
                Phân quyền
              </Label>
              {loadingPermissions ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                </div>
              ) : availablePermissions.length === 0 ? (
                <p className="text-slate-400 italic text-center p-8">
                  Không tìm thấy danh sách quyền hạn. Vui lòng kiểm tra
                  Database.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(groupedPermissions).map(([group, perms]) => {
                    const groupPermissionIds = perms.map((p) => p.id);
                    const isAllSelected = groupPermissionIds.every((id) =>
                      selectedPermissions.includes(id)
                    );
                    const isIndeterminate =
                      groupPermissionIds.some((id) =>
                        selectedPermissions.includes(id)
                      ) && !isAllSelected;

                    return (
                      <div
                        key={group}
                        className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/5"
                      >
                        <div className="flex items-center space-x-2 border-b border-white/10 pb-2 mb-2">
                          <Checkbox
                            id={`group-${group}`}
                            checked={
                              isAllSelected ||
                              (isIndeterminate ? "indeterminate" : false)
                            }
                            onCheckedChange={(checked) =>
                              handleSelectAllGroup(group, checked === true)
                            }
                            onClick={() =>
                              handleSelectAllGroup(group, !isAllSelected)
                            }
                          />
                          <Label
                            htmlFor={`group-${group}`}
                            className="text-base font-medium text-purple-300 cursor-pointer"
                          >
                            {group}
                          </Label>
                        </div>
                        <div className="space-y-2">
                          {perms.map((perm) => (
                            <div
                              key={perm.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={perm.id}
                                checked={selectedPermissions.includes(perm.id)}
                                onCheckedChange={() =>
                                  togglePermission(perm.id)
                                }
                              />
                              <Label
                                htmlFor={perm.id}
                                className="text-slate-300 font-normal cursor-pointer text-sm"
                              >
                                {perm.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="hover:bg-white/10 hover:text-white text-slate-400 cursor-pointer"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
