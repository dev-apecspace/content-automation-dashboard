"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  ExternalLink,
  Loader2,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Customer } from "@/lib/api/business";
import {
  getAccessibleCompanies,
  getIndustries,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  selectCompany,
} from "@/actions/business-action";
import { formatDateVi } from "@/lib/utils/format";
import { usePermissions } from "@/hooks/use-permissions";

/**
 * Công ty: admin hệ thống thấy TẤT CẢ + thêm/sửa/xóa; nhân viên chỉ thấy
 * công ty được admin phân; user khách thấy công ty của mình. Bấm thẻ →
 * workspace /{slug}, mọi dữ liệu nghiệp vụ sẽ scope theo công ty đó.
 */
export default function CompaniesPage() {
  const router = useRouter();
  const { role } = usePermissions();
  const isAdmin = role === "admin";

  const [companies, setCompanies] = useState<Customer[]>([]);
  const [industries, setIndustries] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: "",
    status: "active",
    industry_id: "",
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cs, inds] = await Promise.all([
        getAccessibleCompanies(),
        getIndustries().catch(() => []),
      ]);
      setCompanies(cs);
      setIndustries(inds);
    } catch {
      toast.error("Không tải được danh sách công ty");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", status: "active", industry_id: "" });
    setIsModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      status: c.status || "active",
      industry_id: c.industry_id || "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Nhập tên công ty");
      return;
    }
    try {
      setIsSaving(true);
      if (editing) {
        await updateCustomer(editing.id, {
          name: form.name.trim(),
          status: form.status,
          industry_id: form.industry_id || null,
        });
        toast.success("Đã cập nhật công ty!");
      } else {
        // Slug workspace tự sinh bỏ dấu tiếng Việt ("APEC GLOBAL" → apec-global)
        await createCustomer({
          name: form.name.trim(),
          company: form.name.trim(),
          status: form.status,
          industry_id: form.industry_id || null,
        });
        toast.success("Đã thêm công ty!");
      }
      setIsModalOpen(false);
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Lưu công ty thất bại");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (c: Customer) => {
    if (
      !confirm(
        `Xóa công ty "${c.name}"? Dự án của công ty sẽ được gỡ gắn kết (không mất dữ liệu dự án, nhưng không còn thuộc công ty nào).`,
      )
    )
      return;
    try {
      await deleteCustomer(c.id);
      toast.success("Đã xóa công ty");
      await load();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Xóa công ty thất bại");
    }
  };

  const handleSelect = async (c: Customer) => {
    if (!c.slug) {
      toast.error("Công ty chưa có slug — chạy lại SQL mới để cập nhật");
      return;
    }
    const ok = await selectCompany(c.slug);
    if (!ok) {
      toast.error("Bạn không có quyền vào công ty này");
      return;
    }
    router.push(`/${c.slug}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Building2 className="h-6 w-6" /> Công ty
          </h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Chọn công ty để quản lý — mỗi công ty có workspace riêng /{slug}, thêm/sửa/xóa ngay tại đây"
              : "Các công ty bạn được phân quyền quản lý"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate} className="bg-indigo-600 text-white">
            <Plus className="h-4 w-4 mr-2" /> Thêm công ty
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : companies.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          {isAdmin
            ? 'Chưa có công ty nào. Bấm "Thêm công ty" để tạo.'
            : "Bạn chưa được phân quyền vào công ty nào."}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((c) => (
            <Card
              key={c.id}
              className={
                "group flex flex-col gap-3 p-5 transition-all " +
                (c.slug
                  ? "cursor-pointer hover:border-indigo-300 hover:shadow-md"
                  : "opacity-70")
              }
              onClick={() => handleSelect(c)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-indigo-500/10 p-2.5">
                    <Building2 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{c.name}</h3>
                    <p className="font-mono text-xs text-muted-foreground">
                      /{c.slug || "chưa-có-slug"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {c.slug && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEdit(c);
                        }}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {c.industry && (
                  <Badge variant="outline">{c.industry.name}</Badge>
                )}
                <Badge
                  variant="outline"
                  className={
                    c.status === "active"
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                      : "border-zinc-500/20 bg-zinc-500/10 text-zinc-500"
                  }
                >
                  {c.status === "active" ? "Đang hợp tác" : "Ngừng hợp tác"}
                </Badge>
              </div>

              <p className="mt-auto text-xs text-muted-foreground">
                Tham gia từ {formatDateVi(c.created_at)}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Modal thêm/sửa công ty */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Sửa công ty" : "Thêm công ty mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">Tên công ty</Label>
              <Input
                id="c-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: APEC GLOBAL"
              />
              {!editing && (
                <p className="text-xs text-muted-foreground">
                  Slug workspace tự sinh từ tên (bỏ dấu tiếng Việt)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Ngành hàng</Label>
              <Select
                value={form.industry_id || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, industry_id: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn ngành" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Chưa phân ngành</SelectItem>
                  {industries.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hợp tác</SelectItem>
                  <SelectItem value="inactive">Ngừng hợp tác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
