"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  Receipt,
  Wallet,
  Activity,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import type { Subscription, Customer, Package } from "@/lib/api/business";
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getCustomers,
  getPackages,
} from "@/actions/business-action";
import { formatVnd, formatDateVi } from "@/lib/utils/format";
import { usePermissions } from "@/hooks/use-permissions";

const paymentStatusMeta: Record<
  string,
  { label: string; className: string }
> = {
  paid: {
    label: "Đã thanh toán",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  },
  partial: {
    label: "Thanh toán một phần",
    className: "border-amber-500/20 bg-amber-500/10 text-amber-600",
  },
  unpaid: {
    label: "Chưa thanh toán",
    className: "border-red-500/20 bg-red-500/10 text-red-500",
  },
};

const statusMeta: Record<string, { label: string; className: string }> = {
  active: {
    label: "Đang hiệu lực",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  },
  expired: {
    label: "Hết hạn",
    className: "border-zinc-500/20 bg-zinc-500/10 text-zinc-500",
  },
  cancelled: {
    label: "Đã hủy",
    className: "border-red-500/20 bg-red-500/10 text-red-500",
  },
};

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { hasPermission } = usePermissions();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    package_id: "",
    start_date: new Date().toISOString().slice(0, 10),
    price_paid: "",
    payment_status: "unpaid" as Subscription["payment_status"],
    payment_method: "",
    status: "active" as Subscription["status"],
    notes: "",
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [s, c, p] = await Promise.all([
        getSubscriptions(),
        getCustomers(),
        getPackages(),
      ]);
      setSubs(s);
      setCustomers(c);
      setPackages(p);
    } catch {
      toast.error("Không tải được giao dịch. Kiểm tra đã chạy schema SQL chưa.");
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
      customer_id: "",
      package_id: "",
      start_date: new Date().toISOString().slice(0, 10),
      price_paid: "",
      payment_status: "unpaid",
      payment_method: "",
      status: "active",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEdit = (s: Subscription) => {
    setEditing(s);
    setForm({
      customer_id: s.customer_id,
      package_id: s.package_id,
      start_date: s.start_date ?? new Date().toISOString().slice(0, 10),
      price_paid: String(s.price_paid ?? ""),
      payment_status: s.payment_status,
      payment_method: s.payment_method ?? "",
      status: s.status,
      notes: s.notes ?? "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.customer_id || !form.package_id) {
      toast.error("Vui lòng chọn khách hàng và gói dịch vụ");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editing) {
        await updateSubscription(editing.id, {
          customer_id: form.customer_id,
          package_id: form.package_id,
          start_date: form.start_date,
          price_paid: Number(form.price_paid) || 0,
          payment_status: form.payment_status,
          payment_method: form.payment_method.trim() || null,
          status: form.status,
          notes: form.notes.trim() || null,
        });
        toast.success("Đã cập nhật giao dịch!");
      } else {
        await createSubscription({
          customer_id: form.customer_id,
          package_id: form.package_id,
          start_date: form.start_date,
          price_paid: Number(form.price_paid) || 0,
          payment_status: form.payment_status,
          payment_method: form.payment_method.trim() || null,
          notes: form.notes.trim() || null,
        });
        toast.success("Đã ghi nhận giao dịch mua gói!");
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (s: Subscription) => {
    if (!confirm("Xóa giao dịch này? Hành động không thể hoàn tác.")) return;
    try {
      await deleteSubscription(s.id);
      toast.success("Đã xóa giao dịch");
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không xóa được giao dịch");
    }
  };

  // Thống kê
  const stats = useMemo(() => {
    const totalPaid = subs
      .filter((s) => s.status !== "cancelled")
      .reduce((sum, s) => sum + Number(s.price_paid || 0), 0);
    const activeCount = subs.filter((s) => s.status === "active").length;
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(now.getDate() + 7);
    const expiringSoon = subs.filter((s) => {
      if (s.status !== "active" || !s.end_date) return false;
      const end = new Date(s.end_date);
      return end >= now && end <= in7Days;
    }).length;
    return { totalPaid, activeCount, expiringSoon };
  }, [subs]);

  const filtered = useMemo(() => {
    const t = searchTerm.toLowerCase();
    return subs.filter((s) => {
      const cust = s.customer?.name ?? "";
      const pkg = s.package?.name ?? "";
      return (
        cust.toLowerCase().includes(t) ||
        pkg.toLowerCase().includes(t)
      );
    });
  }, [subs, searchTerm]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Receipt className="h-6 w-6" /> Giao dịch mua gói
          </h1>
          <p className="text-sm text-muted-foreground">
            Ghi nhận và theo dõi khách hàng mua gói dịch vụ
          </p>
        </div>
        {hasPermission("subscriptions.create" as any) && (
          <Button onClick={openCreate} disabled={customers.length === 0 || packages.length === 0}>
            <Plus className="mr-2 h-4 w-4" /> Ghi nhận mua gói
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-lg bg-emerald-500/10 p-3">
            <Wallet className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tổng đã thu</p>
            <p className="text-xl font-bold">{formatVnd(stats.totalPaid)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-lg bg-blue-500/10 p-3">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Đang hiệu lực</p>
            <p className="text-xl font-bold">{stats.activeCount}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-5">
          <div className="rounded-lg bg-amber-500/10 p-3">
            <CalendarClock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sắp hết hạn (7 ngày)</p>
            <p className="text-xl font-bold">{stats.expiringSoon}</p>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Tìm theo khách hàng hoặc gói..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Chưa có giao dịch nào. Thêm khách hàng + gói dịch vụ rồi bấm
          &quot;Ghi nhận mua gói&quot;.
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="p-3 font-medium">Khách hàng</th>
                <th className="p-3 font-medium">Gói</th>
                <th className="p-3 font-medium">Thời hạn</th>
                <th className="p-3 font-medium">Số tiền</th>
                <th className="p-3 font-medium">Thanh toán</th>
                <th className="p-3 font-medium">Trạng thái</th>
                <th className="p-3 text-right font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="p-3">
                    <p className="font-medium">{s.customer?.name ?? s.customer_id}</p>
                    {s.customer?.company && (
                      <p className="text-xs text-muted-foreground">{s.customer.company}</p>
                    )}
                  </td>
                  <td className="p-3">{s.package?.name ?? s.package_id}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {formatDateVi(s.start_date)} → {formatDateVi(s.end_date)}
                  </td>
                  <td className="p-3 font-medium">{formatVnd(s.price_paid)}</td>
                  <td className="p-3">
                    <Badge variant="outline" className={paymentStatusMeta[s.payment_status]?.className}>
                      {paymentStatusMeta[s.payment_status]?.label ?? s.payment_status}
                    </Badge>
                    {s.payment_method && (
                      <p className="mt-1 text-xs text-muted-foreground">{s.payment_method}</p>
                    )}
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className={statusMeta[s.status]?.className}>
                      {statusMeta[s.status]?.label ?? s.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-1">
                      {hasPermission("subscriptions.edit" as any) && (
                        <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission("subscriptions.delete" as any) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s)}
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
            <DialogTitle>{editing ? "Sửa giao dịch" : "Ghi nhận mua gói"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Khách hàng *</Label>
                <Select
                  value={form.customer_id || undefined}
                  onValueChange={(v) => setForm({ ...form, customer_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khách" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.company ? ` (${c.company})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Gói dịch vụ *</Label>
                <Select
                  value={form.package_id || undefined}
                  onValueChange={(v) => {
                    const pkg = packages.find((p) => p.id === v);
                    setForm({
                      ...form,
                      package_id: v,
                      price_paid:
                        form.price_paid || (pkg ? String(pkg.price) : ""),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn gói" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} — {formatVnd(p.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Ngày bắt đầu *</Label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Số tiền thực thu (₫)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.price_paid}
                  onChange={(e) => setForm({ ...form, price_paid: e.target.value })}
                  placeholder="Tự điền theo giá gói"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Trạng thái thanh toán</Label>
                <Select
                  value={form.payment_status}
                  onValueChange={(v) =>
                    setForm({ ...form, payment_status: v as Subscription["payment_status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Chưa thanh toán</SelectItem>
                    <SelectItem value="partial">Thanh toán một phần</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Phương thức</Label>
                <Input
                  value={form.payment_method}
                  onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                  placeholder="Chuyển khoản / Tiền mặt..."
                />
              </div>
            </div>
            {editing && (
              <div className="space-y-1.5">
                <Label>Trạng thái gói</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as Subscription["status"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Đang hiệu lực</SelectItem>
                    <SelectItem value="expired">Hết hạn</SelectItem>
                    <SelectItem value="cancelled">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Ghi chú</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ghi chú về thanh toán, yêu cầu của khách..."
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Ngày kết thúc gói sẽ tự tính theo thời hạn của gói đã chọn.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? "Lưu thay đổi" : "Ghi nhận giao dịch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
