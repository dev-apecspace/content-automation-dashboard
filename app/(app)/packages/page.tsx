"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Package as PackageIcon,
  Clock,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { Package } from "@/lib/api/business";
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} from "@/actions/business-action";
import { formatVnd } from "@/lib/utils/format";
import { usePermissions } from "@/hooks/use-permissions";
import { Checkbox } from "@/components/ui/checkbox";
import { PACKAGE_PERMISSION_GROUPS } from "@/lib/constants/permissions";
import {
  getPackagePermissions,
  setPackagePermissions,
} from "@/actions/business-action";

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { hasPermission } = usePermissions();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    duration_days: "30",
    max_projects: "",
    features: "",
    is_active: true,
  });
  // Quyền nghiệp vụ gắn với gói → user khách được gì khi mua gói này
  const [pkgPerms, setPkgPerms] = useState<string[]>([
    "projects.view",
    "content.view",
    "schedules.view",
    "accounts.view",
  ]);

  const loadPackages = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getPackages();
      setPackages(data);
    } catch {
      toast.error("Không tải được danh sách gói. Kiểm tra đã chạy schema SQL chưa.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      description: "",
      price: "",
      duration_days: "30",
      max_projects: "",
      features: "",
      is_active: true,
    });
    setPkgPerms(["projects.view", "content.view", "schedules.view", "accounts.view"]);
    setIsModalOpen(true);
  };

  const openEdit = (pkg: Package) => {
    setEditing(pkg);
    getPackagePermissions(pkg.id)
      .then((perms) => setPkgPerms(perms.length ? perms : []))
      .catch(() => setPkgPerms([]));
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      price: String(pkg.price ?? ""),
      duration_days: String(pkg.duration_days ?? 30),
      max_projects: pkg.max_projects == null ? "" : String(pkg.max_projects),
      features: pkg.features ?? "",
      is_active: pkg.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên gói");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: Number(form.price) || 0,
        duration_days: Number(form.duration_days) || 30,
        max_projects: form.max_projects ? Number(form.max_projects) : null,
        features: form.features.trim() || null,
        is_active: form.is_active,
      };
      let savedId = editing?.id;
      if (editing) {
        const updated = await updatePackage(editing.id, payload);
        savedId = updated.id;
        toast.success("Đã cập nhật gói dịch vụ!");
      } else {
        const created = await createPackage(payload);
        savedId = created.id;
        toast.success("Đã tạo gói dịch vụ mới!");
      }
      // Ghi đè quyền theo gói (user khách mua gói này sẽ được các quyền đã tick)
      if (savedId) {
        await setPackagePermissions(savedId, pkgPerms);
      }
      setIsModalOpen(false);
      loadPackages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pkg: Package) => {
    if (!confirm(`Xóa gói "${pkg.name}"? Nếu gói đang có giao dịch mua, hãy vô hiệu hóa thay vì xóa.`))
      return;
    try {
      await deletePackage(pkg.id);
      toast.success("Đã xóa gói dịch vụ");
      loadPackages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không xóa được gói");
    }
  };

  const toggleActive = async (pkg: Package, value: boolean) => {
    try {
      await updatePackage(pkg.id, { is_active: value });
      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, is_active: value } : p))
      );
      toast.success(value ? "Đã kích hoạt gói" : "Đã vô hiệu hóa gói");
    } catch {
      toast.error("Không cập nhật được trạng thái");
    }
  };

  const filtered = packages.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <PackageIcon className="h-6 w-6" /> Gói dịch vụ
          </h1>
          <p className="text-sm text-muted-foreground">
            Quản lý các gói bán cho khách hàng: giá, thời hạn, giới hạn và tính năng
          </p>
        </div>
        {hasPermission("packages.create" as any) && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Thêm gói mới
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm gói dịch vụ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Chưa có gói dịch vụ nào. Bấm &quot;Thêm gói mới&quot; để bắt đầu.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((pkg) => (
            <Card key={pkg.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {pkg.description || "—"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    pkg.is_active
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
                      : "border-zinc-500/20 bg-zinc-500/10 text-zinc-500"
                  }
                >
                  {pkg.is_active ? "Đang bán" : "Ẩn"}
                </Badge>
              </div>

              <p className="text-2xl font-bold text-primary">
                {formatVnd(pkg.price)}
                <span className="text-sm font-normal text-muted-foreground">
                  {" "}
                  / {pkg.duration_days} ngày
                </span>
              </p>

              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <FolderKanban className="h-3.5 w-3.5" />
                  {pkg.max_projects == null
                    ? "Không giới hạn dự án"
                    : `Tối đa ${pkg.max_projects} dự án`}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" /> {pkg.duration_days} ngày
                </span>
              </div>

              {pkg.features && (
                <ul className="space-y-1 text-sm">
                  {pkg.features
                    .split("\n")
                    .filter(Boolean)
                    .slice(0, 4)
                    .map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                </ul>
              )}

              <div className="mt-auto flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={pkg.is_active}
                    onCheckedChange={(v) => toggleActive(pkg, v)}
                    disabled={!hasPermission("packages.edit" as any)}
                  />
                  Đang bán
                </div>
                <div className="flex gap-1">
                  {hasPermission("packages.edit" as any) && (
                    <Button variant="ghost" size="icon" onClick={() => openEdit(pkg)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission("packages.delete" as any) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(pkg)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa gói dịch vụ" : "Thêm gói dịch vụ mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên gói *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Gói Chuyên nghiệp"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mô tả</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả ngắn về gói"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Giá (₫) *</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="1990000"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Thời hạn (ngày) *</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_days}
                  onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Số dự án tối đa (bỏ trống = không giới hạn)</Label>
              <Input
                type="number"
                min={1}
                value={form.max_projects}
                onChange={(e) => setForm({ ...form, max_projects: e.target.value })}
                placeholder="6"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Tính năng (mỗi dòng một tính năng)</Label>
              <Textarea
                rows={4}
                value={form.features}
                onChange={(e) => setForm({ ...form, features: e.target.value })}
                placeholder={"Quản lý 6 dự án\nĐăng đa nền tảng\nHỗ trợ ưu tiên"}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Quyền khách hàng được khi mua gói này
              </Label>
              <div className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-2">
                {PACKAGE_PERMISSION_GROUPS.map((group) => (
                  <div key={group.group} className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">
                      {group.group}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                      {group.perms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex cursor-pointer items-center gap-1.5 text-sm"
                        >
                          <Checkbox
                            checked={pkgPerms.includes(perm.id)}
                            onCheckedChange={(v) =>
                              setPkgPerms((prev) =>
                                v
                                  ? [...prev, perm.id]
                                  : prev.filter((x) => x !== perm.id)
                              )
                            }
                          />
                          {perm.label}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>Đang bán</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Lưu thay đổi" : "Tạo gói"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
