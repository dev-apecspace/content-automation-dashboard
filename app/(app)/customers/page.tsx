"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  Mail,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import type { Customer, Industry } from "@/lib/api/business";
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getIndustries,
} from "@/actions/business-action";
import { usePermissions } from "@/hooks/use-permissions";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const { hasPermission } = usePermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
    industry_id: "",
    status: "active" as Customer["status"],
    notes: "",
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [c, i] = await Promise.all([getCustomers(), getIndustries()]);
      setCustomers(c);
      setIndustries(i);
    } catch {
      toast.error("Không tải được khách hàng. Kiểm tra đã chạy schema SQL chưa.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      industry_id: "",
      status: "active",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      name: c.name,
      company: c.company ?? "",
      email: c.email ?? "",
      phone: c.phone ?? "",
      address: c.address ?? "",
      industry_id: c.industry_id ?? "",
      status: c.status,
      notes: c.notes ?? "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        company: form.company.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        industry_id: form.industry_id || null,
        status: form.status,
        notes: form.notes.trim() || null,
      };
      if (editing) {
        await updateCustomer(editing.id, payload);
        toast.success("Đã cập nhật khách hàng!");
      } else {
        await createCustomer(payload);
        toast.success("Đã thêm khách hàng mới!");
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (c: Customer) => {
    if (
      !confirm(
        `Xóa khách hàng "${c.name}"? Mọi giao dịch mua gói của khách này cũng sẽ bị xóa.`
      )
    )
      return;
    try {
      await deleteCustomer(c.id);
      toast.success("Đã xóa khách hàng");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không xóa được khách hàng");
    }
  };

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return customers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(t) ||
        (c.company ?? "").toLowerCase().includes(t) ||
        (c.phone ?? "").includes(t) ||
        (c.email ?? "").toLowerCase().includes(t);
      const matchIndustry =
        industryFilter === "all" || c.industry_id === industryFilter;
      return matchSearch && matchIndustry;
    });
  }, [customers, searchTerm, industryFilter]);

  const activeCount = customers.filter((c) => c.status === "active").length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Users className="h-6 w-6" /> Khách hàng
          </h1>
          <p className="text-sm text-muted-foreground">
            {customers.length} khách hàng · {activeCount} đang hoạt động
          </p>
        </div>
        {hasPermission("customers.create" as any) && (
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> Thêm khách hàng
          </Button>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, công ty, SĐT, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={industryFilter} onValueChange={setIndustryFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Ngành hàng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả ngành hàng</SelectItem>
            {industries.map((i) => (
              <SelectItem key={i.id} value={i.id}>
                {i.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Không có khách hàng phù hợp. Bấm &quot;Thêm khách hàng&quot; để bắt đầu.
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">Khách hàng</th>
                <th className="p-3 font-medium">Ngành hàng</th>
                <th className="p-3 font-medium">Liên hệ</th>
                <th className="p-3 font-medium">Trạng thái</th>
                <th className="p-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-3">
                    <p className="font-medium">{c.name}</p>
                    {c.company && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Building2 className="h-3 w-3" /> {c.company}
                      </p>
                    )}
                    {c.notes && (
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {c.notes}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
                    {c.industry ? (
                      <Badge variant="outline">{c.industry.name}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {c.phone && (
                      <p className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </p>
                    )}
                    {c.email && (
                      <p className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {c.email}
                      </p>
                    )}
                    {c.address && (
                      <p className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {c.address}
                      </p>
                    )}
                  </td>
                  <td className="p-3">
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
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      {hasPermission("customers.edit" as any) && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission("customers.delete" as any) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(c)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create/Edit modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Sửa khách hàng" : "Thêm khách hàng mới"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên khách hàng *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: Chị Hoa - Shop Time"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Công ty</Label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
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
                    <SelectItem value="none">Chưa phân loại</SelectItem>
                    {industries.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Số điện thoại</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="0901234567"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="khachhang@email.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Địa chỉ</Label>
              <Input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Yêu cầu đặc biệt, tình hình thanh toán..."
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.status === "active"}
                onCheckedChange={(v) =>
                  setForm({ ...form, status: v ? "active" : "inactive" })
                }
              />
              <Label>Đang hợp tác</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Lưu thay đổi" : "Thêm khách hàng"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
