"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Edit2, Trash2, Tags } from "lucide-react";
import { toast } from "sonner";
import type { Industry } from "@/lib/api/business";
import {
  getIndustries,
  createIndustry,
  updateIndustry,
  deleteIndustry,
} from "@/actions/business-action";
import { usePermissions } from "@/hooks/use-permissions";

export default function IndustriesPage() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { hasPermission } = usePermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Industry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", is_active: true });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setIndustries(await getIndustries());
    } catch {
      toast.error("Không tải được ngành hàng. Kiểm tra đã chạy schema SQL chưa.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", is_active: true });
    setIsModalOpen(true);
  };

  const openEdit = (i: Industry) => {
    setEditing(i);
    setForm({
      name: i.name,
      description: i.description ?? "",
      is_active: i.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên ngành hàng");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        is_active: form.is_active,
      };
      if (editing) {
        await updateIndustry(editing.id, payload);
        toast.success("Đã cập nhật ngành hàng!");
      } else {
        await createIndustry(payload);
        toast.success("Đã thêm ngành hàng mới!");
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (i: Industry) => {
    if (!confirm(`Xóa ngành hàng "${i.name}"? Khách hàng thuộc ngành này sẽ thành "Chưa phân loại".`))
      return;
    try {
      await deleteIndustry(i.id);
      toast.success("Đã xóa ngành hàng");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không xóa được ngành hàng");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Tags className="h-6 w-6" /> Ngành hàng
          </h1>
          <p className="text-sm text-muted-foreground">
            Phân loại khách hàng theo lĩnh vực kinh doanh
          </p>
        </div>
        {hasPermission("industries.create" as any) && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Thêm ngành hàng
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : industries.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Chưa có ngành hàng nào. Bấm &quot;Thêm ngành hàng&quot; để bắt đầu.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {industries.map((i) => (
            <Card key={i.id} className="flex items-start justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{i.name}</h3>
                  <Badge
                    variant="outline"
                    className={
                      i.is_active
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                        : "border-zinc-500/20 bg-zinc-500/10 text-zinc-500"
                    }
                  >
                    {i.is_active ? "Đang dùng" : "Ẩn"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {i.description || "—"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {hasPermission("industries.edit" as any) && (
                  <Button variant="ghost" size="icon" onClick={() => openEdit(i)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                )}
                {hasPermission("industries.delete" as any) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(i)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa ngành hàng" : "Thêm ngành hàng mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên ngành *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Thời trang, Mỹ phẩm..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Đang dùng</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Lưu thay đổi" : "Thêm ngành"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
