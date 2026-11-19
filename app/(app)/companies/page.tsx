"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Building2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Customer } from "@/lib/api/business";
import { getCustomers } from "@/actions/business-action";
import { formatVnd } from "@/lib/utils/format";
import { formatDateVi } from "@/lib/utils/format";

/**
 * Chọn công ty (admin) → redirect sang workspace /{slug} của công ty.
 * Đây là cổng xem data của từng khách: /apec-global, /shop-time, ...
 */
export default function CompaniesPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setCustomers(await getCustomers());
    } catch {
      toast.error("Không tải được danh sách công ty");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Building2 className="h-6 w-6" /> Công ty
        </h1>
        <p className="text-sm text-muted-foreground">
          Chọn công ty để xem workspace riêng của khách — data tách bạch theo
          từng khách hàng
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : customers.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          Chưa có công ty nào. Thêm ở trang &quot;Khách hàng&quot;.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {customers.map((c) => {
            const viewable = !!c.slug;
            return (
              <Card
                key={c.id}
                className={
                  "group flex flex-col gap-3 p-5 transition-all " +
                  (viewable
                    ? "cursor-pointer hover:border-indigo-300 hover:shadow-md"
                    : "opacity-70")
                }
                onClick={() => {
                  if (!viewable) return;
                  router.push(`/${c.slug}`);
                }}
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
                  {viewable && (
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
